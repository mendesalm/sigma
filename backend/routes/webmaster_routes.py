from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import schemas
from ..database import get_db
from ..services import webmaster_service

router = APIRouter(
    prefix="/webmasters",
    tags=["Webmasters"],
    # dependencies=[Depends(get_current_active_user)], # TODO: Add authentication
)

@router.get("/", response_model=List[schemas.Webmaster])
def read_webmasters(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    webmasters = webmaster_service.get_webmasters(db, skip=skip, limit=limit)
    return webmasters

@router.get("/{webmaster_id}", response_model=schemas.Webmaster)
def read_webmaster(webmaster_id: int, db: Session = Depends(get_db)):
    db_webmaster = webmaster_service.get_webmaster(db, webmaster_id=webmaster_id)
    if db_webmaster is None:
        raise HTTPException(status_code=404, detail="Webmaster não encontrado")
    return db_webmaster

@router.post("/{webmaster_id}/reset-password", response_model=schemas.Webmaster)
def reset_webmaster_password(webmaster_id: int, db: Session = Depends(get_db)):
    db_webmaster = webmaster_service.reset_password(db, webmaster_id=webmaster_id)
    if db_webmaster is None:
        raise HTTPException(status_code=404, detail="Webmaster não encontrado")
    return db_webmaster
