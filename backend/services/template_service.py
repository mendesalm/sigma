from sqlalchemy.orm import Session
from models.models import DocumentTemplate
from schemas import template_schema
import os

def get_template_by_type(db: Session, template_type: str) -> DocumentTemplate | None:
    return db.query(DocumentTemplate).filter(DocumentTemplate.type == template_type).first()

def create_or_update_template(db: Session, template_data: template_schema.DocumentTemplateCreate) -> DocumentTemplate:
    existing_template = get_template_by_type(db, template_data.type)
    if existing_template:
        existing_template.content = template_data.content
        db.commit()
        db.refresh(existing_template)
        return existing_template
    else:
        new_template = DocumentTemplate(
            type=template_data.type,
            content=template_data.content
        )
        db.add(new_template)
        db.commit()
        db.refresh(new_template)
        return new_template

def get_default_template_content(template_type: str) -> str:
    """Lê o conteúdo do arquivo de template padrão."""
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
        os.path.join(base_dir, 'templates', filename),
        os.path.join(cwd, 'templates', filename),
        os.path.join(cwd, 'backend', 'templates', filename),
        # Fallback específico para o ambiente do usuário se o path relativo falhar
        r"c:\Users\engan\OneDrive\Área de Trabalho\sigma\backend\templates" + "\\" + filename
    ]
    
    print(f"DEBUG: Procurando template '{filename}' em: {paths_to_try}")

    for path in paths_to_try:
        if os.path.exists(path):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    print(f"DEBUG: Template encontrado e carregado de: {path}")
                    return content
            except Exception as e:
                print(f"DEBUG: Erro ao ler arquivo em {path}: {e}")
                continue
    
    print("DEBUG: Template não encontrado em nenhum dos caminhos.")
    return ""
