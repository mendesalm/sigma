from abc import ABC, abstractmethod
from typing import Any

from sqlalchemy.orm import Session

from models import models
from schemas.document_settings_schema import DocumentSettings


class DocumentStrategy(ABC):
    """
    Abstract Base Class for Document Generation Strategies.
    Defines the contract for collecting data, selecting templates, and rendering content.
    """

    def __init__(self, service):
        self.service = service  # Reference to the main service for helper methods (utils)

    @abstractmethod
    async def collect_data(self, db: Session, main_entity_id: int, **kwargs) -> dict[str, Any]:
        """
        Collects all necessary data for the document type from the database.
        :param db: Database session
        :param main_entity_id: ID of the primary entity (Session ID, Member ID, etc.)
        :return: Dictionary with context data for Jinja2
        """
        pass

    @abstractmethod
    def get_template_name(self) -> str:
        """Returns the Jinja2 template filename."""
        pass

    @abstractmethod
    def get_document_type_key(self) -> str:
        """Returns the key used in DocumentSettings (e.g., 'balaustre', 'prancha')."""
        pass

    def _parse_settings(self, lodge: models.Lodge) -> DocumentSettings:
        """
        Parses document settings with migration logic for legacy flat structures.
        """
        doc_settings_raw = lodge.document_settings or {}

        # MIGRATION LOGIC FOR LEGACY FLAT SETTINGS
        # If the settings are flat (no 'balaustre' key but has fields usually found in DocumentSettings root in legacy),
        # we wrap or duplicate them for the current strategy key.
        # Ideally, we populate ALL keys to be safe.

        main_keys = {"balaustre", "prancha", "convite"}
        has_main_keys = any(k in doc_settings_raw for k in main_keys)

        if doc_settings_raw and not has_main_keys:
            # It's a legacy flat dictionary. Convert to hierarchical.
            # We apply the same settings to all types to be safe.
            doc_settings_raw = {"balaustre": doc_settings_raw, "prancha": doc_settings_raw, "convite": doc_settings_raw}

        try:
            settings = DocumentSettings(**doc_settings_raw)
        except:
            settings = DocumentSettings()

        # FALLBACK: Inject factory defaults if custom templates are missing
        doc_key = self.get_document_type_key()
        if hasattr(settings, doc_key):
            type_settings = getattr(settings, doc_key)
            # Check if content is empty (indicating no custom config)
            if not type_settings.content_template:
                # Fetch defaults from backend file system
                defaults = self.service.get_default_templates(doc_key)
                if defaults:
                    if not type_settings.content_template:
                        type_settings.content_template = defaults.get("content_template", "")
                    if hasattr(type_settings, "signatures_template") and not type_settings.signatures_template:
                        type_settings.signatures_template = defaults.get("signatures_template", "")
                    if hasattr(type_settings, "preamble_template") and not type_settings.preamble_template:
                        type_settings.preamble_template = defaults.get("preamble_template", "")

        return settings

    def _get_common_context(self, lodge: models.Lodge, doc_settings: DocumentSettings) -> dict[str, Any]:
        """
        Helper to extract common style/header data derived from DocumentSettings.
        """
        key = self.get_document_type_key()
        type_settings = getattr(doc_settings, key, doc_settings.balaustre)  # Default fallback

        # Styles
        styles = type_settings.styles.model_dump()

        # Header
        header_map = {
            "header_classico.html": "partials/header_classico.html",
            "header_moderno.html": "partials/header_moderno.html",
            "header_duplo.html": "partials/header_duplo.html",
            "header_grid.html": "partials/header_grid.html",
            "header_timbre.html": "partials/header_timbre.html",
            "header_invertido.html": "partials/header_invertido.html",
        }

        header_template = None
        if type_settings.header and type_settings.header != "no_header":
            header_template = header_map.get(type_settings.header, "partials/header_classico.html")

        return {
            "styles": styles,
            "header_template": header_template,
            "lodge_name": lodge.lodge_name,
            "lodge_number": lodge.lodge_number,
            "lodge_title_formatted": lodge.lodge_title or "A∴R∴B∴L∴S∴",
            "lodge_obedience": lodge.obedience.name if lodge.obedience else "GOB",
            "lodge_subobedience": lodge.subobedience.name
            if hasattr(lodge, "subobedience") and lodge.subobedience
            else "GOB-Estadual",
            # Common footer assets could go here
        }

    def _apply_dynamic_styles(self, context: dict[str, Any], styles_payload: Any):
        """
        Helper to apply styles model and generate dynamic CSS block.
        Shared across all strategies.
        """
        if not styles_payload:
            return

        try:
            from schemas.document_settings_schema import DocumentStyles

            # Validate and convert dict to Pydantic Model if needed
            if isinstance(styles_payload, dict):
                styles_model = DocumentStyles(**styles_payload)
            else:
                styles_model = styles_payload

            context["styles"] = styles_model

            # Generate CSS string using styles_model
            css = f"""
            @page {{
                size: {styles_model.page_size} {styles_model.orientation};
                margin: {styles_model.page_margin};

                @bottom-center {{
                    content: "Página " counter(page);
                    font-size: 10pt;
                    font-family: {styles_model.font_family};
                }}
            }}

            body {{
                font-family: {styles_model.font_family};
                font-size: 12pt;
                line-height: {styles_model.line_height};
                color: {styles_model.primary_color};
                background-color: {styles_model.background_color};
                margin: 0;
                padding: 0;
                {f"background-image: url('{styles_model.background_image}'); background-size: cover; background-repeat: no-repeat;" if styles_model.background_image and styles_model.background_image != "none" else ""}
            }}

            .watermark {{
                position: fixed;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                width: 60%; height: auto;
                z-index: -1;
                opacity: {styles_model.watermark_opacity or 0.1};
                background-image: url('{styles_model.watermark_image}');
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
            }}

            .page-border {{
                position: fixed;
                top: {styles_model.page_margin};
                left: {styles_model.page_margin};
                bottom: {styles_model.page_margin};
                right: {styles_model.page_margin};
                border: {styles_model.border_width} {styles_model.border_style} {styles_model.border_color};
                z-index: 2147483647;
                pointer-events: none;
                {"border: none;" if not styles_model.show_border else ""}
            }}

            .page-content {{
                position: relative;
                width: 100%;
                height: 100%;
                padding: {styles_model.page_padding};
                box-sizing: border-box;
            }}

            /* Header Styles */
            .header {{
                text-align: center;
                margin-bottom: 20px;
            }}
            .header img {{
                max-height: {styles_model.header_config.logo_size};
                height: auto;
                width: auto;
                max-width: 100%;
                margin-bottom: 10px;
            }}
            .header-text {{
                font-weight: bold;
                text-transform: uppercase;
                font-size: {styles_model.header_config.font_size_title};
                margin: 3px 0;
                line-height: 1.2;
                color: {styles_model.header_config.color or "#000"};
            }}

            /* Title Section Styles */
            .title-section {{
                text-align: {styles_model.titles_config.alignment};
                margin-top: {styles_model.titles_config.margin_top};
                margin-bottom: {styles_model.titles_config.margin_bottom};
                font-family: {styles_model.titles_config.font_family or styles_model.font_family};
                font-size: {styles_model.titles_config.font_size};
                font-weight: {"bold" if styles_model.titles_config.bold else "normal"};
                color: {styles_model.titles_config.color or styles_model.primary_color};
                text-transform: {"uppercase" if styles_model.titles_config.uppercase else "none"};
                line-height: {styles_model.titles_config.line_height};
                display: {"block" if styles_model.titles_config.show else "none"};
                padding: {styles_model.titles_config.padding};

                /* Background Support */
                background-color: {styles_model.titles_config.background_color or "transparent"};
                opacity: {1.0}; /* Opacity is usually handled on partials or RGBA colors, assuming 1.0 here or user specific */
                /* For background image in titles we might need more complex CSS or direct style injection in the div */
            }}

            .content {{
                padding-left: 0.3cm;
                padding-right: 0.3cm;
                padding-top: {styles_model.content_config.padding_top};
                text-align: {styles_model.content_config.alignment};
                font-size: {styles_model.content_config.font_size};
                font-family: {styles_model.content_config.font_family or styles_model.font_family};
                line-height: {styles_model.content_config.line_height};
                color: {styles_model.content_config.color or "#000000"};
                background-color: {styles_model.content_config.background_color or "transparent"};
                {f"background-image: url('{styles_model.content_config.background_image}'); background-size: cover;" if styles_model.content_config.background_image else ""}
            }}

            .content p, .content div, .content span {{
                text-align: {styles_model.content_config.alignment};
                margin-bottom: {styles_model.content_config.spacing};
                /* Removed forced line-height: inherit and text-indent: 0 to allow inline styles to cascade properly */
            }}
            .ql-align-center {{ text-align: center !important; }}
            .ql-align-right {{ text-align: right !important; }}
            .ql-align-justify {{ text-align: justify !important; }}
            .ql-align-left {{ text-align: left !important; }}

            /* Quill Size Support */
            .ql-size-8pt {{ font-size: 8pt !important; }}
            .ql-size-10pt {{ font-size: 10pt !important; }}
            .ql-size-12pt {{ font-size: 12pt !important; }}
            .ql-size-14pt {{ font-size: 14pt !important; }}
            .ql-size-16pt {{ font-size: 16pt !important; }}
            .ql-size-18pt {{ font-size: 18pt !important; }}
            .ql-size-24pt {{ font-size: 24pt !important; }}
            .ql-size-36pt {{ font-size: 36pt !important; }}

            /* Quill Font Family Support */
            .ql-font-arial {{ font-family: 'Arial', sans-serif !important; }}
            .ql-font-times-new-roman {{ font-family: 'Times New Roman', serif !important; }}
            .ql-font-courier-new {{ font-family: 'Courier New', monospace !important; }}
            .ql-font-georgia {{ font-family: 'Georgia', serif !important; }}
            .ql-font-verdana {{ font-family: 'Verdana', sans-serif !important; }}
            .ql-font-tahoma {{ font-family: 'Tahoma', sans-serif !important; }}
            .ql-font-trebuchet-ms {{ font-family: 'Trebuchet MS', sans-serif !important; }}

            /* Quill Indent Support - Added !important to override any specific component styles */
            .ql-indent-1 {{ padding-left: 3em !important; }}
            .ql-indent-2 {{ padding-left: 6em !important; }}
            .ql-indent-3 {{ padding-left: 9em !important; }}
            .ql-indent-4 {{ padding-left: 12em !important; }}
            .ql-indent-5 {{ padding-left: 15em !important; }}
            .ql-indent-6 {{ padding-left: 18em !important; }}
            .ql-indent-7 {{ padding-left: 21em !important; }}
            .ql-indent-8 {{ padding-left: 24em !important; }}
            .ql-indent-9 {{ padding-left: 27em !important; }}

            /* Explicitly support styles often found in Quill output just in case they are classes */
            .ql-direction-rtl {{ direction: rtl; text-align: inherit; }}

            /* Footer & Signatures */
            .footer {{
                margin-top: {styles_model.footer_config.spacing_top};
                text-align: center;
                page-break-inside: avoid;
                font-size: {styles_model.footer_config.font_size};
                font-family: {styles_model.font_family};
                color: {styles_model.footer_config.color or "#000"};
            }}
            .footer-date {{
                text-align: right;
                margin-bottom: 60px;
            }}
            .signatures-table {{
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }}
            .signatures-table td {{
                vertical-align: top;
                text-align: center;
                width: 33%;
                padding: 0 10px;
            }}
            .signature-line {{
                border-top: 1px solid {styles_model.footer_config.color or "#000"};
                margin-bottom: 5px;
                width: 90%;
                margin-left: auto; margin-right: auto;
            }}
            .signature-name {{
                font-size: {styles_model.signatures_config.font_size};
                font-family: {styles_model.signatures_config.font_family or styles_model.font_family};
                color: {styles_model.signatures_config.color or styles_model.footer_config.color or "#000"};
                margin-bottom: 2px;
                font-weight: bold;
            }}
            .signature-role {{
                font-size: {styles_model.signatures_config.font_size};
                font-family: {styles_model.signatures_config.font_family or styles_model.font_family};
                color: {styles_model.signatures_config.color or styles_model.footer_config.color or "#000"};
                text-transform: uppercase;
            }}
            .page-number {{
                position: fixed;
                bottom: 0.5cm;
                width: 100%;
                text-align: center;
                font-size: 10pt;
                color: #333;
            }}
            .validation-footer {{
                margin-top: 30px;
                border-top: 1px dashed #ccc;
                padding-top: 10px;
                text-align: center;
                font-size: 9pt;
                page-break-inside: avoid;
            }}
            """
            context["dynamic_style_block"] = f"<style>{css}</style>"

        except Exception:
            # print(f"Error applying dynamic styles: {e}")
            pass
