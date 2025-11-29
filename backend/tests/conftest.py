"""
Configuração do pytest para o backend Sigma.

Este arquivo é executado antes de todos os testes e define fixtures compartilhadas.
"""

import pytest
import sys
from pathlib import Path
from datetime import date, time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Adicionar backend ao path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from main import app
from database import get_db
from models.models import Base, SuperAdmin, Lodge, Member, Obedience
from utils import password_utils


# ============================================================================
# Database Fixtures
# ============================================================================

@pytest.fixture(scope="session")
def test_engine():
    """Cria engine de banco de dados de teste em memória."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(test_engine):
    """
    Cria uma sessão de banco de dados para cada teste.
    
    Rollback automático após cada teste para isolamento.
    """
    connection = test_engine.connect()
    transaction = connection.begin()
    SessionLocal = sessionmaker(bind=connection)
    session = SessionLocal()
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


# ============================================================================
# Client Fixtures
# ============================================================================

@pytest.fixture(scope="function")
def client(db_session):
    """Cliente de teste da API FastAPI."""
    
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    from database import get_db
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


# ============================================================================
# Data Fixtures
# ============================================================================

@pytest.fixture
def sample_obedience(db_session):
    """Cria uma obediência de teste."""
    obedience = Obedience(
        name="Grande Loja Maçônica de Teste",
        acronym="GLMT",
        type="Federal",
        email="contato@glmt.org.br",
        technical_contact_name="Admin Teste",
        technical_contact_email="admin@glmt.org.br"
    )
    db_session.add(obedience)
    db_session.commit()
    db_session.refresh(obedience)
    return obedience


@pytest.fixture
def sample_lodge(db_session, sample_obedience):
    """Cria uma loja de teste."""
    lodge = Lodge(
        lodge_name="Acácia do Cerrado de Teste",
        lodge_number="9999",
        lodge_code="test-lodge-code-123",
        foundation_date=date(2020, 1, 1),
        rite="Rito Escocês Antigo e Aceito",
        obedience_id=sample_obedience.id,
        cnpj="11.222.333/0001-81",
        email="secretaria@teste.com",
        phone="(61) 99999-9999",
        city="Brasília",
        state="DF",
        zip_code="70000-000",
        technical_contact_name="João Silva",
        technical_contact_email="webmaster@teste.com",
        is_active=True
    )
    db_session.add(lodge)
    db_session.commit()
    db_session.refresh(lodge)
    return lodge


@pytest.fixture
def sample_super_admin(db_session):
    """Cria um super admin de teste."""
    admin = SuperAdmin(
        username="admin_test",
        email="admin@test.com",
        password_hash=password_utils.hash_password("TestPassword123")
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture
def sample_member(db_session, sample_lodge):
    """Cria um membro de teste."""
    member = Member(
        full_name="João Pedro Silva",
        email="joao@test.com",
        cpf="123.456.789-09",
        phone="(61) 99999-9999",
        cim="272875",
        birth_date=date(1990, 1, 1),
        degree="Mestre",
        password_hash=password_utils.hash_password("TestPassword123")
    )
    db_session.add(member)
    db_session.commit()
    db_session.refresh(member)

    # Associar à loja
    from models.models import MemberLodgeAssociation
    association = MemberLodgeAssociation(
        member_id=member.id,
        lodge_id=sample_lodge.id,
        start_date=date.today()
    )
    db_session.add(association)
    db_session.commit()
    
    return member


# ============================================================================
# Auth Fixtures
# ============================================================================

@pytest.fixture
def super_admin_token(client, sample_super_admin):
    """
    Gera token de autenticação para super admin.
    
    Usage:
        def test_something(client, super_admin_token):
            response = client.get(
                "/endpoint",
                headers={"Authorization": f"Bearer {super_admin_token}"}
            )
    """
    response = client.post(
        "/auth/login",
        data={
            "username": "admin@test.com",
            "password": "TestPassword123"
        }
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def sample_permission(db_session):
    """Cria uma permissão de teste."""
    from models.models import Permission
    permission = Permission(
        action="test:action",
        description="Permissão de teste",
        min_credential=10
    )
    db_session.add(permission)
    db_session.commit()
    db_session.refresh(permission)
    return permission


@pytest.fixture
def sample_role(db_session):
    """Cria um cargo de teste."""
    from models.models import Role, RoleTypeEnum
    role = Role(
        name="Venerável Mestre de Teste",
        role_type=RoleTypeEnum.LODGE,
        level=1,
        base_credential=100
    )
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role


@pytest.fixture
def sample_webmaster(db_session, sample_lodge):
    """Cria um webmaster de teste."""
    from models.models import Webmaster
    webmaster = Webmaster(
        username="webmaster_test",
        email="webmaster@teste.com",
        password_hash=password_utils.hash_password("WebmasterPassword123"),
        lodge_id=sample_lodge.id
    )
    db_session.add(webmaster)
    db_session.commit()
    db_session.refresh(webmaster)
    return webmaster


@pytest.fixture
def webmaster_token(client, sample_webmaster):
    """Gera token de autenticação para webmaster."""
    response = client.post(
        "/auth/login",
        data={
            "username": "webmaster@teste.com",
            "password": "WebmasterPassword123"
        }
    )
    assert response.status_code == 200
    return response.json()["access_token"]


# ============================================================================
# Markers
# ============================================================================

def pytest_configure(config):
    """Registra markers customizados."""
    config.addinivalue_line(
        "markers", "unit: Tests unitários (fast)"
    )
    config.addinivalue_line(
        "markers", "integration: Tests de integração (slower)"
    )
    config.addinivalue_line(
        "markers", "slow: Tests lentos"
    )
