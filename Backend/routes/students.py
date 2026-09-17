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

    id_materia = request.args.get("id_materia", type=int)
    sexo = request.args.get("sexo", type=str)
    universidad = request.args.get("universidad", type=str)
    anios_exp_min = request.args.get("anios_exp_min", type=int)
    edad_min = request.args.get("edad_min", type=int)
    edad_max = request.args.get("edad_max", type=int)

    condiciones = []
    parametros = [id_estudiante, ESTADOS_ACTIVOS]

    if id_materia:
        condiciones.append(
            """AND EXISTS (
                    SELECT 1 FROM ttutor_materia tm2
                    WHERE tm2.id_tutor = u.id_usuario AND tm2.id_materia = %s
               )"""
        )
        parametros.append(id_materia)

    if sexo:
        condiciones.append("AND u.genero = %s")
        parametros.append(sexo.upper())

    if universidad:
        condiciones.append("AND t.u_graduacion ILIKE %s")
        parametros.append(f"%{universidad}%")

    if anios_exp_min is not None:
        condiciones.append("AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, t.anio_inicio_tutoria)) >= %s")
        parametros.append(anios_exp_min)

    if edad_min is not None:
        condiciones.append("AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.fec_nac)) >= %s")
        parametros.append(edad_min)

    if edad_max is not None:
        condiciones.append("AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.fec_nac)) <= %s")
        parametros.append(edad_max)

    filtros_sql = "\n                      ".join(condiciones)

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"""
                    SELECT
                        u.id_usuario                    AS id_tutor,
                        u.nombres || ' ' || u.apellidos AS nombre_completo,
                        t.dir_tutoria,
                        u.foto,
                        u.genero,
                        t.u_graduacion,
                        EXTRACT(YEAR FROM AGE(CURRENT_DATE, t.anio_inicio_tutoria))::int AS anios_experiencia,
                        EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.fec_nac))::int AS edad,
                        STRING_AGG(DISTINCT m.nombre, ', ' ORDER BY m.nombre) AS materias
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
                      {filtros_sql}
                    GROUP BY u.id_usuario, u.nombres, u.apellidos, t.dir_tutoria, u.foto,
                             u.genero, t.u_graduacion, t.anio_inicio_tutoria, u.fec_nac
                    ORDER BY nombre_completo
                    """,
                    tuple(parametros),
                )
                filas = cur.fetchall()
    except Exception as exc:
        return jsonify({"ok": False, "message": f"No fue posible consultar los tutores: {exc}"}), 500

    tutores = []
    for fila in filas:
        foto_data = bytes(fila["foto"]).decode("utf-8") if fila["foto"] else None
        tutores.append({
            "id_tutor": fila["id_tutor"],
            "nombre_completo": fila["nombre_completo"],
            "direccion_tutoria": fila["dir_tutoria"],
            "materias": fila["materias"].split(", ") if fila["materias"] else [],
            "foto": foto_data,
            "genero": fila["genero"],
            "universidad": fila["u_graduacion"],
            "anios_experiencia": fila["anios_experiencia"],
            "edad": fila["edad"],
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
