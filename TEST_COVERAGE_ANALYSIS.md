# Test Coverage Analysis

## Current State

**Test coverage: 0%** — The codebase has no automated tests, no testing framework installed, and no test configuration files.

- **Source files**: 3 Python files (~870 lines of backend logic)
- **Templates**: 15 Jinja2 templates (~1,350 lines)
- **Testing dependencies**: None (`requirements.txt` has no pytest/unittest)

---

## Recommended Test Areas (Priority Order)

### 1. Authentication & Authorization (Critical)

**Why**: Security-critical logic. A regression here could expose the entire app to unauthorized access.

**What to test**:
- Login with valid credentials redirects to dashboard
- Login with invalid credentials shows error, does not authenticate
- Accessing protected routes without login redirects to `/login`
- Admin-only routes (`/utilizatori`, `/utilizatori/adauga`, `/utilizatori/sterge`) reject non-admin users
- Self-deletion prevention (`utilizatori_sterge` with own user ID)
- `User.verify_password()` accepts correct password, rejects wrong password
- `User.create()` hashes the password (stored hash != plaintext)
- `create_admin_if_needed()` is idempotent (doesn't duplicate on repeated calls)

**Estimated tests**: ~12

---

### 2. Cascading Delete Protection (Critical)

**Why**: The app relies on manual FK checks before deletion. If any check is missing or broken, data integrity is lost silently.

**What to test**:
- Cannot delete a client that has contracts (`clienti_sterge`)
- Cannot delete a contract that has projects, invoices, services, or HG-uri (`contracte_sterge`)
- Cannot delete a project that has deliveries (`proiecte_sterge`)
- Deletion succeeds when no child records exist
- Correct flash messages are shown on blocked deletions

**Estimated tests**: ~8

---

### 3. Service Value Calculation (High)

**Why**: Financial calculations that affect billing and reporting. `valoare_totala = numar_imobile * pret_per_imobil` is computed in Python, not the DB. Edge cases with zero/empty values use `int(... or 0)` / `float(... or 0)` which could silently mask bad input.

**What to test**:
- `servicii_adauga`: correct `valoare_totala` for normal inputs
- `servicii_adauga`: handles `numar_imobile=0` or `pret_per_imobil=0`
- `servicii_adauga`: handles empty string inputs (the `or 0` fallback)
- `servicii_editeaza`: recalculates `valoare_totala` correctly on edit
- Default statuses are set correctly (`Nepredat`, `Nefacturat`, `Neincasat`)

**Estimated tests**: ~8

---

### 4. Dashboard Aggregation Queries (High)

**Why**: The dashboard shows key business metrics via complex SQL. Bugs here could show wrong financial numbers to users without any obvious error.

**What to test**:
- Stats are all zero on an empty database
- `valoare_neincasata` sums only invoices with status `Emisa`
- `contracte_expira` returns only active contracts ending within 30 days
- `ultimele_facturi` returns at most 5, ordered by most recent
- Service-level stats (`servicii_nepredate`, `servicii_nefacturate`, `servicii_neincasate`) count correctly

**Estimated tests**: ~8

---

### 5. CRUD Operations — Contracts, Projects, Invoices (Medium)

**Why**: Core business operations. Each module follows the same pattern (list/add/edit/delete) but has distinct validation and query logic.

**What to test per module**:
- Add with valid data succeeds, redirects, flashes success
- Edit existing record updates fields correctly
- Edit/delete nonexistent record (404-like behavior)
- List with search filters returns correct results
- List with status filter returns correct results
- `float(request.form['valoare'])` in contracts/invoices with invalid input

**Modules**: Contracte, Proiecte, Predari, Facturi (4 modules x ~6 tests each)

**Estimated tests**: ~24

---

### 6. Client Details Page Aggregation (Medium)

**Why**: `clienti_detalii` runs a complex aggregation query joining services across all of a client's contracts. This is the most complex query in the app.

**What to test**:
- Totals are correct with multiple contracts and services
- Totals handle a client with zero contracts/services
- Status breakdown counts (`predate`/`nepredate`, `facturate`/`nefacturate`, `incasate`/`neincasate`) are accurate
- `valoare_neincasata` sums only services with `status_incasare = 'Neincasat'`

**Estimated tests**: ~5

---

### 7. Search and Filtering (Medium)

**Why**: Search uses `LIKE` with user input across multiple fields. Filters combine search + status.

**What to test**:
- Search returns matches across all searchable fields (name, phone, email for clients; contract number, description, client name for contracts, etc.)
- Empty search returns all records
- Combined search + status filter works correctly
- Special characters in search input don't cause SQL errors

**Estimated tests**: ~8

---

### 8. Database Initialization (Low)

**Why**: `init_db()` creates all 8 tables. If the schema changes and `CREATE TABLE IF NOT EXISTS` masks a migration issue, the app could run with a stale schema.

**What to test**:
- `init_db()` creates all expected tables on a fresh database
- `init_db()` is idempotent (safe to call twice)
- Foreign key constraints are enabled (`PRAGMA foreign_keys = ON`)

**Estimated tests**: ~4

---

### 9. HG-uri (Government Decisions) CRUD (Low)

**Why**: Simple CRUD with a join to find `client_id` for redirect. Low complexity but still worth basic coverage.

**What to test**:
- Add HG to a contract, redirects to client details
- Delete existing HG
- Delete nonexistent HG shows error, redirects to client list

**Estimated tests**: ~4

---

## Recommended Setup

### Testing framework

```
# Add to requirements.txt
pytest==8.1.1
pytest-cov==5.0.0
```

### Test configuration (`conftest.py`)

A test fixture should:
1. Create a temporary SQLite database (use `tmp_path`)
2. Initialize the schema via `init_db()`
3. Create a Flask test client with `app.test_client()`
4. Provide a helper to log in as admin or regular user
5. Tear down the database after each test

### Directory structure

```
tests/
    conftest.py              # Fixtures: app, client, auth helpers
    test_auth.py             # Area 1: Authentication & authorization
    test_delete_protection.py # Area 2: Cascading delete guards
    test_servicii.py         # Area 3: Service value calculations
    test_dashboard.py        # Area 4: Dashboard aggregations
    test_clienti.py          # Area 5+6: Client CRUD & details
    test_contracte.py        # Area 5: Contract CRUD
    test_proiecte.py         # Area 5: Project CRUD
    test_facturi.py          # Area 5: Invoice CRUD
    test_search.py           # Area 7: Search & filtering
    test_database.py         # Area 8: DB initialization
    test_hg.py               # Area 9: HG-uri CRUD
```

### Estimated total: ~81 tests

---

## Summary of Risk Areas

| Area | Risk | Current Coverage | Priority |
|------|------|-----------------|----------|
| Auth & authorization | Data breach, unauthorized access | 0% | **Critical** |
| Cascading delete protection | Silent data loss | 0% | **Critical** |
| Service value calculation | Incorrect billing amounts | 0% | **High** |
| Dashboard aggregations | Misleading business metrics | 0% | **High** |
| CRUD operations | Data corruption, crashes | 0% | **Medium** |
| Client details aggregation | Wrong per-client financials | 0% | **Medium** |
| Search & filtering | Missed or wrong results | 0% | **Medium** |
| DB initialization | Schema drift | 0% | **Low** |
| HG-uri CRUD | Minor feature regression | 0% | **Low** |
