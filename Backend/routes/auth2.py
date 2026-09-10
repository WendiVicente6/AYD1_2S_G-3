from flask import Blueprint, jsonify, request
import os

auth2_bp = Blueprint("auth2", __name__)

NOMBRE_ARCHIVO_AUTH2 = "auth2-ayd1.txt"


@auth2_bp.post("/api/auth2")
def auth2():
    # Verificar que se haya enviado un archivo
    if "archivo" not in request.files:
        return jsonify({
            "ok": False,
            "error": "No se recibió el archivo de autenticación."
        }), 400



    archivo = request.files["archivo"]

    # Verificar que tenga nombre
    if not archivo.filename:
        return jsonify({
            "ok": False,
            "error": "Debe seleccionar un archivo."
        }), 400

    # Verificar nombre exacto
    if archivo.filename != NOMBRE_ARCHIVO_AUTH2:
        return jsonify({
            "ok": False,
            "error": f"El archivo debe llamarse exactamente {NOMBRE_ARCHIVO_AUTH2}."
        }), 400

    try:
        # Leer el contenido del archivo
        contenido = archivo.read().decode("utf-8").strip()

        # Obtener el valor esperado desde una variable de entorno
        auth2_secret = os.getenv("AUTH2_SECRET")

            

        if not auth2_secret:
            return jsonify({
                "ok": False,
                "error": "La segunda autenticación no está configurada en el servidor."
            }), 500

        # Comparar contenido
        if contenido != auth2_secret:
            return jsonify({
                "ok": False,
                "error": "El archivo de autenticación no es válido."
            }), 401

        return jsonify({
            "ok": True,
            "message": "Segunda autenticación exitosa."
        }), 200

    except UnicodeDecodeError:
        return jsonify({
            "ok": False,
            "error": "El archivo no tiene un formato de texto válido."
        }), 400

    except Exception as e:
        print("ERROR AUTH2:", type(e).__name__, str(e))

        return jsonify({
            "ok": False,
            "error": "Error interno durante la segunda autenticación."
        }), 500

    