from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import dependencies, schemas
from ..database import get_db
from ..services import webmaster_service

router = APIRouter(
    prefix="/webmasters",
    tags=["Webmasters"],
)


@router.get("/", response_model=list[schemas.Webmaster])
def read_webmasters(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(dependencies.get_current_super_admin),
):
    webmasters = webmaster_service.get_webmasters(db, skip=skip, limit=limit)
    return webmasters


@router.get("/{webmaster_id}", response_model=schemas.Webmaster)
def read_webmaster(
    webmaster_id: int, db: Session = Depends(get_db), current_user: dict = Depends(dependencies.get_current_super_admin)
):
    db_webmaster = webmaster_service.get_webmaster(db, webmaster_id=webmaster_id)
    if db_webmaster is None:
        raise HTTPException(status_code=404, detail="Webmaster não encontrado")
    return db_webmaster


@router.post("/", response_model=schemas.Webmaster, status_code=201)
def create_webmaster(
    webmaster: schemas.WebmasterCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(dependencies.get_current_super_admin),
):
    return webmaster_service.create_webmaster(db=db, webmaster=webmaster)


@router.put("/{webmaster_id}", response_model=schemas.Webmaster)
def update_webmaster(
    webmaster_id: int,
    webmaster_update: schemas.WebmasterUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(dependencies.get_current_super_admin),
):
    db_webmaster = webmaster_service.update_webmaster(
        db=db, webmaster_id=webmaster_id, webmaster_update=webmaster_update
    )
    if db_webmaster is None:
        raise HTTPException(status_code=404, detail="Webmaster não encontrado")
    return db_webmaster


@router.delete("/{webmaster_id}", status_code=204)
def delete_webmaster(
    webmaster_id: int, db: Session = Depends(get_db), current_user: dict = Depends(dependencies.get_current_super_admin)
):
    db_webmaster = webmaster_service.delete_webmaster(db=db, webmaster_id=webmaster_id)
    if db_webmaster is None:
        raise HTTPException(status_code=404, detail="Webmaster não encontrado")
    return


@router.post("/{webmaster_id}/reset-password", response_model=schemas.Webmaster)
def reset_webmaster_password(
    webmaster_id: int, db: Session = Depends(get_db), current_user: dict = Depends(dependencies.get_current_super_admin)
):
    db_webmaster = webmaster_service.reset_password(db, webmaster_id=webmaster_id)
    if db_webmaster is None:
        raise HTTPException(status_code=404, detail="Webmaster não encontrado")
    return db_webmaster
