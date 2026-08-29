from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})


@app.route("/api/health", methods=["GET"])
def health_check():
  return jsonify({"status": "healthy", "message": "Flask conectado con éxito"})


# Ruta para simular obtención de datos
@app.route("/api/tareas", methods=["GET"])
def get_tareas():
  tareas = [
      {"id": 1, "titulo": "Aprender Flask", "completada": True},
      {"id": 2, "titulo": "Conectar React", "completada": False},
  ]
  return jsonify(tareas)


if __name__ == "__main__":
  # debug=True reinicia el servidor automáticamente al guardar cambios
  app.run(debug=True, port=5000)
