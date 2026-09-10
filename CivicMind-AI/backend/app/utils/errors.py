from flask import jsonify

def error_response(message, details=None, status_code=500, code=None):
    """
    Standardized error response for CivicMind AI backend.
    
    Args:
        message (str): High-level error message.
        details (str|dict): Detailed error information or traceback.
        status_code (int): HTTP status code.
        code (str): Internal error code for frontend mapping.
        
    Returns:
        tuple: (Response object, status code)
    """
    payload = {"error": message}
    if details:
        payload["details"] = details
    if code:
        payload["code"] = code
        
    return jsonify(payload), status_code
