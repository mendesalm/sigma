import os
from datetime import date

import pyppeteer  # pip install pyppeteer
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

BALAUSTRE_TEMPLATE_HTML = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Balaústre de Sessão</title>
    <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; margin: 2cm; }
        .header, .footer { text-align: center; margin-bottom: 1cm; }
        .content { text-align: justify; text-indent: 1.5cm; }
        .signatures { margin-top: 2cm; text-align: center; }
        .signature-line { display: block; margin-top: 1cm; }
        .officer-name { font-weight: bold; }
        .officer-role { font-style: italic; }
        .session-info { text-align: center; margin-bottom: 1cm; }
        h1 { text-align: center; font-size: 16pt; margin-bottom: 1cm; }
        ul { list-style-type: none; padding-left: 0; }
        li { margin-bottom: 0.2em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Balaústre de Sessão Maçônica</h1>
        <p>A.R.L.S. {{ lodge_name }} N° {{ lodge_number }}</p>
        <p>{{ obedience_name }}</p>
    </div>

    <div class="session-info">
        <p><strong>Sessão {{ session_title }}</strong></p>
        <p>Realizada em {{ session_date_formatted }} às {{ session_start_time_formatted }}h</p>
        <p>Status: {{ session_status }}</p>
    </div>

    <div class="content">
        <p>Aos {{ session_date_day }} dias do mês de {{ session_date_month }} do ano de {{ session_date_year }} da E.V.,
        e da V.L. de {{ session_year_vl }},
        reuniram-se em Templo os Obreiros da A.R.L.S. {{ lodge_name }},
        seguindo os ritos e praxes da Ordem.</p>
        
        <p>Presentes:</p>
        <ul>
            {% for member in attendees %}
            <li>{{ member }}</li>
            {% endfor %}
        </ul>
        
        <p>Abertos os trabalhos no respectivo Grau e Ordem, foram tratados os seguintes assuntos: {{ session_title }}.
        Após os debates e deliberações, os trabalhos foram encerrados no {{ session_end_time_formatted }}.</p>
    </div>

    <div class="signatures">
        {% if veneravel_mestre_name %}
        <div class="signature-line">
            <span class="officer-name">{{ veneravel_mestre_name }}</span><br>
            <span class="officer-role">Venerável Mestre</span>
        </div>
        {% endif %}
        {% if secretario_name %}
        <div class="signature-line">
            <span class="officer-name">{{ secretario_name }}</span><br>
            <span class="officer-role">Secretário</span>
        </div>
        {% endif %}
        {% if orador_name %}
        <div class="signature-line">
            <span class="officer-name">{{ orador_name }}</span><br>
            <span class="officer-role">Orador</span>
        </div>
        {% endif %}
    </div>

    <div class="footer">
        <p>Oriente de {{ lodge_city }}, {{ session_date_formatted }}.</p>
    </div>
</body>
</html>
"""

EDITAL_TEMPLATE_HTML = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Edital de Convocação</title>
    <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; margin: 2cm; }
        .header { text-align: center; margin-bottom: 1cm; }
        .content { text-align: justify; text-indent: 1.5cm; }
        .footer { text-align: center; margin-top: 1cm; }
        h1 { text-align: center; font-size: 16pt; margin-bottom: 1cm; }
    </style>
</head>
<body>
    <div class="header">
        <h1>EDITAL DE CONVOCAÇÃO</h1>
        <p>A.R.L.S. {{ lodge_name }} N° {{ lodge_number }}</p>
        <p>{{ obedience_name }}</p>
    </div>

    <div class="content">
        <p>O Venerável Mestre da A.R.L.S. {{ lodge_name }}, N° {{ lodge_number }},
        Oriente de {{ lodge_city }}, vem, por este, convocar a todos os Obreiros do Quadro
        para a Sessão {{ session_title }}, que se realizará no dia
        <strong>{{ session_date_formatted }}</strong>, às <strong>{{ session_start_time_formatted }}</strong>,
        em nosso Templo.</p>
        
        <p>A presença de todos é de suma importância para a regularidade e o brilho de nossos trabalhos.</p>
    </div>

    <div class="footer">
        <p>Dado e passado em Templo, aos {{ current_date_day }} dias do mês de {{ current_date_month }} do ano de {{ current_date_year }} da E.V.</p>
        <p>Fraternalmente,</p>
        {% if veneravel_mestre_name %}
        <p><strong>{{ veneravel_mestre_name }}</strong><br>Venerável Mestre</p>
        {% endif %}
    </div>
</body>
</html>
"""


class DocumentGenerationService:
    def __init__(self, db_session: Session | None = None):
        self.db = db_session
        self.env = Environment(loader=FileSystemLoader(os.path.dirname(__file__)))
        self.env.from_string(BALAUSTRE_TEMPLATE_HTML, "balaustre_template.html")
        self.env.from_string(EDITAL_TEMPLATE_HTML, "edital_template.html")
        self.env.get_template("balaustre_template.html")
        self.env.get_template("edital_template.html")

    def _render_template(self, template_name: str, data: dict) -> str:
        template = self.env.get_template(template_name)
        return template.render(data)

    async def _generate_pdf_from_html(self, html_content: str) -> bytes:
        """Converte conteúdo HTML em PDF usando pyppeteer (headless Chrome)."""
        browser = await pyppeteer.launch(args=["--no-sandbox", "--disable-setuid-sandbox"])
        page = await browser.newPage()
        await page.setContent(html_content, {"waitUntil": "networkidle0"})
        pdf_bytes = await page.pdf({"format": "A4", "printBackground": True})
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
            "attendees": attendees,
            "current_date_day": date.today().day,
            "current_date_month": date.today().strftime("%B"),
            "current_date_year": date.today().year,
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
