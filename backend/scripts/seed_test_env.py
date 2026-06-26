import sys
import os
import random
from datetime import date, timedelta
from faker import Faker

# Add backend directory to sys.path to allow imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database import SessionLocal
from models.models import (
    Obedience, ObedienceTypeEnum, Lodge, Member, MemberObedienceAssociation, MemberLodgeAssociation,
    RegistrationStatusEnum, MemberStatusEnum, MemberClassEnum, Role, RoleTypeEnum, Webmaster
)
import uuid
from sqlalchemy import text
from app.modules.access_control.utils.password_utils import hash_password

fake = Faker('pt_BR')

def clear_test_data(db):
    print("Limpando dados de teste antigos...")
    # Find test obediences
    test_obediences = db.query(Obedience).filter(Obedience.name.ilike('%[TESTE]%')).all()
    test_ob_ids = [ob.id for ob in test_obediences]
    
    if not test_ob_ids:
        print("Nenhum dado de teste antigo encontrado.")
        return

    # Find test lodges
    test_lodges = db.query(Lodge).filter(Lodge.obedience_id.in_(test_ob_ids)).all()
    test_lodge_ids = [lg.id for lg in test_lodges]
    
    # Delete MemberLodgeAssociations
    db.query(MemberLodgeAssociation).filter(MemberLodgeAssociation.lodge_id.in_(test_lodge_ids)).delete(synchronize_session=False)
    
    # Delete MemberObedienceAssociations
    db.query(MemberObedienceAssociation).filter(MemberObedienceAssociation.obedience_id.in_(test_ob_ids)).delete(synchronize_session=False)
    
    # Delete Webmasters
    db.query(Webmaster).filter(Webmaster.lodge_id.in_(test_lodge_ids)).delete(synchronize_session=False)
    
    # Delete Members whose names start with [TESTE]
    db.query(Member).filter(Member.full_name.ilike('%[TESTE]%')).delete(synchronize_session=False)
    
    # Delete Lodges
    db.query(Lodge).filter(Lodge.id.in_(test_lodge_ids)).delete(synchronize_session=False)
    
    # Delete Obediences
    db.query(Obedience).filter(Obedience.id.in_(test_ob_ids)).delete(synchronize_session=False)
    
    db.commit()
    # Fix sequences
    try:
        db.execute(text("SELECT setval('lodges_id_seq', COALESCE((SELECT MAX(id) FROM lodges), 1))"))
        db.execute(text("SELECT setval('obediences_id_seq', COALESCE((SELECT MAX(id) FROM obediences), 1))"))
        db.execute(text("SELECT setval('members_id_seq', COALESCE((SELECT MAX(id) FROM members), 1))"))
        db.execute(text("SELECT setval('member_lodge_associations_id_seq', COALESCE((SELECT MAX(id) FROM member_lodge_associations), 1))"))
        db.execute(text("SELECT setval('member_obedience_associations_id_seq', COALESCE((SELECT MAX(id) FROM member_obedience_associations), 1))"))
        db.execute(text("SELECT setval('webmasters_id_seq', COALESCE((SELECT MAX(id) FROM webmasters), 1))"))
        db.commit()
    except Exception as e:
        db.rollback()
        print("Aviso: Falha ao corrigir sequences (pode ser SQLite):", e)

    print("Dados de teste antigos removidos e sequences sincronizadas.")

def get_or_create_member_role(db):
    return 1

def seed():
    db = SessionLocal()
    try:
        clear_test_data(db)
        
        member_role_id = get_or_create_member_role(db)

        print("Criando Potências de Teste...")
        # 1. Potência 1: GL
        gl = Obedience(
            name="[TESTE] Grande Loja",
            type=ObedienceTypeEnum.FEDERAL,
            website="https://gl-teste.com",
            technical_contact_name="Admin Teste GL",
            technical_contact_email="admin.gl@teste.com"
        )
        db.add(gl)
        
        # 2. Potência 2: GO (Parent)
        go = Obedience(
            name="[TESTE] Grande Oriente",
            type=ObedienceTypeEnum.FEDERAL,
            website="https://go-teste.com",
            technical_contact_name="Admin Teste GO",
            technical_contact_email="admin.go@teste.com"
        )
        db.add(go)
        db.commit()
        
        # Subpotência 2.1: GOE (Child of GO)
        goe = Obedience(
            name="[TESTE] Grande Oriente Estadual",
            type=ObedienceTypeEnum.STATE,
            parent_obedience_id=go.id,
            technical_contact_name="Admin Teste GOE",
            technical_contact_email="admin.goe@teste.com"
        )
        db.add(goe)
        
        # Subpotência 2.2: GOE Y (Child of GO)
        goe_y = Obedience(
            name="[TESTE] Grande Oriente Estadual Y",
            type=ObedienceTypeEnum.STATE,
            parent_obedience_id=go.id,
            technical_contact_name="Admin Teste GOE Y",
            technical_contact_email="admin.goey@teste.com"
        )
        db.add(goe_y)
        db.commit()

        print("Criando Lojas de Teste...")
        loja_a = Lodge(lodge_name="[TESTE] Loja A", lodge_number=1001, obedience_id=gl.id, lodge_code=str(uuid.uuid4()), technical_contact_name="Admin A", technical_contact_email="a@teste.com")
        loja_b = Lodge(lodge_name="[TESTE] Loja B", lodge_number=1002, obedience_id=gl.id, lodge_code=str(uuid.uuid4()), technical_contact_name="Admin B", technical_contact_email="b@teste.com")
        
        loja_c = Lodge(lodge_name="[TESTE] Loja C", lodge_number=2001, obedience_id=goe.id, lodge_code=str(uuid.uuid4()), technical_contact_name="Admin C", technical_contact_email="c@teste.com")
        loja_d = Lodge(lodge_name="[TESTE] Loja D", lodge_number=2002, obedience_id=goe.id, lodge_code=str(uuid.uuid4()), technical_contact_name="Admin D", technical_contact_email="d@teste.com")
        
        loja_e = Lodge(lodge_name="[TESTE] Loja E", lodge_number=3001, obedience_id=goe_y.id, lodge_code=str(uuid.uuid4()), technical_contact_name="Admin E", technical_contact_email="e@teste.com")
        loja_f = Lodge(lodge_name="[TESTE] Loja F", lodge_number=3002, obedience_id=goe_y.id, lodge_code=str(uuid.uuid4()), technical_contact_name="Admin F", technical_contact_email="f@teste.com")
        
        db.add_all([loja_a, loja_b, loja_c, loja_d, loja_e, loja_f])
        db.commit()

        password_hash = hash_password("Teste@123")
        
        print("Criando Webmasters...")
        webmasters = [
            Webmaster(username="lojaa", email="lojaA@sigma.local", password_hash=password_hash, lodge_id=loja_a.id),
            Webmaster(username="lojab", email="lojaB@sigma.local", password_hash=password_hash, lodge_id=loja_b.id),
            Webmaster(username="lojac", email="lojaC@sigma.local", password_hash=password_hash, lodge_id=loja_c.id),
            Webmaster(username="lojad", email="lojaD@sigma.local", password_hash=password_hash, lodge_id=loja_d.id),
            Webmaster(username="lojae", email="lojaE@sigma.local", password_hash=password_hash, lodge_id=loja_e.id),
            Webmaster(username="lojaf", email="lojaF@sigma.local", password_hash=password_hash, lodge_id=loja_f.id),
        ]
        db.add_all(webmasters)
        db.commit()

        print("Criando Membros (100 no total) com colisões de CIM...")
        
        def create_members_for_lodge(lodge, obedience_id, start_cim, end_cim):
            for i in range(start_cim, end_cim + 1):
                cim_str = f"{i:03d}"
                full_name = f"[TESTE] {fake.name()}"
                email = f"teste.{lodge.id}.{i}@sigma.local"
                
                member = Member(
                    full_name=full_name,
                    email=email,
                    cim=cim_str,
                    password_hash=password_hash,
                    birth_date=fake.date_of_birth(minimum_age=21, maximum_age=80),
                    registration_status=RegistrationStatusEnum.APPROVED
                )
                db.add(member)
                db.flush() # To get member.id
                
                # Link to Obedience
                moa = MemberObedienceAssociation(
                    member_id=member.id,
                    obedience_id=obedience_id,
                    role_id=member_role_id,
                    start_date=date.today() - timedelta(days=random.randint(100, 1000))
                )
                db.add(moa)
                
                # Link to Lodge
                mla = MemberLodgeAssociation(
                    member_id=member.id,
                    lodge_id=lodge.id,
                    status=MemberStatusEnum.ACTIVE,
                    member_class=MemberClassEnum.REGULAR,
                    start_date=date.today() - timedelta(days=random.randint(10, 100))
                )
                db.add(mla)
        
        # Create Members for GL
        create_members_for_lodge(loja_a, gl.id, 1, 25)
        create_members_for_lodge(loja_b, gl.id, 26, 50)
        
        # Create Members for GOE
        create_members_for_lodge(loja_c, goe.id, 1, 25)
        create_members_for_lodge(loja_d, goe.id, 26, 50)
        
        # Create Members for GOE Y
        create_members_for_lodge(loja_e, goe_y.id, 51, 62)
        create_members_for_lodge(loja_f, goe_y.id, 63, 75)
        
        # Create a hybrid user with associations in both GL and GOE for 2-step testing
        hybrid_member = Member(
            full_name="[TESTE] Híbrido Master",
            email="hibrido@sigma.local",
            cim="999",
            password_hash=password_hash,
            birth_date=date(1980, 1, 1),
            registration_status=RegistrationStatusEnum.APPROVED
        )
        db.add(hybrid_member)
        db.flush()
        
        # Association 1: GL
        db.add(MemberObedienceAssociation(member_id=hybrid_member.id, obedience_id=gl.id, role_id=member_role_id, start_date=date(2020, 1, 1)))
        db.add(MemberLodgeAssociation(member_id=hybrid_member.id, lodge_id=loja_a.id, status=MemberStatusEnum.ACTIVE, member_class=MemberClassEnum.REGULAR, start_date=date(2020, 1, 1)))
        
        # Association 2: Loja B (Same Obedience GL)
        db.add(MemberLodgeAssociation(member_id=hybrid_member.id, lodge_id=loja_b.id, status=MemberStatusEnum.ACTIVE, member_class=MemberClassEnum.HONORARY, start_date=date(2021, 1, 1)))

        db.commit()
        print("Ambiente de testes populado com sucesso!")
        print("--------------------------------------------------")
        print("Usuários para teste:")
        print("Loja A (GL): CIMs 001 a 025")
        print("Loja B (GL): CIMs 026 a 050")
        print("Loja C (GOE): CIMs 001 a 025 (Mesmos CIMs da Loja A!)")
        print("Loja D (GOE): CIMs 026 a 050 (Mesmos CIMs da Loja B!)")
        print("Loja E (GOE Y): CIMs 051 a 062")
        print("Loja F (GOE Y): CIMs 063 a 075")
        print("Usuário Híbrido: CIM 999 (Vinculado a Loja A e Loja B - Mesma Potência)")
        print("Webmasters: lojaA@sigma.local até lojaF@sigma.local")
        print("Senha universal: Teste@123")
        print("--------------------------------------------------")

    except Exception as e:
        db.rollback()
        print(f"Erro ao popular banco de dados: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
