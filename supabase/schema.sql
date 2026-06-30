-- Gestiune App - Supabase PostgreSQL Schema
--
-- Aligned with the Flask application, which authenticates with Flask-Login +
-- Werkzeug password hashing. Therefore `utilizatori` stores `password_hash`
-- and `is_admin` as INTEGER (0/1) -- there is NO dependency on Supabase Auth
-- (auth.users). The app connects with the Postgres role from DATABASE_URL and
-- is the only client, so Row Level Security is intentionally NOT enabled (the
-- previous `TO authenticated` policies would have blocked the app's role).
--
-- Apply once: run `DATABASE_URL=... python seed_admin.py` (creates the schema
-- and the admin user), or paste this file into the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS utilizatori (
    id BIGSERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nume TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    creat_la TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clienti (
    id BIGSERIAL PRIMARY KEY,
    nume TEXT NOT NULL,
    telefon TEXT,
    email TEXT,
    notite TEXT,
    creat_la TIMESTAMPTZ DEFAULT NOW(),
    actualizat_la TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contracte (
    id BIGSERIAL PRIMARY KEY,
    numar_contract TEXT NOT NULL,
    client_id BIGINT NOT NULL REFERENCES clienti(id),
    descriere TEXT,
    valoare NUMERIC,
    data_inceput DATE,
    data_sfarsit DATE,
    status TEXT DEFAULT 'Activ',
    creat_la TIMESTAMPTZ DEFAULT NOW(),
    actualizat_la TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proiecte (
    id BIGSERIAL PRIMARY KEY,
    nume TEXT NOT NULL,
    contract_id BIGINT NOT NULL REFERENCES contracte(id),
    descriere TEXT,
    responsabil TEXT,
    data_start DATE,
    data_estimata_finalizare DATE,
    status TEXT DEFAULT 'In lucru',
    creat_la TIMESTAMPTZ DEFAULT NOW(),
    actualizat_la TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS predari (
    id BIGSERIAL PRIMARY KEY,
    proiect_id BIGINT NOT NULL REFERENCES proiecte(id),
    data_predare DATE NOT NULL,
    descriere TEXT,
    document_predare TEXT,
    observatii TEXT,
    creat_la TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS facturi (
    id BIGSERIAL PRIMARY KEY,
    numar_factura TEXT NOT NULL,
    contract_id BIGINT NOT NULL REFERENCES contracte(id),
    valoare NUMERIC NOT NULL,
    data_emitere DATE NOT NULL,
    data_scadenta DATE,
    status TEXT DEFAULT 'Emisa',
    creat_la TIMESTAMPTZ DEFAULT NOW(),
    actualizat_la TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hg_uri (
    id BIGSERIAL PRIMARY KEY,
    contract_id BIGINT NOT NULL REFERENCES contracte(id),
    numar_hg TEXT NOT NULL,
    descriere TEXT,
    creat_la TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS servicii (
    id BIGSERIAL PRIMARY KEY,
    contract_id BIGINT NOT NULL REFERENCES contracte(id),
    descriere_serviciu TEXT NOT NULL,
    numar_imobile INTEGER DEFAULT 0,
    pret_per_imobil NUMERIC DEFAULT 0,
    valoare_totala NUMERIC DEFAULT 0,
    data_predare DATE,
    status_predare TEXT DEFAULT 'Nepredat',
    numar_factura TEXT,
    data_factura DATE,
    status_facturare TEXT DEFAULT 'Nefacturat',
    data_incasare DATE,
    status_incasare TEXT DEFAULT 'Neincasat',
    observatii TEXT,
    creat_la TIMESTAMPTZ DEFAULT NOW(),
    actualizat_la TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update trigger for actualizat_la
CREATE OR REPLACE FUNCTION update_actualizat_la()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizat_la = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clienti_actualizat_la ON clienti;
CREATE TRIGGER update_clienti_actualizat_la BEFORE UPDATE ON clienti FOR EACH ROW EXECUTE FUNCTION update_actualizat_la();
DROP TRIGGER IF EXISTS update_contracte_actualizat_la ON contracte;
CREATE TRIGGER update_contracte_actualizat_la BEFORE UPDATE ON contracte FOR EACH ROW EXECUTE FUNCTION update_actualizat_la();
DROP TRIGGER IF EXISTS update_proiecte_actualizat_la ON proiecte;
CREATE TRIGGER update_proiecte_actualizat_la BEFORE UPDATE ON proiecte FOR EACH ROW EXECUTE FUNCTION update_actualizat_la();
DROP TRIGGER IF EXISTS update_facturi_actualizat_la ON facturi;
CREATE TRIGGER update_facturi_actualizat_la BEFORE UPDATE ON facturi FOR EACH ROW EXECUTE FUNCTION update_actualizat_la();
DROP TRIGGER IF EXISTS update_servicii_actualizat_la ON servicii;
CREATE TRIGGER update_servicii_actualizat_la BEFORE UPDATE ON servicii FOR EACH ROW EXECUTE FUNCTION update_actualizat_la();
