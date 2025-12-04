import sys
import os
import csv
import uuid
from sqlalchemy.orm import Session
from database import SessionLocal
from models.models import Lodge, Obedience, ObedienceTypeEnum, RiteEnum

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def ensure_obedience(db: Session, name: str, acronym: str, type_enum: str, parent_acronym: str = None):
    # Find or create the obedience
    obedience = db.query(Obedience).filter(Obedience.acronym == acronym).first()
    
    parent_id = None
    if parent_acronym:
        parent = db.query(Obedience).filter(Obedience.acronym == parent_acronym).first()
        if parent:
            parent_id = parent.id
        else:
            print(f"Warning: Parent obedience '{parent_acronym}' not found for '{acronym}'. Creating without parent.")

    if not obedience:
        print(f"Creating Obedience: {name} ({acronym})")
        obedience = Obedience(
            name=name,
            acronym=acronym,
            type=type_enum,
            parent_obedience_id=parent_id,
            technical_contact_name="Admin",
            technical_contact_email=f"admin@{acronym.lower().replace(' ', '')}.org.br"
        )
        db.add(obedience)
        db.commit()
        db.refresh(obedience)
    else:
        # Update parent if it was missing and now provided
        if parent_id and obedience.parent_obedience_id != parent_id:
            obedience.parent_obedience_id = parent_id
            db.commit()
            print(f"Updated parent for {acronym} -> {parent_acronym}")
            
    return obedience

def import_generic_lodges(csv_path: str):
    if not os.path.exists(csv_path):
        print(f"File not found: {csv_path}")
        return

    db = SessionLocal()
    try:
        print(f"Importing lodges from {csv_path}...")
        
        with open(csv_path, mode='r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile, delimiter=';')
            count = 0
            
            # Expected headers:
            # name;number;city;state;obedience_name;obedience_acronym;obedience_type;parent_obedience_acronym
            
            for row in reader:
                name = row.get('name', '').strip()
                number = row.get('number', '').strip()
                city = row.get('city', '').strip()
                state = row.get('state', '').strip()
                ob_name = row.get('obedience_name', '').strip()
                ob_acronym = row.get('obedience_acronym', '').strip()
                ob_type = row.get('obedience_type', '').strip() # Federal, Estadual
                parent_ob_acronym = row.get('parent_obedience_acronym', '').strip()
                
                if not name or not number or not ob_acronym:
                    print(f"Skipping invalid row: {row}")
                    continue
                
                # Ensure Obedience exists
                obedience = ensure_obedience(db, ob_name, ob_acronym, ob_type, parent_ob_acronym)
                
                # Check if Lodge exists
                existing = db.query(Lodge).filter(
                    Lodge.lodge_name == name,
                    Lodge.lodge_number == number,
                    Lodge.obedience_id == obedience.id
                ).first()
                
                if existing:
                    print(f"Lodge {name} N. {number} ({ob_acronym}) already exists.")
                    continue
                
                print(f"Creating Lodge: {name} N. {number} ({ob_acronym})")
                new_lodge = Lodge(
                    lodge_name=name,
                    lodge_code=str(uuid.uuid4()),
                    lodge_number=number,
                    obedience_id=obedience.id,
                    technical_contact_name="Imported Admin",
                    technical_contact_email=f"admin_{number}@{ob_acronym.lower()}.org.br",
                    city=city,
                    state=state,
                    is_active=True,
                    rite=RiteEnum.REAA # Defaulting to REAA as requested previously
                )
                db.add(new_lodge)
                count += 1
            
            db.commit()
            print(f"Successfully imported {count} lodges.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        import_generic_lodges(sys.argv[1])
    else:
        print("Usage: python import_generic_lodges.py <path_to_csv>")
