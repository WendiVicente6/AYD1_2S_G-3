import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import pg8000
import bcrypt

app = Flask(__name__)
CORS(app , resources={r"/api/*": {"origins": "http://localhost:5173"}})


def get_db_connection():
    return pg8000.connect(
        user="postgres",
        password="@RGM123a",
        host="localhost",
        port=5432,
        database="EduConnect"
    )


@app.route("/api/test-db", methods=["GET"])
def test_db():
    conn = get_db_connection()
    conn.close()

    return jsonify({
        "mensaje": "Flask conectado correctamente con PostgreSQL"
    })


from dotenv import load_dotenv


load_dotenv()  

from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.registration import registration_bp
from routes.schedule import schedule_bp

app = Flask(__name__)

CORS(app, resources={r"/api/*": {"origins": os.getenv("FRONTEND_URL", "http://localhost:5173")}})

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-only-change-me")
app.config["JWT_EXPIRES_MINUTES"] = int(os.getenv("JWT_EXPIRES_MINUTES", "120"))

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(dashboard_bp, url_prefix="/api")
app.register_blueprint(registration_bp)
app.register_blueprint(schedule_bp, url_prefix="/api")

@app.get("/api/health")
def health():
  return jsonify({
    "status": "ok",
    "message": "EduConnect API funcionando"
  })

@app.get("/api/dashboard")
def dashboard():
  return jsonify({
      "students": 125,
      "tutors": 38,
      "sessions": 56,
      "messages": 243,
      "pending_students": 14,
      "pending_tutors": 6
  })

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()

    correo = data.get("correo")
    password = data.get("password")

    if not correo or not password:
        return jsonify({
            "error": "Correo y contraseña son obligatorios"
        }), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id_usuario, id_rol, password, sn_activo
        FROM tusuario
        WHERE correo = %s
    """, (correo,))

    usuario = cursor.fetchone()

    cursor.close()
    conn.close()

    if not usuario:
        return jsonify({
            "error": "Credenciales incorrectas"
        }), 401

    id_usuario, id_rol, password_hash, sn_activo = usuario

    if sn_activo != 1:
        return jsonify({
            "error": "El usuario está inactivo"
        }), 403

    if id_rol != 1:
        return jsonify({
            "error": "El usuario no tiene permisos de administrador"
        }), 403

    password_correcta = bcrypt.checkpw(
        password.encode("utf-8"),
        password_hash.encode("utf-8")
    )

    if not password_correcta:
        return jsonify({
            "error": "Credenciales incorrectas"
        }), 401

    return jsonify({
        "mensaje": "Primera autenticación correcta",
        "requiere_segunda_autenticacion": True
    }), 200


@app.route("/api/auth2", methods=["POST"])
def auth2():
    if "archivo" not in request.files:
        return jsonify({
            "error": "Debe seleccionar el archivo de autenticación"
        }), 400

    archivo = request.files["archivo"]

    if archivo.filename != "auth2-ayd1.txt":
        return jsonify({
            "error": "El archivo debe llamarse exactamente auth2-ayd1.txt"
        }), 400

    contenido = archivo.read().decode("utf-8").strip()

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT password_auth2
        FROM tusuario
        WHERE id_usuario = 1
          AND id_rol = 1
          AND sn_activo = 1
    """)

    resultado = cursor.fetchone()

    cursor.close()
    conn.close()

    if not resultado:
        return jsonify({
            "error": "No se encontró la configuración de autenticación"
        }), 500



    password_auth2_hash = resultado[0]

    #print("CONTENIDO ARCHIVO:", repr(contenido))
    #print("LONGITUD CONTENIDO:", len(contenido))
    #print("¿COINCIDEN?:", contenido == password_auth2_hash)

    if contenido != password_auth2_hash:
        return jsonify({
            "error": "El contenido del archivo no es válido"
        }), 401

    return jsonify({
        "mensaje": "Segunda autenticación correcta",
        "autenticado": True
    }), 200

if __name__ == "__main__":
    app.run(debug=True, port=5000)

