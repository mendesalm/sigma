from backend.database import SessionLocal
from backend.models import models

db = SessionLocal()

member = db.query(models.Member).filter(models.Member.id == 1).first()
if member:
    print(f"Member: {member.full_name}")
    print(f"Profile picture path in DB: '{member.profile_picture_path}'")
else:
    print("Member not found")

db.close()
