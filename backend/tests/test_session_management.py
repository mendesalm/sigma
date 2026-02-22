import pytest
from fastapi.testclient import TestClient
from datetime import date, timedelta
from models.models import SessionTypeEnum, SessionSubtypeEnum

def test_create_session_valid_hierarchy(client: TestClient, webmaster_token: str):
    random_days = 20
    response = client.post(
        "/masonic-sessions/",
        headers={"Authorization": f"Bearer {webmaster_token}"},
        json={
            "title": "Sessão Magna de Iniciação",
            "session_date": str(date.today() + timedelta(days=random_days)),
            "start_time": "20:00:00",
            "end_time": "22:00:00",
            "type": SessionTypeEnum.MAGNA,
            "subtype": SessionSubtypeEnum.INITIATION
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["type"] == SessionTypeEnum.MAGNA.value
    assert data["subtype"] == SessionSubtypeEnum.INITIATION.value

def test_create_session_invalid_hierarchy(client: TestClient, webmaster_token: str):
    random_days = 21
    response = client.post(
        "/masonic-sessions/",
        headers={"Authorization": f"Bearer {webmaster_token}"},
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

def test_create_session_missing_subtype(client: TestClient, webmaster_token: str):
    random_days = 22
    response = client.post(
        "/masonic-sessions/",
        headers={"Authorization": f"Bearer {webmaster_token}"},
        json={
            "title": "Sessão Sem Subtipo",
            "session_date": str(date.today() + timedelta(days=random_days)),
            "start_time": "20:00:00",
            "end_time": "22:00:00",
            "type": SessionTypeEnum.ORDINARY
            # Subtype missing
        }
    )
    assert response.status_code == 201 

def test_list_sessions_filter(client: TestClient, webmaster_token: str):
    # Create another session to list
    random_days = 23
    client.post(
        "/masonic-sessions/",
        headers={"Authorization": f"Bearer {webmaster_token}"},
        json={
            "title": "Sessão Ordinária Regular",
            "session_date": str(date.today() + timedelta(days=random_days)),
            "start_time": "20:00:00",
            "end_time": "22:00:00",
            "type": SessionTypeEnum.ORDINARY,
            "subtype": SessionSubtypeEnum.REGULAR
        }
    )
    
    response = client.get(
        "/masonic-sessions/",
        headers={"Authorization": f"Bearer {webmaster_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    
    # Verify types are returned
    assert any(s["type"] == SessionTypeEnum.ORDINARY.value for s in data)
