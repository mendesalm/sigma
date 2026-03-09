import csv
import datetime
import os

from dotenv import load_dotenv
from sqlalchemy import MetaData, create_engine

# Caminho para o .env na raiz do projeto
# O script ficará em backend/scripts/backup_db.py
dotenv_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
load_dotenv(dotenv_path=dotenv_path)

DATABASE_URL = os.getenv("DATABASE_URL")
ORIENTE_DB_URL = os.getenv("ORIENTE_DB_URL")

# Diretório para salvar os backups na raiz do projeto
BACKUP_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "backups")
os.makedirs(BACKUP_DIR, exist_ok=True)


def backup_database(url, db_name):
    if not url:
        print(f"URL não encontrada para {db_name}. Pulando backup deste banco.")
        return

    try:
        engine = create_engine(url)
        meta = MetaData()
        meta.reflect(bind=engine)

        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        db_backup_dir = os.path.join(BACKUP_DIR, f"{db_name}_{timestamp}")
        os.makedirs(db_backup_dir, exist_ok=True)

        print(f"Iniciando backup para {db_name}...")

        with engine.connect() as conn:
            for table in meta.sorted_tables:
                table_name = table.name
                print(f"  Exportando tabela: {table_name}...")
                result = conn.execute(table.select())

                csv_path = os.path.join(db_backup_dir, f"{table_name}.csv")
                with open(csv_path, "w", newline="", encoding="utf-8") as f:
                    writer = csv.writer(f)
                    writer.writerow(result.keys())
                    for row in result:
                        writer.writerow(row)

        print(f"Backup de {db_name} concluído com sucesso em: {os.path.abspath(db_backup_dir)}\n")
    except Exception as e:
        print(f"Falha ao realizar backup de {db_name}. Erro: {e}\n")


if __name__ == "__main__":
    print(f"Diretório base para backups: {os.path.abspath(BACKUP_DIR)}\n")
    backup_database(DATABASE_URL, "sigma_db")
    backup_database(ORIENTE_DB_URL, "oriente_data")
