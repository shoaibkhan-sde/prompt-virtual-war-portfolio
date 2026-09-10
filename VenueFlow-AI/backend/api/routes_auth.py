"""
VenueFlow AI — Authentication & Security Routes
Implements Firebase ID Token verification, Dual-Layer RBAC, 
and forced session expiry.
"""

import datetime
from functools import wraps
from flask import Blueprint, request, jsonify
from firebase_admin import auth as firebase_auth
from config import Config
from extensions import limiter

auth_bp = Blueprint("auth", __name__)

def token_required(f):
    """
    Unified Token Verification & RBAC.
    - Decodes Firebase ID Token
    - Enforces 60-min TTL (Forced Expiry)
    - Implements Dual-Layer RBAC (Claims + Demo Email)
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"error": "Token is missing!"}), 401
        
        try:
            if token.startswith("Bearer "):
                token = token.split(" ")[1]
            
            # 1. Verify Firebase ID Token (The standard)
            decoded_token = firebase_auth.verify_id_token(token)
            
            # 2. Enforce Forced Session Expiry (Expert Requirement)
            # Firebase tokens last 1hr, but we can enforce a stricter window if needed
            issued_at = decoded_token.get("iat", 0)
            now = datetime.datetime.utcnow().timestamp()
            if (now - issued_at) > (Config.ACCESS_TOKEN_EXPIRY_MINUTES * 60):
                return jsonify({"error": "Session expired (Forced Expiry)"}), 401
            
            # 3. RBAC Resolution
            is_admin = decoded_token.get("admin", False)
            email = decoded_token.get("email")
            
            # Fallback path for Demo Reliability
            if email == Config.DEMO_ADMIN_EMAIL:
                is_admin = True
                
            current_user = {
                "uid": decoded_token["uid"],
                "email": email,
                "name": decoded_token.get("name"),
                "is_admin": is_admin
            }
        except Exception as e:
            return jsonify({"error": f"Security verification failed: {str(e)}"}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if not current_user.get("is_admin"):
            # Log this failed attempt in security audit
            print(f"[SECURITY] Unauthorized admin access attempt by {current_user.get('email')}")
            return jsonify({"error": "Admin access required"}), 403
        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route("/api/auth/verify", methods=["GET"])
@token_required
def verify_session(current_user):
    """Simple endpoint to verify the current session is valid."""
    return jsonify({"status": "verified", "user": current_user}), 200

@auth_bp.route("/api/auth/demo-login", methods=["POST"])
@limiter.limit("3 per minute")  # Strict rate limit for demo proof
def demo_login():
    """
    Endpoint for demonstrating rate limiting.
    In production, Firebase handles login client-side.
    """
    return jsonify({"message": "Please use Firebase Client SDK for primary auth. This endpoint exists for rate-limit testing."}), 200
