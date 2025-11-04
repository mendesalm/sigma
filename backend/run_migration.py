from alembic.config import Config
from alembic import command

def run_upgrade():
    # Cria um objeto de configuração do Alembic
    alembic_cfg = Config("alembic.ini")
    print("Running Alembic upgrade to head...")
    try:
        command.upgrade(alembic_cfg, "head")
        print("Migration successful!")
    except Exception as e:
        print(f"An error occurred during migration: {e}")

if __name__ == "__main__":
    run_upgrade()
