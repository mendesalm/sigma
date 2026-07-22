import pdfplumber

def read_ficha():
    path = r"C:\Users\engan\OneDrive\Área de Trabalho\sigma\storage\Ficha_CIM_333786.pdf"
    with open("ficha_content.txt", "w", encoding="utf-8") as out:
        try:
            with pdfplumber.open(path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    out.write(text + "\n")
        except Exception as e:
            out.write(f"Error: {e}")

if __name__ == "__main__":
    read_ficha()
