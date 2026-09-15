from flask import Blueprint, jsonify
from conexion.db import get_connection

admin_tutor_bp = Blueprint("admin_tutor", __name__)


# ==========================================
# OBTENER TUTORES PENDIENTES
# ==========================================

@admin_tutor_bp.get("/tutores-pendientes")
def tutores_pendientes():
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
                        u.foto,
                        u.correo,
                        u.id_estado_usr,
                        e.txt_desc AS estado
                    FROM tusuario u
                    JOIN testado_usr e
                        ON e.id_estado_usr = u.id_estado_usr
                    WHERE u.id_rol = 3
                      AND u.id_estado_usr = 1
                    ORDER BY u.id_usuario;
                """)

                tutores = cur.fetchall()

                return jsonify({
                    "ok": True,
                    "tutores": tutores
                }), 200

    except Exception as e:
        print("Error al obtener tutores pendientes:", e)

        return jsonify({
            "ok": False,
            "message": "No fue posible obtener los tutores pendientes."
        }), 500


# ==========================================
# APROBAR TUTOR
# ==========================================

@admin_tutor_bp.patch("/tutores/<int:id_usuario>/aprobar")
def aprobar_tutor(id_usuario):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:

                cur.execute("""
                    UPDATE tusuario
                    SET
                        id_estado_usr = 2,
                        sn_activo = 1
                    WHERE id_usuario = %s
                      AND id_rol = 3
                      AND id_estado_usr = 1
                    RETURNING
                        id_usuario,
                        nombres,
                        apellidos,
                        id_estado_usr,
                        sn_activo;
                """, (id_usuario,))

                tutor = cur.fetchone()

                if not tutor:
                    return jsonify({
                        "ok": False,
                        "message": "El tutor no existe o ya no está pendiente."
                    }), 404

                conn.commit()

                return jsonify({
                    "ok": True,
                    "message": "Tutor aprobado correctamente.",
                    "tutor": tutor
                }), 200

    except Exception as e:
        print("Error al aprobar tutor:", e)

        return jsonify({
            "ok": False,
            "message": "No fue posible aprobar al tutor."
        }), 500


# ==========================================
# RECHAZAR TUTOR
# ==========================================

@admin_tutor_bp.patch("/tutores/<int:id_usuario>/rechazar")
def rechazar_tutor(id_usuario):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:

                cur.execute("""
                    UPDATE tusuario
                    SET
                        id_estado_usr = 4,
                        sn_activo = 0
                    WHERE id_usuario = %s
                      AND id_rol = 3
                      AND id_estado_usr = 1
                    RETURNING
                        id_usuario,
                        nombres,
                        apellidos,
                        id_estado_usr,
                        sn_activo;
                """, (id_usuario,))

                tutor = cur.fetchone()

                if not tutor:
                    return jsonify({
                        "ok": False,
                        "message": "El tutor no existe o ya no está pendiente."
                    }), 404

                conn.commit()

                return jsonify({
                    "ok": True,
                    "message": "Tutor rechazado correctamente.",
                    "tutor": tutor
                }), 200

    except Exception as e:
        print("Error al rechazar tutor:", e)

        return jsonify({
            "ok": False,
            "message": "No fue posible rechazar al tutor."
        }), 500




@admin_tutor_bp.get("/tutores")
def tutores_activos():
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
                        u.foto,
                        u.correo,
                        u.id_estado_usr,
                        e.txt_desc AS estado
                    FROM tusuario u
                    JOIN testado_usr e
                        ON e.id_estado_usr = u.id_estado_usr
                    WHERE u.id_rol = 3
                      AND u.id_estado_usr = 2
                    ORDER BY u.id_usuario;
                """)

                tutores = cur.fetchall()

                return jsonify({
                    "ok": True,
                    "tutores": tutores
                }), 200

    except Exception as e:
        print("Error al obtener tutores activos:", e)

        return jsonify({
            "ok": False,
            "message": "No fue posible obtener los tutores activos."
        }), 500


@admin_tutor_bp.patch("/tutores/<int:id_usuario>/baja")
def dar_baja_tutor(id_usuario):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE tusuario
                    SET
                        id_estado_usr = 3,
                        sn_activo = 0
                    WHERE id_usuario = %s
                      AND id_rol = 3
                      AND id_estado_usr = 2
                    RETURNING
                        id_usuario,
                        nombres,
                        apellidos,
                        id_estado_usr,
                        sn_activo;
                """, (id_usuario,))

                tutor = cur.fetchone()

                if not tutor:
                    return jsonify({
                        "ok": False,
                        "message": "El tutor no existe o no está activo."
                    }), 404

                conn.commit()

                return jsonify({
                    "ok": True,
                    "message": "Tutor dado de baja correctamente.",
                    "tutor": tutor
                }), 200

    except Exception as e:
        print("Error al dar de baja al tutor:", e)

        return jsonify({
            "ok": False,
            "message": "No fue posible dar de baja al tutor."
        }), 500
