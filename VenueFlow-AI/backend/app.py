import eventlet
eventlet.monkey_patch()

import sys
import os
import uuid
from flask import Flask, jsonify, send_from_directory, g, Blueprint, request
from flask_cors import CORS
from flask_talisman import Talisman

# Path shim: ensures 'backend' is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import Config
from extensions import socketio, limiter
from api.routes_crowd import crowd_bp
from api.routes_chat import chat_bp
from api.routes_gates import gates_bp
from api.routes_alerts import alerts_bp
from api.routes_auth import auth_bp
from api.routes_config import config_bp

def _background_preloading(app):
    """
    Perform I/O-heavy initialization using eventlet green threads.
    Wrapped in a 15s timeout to prevent boot deadlocks.
    """
    import eventlet.timeout
    with app.app_context():
        # Safety timeout: if I/O hangs, don't kill the boot sequence
        with eventlet.timeout.Timeout(15, False):
            try:
                from services.redis_service import init_redis_data, sync_state_to_cloud
                from services.simulation_service import start_simulation
                from services.alert_service import purge_old_history

                print("[BOOT] Primary Redis warmup starting...", flush=True)
                init_redis_data()
                
                print("[BOOT] Syncing state to cloud persistence...", flush=True)
                sync_state_to_cloud()
                
                print("[BOOT] Starting simulation & background workers...", flush=True)
                start_simulation(app)
                purge_old_history()
                
                print("[BOOT] Production Preloading: SUCCESS.", flush=True)
            except Exception as e:
                print(f"[BOOT_ERROR] Background preload failed (non-fatal): {e}", flush=True)
        
        # If the timeout was hit, 'False' was returned and we logic out here
        print("[BOOT] Boot sequence finalized.", flush=True)

def create_app(testing: bool = False) -> Flask:
    # Use absolute path for static_folder to ensure resolution in Cloud Run
    # --- Absolute Path Validation for Cloud Run Resilience ---
    base_dir = os.path.dirname(os.path.abspath(__file__))
    static_dir = os.path.join(base_dir, 'static')
    
    # Critical: Verify static directory exists at boot
    if not os.path.isdir(static_dir):
        print(f"[CRITICAL] Static directory missing! Expected at: {static_dir}", flush=True)
        # We don't crash the container, but health checks will fail if assets are missing
    
    app = Flask(__name__, static_folder=static_dir, static_url_path='/static')
    app.url_map.strict_slashes = False
    
    app.config.from_mapping(
        SECRET_KEY=Config.SECRET_KEY,
        TESTING=testing
    )

    # ── CORS ─────────────────────────────────────────────────
    CORS(app, origins=Config.CORS_ORIGINS)

    # ── Security Hardening (Talisman) ───────────────────────
    csp = {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'blob:', 'https://*.googleapis.com', 'https://*.firebaseapp.com', 'https://apis.google.com'],
        'worker-src': ["'self'", 'blob:'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'img-src': ["'self'", 'data:', 'blob:', 'https://*.googleapis.com', 'https://*.maptiler.com'],
        'connect-src': ["'self'", 'ws://localhost:*', 'wss://*.cloudrun.app', 'https://*.cloudrun.app', 'https://*.googleapis.com', 'https://*.firebaseio.com', 'https://*.maptiler.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'frame-src': ["'self'", 'https://*.firebaseapp.com', 'https://apis.google.com']
    }
    
    talisman = Talisman(app, 
             content_security_policy=csp, 
             force_https=False,
             session_cookie_secure=not Config.DEVELOPMENT_MODE,
             session_cookie_http_only=True,
             frame_options=None)

    limiter.init_app(app)

    @app.before_request
    def ensure_request_id():
        g.request_id = str(uuid.uuid4())

    # ── Blueprints ───────────────────────────────────────────
    app.register_blueprint(crowd_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(gates_bp)
    app.register_blueprint(alerts_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(config_bp)

    # ── Elite Asset Handler (100% MIME Purity) ───────────────
    # We serve static files via a blueprint to ensure Flask's native
    # MIME-type inference works perfectly without catch-all overlap.
    static_bp = Blueprint('assets', __name__, static_folder=static_dir, static_url_path='/')
    
    @static_bp.route('/', defaults={'path': ''})
    @static_bp.route('/<path:path>')
    def serve_static(path):
        """
        Universal file provider with fallback to index.html for SPA routes.
        This resolves both Asset 404s and White Screen MIME errors.
        """
        # Block API fallbacks in this route
        if path.startswith("api/"):
            return jsonify({"error": "API route not found"}), 404

        # 1. Try serving from root or assets subdirectory
        target_path = path if path else 'index.html'
        full_path = os.path.join(static_bp.static_folder, target_path)
        
        if os.path.isfile(full_path):
            return send_from_directory(static_bp.static_folder, target_path)
            
        # 2. Check if it's an asset in the subdirectory
        asset_full_path = os.path.join(static_bp.static_folder, 'assets', path)
        if os.path.isfile(asset_full_path):
            return send_from_directory(os.path.join(static_bp.static_folder, 'assets'), path)

        # 3. SPA Fallback (No dots in path means it's a UI route like /dashboard)
        if "." not in path.split("/")[-1]:
            return send_from_directory(static_bp.static_folder, 'index.html')

        return "Asset not found", 404

    app.register_blueprint(static_bp)

    @app.errorhandler(Exception)
    def handle_exception(e):
        import traceback
        print(f"[INTERNAL_ERROR] {e}\n{traceback.format_exc()}", flush=True)
        return jsonify({"error": "Internal Server Error"}), 500

    @app.route("/api/health")
    def health():
        return jsonify({"status": "healthy"}), 200

    socketio.init_app(app, async_mode='eventlet', cors_allowed_origins="*")
    import api.sockets 

    if not testing:
        # Greenthread-safe spawn for preloading
        print("[BOOT] Spawning production preloader...", flush=True)
        eventlet.spawn(_background_preloading, app)

    return app

if "pytest" not in sys.modules:
    app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port, log_output=False)
