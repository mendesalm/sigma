import os

from sqlalchemy.orm import Session

from models.models import GlobalDocumentTemplate, LocalDocumentTemplate
from schemas import template_schema


def get_global_template_by_type(db: Session, document_type: str) -> GlobalDocumentTemplate | None:
    return db.query(GlobalDocumentTemplate).filter(GlobalDocumentTemplate.document_type == document_type).first()


def get_local_template(db: Session, lodge_id: int, document_type: str) -> LocalDocumentTemplate | None:
    return (
        db.query(LocalDocumentTemplate)
        .filter(
            LocalDocumentTemplate.lodge_id == lodge_id,
            LocalDocumentTemplate.document_type == document_type,
            LocalDocumentTemplate.is_active,
        )
        .first()
    )


def get_active_template(db: Session, lodge_id: int, document_type: str):
    """Retorna o template local caso ativo, senão retorna o global como fallback."""
    local_tpl = get_local_template(db, lodge_id, document_type)
    if local_tpl and local_tpl.custom_html_content:
        return local_tpl
    return get_global_template_by_type(db, document_type)


def create_or_update_global_template(
    db: Session, template_data: template_schema.GlobalDocumentTemplateCreate
) -> GlobalDocumentTemplate:
    existing_template = get_global_template_by_type(db, template_data.document_type)
    if existing_template:
        existing_template.html_content = template_data.html_content
        existing_template.header_html = template_data.header_html
        existing_template.footer_html = template_data.footer_html
        existing_template.placeholders_schema = template_data.placeholders_schema
        existing_template.title = template_data.title
        db.commit()
        db.refresh(existing_template)
        return existing_template
    else:
        new_template = GlobalDocumentTemplate(**template_data.model_dump())
        db.add(new_template)
        db.commit()
        db.refresh(new_template)
        return new_template


def create_or_update_local_template(
    db: Session, lodge_id: int, template_data: template_schema.LocalDocumentTemplateUpdate, document_type: str
) -> LocalDocumentTemplate:
    existing_template = get_local_template(db, lodge_id, document_type)
    if existing_template:
        for key, value in template_data.model_dump(exclude_unset=True).items():
            setattr(existing_template, key, value)
        db.commit()
        db.refresh(existing_template)
        return existing_template
    else:
        # Create
        new_template = LocalDocumentTemplate(
            lodge_id=lodge_id, document_type=document_type, **template_data.model_dump(exclude_unset=True)
        )
        db.add(new_template)
        db.commit()
        db.refresh(new_template)
        return new_template


def get_default_template_content(template_type: str) -> str:
    """Fallback legadopara carregar os arquivos HTML se não houver no banco (Seed inicial)"""
    filename = ""
    if template_type == "BALAUSTRE":
        filename = "balaustre_template.html"
    elif template_type == "EDITAL":
        filename = "edital_template.html"
    else:
        return ""

    base_dir = os.path.dirname(os.path.dirname(__file__))
    cwd = os.getcwd()

    paths_to_try = [
        os.path.join(base_dir, "templates", filename),
        os.path.join(cwd, "templates", filename),
        os.path.join(cwd, "backend", "templates", filename),
    ]

    for path in paths_to_try:
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                return f.read()

    return ""
