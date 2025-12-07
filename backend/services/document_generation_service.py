import os
import json
from datetime import date


from fastapi import Depends, HTTPException, status
from jinja2 import Environment, FileSystemLoader  # pip install Jinja2
from sqlalchemy.orm import Session

from database import SessionLocal, get_db
from models import models
from services import document_service
from sqlalchemy import func, cast, Date
import qrcode
import io
import hashlib
import uuid

# ... (existing imports)


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
                models.RoleHistory.lodge_id == lodge_id,  # Garante que o cargo é desta loja específica
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

    def _get_base64_asset(self, asset_path: str) -> str:
        """Lê um arquivo de asset e retorna como string base64."""
        import base64
        
        # Ajuste o caminho base conforme a estrutura do seu projeto
        base_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'assets')
        full_path = os.path.join(base_path, asset_path)
        
        if not os.path.exists(full_path):
            print(f"Asset não encontrado: {full_path}")
            return ""
            
        with open(full_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
            
        mime_type = "application/octet-stream"
        if asset_path.endswith(".png"):
            mime_type = "image/png"
        elif asset_path.endswith(".jpg") or asset_path.endswith(".jpeg"):
            mime_type = "image/jpeg"
        elif asset_path.endswith(".svg"):
            mime_type = "image/svg+xml"
        elif asset_path.endswith(".ttf"):
            mime_type = "font/ttf"
            
        return f"data:{mime_type};base64,{encoded_string}"

    def _get_lodge_logo(self, lodge_id: int) -> str:
        """
        Tenta recuperar o logo da loja. Se não existir, retorna o logo padrão.
        Convenção: storage/lodges/{lodge_id}/logo.png (ou .jpg)
        """
        import base64
        
        # Caminho base do storage
        storage_base = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'storage', 'lodges', str(lodge_id))
        
        # Tenta extensões comuns
        for ext in ['.png', '.jpg', '.jpeg']:
            logo_path = os.path.join(storage_base, f'logo{ext}')
            if os.path.exists(logo_path):
                try:
                    with open(logo_path, "rb") as image_file:
                        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                    
                    mime_type = "image/png" if ext == '.png' else "image/jpeg"
                    return f"data:{mime_type};base64,{encoded_string}"
                except Exception as e:
                    print(f"Erro ao ler logo da loja {lodge_id}: {e}")
        
        # Fallback para o logo padrão
        return self._get_base64_asset("images/logoJPJ_.png")

    def _generate_qr_code_base64(self, data: str) -> str:
        """Gera um QR Code em Base64 a partir de uma string."""
        import base64
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        
        return f"data:image/png;base64,{img_str}"

    def _render_template(self, template_name: str, data: dict) -> str:
        # Injeta logo dinâmico da loja se disponível
        lodge_id = data.get('lodge_id')
        if lodge_id:
            data['header_image'] = self._get_lodge_logo(lodge_id)
        else:
            data['header_image'] = self._get_base64_asset("images/logoJPJ_.png")
            
        data['footer_image'] = self._get_base64_asset("images/logoRB_.png")
        
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

    def _generate_pdf_sync(self, html_content: str) -> bytes:
        """Versão síncrona da geração de PDF para rodar em thread separada."""
        from playwright.sync_api import sync_playwright
        
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            
            # Carrega o conteúdo HTML
            page.set_content(html_content, wait_until="networkidle")
            
            # Gera o PDF
            pdf_bytes = page.pdf(
                format="A4",
                print_background=True,
                margin={
                    "top": "1cm",
                    "bottom": "1cm",
                    "left": "1cm",
                    "right": "1cm"
                }
            )
            
            browser.close()
            return pdf_bytes

    async def _generate_pdf_from_html(self, html_content: str) -> bytes:
        """Converte conteúdo HTML em PDF usando Playwright (Sync via Thread)."""
        import asyncio
        return await asyncio.to_thread(self._generate_pdf_sync, html_content)

    def _calculate_tronco_text(self, db: Session, lodge_id: int, session_date: date) -> str:
        """Calcula o valor total do Tronco para a data da sessão e retorna o texto formatado."""
        total_tronco = (
            db.query(func.sum(models.FinancialTransaction.amount))
            .filter(
                models.FinancialTransaction.lodge_id == lodge_id,
                cast(models.FinancialTransaction.transaction_date, Date) == session_date,
                models.FinancialTransaction.transaction_type == "credit",
                models.FinancialTransaction.description.ilike("%Tronco%")
            )
            .scalar()
        ) or 0.0

        formatted_value = f"R$ {total_tronco:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
        return f"Fez o seu giro habitual e rendeu a medalha cunhada de {formatted_value}."

    def _collect_notices_text(self, db: Session, lodge_id: int, start_date: date, end_date: date) -> str:
        """Busca avisos publicados entre duas datas para compor o expediente."""
        if not start_date:
            # Se não houver sessão anterior, busca avisos dos últimos 30 dias
            from datetime import timedelta
            start_date = end_date - timedelta(days=30)

        notices = (
            db.query(models.Notice)
            .filter(
                models.Notice.lodge_id == lodge_id,
                cast(models.Notice.created_at, Date) > start_date,
                cast(models.Notice.created_at, Date) <= end_date
            )
            .all()
        )

        if not notices:
            return ""

        text_parts = ["Avisos e Circulares:"]
        for notice in notices:
            text_parts.append(f"- {notice.title}")
        
        return "\n".join(text_parts)

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

        # Busca sessão anterior para o campo "SessaoAnterior"
        previous_session = (
            db.query(models.MasonicSession)
            .filter(
                models.MasonicSession.lodge_id == lodge.id,
                models.MasonicSession.session_date < session.session_date,
                models.MasonicSession.status == "REALIZADA"
            )
            .order_by(models.MasonicSession.session_date.desc())
            .first()
        )
        previous_session_date_formatted = (
            previous_session.session_date.strftime("%d/%m/%Y") if previous_session else "N/D"
        )

        officers = get_lodge_officers_at_date(db, lodge.id, session.session_date)
        attendees = get_attendees_for_session(db, session.id)

        # Formatação de datas
        months_pt = {
            1: "Janeiro", 2: "Fevereiro", 3: "Março", 4: "Abril", 5: "Maio", 6: "Junho",
            7: "Julho", 8: "Agosto", 9: "Setembro", 10: "Outubro", 11: "Novembro", 12: "Dezembro"
        }
        
        day = session.session_date.day
        month = months_pt[session.session_date.month]
        year = session.session_date.year
        session_date_full = f"{day} de {month} de {year}"
        
        session_start_time_formatted = session.start_time.strftime("%Hh%Mmin") if session.start_time else "N/D"
        session_end_time_formatted = session.end_time.strftime("%Hh%Mmin") if session.end_time else "N/D"
        
        study_director_name = None
        if session.study_director_id:
             study_director = db.query(models.Member).filter(models.Member.id == session.study_director_id).first()
             if study_director:
                 study_director_name = study_director.full_name

        # Lógica de texto do cabeçalho baseada na Potência
        affiliation_text_1 = ""
        affiliation_text_2 = ""
        ob_name_lower = obedience_name.lower()
        
        if "grande oriente do brasil" in ob_name_lower:
            affiliation_text_1 = f"Federada ao {obedience_name}"
            # TODO: Obter sub-obediência corretamente do banco se disponível
            affiliation_text_2 = f"Jurisdicionada ao Grande Oriente Estadual" 
        elif "grande loja" in ob_name_lower:
            affiliation_text_1 = f"Confederada à {obedience_name}"
            affiliation_text_2 = ""
        else:
            affiliation_text_1 = f"Federada ao {obedience_name}"
            affiliation_text_2 = ""

        # Lógica para Expediente Automático
        auto_expediente = self._collect_notices_text(
            db, 
            lodge.id, 
            previous_session.session_date if previous_session else None, 
            session.session_date
        )
        
        expediente_recebido = session.received_expedients or auto_expediente or "Nada constou."

        # Montagem do dicionário de dados
        return {
            # Campos Básicos
            "session_id": session.id,
            "NumeroAta": session.session_number or session.id, # Usa session_number se disponível, senão ID
            "ClasseSessao": f"{session.type.value if session.type else ''} {session.subtype.value if session.subtype else ''}".strip().upper(),
            "HoraInicioSessao": session_start_time_formatted,
            "DiaSessao": session_date_full,
            "SessaoAnterior": previous_session_date_formatted,
            
            # Loja
            "lodge_name": lodge.lodge_name,
            "lodge_number": lodge.lodge_number,
            "lodge_title_formatted": "∴".join(list(lodge.lodge_title or "ARLS")) + "∴",
            "lodge_address": f"{lodge.street_address or ''}, {lodge.street_number or ''} - {lodge.neighborhood or ''}, Oriente de {lodge.city or ''} - {lodge.state or ''}",
            "lodge_city": lodge.city,
            "affiliation_text_1": affiliation_text_1,
            "affiliation_text_2": affiliation_text_2,
            
            # Oficiais (Mapeamento para o template novo)
            "GrauSessao": "APRENDIZ", # Placeholder fixo por enquanto
            "Veneravel": officers.get("Venerável Mestre") or "___________________",
            "PrimeiroVigilante": officers.get("Primeiro Vigilante") or "___________________",
            "SegundoVigilante": officers.get("Segundo Vigilante") or "___________________",
            "Orador": officers.get("Orador") or "___________________",
            "Secretario": officers.get("Secretário") or "___________________",
            "Tesoureiro": officers.get("Tesoureiro") or "___________________",
            "Chanceler": officers.get("Chanceler") or "___________________",
            
            # Conteúdo
            "ExpedienteRecebido": expediente_recebido,
            "ExpedienteExpedido": session.sent_expedients or "Nada constou.",
            "SacoProposta": "Foi aberto pelo V∴ Mestre e nada recolheu.", # Placeholder dinâmico futuro
            "OrdemDia": session.agenda or "Não houve matéria para a Ordem do Dia.",
            "TempoInstrucao": f"Preenchido pelo Ir∴ {study_director_name}" if study_director_name else "Suprimido.",
            "Tronco": self._calculate_tronco_text(db, lodge.id, session.session_date),
            "Palavra": "Reinou o silêncio.", # Placeholder
            "Encerramento": session_end_time_formatted,
            "DataAssinatura": session_date_full,
            
            # Imagens
            "header_image": self._get_lodge_logo(lodge.id),
            "footer_image": self._get_base64_asset("images/logoRB_.png"),
            
            # Legado/Compatibilidade (se necessário)
            "session_title": session.title,
            "session_date_formatted": session.session_date.strftime("%d/%m/%Y"),
            "attendees": attendees,
        }

    def _get_draft_file_path(self, session_id: int) -> str:
        directory = os.path.join("storage", "sessions", str(session_id))
        os.makedirs(directory, exist_ok=True)
        return os.path.join(directory, "balaustre_draft.json")

    def save_balaustre_draft(self, session_id: int, content: dict):
        file_path = self._get_draft_file_path(session_id)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(content, f, ensure_ascii=False, indent=2)

    def load_balaustre_draft(self, session_id: int) -> dict:
        file_path = self._get_draft_file_path(session_id)
        if os.path.exists(file_path):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"Erro ao carregar rascunho: {e}")
        return None

    async def get_balaustre_draft_text(self, session_id: int) -> dict:
        # Tenta carregar rascunho salvo
        saved_draft = self.load_balaustre_draft(session_id)
        
        db = SessionLocal()
        try:
            session_data = await self._collect_session_data(db, session_id)
            
            # Se houver rascunho salvo, usa o texto e estilos dele
            if saved_draft:
                text = saved_draft.get('text', '')
                if 'styles' in saved_draft:
                    session_data['styles'] = saved_draft['styles']
                return {"text": text, "data": session_data}

            # Se não houver rascunho, gera o texto padrão
            officers = {
                "Venerável Mestre": session_data.get("veneravel_mestre_name"),
                "1º Vigilante": session_data.get("primeiro_vigilante_name"),
                "2º Vigilante": session_data.get("segundo_vigilante_name"),
                "Orador": session_data.get("orador_name"),
                "Secretário": session_data.get("secretario_name"),
                "Tesoureiro": session_data.get("tesoureiro_name"),
                "Chanceler": session_data.get("chanceler_name"),
                "Hospitaleiro": session_data.get("hospitaleiro_name"),
            }
            
            present_officers = [f"{role}: {name}" for role, name in officers.items() if name]
            officers_text = ", ".join(present_officers)
            
            attendees = session_data.get("attendees", [])
            attendees_text = ", ".join(attendees) if attendees else "Nenhum registro de presença."
            
            text = (
                f"Aos {session_data['session_date_day']} dias do mês de {session_data['session_date_month']} "
                f"do ano de {session_data['session_date_year']} (E∴V∴), reuniram-se os obreiros da "
                f"{session_data['lodge_name']} nº {session_data['lodge_number']}, "
                f"ao Oriente de {session_data['lodge_city']}, sob a presidência do Venerável Mestre "
                f"{session_data['veneravel_mestre_name'] or '___________________'}.\n\n"
                f"Oficiais presentes: {officers_text}.\n\n"
                f"Irmãos e Visitantes presentes: {attendees_text}.\n\n"
                f"A sessão foi aberta ritualisticamente às {session_data['session_start_time_formatted']} horas.\n\n"
                f"EXPEDIENTE:\n{session_data.get('agenda') or 'Sem expediente.'}\n\n"
                f"ORDEM DO DIA:\nDiscussão e votação de assuntos administrativos.\n\n"
                f"A sessão foi encerrada às {session_data['session_end_time_formatted']} horas, em paz e harmonia."
            )
            
            return {"text": text, "data": session_data}
        finally:
            db.close()

    async def _prepare_balaustre_html(self, session_id: int, custom_content: dict = None) -> tuple[str, dict]:
        db = SessionLocal()
        try:
            # Save draft if provided
            if custom_content:
                self.save_balaustre_draft(session_id, custom_content)

            session_data = await self._collect_session_data(db, session_id)
            
            if custom_content:
                if 'text' in custom_content:
                    session_data['custom_text'] = custom_content['text']
                if 'styles' in custom_content:
                    session_data['styles'] = custom_content['styles']
            else:
                saved_draft = self.load_balaustre_draft(session_id)
                if saved_draft:
                    if 'text' in saved_draft:
                        session_data['custom_text'] = saved_draft['text']
                    if 'styles' in saved_draft:
                        session_data['styles'] = saved_draft['styles']

            html_content = self._render_template("balaustre_template.html", session_data)
            return html_content, session_data
        finally:
            db.close()

    async def generate_balaustre_preview(self, session_id: int, custom_content: dict = None) -> bytes:
        html_content, _ = await self._prepare_balaustre_html(session_id, custom_content)
        
        # DEBUG: Salvar HTML para inspeção
        try:
            debug_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "debug_balaustre.html")
            with open(debug_path, "w", encoding="utf-8") as f:
                f.write(html_content)
            print(f"DEBUG: HTML salvo em {debug_path}")
        except Exception as e:
            print(f"DEBUG: Erro ao salvar HTML: {e}")

        return await self._generate_pdf_from_html(html_content)

    async def regenerate_balaustre_text(self, session_id: int, custom_data: dict) -> str:
        """
        Regenera o texto HTML do balaústre com base nos dados fornecidos,
        ignorando qualquer texto customizado salvo anteriormente.
        """
        db = SessionLocal()
        try:
            session_data = await self._collect_session_data(db, session_id)
            
            # Atualiza os dados da sessão com os dados customizados do formulário
            if custom_data:
                session_data.update(custom_data)
            
            # Garante que não há 'custom_content' para forçar o uso do template dinâmico
            if 'custom_content' in session_data:
                del session_data['custom_content']
            
            # Renderiza o template
            html_content = self._render_template("balaustre_template.html", session_data)
            return html_content
        finally:
            db.close()

    async def generate_balaustre_pdf_task(self, session_id: int, current_user_payload: dict, custom_content: dict = None):
        try:
            print(f"Iniciando geração de balaústre para sessão: {session_id}")
            
            html_content, session_data = await self._prepare_balaustre_html(session_id, custom_content)
            pdf_bytes = await self._generate_pdf_from_html(html_content)
            
            title = f"Balaústre da Sessão {session_data.get('session_title', '')} - {session_data.get('session_date_formatted', '')}"
            filename = f"balaustre_sessao_{session_id}_{session_data.get('session_date').strftime('%Y%m%d')}.pdf"

            db = SessionLocal()
            try:
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
                print(f"Balaústre gerado e salvo com ID: {new_doc.id}")
            finally:
                db.close()

        except Exception as e:
            print(f"Erro ao gerar balaústre: {e}")
            import traceback
            traceback.print_exc()

    async def generate_signed_balaustre_task(self, session_id: int, current_user_payload: dict, custom_content: dict = None):
        try:
            print(f"Iniciando geração de balaústre ASSINADO para sessão: {session_id}")
            
            # 1. Gerar Hash Único
            unique_str = f"{session_id}-{uuid.uuid4()}-{date.today()}"
            signature_hash = hashlib.sha256(unique_str.encode()).hexdigest()
            
            # 2. Gerar QR Code
            # TODO: Substituir pelo domínio real da aplicação
            validation_url = f"http://localhost:5173/validate/{signature_hash}" 
            qr_code_base64 = self._generate_qr_code_base64(validation_url)
            
            # 3. Preparar Dados
            db = SessionLocal()
            try:
                # Save draft if provided (ensure we sign what we see)
                if custom_content:
                    self.save_balaustre_draft(session_id, custom_content)

                session_data = await self._collect_session_data(db, session_id)
                
                # Apply custom content
                if custom_content:
                    if 'text' in custom_content:
                        session_data['custom_text'] = custom_content['text']
                    if 'styles' in custom_content:
                        session_data['styles'] = custom_content['styles']
                else:
                    saved_draft = self.load_balaustre_draft(session_id)
                    if saved_draft:
                        if 'text' in saved_draft:
                            session_data['custom_text'] = saved_draft['text']
                        if 'styles' in saved_draft:
                            session_data['styles'] = saved_draft['styles']

                # Inject Signature Data
                session_data['signature_hash'] = signature_hash
                session_data['qr_code_image'] = qr_code_base64
                session_data['is_signed'] = True
                session_data['signed_date'] = date.today().strftime("%d/%m/%Y")

                # Render HTML
                html_content = self._render_template("balaustre_template.html", session_data)
                
                # Generate PDF
                pdf_bytes = await self._generate_pdf_from_html(html_content)
                
                title = f"Balaústre Assinado - Sessão {session_data.get('session_title', '')} - {session_data.get('session_date_formatted', '')}"
                filename = f"balaustre_assinado_{session_id}_{signature_hash[:8]}.pdf"

                # Save Document
                new_doc = await document_service.create_document(
                    db=db,
                    title=title,
                    current_user_payload=current_user_payload,
                    file_content_bytes=pdf_bytes,
                    filename=filename,
                    content_type="application/pdf",
                )
                new_doc.document_type = "BALAUSTRE_ASSINADO"
                new_doc.session_id = session_id
                db.flush() # Get ID

                # Save Signature
                new_sig = models.DocumentSignature(
                    document_id=new_doc.id,
                    signature_hash=signature_hash,
                    signed_by_id=current_user_payload.get('sub'), # Assuming 'sub' is user ID
                )
                db.add(new_sig)
                
                db.commit()
                print(f"Balaústre ASSINADO gerado e salvo com ID: {new_doc.id}, Hash: {signature_hash}")

            finally:
                db.close()

        except Exception as e:
            print(f"Erro ao gerar balaústre assinado: {e}")
            import traceback
            traceback.print_exc()

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


    async def _collect_certificate_data(self, db: Session, session_id: int, member_id: int) -> dict:
        session = db.query(models.MasonicSession).filter(models.MasonicSession.id == session_id).first()
        member = db.query(models.Member).filter(models.Member.id == member_id).first()
        
        if not session or not member:
            raise ValueError("Sessão ou Membro não encontrados.")
            
        lodge = db.query(models.Lodge).filter(models.Lodge.id == session.lodge_id).first()
        obedience = db.query(models.Obedience).filter(models.Obedience.id == lodge.obedience_id).first()
        
        # Formatação de datas
        months_pt = {
            1: "Janeiro", 2: "Fevereiro", 3: "Março", 4: "Abril", 5: "Maio", 6: "Junho",
            7: "Julho", 8: "Agosto", 9: "Setembro", 10: "Outubro", 11: "Novembro", 12: "Dezembro"
        }
        
        day = session.session_date.day
        month = months_pt[session.session_date.month]
        year = session.session_date.year
        session_date_full = f"{day} de {month} de {year}"
        
        return {
            "lodge_name": lodge.lodge_name,
            "lodge_logo": self._get_lodge_logo(lodge.id),
            "obedience_name": obedience.name if obedience else "",
            "member_name": member.full_name,
            "session_type": session.type.value if session.type else "Sessão",
            "session_subtype": session.subtype.value if session.subtype else "",
            "session_date": session_date_full,
            "generation_date": date.today().strftime("%d/%m/%Y"),
            "lodge_id": lodge.id
        }

    async def generate_certificate_pdf_task(self, session_id: int, member_id: int, current_user_payload: dict):
        try:
            print(f"Iniciando geração de certificado para membro {member_id} na sessão {session_id}")
            
            # 1. Gerar Hash Único
            unique_str = f"CERT-{session_id}-{member_id}-{uuid.uuid4()}"
            signature_hash = hashlib.sha256(unique_str.encode()).hexdigest()
            
            # 2. Gerar QR Code
            # TODO: Substituir pelo domínio real da aplicação
            validation_url = f"http://localhost:5173/validate/{signature_hash}" 
            qr_code_base64 = self._generate_qr_code_base64(validation_url)
            
            db = SessionLocal()
            try:
                # 3. Coletar Dados
                cert_data = await self._collect_certificate_data(db, session_id, member_id)
                
                # Injetar dados de validação
                cert_data['validation_code'] = signature_hash[:12].upper()
                cert_data['qr_code_path'] = qr_code_base64
                
                # 4. Renderizar HTML
                html_content = self._render_template("certificate_template.html", cert_data)
                
                # 5. Gerar PDF
                pdf_bytes = await self._generate_pdf_from_html(html_content)
                
                title = f"Certificado de Presença - {cert_data['member_name']}"
                filename = f"certificado_{session_id}_{member_id}_{date.today().strftime('%Y%m%d')}.pdf"

                # 6. Salvar Documento
                new_doc = await document_service.create_document(
                    db=db,
                    title=title,
                    current_user_payload=current_user_payload,
                    file_content_bytes=pdf_bytes,
                    filename=filename,
                    content_type="application/pdf",
                )
                new_doc.document_type = "CERTIFICADO"
                new_doc.session_id = session_id
                db.flush()

                # 7. Salvar Assinatura/Validação
                new_sig = models.DocumentSignature(
                    document_id=new_doc.id,
                    signature_hash=signature_hash,
                    signed_by_id=current_user_payload.get('sub'), # Quem gerou o certificado
                )
                db.add(new_sig)
                
                db.commit()
                print(f"Certificado gerado e salvo com ID: {new_doc.id}")
                
            finally:
                db.close()

        except Exception as e:
            print(f"Erro ao gerar certificado: {e}")
            import traceback
            traceback.print_exc()


def get_document_generation_service(db: Session = Depends(get_db)):
    return DocumentGenerationService(db)
