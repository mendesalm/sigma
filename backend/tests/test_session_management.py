import sys
import os
import pytest
from datetime import date, time, timedelta

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import app
from main import app
from models.models import SessionTypeEnum, SessionSubtypeEnum, MasonicSession, Lodge, Obedience, ObedienceTypeEnum
from dependencies import get_current_user_payload

# Mock get_db dependency
def get_db():
    pass # Replaced by override

# Setup Test Database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

def override_get_current_user_payload():
    return {"sub": "testuser", "user_type": "webmaster", "lodge_id": 1}

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user_payload] = override_get_current_user_payload

client = TestClient(app)

@pytest.fixture(scope="module")
def setup_database():
    from models.models import Base
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Create Obedience
    obedience = Obedience(
        name="Grande Oriente Teste",
        type=ObedienceTypeEnum.STATE,
        technical_contact_name="Tech Contact",
        technical_contact_email="tech@test.com"
    )
    db.add(obedience)
    db.commit()
    
    # Create Lodge
    lodge = Lodge(
        lodge_name="Loja Teste",
        lodge_code="lodge_test_001",
        obedience_id=obedience.id,
        technical_contact_name="Tech Contact",
        technical_contact_email="tech@test.com"
    )
    db.add(lodge)
    db.commit()
    
    yield db
    
    Base.metadata.drop_all(bind=engine)

import random
def test_create_session_valid_hierarchy(setup_database):
    print("DEBUG: Calling client.post for valid hierarchy")
    random_days = random.randint(10, 100)
    response = client.post(
        "/masonic-sessions/",
        json={
            "title": "Sessão Magna de Iniciação",
            "session_date": str(date.today() + timedelta(days=random_days)),
            "start_time": "20:00:00",
            "end_time": "22:00:00",
            "type": SessionTypeEnum.MAGNA,
            "subtype": SessionSubtypeEnum.INITIATION
        }
    )
    if response.status_code != 201:
        print(f"Response: {response.json()}")
    assert response.status_code == 201
    data = response.json()
    assert data["type"] == SessionTypeEnum.MAGNA
    assert data["subtype"] == SessionSubtypeEnum.INITIATION

def test_create_session_invalid_hierarchy(setup_database):
    random_days = random.randint(101, 200)
    response = client.post(
        "/masonic-sessions/",
        json={
            "title": "Sessão Inválida",
            "session_date": str(date.today() + timedelta(days=random_days)),
            "start_time": "20:00:00",
            "end_time": "22:00:00",
            "type": SessionTypeEnum.ORDINARY,
            "subtype": SessionSubtypeEnum.INITIATION # Inválido para Ordinária
        }
    )
    assert response.status_code == 422 # Validation Error

def test_create_session_missing_subtype(setup_database):
    random_days = random.randint(201, 300)
    response = client.post(
        "/masonic-sessions/",
        json={
            "title": "Sessão Sem Subtipo",
            "session_date": str(date.today() + timedelta(days=random_days)),
            "start_time": "20:00:00",
            "end_time": "22:00:00",
            "type": SessionTypeEnum.ORDINARY
            # Subtype missing
        }
    )
    # Subtype is optional in schema but logically should be consistent if provided.
    # If not provided, it's valid but incomplete data. Ideally we might want to enforce it.
    # For now, let's check if it accepts (since schema has Optional)
    assert response.status_code == 201 

def test_list_sessions_filter(setup_database):
    # Create another session to list
    random_days = random.randint(301, 400)
    client.post(
        "/masonic-sessions/",
        json={
            "title": "Sessão Ordinária Regular",
            "session_date": str(date.today() + timedelta(days=random_days)),
            "start_time": "20:00:00",
            "end_time": "22:00:00",
            "type": SessionTypeEnum.ORDINARY,
            "subtype": SessionSubtypeEnum.REGULAR
        }
    )
    
    response = client.get("/masonic-sessions/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    
    # Verify types are returned
    assert any(s["type"] == SessionTypeEnum.ORDINARY for s in data)
    assert any(s["type"] == SessionTypeEnum.MAGNA for s in data)

if __name__ == "__main__":
    # Manually run tests if executed as script
    if os.path.exists("test_session.db"):
        os.remove("test_session.db")
    try:
        # Setup
        # Setup
        # We need to manually invoke the fixture logic here for the script run
        from models.models import Base
        Base.metadata.create_all(bind=engine)
        db = TestingSessionLocal()
        
        # Create Obedience
        obedience = Obedience(
            name="Grande Oriente Teste",
            type=ObedienceTypeEnum.STATE,
            technical_contact_name="Tech Contact",
            technical_contact_email="tech@test.com"
        )
        db.add(obedience)
        db.commit()
        
        # Create Lodge
        lodge = Lodge(
            lodge_name="Loja Teste",
            lodge_code="lodge_test_001",
            obedience_id=obedience.id,
            technical_contact_name="Tech Contact",
            technical_contact_email="tech@test.com"
        )
        db.add(lodge)
        db.commit()

        # We pass 'db' or 'None' because the tests use 'client' which uses dependency override.
        # The 'setup_database' argument in tests is just to ensure setup runs.
        # So we can pass None.
        
        print("Running test_create_session_valid_hierarchy...")
        test_create_session_valid_hierarchy(None)
        print("PASS")
        
        print("Running test_create_session_invalid_hierarchy...")
        test_create_session_invalid_hierarchy(None)
        print("PASS")
        
        print("Running test_create_session_missing_subtype...")
        test_create_session_missing_subtype(None)
        print("PASS")
        
        print("Running test_list_sessions_filter...")
        test_list_sessions_filter(None)
        print("PASS")
        
        # Teardown
        db.close()
        Base.metadata.drop_all(bind=engine)
            
    except Exception as e:
        print(f"FAILED: {e}")
        import traceback
        traceback.print_exc()
