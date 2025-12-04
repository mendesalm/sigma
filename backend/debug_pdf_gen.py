import os
import sys
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa
from io import BytesIO

# Setup paths
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_DIR = os.path.join(BACKEND_DIR, 'templates')

def test_pdf_generation():
    print("Iniciando teste de geração de PDF...")
    
    # 1. Setup Jinja2
    env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))
    try:
        template = env.get_template("balaustre_template.html")
        print("Template carregado com sucesso.")
    except Exception as e:
        print(f"Erro ao carregar template: {e}")
        return

    # 2. Mock Data
    data = {
        "styles": {
            "logo_height": "2cm",
            "header_text_color": "#380404",
            "page_bg_color": "white",
            "border_width": "1px",
            "border_style": "solid",
            "border_color": "black",
            "header_bg_color": "transparent"
        },
        "header_image": "", # Empty for test or base64
        "lodge_name": "Loja Teste",
        "lodge_number": "123",
        "affiliation_text_1": "Grande Oriente do Brasil",
        "session_title": "Sessão Ordinária",
        "current_date_day": "04",
        "current_date_month": "Dezembro",
        "current_date_year": "2025",
        "lodge_city": "São Paulo",
        "lodge_address": "Rua Teste, 123",
        "veneravel_mestre_name": "Fulano",
        "primeiro_vigilante_name": "Beltrano",
        "segundo_vigilante_name": "Ciclano",
        "orador_name": "Orador",
        "secretario_name": "Secretario",
        "tesoureiro_name": "Tesoureiro",
        "chanceler_name": "Chanceler",
        "study_director_name": "Diretor",
        "session_end_time_formatted": "22:00",
        "custom_content": {"text": "<p>Texto customizado de teste.</p>"}
    }

    # 3. Render Template
    try:
        html_content = template.render(data)
        print("HTML renderizado com sucesso.")
    except Exception as e:
        print(f"Erro ao renderizar HTML: {e}")
        return

    # 4. Generate PDF
    pdf_buffer = BytesIO()
    
    def link_callback(uri, rel):
        return uri

    try:
        pisa_status = pisa.CreatePDF(
            html_content,
            dest=pdf_buffer,
            link_callback=link_callback
        )
        
        if pisa_status.err:
            print(f"Erro no xhtml2pdf: {pisa_status.err}")
        else:
            print("PDF gerado com sucesso! Tamanho:", len(pdf_buffer.getvalue()), "bytes")
            
    except Exception as e:
        print(f"Exceção ao gerar PDF: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_pdf_generation()
