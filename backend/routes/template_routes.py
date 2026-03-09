from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user_payload
from schemas import template_schema
from services import template_service

router = APIRouter(prefix="/templates", tags=["Templates"])


@router.get("/{template_type}/active")
def get_active_template(
    template_type: str, db: Session = Depends(get_db), current_user_payload: dict = Depends(get_current_user_payload)
):
    """Retorna o template local da Loja do usuário; se não houver, retorna o template Global."""
    template_type = template_type.upper()
    if template_type not in ["BALAUSTRE", "EDITAL"]:
        raise HTTPException(status_code=400, detail="Tipo de template inválido.")

    lodge_id = current_user_payload.get("lodge_id")
    if not lodge_id:
        raise HTTPException(status_code=400, detail="Usuário não está associado a nenhuma Loja.")

    template = template_service.get_active_template(db, lodge_id, template_type)

    if not template:
        # Se não existe no banco, retorna o conteúdo padrão do arquivo (Legacy Fallback)
        content = template_service.get_default_template_content(template_type)
        if not content:
            raise HTTPException(status_code=404, detail="Template padrão não encontrado no banco nem em arquivos.")

        return {"id": 0, "document_type": template_type, "html_content": content, "is_global": True}

    return template


@router.post("/global", response_model=template_schema.GlobalDocumentTemplateResponse)
def save_global_template(
    template_data: template_schema.GlobalDocumentTemplateCreate,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload),
):
    # TODO: Verificar permissão de SuperAdmin
    template_data.document_type = template_data.document_type.upper()
    return template_service.create_or_update_global_template(db, template_data)


@router.post("/local", response_model=template_schema.LocalDocumentTemplateResponse)
def save_local_template(
    template_data: template_schema.LocalDocumentTemplateUpdate,
    document_type: str,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload),
):
    # TODO: Verificar permissão de Webmaster
    lodge_id = current_user_payload.get("lodge_id")
    if not lodge_id:
        raise HTTPException(status_code=400, detail="Usuário incapaz de editar local templates pois não tem lodge_id.")

    document_type = document_type.upper()
    return template_service.create_or_update_local_template(db, lodge_id, template_data, document_type)
