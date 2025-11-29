import pytest
from fastapi import status

@pytest.mark.integration
def test_create_role_success(client, super_admin_token, sample_permission):
    """Testa criação de cargo com sucesso por super admin."""
    response = client.post(
        "/roles/",
        json={
            "name": "Secretário de Loja",
            "role_type": "Loja",
            "level": 3,
            "base_credential": 50,
            "permission_ids": [sample_permission.id]
        },
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    if response.status_code != status.HTTP_201_CREATED:
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == "Secretário de Loja"
    assert data["role_type"] == "Loja"
    assert len(data["permissions"]) == 1
    assert data["permissions"][0]["id"] == sample_permission.id

@pytest.mark.integration
def test_create_role_duplicate(client, super_admin_token, sample_role):
    """Testa falha ao criar cargo com nome duplicado."""
    response = client.post(
        "/roles/",
        json={
            "name": sample_role.name,  # Nome já existente
            "role_type": "Loja",
            "level": 1,
            "base_credential": 10
        },
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    if response.status_code != status.HTTP_400_BAD_REQUEST:
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Role name already exists" in response.json()["detail"]

@pytest.mark.integration
def test_read_roles(client, webmaster_token, sample_role):
    """Testa listagem de cargos (acessível a usuários autenticados)."""
    response = client.get(
        "/roles/",
        headers={"Authorization": f"Bearer {webmaster_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    names = [r["name"] for r in data]
    assert sample_role.name in names

@pytest.mark.integration
def test_read_role_details(client, webmaster_token, sample_role):
    """Testa leitura de detalhes de um cargo."""
    response = client.get(
        f"/roles/{sample_role.id}",
        headers={"Authorization": f"Bearer {webmaster_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == sample_role.id
    assert data["name"] == sample_role.name

@pytest.mark.integration
def test_update_role(client, super_admin_token, sample_role):
    """Testa atualização de cargo por super admin."""
    response = client.put(
        f"/roles/{sample_role.id}",
        json={
            "level": 5,
            "base_credential": 200
        },
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["level"] == 5
    assert data["base_credential"] == 200
    # Nome não deve mudar
    assert data["name"] == sample_role.name

@pytest.mark.integration
def test_delete_role(client, super_admin_token, sample_role):
    """Testa exclusão de cargo por super admin."""
    # Atenção: sample_role pode estar sendo usado em outros testes ou fixtures (como sample_member_role).
    # Se deletarmos, pode quebrar integridade referencial se não houver cascade ou se houver registros dependentes.
    # O sample_role criado na fixture é "Venerável Mestre de Teste".
    # Vamos criar um cargo descartável para este teste.
    
    # Criar cargo temporário
    create_response = client.post(
        "/roles/",
        json={
            "name": "Cargo Temporário",
            "role_type": "Loja",
            "level": 1,
            "base_credential": 10
        },
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    role_id = create_response.json()["id"]
    
    # Deletar
    response = client.delete(
        f"/roles/{role_id}",
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    
    # Verificar se foi deletado
    get_response = client.get(
        f"/roles/{role_id}",
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    assert get_response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.integration
def test_create_role_unauthorized(client, webmaster_token):
    """Testa tentativa de criar cargo por usuário não autorizado (webmaster)."""
    response = client.post(
        "/roles/",
        json={
            "name": "Cargo Hacker",
            "role_type": "Loja",
            "level": 9,
            "base_credential": 999
        },
        headers={"Authorization": f"Bearer {webmaster_token}"}
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
