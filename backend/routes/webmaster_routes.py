from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import models
from ..schemas import webmaster_schema
from ..services import webmaster_service
from ..middleware.dependencies import get_db

router = APIRouter()

@router.post("/webmasters/", response_model=webmaster_schema.Webmaster)
def create_webmaster(webmaster: webmaster_schema.WebmasterCreate, db: Session = Depends(get_db)):
    db_webmaster = webmaster_service.get_webmaster_by_email(db, email=webmaster.email)
    if db_webmaster:
        raise HTTPException(status_code=400, detail="Email already registered")
    return webmaster_service.create_webmaster(db=db, webmaster=webmaster)


@router.get("/webmasters/", response_model=List[webmaster_schema.Webmaster])
def read_webmasters(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    webmasters = webmaster_service.get_webmasters(db, skip=skip, limit=limit)
    return webmasters


@router.get("/webmasters/{webmaster_id}", response_model=webmaster_schema.Webmaster)
def read_webmaster(webmaster_id: int, db: Session = Depends(get_db)):
    db_webmaster = webmaster_service.get_webmaster(db, webmaster_id=webmaster_id)
    if db_webmaster is None:
        raise HTTPException(status_code=404, detail="Webmaster not found")
    return db_webmaster


@router.put("/webmasters/{webmaster_id}", response_model=webmaster_schema.Webmaster)
def update_webmaster(webmaster_id: int, webmaster: webmaster_schema.WebmasterUpdate, db: Session = Depends(get_db)):
    db_webmaster = webmaster_service.update_webmaster(db, webmaster_id=webmaster_id, webmaster=webmaster)
    if db_webmaster is None:
        raise HTTPException(status_code=404, detail="Webmaster not found")
    return db_webmaster


@router.delete("/webmasters/{webmaster_id}", response_model=webmaster_schema.Webmaster)
def delete_webmaster(webmaster_id: int, db: Session = Depends(get_db)):
    db_webmaster = webmaster_service.delete_webmaster(db, webmaster_id=webmaster_id)
    if db_webmaster is None:
        raise HTTPException(status_code=404, detail="Webmaster not found")
    return db_webmaster
