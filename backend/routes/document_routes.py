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

from pydantic import BaseModel
from typing import Dict, Any

class PreviewRequest(BaseModel):
    template_name: str
    context: Dict[str, Any]

@router.post("/preview/render")
def render_preview(payload: PreviewRequest, db: Session = Depends(database.get_db)):
    """
    Renders a partial template (header/footer) given a context.
    """
    from services.document_generation_service import DocumentGenerationService
    service = DocumentGenerationService(db)
    
    html_content = service.render_partial(payload.template_name, payload.context)
    return {"html": html_content}
