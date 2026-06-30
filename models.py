import os
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db


class User(UserMixin):
    def __init__(self, id, username, password_hash, nume, is_admin):
        self.id = id
        self.username = username
        self.password_hash = password_hash
        self.nume = nume
        self.is_admin = is_admin

    @staticmethod
    def get_by_id(user_id):
        db = get_db()
        row = db.execute('SELECT * FROM utilizatori WHERE id = ?', (user_id,)).fetchone()
        db.close()
        if row:
            return User(row['id'], row['username'], row['password_hash'], row['nume'], row['is_admin'])
        return None

    @staticmethod
    def get_by_username(username):
        db = get_db()
        row = db.execute('SELECT * FROM utilizatori WHERE username = ?', (username,)).fetchone()
        db.close()
        if row:
            return User(row['id'], row['username'], row['password_hash'], row['nume'], row['is_admin'])
        return None

    @staticmethod
    def create(username, password, nume, is_admin=0):
        db = get_db()
        password_hash = generate_password_hash(password)
        # ON CONFLICT keeps this idempotent on the UNIQUE username constraint
        # (supported by Postgres and modern SQLite); the add-user UI already
        # pre-checks for duplicates, so this is just defensive.
        db.execute('''INSERT INTO utilizatori (username, password_hash, nume, is_admin)
                      VALUES (?, ?, ?, ?)
                      ON CONFLICT (username) DO NOTHING''',
                   (username, password_hash, nume, is_admin))
        db.commit()
        db.close()

    def verify_password(self, password):
        return check_password_hash(self.password_hash, password)

    @staticmethod
    def get_all():
        db = get_db()
        rows = db.execute('SELECT * FROM utilizatori ORDER BY nume').fetchall()
        db.close()
        return rows

    @staticmethod
    def delete(user_id):
        db = get_db()
        db.execute('DELETE FROM utilizatori WHERE id = ?', (user_id,))
        db.commit()
        db.close()


def create_admin_if_needed():
    user = User.get_by_username('admin')
    if not user:
        # Set ADMIN_PASSWORD when seeding production so the initial password is
        # not the well-known default. Falls back to 'admin123' for local dev.
        password = os.environ.get('ADMIN_PASSWORD', 'admin123')
        User.create('admin', password, 'Administrator', is_admin=1)
