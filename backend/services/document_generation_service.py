import os
from datetime import date

from playwright.async_api import async_playwright  # pip install playwright
from fastapi import Depends, HTTPException, status
from jinja2 import Environment, FileSystemLoader  # pip install Jinja2
from sqlalchemy.orm import Session

from database import SessionLocal, get_db
from models import models
from services import document_service


# (O código das funções auxiliares e dos templates permanece o mesmo)
def get_lodge_officers_at_date(db: Session, lodge_id: int, target_date: date) -> dict[str, str]:
    """
    Busca os oficiais ativos da Loja em uma dada data.
    Retorna um dicionário com os nomes dos oficiais para os cargos principais.
    """
    # Nomes dos cargos que esperamos encontrar. Estes nomes devem corresponder ao models.Role.name
    officer_roles = {
        "Venerável Mestre": None,
        "Primeiro Vigilante": None,
        "Segundo Vigilante": None,
        "Orador": None,
        "Secretário": None,
        "Tesoureiro": None,
        "Chanceler": None,
        "Hospitaleiro": None,
    }

    for role_name in officer_roles.keys():
        officer_history = (
            db.query(models.RoleHistory)
            .join(models.Role)
            .filter(
                models.RoleHistory.member_id.isnot(None),
                models.Role.name == role_name,
                models.RoleHistory.start_date <= target_date,
                (models.RoleHistory.end_date >= target_date) | (models.RoleHistory.end_date.is_(None)),
                models.MemberLodgeAssociation.lodge_id == lodge_id,  # Garante que o oficial era daquela loja
            )
            .join(
                models.MemberLodgeAssociation, models.RoleHistory.member_id == models.MemberLodgeAssociation.member_id
            )
            .first()
        )

        if officer_history and officer_history.member:
            officer_roles[role_name] = officer_history.member.full_name

    return officer_roles


def get_attendees_for_session(db: Session, session_id: int) -> list[str]:
    """
    Busca os nomes dos membros e visitantes presentes em uma sessão.
    """
    attendees = []

    # Membros presentes
    members_present = (
        db.query(models.Member)
        .join(models.SessionAttendance)
        .filter(
            models.SessionAttendance.session_id == session_id,
            models.SessionAttendance.member_id == models.Member.id,
            models.SessionAttendance.attendance_status == "Presente",
        )
        .all()
    )
    attendees.extend([m.full_name for m in members_present])

    # Visitantes presentes
    visitors_present = (
        db.query(models.Visitor)
        .join(models.SessionAttendance)
        .filter(
            models.SessionAttendance.session_id == session_id,
            models.SessionAttendance.visitor_id == models.Visitor.id,
            models.SessionAttendance.attendance_status == "Presente",
        )
        .all()
    )
    attendees.extend([v.full_name for v in visitors_present])

    return sorted(attendees)  # Retorna em ordem alfabética


# --- HTML Templates (Provisório - idealmente carregados de arquivos .html) ---

from services import template_service

class DocumentGenerationService:
    def __init__(self, db_session: Session | None = None):
        self.db = db_session
        # Carrega templates da pasta 'templates' (fallback)
        template_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'templates')
        self.env = Environment(loader=FileSystemLoader(template_dir))

    def _render_template(self, template_name: str, data: dict) -> str:
        # Tenta carregar do banco de dados primeiro
        template_type = "BALAUSTRE" if "balaustre" in template_name else "EDITAL"
        
        if self.db:
            db_template = template_service.get_template_by_type(self.db, template_type)
            if db_template:
                # Cria um template a partir da string do banco
                return self.env.from_string(db_template.content).render(data)
        
        # Fallback para o arquivo
        template = self.env.get_template(template_name)
        return template.render(data)

    async def _generate_pdf_from_html(self, html_content: str) -> bytes:
        """Converte conteúdo HTML em PDF usando Playwright."""
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            await page.set_content(html_content)
            pdf_bytes = await page.pdf(format="A4", print_background=True)
            await browser.close()
            return pdf_bytes

    async def _collect_session_data(self, db: Session, session_id: int) -> dict:
        """Coleta todos os dados necessários para Balaustre/Edital de uma sessão."""
        session = db.query(models.MasonicSession).filter(models.MasonicSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sessão não encontrada.")

        lodge = db.query(models.Lodge).filter(models.Lodge.id == session.lodge_id).first()
        if not lodge:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loja da sessão não encontrada.")

        obedience = db.query(models.Obedience).filter(models.Obedience.id == lodge.obedience_id).first()
        obedience_name = obedience.name if obedience else "Obediência não especificada"

        officers = get_lodge_officers_at_date(db, lodge.id, session.session_date)
        attendees = get_attendees_for_session(db, session.id)

        session_date_formatted = session.session_date.strftime("%d de %B de %Y")
        session_start_time_formatted = session.start_time.strftime("%Hh%Mmin") if session.start_time else "N/D"
        session_end_time_formatted = session.end_time.strftime("%Hh%Mmin") if session.end_time else "N/D"
        
        study_director_name = None
        if session.study_director_id:
             study_director = db.query(models.Member).filter(models.Member.id == session.study_director_id).first()
             if study_director:
                 study_director_name = study_director.full_name

        return {
            "session_id": session.id,
            "session_title": session.title,
            "session_date": session.session_date,
            "session_date_formatted": session_date_formatted,
            "session_date_day": session.session_date.day,
            "session_date_month": session.session_date.strftime("%B"),
            "session_date_year": session.session_date.year,
            "session_year_vl": session.session_date.year + 4000,
            "session_start_time_formatted": session_start_time_formatted,
            "session_end_time_formatted": session_end_time_formatted,
            "session_status": session.status,
            "lodge_name": lodge.lodge_name,
            "lodge_number": lodge.lodge_number,
            "lodge_city": lodge.city,
            "obedience_name": obedience_name,
            "veneravel_mestre_name": officers.get("Venerável Mestre"),
            "primeiro_vigilante_name": officers.get("Primeiro Vigilante"),
            "segundo_vigilante_name": officers.get("Segundo Vigilante"),
            "orador_name": officers.get("Orador"),
            "secretario_name": officers.get("Secretário"),
            "tesoureiro_name": officers.get("Tesoureiro"),
            "chanceler_name": officers.get("Chanceler"),
            "hospitaleiro_name": officers.get("Hospitaleiro"),
            "attendees": attendees,
            "current_date_day": date.today().day,
            "current_date_month": date.today().strftime("%B"),
            "current_date_year": date.today().year,
            # Novos campos
            "agenda": session.agenda,
            "sent_expedients": session.sent_expedients,
            "received_expedients": session.received_expedients,
            "study_director_name": study_director_name,
            # Placeholder images for now - TODO: Implement real logo storage/retrieval
            "header_image": "https://via.placeholder.com/150",
            "footer_image": "https://via.placeholder.com/150",
            # New fields for the updated template
            "lodge_tittle": "Augusta e Respeitável Loja Simbólica", # Placeholder as we don't have this field yet
            "suboobedience_name": obedience_name, # Assuming subobedience is the same for now, or we need logic to find parent
            "lodge_address": f"{lodge.street_address or ''}, {lodge.street_number or ''}, {lodge.neighborhood or ''}",
            "lodge_state": lodge.state,
        }

    async def generate_balaustre_pdf_task(self, session_id: int, current_user_payload: dict):
        db = SessionLocal()
        try:
            print(f"Iniciando geração de balaústre para sessão: {session_id}")
            session_data = await self._collect_session_data(db, session_id)
            html_content = self._render_template("balaustre_template.html", session_data)
            pdf_bytes = await self._generate_pdf_from_html(html_content)

            title = f"Balaústre da Sessão {session_data.get('session_title', '')} - {session_data.get('session_date_formatted', '')}"
            filename = f"balaustre_sessao_{session_id}_{session_data.get('session_date').strftime('%Y%m%d')}.pdf"

            new_doc = await document_service.create_document(
                db=db,
                title=title,
                current_user_payload=current_user_payload,
                file_content_bytes=pdf_bytes,
                filename=filename,
                content_type="application/pdf",
            )
            new_doc.document_type = "BALAUSTRE"
            new_doc.session_id = session_id
            db.commit()
            print(f"Balaústre para sessão {session_id} gerado com sucesso (Doc ID: {new_doc.id}).")
        except Exception as e:
            print(f"ERRO ao gerar balaústre para sessão {session_id}: {e}")
        finally:
            db.close()

    async def generate_edital_pdf_task(self, session_id: int, current_user_payload: dict):
        db = SessionLocal()
        try:
            print(f"Iniciando geração de edital para sessão: {session_id}")
            session_data = await self._collect_session_data(db, session_id)
            html_content = self._render_template("edital_template.html", session_data)
            pdf_bytes = await self._generate_pdf_from_html(html_content)

            title = f"Edital de Convocação {session_data.get('session_title', '')} - {session_data.get('session_date_formatted', '')}"
            filename = f"edital_sessao_{session_id}_{session_data.get('session_date').strftime('%Y%m%d')}.pdf"

            new_doc = await document_service.create_document(
                db=db,
                title=title,
                current_user_payload=current_user_payload,
                file_content_bytes=pdf_bytes,
                filename=filename,
                content_type="application/pdf",
            )
            new_doc.document_type = "EDITAL"
            new_doc.session_id = session_id
            db.commit()
            print(f"Edital para sessão {session_id} gerado com sucesso (Doc ID: {new_doc.id}).")
        except Exception as e:
            print(f"ERRO ao gerar edital para sessão {session_id}: {e}")
        finally:
            db.close()


def get_document_generation_service(db: Session = Depends(get_db)):
    return DocumentGenerationService(db)
