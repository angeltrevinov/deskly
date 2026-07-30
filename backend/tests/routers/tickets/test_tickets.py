def test_create_and_list_tickets(client):
    payload = {
        "titulo": "Primer ticket",
        "descripcion": "Ticket creado en test",
        "prioridad": "medium",
        "asignado_a": "dev",
    }

    create_response = client.post("/api/tickets", json=payload)

    assert create_response.status_code == 201
    created_ticket = create_response.json()
    assert created_ticket["titulo"] == payload["titulo"]
    assert created_ticket["descripcion"] == payload["descripcion"]
    assert created_ticket["prioridad"] == payload["prioridad"]
    assert created_ticket["asignado_a"] == payload["asignado_a"]
    assert created_ticket["estado"] == "abierto"
    assert created_ticket["id"] == 1

    list_response = client.get("/api/tickets")

    assert list_response.status_code == 200
    tickets = list_response.json()
    assert len(tickets) == 1
    assert tickets[0]["titulo"] == payload["titulo"]


def test_get_ticket_detail(client):
    payload = {
        "titulo": "Ticket detalle",
        "descripcion": "Detalle del ticket",
        "prioridad": "high",
        "asignado_a": "qa",
    }

    create_response = client.post("/api/tickets", json=payload)
    assert create_response.status_code == 201
    ticket_id = create_response.json()["id"]

    detail_response = client.get(f"/api/tickets/{ticket_id}")

    assert detail_response.status_code == 200
    ticket = detail_response.json()
    assert ticket["id"] == ticket_id
    assert ticket["titulo"] == payload["titulo"]
    assert ticket["descripcion"] == payload["descripcion"]
    assert ticket["prioridad"] == payload["prioridad"]
    assert ticket["asignado_a"] == payload["asignado_a"]
    assert ticket["estado"] == "abierto"


def test_get_ticket_detail_not_found(client):
    response = client.get("/api/tickets/999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Ticket no encontrado"}


def test_patch_ticket_updates_selected_fields(client):
    create_payload = {
        "titulo": "Ticket original",
        "descripcion": "Descripcion original",
        "prioridad": "medium",
        "asignado_a": "dev1",
    }
    create_response = client.post("/api/tickets", json=create_payload)
    assert create_response.status_code == 201
    ticket_id = create_response.json()["id"]

    patch_payload = {
        "titulo": "Ticket actualizado",
        "estado": "en_progreso",
        "asignado_a": "dev2",
    }
    patch_response = client.patch(f"/api/tickets/{ticket_id}", json=patch_payload)

    assert patch_response.status_code == 200
    patched_ticket = patch_response.json()
    assert patched_ticket["id"] == ticket_id
    assert patched_ticket["titulo"] == "Ticket actualizado"
    assert patched_ticket["descripcion"] == "Descripcion original"
    assert patched_ticket["prioridad"] == "medium"
    assert patched_ticket["estado"] == "en_progreso"
    assert patched_ticket["asignado_a"] == "dev2"


def test_patch_ticket_not_found(client):
    patch_payload = {"titulo": "No existe"}

    response = client.patch("/api/tickets/999", json=patch_payload)

    assert response.status_code == 404
    assert response.json() == {"detail": "Ticket no encontrado"}


def test_patch_ticket_rejects_empty_payload(client):
    create_payload = {
        "titulo": "Ticket para validar patch",
        "descripcion": "Descripcion",
        "prioridad": "medium",
        "asignado_a": "dev",
    }
    create_response = client.post("/api/tickets", json=create_payload)
    assert create_response.status_code == 201
    ticket_id = create_response.json()["id"]

    response = client.patch(f"/api/tickets/{ticket_id}", json={})

    assert response.status_code == 422


def test_patch_ticket_rejects_null_in_non_nullable_field(client):
    create_payload = {
        "titulo": "Ticket para validar null",
        "descripcion": "Descripcion",
        "prioridad": "medium",
        "asignado_a": "dev",
    }
    create_response = client.post("/api/tickets", json=create_payload)
    assert create_response.status_code == 201
    ticket_id = create_response.json()["id"]

    response = client.patch(f"/api/tickets/{ticket_id}", json={"titulo": None})

    assert response.status_code == 422


def test_add_comment_to_ticket(client):
    create_payload = {
        "titulo": "Ticket con comentarios",
        "descripcion": "Descripcion base",
        "prioridad": "medium",
        "asignado_a": "dev",
    }
    create_response = client.post("/api/tickets", json=create_payload)
    assert create_response.status_code == 201
    ticket_id = create_response.json()["id"]

    comment_payload = {
        "contenido": "Primer comentario",
        "autor": "qa",
    }
    comment_response = client.post(f"/api/tickets/{ticket_id}/comentarios", json=comment_payload)

    assert comment_response.status_code == 201
    comment = comment_response.json()
    assert comment["ticket_id"] == ticket_id
    assert comment["contenido"] == comment_payload["contenido"]
    assert comment["autor"] == comment_payload["autor"]
    assert "id" in comment
    assert "creado_en" in comment


def test_add_comment_to_ticket_not_found(client):
    comment_payload = {
        "contenido": "Comentario huerfano",
        "autor": "qa",
    }
    response = client.post("/api/tickets/999/comentarios", json=comment_payload)

    assert response.status_code == 404
    assert response.json() == {"detail": "Ticket no encontrado"}
