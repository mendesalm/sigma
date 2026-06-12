import pytest
from fastapi import status


@pytest.mark.integration
def test_read_webmasters_success(client, super_admin_token, sample_webmaster):
    """Testa leitura de webmasters (apenas super admin)."""
    response = client.get("/webmasters/", headers={"Authorization": f"Bearer {super_admin_token}"})
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    usernames = [w["username"] for w in data]
    assert sample_webmaster.username in usernames


@pytest.mark.integration
def test_read_webmasters_forbidden(client, webmaster_token):
    """Testa que um webmaster não pode listar outros webmasters."""
    response = client.get("/webmasters/", headers={"Authorization": f"Bearer {webmaster_token}"})
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.integration
def test_read_webmasters_forbidden_member(client, standard_member_token):
    """Testa que um membro comum não pode listar webmasters."""
    response = client.get("/webmasters/", headers={"Authorization": f"Bearer {standard_member_token}"})
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.integration
def test_create_webmaster_success(client, super_admin_token, sample_lodge_2):
    """Testa criação de webmaster com sucesso por super admin."""
    response = client.post(
        "/webmasters/",
        json={
            "username": "novo_webmaster",
            "email": "novo@teste.com",
            "password": "Password123",
            "lodge_id": sample_lodge_2.id
        },
        headers={"Authorization": f"Bearer {super_admin_token}"},
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["username"] == "novo_webmaster"
    assert data["lodge_id"] == sample_lodge_2.id


@pytest.mark.integration
def test_create_webmaster_forbidden(client, webmaster_token, sample_lodge_2):
    """Testa falha ao tentar criar webmaster sendo um webmaster."""
    response = client.post(
        "/webmasters/",
        json={
            "username": "hacker_webmaster",
            "email": "hacker@teste.com",
            "password": "Password123",
            "lodge_id": sample_lodge_2.id
        },
        headers={"Authorization": f"Bearer {webmaster_token}"},
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.integration
def test_update_webmaster_forbidden(client, standard_member_token, sample_webmaster):
    """Testa que um membro não pode atualizar um webmaster."""
    response = client.put(
        f"/webmasters/{sample_webmaster.id}",
        json={"email": "hacked@teste.com"},
        headers={"Authorization": f"Bearer {standard_member_token}"},
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.integration
def test_delete_webmaster_forbidden(client, webmaster_token_2, sample_webmaster):
    """Testa que um webmaster não pode deletar outro webmaster."""
    response = client.delete(
        f"/webmasters/{sample_webmaster.id}",
        headers={"Authorization": f"Bearer {webmaster_token_2}"},
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
