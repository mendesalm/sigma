import sys
import os
from decimal import Decimal

# Add the project root to sys.path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from app.modules.cashless.models import (
    CashlessUser, Wallet, CashlessUserTypeEnum, CashlessProfileTypeEnum, Product
)
from app.modules.core.models import Lodge
# Ensure all models are registered in SQLAlchemy metadata before creating tables/sessions
from models import models

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def run_seed():
    db = SessionLocal()
    try:
        print("[SEED] Iniciando Seed do Modulo Cashless...")

        lodge = db.query(Lodge).first()
        if not lodge:
            print("[SEED] Nenhuma Loja encontrada. Por favor, rode o seed principal primeiro.")
            return

        lodge_id = lodge.id

        # 1. Create a Gerente (Manager)
        manager_cim = "GERENTE_001"
        manager = db.query(CashlessUser).filter_by(identification_key=manager_cim).first()
        if not manager:
            manager = CashlessUser(
                name="João Gerente (Teste)",
                identification_key=manager_cim,
                type=CashlessUserTypeEnum.MEMBER,
                profile_type=CashlessProfileTypeEnum.GERENTE,
                pin="$2b$12$eImiTXuWVxfM37uY4JANjQ==.P1xM3z6fT8m9Mv4Gv0qTz9Qe", # Mock hash for '1234'
            )
            db.add(manager)
            db.flush()
            
            manager_wallet = Wallet(cashless_user_id=manager.id, lodge_id=lodge_id, balance=0, allow_negative_balance=False)
            db.add(manager_wallet)
            print("[SEED] Gerente criado: Joao Gerente (PIN: 1234, CIM: GERENTE_001)")

        # 2. Create a Client (External)
        client_cpf = "000.000.000-00"
        client = db.query(CashlessUser).filter_by(identification_key=client_cpf).first()
        if not client:
            client = CashlessUser(
                name="Maria Visitante (Teste)",
                identification_key=client_cpf,
                type=CashlessUserTypeEnum.EXTERNAL,
                profile_type=CashlessProfileTypeEnum.CLIENTE,
                pin=None
            )
            db.add(client)
            db.flush()
            
            client_wallet = Wallet(cashless_user_id=client.id, lodge_id=lodge_id, balance=0, allow_negative_balance=False)
            db.add(client_wallet)
            print("[SEED] Cliente criado: Maria Visitante (CPF: 000.000.000-00)")

        # 3. Create 5 Products
        products_data = [
            {"name": "Cerveja Heineken 330ml", "price": Decimal("12.00"), "cost_price": Decimal("6.00"), "stock": 100, "min_stock": 20, "is_active": True},
            {"name": "Refrigerante Coca-Cola Lata", "price": Decimal("6.00"), "cost_price": Decimal("2.50"), "stock": 150, "min_stock": 30, "is_active": True},
            {"name": "Água Mineral Sem Gás 500ml", "price": Decimal("4.00"), "cost_price": Decimal("1.00"), "stock": 200, "min_stock": 50, "is_active": True},
            {"name": "Porção de Batata Frita", "price": Decimal("25.00"), "cost_price": Decimal("10.00"), "stock": 30, "min_stock": 5, "is_active": True},
            {"name": "Espetinho de Carne", "price": Decimal("15.00"), "cost_price": Decimal("5.00"), "stock": 50, "min_stock": 10, "is_active": True},
        ]
        
        for p_data in products_data:
            existing = db.query(Product).filter_by(name=p_data["name"], lodge_id=lodge_id).first()
            if not existing:
                prod = Product(
                    name=p_data["name"],
                    price=p_data["price"],
                    stock=p_data["stock"],
                    min_stock=p_data["min_stock"],
                    is_active=p_data["is_active"],
                    lodge_id=lodge_id
                )
                db.add(prod)
        print(f"[SEED] {len(products_data)} Produtos criados/verificados.")

        db.commit()
        print("[SEED] Seed finalizado com sucesso!")
        
    except Exception as e:
        db.rollback()
        print(f"[ERRO] Erro durante o seed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
