import os
import psycopg
from typing import Tuple
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL_POOLED")


class Database:
    def __init__(self):
        self.DATABASE_URL = DATABASE_URL

    def get_connection(self):
        return psycopg.connect(self.DATABASE_URL)

    def query(self, sql_query: str, query_params: Tuple | None = None, decision="fetchone"):
        params = query_params or ()

        with self.get_connection() as conn:
            with conn.cursor() as curr:
                curr.execute(sql_query, params)

                columns = [desc.name for desc in curr.description] if curr.description else []

                if decision == "fetchall":
                    rows = curr.fetchall()
                    if not rows:
                        return []
                    out = [dict(zip(columns, row)) for row in rows]
                else:
                    row = curr.fetchone()
                    if row is None:
                        return None
                    out = dict(zip(columns, row))

            conn.commit()

        return out


def get_connection():
    return psycopg.connect(DATABASE_URL)