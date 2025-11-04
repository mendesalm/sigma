# backend/seed_super_admin.py

from sqlalchemy.orm import Session
from database import SessionLocal
from models.models import SuperAdmin
from services.auth_service import get_password_hash

def seed_super_admin():
    db: Session = SessionLocal()
    try:
        username = "sigma_sa"
        email = "sigma_sa@sigma.com"
        password = "Cd@Sigma#33"

        # Verifica se o SuperAdmin já existe
        existing_super_admin = db.query(SuperAdmin).filter(SuperAdmin.email == email).first()
        if existing_super_admin:
            print(f"SuperAdmin com email {email} já existe. Pulando criação.")
            return

        # Hash da senha
        hashed_password = get_password_hash(password)

        # Cria o novo SuperAdmin
        new_super_admin = SuperAdmin(
            username=username,
            email=email,
            password_hash=hashed_password,
            is_active=True
        )

        db.add(new_super_admin)
        db.commit()
        db.refresh(new_super_admin)
        print(f"SuperAdmin {email} criado com sucesso!")

    except Exception as e:
        print(f"Erro ao criar SuperAdmin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_super_admin()
