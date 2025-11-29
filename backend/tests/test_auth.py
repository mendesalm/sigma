import pytest
from fastapi import status

@pytest.mark.integration
def test_login_super_admin_success(client, sample_super_admin):
    """Testa login bem-sucedido de super admin."""
    response = client.post(
        "/auth/login",
        data={
            "username": "admin@test.com",
            "password": "TestPassword123"
        }
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.integration
def test_login_failure(client, sample_super_admin):
    """Testa falha de login com senha incorreta."""
    response = client.post(
        "/auth/login",
        data={
            "username": "admin@test.com",
            "password": "WrongPassword"
        }
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

@pytest.mark.integration
def test_access_protected_route_without_token(client):
    """Testa acesso a rota protegida sem token."""
    response = client.get("/super-admins/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

@pytest.mark.integration
def test_access_protected_route_with_token(client, super_admin_token):
    """Testa acesso a rota protegida com token válido."""
    response = client.get(
        "/super-admins/",
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    # Deve haver pelo menos o super admin criado pela fixture
    assert len(data) >= 1
    assert data[0]["email"] == "admin@test.com"
