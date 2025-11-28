from backend.database import SessionLocal
from backend.models import models
from backend.schemas import member_schema
from pydantic import ValidationError
import json

db = SessionLocal()

member = db.query(models.Member).first()

if member:
    print(f"Testing serialization for: {member.full_name}")
    
    try:
        # Using model_validate (Pydantic v2)
        member_response = member_schema.MemberResponse.model_validate(member)
        print("\n✅ Serialization SUCCESS!")
        
        # Try to convert to JSON
        json_data = member_response.model_dump_json()
        print(f"\nJSON length: {len(json_data)} characters")
        print("\nFirst 500 chars:")
        print(json_data[:500])
        
    except ValidationError as e:
        print("\n❌ Validation error:")
        for error in e.errors():
            print(f"  Field: {error['loc']}")
            print(f"  Error: {error['msg']}")
            print(f"  Type: {error['type']}")
            print()
    except Exception as e:
        print(f"\n❌ Other error: {e}")
        import traceback
        traceback.print_exc()

db.close()
