from flask import Blueprint, jsonify, Response, request
from conexion.db import get_connection

admin_bp = Blueprint("admin", __name__)


@admin_bp.get("/estudiantes/<int:id_usuario>/carnet-pdf")
def obtener_carnet_pdf(id_usuario):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT carnet_pdf, carnet_pdf_nombre
                    FROM tusuario
                    WHERE id_usuario = %s
                      AND id_rol = 2
                      AND id_estado_usr = 1;
                """, (id_usuario,))

                documento = cur.fetchone()

                if not documento or not documento["carnet_pdf"]:
                    return jsonify({
                        "ok": False,
                        "message": "No se encontró el PDF de la solicitud."
                    }), 404

                pdf_bytes = bytes(documento["carnet_pdf"])
                nombre_pdf = (
                    documento["carnet_pdf_nombre"] or "carnet.pdf"
                )
                nombre_pdf = (
                    nombre_pdf
                    .replace('"', "")
                    .replace("\r", "")
                    .replace("\n", "")
                )

                return Response(
                    pdf_bytes,
                    mimetype="application/pdf",
                    headers={
                        "Content-Disposition": (
                            f'inline; filename="{nombre_pdf}"'
                        ),
                        "X-Content-Type-Options": "nosniff"
                    }
                )

    except Exception as e:
        print("Error al obtener el PDF del estudiante:", e)

        return jsonify({
            "ok": False,
            "message": "No fue posible obtener el PDF."
        }), 500


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




@admin_bp.get("/estudiantes")
def estudiantes_activos():
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
                      AND u.id_estado_usr = 2
                    ORDER BY u.id_usuario;
                """)

                estudiantes = cur.fetchall()

                return jsonify({
                    "ok": True,
                    "estudiantes": estudiantes
                }), 200

    except Exception as e:
        print("Error al obtener estudiantes activos:", e)

        return jsonify({
            "ok": False,
            "message": "No fue posible obtener los estudiantes activos."
        }), 500



@admin_bp.patch("/estudiantes/<int:id_usuario>/baja")
def dar_baja_estudiante(id_usuario):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE tusuario
                    SET
                        id_estado_usr = 3,
                        sn_activo = 0
                    WHERE id_usuario = %s
                      AND id_rol = 2
                      AND id_estado_usr = 2
                    RETURNING
                        id_usuario,
                        nombres,
                        apellidos,
                        id_estado_usr,
                        sn_activo;
                """, (id_usuario,))

                estudiante = cur.fetchone()

                if not estudiante:
                    return jsonify({
                        "ok": False,
                        "message": "El estudiante no existe o no está activo."
                    }), 404

                conn.commit()

                return jsonify({
                    "ok": True,
                    "message": "Estudiante dado de baja correctamente.",
                    "estudiante": estudiante
                }), 200

    except Exception as e:
        print("Error al dar de baja al estudiante:", e)

        return jsonify({
            "ok": False,
            "message": "No fue posible dar de baja al estudiante."
        }), 500



@admin_bp.put("/estudiantes/<int:id_usuario>")
def actualizar_estudiante(id_usuario):
    try:
        datos = request.get_json(silent=True)

        if not isinstance(datos, dict):
            return jsonify({
                "ok": False,
                "message": "Debe enviar los datos del estudiante."
            }), 400

        campos = [
            "nombres",
            "apellidos",
            "carnet",
            "genero",
            "direccion",
            "telefono",
            "fec_nac",
            "correo"
        ]

        faltantes = [
            campo for campo in campos
            if campo not in datos
        ]

        if faltantes:
            return jsonify({
                "ok": False,
                "message": "Faltan campos obligatorios.",
                "campos": faltantes
            }), 400

        valores = {
            campo: datos[campo]
            for campo in campos
        }

        for campo in campos:
            valor = valores[campo]

            if valor is None or (
                isinstance(valor, str) and not valor.strip()
            ):
                return jsonify({
                    "ok": False,
                    "message": "El campo {campo} es obligatorio."
                }), 400

            if isinstance(valor, str):
                valores[campo] = valor.strip()

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE tusuario
                    SET
                        nombres = %s,
                        apellidos = %s,
                        carnet = %s,
                        genero = %s,
                        direccion = %s,
                        telefono = %s,
                        fec_nac = %s::date,
                        correo = %s
                   WHERE id_usuario = %s
                      AND id_rol = 2
                      AND id_estado_usr = 2
                    RETURNING
                        id_usuario,
                        nombres,
                        apellidos,
                        carnet,
                        genero,
                        direccion,
                        telefono,
                        fec_nac,
                        correo,
                        id_estado_usr;
                """, (
                    valores["nombres"],
                    valores["apellidos"],
                    valores["carnet"],
                    valores["genero"],
                    valores["direccion"],
                    valores["telefono"],
                    valores["fec_nac"],
                    valores["correo"],
                    id_usuario
                ))

                estudiante = cur.fetchone()

                if not estudiante:
                    return jsonify({
                        "ok": False,
                        "message": (
                            "El estudiante no existe "
                            "o no está activo."
                        )
                    }), 404

                conn.commit()

                return jsonify({
                    "ok": True,
                    "message": "Estudiante actualizado correctamente.",
                    "estudiante": estudiante
                }), 200

    except Exception as e:
        print("Error al actualizar estudiante:", e)

        return jsonify({
            "ok": False,
            "message": "No fue posible actualizar al estudiante."
        }), 500
