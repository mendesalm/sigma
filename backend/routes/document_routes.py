from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import database

# from schemas import document_schema # TODO: Create document_schema if not exists
# from services import document_service # TODO: Create document_service if not exists

router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)

from fastapi import APIRouter

from database import get_db
from dependencies import get_current_user_payload
from schemas import document_schema
from services import document_service

router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)

# --- INSTANCE ROUTES (Novo Padrão On-The-Fly) ---


@router.post("/instances", response_model=document_schema.DocumentInstanceResponse)
def save_document_draft(
    payload: document_schema.DocumentInstanceCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    """Salva ou atualiza um rascunho de HTML Instanciado (Substitui salvamento e geração de PDF local)."""
    return document_service.create_or_update_document_instance(
        db=db,
        lodge_id=payload.lodge_id,
        session_id=payload.session_id,
        document_type=payload.document_type,
        draft_html_content=payload.draft_html_content,
        current_user_payload=current_user,
    )


@router.get("/instances/{instance_id}", response_model=document_schema.DocumentInstanceResponse)
def get_instance(
    instance_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user_payload)
):
    """Recupera o HTML do Rascunho ou Documento Finalizado."""
    return document_service.get_document_instance(db, instance_id, current_user)


@router.get("/instances", response_model=list[document_schema.DocumentInstanceResponse])
def list_instances(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user_payload)):
    lodge_id = current_user.get("lodge_id")
    return document_service.get_all_document_instances_by_lodge(db, lodge_id)


@router.post("/instances/{instance_id}/finalize", response_model=document_schema.DocumentInstanceResponse)
def finalize_instance(
    instance_id: int,
    payload: document_schema.DocumentInstanceUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    """Trava o documento como FINALIZADO, impedindo novas edições."""
    if not payload.final_html_content:
        raise HTTPException(status_code=400, detail="final_html_content é obrigatório para finalizar.")
    return document_service.finalize_document_instance(db, instance_id, payload.final_html_content, current_user)


@router.get("/instances/{instance_id}/download")
async def download_instance_pdf(
    instance_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user_payload)
):
    """
    Motor Dinâmico: Lê a instância da tabela, compila o HTML com os recursos visuais locais da loja
    e gera o PDF On-The-Fly com WeasyPrint. Retorna um stream e não grava no disco.
    """
    from fastapi.responses import Response

    from services.document_generation_service import DocumentGenerationService

    instance = document_service.get_document_instance(db, instance_id, current_user)
    html_target = instance.final_html_content if instance.status == "FINALIZED" else instance.draft_html_content

    if not html_target:
        raise HTTPException(status_code=400, detail="HTML do documento está vazio.")

    service = DocumentGenerationService(db)

    # Injeta recursos visuais da loja específicos usando Base64.
    lodge_logo_b64 = service._get_lodge_logo(instance.lodge_id)
    footer_logo_b64 = service._get_base64_asset("images/logoRB_.png")

    # Exemplo simples de wrapper HTML ao redor do Fragmento do Banco (isso será expandido dinamicamente)
    full_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Times New Roman', serif; font-size: 14pt; margin: 20px; }}
            .header {{ text-align: center; margin-bottom: 20px; }}
            .header img {{ max-width: 100px; }}
            .content {{ text-align: justify; line-height: 1.5; }}
            .footer {{ position: fixed; bottom: 0; text-align: center; width: 100%; font-size: 10pt; }}
        </style>
    </head>
    <body>
        <div class="header">
            <img src="{lodge_logo_b64}" alt="Logo Loja">
        </div>
        <div class="content">
            {html_target}
        </div>
        <div class="footer">
            <img src="{footer_logo_b64}" alt="Selo Systema" style="height:40px;"><br>
            Documento gerado dinamicamente via Sigma. Assinaturas e Hashes (se existentes) garantem integridade.
        </div>
    </body>
    </html>
    """

    # Gera o PDF Dinamicamente
    pdf_bytes = await service._generate_pdf_from_html(full_html)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=documento_{instance_id}.pdf"},
    )


# --- OLD ROUTES ---
from typing import Any

from pydantic import BaseModel


class PreviewRequest(BaseModel):
    template_name: str
    context: dict[str, Any]


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
def get_document_variables(doc_type: str, lodge_id: int | None = None, db: Session = Depends(database.get_db)):
    """
    Returns the dictionary of available variables (tokens) for a specific document type.
    """
    from services.document_generation_service import DocumentGenerationService

    service = DocumentGenerationService(db)
    return service.get_variables_for_document_type(doc_type, lodge_id)


@router.get("/defaults/{doc_type}")
def get_document_defaults(doc_type: str, db: Session = Depends(database.get_db)):
    """
    Returns the default HTML templates (content, signatures) for the doc type.
    """
    from services.document_generation_service import DocumentGenerationService

    service = DocumentGenerationService(db)
    return service.get_default_templates(doc_type)


@router.post("/preview/{doc_type}")
async def get_full_document_preview(doc_type: str, payload: dict[str, Any], db: Session = Depends(database.get_db)):
    """
    Renders the FULL document HTML preview (Header + Titles + Body + Footer) for a given type.
    Payload: { "settings": DocumentSettings, "lodge_id": Optional[int] }
    """
    from services.document_generation_service import DocumentGenerationService

    service = DocumentGenerationService(db)

    settings = payload.get("settings", {})
    lodge_id = payload.get("lodge_id")
    session_id = payload.get("session_id")

    print(f"DEBUG: Preview Settings Payload: {settings}, Session ID: {session_id}")

    html = await service.generate_preview_html(doc_type, settings, lodge_id, session_id=session_id)

    try:
        with open("debug_preview_output.html", "w", encoding="utf-8") as f:
            f.write(html)
        print("DEBUG: Saved debug_preview_output.html")
    except Exception as e:
        print(f"DEBUG: Error saving debug file: {e}")

    return {"html": html}
