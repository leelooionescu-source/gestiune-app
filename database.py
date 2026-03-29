import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gestiune.db')


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
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
