import os
from flask import Blueprint, jsonify
import psycopg2

materias_bp = Blueprint("materias", __name__, url_prefix="/api")


def get_connection():
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise RuntimeError("DATABASE_URL no está configurada.")

    return psycopg2.connect(database_url)


@materias_bp.get("/materias")
def get_materias():
    conn = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT id_materia, nombre
            FROM tmateria
            ORDER BY nombre ASC
        """)

        materias = [
            {
                "id_materia": row[0],
                "nombre": row[1]
            }
            for row in cur.fetchall()
        ]

        return jsonify({
            "ok": True,
            "materias": materias
        }), 200

    except Exception as exc:
        return jsonify({
            "ok": False,
            "message": f"No fue posible obtener las materias: {exc}"
        }), 500

    finally:
        if conn:
            conn.close()