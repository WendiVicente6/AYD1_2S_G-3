import re
from datetime import datetime
from flask import Blueprint, jsonify, request
from psycopg import Error
from werkzeug.security import generate_password_hash
from conexion.db import get_connection
from auth import decode_token, get_bearer_token

tutor_sessions_bp = Blueprint("tutors", __name__)

PASSWORD_RE = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$")


@tutor_sessions_bp.get("/tutor/historial")
def get_tutor_sessions_history():
    id_tutor, error_response = _autenticar_tutor()
    if error_response:
        return error_response

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                        ts.id_sesion,
                        ts.fec_sesion,
                        ts.hora_inicio,
                        ts.hora_final,
                        (tu.nombres || ' ' || tu.apellidos) AS estudiante,
                        tes.txt_desc AS estado,
                        ts.motivo_cancelacion AS motivo,
                        CASE
                            WHEN ts.id_usuario_cancelacion = ts.id_tutor THEN 'Tutor'
                            WHEN ts.id_usuario_cancelacion = ts.id_estudiante THEN 'Estudiante'
                            ELSE NULL
                        END AS cancelado_por
                    FROM tsesion ts
                    INNER JOIN testado_sesion tes
                        ON ts.id_estado_sesion = tes.id_estado_sesion
                    INNER JOIN tusuario tu
                        ON tu.id_usuario = ts.id_estudiante
                    WHERE ts.id_tutor = %s
                    ORDER BY ts.fec_sesion DESC, ts.hora_inicio DESC
                    """,
                    (id_tutor,),
                )
                rows = cur.fetchall()

        sesiones = [
            {
                "id_sesion": row["id_sesion"],
                "fecha": row["fec_sesion"].strftime("%Y-%m-%d"),
                "hora": f"{row['hora_inicio'].strftime('%H:%M')} - {row['hora_final'].strftime('%H:%M')}",
                "estudiante": row["estudiante"],
                "estado": row["estado"],
                "motivo": row["motivo"],
                "cancelado_por": row["cancelado_por"],
            }
            for row in rows
        ]

        return jsonify({"ok": True, "sesiones": sesiones}), 200

    except Error as e:
        return jsonify({"ok": False, "message": str(e)}), 500


@tutor_sessions_bp.get("/tutor/dashboard")
def get_tutor_dashboard():
    id_tutor, error_response = _autenticar_tutor()
    if error_response:
        return error_response

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT COUNT(*) AS total
                    FROM tsesion s
                    JOIN testado_sesion es ON es.id_estado_sesion = s.id_estado_sesion
                    WHERE s.id_tutor = %s
                      AND es.txt_desc IN ('Pendiente', 'Confirmada')
                    """,
                    (id_tutor,),
                )
                sesiones_pendientes = cur.fetchone()["total"]

                cur.execute(
                    """
                    SELECT COUNT(DISTINCT s.id_estudiante) AS total
                    FROM tsesion s
                    JOIN testado_sesion es ON es.id_estado_sesion = s.id_estado_sesion
                    WHERE s.id_tutor = %s
                      AND es.txt_desc = 'Completada'
                    """,
                    (id_tutor,),
                )
                estudiantes_atendidos = cur.fetchone()["total"]

        return jsonify({
            "ok": True,
            "stats": {
                "sesiones_pendientes": sesiones_pendientes,
                "estudiantes_atendidos": estudiantes_atendidos,
            },
        }), 200

    except Error as e:
        return jsonify({"ok": False, "message": str(e)}), 500


def _autenticar_tutor():
    """Valida el token y devuelve (id_tutor, None) o (None, (response, status))."""
    token = get_bearer_token()
    if not token:
        return None, (jsonify({"ok": False, "message": "Token no proporcionado"}), 401)

    try:
        decoded_token = decode_token(token)
    except Exception:
        return None, (jsonify({"ok": False, "message": "Token inválido o expirado."}), 401)

    if decoded_token.get("role") != "tutor":
        return None, (jsonify({"ok": False, "message": "Acceso denegado"}), 403)

    return int(decoded_token["sub"]), None


@tutor_sessions_bp.get("/tutor/perfil")
def get_tutor_perfil():
    id_tutor, error_response = _autenticar_tutor()
    if error_response:
        return error_response

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                        u.nombres, u.apellidos, u.carnet, u.genero, u.direccion,
                        u.telefono, u.fec_nac, u.foto, u.correo,
                        t.nro_id, t.dir_tutoria, t.anio_inicio_tutoria, t.u_graduacion
                    FROM tusuario u
                    JOIN ttutor t ON t.id_usuario = u.id_usuario
                    WHERE u.id_usuario = %s
                    """,
                    (id_tutor,),
                )
                row = cur.fetchone()

                if row is None:
                    return jsonify({"ok": False, "message": "Tutor no encontrado."}), 404

                cur.execute(
                    """
                    SELECT tm.id_materia, m.nombre
                    FROM ttutor_materia tm
                    JOIN tmateria m ON m.id_materia = tm.id_materia
                    WHERE tm.id_tutor = %s
                    ORDER BY m.nombre
                    """,
                    (id_tutor,),
                )
                materias = cur.fetchall()

        foto = bytes(row["foto"]).decode("utf-8") if row["foto"] else None

        perfil = {
            "nombres": row["nombres"],
            "apellidos": row["apellidos"],
            "carnet": row["carnet"],
            "genero": row["genero"],
            "direccion": row["direccion"],
            "telefono": row["telefono"],
            "fec_nac": row["fec_nac"].strftime("%Y-%m-%d"),
            "foto": foto,
            "correo": row["correo"],
            "nro_id": row["nro_id"],
            "dir_tutoria": row["dir_tutoria"],
            "anio_inicio_tutoria": row["anio_inicio_tutoria"].strftime("%Y-%m-%d"),
            "u_graduacion": row["u_graduacion"],
            "materias": [
                {"id_materia": m["id_materia"], "nombre": m["nombre"]}
                for m in materias
            ],
        }

        return jsonify({"ok": True, "perfil": perfil}), 200

    except Error as e:
        return jsonify({"ok": False, "message": str(e)}), 500


@tutor_sessions_bp.put("/tutor/perfil")
def update_tutor_perfil():
    id_tutor, error_response = _autenticar_tutor()
    if error_response:
        return error_response

    body = request.get_json(silent=True) or {}

    required = [
        "nombres", "apellidos", "carnet", "genero", "direccion", "fec_nac",
        "nro_id", "dir_tutoria", "anio_inicio_tutoria", "u_graduacion",
    ]
    missing = [f for f in required if not str(body.get(f, "")).strip()]
    if missing:
        return jsonify({"ok": False, "message": f"Faltan campos obligatorios: {', '.join(missing)}"}), 400

    try:
        carnet = int(body["carnet"])
        nro_id = int(body["nro_id"])
    except (TypeError, ValueError):
        return jsonify({"ok": False, "message": "Carnet y número de identificación deben ser numéricos."}), 400

    try:
        datetime.strptime(body["fec_nac"], "%Y-%m-%d")
        datetime.strptime(body["anio_inicio_tutoria"], "%Y-%m-%d")
    except (TypeError, ValueError):
        return jsonify({"ok": False, "message": "Alguna de las fechas no es válida."}), 400

    materias = body.get("materias", [])
    if not isinstance(materias, list):
        return jsonify({"ok": False, "message": "materias debe ser una lista."}), 400

    password = (body.get("password") or "").strip()
    if password and not PASSWORD_RE.match(password):
        return jsonify({
            "ok": False,
            "message": "La contraseña debe tener mínimo 8 caracteres, una minúscula, una mayúscula y un número."
        }), 400

    foto_data_uri = (body.get("foto") or "").strip() or None

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT foto FROM tusuario WHERE id_usuario = %s", (id_tutor,))
                actual = cur.fetchone()
                if actual is None:
                    return jsonify({"ok": False, "message": "Tutor no encontrado."}), 404

                if not foto_data_uri and not actual["foto"]:
                    return jsonify({"ok": False, "message": "La fotografía es obligatoria."}), 400

                cur.execute(
                    "SELECT 1 FROM tusuario WHERE carnet = %s AND id_usuario <> %s",
                    (carnet, id_tutor),
                )
                if cur.fetchone():
                    return jsonify({"ok": False, "message": "El carnet ya está en uso por otro usuario."}), 409

                cur.execute(
                    "SELECT 1 FROM ttutor WHERE nro_id = %s AND id_usuario <> %s",
                    (nro_id, id_tutor),
                )
                if cur.fetchone():
                    return jsonify({"ok": False, "message": "El número de identificación ya está en uso por otro tutor."}), 409

                datos_usuario = [
                    body["nombres"].strip(),
                    body["apellidos"].strip(),
                    carnet,
                    body["genero"].strip().upper(),
                    body["direccion"].strip(),
                    (body.get("telefono") or "").strip() or None,
                    body["fec_nac"],
                ]

                if foto_data_uri:
                    cur.execute(
                        """
                        UPDATE tusuario
                        SET nombres = %s, apellidos = %s, carnet = %s, genero = %s,
                            direccion = %s, telefono = %s, fec_nac = %s, foto = %s
                        WHERE id_usuario = %s
                        """,
                        (*datos_usuario, foto_data_uri.encode("utf-8"), id_tutor),
                    )
                else:
                    cur.execute(
                        """
                        UPDATE tusuario
                        SET nombres = %s, apellidos = %s, carnet = %s, genero = %s,
                            direccion = %s, telefono = %s, fec_nac = %s
                        WHERE id_usuario = %s
                        """,
                        (*datos_usuario, id_tutor),
                    )

                if password:
                    cur.execute(
                        "UPDATE tusuario SET password = %s WHERE id_usuario = %s",
                        (generate_password_hash(password), id_tutor),
                    )

                cur.execute(
                    """
                    UPDATE ttutor
                    SET nro_id = %s, dir_tutoria = %s, anio_inicio_tutoria = %s, u_graduacion = %s
                    WHERE id_usuario = %s
                    """,
                    (nro_id, body["dir_tutoria"].strip(), body["anio_inicio_tutoria"], body["u_graduacion"].strip(), id_tutor),
                )

                cur.execute("SELECT id_materia FROM ttutor_materia WHERE id_tutor = %s", (id_tutor,))
                actuales = {row["id_materia"] for row in cur.fetchall()}
                deseadas = {int(m) for m in materias if str(m).isdigit()}

                a_insertar = deseadas - actuales
                a_quitar = actuales - deseadas
                no_removibles = []

                for id_materia in a_quitar:
                    cur.execute(
                        "SELECT 1 FROM tsesion WHERE id_tutor = %s AND id_materia = %s LIMIT 1",
                        (id_tutor, id_materia),
                    )
                    if cur.fetchone():
                        # No se puede quitar: hay sesiones (activas o históricas) con esa materia.
                        no_removibles.append(id_materia)
                    else:
                        cur.execute(
                            "DELETE FROM ttutor_materia WHERE id_tutor = %s AND id_materia = %s",
                            (id_tutor, id_materia),
                        )

                for id_materia in a_insertar:
                    cur.execute(
                        """
                        INSERT INTO ttutor_materia (id_tutor, id_materia)
                        VALUES (%s, %s)
                        ON CONFLICT DO NOTHING
                        """,
                        (id_tutor, id_materia),
                    )

                mensaje = "Perfil actualizado correctamente."
                if no_removibles:
                    cur.execute(
                        "SELECT nombre FROM tmateria WHERE id_materia = ANY(%s)",
                        (list(no_removibles),),
                    )
                    nombres = [r["nombre"] for r in cur.fetchall()]
                    mensaje += (
                        " No se pudieron quitar estas materias porque ya tienes sesiones registradas con ellas: "
                        + ", ".join(nombres) + "."
                    )
            conn.commit()

        return jsonify({"ok": True, "message": mensaje}), 200

    except Error as e:
        return jsonify({"ok": False, "message": str(e)}), 500
