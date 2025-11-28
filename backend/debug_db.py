from backend.database import SessionLocal
from backend.models import models

db = SessionLocal()

with open("debug_output.txt", "w", encoding="utf-8") as f:
    # f.write("--- Members ---\n")
    # members = db.query(models.Member).all()
    # for m in members:
    #     f.write(f"ID: {m.id}, Name: {m.full_name}, Email: {m.email}\n")

    f.write("\n--- Associations ---\n")
    associations = db.query(models.MemberLodgeAssociation).all()
    if not associations:
        f.write("No associations found.\n")
    for a in associations:
        f.write(f"Member ID: {a.member_id}, Lodge ID: {a.lodge_id}\n")

    f.write("\n--- Lodges ---\n")
    lodges = db.query(models.Lodge).all()
    if not lodges:
        f.write("No lodges found.\n")
    for l in lodges:
        f.write(f"ID: {l.id}, Name: {l.lodge_name}\n")

db.close()
