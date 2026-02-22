import pytest
from datetime import date, timedelta

def test_create_and_get_notice(client, webmaster_token):
    # 1. Create a Notice
    notice_data = {
        "title": "Aviso Importante Teste",
        "content": "Conteúdo do aviso de teste.",
        "lodge_id": 1, # Provided by fixture sample_lodge
        "is_active": True,
        "expiration_date": str(date.today() + timedelta(days=10))
    }
    
    response = client.post(
        "/notices/",
        json=notice_data,
        headers={"Authorization": f"Bearer {webmaster_token}"}
    )
    assert response.status_code == 200
    created_notice = response.json()
    assert created_notice["title"] == "Aviso Importante Teste"
    notice_id = created_notice["id"]
    
    # 2. Get Notices
    response = client.get(
        "/notices/?lodge_id=1",
        headers={"Authorization": f"Bearer {webmaster_token}"}
    )
    assert response.status_code == 200
    notices_list = response.json()
    assert len(notices_list) >= 1
    assert any(n["id"] == notice_id for n in notices_list)
    
    # 3. Update Notice
    update_data = {
        "title": "Aviso Atualizado",
        "content": "Conteúdo Atualizado",
        "is_active": False
    }
    response = client.put(
        f"/notices/{notice_id}?lodge_id=1",
        json=update_data,
        headers={"Authorization": f"Bearer {webmaster_token}"}
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Aviso Atualizado"
    
    # 4. Delete Notice
    response = client.delete(
        f"/notices/{notice_id}?lodge_id=1",
        headers={"Authorization": f"Bearer {webmaster_token}"}
    )
    assert response.status_code == 204
