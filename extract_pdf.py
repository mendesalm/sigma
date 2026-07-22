import os
import pdfplumber

def extract_pdfs():
    base_dir = "backend/storage"
    found_count = 0
    with open("pdf_analysis.txt", "w", encoding="utf-8") as out:
        for root, dirs, files in os.walk(base_dir):
            for file in files:
                if file.endswith(".pdf"):
                    path = os.path.join(root, file)
                    try:
                        with pdfplumber.open(path) as pdf:
                            if len(pdf.pages) > 0:
                                text = pdf.pages[0].extract_text()
                                if text and ("CPF" in text or "RG" in text or "CIM" in text):
                                    out.write(f"--- MATCH IN {path} ---\n")
                                    out.write(text)
                                    out.write("\n\n")
                                    found_count += 1
                                    if found_count > 2:
                                        return
                    except Exception as e:
                        pass

if __name__ == "__main__":
    extract_pdfs()
