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


_HOST_CACHE: dict[str, str] = {}

def resolve_hostname_ipv4(hostname: str) -> str | None:
    if not hostname or hostname.replace(".", "").isdigit():
        return hostname
    if hostname in _HOST_CACHE:
        return _HOST_CACHE[hostname]
    try:
        ipv4 = socket.gethostbyname(hostname)
        _HOST_CACHE[hostname] = ipv4
        return ipv4
    except Exception:
        pass
    # Resilient fallback via DNS-over-HTTPS for WSL/container environments
    import json
    import urllib.request
    for endpoint in [
        f"https://dns.google/resolve?name={hostname}",
        f"https://cloudflare-dns.com/dns-query?name={hostname}&type=A",
    ]:
        try:
            req = urllib.request.Request(endpoint, headers={"Accept": "application/dns-json"})
            with urllib.request.urlopen(req, timeout=3) as resp:
                data = json.loads(resp.read().decode())
                if "Answer" in data:
                    for ans in data["Answer"]:
                        ip = ans.get("data")
                        if ip and not ip.endswith("."):
                            _HOST_CACHE[hostname] = ip
                            return ip
        except Exception:
            continue
    return None


def get_resolved_conn_string(url: str | None) -> str:
    if not url:
        return ""
    try:
        parsed = urllib.parse.urlparse(url)
        if parsed.hostname and not parsed.hostname.replace(".", "").isdigit():
            ipv4 = resolve_hostname_ipv4(parsed.hostname)
            if ipv4:
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

                if curr.description is None:
                    conn.commit()
                    return None

                columns = [desc.name for desc in curr.description]

                if decision == "fetchall":
                    rows = curr.fetchall()
                    if not rows:
                        out = []
                    else:
                        out = [dict(zip(columns, row)) for row in rows]
                else:
                    row = curr.fetchone()
                    if row is None:
                        out = None
                    else:
                        out = dict(zip(columns, row))

            conn.commit()

        return out


def get_connection():
    conn_str = get_resolved_conn_string(DATABASE_URL)
    return psycopg.connect(conn_str)