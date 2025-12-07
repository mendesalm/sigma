from sqlalchemy.orm import Session, joinedload
from models import models
from schemas import committee_schema
from fastapi import HTTPException, status
from typing import List

def check_if_member_is_orator(db: Session, member_id: int, lodge_id: int) -> bool:
    """
    Verifica se o membro possui o cargo ativo de 'Orador' na loja.
    """
    active_role = db.query(models.RoleHistory).join(models.Role).filter(
        models.RoleHistory.member_id == member_id,
        models.RoleHistory.lodge_id == lodge_id,
        models.RoleHistory.end_date.is_(None),
        models.Role.name == "Orador"
    ).first()
    
    return active_role is not None

def get_committees(db: Session, lodge_id: int) -> List[models.Committee]:
    return db.query(models.Committee).filter(
        models.Committee.lodge_id == lodge_id
    ).options(
        joinedload(models.Committee.president),
        joinedload(models.Committee.members).joinedload(models.CommitteeMember.member)
    ).all()

def create_committee(db: Session, committee: committee_schema.CommitteeCreate, lodge_id: int) -> models.Committee:
    # 1. Validate President (Orador check)
    if check_if_member_is_orator(db, committee.president_id, lodge_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="O membro com cargo atual de 'Orador' não pode ser escolhido para nenhuma comissão (Lei)."
        )

    # 2. Validate Members (Orador check)
    for member_id in committee.member_ids:
        if member_id == committee.president_id:
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="O presidente não pode ser listado como membro.")
        
        if check_if_member_is_orator(db, member_id, lodge_id):
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"O membro (ID {member_id}) é Orador e não pode participar de comissão."
            )

    # 3. Create Committee
    db_committee = models.Committee(
        name=committee.name,
        description=committee.description,
        committee_type=committee.committee_type,
        start_date=committee.start_date,
        end_date=committee.end_date,
        lodge_id=lodge_id,
        president_id=committee.president_id
    )
    db.add(db_committee)
    db.commit()
    db.refresh(db_committee)

    # 4. Add Members
    for member_id in committee.member_ids:
        db_member = models.CommitteeMember(
            committee_id=db_committee.id,
            member_id=member_id,
            role="Membro"
        )
        db.add(db_member)
    
    db.commit()
    db.refresh(db_committee)
    return db_committee

def update_committee(db: Session, committee_id: int, committee_update: committee_schema.CommitteeUpdate, lodge_id: int) -> models.Committee:
    db_committee = db.query(models.Committee).filter(models.Committee.id == committee_id, models.Committee.lodge_id == lodge_id).first()
    if not db_committee:
        raise HTTPException(status_code=404, detail="Comissão não encontrada.")

    # Update basic fields
    if committee_update.name: db_committee.name = committee_update.name
    if committee_update.description: db_committee.description = committee_update.description
    if committee_update.committee_type: db_committee.committee_type = committee_update.committee_type
    if committee_update.start_date: db_committee.start_date = committee_update.start_date
    if committee_update.end_date: db_committee.end_date = committee_update.end_date
    
    # Update President
    if committee_update.president_id:
        if check_if_member_is_orator(db, committee_update.president_id, lodge_id):
             raise HTTPException(status_code=400, detail="O Orador não pode ser presidente.")
        db_committee.president_id = committee_update.president_id

    # Update Members (Replace all)
    if committee_update.member_ids is not None:
        # Remove existing
        db.query(models.CommitteeMember).filter(models.CommitteeMember.committee_id == committee_id).delete()
        
        # Add new
        for member_id in committee_update.member_ids:
            if check_if_member_is_orator(db, member_id, lodge_id):
                raise HTTPException(status_code=400, detail=f"Membro ID {member_id} é Orador.")
            
            db_member = models.CommitteeMember(
                committee_id=committee_id,
                member_id=member_id,
                role="Membro"
            )
            db.add(db_member)

    db.commit()
    db.refresh(db_committee)
    return db_committee

def delete_committee(db: Session, committee_id: int, lodge_id: int):
    db_committee = db.query(models.Committee).filter(models.Committee.id == committee_id, models.Committee.lodge_id == lodge_id).first()
    if not db_committee:
        raise HTTPException(status_code=404, detail="Comissão não encontrada.")
    
    db.delete(db_committee)
    db.commit()
