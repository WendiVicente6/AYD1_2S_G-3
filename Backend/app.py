from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.get("/")
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



if __name__ == "__main__":
  # debug=True reinicia el servidor automáticamente al guardar cambios
  app.run(debug=True, port=5000)
