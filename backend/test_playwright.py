import asyncio
from playwright.async_api import async_playwright
import sys

# Force the policy for this test script
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

async def main():
    print("Iniciando teste do Playwright...")
    try:
        async with async_playwright() as p:
            print("Playwright iniciado.")
            browser = await p.chromium.launch()
            print("Browser lançado.")
            page = await browser.new_page()
            await page.set_content("<h1>Teste de PDF</h1>")
            pdf = await page.pdf(format="A4")
            print(f"PDF gerado com sucesso! Tamanho: {len(pdf)} bytes")
            await browser.close()
            print("Browser fechado.")
    except Exception as e:
        print(f"ERRO: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
