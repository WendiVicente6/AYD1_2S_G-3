
import os
import sys

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app import app  # noqa: E402
from auth import create_token  # noqa: E402
import routes.sessions as sessions_module  # noqa: E402


# ============================================================
# HU-036: Registrar plan de estudio estructurado al atender
# estudiante (actualiza HU-023)
# ============================================================
#
# Dobles de prueba para simular psycopg sin conectarse a una base de
# datos real: get_connection() se usa como "with get_connection() as
# conn:" y luego "with conn.cursor() as cur:".


class CursorFalso:
    def __init__(self, respuestas=None):
        self.respuestas = list(respuestas or [])
        self.consultas = []

    def execute(self, sql, params=None):
        self.consultas.append((sql, params))

    def fetchone(self):
        return self.respuestas.pop(0) if self.respuestas else None

    def fetchall(self):
        return []

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


class ConexionFalsa:
    def __init__(self, cursor):
        self._cursor = cursor
        self.commit_llamado = False

    def cursor(self):
        return self._cursor

    def commit(self):
        self.commit_llamado = True

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


def simular_bd(monkeypatch, respuestas=None):
    """Reemplaza get_connection() de routes.sessions por una BD falsa."""
    cursor = CursorFalso(respuestas)
    conexion = ConexionFalsa(cursor)
    monkeypatch.setattr(sessions_module, "get_connection", lambda: conexion)
    return cursor, conexion


def headers_de(rol, id_usuario=12):
    with app.app_context():
        token = create_token({"id_usuario": id_usuario, "role": rol})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def cliente():
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


def atender(cliente, body, headers=None, id_sesion=1):
    return cliente.put(
        f"/api/tutors/sessions/{id_sesion}/attend",
        json=body,
        headers=headers if headers is not None else headers_de("tutor"),
    )


RECURSO_VALIDO = {
    "nombre": "Guía de derivadas parciales",
    "tipo": "PDF",
    "descripcion": "Leer el capítulo 3 completo.",
}


# 1. Sin token de autenticación -> 401, no se toca la BD
def test_hu036_sin_token_devuelve_401(cliente, monkeypatch):
    cursor, _ = simular_bd(monkeypatch)

    resp = atender(cliente, {"dificultades": "Confunde el orden de derivación"}, headers={})

    assert resp.status_code == 401
    assert resp.get_json()["ok"] is False
    assert cursor.consultas == []


# 2. Solo el rol tutor puede marcar una sesión como atendida
def test_hu036_rol_incorrecto_devuelve_403(cliente, monkeypatch):
    cursor, _ = simular_bd(monkeypatch)

    resp = atender(
        cliente,
        {"dificultades": "Confunde el orden de derivación"},
        headers=headers_de("student"),
    )

    assert resp.status_code == 403
    assert resp.get_json()["ok"] is False
    assert cursor.consultas == []


# 3. El campo "Dificultades identificadas" es obligatorio
def test_hu036_dificultades_obligatorias_devuelve_400(cliente, monkeypatch):
    cursor, conexion = simular_bd(monkeypatch)

    resp = atender(cliente, {"dificultades": "   ", "recursos": []})

    assert resp.status_code == 400
    assert "obligatorias" in resp.get_json()["message"].lower()
    # No debe haber llegado a consultar/actualizar la sesión en la BD.
    assert cursor.consultas == []
    assert conexion.commit_llamado is False


# 4. Cada recurso recomendado debe tener un tipo válido
#    (Texto, Video, PDF o Ejercicio)
def test_hu036_recurso_con_tipo_invalido_devuelve_400(cliente, monkeypatch):
    cursor, conexion = simular_bd(monkeypatch)

    recurso_invalido = {**RECURSO_VALIDO, "tipo": "Enlace"}
    resp = atender(
        cliente,
        {"dificultades": "Confunde el orden de derivación", "recursos": [recurso_invalido]},
    )

    assert resp.status_code == 400
    assert "tipo de recurso inválido" in resp.get_json()["message"].lower()
    assert cursor.consultas == []
    assert conexion.commit_llamado is False


# 5. Caso exitoso: la sesión pasa a "Completada" y el plan de estudio
def test_hu036_exitoso_guarda_dificultades_y_recursos(cliente, monkeypatch):
    # 1ra consulta: la sesión existe, es del tutor y está "Pendiente".
    # 2da consulta: INSERT ... RETURNING id_plan.
    cursor, conexion = simular_bd(
        monkeypatch,
        respuestas=[{"id_sesion": 7, "estado": "Pendiente"}, {"id_plan": 99}],
    )

    segundo_recurso = {
        "nombre": "Ejercicios del capítulo 4",
        "tipo": "Ejercicio",
        "descripcion": "Resolver los ejercicios 1 al 10.",
    }

    resp = atender(
        cliente,
        {
            "dificultades": "Derivadas parciales: confunde el orden de derivación.",
            "recursos": [RECURSO_VALIDO, segundo_recurso],
        },
        id_sesion=7,
    )

    assert resp.status_code == 200
    assert resp.get_json()["ok"] is True

    sql_update, _ = cursor.consultas[1]
    assert "UPDATE tsesion" in sql_update
    assert "Completada" in sql_update

    sql_plan, params_plan = cursor.consultas[2]
    assert "INSERT INTO tplan_estudio" in sql_plan
    assert params_plan == (7, "Derivadas parciales: confunde el orden de derivación.")

    sql_r1, params_r1 = cursor.consultas[3]
    sql_r2, params_r2 = cursor.consultas[4]
    assert "INSERT INTO trecurso_plan" in sql_r1
    assert params_r1 == (99, "Guía de derivadas parciales", "PDF", "Leer el capítulo 3 completo.", 1)
    assert params_r2 == (99, "Ejercicios del capítulo 4", "Ejercicio", "Resolver los ejercicios 1 al 10.", 2)

    assert conexion.commit_llamado is True
