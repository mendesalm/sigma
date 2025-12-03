from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import get_oriente_db
from models.external_models import ExternalLodge
from schemas.external_lodge_schema import ExternalLodgeResponse

router = APIRouter(
    prefix="/external-lodges",
    tags=["Lojas Externas (Oriente Data)"],
)

@router.get("/search", response_model=list[ExternalLodgeResponse])
def search_external_lodges(
    query: str = Query(..., min_length=2, description="Nome ou número da loja para buscar"),
    db: Session = Depends(get_oriente_db)
):
    """
    Busca lojas na base de dados unificada (Oriente Data).
    Usado para auto-cadastro de visitantes.
    """
    # Normaliza a query para busca case-insensitive
    search_term = f"%{query}%"
    
    lodges = db.query(ExternalLodge).filter(
        or_(
            ExternalLodge.name.ilike(search_term),
            ExternalLodge.number.ilike(search_term)
        )
    ).limit(20).all()
    
    return lodges
