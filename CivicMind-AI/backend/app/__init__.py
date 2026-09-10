import os
from flask import Flask, request, send_from_directory, jsonify
from config import config_by_name
from .extensions import limiter, talisman, cors, init_firebase
from .utils.errors import error_response
import logging
from werkzeug.middleware.proxy_fix import ProxyFix

logger = logging.getLogger(__name__)

def create_app(config_name="development"):
    app = Flask(__name__, static_folder='../../dist', static_url_path='/')
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
    app.config.from_object(config_by_name[config_name])
    
    # Initialize Extensions
    init_firebase()
    
    # Strict CORS
    cors.init_app(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "https://civicmind-ai.web.app"]}})
    
    # Configure Limiter

    limiter.init_app(app)
    
    # Configure Talisman (Security Headers)
    is_dev = config_name == "development"
    csp = {
        "default-src": "'self'",
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.googletagmanager.com", "https://apis.google.com", "https://*.firebaseio.com"],
        "connect-src": [
            "'self'", 
            "https://*.googleapis.com", 
            "https://*.firebaseio.com", 
            "https://*.run.app",
            "https://civicmind-ai-651952507170.us-central1.run.app"
        ],
        "frame-src": ["'self'", "https://civicmind-ai-494416.firebaseapp.com", "https://apis.google.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "img-src": ["'self'", "data:", "https://*.googleusercontent.com"],
        "frame-ancestors": "'none'",
    }
    talisman.init_app(
        app,
        content_security_policy=csp if not is_dev else False,
        force_https=not is_dev,
        frame_options="DENY",
        referrer_policy="no-referrer",
        x_content_type_options=True,
        strict_transport_security=True,
        strict_transport_security_max_age=31536000 # 1 year
    )

    @app.before_request
    def add_trace_id():
        import uuid
        from flask import g
        g.trace_id = str(uuid.uuid4())
        logger.info(f"Request started", extra={"trace_id": g.trace_id, "path": request.path})

    @app.after_request
    def add_trace_header(response):
        from flask import g
        if hasattr(g, 'trace_id'):
            response.headers["X-Trace-ID"] = g.trace_id
        # Required for Firebase/Google Sign-in popups
        response.headers['Cross-Origin-Opener-Policy'] = 'same-origin-allow-popups'
        return response

    
    # Register Blueprints
    from .routes.chat import chat_bp
    from .routes.quiz import quiz_bp
    from .routes.analytics import analytics_bp
    from .routes.simulation import simulation_bp
    
    app.register_blueprint(chat_bp, url_prefix="/api/chat")
    app.register_blueprint(quiz_bp, url_prefix="/api/quiz")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(simulation_bp, url_prefix="/api/simulate")
    
    # Global Error Handlers (Middleware-based)
    from .middleware.error_handler import register_error_handlers
    register_error_handlers(app)
    
    # SPA Fallback for non-API 404s
    @app.errorhandler(404)
    def handle_404(e):
        if request.path.startswith('/api/'):
            return jsonify({"error": "Not Found", "success": False, "code": "NOT_FOUND"}), 404
            
        import os
        if not os.path.exists(os.path.join(app.static_folder, 'index.html')):
            # Fallback for testing environments when frontend is not built
            return "<!doctype html><html><body>Fallback</body></html>", 200
            
        response = send_from_directory(app.static_folder, 'index.html')
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        return response

    
    @app.route("/api/health")
    def health_check():
        return {"status": "ok"}, 200

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        if path != "" and os.path.exists(app.static_folder + '/' + path):
            return send_from_directory(app.static_folder, path)
        else:
            response = send_from_directory(app.static_folder, 'index.html')
            response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
            return response
        
    return app
