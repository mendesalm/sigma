from backend.database import SessionLocal
from backend.models import models
from backend.schemas import member_schema
from pydantic import ValidationError
import traceback

db = SessionLocal()

member = db.query(models.Member).first()

if member:
    print(f"Member: {member.full_name}")
    print(f"  Degree: {member.degree}")
    print(f"  Status: {member.registration_status}")
    print(f"  Family members: {len(member.family_members) if hasattr(member, 'family_members') else 0}")
    print(f"  Role history: {len(member.role_history) if hasattr(member, 'role_history') else 0}")
    
    try:
        member_dict = {
            "id": member.id,
            "email": member.email,
            "full_name": member.full_name,
            "cpf": member.cpf,
            "birth_date": member.birth_date,
            "degree": member.degree,
            "registration_status": member.registration_status,
            "created_at": member.created_at,
            "family_members": [],
            "decorations": [],
            "role_history": [],
            "lodge_associations": [],
            "obedience_associations": []
        }
        member_response = member_schema.MemberResponse(**member_dict)
        print("\n✅ Manual serialization SUCCESS")
    except Exception as e:
        print(f"\n❌ Manual serialization FAILED:")
        traceback.print_exc()

db.close()
