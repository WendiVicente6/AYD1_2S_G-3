from flask import Blueprint, jsonify
from conexion.db import get_connection

reports_bp = Blueprint("reports", __name__)


# ============================================================
# REPORTE 1
# Tutores que más estudiantes han atendido
# ============================================================

@reports_bp.get("/admin/reportes/tutores")
def reporte_tutores():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:

                cur.execute("""
                    SELECT
                        t.id_usuario AS id_tutor,
                        CONCAT(u.nombres, ' ', u.apellidos) AS tutor,
                        COUNT(DISTINCT s.id_estudiante) AS estudiantes_atendidos,
                        COUNT(s.id_sesion) AS total_sesiones
                    FROM tsesion s
                    INNER JOIN ttutor t
                        ON t.id_usuario = s.id_tutor
                    INNER JOIN tusuario u
                        ON u.id_usuario = t.id_usuario
                    WHERE s.id_estado_sesion = 3
                    GROUP BY
                        t.id_usuario,
                        u.nombres,
                        u.apellidos
                    ORDER BY
                        estudiantes_atendidos DESC,
                        total_sesiones DESC;
                """)

                resultados = cur.fetchall()

                return jsonify({
                    "ok": True,
                    "tutores": resultados
                }), 200

    except Exception as e:
        print("Error en reporte de tutores:", e)

        return jsonify({
            "ok": False,
            "message": "No fue posible obtener el reporte de tutores."
        }), 500


# ============================================================
# REPORTE 2
# Materias con más sesiones
# ============================================================

@reports_bp.get("/admin/reportes/materias")
def reporte_materias():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:

                cur.execute("""
                    SELECT
                        m.id_materia,
                        m.nombre AS materia,
                        COUNT(s.id_sesion) AS total_sesiones,
                        COUNT(DISTINCT s.id_estudiante) AS estudiantes_atendidos,
                        COUNT(DISTINCT s.id_tutor) AS tutores
                    FROM tsesion s
                    INNER JOIN ttutor_materia tm
                        ON tm.id_tutor = s.id_tutor
                       AND tm.id_materia = s.id_materia
                    INNER JOIN tmateria m
                        ON m.id_materia = tm.id_materia
                    WHERE s.id_estado_sesion = 3
                    GROUP BY
                        m.id_materia,
                        m.nombre
                    ORDER BY
                        total_sesiones DESC,
                        estudiantes_atendidos DESC;
                """)

                resultados = cur.fetchall()

                return jsonify({
                    "ok": True,
                    "materias": resultados
                }), 200

    except Exception as e:
        print("Error en reporte de materias:", e)

        return jsonify({
            "ok": False,
            "message": "No fue posible obtener el reporte de materias."
        }), 500

