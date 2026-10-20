
import os
import sys

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app import app  # noqa: E402
from auth import create_token  # noqa: E402
import routes.sessions as sessions_module  # noqa: E402
import routes.tutor as tutor_module  # noqa: E402
from routes.sessions import validar_estrellas  # noqa: E402



class CursorFalso:
    def __init__(self, respuestas=None, filas=None):
        self.respuestas = list(respuestas or [])  
        self.filas = filas or []                  
        self.consultas = []                       

    def execute(self, sql, params=None):
        self.consultas.append((sql, params))

    def fetchone(self):
        return self.respuestas.pop(0) if self.respuestas else None

    def fetchall(self):
        return self.filas

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


def simular_bd(monkeypatch, modulo, respuestas=None, filas=None):
    """Reemplaza get_connection del módulo de rutas indicado por una BD falsa."""
    cursor = CursorFalso(respuestas, filas)
    conexion = ConexionFalsa(cursor)
    monkeypatch.setattr(modulo, "get_connection", lambda: conexion)
    return cursor, conexion


def headers_de(rol, id_usuario=10):
    with app.app_context():
        token = create_token({"id_usuario": id_usuario, "role": rol})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def cliente():
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


# ============================================================
# HU-034: Calificar atención de tutoría
# ============================================================

def calificar(cliente, body, rol="student", id_sesion=1):
    return cliente.post(f"/api/sesiones/{id_sesion}/calificar", json=body, headers=headers_de(rol))


# 1. Validación del rango de estrellas
@pytest.mark.parametrize("valor", [0, 1, 2, 3, 4, 5])
def test_hu034_validar_estrellas_acepta_enteros_de_0_a_5(valor):
    assert validar_estrellas(valor) is True


@pytest.mark.parametrize("valor", [-1, 6, 3.5, "4", None, True])
def test_hu034_validar_estrellas_rechaza_valores_invalidos(valor):
    assert validar_estrellas(valor) is False


# 2. El endpoint rechaza estrellas inválidas sin tocar la BD
def test_hu034_calificar_rechaza_estrellas_fuera_de_rango(cliente, monkeypatch):
    cursor, _ = simular_bd(monkeypatch, sessions_module)

    resp = calificar(cliente, {"estrellas": 7})

    assert resp.status_code == 400
    assert resp.get_json()["ok"] is False
    assert cursor.consultas == []


# 3. No se puede calificar una sesión cancelada o activa
@pytest.mark.parametrize("estado", ["Cancelada", "Pendiente", "Confirmada"])
def test_hu034_calificar_rechaza_sesion_no_atendida(cliente, monkeypatch, estado):
    cursor, conexion = simular_bd(monkeypatch, sessions_module, [{"estado": estado}])

    resp = calificar(cliente, {"estrellas": 4})

    assert resp.status_code == 409
    assert "atendidas" in resp.get_json()["message"]
    assert not any("INSERT" in sql for sql, _ in cursor.consultas)
    assert conexion.commit_llamado is False


# 4. No se puede calificar dos veces la misma sesión
def test_hu034_calificar_rechaza_sesion_ya_calificada(cliente, monkeypatch):
    # 1ra consulta: sesión Completada; 2da: ya existe calificación del estudiante
    _, conexion = simular_bd(monkeypatch, sessions_module, [{"estado": "Completada"}, (1,)])

    resp = calificar(cliente, {"estrellas": 5})

    assert resp.status_code == 409
    assert resp.get_json()["message"] == "Ya calificaste esta sesión."
    assert conexion.commit_llamado is False


# 5. No se puede calificar una sesión de otro estudiante
def test_hu034_calificar_rechaza_sesion_de_otro_estudiante(cliente, monkeypatch):
    # La consulta filtra por id_estudiante del token: si no es suya, no la encuentra
    cursor, _ = simular_bd(monkeypatch, sessions_module, [None])

    resp = calificar(cliente, {"estrellas": 3})

    assert resp.status_code == 404
    _, params = cursor.consultas[0]
    assert params == (1, 10)  # (id_sesion, id_estudiante del token)


# 6. Solo el rol estudiante puede calificar a un tutor
def test_hu034_calificar_rechaza_rol_tutor(cliente, monkeypatch):
    cursor, _ = simular_bd(monkeypatch, sessions_module)

    resp = calificar(cliente, {"estrellas": 3}, rol="tutor")

    assert resp.status_code == 403
    assert cursor.consultas == []


# 7. Caso exitoso: se guarda con autor = 'estudiante'
def test_hu034_calificar_exitoso_guarda_con_autor_estudiante(cliente, monkeypatch):
    cursor, conexion = simular_bd(monkeypatch, sessions_module, [{"estado": "Completada"}, None])

    resp = calificar(cliente, {"estrellas": 0, "comentario": "  Buena explicación  "})

    assert resp.status_code == 201
    assert resp.get_json()["ok"] is True

    sql_insert, params = cursor.consultas[-1]
    assert "INSERT INTO tcalificacion" in sql_insert
    assert "'estudiante'" in sql_insert
    assert params == (1, 0, "Buena explicación")  # 0 estrellas es válido y el comentario se recorta
    assert conexion.commit_llamado is True


# ============================================================
# HU-035: Reportar a un tutor
# ============================================================

REPORTE_VALIDO = {"id_tipo_reporte": 5, "explicacion": "Llegó media hora tarde"}


def reportar(cliente, body, rol="student", id_sesion=1):
    return cliente.post(f"/api/sesiones/{id_sesion}/reportar", json=body, headers=headers_de(rol))


# 1. Campos obligatorios: categoría y explicación
@pytest.mark.parametrize("body", [
    {"explicacion": "Llegó tarde"},                          # sin categoría
    {"id_tipo_reporte": "5", "explicacion": "Llegó tarde"},  # categoría no numérica
    {"id_tipo_reporte": 5},                                  # sin explicación
    {"id_tipo_reporte": 5, "explicacion": "     "},          # explicación solo con espacios
    {"id_tipo_reporte": 5, "explicacion": "x" * 501},        # explicación demasiado larga
])
def test_hu035_reportar_rechaza_datos_incompletos_o_invalidos(cliente, monkeypatch, body):
    cursor, _ = simular_bd(monkeypatch, sessions_module)

    resp = reportar(cliente, body)

    assert resp.status_code == 400
    assert resp.get_json()["ok"] is False
    assert cursor.consultas == []  # no llega a consultar la BD


# 2. Solo se reportan sesiones atendidas
@pytest.mark.parametrize("estado", ["Cancelada", "Pendiente", "Confirmada"])
def test_hu035_reportar_rechaza_sesion_no_atendida(cliente, monkeypatch, estado):
    cursor, conexion = simular_bd(monkeypatch, sessions_module, [{"estado": estado}])

    resp = reportar(cliente, REPORTE_VALIDO)

    assert resp.status_code == 409
    assert "atendidas" in resp.get_json()["message"]
    assert not any("INSERT" in sql for sql, _ in cursor.consultas)
    assert conexion.commit_llamado is False


# 3. La categoría debe ser de las que aplican a tutores
def test_hu035_reportar_rechaza_categoria_de_estudiante(cliente, monkeypatch):
    # sesión Completada, pero la categoría no existe como 'tutor'
    cursor, conexion = simular_bd(monkeypatch, sessions_module, [{"estado": "Completada"}, None])

    resp = reportar(cliente, {"id_tipo_reporte": 1, "explicacion": "x"})

    assert resp.status_code == 400
    assert resp.get_json()["message"] == "Categoría de reporte inválida."
    sql_categoria, params = cursor.consultas[1]
    assert "dirigido_a = 'tutor'" in sql_categoria
    assert params == (1,)
    assert conexion.commit_llamado is False


# 4. No se puede reportar dos veces la misma sesión
def test_hu035_reportar_rechaza_sesion_ya_reportada(cliente, monkeypatch):
    # sesión Completada, categoría válida, ya existe reporte del estudiante
    _, conexion = simular_bd(monkeypatch, sessions_module, [{"estado": "Completada"}, (1,), (1,)])

    resp = reportar(cliente, REPORTE_VALIDO)

    assert resp.status_code == 409
    assert resp.get_json()["message"] == "Ya reportaste esta sesión."
    assert conexion.commit_llamado is False


# 5. Solo el rol estudiante puede reportar a un tutor
def test_hu035_reportar_rechaza_rol_tutor(cliente, monkeypatch):
    cursor, _ = simular_bd(monkeypatch, sessions_module)

    resp = reportar(cliente, REPORTE_VALIDO, rol="tutor")

    assert resp.status_code == 403
    assert cursor.consultas == []


# 6. Caso exitoso: se guarda con autor = 'estudiante'
def test_hu035_reportar_exitoso_guarda_con_autor_estudiante(cliente, monkeypatch):
    cursor, conexion = simular_bd(monkeypatch, sessions_module, [{"estado": "Completada"}, (1,), None])

    resp = reportar(cliente, {"id_tipo_reporte": 5, "explicacion": "  Llegó tarde  "})

    assert resp.status_code == 201
    assert resp.get_json()["message"] == "Tu reporte fue enviado al administrador."

    sql_insert, params = cursor.consultas[-1]
    assert "INSERT INTO treporte" in sql_insert
    assert "'estudiante'" in sql_insert
    assert params == (1, 5, "Llegó tarde")  # la explicación se recorta
    assert conexion.commit_llamado is True


# 7. Catálogo de categorías filtrado por destinatario
@pytest.mark.parametrize("query, esperado", [
    ("", "estudiante"),                  # sin parámetro: comportamiento de HU-038
    ("?dirigido_a=tutor", "tutor"),      # HU-035
])
def test_hu035_tipos_reporte_filtra_por_destinatario(cliente, monkeypatch, query, esperado):
    filas = [{"id_tipo_reporte": 5, "txt_desc": "Ética y profesionalismo"}]
    cursor, _ = simular_bd(monkeypatch, tutor_module, filas=filas)

    resp = cliente.get(f"/api/tipos-reporte{query}")

    assert resp.status_code == 200
    assert resp.get_json()["tipos"] == filas
    _, params = cursor.consultas[0]
    assert params == (esperado,)


# 8. Destinatario inválido en el catálogo
def test_hu035_tipos_reporte_rechaza_destinatario_invalido(cliente, monkeypatch):
    cursor, _ = simular_bd(monkeypatch, tutor_module)

    resp = cliente.get("/api/tipos-reporte?dirigido_a=admin")

    assert resp.status_code == 400
    assert cursor.consultas == []
