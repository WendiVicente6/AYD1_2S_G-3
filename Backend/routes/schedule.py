from flask import Blueprint, request, jsonify
from conexion.db import get_connection
from auth import decode_token, get_bearer_token

schedule_bp = Blueprint("schedule", __name__)

DIAS_VALIDOS = range(1, 8)  # 1=Lunes ... 7=Domingo


def _get_authenticated_tutor():
    """Valida el token y que el rol sea tutor. Retorna el id_usuario o None."""
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


@schedule_bp.post("/tutors/schedule")
def set_schedule():
    id_tutor, error = _get_authenticated_tutor()
    if error:
        return jsonify({"ok": False, "message": error[0]}), error[1]

    data = request.get_json(silent=True) or {}
    dias = data.get("dias", [])
    hora_inicio = data.get("hora_inicio")
    hora_fin = data.get("hora_fin")

    if not dias or not hora_inicio or not hora_fin:
        return jsonify({
            "ok": False,
            "message": "Debes indicar los días y el horario de inicio/fin."
        }), 400

    if not all(isinstance(d, int) and d in DIAS_VALIDOS for d in dias):
        return jsonify({"ok": False, "message": "Días inválidos (deben ser del 1 al 7)."}), 400

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO thorario_atencion (id_tutor, hora_inicio, hora_fin)
                    VALUES (%s, %s, %s)
                    RETURNING id_horario
                    """,
                    (id_tutor, hora_inicio, hora_fin)
                )
                id_horario = cur.fetchone()["id_horario"]

                for dia in dias:
                    cur.execute(
                        "INSERT INTO thorario_dia (id_horario, dia_semana) VALUES (%s, %s)",
                        (id_horario, dia)
                    )
            conn.commit()
    except Exception as exc:
        return jsonify({"ok": False, "message": f"No fue posible guardar el horario: {exc}"}), 500

    return jsonify({"ok": True, "message": "Horario guardado correctamente."}), 201