from __future__ import annotations

import pytest


@pytest.mark.parametrize("plan", ["free", "basic", "premium"])
def test_create_subscription_for_supported_plans(client, auth_headers, plan):
    response = client.post(
        "/api/v1/subscriptions/",
        headers=auth_headers,
        json={"plan": plan},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["plan"] == plan
    assert body["status"] == "active"


def test_check_active_subscription(client, auth_headers):
    client.post("/api/v1/subscriptions/", headers=auth_headers, json={"plan": "premium"})

    response = client.get("/api/v1/subscriptions/status", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["plan"] == "premium"
    assert response.json()["status"] == "active"


def test_cancel_subscription(client, auth_headers):
    client.post("/api/v1/subscriptions/", headers=auth_headers, json={"plan": "basic"})

    response = client.post("/api/v1/subscriptions/cancel", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "cancelled"
    status_response = client.get("/api/v1/subscriptions/status", headers=auth_headers)
    assert status_response.status_code == 404
    perks_response = client.get("/api/v1/subscriptions/perks", headers=auth_headers)
    assert perks_response.status_code == 200
    assert perks_response.json()["current_plan"] == "free"
    assert perks_response.json()["has_active_subscription"] is False


@pytest.mark.parametrize(
    ("plan", "expected_discount"),
    [
        ("free", 0),
        ("basic", 10),
        ("premium", 20),
    ],
)
def test_subscription_perks_discount_calculation(client, auth_headers, plan, expected_discount):
    client.post("/api/v1/subscriptions/", headers=auth_headers, json={"plan": plan})

    perks_response = client.get("/api/v1/subscriptions/perks", headers=auth_headers)

    assert perks_response.status_code == 200
    perks = perks_response.json()
    assert perks["current_plan"] == plan
    assert perks["consultation_discount_percent"] == expected_discount
    assert perks["has_active_subscription"] is True
