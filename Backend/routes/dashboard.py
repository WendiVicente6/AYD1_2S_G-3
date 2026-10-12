from flask import Blueprint, jsonify
from conexion.db import get_connection

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.get("/admin/dashboard")
def obtener_dashboard():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:

                # =========================
                # TOTAL DE ESTUDIANTES
                # =========================
                cur.execute("""
                    SELECT COUNT(*) AS total
                    FROM tusuario
                    WHERE id_rol = 2
                      AND id_estado_usr = 2
                      AND sn_activo = 1;
                """)
                estudiantes = cur.fetchone()["total"]

                # =========================
                # TOTAL DE TUTORES
                # =========================
                cur.execute("""
                    SELECT COUNT(*) AS total
                    FROM tusuario
                    WHERE id_rol = 3
                      AND id_estado_usr = 2
                      AND sn_activo = 1;
                """)
                tutores = cur.fetchone()["total"]

                # =========================
                # SESIONES DEL MES ACTUAL
                # =========================
                cur.execute("""
                    SELECT COUNT(*) AS total
                    FROM tsesion
                    WHERE EXTRACT(MONTH FROM fec_sesion) =
                          EXTRACT(MONTH FROM CURRENT_DATE)
                      AND EXTRACT(YEAR FROM fec_sesion) =
                          EXTRACT(YEAR FROM CURRENT_DATE);
                """)
                sesiones = cur.fetchone()["total"]

                # =========================
                # ESTUDIANTES PENDIENTES
                # =========================
                cur.execute("""
                    SELECT COUNT(*) AS total
                    FROM tusuario
                    WHERE id_rol = 2
                      AND id_estado_usr = 1;
                """)
                estudiantes_pendientes = cur.fetchone()["total"]

                # =========================
                # TUTORES PENDIENTES
                # =========================
                cur.execute("""
                    SELECT COUNT(*) AS total
                    FROM tusuario
                    WHERE id_rol = 3
                      AND id_estado_usr = 1;
                """)
                tutores_pendientes = cur.fetchone()["total"]

                # =========================
                # PRÓXIMAS SESIONES
                # =========================
                cur.execute("""
                    SELECT
                        s.id_sesion,
                        s.fec_sesion::text AS fec_sesion,
                        s.hora_inicio::text AS hora_inicio,
                        m.nombre AS materia,
                        CONCAT(
                            u.nombres,
                            ' ',
                            u.apellidos
                        ) AS tutor
                    FROM tsesion s
                    INNER JOIN tusuario u
                        ON u.id_usuario = s.id_tutor
                    INNER JOIN tmateria m
                        ON m.id_materia = s.id_materia
                    WHERE s.fec_sesion >= CURRENT_DATE
                    ORDER BY
                        s.fec_sesion ASC,
                        s.hora_inicio ASC
                    LIMIT 5;
                """)

                sesiones_lista = cur.fetchall()

                return jsonify({
                    "ok": True,
                    "stats": {
                        "estudiantes": estudiantes,
                        "tutores": tutores,
                        "sesiones": sesiones,
                        "mensajes": 0,
                        "estudiantes_pendientes": estudiantes_pendientes,
                        "tutores_pendientes": tutores_pendientes
                    },
                    "sessions": sesiones_lista
                })

    except Exception as e:
        print("Error al obtener dashboard:", e)

        return jsonify({
            "ok": False,
            "message": "No fue posible obtener la información del dashboard."
        }), 500

    
