from flask import Blueprint

admin_reports_bp = Blueprint("admin_reports", __name__)



from functools import wraps

from flask import Blueprint, jsonify
from conexion.db import get_connection
from auth import get_bearer_token, decode_token




def requiere_admin(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        token = get_bearer_token()

        if not token:
            return jsonify({
                "ok": False,
                "message": "Debe iniciar sesión."
            }), 401

        try:
            payload = decode_token(token)
        except Exception:
            return jsonify({
                "ok": False,
                "message": "El token es inválido o ha expirado."
            }), 401

        if payload.get("role") != "admin":
            return jsonify({
                "ok": False,
                "message": "No tiene permisos de administrador."
            }), 403

        return func(*args, **kwargs)

    return wrapper


def obtener_reportes(dirigido_a):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    r.id_reporte,
                    r.id_sesion,
                    r.id_tipo_reporte,
                    tr.txt_desc AS categoria,
                    r.explicacion,
                    r.fec_creacion,
                    r.autor,
                    r.estado_gestion,
                    s.id_tutor,
                    s.id_estudiante,
                    CASE
                        WHEN tr.dirigido_a = 'tutor'
                            THEN CONCAT_WS(' ', tutor.nombres, tutor.apellidos)
                        ELSE CONCAT_WS(' ', estudiante.nombres, estudiante.apellidos)
                    END AS reportado,
                    CASE
                        WHEN r.autor = 'estudiante'
                            THEN CONCAT_WS(' ', estudiante.nombres, estudiante.apellidos)
                        ELSE CONCAT_WS(' ', tutor.nombres, tutor.apellidos)
                    END AS denunciante
                FROM treporte r
                JOIN ttipo_reporte tr
                    ON tr.id_tipo_reporte = r.id_tipo_reporte
                JOIN tsesion s
                    ON s.id_sesion = r.id_sesion
                JOIN tusuario estudiante
                    ON estudiante.id_usuario = s.id_estudiante
                JOIN tusuario tutor
                    ON tutor.id_usuario = s.id_tutor
                WHERE tr.dirigido_a = %s
                ORDER BY r.fec_creacion DESC, r.id_reporte DESC;
            """, (dirigido_a,))

            return cur.fetchall()


@admin_reports_bp.get("/reportes-tutores")
@requiere_admin
def reportes_tutores():
    try:
        reportes = obtener_reportes("tutor")
        return jsonify({
            "ok": True,
            "reportes": reportes
        }), 200
    except Exception as e:
        print("Error al consultar reportes contra tutores:", repr(e))
        return jsonify({
            "ok": False,
            "message": "No fue posible consultar los reportes contra tutores."
        }), 500


@admin_reports_bp.get("/reportes-estudiantes")
@requiere_admin
def reportes_estudiantes():
    try:
        reportes = obtener_reportes("estudiante")
        return jsonify({
            "ok": True,
            "reportes": reportes
        }), 200
    except Exception as e:
        print("Error al consultar reportes contra estudiantes:", repr(e))
        return jsonify({
            "ok": False,
            "message": "No fue posible consultar los reportes contra estudiantes."
        }), 500


@admin_reports_bp.patch("/reportes/<int:id_reporte>/rechazar")
@requiere_admin
def rechazar_reporte(id_reporte):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE treporte
                    SET estado_gestion = 'Rechazada'
                    WHERE id_reporte = %s
                      AND estado_gestion = 'Pendiente'
                    RETURNING id_reporte, estado_gestion;
                """, (id_reporte,))

                reporte = cur.fetchone()

                if not reporte:
                    return jsonify({
                        "ok": False,
                        "message": "El reporte no existe o ya fue gestionado."
                    }), 404

                conn.commit()

                return jsonify({
                    "ok": True,
                    "message": "Reporte rechazado correctamente.",
                    "reporte": reporte
                }), 200

    except Exception as e:
        print("Error al rechazar reporte:", repr(e))
        return jsonify({
            "ok": False,
            "message": "No fue posible rechazar el reporte."
        }), 500


@admin_reports_bp.patch("/reportes/<int:id_reporte>/desactivar-reportado")
@requiere_admin
def desactivar_reportado(id_reporte):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        r.id_reporte,
                        r.estado_gestion,
                        tr.dirigido_a,
                        s.id_tutor,
                        s.id_estudiante
                    FROM treporte r
                    JOIN ttipo_reporte tr
                        ON tr.id_tipo_reporte = r.id_tipo_reporte
                    JOIN tsesion s
                        ON s.id_sesion = r.id_sesion
                    WHERE r.id_reporte = %s
                    FOR UPDATE OF r;
                """, (id_reporte,))

                reporte = cur.fetchone()

                if not reporte:
                    return jsonify({
                        "ok": False,
                        "message": "El reporte no existe."
                    }), 404

                if reporte["estado_gestion"] != "Pendiente":
                    return jsonify({
                        "ok": False,
                        "message": "El reporte ya fue gestionado."
                    }), 409

                if reporte["dirigido_a"] == "tutor":
                    id_usuario = reporte["id_tutor"]
                    rol = 3
                    nombre_rol = "tutor"
                else:
                    id_usuario = reporte["id_estudiante"]
                    rol = 2
                    nombre_rol = "estudiante"

                cur.execute("""
                    UPDATE tusuario
                    SET id_estado_usr = 3,
                        sn_activo = 0
                    WHERE id_usuario = %s
                      AND id_rol = %s
                      AND id_estado_usr = 2
                    RETURNING id_usuario, nombres, apellidos;
                """, (id_usuario, rol))

                usuario = cur.fetchone()

                if not usuario:
                    return jsonify({
                        "ok": False,
                        "message": (
                            "El usuario reportado no está activo "
                            "o no corresponde al rol esperado."
                        )
                    }), 409

                cur.execute("""
                    UPDATE treporte
                    SET estado_gestion = 'Atendida'
                    WHERE id_reporte = %s;
                """, (id_reporte,))

                conn.commit()

                return jsonify({
                    "ok": True,
                    "message": (
                        f"Se dio de baja al {nombre_rol} "
                        "y el reporte quedó atendido."
                    ),
                    "usuario": usuario,
                    "id_reporte": id_reporte,
                    "estado_gestion": "Atendida"
                }), 200

    except Exception as e:
        print("Error al gestionar reporte:", repr(e))
        return jsonify({
            "ok": False,
            "message": "No fue posible gestionar el reporte."
        }), 500
