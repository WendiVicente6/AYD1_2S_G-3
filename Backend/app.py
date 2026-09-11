import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.registration import registration_bp
from routes.schedule import schedule_bp
from routes.sessions import sessions_bp
from routes.students import students_bp
from routes.auth2 import auth2_bp

app = Flask(__name__)


# Configuración de CORS
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": os.getenv(
                "FRONTEND_URL",
                "http://localhost:5173"
            )
        }
    }
)


# Configuración JWT
app.config["JWT_SECRET_KEY"] = os.getenv(
    "JWT_SECRET_KEY",
    "dev-only-change-me"
)

app.config["JWT_EXPIRES_MINUTES"] = int(
    os.getenv("JWT_EXPIRES_MINUTES", "120")
)


# Registro de rutas
app.register_blueprint(
    auth_bp,
    url_prefix="/api/auth"
)

app.register_blueprint(
    dashboard_bp,
    url_prefix="/api"
)

app.register_blueprint(
    registration_bp,
    url_prefix="/api"
)

app.register_blueprint(
    schedule_bp,
    url_prefix="/api"
)

app.register_blueprint(
    sessions_bp,
    url_prefix="/api"
)

app.register_blueprint(
    auth2_bp, 
    url_prefix="/api"
    )

app.register_blueprint(
    students_bp,
    url_prefix="/api"
)


# Ruta para comprobar que el backend funciona
@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "message": "EduConnect API funcionando"
    })


if __name__ == "__main__":
    app.run(
        debug=True,
        port=5000
    )
