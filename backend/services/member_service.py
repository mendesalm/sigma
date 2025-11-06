from sqlalchemy.orm import Session
from .. import models
from ..schemas import member_schema
from ..services.auth_service import get_password_hash

def get_member(db: Session, member_id: int):
    return db.query(models.Member).filter(models.Member.id == member_id).first()

def get_member_by_email(db: Session, email: str):
    return db.query(models.Member).filter(models.Member.email == email).first()

def get_members(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Member).offset(skip).limit(limit).all()

def create_member_with_association(db: Session, member: member_schema.MemberCreateWithAssociation):
    hashed_password = get_password_hash(member.password)
    db_member = models.Member(
        full_name=member.full_name,
        email=member.email,
        password_hash=hashed_password,
        cpf=member.cpf,
        identity_document=member.identity_document,
        birth_date=member.birth_date,
        marriage_date=member.marriage_date,
        street_address=member.street_address,
        street_number=member.street_number,
        neighborhood=member.neighborhood,
        city=member.city,
        zip_code=member.zip_code,
        phone=member.phone,
        place_of_birth=member.place_of_birth,
        nationality=member.nationality,
        religion=member.religion,
        fathers_name=member.fathers_name,
        mothers_name=member.mothers_name,
        education_level=member.education_level,
        occupation=member.occupation,
        workplace=member.workplace,
        profile_picture_path=member.profile_picture_path,
        cim=member.cim,
        status=member.status,
        degree=member.degree,
        initiation_date=member.initiation_date,
        elevation_date=member.elevation_date,
        exaltation_date=member.exaltation_date,
        affiliation_date=member.affiliation_date,
        regularization_date=member.regularization_date,
        philosophical_degree=member.philosophical_degree,
        registration_status=member.registration_status
    )
    db.add(db_member)
    db.commit()
    db.refresh(db_member)

    # Create the association
    db_association = models.MemberLodgeAssociation(
        member_id=db_member.id,
        lodge_id=member.lodge_id,
        role_id=member.role_id
    )
    db.add(db_association)
    db.commit()
    db.refresh(db_association)

    return db_member

def update_member(db: Session, member_id: int, member: member_schema.MemberUpdate):
    db_member = get_member(db, member_id)
    if not db_member:
        return None

    update_data = member.dict(exclude_unset=True)
    if "password" in update_data:
        hashed_password = get_password_hash(update_data["password"])
        update_data["password_hash"] = hashed_password
        del update_data["password"]

    for key, value in update_data.items():
        setattr(db_member, key, value)

    db.commit()
    db.refresh(db_member)
    return db_member

def delete_member(db: Session, member_id: int):
    db_member = get_member(db, member_id)
    if not db_member:
        return None
    db.delete(db_member)
    db.commit()
    return db_member
