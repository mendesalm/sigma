from backend.database import SessionLocal
from backend.models import models
from backend.models.models import DegreeEnum, RegistrationStatusEnum

db = SessionLocal()

member = db.query(models.Member).first()
if member:
    print(f"Fixing member: {member.full_name}")
    print(f"  Current degree: {member.degree}")
    print(f"  Current registration_status: {member.registration_status}")
    
    # Fix the values
    member.degree = DegreeEnum.MASTER
    member.registration_status = RegistrationStatusEnum.APPROVED
    
    db.commit()
    db.refresh(member)
    
    print(f"\n  Fixed degree: {member.degree}")
    print(f"  Fixed registration_status: {member.registration_status}")
    print("\n✅ Member fixed successfully!")
else:
    print("No member found")

db.close()
