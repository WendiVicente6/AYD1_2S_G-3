
import pytest
from flask import Flask

import routes.sessions as sessions_module
from routes.sessions import sessions_bp


@pytest.fixture
def client():
    app = Flask(__name__)
    app.register_blueprint(sessions_bp)
    app.config["TESTING"] = True

    return app.test_client()


# ---------------------------------------------------------------------------
# Dobles de prueba para simular psycopg sin conectarse a una base de datos
# real: get_connection() se usa como "with get_connection() as conn:" y
# luego "with conn.cursor() as cur:", así que ambos deben comportarse como
# context managers.
# ---------------------------------------------------------------------------

class FakeCursor:
    def __init__(self, fetchone_result=None, fetchall_result=None):
        self.fetchone_result = fetchone_result
        self.fetchall_result = fetchall_result or []
        self.queries_ejecutadas = []

    def execute(self, query, params=None):
        self.queries_ejecutadas.append((query, params))

    def fetchone(self):
        return self.fetchone_result

    def fetchall(self):
        return self.fetchall_result

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False


class FakeConnection:
    def __init__(self, cursor):
        self._cursor = cursor

    def cursor(self):
        return self._cursor

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False


def payload_estudiante(id_sub="2"):
    return {"sub": id_sub, "role": "student"}


# PRUEBA 1: Sin token de autenticación -> 401
def test_sin_token_devuelve_401(client):
    response = client.get("/sesiones/6/plan-estudio")

    assert response.status_code == 401
    assert response.get_json()["ok"] is False
    assert "autenticado" in response.get_json()["message"].lower()


# PRUEBA 2: Rol distinto a "student" (por ejemplo un tutor) -> 403
def test_rol_incorrecto_devuelve_403(client, monkeypatch):
    monkeypatch.setattr(
        sessions_module, "decode_token", lambda token: {"sub": "3", "role": "tutor"}
    )

    response = client.get(
        "/sesiones/6/plan-estudio",
        headers={"Authorization": "Bearer token_de_prueba"},
    )

    assert response.status_code == 403
    assert response.get_json()["ok"] is False
    assert "permisos" in response.get_json()["message"].lower()


# PRUEBA 3: La sesión no existe en la base de datos -> 404
def test_sesion_no_existe_devuelve_404(client, monkeypatch):
    monkeypatch.setattr(
        sessions_module, "decode_token", lambda token: payload_estudiante()
    )

    cursor_falso = FakeCursor(fetchone_result=None)
    monkeypatch.setattr(
        sessions_module, "get_connection", lambda: FakeConnection(cursor_falso)
    )

    response = client.get(
        "/sesiones/999/plan-estudio",
        headers={"Authorization": "Bearer token_de_prueba"},
    )

    assert response.status_code == 404
    assert response.get_json()["ok"] is False
    assert "no existe" in response.get_json()["message"].lower()


# PRUEBA 4: La sesión existe pero pertenece a otro estudiante -> 403
def test_sesion_de_otro_estudiante_devuelve_403(client, monkeypatch):
    monkeypatch.setattr(
        sessions_module, "decode_token", lambda token: payload_estudiante(id_sub="2")
    )

    cursor_falso = FakeCursor(fetchone_result={"id_estudiante": 99})
    monkeypatch.setattr(
        sessions_module, "get_connection", lambda: FakeConnection(cursor_falso)
    )

    response = client.get(
        "/sesiones/6/plan-estudio",
        headers={"Authorization": "Bearer token_de_prueba"},
    )

    assert response.status_code == 403
    assert response.get_json()["ok"] is False
    assert "acceso" in response.get_json()["message"].lower()


# PRUEBA 5: Plan de estudio existente -> 200 con los datos correctos
def test_plan_existente_devuelve_datos_correctos(client, monkeypatch):
    monkeypatch.setattr(
        sessions_module, "decode_token", lambda token: payload_estudiante(id_sub="2")
    )

    from datetime import date

    filas_simuladas = [
        {
            "fec_sesion": date(2026, 10, 6),
            "tutor_nombres": "Jose",
            "tutor_apellidos": "Lopez",
            "tutor_nro_id": 234567891,
            "tutor_especialidad": "Bases de Datos",
            "id_plan": 1,
            "dificultades": "Derivadas parciales: confunde el orden de derivación.",
            "id_recurso": 1,
            "nombre_recurso": "Guía de derivadas parciales",
            "tipo_recurso": "PDF",
            "descripcion_uso": "Leer el capítulo 3 completo.",
            "orden": 1,
        },
        {
            "fec_sesion": date(2026, 10, 6),
            "tutor_nombres": "Jose",
            "tutor_apellidos": "Lopez",
            "tutor_nro_id": 234567891,
            "tutor_especialidad": "Bases de Datos",
            "id_plan": 1,
            "dificultades": "Derivadas parciales: confunde el orden de derivación.",
            "id_recurso": 2,
            "nombre_recurso": "Ejercicios del capítulo 4",
            "tipo_recurso": "Texto",
            "descripcion_uso": "Resolver los ejercicios 1 al 10.",
            "orden": 2,
        },
    ]

    cursor_falso = FakeCursor(
        fetchone_result={"id_estudiante": 2},
        fetchall_result=filas_simuladas,
    )
    monkeypatch.setattr(
        sessions_module, "get_connection", lambda: FakeConnection(cursor_falso)
    )

    response = client.get(
        "/sesiones/6/plan-estudio",
        headers={"Authorization": "Bearer token_de_prueba"},
    )
    data = response.get_json()

    assert response.status_code == 200
    assert data["ok"] is True
    assert data["plan"]["tutor_nombre"] == "Jose Lopez"
    assert data["plan"]["tutor_especialidad"] == "Bases de Datos"
    assert data["plan"]["dificultades"].startswith("Derivadas parciales")
    assert len(data["plan"]["recursos"]) == 2
    assert data["plan"]["recursos"][0]["tipo_recurso"] == "PDF"
