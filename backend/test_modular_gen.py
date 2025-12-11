import asyncio
import os
import sys

# Adiciona o diretório raiz ao path para importar módulos do backend
sys.path.append(os.path.dirname(__file__))

from services.document_generation_service import DocumentGenerationService
from database import SessionLocal

async def test_modular_generation():
    print("Iniciando teste de geração modular...")
    
    service = DocumentGenerationService(db_session=None)
    
    # Dados fictícios para teste (Mock)
    mock_data = {
        "lodge_name": "Loja Teste Modular",
        "lodge_number": "999",
        "lodge_title_formatted": "A∴R∴L∴S∴",
        "lodge_address": "Rua da Fraternidade, 123 - Oriente de Teste",
        "current_date_day": "11",
        "current_date_month": "dezembro",
        "current_date_year": "2025",
        "session_type": "MAGNA",
        "session_number": "001/2025",
        "Veneravel": "Irmão Venerável",
        "Secretario": "Irmão Secretário",
        "affiliation_text_1": "Federada ao GOB",
        "title": "Balaústre de Teste Modular",
        # Configuração simulada que viria do template
        "config": {
            "styles": {
                "show_border": True,
                "primary_color": "#000080"
            }
        }
    }
    
    try:
        # Tenta renderizar o template modular (balaustre_template.html da pasta model)
        # O serviço deve encontrar automaticamente via "Nível 2" e resolver os componentes
        print("Renderizando template...")
        html_content = service._render_template("balaustre_template.html", mock_data)
        
        print("HTML gerado com sucesso! Salvando debug...")
        with open("debug_modular_test.html", "w", encoding="utf-8") as f:
            f.write(html_content)
            
        print("Gerando PDF...")
        pdf_bytes = await service._generate_pdf_from_html(html_content)
        
        with open("test_modular.pdf", "wb") as f:
            f.write(pdf_bytes)
            
        print(f"Sucesso! PDF salvo em test_modular.pdf ({len(pdf_bytes)} bytes)")
        
    except Exception as e:
        print(f"ERRO: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_modular_generation())
