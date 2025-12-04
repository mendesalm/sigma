import asyncio
import os
from playwright.async_api import async_playwright

async def generate_pdf():
    # Caminho para o arquivo HTML de debug
    html_path = os.path.join(os.path.dirname(__file__), "debug_balaustre.html")
    output_path = os.path.join(os.path.dirname(__file__), "test_playwright.pdf")

    if not os.path.exists(html_path):
        print(f"Arquivo não encontrado: {html_path}")
        return

    print(f"Lendo HTML de: {html_path}")
    # Ler o conteúdo HTML (opcional, pois podemos carregar o arquivo diretamente)
    # Mas para simular o serviço, vamos ler e passar como string ou carregar via file://
    
    # Vamos usar o protocolo file:// para carregar o arquivo local, 
    # isso ajuda a resolver caminhos relativos de imagens/css se estiverem corretos no HTML
    file_url = f"file:///{html_path.replace(os.sep, '/')}"

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        print(f"Navegando para: {file_url}")
        await page.goto(file_url, wait_until="networkidle")
        
        # Opções de PDF
        # format="A4" é padrão, mas podemos ajustar margens
        print("Gerando PDF...")
        await page.pdf(path=output_path, format="A4", print_background=True, margin={
            "top": "2cm",
            "bottom": "2cm",
            "left": "2cm",
            "right": "2cm"
        })
        
        await browser.close()
        print(f"PDF gerado com sucesso em: {output_path}")

if __name__ == "__main__":
    asyncio.run(generate_pdf())
