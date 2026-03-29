import { NextResponse } from "next/server";
import postgres from "postgres";

const SCHEMA_SQL = `
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
    nume TEXT NOT NULL, telefon TEXT, email TEXT, notite TEXT,
    creat_la TIMESTAMPTZ DEFAULT NOW(), actualizat_la TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS contracte (
    id BIGSERIAL PRIMARY KEY,
    numar_contract TEXT NOT NULL, client_id BIGINT NOT NULL REFERENCES clienti(id),
    descriere TEXT, valoare NUMERIC, data_inceput DATE, data_sfarsit DATE,
    status TEXT DEFAULT 'Activ',
    creat_la TIMESTAMPTZ DEFAULT NOW(), actualizat_la TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS proiecte (
    id BIGSERIAL PRIMARY KEY,
    nume TEXT NOT NULL, contract_id BIGINT NOT NULL REFERENCES contracte(id),
    descriere TEXT, responsabil TEXT, data_start DATE, data_estimata_finalizare DATE,
    status TEXT DEFAULT 'In lucru',
    creat_la TIMESTAMPTZ DEFAULT NOW(), actualizat_la TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS predari (
    id BIGSERIAL PRIMARY KEY,
    proiect_id BIGINT NOT NULL REFERENCES proiecte(id),
    data_predare DATE NOT NULL, descriere TEXT, document_predare TEXT, observatii TEXT,
    creat_la TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS facturi (
    id BIGSERIAL PRIMARY KEY,
    numar_factura TEXT NOT NULL, contract_id BIGINT NOT NULL REFERENCES contracte(id),
    valoare NUMERIC NOT NULL, data_emitere DATE NOT NULL, data_scadenta DATE,
    status TEXT DEFAULT 'Emisa',
    creat_la TIMESTAMPTZ DEFAULT NOW(), actualizat_la TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS hg_uri (
    id BIGSERIAL PRIMARY KEY,
    contract_id BIGINT NOT NULL REFERENCES contracte(id),
    numar_hg TEXT NOT NULL, descriere TEXT,
    creat_la TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS servicii (
    id BIGSERIAL PRIMARY KEY,
    contract_id BIGINT NOT NULL REFERENCES contracte(id),
    descriere_serviciu TEXT NOT NULL, numar_imobile INTEGER DEFAULT 0,
    pret_per_imobil NUMERIC DEFAULT 0, valoare_totala NUMERIC DEFAULT 0,
    data_predare DATE, status_predare TEXT DEFAULT 'Nepredat',
    numar_factura TEXT, data_factura DATE, status_facturare TEXT DEFAULT 'Nefacturat',
    data_incasare DATE, status_incasare TEXT DEFAULT 'Neincasat', observatii TEXT,
    creat_la TIMESTAMPTZ DEFAULT NOW(), actualizat_la TIMESTAMPTZ DEFAULT NOW()
);
`;

const RLS_SQL = `
ALTER TABLE utilizatori ENABLE ROW LEVEL SECURITY;
ALTER TABLE clienti ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracte ENABLE ROW LEVEL SECURITY;
ALTER TABLE proiecte ENABLE ROW LEVEL SECURITY;
ALTER TABLE predari ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturi ENABLE ROW LEVEL SECURITY;
ALTER TABLE hg_uri ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicii ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_read_utilizatori') THEN
    CREATE POLICY auth_read_utilizatori ON utilizatori FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_insert_utilizatori') THEN
    CREATE POLICY auth_insert_utilizatori ON utilizatori FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_delete_utilizatori') THEN
    CREATE POLICY auth_delete_utilizatori ON utilizatori FOR DELETE TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_all_clienti') THEN
    CREATE POLICY auth_all_clienti ON clienti FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_all_contracte') THEN
    CREATE POLICY auth_all_contracte ON contracte FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_all_proiecte') THEN
    CREATE POLICY auth_all_proiecte ON proiecte FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_all_predari') THEN
    CREATE POLICY auth_all_predari ON predari FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_all_facturi') THEN
    CREATE POLICY auth_all_facturi ON facturi FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_all_hg_uri') THEN
    CREATE POLICY auth_all_hg_uri ON hg_uri FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_all_servicii') THEN
    CREATE POLICY auth_all_servicii ON servicii FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
`;

const TRIGGERS_SQL = `
CREATE OR REPLACE FUNCTION update_actualizat_la() RETURNS TRIGGER AS $$
BEGIN NEW.actualizat_la = NOW(); RETURN NEW; END;
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
`;

const ADMIN_SQL = `
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'admin@gestiune.app', crypt('Admin123!', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT gen_random_uuid(), id, email,
  json_build_object('email', email, 'sub', id::text, 'email_verified', true),
  'email', NOW(), NOW(), NOW()
FROM auth.users WHERE email = 'admin@gestiune.app'
  AND NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = auth.users.id);

INSERT INTO utilizatori (auth_user_id, username, nume, is_admin)
SELECT id, 'admin@gestiune.app', 'Administrator', true
FROM auth.users WHERE email = 'admin@gestiune.app'
ON CONFLICT (auth_user_id) DO NOTHING;
`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dbPassword = searchParams.get("p");

  if (!dbPassword) {
    return NextResponse.json({ error: "Missing password parameter ?p=..." }, { status: 400 });
  }

  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/\/\/([^.]+)/)?.[1];
  if (!projectRef) {
    return NextResponse.json({ error: "SUPABASE_URL not configured" }, { status: 500 });
  }

  const logs: string[] = [];
  const log = (msg: string) => { logs.push(msg); console.log(msg); };

  // Try multiple connection methods
  const connStrings = [
    `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require`,
    `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require`,
    `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`,
    `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require`,
  ];

  let sql: ReturnType<typeof postgres> | null = null;

  for (const connStr of connStrings) {
    try {
      const host = connStr.match(/@([^:/]+)/)?.[1] || "unknown";
      const port = connStr.match(/:(\d{4})\//)?.[1] || "?";
      log(`Trying ${host}:${port}...`);
      const testSql = postgres(connStr, { connect_timeout: 10 });
      await testSql`SELECT 1 as test`;
      log(`Connected!`);
      sql = testSql;
      break;
    } catch (e) {
      log(`Failed: ${(e as Error).message}`);
    }
  }

  if (!sql) {
    return NextResponse.json({ error: "All connections failed", logs }, { status: 500 });
  }

  try {
    log("Creating tables...");
    await sql.unsafe(SCHEMA_SQL);
    log("Tables created!");

    log("Setting up RLS policies...");
    await sql.unsafe(RLS_SQL);
    log("RLS done!");

    log("Creating triggers...");
    await sql.unsafe(TRIGGERS_SQL);
    log("Triggers done!");

    log("Creating admin user...");
    await sql.unsafe(ADMIN_SQL);
    log("Admin created!");

    log("Verifying...");
    const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`;
    log(`Tables: ${tables.map(t => t.tablename).join(", ")}`);

    const users = await sql`SELECT email FROM auth.users LIMIT 5`;
    log(`Auth users: ${users.map(u => u.email).join(", ")}`);

    await sql.end();

    return NextResponse.json({
      success: true,
      message: "Setup complet! Poți folosi aplicația.",
      adminEmail: "admin@gestiune.app",
      adminPassword: "Admin123!",
      logs,
    });
  } catch (e) {
    await sql.end();
    return NextResponse.json({
      error: (e as Error).message,
      logs,
    }, { status: 500 });
  }
}
