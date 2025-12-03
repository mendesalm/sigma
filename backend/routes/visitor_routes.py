from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_oriente_db
from models.global_models import GlobalVisitor
from schemas.visitor_schema import VisitorCreate, VisitorResponse

router = APIRouter(
    prefix="/visitors",
    tags=["Visitantes (Global)"],
)

@router.post("/register", response_model=VisitorResponse, status_code=status.HTTP_201_CREATED)
def register_visitor(
    visitor_data: VisitorCreate,
    db: Session = Depends(get_oriente_db)
):
    """
    Registra ou atualiza um visitante na base global (Oriente Data).
    Retorna o registro com o ID (token) para geração do QR Code.
    """
    # Verifica se já existe pelo CIM
    existing_visitor = db.query(GlobalVisitor).filter(GlobalVisitor.cim == visitor_data.cim).first()
    
    if existing_visitor:
        # Atualiza dados existentes
        existing_visitor.full_name = visitor_data.full_name
        existing_visitor.degree = visitor_data.degree
        existing_visitor.origin_lodge_id = visitor_data.origin_lodge_id
        existing_visitor.manual_lodge_name = visitor_data.manual_lodge_name
        existing_visitor.manual_lodge_number = visitor_data.manual_lodge_number
        existing_visitor.manual_lodge_obedience = visitor_data.manual_lodge_obedience
        existing_visitor.updated_at = datetime.now()
        
        db.commit()
        db.refresh(existing_visitor)
        return existing_visitor
    else:
        # Cria novo visitante
        new_visitor = GlobalVisitor(
            full_name=visitor_data.full_name,
            cim=visitor_data.cim,
            degree=visitor_data.degree,
            origin_lodge_id=visitor_data.origin_lodge_id,
            manual_lodge_name=visitor_data.manual_lodge_name,
            manual_lodge_number=visitor_data.manual_lodge_number,
            manual_lodge_obedience=visitor_data.manual_lodge_obedience
        )
        
        db.add(new_visitor)
        db.commit()
        db.refresh(new_visitor)
        return new_visitor
