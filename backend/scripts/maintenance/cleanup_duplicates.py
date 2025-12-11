from sqlalchemy import func
from sqlalchemy.orm import Session
from database import SessionLocal
from models.models import FamilyMember, RoleHistory

def cleanup_duplicates():
    db = SessionLocal()
    
    # Cleanup FamilyMembers
    # Group by member_id and full_name
    print("Cleaning FamilyMembers...")
    duplicates = db.query(
        FamilyMember.member_id,
        FamilyMember.full_name,
        func.count(FamilyMember.id)
    ).group_by(
        FamilyMember.member_id,
        FamilyMember.full_name
    ).having(func.count(FamilyMember.id) > 1).all()
    
    for member_id, name, count in duplicates:
        print(f"Found {count} records for {name} (Member {member_id})")
        # Get all records
        records = db.query(FamilyMember).filter(
            FamilyMember.member_id == member_id,
            FamilyMember.full_name == name
        ).order_by(FamilyMember.id).all()
        
        # Keep the first one, delete the rest
        for r in records[1:]:
            db.delete(r)
    
    db.commit()
    
    # Cleanup RoleHistory
    # Group by member_id, role_id, start_date
    print("Cleaning RoleHistory...")
    duplicates_roles = db.query(
        RoleHistory.member_id,
        RoleHistory.role_id,
        RoleHistory.start_date,
        func.count(RoleHistory.id)
    ).group_by(
        RoleHistory.member_id,
        RoleHistory.role_id,
        RoleHistory.start_date
    ).having(func.count(RoleHistory.id) > 1).all()
    
    for member_id, role_id, start_date, count in duplicates_roles:
        print(f"Found {count} records for Member {member_id}, Role {role_id}, Start {start_date}")
        records = db.query(RoleHistory).filter(
            RoleHistory.member_id == member_id,
            RoleHistory.role_id == role_id,
            RoleHistory.start_date == start_date
        ).order_by(RoleHistory.id).all()
        
        for r in records[1:]:
            db.delete(r)
            
    db.commit()
    print("Cleanup completed.")
    db.close()

if __name__ == "__main__":
    cleanup_duplicates()
