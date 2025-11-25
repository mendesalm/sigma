
import argparse
import os
import sys

from sqlalchemy.orm import Session

# Add the project root to the Python path to allow for absolute imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database import get_db
from backend.models import models
from backend.utils.password_utils import hash_password

def create_super_admin(db_session: Session, username: str, email: str, password: str):
    """
    Creates a new SuperAdmin user in the database.
    """
    # Check if user already exists
    existing_user = db_session.query(models.SuperAdmin).filter(
        (models.SuperAdmin.username == username) | (models.SuperAdmin.email == email)
    ).first()

    if existing_user:
        print(f"Error: SuperAdmin with username '{username}' or email '{email}' already exists.")
        return

    # Hash the password
    password_hash = hash_password(password)

    # Create the new SuperAdmin
    new_super_admin = models.SuperAdmin(
        username=username,
        email=email,
        password_hash=password_hash,
        is_active=True
    )

    db_session.add(new_super_admin)
    db_session.commit()

    print(f"Successfully created SuperAdmin user '{username}'.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a new SuperAdmin user for the Sigma application.")
    parser.add_argument("--username", required=True, help="The username for the new SuperAdmin.")
    parser.add_argument("--email", required=True, help="The email address for the new SuperAdmin.")
    parser.add_argument("--password", required=True, help="The password for the new SuperAdmin.")

    args = parser.parse_args()

    # Get a database session
    db = next(get_db())

    try:
        create_super_admin(db, args.username, args.email, args.password)
    finally:
        db.close()
