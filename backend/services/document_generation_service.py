import os
import json
from datetime import date


from fastapi import Depends, HTTPException, status
from jinja2 import Environment, FileSystemLoader  # pip install Jinja2
from sqlalchemy.orm import Session

from database import SessionLocal, get_db
from models import models
from services import document_service
from schemas.document_settings_schema import DocumentSettings
from services.document_strategies.balaustre_strategy import BalaustreStrategy
from services.document_strategies.prancha_strategy import PranchaStrategy
from services.document_strategies.certificate_strategy import CertificateStrategy
from services.document_strategies.invitation_strategy import InvitationStrategy
from services.document_strategies.congratulation_strategy import CongratulationStrategy
from services.document_strategies.electoral_balaustre_strategy import ElectoralBalaustreStrategy
from sqlalchemy import func, cast, Date
import qrcode
import io
import hashlib
import uuid

import base64
from functools import lru_cache

@lru_cache(maxsize=64)
def _read_file_base64_cached(full_path: str) -> str:
    if not os.path.exists(full_path):
        return ""
    with open(full_path, "rb") as image_file:
         return base64.b64encode(image_file.read()).decode('utf-8')


# (O código das funções auxiliares e dos templates permanece o mesmo)



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
        
        # Caminhos base
        backend_dir = os.path.dirname(os.path.dirname(__file__)) # .../sigma/backend
        project_root = os.path.dirname(backend_dir) # .../sigma
        
        # Configura o Loader para buscar em múltiplos locais
        template_paths = [
            os.path.join(backend_dir, 'templates'), # Legacy/Fallback
            os.path.join(project_root, 'storage', 'lodges', 'model', 'templates'), # New Modular Components
        ]
        
        self.env = Environment(loader=FileSystemLoader(template_paths))
        
        # Strategy Registry
        self.strategies = {
            'balaustre': BalaustreStrategy(self),
            'prancha': PranchaStrategy(self),
            'certificado': CertificateStrategy(self),
            'convite': InvitationStrategy(self),
            'congratulacao': CongratulationStrategy(self),
            'balaustre_eleitoral': ElectoralBalaustreStrategy(self),
        }

    def render_partial(self, template_name: str, context: dict) -> str:
        """
        Renders a partial template (e.g., a header) with the provided context.
        Used for frontend previews.
        """
        try:
            # Add partials/ prefix if not present, as usually requested
            if not template_name.startswith('partials/') and not template_name.endswith('.html'):
                 # Assuming full path logic or relative to templates root
                 pass 
            
            # Since frontend sends 'header_classico.html', and it's in templates/partials/
            # We might need to adjust path if the loader is at templates/
            
            # Best effort: try to load as is, or with partials/ prefix
            try:
                template = self.env.get_template(f"partials/{template_name}")
            except:
                template = self.env.get_template(template_name)
                
            return template.render(**context)
        except Exception as e:
            print(f"Error rendering partial {template_name}: {e}")
            return f"<div style='color:red'>Error rendering template: {str(e)}</div>"

    def get_strategy(self, doc_type: str):
         strategy = self.strategies.get(doc_type)
         if not strategy:
              # Fallback? Or strict? Strict for now.
              raise ValueError(f"Tipo de documento não suportado: {doc_type}")
         return strategy

    def _get_base64_asset(self, asset_path: str) -> str:

        base_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'assets')
        full_path = os.path.join(base_path, asset_path)
        
        encoded_string = _read_file_base64_cached(full_path)
        
        if not encoded_string:
            print(f"Asset não encontrado ou vazio: {full_path}")
            return ""

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
        Tenta recuperar o logo da loja. Se não existir, retorna o logo padrão (Model).
        Nível 1: storage/lodges/{folder}/assets/images/logo.png
        Nível 2: storage/lodges/model/assets/images/logo.png
        Nível 3: Default Hardcoded (logoJPJ_.png - legacy fallback)
        """
        import base64
        
        base_storage = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'storage', 'lodges')
        logo_path = None
        
        # --- Nível 1: Pasta da Loja ---
        if self.db:
            lodge = self.db.query(models.Lodge).filter(models.Lodge.id == lodge_id).first()
            if lodge:
                 folder_name = None
                 if lodge.lodge_number:
                     safe_number = "".join(c for c in str(lodge.lodge_number) if c.isalnum() or c in (" ", "-", "_")).strip().replace(" ", "_")
                     folder_name = f"loja_{safe_number}"
                 else:
                     folder_name = f"loja_id_{lodge.id}"
                 
                 # Check new path
                 for ext in ['.png', '.jpg', '.jpeg']:
                     possible_path = os.path.join(base_storage, folder_name, 'assets', 'images', f'logo{ext}')
                     if os.path.exists(possible_path):
                         logo_path = possible_path
                         break
                 
                 # Fallback to old path inside the new folder
                 if not logo_path:
                     for ext in ['.png', '.jpg', '.jpeg']:
                         possible_path = os.path.join(base_storage, folder_name, f'logo{ext}')
                         if os.path.exists(possible_path):
                             logo_path = possible_path
                             break

        # Legacy ID folder check
        if not logo_path:
             storage_base = os.path.join(base_storage, str(lodge_id))
             for ext in ['.png', '.jpg', '.jpeg']:
                path = os.path.join(storage_base, f'logo{ext}')
                if os.path.exists(path):
                    logo_path = path
                    break

        # --- Nível 2: Pasta Model (Padrão) ---
        if not logo_path:
            model_path_base = os.path.join(base_storage, 'model', 'assets', 'images', 'logo')
            for ext in ['.png', '.jpg', '.jpeg']:
                 possible_path = os.path.join(model_path_base, f'logo{ext}')
                 if os.path.exists(possible_path):
                     logo_path = possible_path
                     break

        # --- Leitura do Arquivo ---
        if logo_path:
                try:
                    encoded_string = _read_file_base64_cached(logo_path)
                    
                    if not encoded_string:
                        return self._get_base64_asset("images/logoJPJ_.png")
                    
                    mime_type = "image/png"
                    if logo_path.endswith('.jpg') or logo_path.endswith('.jpeg'):
                        mime_type = "image/jpeg"
                    return f"data:{mime_type};base64,{encoded_string}"
                except Exception as e:
                    print(f"Erro ao ler logo da loja {lodge_id}: {e}")
        
        # --- Nível 3: Fallback Hardcoded ---
        return self._get_base64_asset("images/logoJPJ_.png")

    # --- Helper Methods ---
    def get_lodge_officers_at_date(self, db: Session, lodge_id: int, target_date: date, administration_id: int | None = None) -> dict[str, str]:
        """
        Busca os oficiais ativos da Loja.
        """
        officer_roles = {
            "Venerável Mestre": None, "Primeiro Vigilante": None, "Segundo Vigilante": None,
            "Orador": None, "Secretário": None, "Tesoureiro": None, "Chanceler": None, "Hospitaleiro": None,
        }

        for role_name in officer_roles.keys():
            query = (
                db.query(models.RoleHistory)
                .join(models.Role)
                .filter(
                    models.RoleHistory.member_id.isnot(None),
                    models.Role.name == role_name,
                    models.RoleHistory.lodge_id == lodge_id,
                )
            )

            if administration_id:
                query = query.filter(models.RoleHistory.administration_id == administration_id)
            else:
                query = query.filter(
                    models.RoleHistory.start_date <= target_date,
                    (models.RoleHistory.end_date >= target_date) | (models.RoleHistory.end_date.is_(None))
                )

            officer_history = query.first()

            if officer_history and officer_history.member:
                officer_roles[role_name] = officer_history.member.full_name

        return officer_roles

    def _format_full_address(self, lodge: models.Lodge) -> str:
        parts = []
        if lodge.street_address: parts.append(lodge.street_address)
        if lodge.street_number: parts.append(f"nº {lodge.street_number}")
        if lodge.neighborhood: parts.append(f"- {lodge.neighborhood}")
        if lodge.city: parts.append(f"- {lodge.city}")
        if lodge.state: parts.append(f"({lodge.state})")
        return " ".join(parts) if parts else "Endereço não cadastrado"

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
        """
        Renderiza um template seguindo a estratégia de cascata:
        1. Pasta da Loja (Personalizado)
        2. Pasta Model (Padrão do Sistema)
        3. Arquivos/DB (Legado/Fallback)
        """
        lodge_id = data.get('lodge_id')
        lodge_number = data.get('lodge_number')
        
        base_storage = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'storage', 'lodges')
        
        # Mapeamento de Caminhos
        subpath = None
        if template_name == "balaustre_template.html":
            # Force FILE usage during dev/debug to bypass stale DB
            template = self.env.get_template(template_name)
            return template.render(data)
        elif template_name == "balaustre_template.html":
            subpath = os.path.join("templates", "balaustre", template_name)
        elif template_name == "edital_template.html":
            subpath = os.path.join("templates", "edital", template_name)
        else:
            subpath = os.path.join("templates", template_name)

        # --- Nível 1: Busca na Pasta da Loja ---
        folder_name = None
        if lodge_number:
            safe_lodge_number = "".join(c for c in str(lodge_number) if c.isalnum() or c in (" ", "-", "_")).strip().replace(" ", "_")
            folder_name = f"loja_{safe_lodge_number}"
        elif lodge_id:
             folder_name = f"loja_id_{lodge_id}"
             
        if folder_name:
            template_path = os.path.join(base_storage, folder_name, subpath)
            if os.path.exists(template_path):
                 try:
                     with open(template_path, "r", encoding="utf-8") as f:
                         return self.env.from_string(f.read()).render(data)
                 except Exception as e:
                     print(f"Erro ao ler template da loja ({template_path}): {e}")

            # Legacy flat folder check logic (preserved)
            template_path_flat = os.path.join(base_storage, folder_name, "templates", template_name)
            if os.path.exists(template_path_flat) and template_path_flat != template_path:
                 try:
                     with open(template_path_flat, "r", encoding="utf-8") as f:
                         return self.env.from_string(f.read()).render(data)
                 except Exception:
                     pass

        # --- Nível 2: Busca na Pasta Model ---
        model_template_path = os.path.join(base_storage, 'model', subpath)
        if os.path.exists(model_template_path):
            try:
                with open(model_template_path, "r", encoding="utf-8") as f:
                    return self.env.from_string(f.read()).render(data)
            except Exception as e:
                print(f"Erro ao ler template model ({model_template_path}): {e}")

        # Injeta logo dinâmico (Assets)
        lodge_id = data.get('lodge_id')
        
        # Check for custom logo in styles
        custom_logo_url = None
        styles = data.get('styles')
        if styles:
            # Handle both dict and Pydantic object
            if isinstance(styles, dict):
                header_config = styles.get('header_config', {})
                if isinstance(header_config, dict):
                    custom_logo_url = header_config.get('logo_url')
                else: 
                     custom_logo_url = getattr(header_config, 'logo_url', None)
            else: 
                 header_config = getattr(styles, 'header_config', None)
                 if header_config:
                     custom_logo_url = getattr(header_config, 'logo_url', None)

        if custom_logo_url:
             data['header_image'] = custom_logo_url
        elif lodge_id:
            data['header_image'] = self._get_lodge_logo(lodge_id)
        else:
            data['header_image'] = self._get_base64_asset("images/logoJPJ_.png")
            
        data['footer_image'] = self._get_base64_asset("images/logoRB_.png")
        
        # --- Nível 3: Banco de Dados ou Arquivo Global ---
        template_type = "BALAUSTRE" if "balaustre" in template_name else "EDITAL"
        
        if self.db:
            db_template = template_service.get_template_by_type(self.db, template_type)
            if db_template:
                return self.env.from_string(db_template.content).render(data)
        
        # Fallback Final
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
                    "top": "0cm",
                    "bottom": "0cm",
                    "left": "0cm",
                    "right": "0cm"
                }
            )
            
            browser.close()
            return pdf_bytes

    async def _generate_pdf_from_html(self, html_content: str) -> bytes:
        """Converte conteúdo HTML em PDF usando Playwright (Sync via Thread)."""
        import asyncio
        return await asyncio.to_thread(self._generate_pdf_sync, html_content)

    def _format_full_address(self, lodge: models.Lodge) -> str:
        """Helper para formatar o endereço completo da loja."""
        parts = []
        
        # Rua e Número
        street = (lodge.street_address or "").strip()
        number = (lodge.street_number or "").strip()
        
        if street:
            address_part = f"{street}, {number}" if number else street
            parts.append(address_part)
        elif number:
             parts.append(number)

        # Bairro
        if lodge.neighborhood:
            parts.append(lodge.neighborhood.strip())
            
        # Oriente de Cidade - UF
        city = (lodge.city or "").strip()
        state = (lodge.state or "").strip()
        
        if city:
            city_part = f"oriente de {city}"
            if state:
                city_part += f" - {state}"
            parts.append(city_part)
            
        return ", ".join(parts)

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
            strategy = self.get_strategy('balaustre')
            session_data = await strategy.collect_data(db, session_id)
            
            # Se houver rascunho salvo, usa o texto e estilos dele
            if saved_draft:
                text = saved_draft.get('text', '')
                if 'styles' in saved_draft:
                    session_data['styles'] = saved_draft['styles']
                return {"text": text, "data": session_data}

            # Se não houver rascunho, gera o texto padrão
            officers = {
                "Venerável Mestre": session_data.get("Veneravel"),
                "1º Vigilante": session_data.get("PrimeiroVigilante"),
                "2º Vigilante": session_data.get("SegundoVigilante"),
                "Orador": session_data.get("Orador"),
                "Secretário": session_data.get("Secretario"),
                "Tesoureiro": session_data.get("Tesoureiro"),
                "Chanceler": session_data.get("Chanceler"),
                "Hospitaleiro": session_data.get("Hospitaleiro"),
            }
            
            present_officers = [f"{role}: {name}" for role, name in officers.items() if name and "___" not in name]
            officers_text = ", ".join(present_officers)
            
            attendees = session_data.get("attendees", [])
            attendees_text = ", ".join(attendees) if attendees else "Nenhum registro de presença."
            
            # Determine layout from styles (default standard)
            # Strategy collect_data now returns 'styles' key (Pydantic object or dict)
            styles = session_data.get('styles', {})
            # If styles is Pydantic model (DocumentStyles), convert to dict or access attr
            if hasattr(styles, 'content_layout'):
                 layout = styles.content_layout
            elif isinstance(styles, dict):
                 layout = styles.get('content_layout', 'standard')
            else:
                 layout = 'standard'

            if layout == 'condensed':
                 # Condensed: One single paragraph with running text
                 text = (
                    f"<p>"
                    f"<strong>ABERTURA:</strong> Precisamente às {session_data['HoraInicioSessao']} do dia {session_data['DiaSessao']} da E∴ V∴, "
                    f"a {session_data['lodge_title_formatted']} {session_data['lodge_name']} n° {session_data['lodge_number']}, "
                    f"{session_data['affiliation_text_1']}, {session_data['affiliation_text_2']}, "
                    f"reuniu-se em seu Templo, sito à {session_data['lodge_address']}, em {session_data['session_title_formatted']}, "
                    f"ficando a Loja assim constituída: "
                    f"<strong>Venerável Mestre</strong> {session_data['Veneravel']}; "
                    f"<strong>Primeiro Vigilante</strong> {session_data['PrimeiroVigilante']}; "
                    f"<strong>Segundo Vigilante</strong> {session_data['SegundoVigilante']}; "
                    f"<strong>Orador</strong> {session_data['Orador']}; "
                    f"<strong>Secretário</strong> {session_data['Secretario']}; "
                    f"<strong>Tesoureiro</strong> {session_data['Tesoureiro']} e "
                    f"<strong>Chanceler</strong> {session_data['Chanceler']}, "
                    f"sendo os demais cargos preenchidos pelos seus titulares ou Irmãos do Quadro. "
                    f"<strong>BALAÚSTRE:</strong> foi lido e aprovado o Balaústre da Sessão do dia {session_data['SessaoAnterior']}, sem emendas. "
                    f"<strong>EXPEDIENTE RECEBIDO:</strong> {session_data['ExpedienteRecebido']} "
                    f"<strong>EXPEDIENTE EXPEDIDO:</strong> {session_data['ExpedienteExpedido']} "
                    f"<strong>SACO DE PROPOSTAS E INFORMAÇÕES:</strong> {session_data['SacoProposta']} "
                    f"<strong>ORDEM DO DIA:</strong> {session_data['OrdemDia']} "
                    f"<strong>TEMPO DE INSTRUÇÃO:</strong> {session_data['TempoInstrucao']} "
                    f"<strong>TRONCO DE BENEFICÊNCIA:</strong> fez o seu giro habitual pelo Ir∴ Hospitaleiro e foi entregue ao Irmão Tesoureiro para conferência e anúncio, em momento oportuno. "
                    f"<strong>PALAVRA A BEM GERAL DA ORDEM E DO QUADRO EM PARTICULAR:</strong> {session_data['Palavra']} "
                    f"<strong>ENCERRAMENTO:</strong> o Ven∴ Mestre encerrou a sessão às {session_data['Encerramento']}, "
                    f"tendo eu, {session_data['SecretarioNome']}, Secretário, lavrado o presente balaústre, o qual, após lido, se considerado em tudo conforme, será assinado. "
                    f"</p>"
                 )
            else:
                 # Standard: Multiple paragraphs
                 text = (
                    f"<p>"
                    f"<strong>ABERTURA:</strong> Precisamente às {session_data['HoraInicioSessao']} do dia {session_data['DiaSessao']} da E∴ V∴, "
                    f"a {session_data['lodge_title_formatted']} {session_data['lodge_name']} n° {session_data['lodge_number']}, "
                    f"{session_data['affiliation_text_1']}, {session_data['affiliation_text_2']}, "
                    f"reuniu-se em seu Templo, sito à {session_data['lodge_address']}, em {session_data['session_title_formatted']}, "
                    f"ficando a Loja assim constituída: "
                    f"<strong>Venerável Mestre</strong> {session_data['Veneravel']}; "
                    f"<strong>Primeiro Vigilante</strong> {session_data['PrimeiroVigilante']}; "
                    f"<strong>Segundo Vigilante</strong> {session_data['SegundoVigilante']}; "
                    f"<strong>Orador</strong> {session_data['Orador']}; "
                    f"<strong>Secretário</strong> {session_data['Secretario']}; "
                    f"<strong>Tesoureiro</strong> {session_data['Tesoureiro']} e "
                    f"<strong>Chanceler</strong> {session_data['Chanceler']}, "
                    f"sendo os demais cargos preenchidos pelos seus titulares ou Irmãos do Quadro. "
                    f"</p>"
                    f"<p><strong>BALAÚSTRE:</strong> foi lido e aprovado o Balaústre da Sessão do dia {session_data['SessaoAnterior']}, sem emendas.</p>"
                    f"<p><strong>EXPEDIENTE RECEBIDO:</strong> {session_data['ExpedienteRecebido']}</p>"
                    f"<p><strong>EXPEDIENTE EXPEDIDO:</strong> {session_data['ExpedienteExpedido']}</p>"
                    f"<p><strong>SACO DE PROPOSTAS E INFORMAÇÕES:</strong> {session_data['SacoProposta']}</p>"
                    f"<p><strong>ORDEM DO DIA:</strong> {session_data['OrdemDia']}</p>"
                    f"<p><strong>TEMPO DE INSTRUÇÃO:</strong> {session_data['TempoInstrucao']}</p>"
                    f"<p><strong>TRONCO DE BENEFICÊNCIA:</strong> fez o seu giro habitual pelo Ir∴ Hospitaleiro e foi entregue ao Irmão Tesoureiro para conferência e anúncio, em momento oportuno.</p>"
                    f"<p><strong>PALAVRA A BEM GERAL DA ORDEM E DO QUADRO EM PARTICULAR:</strong> {session_data['Palavra']}</p>"
                    f"<p><strong>ENCERRAMENTO:</strong> o Ven∴ Mestre encerrou a sessão às {session_data['Encerramento']}, "
                    f"tendo eu, {session_data['SecretarioNome']}, Secretário, lavrado o presente balaústre, o qual, após lido, se considerado em tudo conforme, será assinado.</p>"
                 )
            
            
            return {"text": text, "data": session_data}
        finally:
            db.close()

    def _remove_duplicate_date_from_text(self, html_text: str) -> str:
        """
        Remove linhas de data duplicadas do custom_text.
        Remove parágrafos que contenham 'Oriente de' para evitar duplicação
        com a linha de data do footer do template.
        """
        import re
        
        # Pattern para encontrar parágrafos completos com "Oriente de"
        # Captura <p>...</p> ou <div>...</div> que contenha "Oriente de"
        patterns = [
            r'<p[^>]*>.*?Oriente\s+de.*?</p>',
            r'<div[^>]*>.*?Oriente\s+de.*?</div>',
        ]
        
        cleaned_text = html_text
        for pattern in patterns:
            cleaned_text = re.sub(pattern, '', cleaned_text, flags=re.IGNORECASE | re.DOTALL)
        
        return cleaned_text



    async def generate_document(self, doc_type: str, main_entity_id: int, current_user_payload: dict, **kwargs):
        """
        Generic method to generate any document type using the appropriate strategy.
        """
        db = SessionLocal()
        try:
            print(f"Iniciando document gen: {doc_type} ID: {main_entity_id}")
            strategy = self.get_strategy(doc_type)

            # 1. Collect Data
            context = await strategy.collect_data(db, main_entity_id, **kwargs)

            # 2. Render Template
            html_content = self._render_template(strategy.get_template_name(), context)
            
            # DEBUG: Save HTML to file to inspect styles
            try:
                debug_path = f"debug_document_{doc_type}_{main_entity_id}.html"
                with open(debug_path, "w", encoding="utf-8") as f:
                    # Inject detailed style log at the top of the HTML file for easy debugging
                    if 'styles' in context:
                        import json
                        # Attempt to dump styles to JSON for readability
                        try:
                            # If it's a Pydantic model, dump it
                            styles_dict = context['styles'].model_dump()
                            styles_json = json.dumps(styles_dict, indent=2, default=str)
                        except:
                            # Fallback if not pydantic or other error
                            styles_json = str(context['styles'])
                        
                        f.write(f"<!-- \nDEBUG STYLE PARAMETERS:\n{styles_json}\n-->\n")
                    
                    f.write(html_content)
                print(f"saved debug html to {debug_path}")
            except Exception as e:
                print(f"Could not write debug file: {e}")
            
            # 3. Generate PDF
            pdf_bytes = await self._generate_pdf_from_html(html_content)
            
            return html_content, pdf_bytes, context
            
        finally:
            db.close()

    async def generate_balaustre_preview(self, session_id: int, custom_content: dict = None) -> bytes:
        # Unpack custom_content to pass as top-level kwargs to strategy
        kwargs = {}
        if custom_content:
            kwargs['custom_text'] = custom_content.get('text')
            kwargs['styles'] = custom_content.get('styles')
            # Add any other relevant overrides from custom_content if needed
            
        html, pdf, _ = await self.generate_document('balaustre', session_id, {}, **kwargs)
        return pdf

    async def regenerate_balaustre_text(self, session_id: int, custom_data: dict) -> str:
        # This is for the frontend editor content, usually just HTML body, not full PDF.
        # However, strategy returns full context.
        # We can simulate render with strategy to get the HTML.
        db = SessionLocal()
        try:
             strategy = self.get_strategy('balaustre')
             context = await strategy.collect_data(db, session_id, custom_text=custom_data.get('text'))
             if custom_data:
                  context.update(custom_data) # Override specifics
             html = self._render_template(strategy.get_template_name(), context)
             return html
        finally:
             db.close()

    async def generate_balaustre_pdf_task(self, session_id: int, current_user_payload: dict, custom_content: dict = None, doc_type_key: str = 'balaustre'):
         custom_text = custom_content.get('text') if custom_content else None
         html, pdf, ctx = await self.generate_document(doc_type_key, session_id, current_user_payload, custom_text=custom_text)
         
         db = SessionLocal()
         try:
             title = f"Balaústre Sessão {ctx.get('session_number', '')} - {ctx.get('DiaSessao', '')}"
             filename = f"balaustre_sessao_{session_id}.pdf"
             
             new_doc = await document_service.create_document(
                 db=db,
                 title=title,
                 current_user_payload=current_user_payload,
                 file_content_bytes=pdf,
                 filename=filename,
                 content_type="application/pdf"
             )
             new_doc.document_type = "BALAUSTRE"
             new_doc.session_id = session_id
             
             # Opcional: Atualizar status
             session = db.query(models.MasonicSession).filter(models.MasonicSession.id == session_id).first()
             if session:
                  session.status = "ATA_GERADA"
                  
             db.commit()
             print(f"Balaústre gerado: {new_doc.id}")
         finally:
             db.close()

    async def generate_signed_balaustre_task(self, session_id: int, current_user_payload: dict, custom_content: dict = None):
        # Specific logic for signature hash injection... 
        # Strategy needs to know about signature hash? Or we inject it into context?
        # Strategy context collection can receive kwargs.
        
        # 1. Hash & QR
        unique_str = f"{session_id}-{uuid.uuid4()}-{date.today()}"
        signature_hash = hashlib.sha256(unique_str.encode()).hexdigest()
        validation_url = f"http://localhost:5173/validate/{signature_hash}" 
        qr_code_base64 = self._generate_qr_code_base64(validation_url)
        
        # 2. Generate with injected context
        custom_text = custom_content.get('text') if custom_content else None
        
        # We pass hash/qr to kwargs so strategy can put them in context if it wants, 
        # OR we just update the context returned by strategy?
        # Strategy.collect_data might not expect them. Pass as kwargs.
        # But Strategy.collect_data usually connects to DB.
        # Better: call generate_document but modify context BEFORE render?
        # My generate_document does render immediately.
        # I need to separate render? 
        # Let's manual inline for this special case or update generate_document to allow context modification?
        # I'll manually call strategy to expose context update step.
        
        db = SessionLocal()
        try:
             strategy = self.get_strategy('balaustre')
             context = await strategy.collect_data(db, session_id, custom_text=custom_text)
             
             # Inject Signature
             context['signature_hash'] = signature_hash
             context['qr_code_path'] = qr_code_base64
             
             # Render
             html = self._render_template(strategy.get_template_name(), context)
             pdf = await self._generate_pdf_from_html(html)
             
             # Save
             title = f"Balaústre OFICIAL - {context.get('session_number', '')}"
             filename = f"balaustre_assinado_{session_id}.pdf"
             
             new_doc = await document_service.create_document(db=db, title=title, current_user_payload=current_user_payload, file_content_bytes=pdf, filename=filename, content_type="application/pdf")
             new_doc.session_id = session_id
             db.flush()
             
             # Sign Record
             new_sig = models.DocumentSignature(document_id=new_doc.id, signature_hash=signature_hash, signed_by_id=current_user_payload.get('sub'))
             db.add(new_sig)
             db.commit()
             print(f"Assinado gerado: {new_doc.id}")
             
        finally:
             db.close()

    async def generate_invitation_task(self, session_id: int, current_user_payload: dict, custom_message: str = None):
         html, pdf, ctx = await self.generate_document('convite', session_id, current_user_payload, custom_message=custom_message)
         
         db = SessionLocal()
         try:
             title = f"Convite - {ctx.get('event_title', 'Sessão')}"
             filename = f"convite_{session_id}.pdf"
             
             new_doc = await document_service.create_document(
                 db=db,
                 title=title,
                 current_user_payload=current_user_payload,
                 file_content_bytes=pdf,
                 filename=filename,
                 content_type="application/pdf"
             )
             new_doc.document_type = "CONVITE"
             new_doc.session_id = session_id
             db.commit()
             print(f"Convite gerado: {new_doc.id}")
         finally:
             db.close()




    async def generate_edital_pdf_task(self, session_id: int, current_user_payload: dict):
        html, pdf, ctx = await self.generate_document('prancha', session_id, current_user_payload)
         
        db = SessionLocal()
        try:
             # Title logic uses ctx which matches Strategy keys
             title = f"Edital de Convocação - {ctx.get('DiaSessao', '')}" 
             # Or use session_data logic if strategies vary. 
             # PranchaStrategy should return 'session_title' etc?
             # Let's hope context has keys. BaseStrategy ensures session title/date exists.
             
             filename = f"edital_sessao_{session_id}.pdf"
             
             new_doc = await document_service.create_document(
                 db=db, 
                 title=title, 
                 current_user_payload=current_user_payload, 
                 file_content_bytes=pdf, 
                 filename=filename, 
                 content_type="application/pdf"
             )
             new_doc.document_type = "EDITAL"
             new_doc.session_id = session_id
             db.commit()
             print(f"Edital gerado: {new_doc.id}")
        except Exception as e:
             print(f"ERRO ao gerar edital: {e}")
        finally:
             db.close()




    async def generate_certificate_pdf_task(self, session_id: int, member_id: int, current_user_payload: dict):
        try:
            print(f"Iniciando geração de certificado para membro {member_id} na sessão {session_id}")
            
            # 1. Gerar Hash Único
            unique_str = f"CERT-{session_id}-{member_id}-{uuid.uuid4()}"
            signature_hash = hashlib.sha256(unique_str.encode()).hexdigest()
            
            # 2. Gerar QR Code
            validation_url = f"http://localhost:5173/validate/{signature_hash}" 
            qr_code_base64 = self._generate_qr_code_base64(validation_url)
            
            db = SessionLocal()
            try:
                # 3. Coletar Dados via Strategy
                strategy = self.get_strategy('certificado')
                # Note: 'certificado' strategy expects member_id in kwargs
                cert_data = await strategy.collect_data(db, session_id, member_id=member_id)
                
                # Injetar dados de validação
                cert_data['validation_code'] = signature_hash[:12].upper()
                cert_data['qr_code_path'] = qr_code_base64
                
                # 4. Renderizar HTML
                html_content = self._render_template(strategy.get_template_name(), cert_data)
                
                # 5. Gerar PDF
                pdf_bytes = await self._generate_pdf_from_html(html_content)
                
                # 6. Salvar Documento
                title = f"Certificado de Presença - {cert_data['member_name']}"
                filename = f"certificado_{session_id}_{member_id}_{date.today().strftime('%Y%m%d')}.pdf"

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
                
                # 7. Salvar Assinatura/Validação
                new_sig = models.DocumentSignature(
                    document_id=new_doc.id,
                    signature_hash=signature_hash,
                    signed_by_id=current_user_payload.get('sub'),
                )
                db.add(new_sig)
                
                db.commit()
                print(f"Certificado gerado e salvo com ID: {new_doc.id}")
                return pdf_bytes
                
            finally:
                db.close()
            
        except Exception as e:
            print(f"ERRO ao gerar certificado: {e}")
            import traceback
            traceback.print_exc()


def get_document_generation_service(db: Session = Depends(get_db)):
    return DocumentGenerationService(db)
