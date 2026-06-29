# create_admin.py
import bcrypt
from passlib.context import CryptContext
from app.models import User
from app.database import SessionLocal
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))


# Use a simpler approach for password hashing

def hash_password(password):
    # Generate a salt and hash the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def create_admin():
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin = db.query(User).filter(User.username == "admin").first()
        if admin:
            print("⚠️  Admin user already exists!")
            return

        # Create admin user with simple password
        password = "admin123"
        hashed_password = hash_password(password)

        admin_user = User(
            username="admin",
            email="admin@example.com",
            hashed_password=hashed_password,
            is_active=True
        )
        db.add(admin_user)
        db.commit()

        print("=" * 50)
        print("✅ Admin user created successfully!")
        print("📝 Username: admin")
        print("🔑 Password: admin123")
        print("=" * 50)

    except Exception as e:
        print(f"❌ Error creating admin: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
