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

    def query(self, sql_query: str, query_params: Tuple, decision="fetchone"):
        with get_connection() as conn:
            with conn.cursor() as curr:
                curr.execute(
                    sql_query, query_params
                )

                
                out = curr.fetchone()
                if decision!="fetchone":
                    out = curr.fetchall()
            conn.commit()
        return out


def get_connection():
    return psycopg.connect(DATABASE_URL)