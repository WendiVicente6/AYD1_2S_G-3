import base64
from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request

from conexion.db import get_connection
from auth import decode_token, get_bearer_token

students_bp = Blueprint("students", __name__)

ESTADOS_ACTIVOS = ["pendiente", "confirmada"]
SLOT_MINUTOS = 60


def _get_authenticated_student():
    """Valida el JWT y que el rol sea estudiante.

    Devuelve (id_estudiante, None) si todo bien,
    o (None, (mensaje, status)) si algo falla.
    """
    token = get_bearer_token()
    if not token:
        return None, ("Token requerido.", 401)
    try:
        payload = decode_token(token)
    except Exception:
        return None, ("Sesión inválida o expirada.", 401)
    if payload.get("role") != "student":
        return None, ("Solo un estudiante puede consultar esta información.", 403)
    return int(payload["sub"]), None


# HU-006 Página principal del estudiante: tutores disponibles
@students_bp.get("/estudiante/tutores")
def listar_tutores_disponibles():
    id_estudiante, error = _get_authenticated_student()
    if error:
        return jsonify({"ok": False, "message": error[0]}), error[1]

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                        u.id_usuario                    AS id_tutor,
                        u.nombres || ' ' || u.apellidos AS nombre_completo,
                        t.dir_tutoria,
                        u.foto,
                        STRING_AGG(m.nombre, ', ' ORDER BY m.nombre) AS materias
                    FROM tusuario u
                    JOIN ttutor t               ON t.id_usuario = u.id_usuario
                    LEFT JOIN ttutor_materia tm  ON tm.id_tutor  = u.id_usuario
                    LEFT JOIN tmateria m         ON m.id_materia  = tm.id_materia
                    WHERE u.sn_activo = 1
                      AND u.id_usuario NOT IN (
                            SELECT s.id_tutor
                            FROM tsesion s
                            JOIN testado_sesion es ON es.id_estado_sesion = s.id_estado_sesion
                            WHERE s.id_estudiante = %s
                              AND LOWER(es.txt_desc) = ANY(%s)
                      )
                    GROUP BY u.id_usuario, u.nombres, u.apellidos, t.dir_tutoria, u.foto
                    ORDER BY nombre_completo
                    """,
                    (id_estudiante, ESTADOS_ACTIVOS),
                )
                filas = cur.fetchall()
    except Exception as exc:
        return jsonify({"ok": False, "message": f"No fue posible consultar los tutores: {exc}"}), 500

    tutores = []
    for fila in filas:
        foto_data = None
        if fila["foto"] is not None:
            foto_data = "data:image/*;base64," + base64.b64encode(bytes(fila["foto"])).decode("ascii")
        tutores.append({
            "id_tutor": fila["id_tutor"],
            "nombre_completo": fila["nombre_completo"],
            "direccion_tutoria": fila["dir_tutoria"],
            "materias": fila["materias"].split(", ") if fila["materias"] else [],
            "foto": foto_data,
        })

    return jsonify({"ok": True, "tutores": tutores})



# HU-007  Horario general de un tutor: días + rango de horas
@students_bp.get("/estudiante/tutores/<int:id_tutor>/horario")
def horario_de_tutor(id_tutor):
    _, error = _get_authenticated_student()
    if error:
        return jsonify({"ok": False, "message": error[0]}), error[1]

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id_horario, hora_inicio, hora_fin FROM thorario_atencion WHERE id_tutor = %s",
                (id_tutor,),
            )
            horario = cur.fetchone()

            if not horario:
                return jsonify({"ok": True, "horario": None})

            cur.execute(
                "SELECT dia_semana FROM thorario_dia WHERE id_horario = %s ORDER BY dia_semana",
                (horario["id_horario"],),
            )
            dias = [row["dia_semana"] for row in cur.fetchall()]

    return jsonify({
        "ok": True,
        "horario": {
            "hora_inicio": str(horario["hora_inicio"])[:5],
            "hora_fin": str(horario["hora_fin"])[:5],
            "dias": dias,  # [1..7]  1=Lunes ... 7=Domingo
        },
    })


# HU-007  Disponibilidad de un tutor en una fecha concreta
@students_bp.get("/estudiante/tutores/<int:id_tutor>/disponibilidad")
def disponibilidad_en_fecha(id_tutor):
    _, error = _get_authenticated_student()
    if error:
        return jsonify({"ok": False, "message": error[0]}), error[1]

    fecha_str = request.args.get("fecha")
    if not fecha_str:
        return jsonify({"ok": False, "message": "El parámetro 'fecha' es obligatorio (YYYY-MM-DD)."}), 400
    try:
        fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"ok": False, "message": "Formato de fecha inválido. Usa YYYY-MM-DD."}), 400

    dia_semana = fecha.isoweekday()  # 1=Lunes ... 7=Domingo

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                # 1. ¿El tutor atiende ese día de la semana?
                cur.execute(
                    """
                    SELECT ha.hora_inicio, ha.hora_fin
                    FROM thorario_atencion ha
                    JOIN thorario_dia hd ON hd.id_horario = ha.id_horario
                    WHERE ha.id_tutor = %s AND hd.dia_semana = %s
                    """,
                    (id_tutor, dia_semana),
                )
                horario = cur.fetchone()

                if not horario:
                    return jsonify({
                        "ok": True,
                        "atiende": False,
                        "fecha": fecha_str,
                        "mensaje": "El tutor no atiende el día seleccionado.",
                        "slots": [],
                    })

                # 2. Sesiones ya reservadas ese día (las canceladas no cuentan)
                cur.execute(
                    """
                    SELECT s.hora_inicio, s.hora_final
                    FROM tsesion s
                    JOIN testado_sesion es ON es.id_estado_sesion = s.id_estado_sesion
                    WHERE s.id_tutor = %s
                      AND s.fec_sesion = %s
                      AND es.txt_desc <> 'Cancelada'
                    """,
                    (id_tutor, fecha),
                )
                ocupadas = cur.fetchall()
    except Exception as exc:
        return jsonify({"ok": False, "message": f"No fue posible consultar la disponibilidad: {exc}"}), 500

   
    inicio = datetime.combine(fecha, horario["hora_inicio"])
    fin = datetime.combine(fecha, horario["hora_fin"])
    paso = timedelta(minutes=SLOT_MINUTOS)

    slots = []
    actual = inicio
    while actual + paso <= fin:
        slot_ini = actual.time()
        slot_fin = (actual + paso).time()

        # Hay traslape si:  slot_ini < sesion_fin  Y  slot_fin > sesion_ini
        ocupado = any(
            slot_ini < ses["hora_final"] and slot_fin > ses["hora_inicio"]
            for ses in ocupadas
        )

        slots.append({
            "hora_inicio": slot_ini.strftime("%H:%M"),
            "hora_fin": slot_fin.strftime("%H:%M"),
            "estado": "ocupado" if ocupado else "disponible",
        })
        actual += paso

    return jsonify({"ok": True, "atiende": True, "fecha": fecha_str, "slots": slots})
