import sys
import os

# Add parent directory to path to allow importing from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from database import SessionLocal
from models.models import Obedience, ObedienceTypeEnum

def ensure_gleg():
    db = SessionLocal()
    try:
        gleg = db.query(Obedience).filter(Obedience.acronym == "GLEG").first()
        
        if gleg:
            print(f"Updating existing GLEG (ID: {gleg.id})...")
            gleg.name = "Grande Loja Maçônica do Estado de Goiás"
            gleg.type = ObedienceTypeEnum.STATE
            gleg.cnpj = "01.242.015/0001-29"
            gleg.email = "gleg@gleg.com.br"
            gleg.phone = "(62) 3207-1020"
            gleg.website = "www.gleg.com.br"
            gleg.street_address = "Rua J 52"
            gleg.street_number = "550"
            gleg.neighborhood = "Setor Jaó"
            gleg.city = "Goiânia"
            gleg.state = "GO"
            gleg.zip_code = "74674-180"
            gleg.technical_contact_name = "Secretaria GLEG"
            gleg.technical_contact_email = "gleg@gleg.com.br"
        else:
            print("Creating GLEG...")
            gleg = Obedience(
                name="Grande Loja Maçônica do Estado de Goiás",
                acronym="GLEG",
                type=ObedienceTypeEnum.STATE,
                cnpj="01.242.015/0001-29",
                email="gleg@gleg.com.br",
                phone="(62) 3207-1020",
                website="www.gleg.com.br",
                street_address="Rua J 52",
                street_number="550",
                neighborhood="Setor Jaó",
                city="Goiânia",
                state="GO",
                zip_code="74674-180",
                technical_contact_name="Secretaria GLEG",
                technical_contact_email="gleg@gleg.com.br"
            )
            db.add(gleg)
        
        db.commit()
        db.refresh(gleg)
        print(f"GLEG ensured successfully with ID: {gleg.id}")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    ensure_gleg()
