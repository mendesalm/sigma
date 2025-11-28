from backend.database import SessionLocal
from backend.models import models

db = SessionLocal()

print("\n=== CHECKING WEBMASTER ===")
webmaster = db.query(models.Webmaster).filter(models.Webmaster.email == "loja2181@sigma.com").first()
if webmaster:
    print(f"Webmaster found:")
    print(f"  ID: {webmaster.id}")
    print(f"  Email: {webmaster.email}")
    print(f"  Lodge ID: {webmaster.lodge_id}")
    print(f"  Obedience ID: {webmaster.obedience_id}")
else:
    print("Webmaster NOT found!")

print("\n=== CHECKING LODGES ===")
lodges = db.query(models.Lodge).all()
for lodge in lodges:
    print(f"Lodge ID {lodge.id}: {lodge.lodge_name}")

print("\n=== CHECKING MEMBERS ===")
members = db.query(models.Member).all()
for member in members:
    print(f"Member ID {member.id}: {member.full_name} ({member.email})")

print("\n=== CHECKING MEMBER-LODGE ASSOCIATIONS ===")
associations = db.query(models.MemberLodgeAssociation).all()
for assoc in associations:
    member = db.query(models.Member).filter(models.Member.id == assoc.member_id).first()
    lodge = db.query(models.Lodge).filter(models.Lodge.id == assoc.lodge_id).first()
    print(f"Association:")
    print(f"  Member: {member.full_name if member else 'NOT FOUND'} (ID: {assoc.member_id})")
    print(f"  Lodge: {lodge.lodge_name if lodge else 'NOT FOUND'} (ID: {assoc.lodge_id})")

if webmaster and webmaster.lodge_id:
    print(f"\n=== MEMBERS IN WEBMASTER'S LODGE (ID {webmaster.lodge_id}) ===")
    lodge_members = (
        db.query(models.Member)
        .join(models.MemberLodgeAssociation)
        .filter(models.MemberLodgeAssociation.lodge_id == webmaster.lodge_id)
        .all()
    )
    print(f"Found {len(lodge_members)} members:")
    for member in lodge_members:
        print(f"  - {member.full_name} ({member.email})")

db.close()
