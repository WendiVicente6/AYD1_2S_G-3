from flask import Blueprint, jsonify, request
from psycopg import Error
from conexion.db import get_connection
from auth import decode_token, get_bearer_token
from datetime import datetime

sessions_bp = Blueprint("sessions", __name__)

@sessions_bp.get("/materias")
def listar_materias():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id_materia, nombre, txt_desc FROM tmateria ORDER BY nombre")
                materias = cur.fetchall()
        return jsonify({"ok": True, "materias": materias})
    except Error:
        return jsonify({"ok": False, "message": "No fue posible consultar las materias."}), 500

@sessions_bp.get("/tutores")
def listar_tutores():
    id_materia = request.args.get("id_materia")
    if not id_materia:
        return jsonify({"ok": False, "message": "Debes indicar id_materia."}), 400

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT 
                        t.id_usuario AS id_tutor,
                        u.nombres,
                        u.apellidos,
                        t.dir_tutoria,
                        t.anio_inicio_tutoria
                    FROM ttutor_materia tm
                    JOIN ttutor t ON t.id_usuario = tm.id_tutor
                    JOIN tusuario u ON u.id_usuario = t.id_usuario
                    WHERE tm.id_materia = %s
                    ORDER BY u.nombres
                    """,
                    (id_materia,),
                )
                tutores = cur.fetchall()
        return jsonify({"ok": True, "tutores": tutores})
    except Error:
        return jsonify({"ok": False, "message": "No fue posible consultar los tutores."}), 500


@sessions_bp.get("/tutores/<int:id_tutor>/disponibilidad")
def disponibilidad_tutor(id_tutor):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT 
                        ha.id_horario,
                        ha.hora_inicio,
                        ha.hora_fin,
                        hd.dia_semana
                    FROM thorario_atencion ha
                    JOIN thorario_dia hd ON hd.id_horario = ha.id_horario
                    WHERE ha.id_tutor = %s
                    ORDER BY hd.dia_semana, ha.hora_inicio
                    """,
                    (id_tutor,),
                )
                disponibilidad = cur.fetchall()
        for fila in disponibilidad:
            fila["hora_inicio"] = fila["hora_inicio"].strftime("%H:%M")
            fila["hora_fin"] = fila["hora_fin"].strftime("%H:%M")

        return jsonify({"ok": True, "disponibilidad": disponibilidad})
    except Error:
        return jsonify({"ok": False, "message": "No fue posible consultar la disponibilidad."}), 500

@sessions_bp.post("/sesiones")
def crear_sesion():
    # 1. Autenticación: debe venir un token válido
    token = get_bearer_token()
    if not token:
        return jsonify({"ok": False, "message": "No autenticado."}), 401
    try:
        payload = decode_token(token)
    except Exception:
        return jsonify({"ok": False, "message": "Token inválido o expirado."}), 401

    id_estudiante = int(payload["sub"])

    # 2. Validar campos requeridos
    body = request.get_json(silent=True) or {}
    id_tutor = body.get("id_tutor")
    id_materia = body.get("id_materia")
    fecha_str = body.get("fecha")
    hora_inicio_str = body.get("hora_inicio")
    hora_final_str = body.get("hora_final")
    motivo = body.get("motivo")

    if not all([id_tutor, id_materia, fecha_str, hora_inicio_str, hora_final_str]):
        return jsonify({"ok": False, "message": "Faltan datos requeridos."}), 400

    try:
        fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
        hora_inicio = datetime.strptime(hora_inicio_str, "%H:%M").time()
        hora_final = datetime.strptime(hora_final_str, "%H:%M").time()
    except ValueError:
        return jsonify({"ok": False, "message": "Formato de fecha u hora inválido."}), 400

    if hora_final <= hora_inicio:
        return jsonify({"ok": False, "message": "La hora final debe ser mayor a la hora de inicio."}), 400

    dia_semana = fecha.isoweekday()

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                # 3. El tutor imparte esa materia
                cur.execute(
                    "SELECT 1 FROM ttutor_materia WHERE id_tutor = %s AND id_materia = %s",
                    (id_tutor, id_materia),
                )
                if cur.fetchone() is None:
                    return jsonify({"ok": False, "message": "El tutor no imparte esa materia."}), 400

                # 4. La hora solicitada cae dentro de la disponibilidad del tutor ese día
                cur.execute(
                    """
                    SELECT 1
                    FROM thorario_atencion ha
                    JOIN thorario_dia hd ON hd.id_horario = ha.id_horario
                    WHERE ha.id_tutor = %s
                      AND hd.dia_semana = %s
                      AND ha.hora_inicio <= %s
                      AND ha.hora_fin >= %s
                    """,
                    (id_tutor, dia_semana, hora_inicio, hora_final),
                )
                if cur.fetchone() is None:
                    return jsonify({"ok": False, "message": "El horario solicitado no está dentro de la disponibilidad del tutor."}), 400

                # 5. No hay traslape con otra sesión del tutor (excluyendo canceladas)
                cur.execute(
                    """
                    SELECT 1 FROM tsesion s
                    JOIN testado_sesion es ON es.id_estado_sesion = s.id_estado_sesion
                    WHERE s.id_tutor = %s
                      AND s.fec_sesion = %s
                      AND es.txt_desc <> 'Cancelada'
                      AND s.hora_inicio < %s
                      AND s.hora_final > %s
                    """,
                    (id_tutor, fecha, hora_final, hora_inicio),
                )
                if cur.fetchone() is not None:
                    return jsonify({"ok": False, "message": "El tutor ya tiene una sesión programada en ese horario."}), 409

                # 6. No hay traslape con otra sesión del estudiante
                cur.execute(
                    """
                    SELECT 1 FROM tsesion s
                    JOIN testado_sesion es ON es.id_estado_sesion = s.id_estado_sesion
                    WHERE s.id_estudiante = %s
                      AND s.fec_sesion = %s
                      AND es.txt_desc <> 'Cancelada'
                      AND s.hora_inicio < %s
                      AND s.hora_final > %s
                    """,
                    (id_estudiante, fecha, hora_final, hora_inicio),
                )
                if cur.fetchone() is not None:
                    return jsonify({"ok": False, "message": "Ya tienes una sesión programada en ese horario."}), 409

                # 7. Insertar la sesión con estado "Pendiente"
                cur.execute(
                    """
                    INSERT INTO tsesion (id_estudiante, id_tutor, id_materia, id_estado_sesion, fec_sesion, hora_inicio, hora_final, motivo)
                    SELECT %s, %s, %s, id_estado_sesion, %s, %s, %s, %s
                    FROM testado_sesion WHERE txt_desc = 'Pendiente'
                    RETURNING id_sesion
                    """,
                    (id_estudiante, id_tutor, id_materia, fecha, hora_inicio, hora_final, motivo),
                )
                nueva = cur.fetchone()
            conn.commit()
        return jsonify({"ok": True, "id_sesion": nueva["id_sesion"]}), 201
    except Error:
        return jsonify({"ok": False, "message": "No fue posible crear la sesión."}), 500