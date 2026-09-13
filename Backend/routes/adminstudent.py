from flask import Blueprint, jsonify
from conexion.db import get_connection

admin_bp = Blueprint("admin", __name__)


@admin_bp.get("/estudiantes-pendientes")
def estudiantes_pendientes():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        u.id_usuario,
                        u.nombres,
                        u.apellidos,
                        u.carnet,
                        u.genero,
                        u.direccion,
                        u.telefono,
                        u.fec_nac,
                        u.correo,
                        u.id_estado_usr,
                        e.txt_desc AS estado
                    FROM tusuario u
                    JOIN testado_usr e
                        ON e.id_estado_usr = u.id_estado_usr
                    WHERE u.id_rol = 2
                      AND u.id_estado_usr = 1
                    ORDER BY u.id_usuario;
                """)

                estudiantes = cur.fetchall()

                return jsonify({
                    "ok": True,
                    "estudiantes": estudiantes
                })

    except Exception as e:
        print("Error al obtener estudiantes pendientes:", e)

        return jsonify({
            "ok": False,
            "message": "No fue posible obtener los estudiantes pendientes."
        }), 500


@admin_bp.patch("/estudiantes/<int:id_usuario>/aprobar")
def aprobar_estudiante(id_usuario):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE tusuario
                    SET id_estado_usr = 2,
                        sn_activo = 1
                    WHERE id_usuario = %s
                      AND id_rol = 2
                      AND id_estado_usr = 1
                    RETURNING
                        id_usuario,
                        nombres,
                        apellidos,
                        id_estado_usr;
                """, (id_usuario,))

                estudiante = cur.fetchone()

                if not estudiante:
                    return jsonify({
                        "ok": False,
                        "message": "El estudiante no existe o ya no está pendiente."
                    }), 404

                conn.commit()

                return jsonify({
                    "ok": True,
                    "message": "Estudiante aprobado correctamente.",
                    "estudiante": estudiante
                })

    except Exception as e:
        print("Error al aprobar estudiante:", e)

        return jsonify({
            "ok": False,
            "message": "No fue posible aprobar al estudiante."
        }), 500


@admin_bp.patch("/estudiantes/<int:id_usuario>/rechazar")
def rechazar_estudiante(id_usuario):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE tusuario
                    SET id_estado_usr = 4,
                        sn_activo = 0
                    WHERE id_usuario = %s
                      AND id_rol = 2
                      AND id_estado_usr = 1
                    RETURNING id_usuario, nombres, apellidos, id_estado_usr;
                """, (id_usuario,))

                estudiante = cur.fetchone()

                if not estudiante:
                    return jsonify({
                        "ok": False,
                        "message": "El estudiante no existe o ya no está pendiente."
                    }), 404

                conn.commit()

                return jsonify({
                    "ok": True,
                    "message": "Estudiante rechazado correctamente.",
                    "estudiante": estudiante
                })

    except Exception as e:
        print("Error al rechazar estudiante:", e)

        return jsonify({
            "ok": False,
            "message": "No fue posible rechazar al estudiante."
        }), 500
