from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional

import database
import dependencies
from models import models
# from schemas import document_schema # TODO: Create document_schema if not exists
# from services import document_service # TODO: Create document_service if not exists

router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)

@router.get("/")
def read_documents():
    return {"message": "Documents endpoint"}
