import hashlib
import hmac
import json
import time

import pytest


def sign_payload(secret: str, timestamp: int, body: bytes) -> str:
    message = str(timestamp).encode("utf-8") + b"." + body
    return hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()


@pytest.fixture(autouse=True)
def configure_webhook_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("WEBHOOK_SHARED_SECRET", "test-shared-secret")
    monkeypatch.setenv("WEBHOOK_REPLAY_WINDOW_SECONDS", "300")


def test_webhook_creates_ticket_with_valid_signature(client):
    payload = {
        "event_id": "evt-100",
        "ticket": {
            "titulo": "Incidente por webhook",
            "descripcion": "Creado externamente",
            "prioridad": "high",
            "asignado_a": "agente1",
        },
    }
    body = json.dumps(payload).encode("utf-8")
    timestamp = int(time.time())

    response = client.post(
        "/api/webhooks/tickets",
        content=body,
        headers={
            "X-Deskly-Timestamp": str(timestamp),
            "X-Deskly-Signature": sign_payload("test-shared-secret", timestamp, body),
            "Content-Type": "application/json",
        },
    )

    assert response.status_code == 201
    response_body = response.json()
    assert response_body["status"] == "creado"
    assert response_body["event_id"] == payload["event_id"]
    assert response_body["ticket"]["titulo"] == payload["ticket"]["titulo"]

    tickets_response = client.get("/api/tickets")
    assert tickets_response.status_code == 200
    tickets = tickets_response.json()
    assert len(tickets) == 1
    assert tickets[0]["titulo"] == payload["ticket"]["titulo"]


def test_webhook_rejects_invalid_signature(client):
    payload = {
        "event_id": "evt-101",
        "ticket": {
            "titulo": "Firma invalida",
            "descripcion": "No debe persistir",
            "prioridad": "medium",
            "asignado_a": "agente2",
        },
    }
    body = json.dumps(payload).encode("utf-8")
    timestamp = int(time.time())

    response = client.post(
        "/api/webhooks/tickets",
        content=body,
        headers={
            "X-Deskly-Timestamp": str(timestamp),
            "X-Deskly-Signature": "bad-signature",
            "Content-Type": "application/json",
        },
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Firma invalida"}

    tickets_response = client.get("/api/tickets")
    assert tickets_response.status_code == 200
    assert tickets_response.json() == []


def test_webhook_rejects_replay_timestamp(client):
    payload = {
        "event_id": "evt-102",
        "ticket": {
            "titulo": "Replay",
            "descripcion": "No debe persistir",
            "prioridad": "low",
            "asignado_a": "agente3",
        },
    }
    body = json.dumps(payload).encode("utf-8")
    timestamp = int(time.time()) - 3600

    response = client.post(
        "/api/webhooks/tickets",
        content=body,
        headers={
            "X-Deskly-Timestamp": str(timestamp),
            "X-Deskly-Signature": sign_payload("test-shared-secret", timestamp, body),
            "Content-Type": "application/json",
        },
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Timestamp fuera de ventana permitida"}

    tickets_response = client.get("/api/tickets")
    assert tickets_response.status_code == 200
    assert tickets_response.json() == []


def test_webhook_duplicate_event_id_returns_200_without_side_effect(client):
    payload = {
        "event_id": "evt-103",
        "ticket": {
            "titulo": "Evento duplicado",
            "descripcion": "Debe crearse una sola vez",
            "prioridad": "medium",
            "asignado_a": "agente4",
        },
    }
    body = json.dumps(payload).encode("utf-8")
    timestamp = int(time.time())
    signature = sign_payload("test-shared-secret", timestamp, body)
    headers = {
        "X-Deskly-Timestamp": str(timestamp),
        "X-Deskly-Signature": signature,
        "Content-Type": "application/json",
    }

    first_response = client.post("/api/webhooks/tickets", content=body, headers=headers)
    second_response = client.post("/api/webhooks/tickets", content=body, headers=headers)

    assert first_response.status_code == 201
    assert second_response.status_code == 200
    assert second_response.json() == {"status": "duplicado", "event_id": payload["event_id"]}

    tickets_response = client.get("/api/tickets")
    assert tickets_response.status_code == 200
    tickets = tickets_response.json()
    assert len(tickets) == 1
    assert tickets[0]["titulo"] == payload["ticket"]["titulo"]


def test_webhook_returns_422_for_malformed_payload(client):
    payload = {
        "event_id": "evt-104",
        "ticket": {
            "descripcion": "Falta titulo",
            "prioridad": "medium",
            "asignado_a": "agente5",
        },
    }
    body = json.dumps(payload).encode("utf-8")
    timestamp = int(time.time())

    response = client.post(
        "/api/webhooks/tickets",
        content=body,
        headers={
            "X-Deskly-Timestamp": str(timestamp),
            "X-Deskly-Signature": sign_payload("test-shared-secret", timestamp, body),
            "Content-Type": "application/json",
        },
    )

    assert response.status_code == 422

    tickets_response = client.get("/api/tickets")
    assert tickets_response.status_code == 200
    assert tickets_response.json() == []
