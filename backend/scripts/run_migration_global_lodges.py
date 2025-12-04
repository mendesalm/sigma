import sys
import os
import uuid
from sqlalchemy import create_engine, func, or_
from sqlalchemy.orm import sessionmaker

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal, oriente_engine
from models.models import Lodge, Obedience
from models.global_models import GlobalVisitor

def migrate_lodges():
    if not oriente_engine:
        print("ORIENTE_DB_URL not set. Cannot migrate.")
        return

    sigma_db = SessionLocal()
    oriente_db = sessionmaker(bind=oriente_engine)()

    try:
        # 1. Get GLEG Obedience
        gleg = sigma_db.query(Obedience).filter(Obedience.acronym == "GLEG").first()
        if not gleg:
            print("GLEG obedience not found. Please run ensure_gleg.py first.")
            return
        
        print(f"Migrating lodges to Obedience: {gleg.name} (ID: {gleg.id})")

        # 2. Query GlobalVisitor for unique lodges associated with GLEG
        print("Querying GlobalVisitor for GLEG lodges...")
        visitors = oriente_db.query(GlobalVisitor).filter(
            or_(
                GlobalVisitor.manual_lodge_obedience.ilike("%GLEG%"),
                GlobalVisitor.manual_lodge_obedience.ilike("%Grande Loja Maçônica do Estado de Goiás%"),
                GlobalVisitor.manual_lodge_obedience.ilike("%Grande Loja do Estado de Goiás%")
            )
        ).all()
        
        print(f"Found {len(visitors)} visitors associated with GLEG.")
        
        unique_lodges = {}
        for v in visitors:
            if not v.manual_lodge_name or not v.manual_lodge_number:
                continue
            
            # Normalize
            name = v.manual_lodge_name.strip()
            number = v.manual_lodge_number.strip()
            
            key = (name, number)
            if key not in unique_lodges:
                unique_lodges[key] = {
                    "name": name,
                    "number": number,
                    "city": "Goiânia", # Defaulting to capital as safe fallback, or "Desconhecida"
                    "state": "GO"
                }
        
        print(f"Found {len(unique_lodges)} unique lodges to migrate.")
        
        migrated_count = 0
        for (name, number), data in unique_lodges.items():
            # Check if lodge exists
            existing = sigma_db.query(Lodge).filter(
                Lodge.lodge_name == name,
                Lodge.lodge_number == number,
                Lodge.obedience_id == gleg.id
            ).first()
            
            if existing:
                # print(f"Lodge {name} N. {number} already exists.")
                continue
            
            print(f"Creating Lodge: {name} N. {number}")
            new_lodge = Lodge(
                lodge_name=name,
                lodge_code=str(uuid.uuid4()),
                lodge_number=number,
                obedience_id=gleg.id,
                technical_contact_name="Migrated Admin",
                technical_contact_email=f"admin_{number}@gleg.br",
                city=data["city"],
                state=data["state"],
                is_active=True
            )
            sigma_db.add(new_lodge)
            migrated_count += 1
            
        sigma_db.commit()
        print(f"Successfully migrated {migrated_count} lodges.")

    except Exception as e:
        print(f"Error: {str(e)[:500]}") # Truncate error message
        sigma_db.rollback()
    finally:
        sigma_db.close()
        oriente_db.close()

if __name__ == "__main__":
    migrate_lodges()
