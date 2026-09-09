from flask import Blueprint, request, jsonify
from conexion.db import get_connection
from auth import decode_token, get_bearer_token

schedule_bp = Blueprint("schedule", __name__)

DIAS_VALIDOS = range(1, 8)  # 1=Lunes ... 7=Domingo
ESTADOS_ACTIVOS = ("pendiente", "confirmada")


def _get_authenticated_tutor():
    token = get_bearer_token()
    if not token:
        return None, ("Token requerido.", 401)
    try:
        payload = decode_token(token)
    except Exception:
        return None, ("Sesión inválida o expirada.", 401)
    if payload.get("role") != "tutor":
        return None, ("No tienes permisos para esta acción.", 403)
    return int(payload["sub"]), None


def _validate_payload(data):
    dias = data.get("dias", [])
    hora_inicio = data.get("hora_inicio")
    hora_fin = data.get("hora_fin")

    if not dias or not hora_inicio or not hora_fin:
        return None, "Debes indicar los días y el horario de inicio/fin."
    if not all(isinstance(d, int) and d in DIAS_VALIDOS for d in dias):
        return None, "Días inválidos (deben ser del 1 al 7)."
    if hora_fin <= hora_inicio:
        return None, "La hora de fin debe ser posterior a la hora de inicio."

    return {"dias": dias, "hora_inicio": hora_inicio, "hora_fin": hora_fin}, None


@schedule_bp.get("/tutors/schedule")
def get_schedule():
    id_tutor, error = _get_authenticated_tutor()
    if error:
        return jsonify({"ok": False, "message": error[0]}), error[1]

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id_horario, hora_inicio, hora_fin FROM thorario_atencion WHERE id_tutor = %s",
                (id_tutor,)
            )
            horario = cur.fetchone()

            if not horario:
                return jsonify({"ok": True, "horario": None})

            cur.execute(
                "SELECT dia_semana FROM thorario_dia WHERE id_horario = %s ORDER BY dia_semana",
                (horario["id_horario"],)
            )
            dias = [row["dia_semana"] for row in cur.fetchall()]

    return jsonify({
        "ok": True,
        "horario": {
            "hora_inicio": str(horario["hora_inicio"])[:5],
            "hora_fin": str(horario["hora_fin"])[:5],
            "dias": dias,
        }
    })


@schedule_bp.post("/tutors/schedule")
def create_schedule():
    id_tutor, error = _get_authenticated_tutor()
    if error:
        return jsonify({"ok": False, "message": error[0]}), error[1]

    data = request.get_json(silent=True) or {}
    payload, msg = _validate_payload(data)
    if msg:
        return jsonify({"ok": False, "message": msg}), 400

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id_horario FROM thorario_atencion WHERE id_tutor = %s",
                    (id_tutor,)
                )
                if cur.fetchone():
                    return jsonify({
                        "ok": False,
                        "message": "Ya tienes un horario configurado. Usa la opción de actualizar."
                    }), 409

                cur.execute(
                    """
                    INSERT INTO thorario_atencion (id_tutor, hora_inicio, hora_fin)
                    VALUES (%s, %s, %s)
                    RETURNING id_horario
                    """,
                    (id_tutor, payload["hora_inicio"], payload["hora_fin"])
                )
                id_horario = cur.fetchone()["id_horario"]

                for dia in payload["dias"]:
                    cur.execute(
                        "INSERT INTO thorario_dia (id_horario, dia_semana) VALUES (%s, %s)",
                        (id_horario, dia)
                    )
            conn.commit()
    except Exception as exc:
        return jsonify({"ok": False, "message": f"No fue posible guardar el horario: {exc}"}), 500

    return jsonify({"ok": True, "message": "Horario guardado correctamente."}), 201


@schedule_bp.put("/tutors/schedule")
def update_schedule():
    id_tutor, error = _get_authenticated_tutor()
    if error:
        return jsonify({"ok": False, "message": error[0]}), error[1]

    data = request.get_json(silent=True) or {}
    payload, msg = _validate_payload(data)
    if msg:
        return jsonify({"ok": False, "message": msg}), 400

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id_horario FROM thorario_atencion WHERE id_tutor = %s",
                    (id_tutor,)
                )
                horario = cur.fetchone()
                if not horario:
                    return jsonify({
                        "ok": False,
                        "message": "Aún no tienes un horario configurado. Créalo primero."
                    }), 404

                # --- Validación clave: sesiones activas fuera del nuevo rango ---
                cur.execute(
                    """
                    SELECT s.id_sesion, s.fec_sesion, s.hora_inicio, s.hora_final
                    FROM tsesion s
                    JOIN testado_sesion es ON es.id_estado_sesion = s.id_estado_sesion
                    WHERE s.id_tutor = %s
                      AND LOWER(es.txt_desc) = ANY(%s)
                      AND (
                            NOT (EXTRACT(ISODOW FROM s.fec_sesion)::int = ANY(%s))
                         OR s.hora_inicio < %s
                         OR s.hora_final > %s
                      )
                    """,
                    (
                        id_tutor,
                        list(ESTADOS_ACTIVOS),
                        payload["dias"],
                        payload["hora_inicio"],
                        payload["hora_fin"],
                    )
                )
                conflictos = cur.fetchall()

                if conflictos:
                    detalle = [
                        f"{c['fec_sesion']} {str(c['hora_inicio'])[:5]}-{str(c['hora_final'])[:5]}"
                        for c in conflictos
                    ]
                    return jsonify({
                        "ok": False,
                        "message": (
                            "No se puede actualizar: tienes sesiones activas fuera del nuevo horario. "
                            "Reprograma o cancela estas sesiones primero: " + "; ".join(detalle)
                        )
                    }), 409

                # Sin conflictos: aplicar cambios
                cur.execute(
                    "UPDATE thorario_atencion SET hora_inicio = %s, hora_fin = %s WHERE id_horario = %s",
                    (payload["hora_inicio"], payload["hora_fin"], horario["id_horario"])
                )
                cur.execute(
                    "DELETE FROM thorario_dia WHERE id_horario = %s",
                    (horario["id_horario"],)
                )
                for dia in payload["dias"]:
                    cur.execute(
                        "INSERT INTO thorario_dia (id_horario, dia_semana) VALUES (%s, %s)",
                        (horario["id_horario"], dia)
                    )
            conn.commit()
    except Exception as exc:
        return jsonify({"ok": False, "message": f"No fue posible actualizar el horario: {exc}"}), 500

    return jsonify({"ok": True, "message": "Horario actualizado correctamente."})