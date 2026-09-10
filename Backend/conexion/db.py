





import os

import psycopg

from psycopg.rows import dict_row


def get_connection():
    url = os.getenv("DATABASE_URL")

    if not url:
        raise RuntimeError("DATABASE_URL no está configurada.")

    # DEBUG TEMPORAL: muestra la URL sin revelar la contraseña
    try:
        parte = url.split("://", 1)[1]
        usuario = parte.split(":", 1)[0]
        resto = parte.split("@", 1)[1]
        print(f"DATABASE_URL detectada: postgresql://{usuario}:********@{resto}")
    except Exception:
        print("DATABASE_URL detectada: formato no esperado")

    return psycopg.connect(url, row_factory=dict_row)
