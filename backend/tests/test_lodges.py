import pytest
from fastapi import status
from datetime import date

@pytest.mark.integration
def test_create_lodge_success(client, super_admin_token, sample_obedience):
    """Testa criação de loja com sucesso por super admin."""
    response = client.post(
        "/lodges/",
        json={
            "lodge_name": "Loja Nova Esperança",
            "lodge_number": "1001",
            "foundation_date": "2023-01-01",
            "rite": "Rito Escocês Antigo e Aceito",
            "obedience_id": sample_obedience.id,
            "cnpj": "60.409.075/0001-52",
            "email": "loja@esperanca.com",
            "phone": "(11) 98765-4321",
            "city": "São Paulo",
            "state": "SP",
            "zip_code": "01001-000",
            "technical_contact_name": "Mestre Instalado",
            "technical_contact_email": "admin@esperanca.com",
            "session_day": "Segunda-feira",
            "periodicity": "Semanal",
            "session_time": "20:00:00"
        },
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["lodge_name"] == "Loja Nova Esperança"
    assert data["lodge_code"] is not None
    assert data["is_active"] is True

@pytest.mark.integration
def test_create_lodge_unauthorized(client, sample_obedience):
    """Testa falha ao criar loja sem autenticação."""
    response = client.post(
        "/lodges/",
        json={
            "lodge_name": "Loja Invasora",
            "obedience_id": sample_obedience.id,
            "technical_contact_name": "Hacker",
            "technical_contact_email": "hacker@test.com"
        }
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

@pytest.mark.integration
def test_read_lodges(client, sample_lodge):
    """Testa listagem de lojas."""
    response = client.get("/lodges/")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["lodge_name"] == sample_lodge.lodge_name.title()

@pytest.mark.integration
def test_update_lodge(client, super_admin_token, sample_lodge):
    """Testa atualização de loja."""
    response = client.put(
        f"/lodges/{sample_lodge.id}",
        json={
            "lodge_name": "Loja Atualizada",
            "phone": "(11) 99999-8888"
        },
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["lodge_name"] == "Loja Atualizada"
    assert data["phone"] == "(11) 99999-8888"

@pytest.mark.integration
def test_delete_lodge(client, super_admin_token, sample_lodge):
    """Testa exclusão de loja."""
    response = client.delete(
        f"/lodges/{sample_lodge.id}",
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    
    # Verificar se foi removida
    get_response = client.get(f"/lodges/{sample_lodge.id}")
    assert get_response.status_code == status.HTTP_404_NOT_FOUND
