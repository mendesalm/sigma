from .base_strategy import DocumentStrategy
from sqlalchemy.orm import Session
from models import models
from fastapi import HTTPException, status
from datetime import date

class BalaustreStrategy(DocumentStrategy):
    
    def get_template_name(self) -> str:
        return "balaustre_template.html"

    def get_document_type_key(self) -> str:
        return "balaustre"

    async def collect_data(self, db: Session, session_id: int, **kwargs) -> dict:
        session = db.query(models.MasonicSession).filter(models.MasonicSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Sessão não encontrada.")
            
        lodge = db.query(models.Lodge).filter(models.Lodge.id == session.lodge_id).first()
        obedience = db.query(models.Obedience).filter(models.Obedience.id == lodge.obedience_id).first()

        # Parse Settings
        # Using centralized parser in base strategy
        validated_settings = self._parse_settings(lodge)
             
        context = self._get_common_context(lodge, validated_settings)

        # Logic specific to Balaustre (Attendance, Officers, etc.)
        # Reusing the logic from original service but cleaner
        officers = self.service.get_lodge_officers_at_date(db, lodge.id, session.session_date)
        
        months_pt = {1: "janeiro", 2: "fevereiro", 3: "março", 4: "abril", 5: "maio", 6: "junho", 7: "julho", 8: "agosto", 9: "setembro", 10: "outubro", 11: "novembro", 12: "dezembro"}
        day = session.session_date.day
        month = months_pt[session.session_date.month]
        year = session.session_date.year
        session_date_full = f"{day} de {month} de {year}"

        # Default values for fields
        default_fields = {
            "BalaustreAnterior": "",
            "ExpedienteRecebido": "Nada constou.",
            "ExpedienteExpedido": "Nada constou.",
            "SacoProposta": "Nada constou.",
            "OrdemDia": "Nada constou.",
            "TempoInstrucao": "Nada constou.",
            "Tronco": "Fez o seu giro habitual e nada rendeu.",
            "Palavra": "Reinou silêncio.",
            "Encerramento": "22:00",
            "SessaoAnterior": "15/12/2024", # TODO: Fetch real previous session date
            "PrimeiroVigilante": officers.get("Primeiro Vigilante") or "___________________",
            "SegundoVigilante": officers.get("Segundo Vigilante") or "___________________",
            "Tesoureiro": officers.get("Tesoureiro") or "___________________",
            "Chanceler": officers.get("Chanceler") or "___________________",
            "Secretario": officers.get("Secretário") or "___________________",
            "Hospitaleiro": officers.get("Hospitaleiro") or "___________________",
            "affiliation_text_1": "Jurisdicionada à Grande Loja...", 
            "affiliation_text_2": "Regular e Perfeita",
        }
        
        context.update(default_fields)

        # Populate context with correct keys (CamelCase for template)
        context.update({
            "DiaSessao": session_date_full,
            "HoraInicioSessao": session.start_time.strftime("%H:%M") if session.start_time else "--:--",
            "session_number": session.session_number or "_______",
            "exercicio_maconico": "2024/2025", # TODO: Dynamic
            "session_title_formatted": session.title.upper(),
            "Veneravel": officers.get("Venerável Mestre") or "___________________",
            "SecretarioNome": officers.get("Secretário") or "___________________",
            "Orador": officers.get("Orador") or "___________________",
            "lodge_address": self.service._format_full_address(lodge),
            "obedience_name": obedience.name if obedience else "",
            "CidadeLoja": lodge.city,
            "DataAssinatura": session_date_full,
            "header_image": self.service._get_lodge_logo(lodge.id),
        })

        # Apply Overrides from kwargs (Frontend Form Data) with Aliases
        override_keys = [
            "BalaustreAnterior", "ExpedienteRecebido", "ExpedienteExpedido", 
            "SacoProposta", "OrdemDia", "Escrutinio", "TempoInstrucao", 
            "Tronco", "Palavra", "Emendas", "Hospitaleiro",
            "SessaoAnterior", 
            "VeneravelNome", "SecretarioNome", "OradorNome",
            "Veneravel", "PrimeiroVigilante", "SegundoVigilante", "Orador", "Secretario", "Tesoureiro", "Chanceler"
        ]
        
        for key in override_keys:
            if kwargs.get(key):
                context[key] = kwargs[key]

        # Handle Aliases (Frontend Key -> Context Key)
        if kwargs.get('HoraEncerramento'):
            context['Encerramento'] = kwargs['HoraEncerramento']
        if kwargs.get('Encerramento'):
             context['Encerramento'] = kwargs['Encerramento']
        if kwargs.get('DataAssinatura'):
             context['DataAssinatura'] = kwargs['DataAssinatura']

        # Add custom text if passed in kwargs (for preview/regeneration)
        if kwargs.get('custom_text'):
             context['custom_text'] = kwargs['custom_text']

        # CRITICAL: Allow frontend to override styles (for Preview/Customization)
        # The frontend sends 'styles' payload as a raw dictionary.
        # We MUST convert it to a Pydantic Model (DocumentStyles) so that valid dot-notation
        # access (e.g. styles.page_margin) works in the Jinja2 template.
        override_styles = kwargs.get('styles')
        if override_styles:
            try:
                if isinstance(override_styles, dict):
                    from schemas.document_settings_schema import DocumentStyles
                    # Validate and convert dict to Pydantic Model
                    styles_model = DocumentStyles(**override_styles)
                    context['styles'] = styles_model

                    
                    # Generate CSS string here to avoid template formatter corruption
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
                        {f"background-image: url('{styles_model.background_image}'); background-size: cover; background-repeat: no-repeat;" if styles_model.background_image and styles_model.background_image != 'none' else ''}
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
                        top: 0; left: 0; bottom: 0; right: 0;
                        border: {styles_model.border_width} {styles_model.border_style} {styles_model.border_color};
                        z-index: 2147483647;
                        pointer-events: none;
                        {'border: none;' if not styles_model.show_border else ''}
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
                        height: {styles_model.header_config.logo_size};
                        width: auto;
                        margin-bottom: 10px;
                    }}
                    .header-text {{
                        font-weight: bold;
                        text-transform: uppercase;
                        font-size: {styles_model.header_config.font_size_title};
                        margin: 3px 0;
                        line-height: 1.2;
                        color: {styles_model.header_config.color or '#000'};
                    }}

                    .content {{
                        padding-left: 0.3cm;
                        padding-right: 0.3cm;
                        padding-top: {styles_model.content_config.padding_top};
                        text-align: {styles_model.content_config.alignment};
                        font-size: {styles_model.content_config.font_size};
                        font-family: {styles_model.content_config.font_family or styles_model.font_family};
                        line-height: {styles_model.content_config.line_height};
                        color: {styles_model.content_config.color or '#000000'};
                        background-color: {styles_model.content_config.background_color or 'transparent'};
                        {f"background-image: url('{styles_model.content_config.background_image}'); background-size: cover;" if styles_model.content_config.background_image else ''}
                    }}
                    
                    .content p, .content div, .content span {{
                        text-align: {styles_model.content_config.alignment};
                        margin-bottom: {styles_model.content_config.spacing};
                        text-indent: 0;
                        line-height: inherit;
                    }}

                    /* Footer & Signatures */
                    .footer {{
                        margin-top: {styles_model.footer_config.spacing_top};
                        text-align: center;
                        page-break-inside: avoid;
                        font-size: {styles_model.footer_config.font_size};
                        font-family: {styles_model.font_family};
                        color: {styles_model.footer_config.color or '#000'};
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
                        border-top: 1px solid {styles_model.footer_config.color or '#000'};
                        margin-bottom: 5px;
                        width: 90%;
                        margin-left: auto; margin-right: auto;
                    }}
                    .signature-name {{
                        font-size: {styles_model.footer_config.font_size};
                        margin-bottom: 2px;
                    }}
                    .signature-role {{
                        font-size: {styles_model.footer_config.font_size};
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
                    # Wrap in <style> tag to avoid formatter issues in the template
                    context['dynamic_style_block'] = f"<style>{css}</style>"
                else:
                    # Assume it's already a model if not a dict (rare case)
                    context['styles'] = override_styles
            except Exception as e:
                print(f"Erro ao converter styles para Pydantic Model: {e}")
                # Do not swallow the error. Raise it so we know if data is invalid.
                raise HTTPException(status_code=500, detail=f"Invalid document styles payload: {str(e)}")
        
        return context
