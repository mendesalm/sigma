from backend.database import SessionLocal
from backend.models import models
from backend.schemas import member_schema
from pydantic import ValidationError

db = SessionLocal()

print("Fetching member...")
member = db.query(models.Member).first()

if member:
    print(f"Member found: {member.full_name}")
    print(f"Member degree: {member.degree}")
    print(f"Member registration_status: {member.registration_status}")
    
    try:
        # Try to serialize to Pydantic model
        member_response = member_schema.MemberResponse.model_validate(member)
        print("\n✅ Serialization SUCCESS")
        print(f"As dict: {member_response.model_dump()}")
    except ValidationError as e:
        print("\n❌ Serialization FAILED:")
        print(e)
else:
    print("No member found")

db.close()
