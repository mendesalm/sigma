from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.models import Permission, Base
from database import DATABASE_URL

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def seed_permissions():
    permissions = [
        # Gestão de Membros
        {"action": "membro:criar", "min_credential": 50, "description": "Criar novos membros"},
        {"action": "membro:editar", "min_credential": 50, "description": "Editar dados de membros"},
        {"action": "membro:visualizar", "min_credential": 10, "description": "Visualizar lista de membros"},
        {"action": "membro:excluir", "min_credential": 90, "description": "Excluir membros"},
        
        # Gestão Financeira
        {"action": "financeiro:visualizar", "min_credential": 50, "description": "Visualizar dados financeiros"},
        {"action": "financeiro:criar_lancamento", "min_credential": 60, "description": "Criar lançamentos financeiros"},
        {"action": "financeiro:editar_lancamento", "min_credential": 70, "description": "Editar lançamentos financeiros"},
        
        # Gestão de Sessões/Atas
        {"action": "sessao:criar", "min_credential": 60, "description": "Criar novas sessões"},
        {"action": "ata:criar", "min_credential": 60, "description": "Criar e editar atas"},
        {"action": "ata:visualizar", "min_credential": 10, "description": "Visualizar atas"},
        
        # Gestão de Cargos
        {"action": "cargo:atribuir", "min_credential": 80, "description": "Atribuir cargos a membros"},
    ]

    print("Seeding permissions...")
    for perm_data in permissions:
        existing = db.query(Permission).filter(Permission.action == perm_data["action"]).first()
        if not existing:
            perm = Permission(**perm_data)
            db.add(perm)
            print(f"Created permission: {perm_data['action']}")
        else:
            print(f"Permission already exists: {perm_data['action']}")
    
    db.commit()
    print("Permissions seeded successfully.")

if __name__ == "__main__":
    seed_permissions()
    db.close()
