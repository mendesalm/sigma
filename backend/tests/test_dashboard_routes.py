from datetime import date


def test_get_dashboard_stats_success(client, webmaster_token):
    # Tests that the dashboard stats endpoint returns exactly 200 OK
    response = client.get("/dashboard/stats", headers={"Authorization": f"Bearer {webmaster_token}"})
    assert response.status_code == 200
    data = response.json()
    assert "total_members" in data
    assert "next_events" in data
    assert "upcoming_birthdays" in data
    assert "active_notices_count" in data
    assert "active_notices" in data
    assert "next_session" in data
    assert "classifieds_count" in data
    assert "dining_scale" in data
    assert "lodge_members_stats" in data
    assert "lodge_info" in data


def test_get_dashboard_stats_unauthorized(client):
    # Tests that the endpoint requires authentication
    response = client.get("/dashboard/stats")
    assert response.status_code == 401


def test_get_calendar_events_success(client, webmaster_token):
    # Tests that the calendar endpoint returns exactly 200 OK
    today = date.today()
    response = client.get(
        f"/dashboard/calendar?month={today.month}&year={today.year}",
        headers={"Authorization": f"Bearer {webmaster_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_get_calendar_events_missing_params(client, webmaster_token):
    # Tests that the calendar endpoint fails without month and year
    response = client.get("/dashboard/calendar", headers={"Authorization": f"Bearer {webmaster_token}"})
    assert response.status_code == 422  # Validation Error
