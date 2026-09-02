import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()  

from routes.auth import auth_bp
from routes.dashboard import dashboard_bp

app = Flask(__name__)

CORS(app, resources={r"/api/*": {"origins": os.getenv("FRONTEND_URL", "http://localhost:5173")}})

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-only-change-me")
app.config["JWT_EXPIRES_MINUTES"] = int(os.getenv("JWT_EXPIRES_MINUTES", "120"))

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(dashboard_bp, url_prefix="/api")

@app.get("/api/health")
def health():
    return {"ok": True, "service": "EduConnect API"}

if __name__ == "__main__":
    app.run(debug=True, port=5000)
