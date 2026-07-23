import pytest
from fastapi import status


@pytest.mark.integration
def test_create_member_success(client, webmaster_token, sample_lodge):
    """Testa criação de membro com sucesso por webmaster."""
    response = client.post(
        "/members/",
        json={
            "full_name": "Novo Irmão Teste",
            "email": "irmao@teste.com",
            "cpf": "987.654.321-00",
            "birth_date": "1990-01-01",
            "password": "StrongPassword123",
            "lodge_id": sample_lodge.id,
            "cim": "123456",
            "degree": 1,
            "registration_status": "Aprovado",
        },
        headers={"Authorization": f"Bearer {webmaster_token}"},
    )
    if response.status_code != status.HTTP_201_CREATED:
        print(response.json())
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["full_name"] == "Novo Irmão Teste"
    assert data["email"] == "irmao@teste.com"
    assert data["cim"] == "123456"


@pytest.mark.integration
def test_create_member_duplicate_email(client, webmaster_token, sample_lodge, sample_member):
    """Testa falha ao criar membro com email duplicado."""
    response = client.post(
        "/members/",
        json={
            "full_name": "Outro Irmão",
            "email": sample_member.email,  # Email já existente
            "cpf": "529.982.247-25",
            "birth_date": "1995-05-05",
            "password": "AnotherPassword123",
            "lodge_id": sample_lodge.id,
            "cim": "654321",
        },
        headers={"Authorization": f"Bearer {webmaster_token}"},
    )
    assert response.status_code == status.HTTP_409_CONFLICT
    assert "E-mail já cadastrado." in response.json()["detail"]


@pytest.mark.integration
def test_read_members_webmaster(client, webmaster_token, sample_member):
    """Testa listagem de membros pelo webmaster (apenas da sua loja)."""
    response = client.get("/members/", headers={"Authorization": f"Bearer {webmaster_token}"})
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    # Verifica se o membro de amostra está na lista
    member_ids = [m["id"] for m in data]
    assert sample_member.id in member_ids


@pytest.mark.integration
def test_read_member_details(client, webmaster_token, sample_member):
    """Testa leitura de detalhes de um membro específico."""
    response = client.get(f"/members/{sample_member.id}", headers={"Authorization": f"Bearer {webmaster_token}"})
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == sample_member.id
    assert data["full_name"] == sample_member.full_name


@pytest.mark.integration
def test_update_member(client, webmaster_token, sample_member):
    """Testa atualização de dados do membro."""
    response = client.put(
        f"/members/{sample_member.id}",
        json={"phone": "(11) 98888-7777", "degree": 3},
        headers={"Authorization": f"Bearer {webmaster_token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["phone"] == "5511988887777"
    assert data["degree"] == 3


@pytest.mark.integration
def test_delete_member_association(client, webmaster_token, sample_member):
    """Testa desassociação de membro da loja (delete pelo webmaster)."""
    response = client.delete(f"/members/{sample_member.id}", headers={"Authorization": f"Bearer {webmaster_token}"})
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verifica se o membro não é mais retornado na lista da loja
    # Nota: O membro ainda existe no banco, mas a associação foi removida
    # O endpoint get /{id} para webmaster deve retornar 404 se não estiver na loja
    get_response = client.get(f"/members/{sample_member.id}", headers={"Authorization": f"Bearer {webmaster_token}"})
    assert get_response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.integration
def test_create_member_invalid_cpf(client, webmaster_token, sample_lodge):
    """Testa criação de membro com CPF inválido."""
    response = client.post(
        "/members/",
        json={
            "full_name": "Irmão CPF Inválido",
            "email": "cpf_invalido@teste.com",
            "cpf": "123.456.789-00",  # CPF inválido
            "birth_date": "1990-01-01",
            "password": "StrongPassword123",
            "lodge_id": sample_lodge.id,
        },
        headers={"Authorization": f"Bearer {webmaster_token}"},
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

@pytest.mark.integration
def test_member_self_update_privilege_escalation(client, standard_member_token, sample_member):
    """Testa que um membro comum NÃO pode alterar seu grau ou status (Mass Assignment Blocked)."""
    # Verify initial degree
    assert sample_member.degree != 33
    
    response = client.put(
        f"/members/{sample_member.id}",
        json={
            "phone": "(11) 99999-9999", 
            "degree": 33, 
            "status": "Inativo"
        },
        headers={"Authorization": f"Bearer {standard_member_token}"},
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Phone should be updated (allowed in MemberSelfUpdate)
    assert data["phone"] == "5511999999999"
    
    # Degree and Status should NOT be updated (ignored by MemberSelfUpdate filter)
    assert data["degree"] != 33
    assert data["status"] != "Inativo"


@pytest.mark.integration
def test_read_members_standard_member(client, standard_member_token, sample_member):
    """Testa listagem de membros por um membro comum da mesma loja."""
    response = client.get("/members/", headers={"Authorization": f"Bearer {standard_member_token}"})
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    
    # Verifica se o membro consegue ver a si mesmo e outros na listagem da loja
    member_ids = [m["id"] for m in data]
    assert sample_member.id in member_ids

