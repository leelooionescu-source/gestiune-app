-- Gestiune App - Supabase PostgreSQL Schema

CREATE TABLE IF NOT EXISTS utilizatori (
    id BIGSERIAL PRIMARY KEY,
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    nume TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
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

-- Row Level Security
ALTER TABLE utilizatori ENABLE ROW LEVEL SECURITY;
ALTER TABLE clienti ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracte ENABLE ROW LEVEL SECURITY;
ALTER TABLE proiecte ENABLE ROW LEVEL SECURITY;
ALTER TABLE predari ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturi ENABLE ROW LEVEL SECURITY;
ALTER TABLE hg_uri ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicii ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_utilizatori" ON utilizatori FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_utilizatori" ON utilizatori FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_delete_utilizatori" ON utilizatori FOR DELETE TO authenticated USING (true);
CREATE POLICY "auth_all_clienti" ON clienti FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_contracte" ON contracte FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_proiecte" ON proiecte FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_predari" ON predari FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_facturi" ON facturi FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_hg_uri" ON hg_uri FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_servicii" ON servicii FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Auto-update trigger
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
