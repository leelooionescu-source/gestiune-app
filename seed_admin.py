"""One-time Supabase/Postgres setup.

Applies the schema in ``supabase/schema.sql`` and creates the ``admin`` user
(with a Werkzeug password hash) against the database in ``DATABASE_URL``.

Usage (run locally, once):

    DATABASE_URL='postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?sslmode=require' \
    ADMIN_PASSWORD='o-parola-puternica' \
    python seed_admin.py

It is safe to run more than once: the schema uses CREATE TABLE IF NOT EXISTS and
the admin insert uses ON CONFLICT DO NOTHING.
"""

import os
import sys

from database import get_db, USE_POSTGRES
from models import create_admin_if_needed, User


def main():
    if not USE_POSTGRES:
        sys.exit(
            'DATABASE_URL is not set. Export your Supabase pooler connection '
            'string first, e.g.\n'
            "  export DATABASE_URL='postgresql://postgres.<ref>:<password>"
            "@aws-0-<region>.pooler.supabase.com:6543/postgres?sslmode=require'"
        )

    schema_path = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                               'supabase', 'schema.sql')
    with open(schema_path, 'r', encoding='utf-8') as fh:
        schema_sql = fh.read()

    print('Applying schema to the database...')
    db = get_db()
    db.execute(schema_sql)
    db.commit()
    db.close()
    print('  schema applied.')

    print('Ensuring admin user exists...')
    create_admin_if_needed()
    admin = User.get_by_username('admin')
    if admin:
        pwd_source = 'ADMIN_PASSWORD' if os.environ.get('ADMIN_PASSWORD') else "default 'admin123'"
        print(f"  admin user ready (username: admin, password: {pwd_source}).")
    else:
        print('  WARNING: admin user could not be verified.')

    print('Done.')


if __name__ == '__main__':
    main()
