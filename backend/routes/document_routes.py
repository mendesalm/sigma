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

@router.get("/variables/{doc_type}")
def get_document_variables(doc_type: str, lodge_id: Optional[int] = None, db: Session = Depends(database.get_db)):
    """
    Returns the dictionary of available variables (tokens) for a specific document type.
    """
    from services.document_generation_service import DocumentGenerationService
    service = DocumentGenerationService(db)
    return service.get_variables_for_document_type(doc_type, lodge_id)


@router.post("/preview/{doc_type}")
def get_full_document_preview(doc_type: str, payload: Dict[str, Any], db: Session = Depends(database.get_db)):
    """
    Renders the FULL document HTML preview (Header + Titles + Body + Footer) for a given type.
    Payload: { "settings": DocumentSettings, "lodge_id": Optional[int] }
    """
    from services.document_generation_service import DocumentGenerationService
    service = DocumentGenerationService(db)
    
    settings = payload.get("settings", {})
    lodge_id = payload.get("lodge_id")
    
    print(f"DEBUG: Preview Settings Payload: {settings}")
    
    html = service.generate_preview_html(doc_type, settings, lodge_id)
    
    try:
        with open("debug_preview_output.html", "w", encoding="utf-8") as f:
            f.write(html)
        print("DEBUG: Saved debug_preview_output.html")
    except Exception as e:
        print(f"DEBUG: Error saving debug file: {e}")
        
    return {"html": html}
