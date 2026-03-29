#!/bin/bash
#
# Script de setup complet pentru Gestiune App
# Rulează: bash setup.sh
#
# Acest script face totul automat:
# 1. Instalează dependințele
# 2. Te loghează în Supabase (se deschide browserul)
# 3. Creează proiectul Supabase cu baza de date
# 4. Creează primul utilizator admin
# 5. Face deploy pe Vercel
#

set -e

echo "============================================"
echo "  Gestiune App - Setup Automat"
echo "============================================"
echo ""

# ---- Check prerequisites ----
command -v node >/dev/null 2>&1 || { echo "EROARE: Node.js nu e instalat. Descarcă-l de la https://nodejs.org"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "EROARE: npm nu e instalat."; exit 1; }
command -v git >/dev/null 2>&1 || { echo "EROARE: git nu e instalat."; exit 1; }

# ---- Install dependencies ----
echo "[1/7] Instalez dependințele..."
npm install --silent

# ---- Install CLIs ----
echo "[2/7] Instalez Supabase CLI și Vercel CLI..."
npm install -g supabase vercel 2>/dev/null || npx -y supabase --version >/dev/null 2>&1

# ---- Supabase Login ----
echo ""
echo "[3/7] Autentificare Supabase..."
echo "  Se va deschide browserul. Loghează-te cu Google sau GitHub."
echo "  (Dacă nu ai cont, îți creezi unul gratuit acum.)"
echo ""
npx supabase login

# ---- Create Supabase project ----
echo ""
echo "[4/7] Creez proiectul Supabase..."

# Generate a random password for the database
DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 20)

echo "  Parola bazei de date (salvează-o): $DB_PASSWORD"

# Create project
PROJECT_OUTPUT=$(npx supabase projects create "gestiune-app" \
  --db-password "$DB_PASSWORD" \
  --region "eu-west-1" \
  --org-id "" 2>&1) || true

echo "$PROJECT_OUTPUT"

# Try to extract project ref
PROJECT_REF=$(echo "$PROJECT_OUTPUT" | grep -oP 'Created .* at [a-z]+://([a-z0-9]+)\.supabase\.co' | grep -oP '[a-z0-9]+(?=\.supabase\.co)' || true)

if [ -z "$PROJECT_REF" ]; then
  echo ""
  echo "  Nu am putut extrage automat ID-ul proiectului."
  echo "  Du-te la https://supabase.com/dashboard și copiază project ref din URL."
  read -p "  Introdu Project Reference ID: " PROJECT_REF
fi

echo ""
echo "  Project ref: $PROJECT_REF"

# Wait for project to be ready
echo "  Aștept ca proiectul să fie gata (poate dura 1-2 minute)..."
sleep 30

# ---- Get API keys ----
echo "[5/7] Obțin cheile API..."

API_KEYS=$(npx supabase projects api-keys --project-ref "$PROJECT_REF" 2>&1)
echo "$API_KEYS"

SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
ANON_KEY=$(echo "$API_KEYS" | grep "anon" | awk '{print $NF}' || true)
SERVICE_KEY=$(echo "$API_KEYS" | grep "service_role" | awk '{print $NF}' || true)

if [ -z "$ANON_KEY" ]; then
  echo ""
  echo "  Nu am putut extrage cheile automat."
  echo "  Du-te la https://supabase.com/dashboard/project/$PROJECT_REF/settings/api"
  read -p "  Introdu Project URL (ex: https://xxx.supabase.co): " SUPABASE_URL
  read -p "  Introdu anon public key: " ANON_KEY
  read -p "  Introdu service_role key: " SERVICE_KEY
fi

# ---- Run schema SQL ----
echo ""
echo "[5.5/7] Creez tabelele în baza de date..."
npx supabase db execute --project-ref "$PROJECT_REF" < supabase/schema.sql 2>&1 || {
  echo "  ATENȚIE: Schema nu s-a putut rula automat."
  echo "  Du-te la https://supabase.com/dashboard/project/$PROJECT_REF/sql"
  echo "  și lipește conținutul fișierului supabase/schema.sql"
  read -p "  Apasă Enter când ai terminat..."
}

# ---- Create admin user ----
echo ""
echo "[6/7] Creez utilizatorul admin..."

ADMIN_EMAIL="admin@gestiune.app"
ADMIN_PASSWORD="Admin123!"

# Create auth user via Supabase Management API
curl -s -X POST "https://${PROJECT_REF}.supabase.co/auth/v1/admin/users" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${ADMIN_EMAIL}\",
    \"password\": \"${ADMIN_PASSWORD}\",
    \"email_confirm\": true
  }" > /tmp/admin_response.json 2>&1

ADMIN_AUTH_ID=$(cat /tmp/admin_response.json | grep -oP '"id":"[^"]+' | head -1 | cut -d'"' -f4 || true)

if [ -n "$ADMIN_AUTH_ID" ]; then
  # Create profile entry
  curl -s -X POST "https://${PROJECT_REF}.supabase.co/rest/v1/utilizatori" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "{
      \"auth_user_id\": \"${ADMIN_AUTH_ID}\",
      \"username\": \"${ADMIN_EMAIL}\",
      \"nume\": \"Administrator\",
      \"is_admin\": true
    }" 2>&1

  echo "  Utilizator admin creat!"
  echo "  Email:  ${ADMIN_EMAIL}"
  echo "  Parolă: ${ADMIN_PASSWORD}"
  echo "  (Poți schimba parola după prima logare)"
else
  echo "  ATENȚIE: Nu am putut crea userul admin automat."
  echo "  Du-te la https://supabase.com/dashboard/project/$PROJECT_REF/auth/users"
  echo "  și creează manual un user cu email: admin@gestiune.app"
fi

rm -f /tmp/admin_response.json

# ---- Create .env.local ----
echo ""
cat > .env.local << ENVEOF
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}
ENVEOF
echo "  Fișier .env.local creat."

# ---- Deploy to Vercel ----
echo ""
echo "[7/7] Deploy pe Vercel..."
echo "  Se va deschide browserul pentru autentificare Vercel."
echo "  (Loghează-te cu GitHub dacă nu ai cont.)"
echo ""

vercel link --yes 2>/dev/null || true

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "$SUPABASE_URL" 2>/dev/null || true
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "$ANON_KEY" 2>/dev/null || true

# Deploy
vercel --prod --yes 2>&1

echo ""
echo "============================================"
echo "  GATA! Aplicația ta e live!"
echo "============================================"
echo ""
echo "  Credențiale admin:"
echo "    Email:  ${ADMIN_EMAIL}"
echo "    Parolă: ${ADMIN_PASSWORD}"
echo ""
echo "  Linkul aplicației e afișat mai sus de Vercel."
echo "  Supabase Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF"
echo ""
echo "  IMPORTANT: Schimbă parola admin după prima logare!"
echo "============================================"
