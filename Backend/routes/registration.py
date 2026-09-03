import os
import re
from datetime import datetime
from flask import Blueprint, request, jsonify
import psycopg2
from werkzeug.security import generate_password_hash

registration_bp = Blueprint("registration", __name__, url_prefix="/api")

PASSWORD_RE = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$")


def get_connection():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL no está configurada.")
    return psycopg2.connect(database_url)


def validate_common(data):
    required = [
        "nombres", "apellidos", "carnet", "genero", "direccion",
        "fec_nac", "correo", "password"
    ]
    missing = [field for field in required if not str(data.get(field, "")).strip()]
    if missing:
        return f"Faltan campos obligatorios: {', '.join(missing)}"

    if not PASSWORD_RE.match(data["password"]):
        return "La contraseña debe tener mínimo 8 caracteres, una minúscula, una mayúscula y un número."

    try:
        int(data["carnet"])
    except (TypeError, ValueError):
        return "El carnet/ID debe ser numérico."

    try:
        datetime.strptime(data["fec_nac"], "%Y-%m-%d")
    except (TypeError, ValueError):
        return "La fecha de nacimiento no es válida."

    return None


def get_catalog_id(cur, table, id_column, description):
    cur.execute(
        f"SELECT {id_column} FROM {table} WHERE LOWER(txt_desc) = LOWER(%s) LIMIT 1",
        (description,)
    )
    row = cur.fetchone()
    return row[0] if row else None


@registration_bp.post("/students")
def register_student():
    data = request.get_json(silent=True) or {}
    error = validate_common(data)
    if error:
        return jsonify({"ok": False, "message": error}), 400

    conn = None
    try:
        conn = get_connection()
        conn.autocommit = False
        cur = conn.cursor()

        cur.execute(
            "SELECT 1 FROM tusuario WHERE correo = %s OR carnet = %s LIMIT 1",
            (data["correo"].strip(), int(data["carnet"]))
        )
        if cur.fetchone():
            return jsonify({
                "ok": False,
                "message": "El correo o carnet ya está registrado."
            }), 409

        role_id = get_catalog_id(cur, "trol", "id_rol", "Usuario")
        state_id = get_catalog_id(cur, "testado_usr", "id_estado_usr", "Pendiente")

        if role_id is None or state_id is None:
            return jsonify({
                "ok": False,
                "message": "No se encontraron los catálogos Rol=Usuario o Estado=Pendiente."
            }), 500

        foto = data.get("foto")
        foto_bytes = None
        if foto:
            # El frontend puede enviar una cadena/base64 en una futura ampliación.
            # Para esta HU se deja NULL si no se implementa carga binaria.
            foto_bytes = None

        cur.execute(
            """
            INSERT INTO tusuario
                (id_rol, nombres, apellidos, carnet, genero, direccion,
                 telefono, fec_nac, foto, correo, password,
                 id_estado_usr, sn_activo)
            VALUES
                (%s, %s, %s, %s, %s, %s,
                 %s, %s, %s, %s, %s,
                 %s, 0)
            RETURNING id_usuario
            """,
            (
                role_id,
                data["nombres"].strip(),
                data["apellidos"].strip(),
                int(data["carnet"]),
                data["genero"].strip().upper(),
                data["direccion"].strip(),
                data.get("telefono", "").strip() or None,
                data["fec_nac"],
                foto_bytes,
                data["correo"].strip().lower(),
                generate_password_hash(data["password"]),
                state_id,
            )
        )
        user_id = cur.fetchone()[0]
        conn.commit()

        return jsonify({
            "ok": True,
            "message": "Solicitud de registro de estudiante creada correctamente. Queda pendiente de aprobación.",
            "id_usuario": user_id
        }), 201

    except psycopg2.errors.UniqueViolation:
        if conn:
            conn.rollback()
        return jsonify({"ok": False, "message": "El correo o carnet ya está registrado."}), 409
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"ok": False, "message": f"No fue posible registrar el estudiante: {exc}"}), 500
    finally:
        if conn:
            conn.close()


@registration_bp.post("/tutors")
def register_tutor():
    data = request.get_json(silent=True) or {}
    error = validate_common(data)
    if error:
        return jsonify({"ok": False, "message": error}), 400

    tutor_required = ["nro_id", "dir_tutoria", "anio_inicio_tutoria", "u_graduacion"]
    missing = [f for f in tutor_required if not str(data.get(f, "")).strip()]
    if missing:
        return jsonify({
            "ok": False,
            "message": f"Faltan campos obligatorios del tutor: {', '.join(missing)}"
        }), 400

    try:
        nro_id = int(data["nro_id"])
        datetime.strptime(data["anio_inicio_tutoria"], "%Y-%m-%d")
    except (TypeError, ValueError):
        return jsonify({
            "ok": False,
            "message": "El número de identificación debe ser numérico y la fecha de inicio válida."
        }), 400

    materias = data.get("materias", [])
    if not isinstance(materias, list):
        return jsonify({"ok": False, "message": "materias debe ser una lista."}), 400

    conn = None
    try:
        conn = get_connection()
        conn.autocommit = False
        cur = conn.cursor()

        cur.execute(
            "SELECT 1 FROM tusuario WHERE correo = %s OR carnet = %s LIMIT 1",
            (data["correo"].strip(), int(data["carnet"]))
        )
        if cur.fetchone():
            return jsonify({
                "ok": False,
                "message": "El correo o carnet ya está registrado."
            }), 409

        cur.execute(
            "SELECT 1 FROM ttutor WHERE nro_id = %s LIMIT 1",
            (nro_id,)
        )
        if cur.fetchone():
            return jsonify({
                "ok": False,
                "message": "El número de identificación del tutor ya está registrado."
            }), 409

        role_id = get_catalog_id(cur, "trol", "id_rol", "Tutor")
        state_id = get_catalog_id(cur, "testado_usr", "id_estado_usr", "Pendiente")

        if role_id is None or state_id is None:
            return jsonify({
                "ok": False,
                "message": "No se encontraron los catálogos Rol=Tutor o Estado=Pendiente."
            }), 500

        if not data.get("foto"):
            return jsonify({
                "ok": False,
                "message": "La fotografía del tutor es obligatoria."
            }), 400

        cur.execute(
            """
            INSERT INTO tusuario
                (id_rol, nombres, apellidos, carnet, genero, direccion,
                 telefono, fec_nac, foto, correo, password,
                 id_estado_usr, sn_activo)
            VALUES
                (%s, %s, %s, %s, %s, %s,
                 %s, %s, NULL, %s, %s,
                 %s, 0)
            RETURNING id_usuario
            """,
            (
                role_id,                          # 1
                data["nombres"].strip(),          # 2
                data["apellidos"].strip(),        # 3
                int(data["carnet"]),              # 4
                data["genero"].strip().upper(),   # 5
                data["direccion"].strip(),        # 6
                data.get("telefono", "").strip() or None, # 7
                data["fec_nac"],                  # 8
                data["correo"].strip().lower(),   # 9
                generate_password_hash(data["password"]), # 10
                state_id                          # 11
            )
        )
        user_id = cur.fetchone()[0]

        # Si ttutor tiene id_usuario como Primary Key, esto está bien:
        cur.execute(
            """
            INSERT INTO ttutor
                (id_usuario, nro_id, dir_tutoria, anio_inicio_tutoria, u_graduacion)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                user_id,
                nro_id,
                data["dir_tutoria"].strip(),
                data["anio_inicio_tutoria"],
                data["u_graduacion"].strip(),
            )
        )
        for materia in materias:
            if str(materia).isdigit():
                cur.execute(
                    """
                    INSERT INTO ttutor_materia (id_tutor, id_materia)
                    VALUES (%s, %s)
                    ON CONFLICT DO NOTHING
                    """,
                    (user_id, int(materia)) # <-- OJO: Verifica si aquí va user_id o el id generado en ttutor
                )

        conn.commit()

        return jsonify({
            "ok": True,
            "message": "Solicitud de registro de tutor creada correctamente. Queda pendiente de aprobación.",
            "id_usuario": user_id
        }), 201

    except psycopg2.errors.UniqueViolation:
        if conn:
            conn.rollback()
        return jsonify({"ok": False, "message": "El correo, carnet o número de identificación ya está registrado."}), 409
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"ok": False, "message": f"No fue posible registrar el tutor: {exc}"}), 500
    finally:
        if conn:
            conn.close()

