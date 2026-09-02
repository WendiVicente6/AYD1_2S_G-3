from datetime import datetime, timedelta, timezone
import jwt
from flask import current_app, request
from werkzeug.security import check_password_hash


ROLE_MAP = {
    "admin": "admin",
    "usuario": "student",
    "estudiante": "student",
    "student": "student",
    "tutor": "tutor",
}

def normalize_role(role_text):
    if not role_text:
        return None
    return ROLE_MAP.get(role_text.strip().lower())

def create_token(user):
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user["id_usuario"]),
        "role": user["role"],
        "iat": now,
        "exp": now + timedelta(minutes=current_app.config["JWT_EXPIRES_MINUTES"]),
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET_KEY"], algorithm="HS256")

def get_bearer_token():
    header = request.headers.get("Authorization", "")
    return header.split(" ", 1)[1].strip() if header.startswith("Bearer ") else None

def decode_token(token):
    return jwt.decode(token, current_app.config["JWT_SECRET_KEY"], algorithms=["HS256"])

def password_is_valid(password, stored_password):
    if not stored_password:
        return False
    
    stored_password = stored_password.strip() 
    password = password.strip()

    try:
        if check_password_hash(stored_password, password):
            return True
    except (ValueError, TypeError):
        pass 
    return password == stored_password
