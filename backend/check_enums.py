from backend.database import SessionLocal
from backend.models import models

db = SessionLocal()

member = db.query(models.Member).first()
if member:
    print(f"Member: {member.full_name}")
    print(f"  degree (raw): '{member.degree}'")
    print(f"  degree (type): {type(member.degree)}")
    print(f"  registration_status (raw): '{member.registration_status}'")
    print(f"  registration_status (type): {type(member.registration_status)}")
    
    # Check enum values
    from backend.models.models import DegreeEnum, RegistrationStatusEnum
    print(f"\nValid DegreeEnum values:")
    for e in DegreeEnum:
        print(f"  - {e.value}")
    print(f"\nValid RegistrationStatusEnum values:")
    for e in RegistrationStatusEnum:
        print(f"  - {e.value}")

db.close()
