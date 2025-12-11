from weasyprint import HTML
import sys

def main():
    print("Iniciando teste do WeasyPrint...")
    try:
        html = HTML(string="<h1>Teste WeasyPrint</h1><p>Funciona!</p>")
        pdf = html.write_pdf()
        print(f"PDF gerado com sucesso! Tamanho: {len(pdf)} bytes")
        
        with open("test_weasy.pdf", "wb") as f:
            f.write(pdf)
            
    except Exception as e:
        print(f"ERRO: {e}")
        import traceback
        traceback.print_exc()
        print("\nNOTA: Se o erro for relacionado a 'dlopen' ou 'library not found', provavelmente falta o GTK3.")

if __name__ == "__main__":
    main()
