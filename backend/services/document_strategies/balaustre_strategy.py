from fastapi import HTTPException
from sqlalchemy.orm import Session

from models import models

from .base_strategy import DocumentStrategy


class BalaustreStrategy(DocumentStrategy):
    def get_template_name(self) -> str:
        return "balaustre_template.html"

    def get_document_type_key(self) -> str:
        return "balaustre"

    async def collect_data(self, db: Session, session_id: int, **kwargs) -> dict:
        # 1. Fetch Base Entities
        session = db.query(models.MasonicSession).filter(models.MasonicSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Sessão não encontrada.")

        lodge = db.query(models.Lodge).filter(models.Lodge.id == session.lodge_id).first()
        obedience = db.query(models.Obedience).filter(models.Obedience.id == lodge.obedience_id).first()

        # 2. Parse Document Settings (Webmaster Configuration)
        validated_settings = self._parse_settings(lodge)
        type_settings = validated_settings.balaustre

        # 3. Base Context & CSS
        context = self._get_common_context(lodge, validated_settings)

        # Apply CSS Styles from Settings OR Overrides (Frontend Preview)
        override_styles = kwargs.get("styles")
        self._apply_dynamic_styles(context, override_styles or context.get("styles"))

        # 4. Fetch Officers (From DB Logic)
        officers = self.service.get_lodge_officers_at_date(db, lodge.id, session.session_date)
        context["officers"] = officers

        # 5. Helper Data (Dates, Address, Title Formats)
        months_pt = {
            1: "janeiro",
            2: "fevereiro",
            3: "março",
            4: "abril",
            5: "maio",
            6: "junho",
            7: "julho",
            8: "agosto",
            9: "setembro",
            10: "outubro",
            11: "novembro",
            12: "dezembro",
        }
        session_date_full = (
            f"{session.session_date.day} de {months_pt[session.session_date.month]} de {session.session_date.year}"
        )

        # Lodge Title Formatting
        raw_lodge_title = lodge.lodge_title or "ARLS"
        if "∴" not in raw_lodge_title and "." not in raw_lodge_title:
            formatted_lodge_title = "∴".join(list(raw_lodge_title)) + "∴"
        elif "." in raw_lodge_title and "∴" not in raw_lodge_title:
            formatted_lodge_title = raw_lodge_title.replace(".", "∴")
        else:
            formatted_lodge_title = raw_lodge_title

        # Address Formatting
        addr_parts = []
        if lodge.street_address:
            addr_parts.append(lodge.street_address)
        if lodge.street_number:
            addr_parts.append(f", {lodge.street_number}")
        city_suffix = f"- Oriente de {lodge.city}" if lodge.city else ""
        if lodge.state:
            city_suffix += f"/{lodge.state}"
        full_address = "".join(addr_parts) + " " + city_suffix

        # Attendance Calc
        present_members = 0
        visitors = 0
        if session.attendances:
            present_members = sum(1 for a in session.attendances if a.member_id and a.attendance_status == "Presente")
            visitors = sum(1 for a in session.attendances if a.visitor_id and a.attendance_status == "Presente")

        # Fetch Real Previous Session Date
        prev_session = (
            db.query(models.MasonicSession)
            .filter(
                models.MasonicSession.lodge_id == lodge.id,
                models.MasonicSession.session_date < session.session_date,
                models.MasonicSession.status != "CANCELADA",
            )
            .order_by(models.MasonicSession.session_date.desc())
            .first()
        )
        prev_session_date = prev_session.session_date.strftime("%d/%m/%Y") if prev_session else "--/--/----"

        # 6. Build Variables Dictionary (The "Data Layer")
        # These are the variables available to the Template ({{ Veneravel }}, etc.)
        data_layer = {
            # Session Basics
            "DiaSessao": session_date_full,
            "HoraInicioSessao": session.start_time.strftime("%H:%M") if session.start_time else "--:--",
            "Encerramento": "22:00",  # Default
            "session_number": session.session_number or "_______",
            "exercicio_maconico": "2024/2025",
            "session_title_formatted": session.title.upper(),
            "SessaoAnterior": prev_session_date,
            "DataAssinatura": session_date_full,  # Default to session date
            # Lodge Basics
            "NomeLoja": lodge.lodge_name,
            "NumeroLoja": lodge.lodge_number,
            "TituloLoja": formatted_lodge_title,
            "lodge_title_formatted": formatted_lodge_title,
            "lodge_name": lodge.lodge_name,
            "lodge_number": lodge.lodge_number,
            "CidadeLoja": lodge.city,
            "EnderecoLoja": full_address,
            "lodge_address": full_address,
            "NomeObediencia": obedience.name if obedience else "",
            "obedience_name": obedience.name if obedience else "",
            "header_image": self.service._get_lodge_logo(lodge.id),
            "affiliation_text_1": "Jurisdicionada à Grande Loja...",
            "affiliation_text_2": "Regular e Perfeita",
            # Stats
            "NumIrmaosPresentes": str(present_members),
            "NumVisitantes": str(visitors),
            "ValorTronco": "0,00",
            # Content Defaults
            "BalaustreAnterior": "",
            "ExpedienteRecebido": "Nada constou.",
            "ExpedienteExpedido": "Nada constou.",
            "SacoProposta": "Nada constou.",
            "OrdemDia": "Nada constou.",
            "TempoInstrucao": "Nada constou.",
            "Tronco": "Fez o seu giro habitual e nada rendeu.",
            "Palavra": "Reinou silêncio.",
            # Officers (Defaults from DB)
            "Veneravel": officers.get("Venerável Mestre") or "___________________",
            "PrimeiroVigilante": officers.get("Primeiro Vigilante") or "___________________",
            "SegundoVigilante": officers.get("Segundo Vigilante") or "___________________",
            "Orador": officers.get("Orador") or "___________________",
            "Secretario": officers.get("Secretário") or "___________________",
            "SecretarioNome": officers.get("Secretário") or "___________________",  # Alias
            "Tesoureiro": officers.get("Tesoureiro") or "___________________",
            "Chanceler": officers.get("Chanceler") or "___________________",
            "Hospitaleiro": officers.get("Hospitaleiro") or "___________________",
        }

        # Merge Data Layer into Main Context
        context.update(data_layer)

        # 7. Apply Overrides (The "Input Layer")
        # If kwargs contains data from the Form or Request, it overwrites the defaults.
        # This is where 'VeneravelNome' from the form replaces 'Veneravel' from DB.

        # Define clean mapping from Form Fields to Context Keys
        form_mapping = {
            "VeneravelNome": "Veneravel",
            "SecretarioNome": "Secretario",  # And SecretarioNome
            "OradorNome": "Orador",
            "HoraEncerramento": "Encerramento",
            # Add other direct overrides
        }

        # Direct Copy Keys (Form Key == Context Key)
        direct_keys = [
            "BalaustreAnterior",
            "ExpedienteRecebido",
            "ExpedienteExpedido",
            "SacoProposta",
            "OrdemDia",
            "TempoInstrucao",
            "Tronco",
            "Palavra",
            "SessaoAnterior",
            "DataAssinatura",
            "Encerramento",
            "ValorTronco",
            "Hospitaleiro",
            "Tesoureiro",
            "Chanceler",
            "PrimeiroVigilante",
            "SegundoVigilante",
        ]

        for key, value in kwargs.items():
            if not value:
                continue

            # Map specific form fields
            if key in form_mapping:
                context[form_mapping[key]] = value
                # Also update the key itself just in case template uses it
                context[key] = value

            # Map direct keys
            elif key in direct_keys:
                context[key] = value

            # Special case: If 'text' or 'custom_text' is passed (from Editor editing)
            # This means we basically skip template rendering and use this text.
            elif key == "text" or key == "custom_text":
                context["custom_text"] = value

        # 8. Template Loading & Rendering (The "Logic Layer")

        # A. TITLES
        # Check if we have a custom title from the form/request, OR use the Webmaster Template
        if not kwargs.get("custom_titles") and type_settings.titles_template:
            try:
                t_tmpl = self.service.env.from_string(type_settings.titles_template)
                context["custom_titles"] = t_tmpl.render(**context)
            except Exception as e:
                print(f"Error rendering titles: {e}")

        # B. BODY CONTENT (The Core)
        # Decision: Do we have specific text override (manual edit)?
        # If YES (context['custom_text'] is set from Step 7), we trust it.
        # If NO, we MUST render the Webmaster's Content Template.

        has_manual_edit = "custom_text" in context

        if not has_manual_edit:
            # Load Webmaster Template
            raw_template = type_settings.content_template

            # Fallback if NO Webmaster template exists
            if not raw_template:
                raw_template = """
                 <p>
                 <strong>ABERTURA:</strong> Aos {{ DiaSessao }}, reuniu-se a Loja {{ lodge_title_formatted }} {{ lodge_name }} nº {{ lodge_number }}.
                 Sob a presidência do Venerável Mestre <strong>{{ Veneravel }}</strong>, contou com a presença dos Irmãos:
                 1º Vigilante: {{ PrimeiroVigilante }}, 2º Vigilante: {{ SegundoVigilante }}, Secretário: {{ Secretario }}.
                 </p>
                 <p><strong>ORDEM DO DIA:</strong> {{ OrdemDia }}</p>
                 <p><strong>ENCERRAMENTO:</strong> Sessão encerrada às {{ Encerramento }}.</p>
                 """

            # Sanitize & Render
            try:
                import html

                # Unescape HTML entities (fix WYSIWYG garbage)
                # Order: Replace &nbsp; with space FIRST, then unescape, then replace \xa0 (just in case)
                clean_template = raw_template.replace("&nbsp;", " ")
                clean_template = html.unescape(clean_template).replace("\xa0", " ")

                # RENDER JINJA (Inject Data Layer into Template)
                tmpl_obj = self.service.env.from_string(clean_template)
                rendered_content = tmpl_obj.render(**context)

                context["custom_text"] = rendered_content
            except Exception as e:
                context["custom_text"] = f"Erro ao gerar modelo: {e}"

        return context

    async def get_preview_context(
        self, db: Session, lodge_id: int | None, settings: dict, session_id: int | None = None
    ) -> dict:
        """
        Generates a context dictionary with mock data (or mixed with real lodge data)
        for document preview purposes.
        If session_id is passed, fetches REAL session data via collect_data logic.
        """

        # Scenario 1: Real Session Data Requested
        if session_id:
            try:
                # Reuse the logic from collect_data to get full accurate context
                # Note: collect_data calls _apply_dynamic_styles via _get_common_context -> but here we override styles from 'settings'
                # so we might need a post-fix
                real_context = await self.collect_data(db, session_id, styles=settings.get("styles"))

                # Force settings' header/footer configs since collect_data might load stored settings
                # But for PREVIEW, we want the "unsaved" settings from the frontend editor.

                # Re-apply styling logic with the provided settings (which might be unsaved drafts)
                override_styles = settings.get("styles")
                if override_styles:
                    self._apply_dynamic_styles(real_context, override_styles)

                # Handle Custom Templates (Two-Pass Render) - similar to below
                # ... logic to re-render custom content using new settings ...
                # Actually, collect_data does this partially, but we need to force re-render if settings changed content_template

                content_tmpl = settings.get("content_template")
                if content_tmpl:
                    try:
                        t = self.service.env.from_string(content_tmpl)
                        real_context["custom_text"] = t.render(**real_context)
                    except Exception as e:
                        real_context["custom_text"] = f"<div style='color:red'>Erro no Template de Conteúdo: {e}</div>"

                titles_tmpl = settings.get("titles_template")
                if titles_tmpl:
                    try:
                        t = self.service.env.from_string(titles_tmpl)
                        real_context["custom_titles"] = t.render(**real_context)
                    except Exception as e:
                        real_context["custom_titles"] = f"<div style='color:red'>Erro no Template de Títulos: {e}</div>"

                # Handle Header/Footer overrides from frontend draft
                header_key = settings.get("header")
                if header_key == "header_custom" or header_key == "custom":
                    real_context["custom_header"] = settings.get("header_template", "")
                    real_context["header_template"] = None
                # else: rely on what collect_data set or default

                footer_tmpl = settings.get("footer_template")
                if footer_tmpl:
                    try:
                        t = self.service.env.from_string(footer_tmpl)
                        real_context["custom_footer"] = t.render(**real_context)
                    except Exception as e:
                        real_context["custom_footer"] = f"<div style='color:red'>Erro no Template de Rodapé: {e}</div>"

                return real_context
            except Exception as e:
                print(f"Error fetching real session data for preview: {e}")
                # Fallback to mock if fetch fails
                pass

        # Scenario 2: Mock Data (Existing Logic)
        # 1. Lodge Data (Real or Mock)
        lodge_data = {}
        if lodge_id:
            lodge = db.query(models.Lodge).filter(models.Lodge.id == lodge_id).first()
            if lodge:
                lodge_data = {
                    "lodge_name": lodge.lodge_name,
                    "lodge_number": lodge.lodge_number,
                    "lodge_city": lodge.city,
                    "lodge_state": lodge.state,
                    "lodge_title": lodge.lodge_title,
                    "lodge_address": self.service._format_full_address(lodge),
                    "NomeLoja": lodge.lodge_name,
                    "NumeroLoja": lodge.lodge_number,
                    "CidadeLoja": lodge.city,
                    "TituloLoja": lodge.lodge_title or "A∴R∴L∴S∴",
                    "EnderecoLoja": self.service._format_full_address(lodge),
                    "header_image": self.service._get_lodge_logo(lodge.id),
                }

        # Mock defaults if lodge not found
        if not lodge_data:
            lodge_data = {
                "lodge_name": "Loja Exemplo",
                "lodge_number": "123",
                "lodge_city": "Oriente Exemplo",
                "lodge_state": "UF",
                "lodge_title": "A∴R∴L∴S∴",
                "lodge_address": "Rua da Fraternidade, 33, Centro",
                "NomeLoja": "Loja Exemplo",
                "NumeroLoja": "123",
                "CidadeLoja": "Oriente Exemplo",
                "TituloLoja": "A∴R∴L∴S∴",
                "EnderecoLoja": "Rua da Fraternidade, 33, Centro",
                "header_image": self.service._get_base64_asset("images/logoJPJ_.png"),
            }

        # 2. Mock Session Data
        context = {
            **lodge_data,
            # styles handled by _apply_dynamic_styles
            # Session Info
            "DiaSessao": "20 de Dezembro de 2024",
            "HoraInicioSessao": "20:00",
            "Encerramento": "22:00",
            "session_number": "001",
            "SessaoAnterior": "19 de Dezembro de 2024",
            "session_title_formatted": "SESSÃO MAGNA DE INICIAÇÃO",
            "exercicio_maconico": "2024/2025",
            "DataAssinatura": "20 de Dezembro de 2024",
            # Lodge Formatted Info (Critical for Template)
            "lodge_title_formatted": lodge_data.get("lodge_title", "A∴R∴L∴S∴").replace(".", ". "),
            "affiliation_text_1": "Jurisdicionada ao Grande Oriente do Brasil",
            "affiliation_text_2": "Federada ao Grande Oriente Estadual",
            # Additional Stats
            "NumIrmaosPresentes": "25",
            "NumVisitantes": "5",
            "ValorTronco": "150,00",
            # Officers
            "Veneravel": "João da Silva",
            "PrimeiroVigilante": "Pedro Santos",
            "SegundoVigilante": "Carlos Oliveira",
            "Orador": "Marcos Souza",
            "Secretario": "Antonio Lima",
            "SecretarioNome": "Antonio Lima",
            "Tesoureiro": "Bruno Ferreira",
            "Chanceler": "Daniel Costa",
            "Hospitaleiro": "Lucas Pires",
            # Text Blocks (Mock Content)
            "BalaustreAnterior": "Foi lido e aprovado, sem emendas, o Balaústre da Sessão anterior.",
            "ExpedienteRecebido": "1. Ato nº 123/2024 do GOB. 2. Convite da Loja Vizinha.",
            "ExpedienteExpedido": "1. Prancha de agradecimento à Loja Fraternidade.",
            "SacoProposta": "Sem propostas.",
            "OrdemDia": "Iniciação do candidato Fulano de Tal.",
            "TempoInstrucao": "Peça de arquitetura sobre o simbolismo do grau.",
            "Tronco": "Fez o giro habitual e rendeu R$ 150,00.",
            "Palavra": "Reinou a paz e a harmonia.",
            # Footer
            "bairro": "Centro",
            "rua": "Rua da Fraternidade",
            "numero": "33",
        }

        # 3. Apply Dynamic Styles (CSS) & Header
        self._apply_dynamic_styles(context, settings.get("styles"))

        # 3. Handle Header
        header_key = settings.get("header")
        if header_key == "header_custom" or header_key == "custom":
            # Full replacement: Use the content provided in header_template
            context["custom_header"] = settings.get("header_template", "")
            # Clear header_template file path to prevent collision
            context["header_template"] = None
        else:
            # Standard/Master Header selected
            # We assume partials/header_master.html or similar exists or let jinja resolve
            # Usually 'header_classico.html' is passed in settings['header']
            context["header_template"] = header_key if header_key else "partials/header_master.html"
            context["custom_header"] = None

        # 3b. Handle Footer
        # If settings has 'footer_template' (custom content), we render it.
        # Otherwise, the template (balaustre_template.html) falls back to default structure.
        footer_tmpl = settings.get("footer_template")
        if footer_tmpl:
            try:
                t = self.service.env.from_string(footer_tmpl)
                context["custom_footer"] = t.render(**context)
            except Exception as e:
                context["custom_footer"] = f"<div style='color:red'>Erro no Template de Rodapé: {e}</div>"
        else:
            context["custom_footer"] = None

        # 4. Process Custom Templates (Two-Pass Render)

        # Content Template
        content_tmpl = settings.get("content_template")
        if content_tmpl:
            try:
                t = self.service.env.from_string(content_tmpl)
                context["custom_text"] = t.render(**context)
            except Exception as e:
                context["custom_text"] = f"<div style='color:red'>Erro no Template de Conteúdo: {e}</div>"

        # Titles Template
        titles_tmpl = settings.get("titles_template")
        if titles_tmpl:
            try:
                t = self.service.env.from_string(titles_tmpl)
                context["custom_titles"] = t.render(**context)
            except Exception as e:
                context["custom_titles"] = f"<div style='color:red'>Erro no Template de Títulos: {e}</div>"

        return context
