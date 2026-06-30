# Deploy pe Vercel + Supabase

Aplicația folosea SQLite, care **nu poate funcționa pe Vercel** (sistemul de
fișiere e read-only și se șterge la fiecare request → eroare 500 / datele nu se
salvează). Acum codul se conectează la **Supabase (Postgres)** când există
variabila `DATABASE_URL`, și rămâne pe SQLite doar local (pentru dezvoltare).

Urmează pașii de mai jos **o singură dată**.

## 1. Schimbă parola de Supabase (securitate — important)

Vechea parolă de bază de date a fost comisă în `git` (în workflow-ul de setup,
acum șters), deci trebuie considerată compromisă.

- Supabase → **Project Settings → Database → Reset database password**.
- Notează noua parolă; o folosești la pasul următor.

## 2. Ia string-ul de conexiune (pooler)

Supabase → **Project Settings → Database → Connection string → „Connection
pooling"**. Folosește **Transaction pooler (portul 6543)** — potrivit pentru
serverless:

```
postgresql://postgres.<PROJECT_REF>:<PAROLA>@aws-0-<regiune>.pooler.supabase.com:6543/postgres?sslmode=require
```

- Userul e `postgres.<PROJECT_REF>` (nu doar `postgres`).
- Păstrează `?sslmode=require` la final.
- Dacă apar erori de tip „prepared statement", schimbă portul în **5432**
  (Session pooler).

## 3. Creează schema și utilizatorul admin

Rulează local, o singură dată (creează tabelele și userul `admin`):

```bash
pip install -r requirements.txt

export DATABASE_URL='postgresql://postgres.<ref>:<parola>@aws-0-<regiune>.pooler.supabase.com:6543/postgres?sslmode=require'
export ADMIN_PASSWORD='o-parola-puternica'   # parola pentru contul admin
python seed_admin.py
```

Alternativ, poți copia conținutul din `supabase/schema.sql` în **Supabase →
SQL Editor** și să-l rulezi acolo (apoi tot trebuie `seed_admin.py` pentru admin,
fiindcă parola e hash-uită în Python).

## 4. Setează variabilele în Vercel

Vercel → **Project → Settings → Environment Variables** (pentru Production și
Preview):

| Variabilă        | Valoare                                                        |
|------------------|---------------------------------------------------------------|
| `DATABASE_URL`   | string-ul de la pasul 2                                        |
| `SECRET_KEY`     | un text aleatoriu lung (pentru sesiuni)                        |
| `ADMIN_PASSWORD` | *(opțional)* aceeași parolă admin folosită la pasul 3          |

Apoi **redeploy** (variabilele se aplică doar la un deploy nou).

## 5. Verifică

- Intră pe site → `/login` → autentifică-te cu `admin` și parola setată.
- Adaugă un client / contract / factură și dă refresh — datele trebuie să rămână.
- Verifică în **Supabase → Table editor** că rândurile apar în tabele.

---

## Dezvoltare locală (SQLite, fără Supabase)

Fără `DATABASE_URL`, aplicația folosește SQLite local automat:

```bash
pip install -r requirements.txt
python app.py    # creează gestiune.db și userul admin / admin123
```
