
import os
import sys
from datetime import date, time

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app import app  # noqa: E402
from auth import create_token  # noqa: E402
import routes.schedule as schedule_module  # noqa: E402
import routes.tutor as tutor_module  # noqa: E402


# ============================================================
# Módulo Tutor: HU-026 (actualizar horarios de atención),
# HU-037 (calificar estudiante) y HU-038 (reportar estudiante)
# ============================================================
#
# Dobles de prueba para simular psycopg sin conectarse a una base de
# datos real. Cada fetchone()/fetchall() entrega, en orden, uno de los
# resultados predefinidos de la prueba.


class CursorFalso:
    def __init__(self, respuestas=None):
        self.respuestas = list(respuestas or [])
        self.consultas = []

    def execute(self, sql, params=None):
        self.consultas.append((" ".join(sql.split()), params))

    def fetchone(self):
        return self.respuestas.pop(0)

    def fetchall(self):
        return self.respuestas.pop(0)

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


def simular_bd(monkeypatch, modulo, respuestas=None):
    """Reemplaza get_connection() del módulo indicado por una BD falsa."""
    cursor = CursorFalso(respuestas)
    conexion = ConexionFalsa(cursor)
    monkeypatch.setattr(modulo, "get_connection", lambda: conexion)
    return cursor, conexion


def headers_de_tutor(id_usuario=2):
    with app.app_context():
        token = create_token({"id_usuario": id_usuario, "role": "tutor"})
    return {"Authorization": f"Bearer {token}"}


def sentencias(cursor, inicio):
    """Sentencias SQL ejecutadas que empiezan con el texto indicado."""
    return [(sql, params) for sql, params in cursor.consultas if sql.startswith(inicio)]


@pytest.fixture
def cliente():
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


URL_HORARIO = "/api/tutors/schedule"
URL_CALIFICAR = "/api/tutor/sesiones/1/calificar"
URL_REPORTAR = "/api/tutor/sesiones/1/reportar"


# 1. HU-026: si el nuevo horario deja sesiones activas fuera del rango,
#    el cambio se bloquea con 409 y no se modifica nada.
#    Caso: el tutor quita el viernes pero tiene una sesión activa el
#    viernes 11/09/2026 de 10:00 a 11:00.
#    Esperado: 409 con el detalle de la sesión, sin UPDATE ni commit.
def test_hu026_actualizar_horario_con_sesiones_en_conflicto_devuelve_409(cliente, monkeypatch):
    cursor, conexion = simular_bd(
        monkeypatch,
        schedule_module,
        respuestas=[
            {"id_horario": 1},
            [{"fec_sesion": date(2026, 9, 11), "hora_inicio": time(10, 0), "hora_final": time(11, 0)}],
        ],
    )

    resp = cliente.put(
        URL_HORARIO,
        json={"dias": [1, 3], "hora_inicio": "08:00", "hora_fin": "17:00"},
        headers=headers_de_tutor(),
    )

    assert resp.status_code == 409
    mensaje = resp.get_json()["message"]
    assert "sesiones activas fuera del nuevo horario" in mensaje
    assert "2026-09-11 10:00-11:00" in mensaje
    assert sentencias(cursor, "UPDATE") == []
    assert conexion.commit_llamado is False


# 2. HU-026: sin conflictos, el horario se actualiza correctamente.
#    Caso: el tutor pasa a lunes, miércoles y viernes de 08:00 a 17:00
#    y no tiene sesiones activas fuera de ese rango.
#    Esperado: 200, 1 UPDATE de horas, 1 DELETE y 3 INSERT de días, commit.
def test_hu026_actualizar_horario_sin_conflictos_devuelve_200(cliente, monkeypatch):
    cursor, conexion = simular_bd(
        monkeypatch,
        schedule_module,
        respuestas=[{"id_horario": 1}, []],
    )

    resp = cliente.put(
        URL_HORARIO,
        json={"dias": [1, 3, 5], "hora_inicio": "08:00", "hora_fin": "17:00"},
        headers=headers_de_tutor(),
    )

    assert resp.status_code == 200
    assert resp.get_json()["message"] == "Horario actualizado correctamente."
    assert len(sentencias(cursor, "UPDATE thorario_atencion")) == 1
    assert len(sentencias(cursor, "DELETE FROM thorario_dia")) == 1
    assert len(sentencias(cursor, "INSERT INTO thorario_dia")) == 3
    assert conexion.commit_llamado is True


# 3. HU-037: la calificación debe ser un entero entre 0 y 5.
#    Caso: se envían valores inválidos (negativo, mayor a 5, muy grande,
#    texto y vacío).
#    Esperado: 400 con el mensaje de rango, sin tocar la BD en ningún caso.
def test_hu037_calificar_con_estrellas_fuera_de_rango_devuelve_400(cliente, monkeypatch):
    cursor, conexion = simular_bd(monkeypatch, tutor_module)

    for estrellas_invalidas in (-1, 6, 100, "5", None):
        resp = cliente.post(
            URL_CALIFICAR,
            json={"estrellas": estrellas_invalidas},
            headers=headers_de_tutor(),
        )

        assert resp.status_code == 400, f"valor aceptado por error: {estrellas_invalidas!r}"
        assert "entre 0 y 5" in resp.get_json()["message"]

    assert cursor.consultas == []
    assert conexion.commit_llamado is False


# 4. HU-037: una sesión no puede calificarse dos veces.
#    Caso: la sesión está Completada pero ya tiene una calificación.
#    Esperado: 409 "Esta sesión ya fue calificada." y ningún INSERT.
def test_hu037_calificar_sesion_ya_calificada_devuelve_409(cliente, monkeypatch):
    cursor, conexion = simular_bd(
        monkeypatch,
        tutor_module,
        respuestas=[
            {"id_sesion": 1, "estado": "Completada"},
            {"?column?": 1},
        ],
    )

    resp = cliente.post(
        URL_CALIFICAR,
        json={"estrellas": 5, "comentario": "Excelente"},
        headers=headers_de_tutor(),
    )

    assert resp.status_code == 409
    assert resp.get_json()["message"] == "Esta sesión ya fue calificada."
    assert sentencias(cursor, "INSERT") == []
    assert conexion.commit_llamado is False


# 5. HU-038: solo se puede reportar a un estudiante de una sesión Completada.
#    Caso: la sesión sigue en estado Pendiente.
#    Esperado: 409 indicando el estado actual y ningún INSERT en treporte.
def test_hu038_reportar_sesion_no_completada_devuelve_409(cliente, monkeypatch):
    cursor, conexion = simular_bd(
        monkeypatch,
        tutor_module,
        respuestas=[{"id_sesion": 1, "estado": "Pendiente"}],
    )

    resp = cliente.post(
        URL_REPORTAR,
        json={"id_tipo_reporte": 1, "explicacion": "No respetó el horario acordado."},
        headers=headers_de_tutor(),
    )

    assert resp.status_code == 409
    mensaje = resp.get_json()["message"]
    assert "'Pendiente'" in mensaje
    assert "Solo se pueden calificar o reportar sesiones completadas" in mensaje
    assert sentencias(cursor, "INSERT") == []
    assert conexion.commit_llamado is False


# 6. HU-037: caso exitoso. La calificación se guarda y el comentario se
#    recorta.
#    Caso: sesión Completada sin calificación previa, 4 estrellas y un
#    comentario con espacios sobrantes.
#    Esperado: 201, un INSERT en tcalificacion con (1, 4, "Buen trabajo")
#    y commit.
def test_hu037_calificar_exitoso_guarda_la_calificacion(cliente, monkeypatch):
    cursor, conexion = simular_bd(
        monkeypatch,
        tutor_module,
        respuestas=[
            {"id_sesion": 1, "estado": "Completada"},
            None,
        ],
    )

    resp = cliente.post(
        URL_CALIFICAR,
        json={"estrellas": 4, "comentario": "  Buen trabajo  "},
        headers=headers_de_tutor(),
    )

    assert resp.status_code == 201
    assert resp.get_json()["message"] == "Estudiante calificado correctamente."

    inserts = sentencias(cursor, "INSERT INTO tcalificacion")
    assert len(inserts) == 1
    assert inserts[0][1] == (1, 4, "Buen trabajo")
    assert conexion.commit_llamado is True
