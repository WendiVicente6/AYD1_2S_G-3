import os
import psycopg
from psycopg.rows import dict_row

def get_connection():
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL no está configurada.")
    return psycopg.connect(url, row_factory=dict_row)
