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
    data = request.form

    error = validate_common(data)
    if error:
        return jsonify({"ok": False, "message": error}), 400

    foto = request.files.get("foto")
    carnet_pdf = request.files.get("carnet_pdf")

    if not foto or not foto.filename:
        return jsonify({
            "ok": False,
            "message": "La fotografía del estudiante es obligatoria."
        }), 400

    if not carnet_pdf or not carnet_pdf.filename:
        return jsonify({
            "ok": False,
            "message": "Debes adjuntar el PDF de tu carnet universitario."
        }), 400

    # Validar el tipo declarado y el tamaño de la fotografía.
    tipos_foto = {
        "image/jpeg": "jpeg",
        "image/png": "png",
        "image/webp": "webp",
    }

    if foto.mimetype not in tipos_foto:
        return jsonify({
            "ok": False,
            "message": "La fotografía debe ser JPG, PNG o WEBP."
        }), 400

    foto_bytes = foto.read()

    if not foto_bytes or len(foto_bytes) > 5 * 1024 * 1024:
        return jsonify({
            "ok": False,
            "message": "La fotografía está vacía o supera los 5 MB."
        }), 400

    # Comprobar la firma real de la imagen.
    es_jpeg = foto_bytes.startswith(b"\xff\xd8\xff")
    es_png = foto_bytes.startswith(b"\x89PNG\r\n\x1a\n")
    es_webp = (
        len(foto_bytes) >= 12
        and foto_bytes[:4] == b"RIFF"
        and foto_bytes[8:12] == b"WEBP"
    )

    imagen_valida = (
        (foto.mimetype == "image/jpeg" and es_jpeg)
        or (foto.mimetype == "image/png" and es_png)
        or (foto.mimetype == "image/webp" and es_webp)
    )

    if not imagen_valida:
        return jsonify({
            "ok": False,
            "message": "El contenido de la fotografía no coincide con su formato."
        }), 400

    # Validar el PDF.
    if (
        carnet_pdf.mimetype != "application/pdf"
        or not carnet_pdf.filename.lower().endswith(".pdf")
    ):
        return jsonify({
            "ok": False,
            "message": "El carnet universitario debe ser un archivo PDF."
        }), 400

    pdf_bytes = carnet_pdf.read()

    if (
        not pdf_bytes
        or len(pdf_bytes) > 10 * 1024 * 1024
        or not pdf_bytes.startswith(b"%PDF-")
    ):
        return jsonify({
            "ok": False,
            "message": "El PDF está vacío, no es válido o supera los 10 MB."
        }), 400

    # Limitar el nombre guardado en la base de datos.
    nombre_pdf = os.path.basename(carnet_pdf.filename)[:255]

    conn = None

    try:
        carnet = int(data["carnet"])

        conn = get_connection()
        conn.autocommit = False

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT 1
                FROM tusuario
                WHERE correo = %s OR carnet = %s
                LIMIT 1
                """,
                (data["correo"].strip().lower(), carnet)
            )

            if cur.fetchone():
                conn.rollback()
                return jsonify({
                    "ok": False,
                    "message": "El correo o carnet ya está registrado."
                }), 409

            role_id = get_catalog_id(
                cur, "trol", "id_rol", "Usuario"
            )
            state_id = get_catalog_id(
                cur, "testado_usr", "id_estado_usr", "Pendiente"
            )

            if role_id is None or state_id is None:
                conn.rollback()
                return jsonify({
                    "ok": False,
                    "message": (
                        "No se encontraron los catálogos "
                        "Rol=Usuario o Estado=Pendiente."
                    )
                }), 500

            cur.execute(
                """
                INSERT INTO tusuario (
                    id_rol,
                    nombres,
                    apellidos,
                    carnet,
                    genero,
                    direccion,
                    telefono,
                    fec_nac,
                    foto,
                    carnet_pdf,
                    carnet_pdf_nombre,
                    correo,
                    password,
                    id_estado_usr,
                    sn_activo
                )
                VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, 0
                )
                RETURNING id_usuario
                """,
                (
                    role_id,
                    data["nombres"].strip(),
                    data["apellidos"].strip(),
                    carnet,
                    data["genero"].strip().upper(),
                    data["direccion"].strip(),
                    data.get("telefono", "").strip() or None,
                    data["fec_nac"],
                    foto_bytes,
                    pdf_bytes,
                    nombre_pdf,
                    data["correo"].strip().lower(),
                    generate_password_hash(data["password"]),
                    state_id,
                )
            )

            user_id = cur.fetchone()[0]

        conn.commit()

        return jsonify({
            "ok": True,
            "message": (
                "Solicitud de registro creada correctamente. "
                "Queda pendiente de aprobación."
            ),
            "id_usuario": user_id
        }), 201

    except (ValueError, TypeError):
        if conn:
            conn.rollback()

        return jsonify({
            "ok": False,
            "message": "El carnet debe ser numérico."
        }), 400

    except psycopg2.errors.UniqueViolation:
        if conn:
            conn.rollback()

        return jsonify({
            "ok": False,
            "message": "El correo o carnet ya está registrado."
        }), 409

    except Exception as e: # <-- Agrega el "as e" aquí
        if conn:
            conn.rollback()

        # Esto imprimirá el error real con lujos y detalles en tu terminal de Docker
        import traceback
        traceback.print_exc() 

        # Esto le mandará el error real a tu frontend para que lo leas en la alerta roja
        return jsonify({
            "ok": False,
            "message": f"Error interno: {str(e)}"
        }), 500


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
                 %s, %s, %s, %s, %s,
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
                data["foto"].encode("utf-8"),     # 9
                data["correo"].strip().lower(),   # 10
                generate_password_hash(data["password"]), # 11
                state_id                          # 12
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

