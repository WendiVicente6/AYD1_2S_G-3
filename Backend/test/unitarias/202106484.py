

import pytest
from datetime import date
from flask import Flask

import routes.auth as auth_module
from routes.auth import auth_bp
from routes.registration import validate_common


@pytest.fixture
def client():
    app = Flask(__name__)
    app.register_blueprint(auth_bp)
    app.config["TESTING"] = True

    return app.test_client()


def usuario_prueba():
    return {
        "id_usuario": 1,
        "nombres": "Ana",
        "apellidos": "Lopez",
        "correo": "ana@educonnect.com",
        "password": "hash_de_prueba",
        "telefono": "55555555",
        "direccion": "Zona 1",
        "fec_nac": date(2002, 5, 15),
        "genero": "F",
        "foto": None,
        "id_rol": 2,
        "id_estado_usr": 1,
        "sn_activo": 1,
        "rol": "Estudiante",
        "estado": "Activo",
    }


# PRUEBA 1: Inicio de sesión exitoso
def test_login_exitoso(client, monkeypatch):
    monkeypatch.setattr(
        auth_module, "find_user_by_email", lambda correo: usuario_prueba()
    )
    monkeypatch.setattr(
        auth_module, "password_is_valid", lambda password, hashed: True
    )
    monkeypatch.setattr(
        auth_module, "normalize_role", lambda rol: "estudiante"
    )
    monkeypatch.setattr(
        auth_module, "create_token", lambda user: "token_de_prueba"
    )

    response = client.post("/login", json={
        "correo": "ana@educonnect.com",
        "password": "ClaveSegura123"
    })

    assert response.status_code == 200
    assert response.get_json()["ok"] is True
    assert response.get_json()["token"] == "token_de_prueba"


# PRUEBA 2: Contraseña incorrecta
def test_login_password_incorrecta(client, monkeypatch):
    monkeypatch.setattr(
        auth_module, "find_user_by_email", lambda correo: usuario_prueba()
    )
    monkeypatch.setattr(
        auth_module, "password_is_valid", lambda password, hashed: False
    )

    response = client.post("/login", json={
        "correo": "ana@educonnect.com",
        "password": "Incorrecta123"
    })

    assert response.status_code == 401
    assert response.get_json()["ok"] is False
    assert "incorrectos" in response.get_json()["message"].lower()


# PRUEBA 3: Registro con datos válidos
def test_registro_datos_validos():
    datos = {
        "nombres": "Ana",
        "apellidos": "Lopez",
        "carnet": "12345",
        "genero": "F",
        "direccion": "Zona 1",
        "fec_nac": "2002-05-15",
        "correo": "ana@educonnect.com",
        "password": "ClaveSegura123",
    }

    error = validate_common(datos)

    assert error is None


# PRUEBA 4: Inicio de sesión sin credenciales
def test_login_sin_credenciales(client):
    response = client.post("/login", json={
        "correo": "",
        "password": ""
    })

    assert response.status_code == 400
    assert response.get_json()["ok"] is False
    assert "obligatorios" in response.get_json()["message"].lower()


# PRUEBA 5: Consultar perfil sin token
def test_perfil_sin_token(client):
    response = client.get("/me")

    assert response.status_code == 401
    assert response.get_json()["ok"] is False
    assert "token" in response.get_json()["message"].lower()
