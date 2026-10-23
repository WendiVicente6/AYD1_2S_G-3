
import sys
from pathlib import Path

import pytest
from flask import Flask

# Agregar Backend al path para importar las rutas y la conexión.
BACKEND_DIR = Path(__file__).resolve().parents[2]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from routes import adminstudent


@pytest.fixture
def client():
    """Crear un cliente Flask con las rutas de administración."""
    app = Flask(__name__)
    app.register_blueprint(
        adminstudent.admin_bp,
        url_prefix="/api/admin"
    )
    app.config["TESTING"] = True

    with app.test_client() as cliente:
        yield cliente


class FakeCursor:
    """Simular el cursor de PostgreSQL."""

    def __init__(self, fetchone_result=None, fetchall_result=None):
        self.fetchone_result = fetchone_result
        self.fetchall_result = fetchall_result or []
        self.query = None
        self.params = None

    def execute(self, query, params=None):
        self.query = query
        self.params = params

    def fetchone(self):
        return self.fetchone_result

    def fetchall(self):
        return self.fetchall_result

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False


class FakeConnection:
    """Simular la conexión y el commit de PostgreSQL."""

    def __init__(self, cursor):
        self.fake_cursor = cursor
        self.committed = False

    def cursor(self):
        return self.fake_cursor

    def commit(self):
        self.committed = True

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False


def datos_estudiante():
    """Datos válidos para actualizar un estudiante."""
    return {
        "nombres": "Ana María",
        "apellidos": "López Pérez",
        "carnet": "202400001",
        "genero": "Femenino",
        "direccion": "Zona 1",
        "telefono": "55551234",
        "fec_nac": "2000-01-15",
        "correo": "ana@example.com"
    }


def test_consultar_estudiantes_activos_exitoso(client, monkeypatch):
    """HU: consultar estudiantes activos devuelve HTTP 200."""
    estudiantes = [
        {
            "id_usuario": 10,
            "nombres": "Ana",
            "apellidos": "López",
            "correo": "ana@example.com",
            "id_estado_usr": 2,
            "estado": "Activo"
        }
    ]

    cursor = FakeCursor(fetchall_result=estudiantes)
    conexion = FakeConnection(cursor)

    monkeypatch.setattr(
        adminstudent,
        "get_connection",
        lambda: conexion
    )

    respuesta = client.get("/api/admin/estudiantes")

    assert respuesta.status_code == 200
    assert respuesta.get_json()["ok"] is True
    assert respuesta.get_json()["estudiantes"] == estudiantes
    assert conexion.committed is False


def test_consultar_estudiantes_error_base_datos(client, monkeypatch):
    """La consulta devuelve HTTP 500 si falla la conexión."""

    def conexion_con_error():
        raise RuntimeError("Error simulado de base de datos")

    monkeypatch.setattr(
        adminstudent,
        "get_connection",
        conexion_con_error
    )

    respuesta = client.get("/api/admin/estudiantes")

    assert respuesta.status_code == 500
    assert respuesta.get_json()["ok"] is False
    assert "No fue posible obtener" in respuesta.get_json()["message"]


def test_dar_baja_estudiante_inexistente(client, monkeypatch):
    """Dar de baja un estudiante inexistente devuelve HTTP 404."""
    cursor = FakeCursor(fetchone_result=None)
    conexion = FakeConnection(cursor)

    monkeypatch.setattr(
        adminstudent,
        "get_connection",
        lambda: conexion
    )

    respuesta = client.patch("/api/admin/estudiantes/999/baja")

    assert respuesta.status_code == 404
    assert respuesta.get_json()["ok"] is False
    assert conexion.committed is False


def test_actualizar_estudiante_datos_incompletos(client, monkeypatch):
    """Actualizar con campos faltantes devuelve HTTP 400."""
    respuesta = client.put(
        "/api/admin/estudiantes/10",
        json={"nombres": "Ana"}
    )

    assert respuesta.status_code == 400
    assert respuesta.get_json()["ok"] is False
    assert "Faltan campos obligatorios" in respuesta.get_json()["message"]


def test_actualizar_estudiante_exitoso(client, monkeypatch):
    """Actualizar un estudiante válido devuelve HTTP 200."""
    estudiante_actualizado = {
        "id_usuario": 10,
        "nombres": "Ana María",
        "apellidos": "López Pérez",
        "carnet": "202400001",
        "genero": "Femenino",
        "direccion": "Zona 1",
        "telefono": "55551234",
        "fec_nac": "2000-01-15",
        "correo": "ana@example.com",
        "id_estado_usr": 2
    }

    cursor = FakeCursor(fetchone_result=estudiante_actualizado)
    conexion = FakeConnection(cursor)

    monkeypatch.setattr(
        adminstudent,
        "get_connection",
        lambda: conexion
    )

    respuesta = client.put(
        "/api/admin/estudiantes/10",
        json=datos_estudiante()
    )

    resultado = respuesta.get_json()

    assert respuesta.status_code == 200
    assert resultado["ok"] is True
    assert resultado["estudiante"]["id_usuario"] == 10
    assert resultado["estudiante"]["nombres"] == "Ana María"
    assert conexion.committed is True
    assert cursor.params[-1] == 10
