import pytest
from fastapi import status

@pytest.mark.integration
def test_create_permission_success(client, super_admin_token):
    """Testa criação de permissão com sucesso por super admin."""
    response = client.post(
        "/permissions/",
        json={
            "action": "members:create",
            "description": "Permite criar membros",
            "min_credential": 50
        },
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    if response.status_code != status.HTTP_201_CREATED:
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["action"] == "members:create"
    assert data["min_credential"] == 50

@pytest.mark.integration
def test_create_permission_duplicate(client, super_admin_token, sample_permission):
    """Testa falha ao criar permissão com action duplicada."""
    response = client.post(
        "/permissions/",
        json={
            "action": sample_permission.action,
            "description": "Outra descrição",
            "min_credential": 100
        },
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    if response.status_code != status.HTTP_400_BAD_REQUEST:
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Permission action already exists" in response.json()["detail"]

@pytest.mark.integration
def test_read_permissions(client, super_admin_token, sample_permission):
    """Testa listagem de permissões (apenas super admin)."""
    response = client.get(
        "/permissions/",
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    actions = [p["action"] for p in data]
    assert sample_permission.action in actions

@pytest.mark.integration
def test_read_permission_details(client, super_admin_token, sample_permission):
    """Testa leitura de detalhes de uma permissão."""
    response = client.get(
        f"/permissions/{sample_permission.id}",
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == sample_permission.id
    assert data["action"] == sample_permission.action

@pytest.mark.integration
def test_update_permission(client, super_admin_token, sample_permission):
    """Testa atualização de permissão."""
    response = client.put(
        f"/permissions/{sample_permission.id}",
        json={
            "description": "Descrição atualizada"
        },
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["description"] == "Descrição atualizada"
    # Action não deve mudar se não enviada
    assert data["action"] == sample_permission.action

@pytest.mark.integration
def test_delete_permission(client, super_admin_token, sample_permission):
    """Testa exclusão de permissão."""
    response = client.delete(
        f"/permissions/{sample_permission.id}",
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    
    # Verificar se foi deletado
    get_response = client.get(
        f"/permissions/{sample_permission.id}",
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    assert get_response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.integration
def test_create_permission_unauthorized(client):
    """Testa tentativa de criar permissão sem autenticação."""
    response = client.post(
        "/permissions/",
        json={
            "action": "hacker:action",
            "description": "Hacker",
            "min_credential": 0
        }
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
