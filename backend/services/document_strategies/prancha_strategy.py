from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session

from models import models

from .base_strategy import DocumentStrategy


class PranchaStrategy(DocumentStrategy):
    def get_template_name(self) -> str:
        return "document_template.html"

    def get_document_type_key(self) -> str:
        return "prancha"

    async def collect_data(self, db: Session, session_id: int, **kwargs) -> dict:
        session = db.query(models.MasonicSession).filter(models.MasonicSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Sessão não encontrada.")

        lodge = db.query(models.Lodge).filter(models.Lodge.id == session.lodge_id).first()
        db.query(models.Obedience).filter(models.Obedience.id == lodge.obedience_id).first()

        # Parse Settings
        # Parse Settings
        validated_settings = self._parse_settings(lodge)

        context = self._get_common_context(lodge, validated_settings)

        # Apply Dynamic Styles (CSS) & Header
        # This will inject 'dynamic_style_block' into the context
        self._apply_dynamic_styles(
            context,
            validated_settings.prancha.styles
            if hasattr(validated_settings, "prancha")
            else validated_settings.balaustre.styles,
        )

        # Specific Prancha Data
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
        day = session.session_date.day
        month = months_pt[session.session_date.month]
        year = session.session_date.year
        session_date_full = f"{day} de {month} de {year}"

        officers = self.service.get_lodge_officers_at_date(db, lodge.id, session.session_date)

        context.update(
            {
                "DiaSessao": session_date_full,
                "HibernateData": session_date_full,
                "session_type": session.type.value if session.type else "SESSÃO",
                "session_title": session.title,
                "lodge_address": self.service._format_full_address(lodge),
                "OrdemDia": session.agenda or "Não informada.",
                "HoraInicioSessao": session.start_time.strftime("%H:%M") if session.start_time else "--:--",
                "DataAssinatura": date.today().strftime("%d of %B of %Y"),  # Can be formatted better
                "CidadeLoja": lodge.city,
                "Veneravel": officers.get("Venerável Mestre") or "___________________",
                "SecretarioNome": officers.get("Secretário") or "___________________",
                "ObrigatoriedadeTraje": "Passeio Completo (ou conforme Rito)",  # Can be in kwargs or session
                "DataSessaoExtenso": session_date_full,
            }
        )

        if kwargs.get("custom_text"):
            context["custom_text"] = kwargs["custom_text"]

        # Titles
        if hasattr(validated_settings, "titles_template") and validated_settings.titles_template:
            raw_titles = validated_settings.titles_template
            try:
                from jinja2 import Template

                t = Template(raw_titles)
                context["custom_titles"] = t.render(**context)
            except:
                context["custom_titles"] = raw_titles

        # Custom Content (Body)
        if hasattr(validated_settings, "content_template") and validated_settings.content_template:
            raw_content = validated_settings.content_template
            try:
                from jinja2 import Template

                t = Template(raw_content)
                context["custom_content"] = t.render(**context)
            except:
                context["custom_content"] = raw_content

        # Preamble
        if hasattr(validated_settings, "preamble_template") and validated_settings.preamble_template:
            raw_preamble = validated_settings.preamble_template
            try:
                from jinja2 import Template

                t = Template(raw_preamble)
                context["custom_preamble"] = t.render(**context)
            except:
                context["custom_preamble"] = raw_preamble

        # Signatures
        if hasattr(validated_settings, "signatures_template") and validated_settings.signatures_template:
            raw_signatures = validated_settings.signatures_template
            try:
                from jinja2 import Template

                t = Template(raw_signatures)
                context["custom_signatures"] = t.render(**context)
            except:
                context["custom_signatures"] = raw_signatures

        # Date & Place
        if hasattr(validated_settings, "date_place_template") and validated_settings.date_place_template:
            raw_date_place = validated_settings.date_place_template
            try:
                from jinja2 import Template

                t = Template(raw_date_place)
                context["custom_date_place"] = t.render(**context)
            except:
                context["custom_date_place"] = raw_date_place

        return context

    def get_preview_context(self, db: Session, lodge_id: int | None, settings: dict) -> dict:
        """
        Generates a context dictionary with mock data (or mixed with real lodge data)
        for prancha/edital preview purposes.
        """
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
                    "obedience_name": "Grande Oriente do Brasil",  # Fetch real if needed, usually passed via lodge
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

        # 2. Mock Prancha/Edital content
        context = {
            **lodge_data,
            "DiaSessao": "20 de Dezembro de 2024",
            "DataSessaoExtenso": "20 de Dezembro de 2024",
            "HoraInicioSessao": "20:00",
            "session_type": "MAGNA DE INICIAÇÃO",
            "OrdemDia": "Leitura de Expediente, Escrutínio Secreto, Iniciação.",
            "ObrigatoriedadeTraje": "Passeio Completo",
            "DataAssinatura": "15 de Dezembro de 2024",
            "Veneravel": "Venerável Mestre Exemplo",
            "SecretarioNome": "Secretário Exemplo",
            "lodge_title_formatted": lodge_data.get("lodge_title", "A∴R∴L∴S∴").replace(".", ". "),
            "affiliation_text_1": "Jurisdicionada ao Grande Oriente do Brasil",
            "affiliation_text_2": "Federada ao Grande Oriente Estadual",
        }

        # 3. Apply Dynamic Styles
        self._apply_dynamic_styles(context, settings.get("styles"))

        # 4. Handle Header Override (same as Balaustre logic)
        header_key = settings.get("header")
        if header_key == "header_custom" or header_key == "custom":
            context["custom_header"] = settings.get("header_template", "")
            context["header_template"] = None
        else:
            context["header_template"] = "partials/header_master.html"  # Default master header
            context["custom_header"] = None

        # 5. Handle Custom Content Overrides if passed in settings (rare for preview but possible)
        # Assuming defaults are enough for preview unless user is typing custom text

        # 7. Content Override
        if settings.get("content_template"):
            # Pre-render content to replace placeholders like {{ DiaSessao }}
            raw_content = settings.get("content_template", "")
            try:
                # We need a temporary env to render string templates
                from jinja2 import Template

                t = Template(raw_content)
                context["custom_content"] = t.render(**context)
            except Exception:
                # Fallback to raw if render fails
                context["custom_content"] = raw_content

        # 8. Preamble Override
        if settings.get("preamble_template"):
            raw_preamble = settings.get("preamble_template", "")
            try:
                from jinja2 import Template

                t = Template(raw_preamble)
                context["custom_preamble"] = t.render(**context)
            except:
                context["custom_preamble"] = raw_preamble

        # 9. Signatures Override
        if settings.get("signatures_template"):
            raw_signatures = settings.get("signatures_template", "")
            try:
                from jinja2 import Template

                t = Template(raw_signatures)
                context["custom_signatures"] = t.render(**context)
            except:
                context["custom_signatures"] = raw_signatures

        # 10. Date & Place Override
        if settings.get("date_place_template"):
            raw_date_place = settings.get("date_place_template", "")
            try:
                from jinja2 import Template

                t = Template(raw_date_place)
                context["custom_date_place"] = t.render(**context)
            except:
                context["custom_date_place"] = raw_date_place

        # 6. Titles Override (Pre-render as well if needed)
        if settings.get("titles_template"):
            raw_titles = settings.get("titles_template", "")
            try:
                from jinja2 import Template

                t = Template(raw_titles)
                context["custom_titles"] = t.render(**context)
            except:
                context["custom_titles"] = raw_titles

        return context
