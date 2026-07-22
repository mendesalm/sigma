import os
import pdfplumber

def search_pdfs():
    base_dir = "backend/storage"
    found = False
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith(".pdf"):
                path = os.path.join(root, file)
                try:
                    with pdfplumber.open(path) as pdf:
                        if len(pdf.pages) > 0:
                            text = pdf.pages[0].extract_text()
                            if text and ("CPF" in text or "GOB" in text or "Ficha" in text or "CIM" in text):
                                print(f"Found match in: {path}")
                                print(text[:500])
                                print("-" * 50)
                                found = True
                except Exception as e:
                    pass
    if not found:
        print("No Ficha PDFs found in storage.")

if __name__ == "__main__":
    search_pdfs()
