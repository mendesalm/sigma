import sys
import os
from sqlalchemy import text

# Adiciona o diretório atual ao path para importar módulos
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import oriente_engine

def update_global_db_schema():
    if not oriente_engine:
        print("Erro: ORIENTE_DB_URL não configurada no .env")
        return

    print(f"Conectando ao banco global para atualização de schema...")
    
    try:
        with oriente_engine.connect() as conn:
            # Verifica e adiciona colunas se não existirem
            # MySQL syntax
            alter_commands = [
                "ALTER TABLE global_visitors MODIFY COLUMN origin_lodge_id INTEGER NULL;",
                "ALTER TABLE global_visitors ADD COLUMN IF NOT EXISTS manual_lodge_name VARCHAR(255) NULL;",
                "ALTER TABLE global_visitors ADD COLUMN IF NOT EXISTS manual_lodge_number VARCHAR(50) NULL;",
                "ALTER TABLE global_visitors ADD COLUMN IF NOT EXISTS manual_lodge_obedience VARCHAR(100) NULL;"
            ]
            
            for cmd in alter_commands:
                try:
                    conn.execute(text(cmd))
                    print(f"Executado: {cmd}")
                except Exception as e:
                    print(f"Erro ao executar '{cmd}': {e}")
            
            conn.commit()
            print("Schema atualizado com sucesso.")
            
    except Exception as e:
        print(f"Erro geral na atualização: {e}")

if __name__ == "__main__":
    update_global_db_schema()
