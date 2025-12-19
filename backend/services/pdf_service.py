import asyncio
from playwright.sync_api import sync_playwright

class PdfService:
    def _generate_pdf_sync(self, html_content: str) -> bytes:
        """Synchronous PDF generation to run in a separate thread."""
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            
            # Load HTML content
            page.set_content(html_content, wait_until="networkidle")
            
            # Generate PDF
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

    async def generate_pdf_from_html(self, html_content: str) -> bytes:
        """Converts HTML content to PDF using Playwright (Async wrapper)."""
        return await asyncio.to_thread(self._generate_pdf_sync, html_content)
