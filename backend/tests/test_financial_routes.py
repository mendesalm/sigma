import pytest
from fastapi.testclient import TestClient


def test_get_financial_config_unauthorized(client: TestClient, sample_lodge):
    """Teste de acesso não autorizado às configurações."""
    response = client.get("/financial/config")
    assert response.status_code == 401


def test_get_financial_config_webmaster(client: TestClient, webmaster_token: str, sample_lodge):
    """Teste de leitura das configurações por webmaster."""
    response = client.get("/financial/config", headers={"Authorization": f"Bearer {webmaster_token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["lodge_id"] == sample_lodge.id
    assert data["active_gateway"] == "NENHUM"
    assert data["has_api_key"] is False


def test_update_financial_config_webmaster(client: TestClient, webmaster_token: str, sample_lodge):
    """Teste de atualização das configurações por webmaster."""
    response = client.put(
        "/financial/config",
        headers={"Authorization": f"Bearer {webmaster_token}"},
        json={
            "active_gateway": "ASAAS",
            "strict_budget_control": True,
            "recalculate_late_fees": True,
            "default_penalty_percent": 3.0,
            "default_interest_percent": 1.5,
            "gateway_api_key": "test_api_key_123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["active_gateway"] == "ASAAS"
    assert data["strict_budget_control"] is True
    assert data["default_penalty_percent"] == 3.0
    assert data["has_api_key"] is True


def test_create_category_webmaster(client: TestClient, webmaster_token: str, sample_lodge):
    """Teste de criação de categoria."""
    response = client.post(
        "/financial/categories",
        headers={"Authorization": f"Bearer {webmaster_token}"},
        json={"name": "Mensalidades", "type": "RECEITA", "is_active": True},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Mensalidades"
    assert data["type"] == "RECEITA"
    assert "id" in data


def test_get_categories(client: TestClient, webmaster_token: str, sample_lodge):
    """Teste de listagem de categorias."""
    # Create one first
    client.post(
        "/financial/categories",
        headers={"Authorization": f"Bearer {webmaster_token}"},
        json={"name": "Aluguel", "type": "DESPESA"},
    )

    response = client.get("/financial/categories?type=DESPESA", headers={"Authorization": f"Bearer {webmaster_token}"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["type"] == "DESPESA"


@pytest.fixture
def sample_category(client: TestClient, webmaster_token: str):
    response = client.post(
        "/financial/categories",
        headers={"Authorization": f"Bearer {webmaster_token}"},
        json={"name": "Joia", "type": "RECEITA"},
    )
    return response.json()


def test_create_transaction_webmaster(client: TestClient, webmaster_token: str, sample_category, sample_member):
    """Teste de criação de transação."""
    response = client.post(
        "/financial/transactions",
        headers={"Authorization": f"Bearer {webmaster_token}"},
        json={
            "description": "Joia do Irmão Teste",
            "transaction_type": "RECEITA",
            "due_date": "2026-03-10",
            "competency_date": "2026-03-01",
            "original_amount": 1000.0,
            "member_id": sample_member.id,
            "category_id": sample_category["id"],
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["description"] == "Joia do Irmão Teste"
    assert data["original_amount"] == 1000.0
    assert data["status"] == "PENDENTE"
    assert data["gateway_id"] is None  # Assuming none is mocked right now or we test mock next


def test_get_transactions(client: TestClient, webmaster_token: str, sample_category):
    """Teste de listagem de transações."""
    # Cria
    client.post(
        "/financial/transactions",
        headers={"Authorization": f"Bearer {webmaster_token}"},
        json={
            "description": "Conta de Luz",
            "transaction_type": "DESPESA",
            "due_date": "2026-04-10",
            "competency_date": "2026-04-01",
            "original_amount": 250.0,
        },
    )

    response = client.get("/financial/transactions", headers={"Authorization": f"Bearer {webmaster_token}"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(t["description"] == "Conta de Luz" for t in data)


def test_update_transaction(client: TestClient, webmaster_token: str):
    """Teste de alteração de transação (pagamento)."""
    create_resp = client.post(
        "/financial/transactions",
        headers={"Authorization": f"Bearer {webmaster_token}"},
        json={
            "description": "Mensalidade",
            "transaction_type": "RECEITA",
            "due_date": "2026-05-10",
            "competency_date": "2026-05-01",
            "original_amount": 150.0,
        },
    )
    txn_id = create_resp.json()["id"]

    response = client.put(
        f"/financial/transactions/{txn_id}",
        headers={"Authorization": f"Bearer {webmaster_token}"},
        json={"status": "PAGO", "paid_amount": 150.0, "payment_date": "2026-05-09"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "PAGO"
    assert data["paid_amount"] == 150.0
    assert data["payment_date"] == "2026-05-09"


def test_delete_transaction(client: TestClient, webmaster_token: str):
    """Teste de exclusão de transação."""
    create_resp = client.post(
        "/financial/transactions",
        headers={"Authorization": f"Bearer {webmaster_token}"},
        json={
            "description": "Cancelado",
            "transaction_type": "DESPESA",
            "due_date": "2026-06-10",
            "competency_date": "2026-06-01",
            "original_amount": 10.0,
        },
    )
    txn_id = create_resp.json()["id"]

    del_resp = client.delete(
        f"/financial/transactions/{txn_id}", headers={"Authorization": f"Bearer {webmaster_token}"}
    )
    assert del_resp.status_code == 204

    get_resp = client.get(f"/financial/transactions/{txn_id}", headers={"Authorization": f"Bearer {webmaster_token}"})
    assert get_resp.status_code == 404
