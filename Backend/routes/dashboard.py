from flask import Blueprint, jsonify
from auth import decode_token, get_bearer_token

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.get("/dashboard/<role>")
def dashboard(role):
    token = get_bearer_token()
    if not token:
        return jsonify({"ok": False, "message": "Token requerido."}), 401
    try:
        payload = decode_token(token)
    except Exception:
        return jsonify({"ok": False, "message": "Sesión inválida o expirada."}), 401
    if payload.get("role") != role:
        return jsonify({"ok": False, "message": "No tienes permisos para este dashboard."}), 403

    messages = {
        "admin": "Dashboard inicial del administrador.",
        "student": "Dashboard inicial del estudiante.",
        "tutor": "Dashboard inicial del tutor.",
    }
    if role not in messages:
        return jsonify({"ok": False, "message": "Rol no soportado."}), 404
    return jsonify({"ok": True, "role": role, "message": messages[role]})
