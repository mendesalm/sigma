from backend.database import SessionLocal
from backend.models import models
import sys

db = SessionLocal()

# Check webmaster
webmaster = db.query(models.Webmaster).filter(models.Webmaster.email == "loja2181@sigma.com").first()
print("Webmaster ID:", webmaster.id if webmaster else "NOT FOUND")
print("Webmaster lodge_id:", webmaster.lodge_id if webmaster else "N/A")

# Check associations
associations = db.query(models.MemberLodgeAssociation).all()
print(f"\nTotal associations: {len(associations)}")
for a in associations:
    print(f"  member_id={a.member_id}, lodge_id={a.lodge_id}")

# Check members
members = db.query(models.Member).all()
print(f"\nTotal members: {len(members)}")

db.close()
