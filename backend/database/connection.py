import os
import socket
import urllib.parse
from typing import Tuple
from pathlib import Path
from dotenv import load_dotenv
import psycopg

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL_POOLED")


def get_resolved_conn_string(url: str | None) -> str:
    if not url:
        return ""
    try:
        parsed = urllib.parse.urlparse(url)
        if parsed.hostname and not parsed.hostname.replace(".", "").isdigit():
            # Resolve IPv4 to avoid IPv6 unreachable errors on Linux hosts
            ipv4 = socket.gethostbyname(parsed.hostname)
            delimiter = "&" if "?" in url else "?"
            return f"{url}{delimiter}hostaddr={ipv4}"
    except Exception:
        pass
    return url


class Database:
    def __init__(self):
        self.DATABASE_URL = DATABASE_URL

    def get_connection(self):
        conn_str = get_resolved_conn_string(self.DATABASE_URL)
        return psycopg.connect(conn_str)

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
    conn_str = get_resolved_conn_string(DATABASE_URL)
    return psycopg.connect(conn_str)