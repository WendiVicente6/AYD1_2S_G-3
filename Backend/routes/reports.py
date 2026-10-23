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


# ============================================================
# REPORTE 3 - FASE 2
# Top 10 tutores con más sesiones completadas en los últimos 30 días
# ============================================================

@reports_bp.get("/admin/reportes/top-tutores-sesiones")
def reporte_top_tutores_sesiones():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        t.id_usuario AS id_tutor,
                        CONCAT(u.nombres, ' ', u.apellidos) AS tutor,
                        COUNT(s.id_sesion) AS sesiones_atendidas
                    FROM ttutor t
                    INNER JOIN tusuario u
                        ON u.id_usuario = t.id_usuario
                    LEFT JOIN tsesion s
                        ON s.id_tutor = t.id_usuario
                       AND s.id_estado_sesion = 3
                       AND s.fec_sesion >= CURRENT_DATE - INTERVAL '30 days'
                       AND s.fec_sesion <= CURRENT_DATE
                    GROUP BY
                        t.id_usuario,
                        u.nombres,
                        u.apellidos
                    ORDER BY
                        sesiones_atendidas DESC,
                        tutor ASC
                    LIMIT 10;
                """)

                resultados = cur.fetchall()

        return jsonify({
            "ok": True,
            "tutores": resultados,
            "periodo": "Últimos 30 días"
        }), 200

    except Exception as e:
        print("Error en reporte top de tutores:", e)
        return jsonify({
            "ok": False,
            "message": "No fue posible obtener el reporte de tutores."
        }), 500


# ============================================================
# REPORTE 4 - FASE 2
# Evolución semanal de sesiones por estado durante seis meses
# ============================================================

@reports_bp.get("/admin/reportes/evolucion-sesiones")
def reporte_evolucion_sesiones():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        DATE_TRUNC('week', s.fec_sesion)::date AS semana,
                        COUNT(*) AS total_sesiones,
                        COUNT(*) FILTER (
                            WHERE s.id_estado_sesion = 1
                        ) AS pendientes,
                        COUNT(*) FILTER (
                            WHERE s.id_estado_sesion = 2
                        ) AS confirmadas,
                        COUNT(*) FILTER (
                            WHERE s.id_estado_sesion = 3
                        ) AS completadas,
                        COUNT(*) FILTER (
                            WHERE s.id_estado_sesion = 4
                        ) AS canceladas
                    FROM tsesion s
                    WHERE s.fec_sesion >= CURRENT_DATE - INTERVAL '6 months'
                      AND s.fec_sesion <= CURRENT_DATE
                    GROUP BY DATE_TRUNC('week', s.fec_sesion)
                    ORDER BY semana ASC;
                """)

                resultados = cur.fetchall()

        # Convertir las fechas para que jsonify las serialice correctamente.
        for fila in resultados:
            fila["semana"] = fila["semana"].isoformat()

        return jsonify({
            "ok": True,
            "evolucion": resultados,
            "periodo": "Últimos seis meses"
        }), 200

    except Exception as e:
        print("Error en reporte de evolución de sesiones:", e)
        return jsonify({
            "ok": False,
            "message": "No fue posible obtener la evolución de sesiones."
        }), 500


# ============================================================
# REPORTE 5 - FASE 2
# Materias con mayor tasa de cancelación
# ============================================================

@reports_bp.get("/admin/reportes/cancelaciones-materias")
def reporte_cancelaciones_materias():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        m.id_materia,
                        m.nombre AS materia,
                        COUNT(s.id_sesion) AS total_sesiones,
                        COUNT(s.id_sesion) FILTER (
                            WHERE s.id_estado_sesion = 4
                        ) AS sesiones_canceladas,
                        ROUND(
                            100.0 * COUNT(s.id_sesion) FILTER (
                                WHERE s.id_estado_sesion = 4
                            ) / NULLIF(COUNT(s.id_sesion), 0),
                            2
                        ) AS tasa_cancelacion
                    FROM tmateria m
                    INNER JOIN tsesion s
                        ON s.id_materia = m.id_materia
                    GROUP BY
                        m.id_materia,
                        m.nombre
                    ORDER BY
                        tasa_cancelacion DESC,
                        total_sesiones DESC,
                        materia ASC;
                """)

                resultados = cur.fetchall()

        return jsonify({
            "ok": True,
            "materias": resultados
        }), 200

    except Exception as e:
        print(
            "Error en reporte de cancelaciones por materia:",
            e
        )

        return jsonify({
            "ok": False,
            "message": (
                "No fue posible obtener el reporte "
                "de cancelaciones por materia."
            )
        }), 500


# ============================================================
# REPORTE 6 - FASE 2
# Horarios más demandados para sesiones
# ============================================================

@reports_bp.get("/admin/reportes/horarios-demandados")
def reporte_horarios_demandados():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        hora_inicio,
                        COUNT(*) AS total_sesiones,
                        COUNT(*) FILTER (
                            WHERE id_estado_sesion = 3
                        ) AS completadas,
                        COUNT(*) FILTER (
                            WHERE id_estado_sesion = 1
                        ) AS pendientes,
                        COUNT(*) FILTER (
                            WHERE id_estado_sesion = 2
                        ) AS confirmadas
                    FROM tsesion
                    WHERE id_estado_sesion IN (1, 2, 3)
                    GROUP BY hora_inicio
                    ORDER BY
                        total_sesiones DESC,
                        hora_inicio ASC;
                """)

                resultados = cur.fetchall()

                # Convertir la hora a texto para el JSON.
                for fila in resultados:
                    if fila["hora_inicio"] is not None:
                        fila["hora_inicio"] = (
                            fila["hora_inicio"].strftime("%H:%M")
                        )

        return jsonify({
            "ok": True,
            "horarios": resultados
        }), 200

    except Exception as e:
        print("Error en reporte de horarios demandados:", e)

        return jsonify({
            "ok": False,
            "message": (
                "No fue posible obtener el reporte "
                "de horarios más demandados."
            )
        }), 500


# ============================================================
# REPORTE 7 - FASE 2
# Estudiantes con más sesiones programadas
# ============================================================

@reports_bp.get("/admin/reportes/estudiantes-sesiones")
def reporte_estudiantes_sesiones():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        u.id_usuario AS id_estudiante,
                        CONCAT(
                            u.nombres, ' ', u.apellidos
                        ) AS estudiante,
                        COUNT(s.id_sesion) AS total_sesiones,
                        COUNT(s.id_sesion) FILTER (
                            WHERE s.id_estado_sesion = 3
                        ) AS completadas,
                        COUNT(s.id_sesion) FILTER (
                            WHERE s.id_estado_sesion = 1
                        ) AS pendientes,
                        COUNT(s.id_sesion) FILTER (
                            WHERE s.id_estado_sesion = 2
                        ) AS confirmadas
                    FROM tusuario u
                    INNER JOIN tsesion s
                        ON s.id_estudiante = u.id_usuario
                    WHERE u.id_rol = 2
                      AND s.id_estado_sesion IN (1, 2, 3)
                    GROUP BY
                        u.id_usuario,
                        u.nombres,
                        u.apellidos
                    ORDER BY
                        total_sesiones DESC,
                        estudiante ASC
                    LIMIT 10;
                """)

                resultados = cur.fetchall()

        return jsonify({
            "ok": True,
            "estudiantes": resultados
        }), 200

    except Exception as e:
        print(
            "Error en reporte de estudiantes con más sesiones:",
            e
        )

        return jsonify({
            "ok": False,
            "message": (
                "No fue posible obtener el reporte "
                "de estudiantes con más sesiones."
            )
        }), 500


# ============================================================
# REPORTE 8 - FASE 2
# Tasa de sesiones completadas frente a canceladas por materia
# ============================================================

@reports_bp.get("/admin/reportes/asistencia-cancelacion-materias")
def reporte_asistencia_cancelacion_materias():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        m.id_materia,
                        m.nombre AS materia,
                        COUNT(s.id_sesion) AS total_sesiones,

                        COUNT(s.id_sesion) FILTER (
                            WHERE s.id_estado_sesion = 3
                        ) AS sesiones_completadas,

                        COUNT(s.id_sesion) FILTER (
                            WHERE s.id_estado_sesion = 4
                        ) AS sesiones_canceladas,

                        ROUND(
                            100.0 * COUNT(s.id_sesion) FILTER (
                                WHERE s.id_estado_sesion = 3
                            ) / NULLIF(COUNT(s.id_sesion), 0),
                            2
                        ) AS tasa_completadas,

                        ROUND(
                            100.0 * COUNT(s.id_sesion) FILTER (
                                WHERE s.id_estado_sesion = 4
                            ) / NULLIF(COUNT(s.id_sesion), 0),
                            2
                        ) AS tasa_canceladas

                    FROM tmateria m
                    INNER JOIN tsesion s
                        ON s.id_materia = m.id_materia

                    GROUP BY
                        m.id_materia,
                        m.nombre

                    ORDER BY
                        tasa_completadas DESC,
                        tasa_canceladas ASC,
                        materia ASC;
                """)

                resultados = cur.fetchall()

        return jsonify({
            "ok": True,
            "materias": resultados
        }), 200

    except Exception as e:
        print(
            "Error en reporte de asistencia y cancelación por materia:",
            e
        )

        return jsonify({
            "ok": False,
            "message": (
                "No fue posible obtener el reporte "
                "de asistencia y cancelación por materia."
            )
        }), 500


# ============================================================
# REPORTE 9
# Calificación de tutores realizada por estudiantes
# ============================================================

@reports_bp.get("/admin/reportes/calificacion-tutores")
def reporte_calificacion_tutores():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    WITH calificaciones_tutores AS (
                        SELECT
                            s.id_tutor,
                            ROUND(
                                AVG(c.estrellas)::numeric,
                                2
                            ) AS promedio_estrellas,
                            COUNT(c.id_calificacion)
                                AS total_calificaciones
                        FROM tsesion s
                        INNER JOIN tcalificacion c
                            ON c.id_sesion = s.id_sesion
                        WHERE c.autor = 'estudiante'
                        GROUP BY s.id_tutor
                    ),
                    materias_tutores AS (
                        SELECT
                            tm.id_tutor,
                            STRING_AGG(
                                DISTINCT m.nombre,
                                ', ' ORDER BY m.nombre
                            ) AS materias
                        FROM ttutor_materia tm
                        INNER JOIN tmateria m
                            ON m.id_materia = tm.id_materia
                        GROUP BY tm.id_tutor
                    )
                    SELECT
                        t.id_usuario AS id_tutor,
                        CONCAT(
                            u.nombres, ' ', u.apellidos
                        ) AS tutor,
                        mt.materias,
                        ct.promedio_estrellas,
                        COALESCE(
                            ct.total_calificaciones, 0
                        ) AS total_calificaciones
                    FROM ttutor t
                    INNER JOIN tusuario u
                        ON u.id_usuario = t.id_usuario
                    LEFT JOIN materias_tutores mt
                        ON mt.id_tutor = t.id_usuario
                    LEFT JOIN calificaciones_tutores ct
                        ON ct.id_tutor = t.id_usuario
                    WHERE u.id_rol = 3
                      AND u.id_estado_usr = 2
                      AND u.sn_activo = 1
                    ORDER BY
                        ct.promedio_estrellas DESC NULLS LAST,
                        COALESCE(
                            ct.total_calificaciones, 0
                        ) DESC,
                        tutor ASC;
                """)

                resultados = cur.fetchall()

        return jsonify({
            "ok": True,
            "tutores": resultados
        }), 200

    except Exception as e:
        print(
            "Error en reporte de calificación de tutores:",
            e
        )
        return jsonify({
            "ok": False,
            "message": (
                "No fue posible obtener la calificación de tutores."
            )
        }), 500
 

# ============================================================
# REPORTE 10
# Calificación de estudiantes realizada por tutores
# ============================================================


@reports_bp.get("/admin/reportes/calificacion-estudiantes")
def reporte_calificacion_estudiantes():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    WITH calificaciones_estudiantes AS (
                        SELECT
                            s.id_estudiante,
                            ROUND(
                                AVG(c.estrellas)::numeric,
                                2
                            ) AS promedio_estrellas,
                            COUNT(c.id_calificacion)
                                AS total_calificaciones
                        FROM tsesion s
                        INNER JOIN tcalificacion c
                            ON c.id_sesion = s.id_sesion
                        WHERE c.autor = 'tutor'
                        GROUP BY s.id_estudiante
                    )
                    SELECT
                        u.id_usuario AS id_estudiante,
                        CONCAT(
                            u.nombres, ' ', u.apellidos
                        ) AS estudiante,
                        ce.promedio_estrellas,
                        COALESCE(
                            ce.total_calificaciones, 0
                        ) AS total_calificaciones
                    FROM tusuario u
                    LEFT JOIN calificaciones_estudiantes ce
                        ON ce.id_estudiante = u.id_usuario
                    WHERE u.id_rol = 2
                      AND u.id_estado_usr = 2
                      AND u.sn_activo = 1
                    ORDER BY
                        ce.promedio_estrellas DESC NULLS LAST,
                        COALESCE(
                            ce.total_calificaciones, 0
                        ) DESC,
                        estudiante ASC;
                """)

                resultados = cur.fetchall()

        return jsonify({
            "ok": True,
            "estudiantes": resultados
        }), 200

    except Exception as e:
        print(
            "Error en reporte de calificación de estudiantes:",
            e
        )
        return jsonify({
            "ok": False,
            "message": (
                "No fue posible obtener la calificación de estudiantes."
            )
        }), 500
