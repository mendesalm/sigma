def test_create_and_get_classified(client, webmaster_token):
    # 1. Create a Classified
    form_data = {
        "title": "Venda de Livro",
        "description": "Livro maçônico raro.",
        "price": "150.00",
        "contact_info": "11999999999",
        "contact_email": "vendedor@teste.com",
        "category": "Produtos",
    }

    response = client.post(
        "/classifieds/",
        data=form_data,  # Using data for form fields
        headers={"Authorization": f"Bearer {webmaster_token}"},
    )
    assert response.status_code == 201
    created_classified = response.json()
    assert created_classified["title"] == "Venda de Livro"
    assert created_classified["price"] == 150.0
    classified_id = created_classified["id"]

    # 2. List Classifieds (Active)
    response = client.get("/classifieds/", headers={"Authorization": f"Bearer {webmaster_token}"})
    assert response.status_code == 200
    classifieds_list = response.json()
    assert len(classifieds_list) >= 1

    # 3. List My Classifieds
    response = client.get("/classifieds/my", headers={"Authorization": f"Bearer {webmaster_token}"})
    assert response.status_code == 200

    # 4. Update Classified
    update_data = {"title": "Venda de Livro Raro", "price": 180.0}
    response = client.put(
        f"/classifieds/{classified_id}", json=update_data, headers={"Authorization": f"Bearer {webmaster_token}"}
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Venda de Livro Raro"

    # 5. Reactivate Classified
    response = client.post(
        f"/classifieds/{classified_id}/reactivate", headers={"Authorization": f"Bearer {webmaster_token}"}
    )
    assert response.status_code == 400

    # 6. Delete Classified
    response = client.delete(f"/classifieds/{classified_id}", headers={"Authorization": f"Bearer {webmaster_token}"})
    assert response.status_code == 204
