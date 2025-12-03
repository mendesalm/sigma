import sys
import os

# Adiciona o diretório atual ao path para importar módulos
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import oriente_engine
from models.global_models import GlobalVisitor

def init_global_db():
    if not oriente_engine:
        print("Erro: ORIENTE_DB_URL não configurada no .env")
        return

    print(f"Conectando ao banco global: {oriente_engine.url}")
    
    # Cria as tabelas no banco global
    # Nota: create_all verifica se a tabela já existe antes de criar
    try:
        GlobalVisitor.metadata.create_all(bind=oriente_engine)
        print("Tabela 'global_visitors' verificada/criada com sucesso no banco oriente_data.")
    except Exception as e:
        print(f"Erro ao criar tabelas no banco global: {e}")

if __name__ == "__main__":
    init_global_db()
