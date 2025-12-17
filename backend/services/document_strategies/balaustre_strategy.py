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
        
        # Inject raw officers dict for cleaner template access: {{ officers['1º Vigilante'] }}
        context['officers'] = officers
        
        # Also inject sanitized keys for top-level convenience if needed (optional)
        # e.g. {{ VeneravelMestre }}
        # for role, member in officers.items():
        #      clean_key = "".join(c for c in unicodedata.normalize('NFKD', role).encode('ASCII', 'ignore').decode('ASCII') if c.isalnum())
        #      context[clean_key] = member  


        # Helper to format Masonic Title (ARLS -> A∴R∴L∴S∴)
        raw_lodge_title = lodge.lodge_title or "ARLS"
        if "∴" not in raw_lodge_title and "." not in raw_lodge_title:
             formatted_lodge_title = "∴".join(list(raw_lodge_title)) + "∴"
        elif "." in raw_lodge_title and "∴" not in raw_lodge_title:
             formatted_lodge_title = raw_lodge_title.replace(".", "∴")
        else:
             formatted_lodge_title = raw_lodge_title

        # Calculate Attendees
        present_members = 0
        visitors = 0
        if session.attendances:
            present_members = sum(1 for a in session.attendances if a.member_id and a.attendance_status == 'Presente')
            visitors = sum(1 for a in session.attendances if a.visitor_id and a.attendance_status == 'Presente')

        # Custom Address Formatting as requested
        # {{rua}} + "," + {{número}} + ", " + {{bairro}} + "- Oriente de " + {{cidade}} + "/" + {{estado}}
        addr_parts = []
        if lodge.street_address: addr_parts.append(lodge.street_address)
        if lodge.street_number: addr_parts.append(f", {lodge.street_number}")
        if lodge.neighborhood: addr_parts.append(f", {lodge.neighborhood}")
        
        city_suffix = f"- Oriente de {lodge.city}" if lodge.city else ""
        if lodge.state: city_suffix += f"/{lodge.state}"
        
        full_address = "".join(addr_parts) + " " + city_suffix

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
            "lodge_address": full_address,
            "obedience_name": obedience.name if obedience else "",
            "CidadeLoja": lodge.city,
            "DataAssinatura": session_date_full,
            "header_image": self.service._get_lodge_logo(lodge.id),
            "lodge_title_formatted": formatted_lodge_title,
            
            # Portuguese Aliases
            "NomeLoja": lodge.lodge_name,
            "NumeroLoja": lodge.lodge_number,
            "TituloLoja": formatted_lodge_title,
            "EnderecoLoja": full_address,
            "NomeObediencia": obedience.name if obedience else "",
            "NumIrmaosPresentes": str(present_members),
            "NumVisitantes": str(visitors),
            "ValorTronco": kwargs.get('ValorTronco', '0,00'),
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

        # 3. Dynamic Template Injection (from Document Settings)
        # Check if user defined custom templates in 'Document Settings'
        # validated_settings is already a dict merged with defaults
        
        # 3a. Titles Template
        # If no explicit titles override from request, but settings has a template, use it.
        if not kwargs.get('custom_titles') and validated_settings.get('titles_template'):
             try:
                 t_tmpl_str = validated_settings['titles_template']
                 t_template = self.service.env.from_string(t_tmpl_str)
                 # Render with current context (lodge info, session info, etc.)
                 context['custom_titles'] = t_template.render(**context)
             except Exception as e:
                 print(f"Balaustre Titles Template Render Error: {e}")

        # 3b. Content Template
        # If no explicit content override (kwargs['custom_text']), but settings has a template, use it.
        # We inject this into 'custom_text' so it gets processed by the Two-Pass renderer below.
        if not context.get('custom_text') and validated_settings.get('content_template'):
             context['custom_text'] = validated_settings['content_template']
        
        # Two-Pass Rendering: Resolve tokens in custom_text using the current context
        if context.get('custom_text'):
             try:
                 # Use the service's Jinja environment to render the user's custom layout
                 template = self.service.env.from_string(context['custom_text'])
                 context['custom_text'] = template.render(**context)
             except Exception as e:
                 print(f"Dynamic Template Render Error: {e}")

        return context

    def get_preview_context(self, db: Session, lodge_id: int | None, settings: dict) -> dict:
        """
        Generates a context dictionary with mock data (or mixed with real lodge data) 
        for document preview purposes.
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
                "header_image": self.service._get_base64_asset("images/logoJPJ_.png")
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
        self._apply_dynamic_styles(context, settings.get('styles'))
        
        # 3. Handle Header
        header_key = settings.get('header')
        if header_key == 'header_custom' or header_key == 'custom':
             # Full replacement: Use the content provided in header_template
             context['custom_header'] = settings.get('header_template', '')
             # Clear header_template file path to prevent collision
             context['header_template'] = None 
        else:
             # Standard/Master Header selected
             context['header_template'] = "partials/header_master.html"
             context['custom_header'] = None
        
        # 3b. Handle Footer
        # If settings has 'footer_template' (custom content), we render it.
        # Otherwise, the template (balaustre_template.html) falls back to default structure.
        footer_tmpl = settings.get('footer_template')
        if footer_tmpl:
             try:
                 t = self.service.env.from_string(footer_tmpl)
                 context['custom_footer'] = t.render(**context)
             except Exception as e:
                 context['custom_footer'] = f"<div style='color:red'>Erro no Template de Rodapé: {e}</div>"
        else:
             context['custom_footer'] = None
        
        # 4. Process Custom Templates (Two-Pass Render)
        
        # Content Template
        content_tmpl = settings.get('content_template')
        if content_tmpl:
             try:
                 t = self.service.env.from_string(content_tmpl)
                 context['custom_text'] = t.render(**context)
             except Exception as e:
                 context['custom_text'] = f"<div style='color:red'>Erro no Template de Conteúdo: {e}</div>"

        # Titles Template 
        titles_tmpl = settings.get('titles_template')
        if titles_tmpl:
             try:
                 t = self.service.env.from_string(titles_tmpl)
                 context['custom_titles'] = t.render(**context)
             except Exception as e:
                 context['custom_titles'] = f"<div style='color:red'>Erro no Template de Títulos: {e}</div>"

        return context

    def _apply_dynamic_styles(self, context: dict, styles_payload: dict):
        """Helper to apply styles model and generate dynamic CSS block."""
        if not styles_payload:
            return

        try:
            from schemas.document_settings_schema import DocumentStyles
            # Validate and convert dict to Pydantic Model if needed
            if isinstance(styles_payload, dict):
                 styles_model = DocumentStyles(**styles_payload)
            else:
                 styles_model = styles_payload

            context['styles'] = styles_model

            # Generate CSS string using styles_model
            # Note: This is duplicated from collect_data for now to ensure consistency.
            # In a future refactor, collect_data should also use this method.
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
            context['dynamic_style_block'] = f"<style>{css}</style>"
            
        except Exception as e:
            print(f"Error applying dynamic styles: {e}")
            import traceback
            traceback.print_exc()
