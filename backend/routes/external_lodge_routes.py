from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import get_db
from models.models import Lodge
from schemas.external_lodge_schema import ExternalLodgeResponse

router = APIRouter(
    prefix="/external-lodges",
    tags=["Lojas (Busca Pública)"],
)

@router.get("/search", response_model=list[ExternalLodgeResponse])
def search_external_lodges(
    query: str = Query(..., min_length=2, description="Nome ou número da loja para buscar"),
    db: Session = Depends(get_db)
):
    """
    Busca lojas na base de dados principal (Sigma DB).
    Retorna lojas ativas e inativas para fins de cadastro de visitante.
    """
    search_term = f"%{query}%"
    
    lodges = db.query(Lodge).filter(
        or_(
            Lodge.lodge_name.ilike(search_term),
            Lodge.lodge_number.ilike(search_term)
        )
    ).limit(20).all()
    
    # Mapeamento manual para o schema de resposta
    results = []
    for lodge in lodges:
        results.append({
            "id": lodge.id,
            "name": lodge.lodge_name,
            "number": lodge.lodge_number,
            "obedience": lodge.obedience.name if lodge.obedience else None,
            "city": lodge.city,
            "state": lodge.state
        })
        
    return results
