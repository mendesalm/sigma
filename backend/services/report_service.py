from datetime import date, datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import models
from services.document_generation_service import DocumentGenerationService

class ReportService:
    @staticmethod
    async def generate_members_report_pdf(
        db: Session, 
        lodge_id: int, 
        show_email: bool = False, 
        show_phone: bool = False
    ) -> bytes:
        # 1. Buscar a Loja
        lodge = db.query(models.Lodge).filter(models.Lodge.id == lodge_id).first()
        if not lodge:
            raise ValueError("Loja não encontrada")

        # 2. Buscar Membros Ativos da Loja
        # Join com MemberLodgeAssociation
        query = (
            db.query(models.Member)
            .join(models.MemberLodgeAssociation)
            .filter(
                models.MemberLodgeAssociation.lodge_id == lodge_id,
                models.MemberLodgeAssociation.status == models.MemberStatusEnum.ACTIVE, # Apenas ativos
                models.MemberLodgeAssociation.end_date.is_(None) # Garantia extra de associação vigente
            )
            .order_by(models.Member.full_name)
        )
        members_db = query.all()

        # 3. Preparar dados para o template
        members_list = []
        today = date.today()

        for mem in members_db:
            # Buscar Cargo Atual na Loja
            active_role_history = next(
                (h for h in mem.role_history 
                 if h.lodge_id == lodge_id 
                 and h.start_date <= today 
                 and (h.end_date is None or h.end_date >= today)), 
                None
            )
            role_name = active_role_history.role.name if active_role_history else "Membro"

            # Formatar Grau (Enum ou String)
            degree_val = mem.degree.value if hasattr(mem.degree, "value") else str(mem.degree)
            
            member_data = {
                "cim": mem.cim or "-",
                "full_name": mem.full_name,
                "degree": degree_val,
                "role": role_name,
                # Campos opcionais (sempre passamos, template decide se mostra)
                "email": mem.email or "-",
                "phone": mem.phone or "-"
            }
            members_list.append(member_data)

        # 4. Instanciar Serviço de Geração (para renderizar HTML e usar assets)
        doc_service = DocumentGenerationService(db_session=db)
        
        # Dados do contexto do template
        template_data = {
            "header_image": doc_service._get_lodge_logo(lodge_id),
            "lodge_title_formatted": lodge.lodge_title or "A∴R∴B∴L∴S∴",
            "lodge_name": lodge.lodge_name,
            "lodge_number": lodge.lodge_number,
            
            "generation_date": datetime.now().strftime("%d/%m/%Y às %H:%M"),
            "total_members": len(members_list),
            
            "members": members_list,
            
            # Controle de colunas
            "show_email": show_email,
            "show_phone": show_phone
        }

        # 5. Renderizar HTML
        html_content = doc_service._render_template("members_report_template.html", template_data)
        
        # 6. Gerar PDF
        pdf_bytes = await doc_service._generate_pdf_from_html(html_content)
        
        return pdf_bytes
