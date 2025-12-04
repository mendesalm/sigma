import pytest
from datetime import date, datetime, time, timedelta
from unittest.mock import MagicMock, patch
from fastapi import HTTPException

from models import models
from services import session_service

# ============================================================================
# Fixtures Específicas
# ============================================================================

@pytest.fixture
def active_session(db_session, sample_lodge):
    """Cria uma sessão maçônica ativa para testes."""
    # Define coordenadas da loja para teste de geofence
    sample_lodge.latitude = -15.7942
    sample_lodge.longitude = -47.8822
    sample_lodge.geofence_radius = 500 # 500 metros
    db_session.commit()

    session = models.MasonicSession(
        lodge_id=sample_lodge.id,
        title="Sessão de Teste",
        session_date=date.today(),
        start_time=time(20, 0),
        status="EM_ANDAMENTO",
    )
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)
    return session

# ============================================================================
# Testes Unitários: session_service
# ============================================================================

def test_find_nearest_active_session_success(db_session, active_session):
    """Testa se encontra a sessão ativa próxima corretamente."""
    # Coordenadas muito próximas da loja (-15.7942, -47.8822)
    user_lat = -15.7943
    user_lon = -47.8823
    
    nearest = session_service.find_nearest_active_session(db_session, user_lat, user_lon)
    
    assert nearest is not None
    assert nearest.id == active_session.id
    assert nearest.lodge_id == active_session.lodge_id

def test_find_nearest_active_session_too_far(db_session, active_session):
    """Testa se ignora sessão ativa fora do raio."""
    # Coordenadas distantes (> 500m)
    user_lat = -15.8000
    user_lon = -47.9000
    
    nearest = session_service.find_nearest_active_session(db_session, user_lat, user_lon)
    
    assert nearest is None

def test_perform_visitor_check_in_success(db_session, active_session):
    """Testa o fluxo de check-in de visitante com sucesso."""
    user_lat = -15.7943
    user_lon = -47.8823
    
    # Cria um Visitor local
    visitor = models.Visitor(
        full_name="Visitante Teste",
        cim="999888",
        degree="Mestre"
    )
    db_session.add(visitor)
    db_session.commit()
    db_session.refresh(visitor)
    
    attendance = session_service.perform_visitor_check_in(
        db_session, 
        active_session.id, 
        visitor.id, 
        user_lat, 
        user_lon
    )
    
    assert attendance is not None
    assert attendance.session_id == active_session.id
    assert attendance.attendance_status == "Presente"
    assert attendance.check_in_method == "APP_VISITOR"
    assert attendance.visitor_id == visitor.id

def test_perform_visitor_check_in_invalid_session(db_session):
    """Testa erro ao tentar check-in em sessão inexistente."""
    with pytest.raises(HTTPException) as excinfo:
        session_service.perform_visitor_check_in(
            db_session, 
            99999, # ID inexistente
            1, # visitor_id
            0, 0
        )
    assert excinfo.value.status_code == 404

def test_perform_visitor_check_in_geofence_fail(db_session, active_session):
    """Testa erro de geofence no check-in."""
    user_lat = -15.8000 # Longe
    user_lon = -47.9000
    
    # Cria um Visitor local
    visitor = models.Visitor(
        full_name="Visitante Teste",
        cim="999888",
        degree="Mestre"
    )
    db_session.add(visitor)
    db_session.commit()
    
    with pytest.raises(HTTPException) as excinfo:
        session_service.perform_visitor_check_in(
            db_session, 
            active_session.id, 
            visitor.id, 
            user_lat, 
            user_lon
        )
    assert excinfo.value.status_code == 400
    assert "fora do raio" in str(excinfo.value.detail)

# ============================================================================
# Testes de Integração (API)
# ============================================================================

def test_api_nearest_active_session(client, db_session, active_session):
    """Testa endpoint GET /masonic-sessions/nearest-active."""
    response = client.get(
        "/masonic-sessions/nearest-active",
        params={"latitude": -15.7943, "longitude": -47.8823}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == active_session.id

def test_api_visitor_check_in(client, db_session, active_session):
    """Testa endpoint POST /masonic-sessions/{id}/visitor-check-in."""
    visitor_id = 123
    
    # Mock do serviço para não depender do banco global e lógica complexa no teste de rota
    with patch('services.session_service.perform_visitor_check_in') as mock_perform:
        mock_perform.return_value = MagicMock(
            id=1, 
            session_id=active_session.id,
            attendance_status="Presente",
            member_id=None,
            visitor_id=visitor_id,
            check_in_datetime=datetime.now(),
            check_in_method="APP_VISITOR",
            check_in_latitude=-15.7943,
            check_in_longitude=-47.8823
        )
        # Ensure the mock object behaves like a Pydantic model or dict if needed by FastAPI response validation
        # But since we are mocking the service return, FastAPI will try to validate this object against the response model.
        # MagicMock might fail validation if attributes are accessed in a specific way.
        # Let's try to return a real object or a dict that matches the schema.
        
        class MockAttendance:
            def __init__(self):
                self.id = 1
                self.session_id = active_session.id
                self.attendance_status = "Presente"
                self.member_id = None
                self.visitor_id = visitor_id
                self.check_in_datetime = datetime.now()
                self.check_in_method = "APP_VISITOR"
                self.check_in_latitude = -15.7943
                self.check_in_longitude = -47.8823
                self.member = None
                self.visitor = None

        mock_perform.return_value = MockAttendance()
        
        response = client.post(
            f"/masonic-sessions/{active_session.id}/visitor-check-in",
            json={
                "visitor_id": visitor_id,
                "latitude": -15.7943,
                "longitude": -47.8823
            }
        )
        
        assert response.status_code == 200
        # O schema de resposta mudou? SessionAttendanceResponse.
        # O endpoint retorna SessionAttendanceResponse.
        # Vamos assumir que o mock retorna algo compatível.
        mock_perform.assert_called_once()
