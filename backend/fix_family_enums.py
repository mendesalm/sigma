from backend.database import SessionLocal
from backend.models import models
from backend.models.models import RelationshipTypeEnum

db = SessionLocal()

family_members = db.query(models.FamilyMember).all()
print(f"Found {len(family_members)} family members")

for fm in family_members:
    print(f"\nFamily member: {fm.full_name}")
    print(f"  Current relationship_type: {fm.relationship_type}")
    
    # Fix based on current value
    if "Spouse" in str(fm.relationship_type) or "spouse" in str(fm.relationship_type).lower():
        fm.relationship_type = RelationshipTypeEnum.SPOUSE
    elif "Son" in str(fm.relationship_type) or "son" in str(fm.relationship_type).lower() or "filho" in str(fm.relationship_type).lower():
        fm.relationship_type = RelationshipTypeEnum.SON
    elif "Daughter" in str(fm.relationship_type) or "daughter" in str(fm.relationship_type).lower() or "filha" in str(fm.relationship_type).lower():
        fm.relationship_type = RelationshipTypeEnum.DAUGHTER
    
    print(f"  Fixed relationship_type: {fm.relationship_type}")

db.commit()
print("\n✅ All family members fixed!")

db.close()
