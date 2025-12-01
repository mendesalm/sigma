from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from schemas import template_schema
from services import template_service
from dependencies import get_current_user_payload

router = APIRouter(prefix="/templates", tags=["Templates"])

@router.get("/{template_type}", response_model=template_schema.DocumentTemplateResponse)
def get_template(
    template_type: str, 
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload)
):
    # Verifica permissão (apenas SuperAdmin ou Webmaster pode ver/editar templates globais? 
    # Por enquanto, vamos permitir acesso autenticado, mas idealmente seria restrito)
    
    template_type = template_type.upper()
    if template_type not in ["BALAUSTRE", "EDITAL"]:
        raise HTTPException(status_code=400, detail="Tipo de template inválido.")

    template = template_service.get_template_by_type(db, template_type)
    
    if not template:
        # Se não existe no banco, retorna o conteúdo padrão do arquivo
        content = template_service.get_default_template_content(template_type)
        if not content:
             raise HTTPException(status_code=404, detail="Template padrão não encontrado.")
        
        # Retorna um objeto simulado para o frontend
        return {
            "id": 0,
            "type": template_type,
            "content": content,
            "updated_at": None
        }
        
    return template

@router.post("/", response_model=template_schema.DocumentTemplateResponse)
def save_template(
    template_data: template_schema.DocumentTemplateCreate,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload)
):
    # TODO: Verificar permissão de admin
    
    template_data.type = template_data.type.upper()
    if template_data.type not in ["BALAUSTRE", "EDITAL"]:
        raise HTTPException(status_code=400, detail="Tipo de template inválido.")

    return template_service.create_or_update_template(db, template_data)

@router.post("/preview")
async def preview_template(
    template_data: template_schema.DocumentTemplateBase,
    current_user_payload: dict = Depends(get_current_user_payload)
):
    """Gera um PDF de pré-visualização com dados fictícios."""
    from services.document_generation_service import DocumentGenerationService
    from fastapi.responses import Response
    
    try:
        service = DocumentGenerationService()
        
        # Dados fictícios para o preview
        mock_data = {
            "lodge_name": "Loja Exemplo de Teste",
            "lodge_number": "123",
            "obedience_name": "Grande Oriente de Teste",
            "lodge_city": "Cidade Modelo",
            "session_title": "Sessão Ordinária de Teste",
            "session_date_formatted": "01 de Janeiro de 2024",
            "session_date_day": "01",
            "session_date_month": "Janeiro",
            "session_date_year": "2024",
            "session_year_vl": "6024",
            "session_start_time_formatted": "20:00",
            "session_end_time_formatted": "22:00",
            "session_status": "REALIZADA",
            "veneravel_mestre_name": "João da Silva (Venerável)",
            "secretario_name": "Pedro Santos (Secretário)",
            "orador_name": "Carlos Oliveira (Orador)",
            "attendees": ["Irmão A", "Irmão B", "Irmão C", "Irmão D"],
            "agenda": "1. Leitura da Ata anterior.\n2. Discussão sobre beneficência.\n3. Palavra a bem da Ordem.",
            "sent_expedients": "Ofício 001/2024 para a Grande Loja.",
            "received_expedients": "Convite da Loja Vizinha para Sessão Magna.",
            "study_director_name": "José Estudos",
            "current_date_day": "01",
            "current_date_month": "Janeiro",
            "current_date_year": "2024"
        }
        
        # Renderiza o HTML com os dados fictícios
        html_content = service.env.from_string(template_data.content).render(mock_data)
        
        # Gera o PDF
        pdf_bytes = await service._generate_pdf_from_html(html_content)
        
        return Response(content=pdf_bytes, media_type="application/pdf")
    except Exception as e:
        print(f"ERRO no preview_template: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
