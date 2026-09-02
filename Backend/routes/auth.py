from flask import Blueprint, jsonify, request
from psycopg import Error
from conexion.db import get_connection
from auth import create_token, normalize_role, password_is_valid, decode_token, get_bearer_token

auth_bp = Blueprint("auth", __name__)

USER_SELECT = """
SELECT u.id_usuario, u.nombres, u.apellidos, u.correo, u.password,
       u.id_rol, u.id_estado_usr, u.sn_activo,
       r.txt_desc AS rol, e.txt_desc AS estado
FROM tusuario u
JOIN trol r ON r.id_rol = u.id_rol
JOIN testado_usr e ON e.id_estado_usr = u.id_estado_usr
"""

def public_user(row):
    return {
        "id_usuario": row["id_usuario"],
        "nombres": row["nombres"],
        "apellidos": row["apellidos"],
        "correo": row["correo"],
        "id_rol": row["id_rol"],
        "rol": row["rol"],
        "role": normalize_role(row["rol"]),
        "id_estado_usr": row["id_estado_usr"],
        "estado": row["estado"],
        "sn_activo": row["sn_activo"],
    }

def find_user_by_email(correo):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(USER_SELECT + " WHERE LOWER(u.correo)=LOWER(%s) LIMIT 1", (correo,))
            return cur.fetchone()

def find_user_by_id(user_id):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(USER_SELECT + " WHERE u.id_usuario=%s LIMIT 1", (user_id,))
            return cur.fetchone()

@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    correo = str(data.get("correo", "")).strip()
    password = str(data.get("password", "")).strip()
    print("Datos recibidos en Backend:", data)

    if not correo or not password:
        return jsonify({"ok": False, "message": "Correo y contraseña son obligatorios."}), 400

    try:
        user = find_user_by_email(correo)
        print("¿Usuario encontrado en la Base de Datos?:", user is not None)
        if user:
            print("¿Contraseña coincide?:", password, password_is_valid(password, user["password"]))
    except Error:
        return jsonify({"ok": False, "message": "No fue posible consultar la base de datos."}), 500

    if not user or not password_is_valid(password, user["password"]):
        return jsonify({"ok": False, "message": "Correo o contraseña incorrectos."}), 401

    if user["sn_activo"] != 1:
        return jsonify({"ok": False, "message": f"El usuario está {user['estado'].lower()} y no puede iniciar sesión."}), 403

    role = normalize_role(user["rol"])
    if role is None:
        return jsonify({"ok": False, "message": f"El rol '{user['rol']}' no está configurado."}), 403

    if role == "tutor":
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM ttutor WHERE id_usuario=%s LIMIT 1", (user["id_usuario"],))
                if cur.fetchone() is None:
                    return jsonify({"ok": False, "message": "El usuario tiene rol Tutor, pero no tiene registro en ttutor."}), 403

    user["role"] = role
    return jsonify({"ok": True, "message": "Inicio de sesión exitoso.", "token": create_token(user), "user": public_user(user)})

@auth_bp.get("/me")
def me():
    token = get_bearer_token()
    if not token:
        return jsonify({"ok": False, "message": "Token requerido."}), 401
    try:
        payload = decode_token(token)
        user = find_user_by_id(int(payload["sub"]))
    except Exception:
        return jsonify({"ok": False, "message": "Sesión inválida o expirada."}), 401

    if not user or user["sn_activo"] != 1:
        return jsonify({"ok": False, "message": "El usuario ya no está activo."}), 401

    role = normalize_role(user["rol"])
    if role != payload.get("role"):
        return jsonify({"ok": False, "message": "El rol de la sesión ya no coincide."}), 401

    user["role"] = role
    return jsonify({"ok": True, "user": public_user(user)})
