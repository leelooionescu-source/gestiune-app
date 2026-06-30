"""Database access layer.

The app was originally written for SQLite, but SQLite cannot work on a
serverless host like Vercel (read-only, ephemeral filesystem). To make the
deployed app persist data, this module connects to Postgres (Supabase) when a
``DATABASE_URL`` environment variable is present, and falls back to SQLite for
local development when it is not.

To keep the change small, the Postgres path exposes a thin compatibility shim
that mimics the small slice of the ``sqlite3`` API the app actually uses:

    db = get_db()
    row  = db.execute("SELECT * FROM clienti WHERE id = ?", (cid,)).fetchone()
    rows = db.execute("SELECT * FROM clienti").fetchall()
    db.commit()
    db.close()

Rows are returned as dict-like objects so ``row['coloana']`` keeps working, and
SQLite ``?`` placeholders are translated to psycopg2 ``%s`` automatically, so the
~80 queries in ``app.py`` / ``models.py`` do not need to change.
"""

import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gestiune.db')

DATABASE_URL = os.environ.get('DATABASE_URL')
USE_POSTGRES = bool(DATABASE_URL)


# --------------------------------------------------------------------------- #
# Postgres compatibility shim
# --------------------------------------------------------------------------- #

def _translate(sql, has_params):
    """Translate SQLite-style SQL to psycopg2-style.

    ``?`` placeholders become ``%s``. Any literal ``%`` is escaped to ``%%`` so
    psycopg2's own parameter formatting does not misinterpret it -- but only
    when parameters are actually supplied (psycopg2 does not run formatting when
    ``params`` is ``None``).
    """
    if has_params:
        sql = sql.replace('%', '%%')
    return sql.replace('?', '%s')


class _Result:
    """Wraps an executed cursor so ``.fetchone()`` / ``.fetchall()`` chain."""

    def __init__(self, cursor):
        self._cursor = cursor

    def fetchone(self):
        import psycopg2
        try:
            return self._cursor.fetchone()
        except psycopg2.ProgrammingError:
            # Called after a statement that returns no rows (INSERT/UPDATE/DDL).
            return None

    def fetchall(self):
        import psycopg2
        try:
            return self._cursor.fetchall()
        except psycopg2.ProgrammingError:
            return []


class _PgConnection:
    """Minimal sqlite3-connection lookalike backed by psycopg2."""

    def __init__(self, conn):
        self._conn = conn

    def execute(self, sql, params=None):
        from psycopg2.extras import RealDictCursor
        cur = self._conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(_translate(sql, params is not None), params)
        return _Result(cur)

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()


# --------------------------------------------------------------------------- #
# Public API
# --------------------------------------------------------------------------- #

def get_db():
    if USE_POSTGRES:
        import psycopg2
        # DATABASE_URL points at the Supabase connection pooler and carries
        # ?sslmode=require. A fresh connection per request is fine because the
        # pooler (PgBouncer) absorbs the connect churn.
        conn = psycopg2.connect(DATABASE_URL, connect_timeout=10)
        return _PgConnection(conn)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """Create the schema.

    Under Postgres this is a no-op: the schema is applied once, out of band, via
    ``seed_admin.py`` or the Supabase SQL editor (see ``supabase/schema.sql``).
    Running DDL on every serverless cold start would only add latency.

    Under SQLite (local development) it creates ``gestiune.db`` with all tables.
    """
    if USE_POSTGRES:
        return

    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript('''
        CREATE TABLE IF NOT EXISTS utilizatori (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            nume TEXT NOT NULL,
            is_admin INTEGER DEFAULT 0,
            creat_la TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS clienti (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nume TEXT NOT NULL,
            telefon TEXT,
            email TEXT,
            notite TEXT,
            creat_la TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            actualizat_la TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS contracte (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numar_contract TEXT NOT NULL,
            client_id INTEGER NOT NULL,
            descriere TEXT,
            valoare REAL,
            data_inceput DATE,
            data_sfarsit DATE,
            status TEXT DEFAULT 'Activ',
            creat_la TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            actualizat_la TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clienti(id)
        );

        CREATE TABLE IF NOT EXISTS proiecte (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nume TEXT NOT NULL,
            contract_id INTEGER NOT NULL,
            descriere TEXT,
            responsabil TEXT,
            data_start DATE,
            data_estimata_finalizare DATE,
            status TEXT DEFAULT 'In lucru',
            creat_la TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            actualizat_la TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (contract_id) REFERENCES contracte(id)
        );

        CREATE TABLE IF NOT EXISTS predari (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            proiect_id INTEGER NOT NULL,
            data_predare DATE NOT NULL,
            descriere TEXT,
            document_predare TEXT,
            observatii TEXT,
            creat_la TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (proiect_id) REFERENCES proiecte(id)
        );

        CREATE TABLE IF NOT EXISTS facturi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numar_factura TEXT NOT NULL,
            contract_id INTEGER NOT NULL,
            valoare REAL NOT NULL,
            data_emitere DATE NOT NULL,
            data_scadenta DATE,
            status TEXT DEFAULT 'Emisa',
            creat_la TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            actualizat_la TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (contract_id) REFERENCES contracte(id)
        );

        CREATE TABLE IF NOT EXISTS hg_uri (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contract_id INTEGER NOT NULL,
            numar_hg TEXT NOT NULL,
            descriere TEXT,
            creat_la TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (contract_id) REFERENCES contracte(id)
        );

        CREATE TABLE IF NOT EXISTS servicii (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contract_id INTEGER NOT NULL,
            descriere_serviciu TEXT NOT NULL,
            numar_imobile INTEGER DEFAULT 0,
            pret_per_imobil REAL DEFAULT 0,
            valoare_totala REAL DEFAULT 0,
            data_predare DATE,
            status_predare TEXT DEFAULT 'Nepredat',
            numar_factura TEXT,
            data_factura DATE,
            status_facturare TEXT DEFAULT 'Nefacturat',
            data_incasare DATE,
            status_incasare TEXT DEFAULT 'Neincasat',
            observatii TEXT,
            creat_la TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            actualizat_la TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (contract_id) REFERENCES contracte(id)
        );
    ''')

    conn.commit()
    conn.close()
