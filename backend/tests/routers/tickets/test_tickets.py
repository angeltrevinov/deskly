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


def test_list_tickets_with_filters_sort_and_offset(client):
    payloads = [
        {
            "titulo": "Ticket 1",
            "descripcion": "Uno",
            "prioridad": "high",
            "asignado_a": "ana",
        },
        {
            "titulo": "Ticket 2",
            "descripcion": "Dos",
            "prioridad": "medium",
            "asignado_a": "luis",
        },
        {
            "titulo": "Ticket 3",
            "descripcion": "Tres",
            "prioridad": "high",
            "asignado_a": "ana",
        },
    ]

    ticket_ids: list[int] = []
    for payload in payloads:
        response = client.post("/api/tickets", json=payload)
        assert response.status_code == 201
        ticket_ids.append(response.json()["id"])

    patch_response = client.patch(
        f"/api/tickets/{ticket_ids[0]}",
        json={"estado": "en_progreso"},
    )
    assert patch_response.status_code == 200

    filtered_response = client.get(
        "/api/tickets",
        params={
            "estado": "en_progreso",
            "prioridad": "high",
            "asignado_a": "ana",
            "sort_by": "id",
            "sort_order": "asc",
            "offset": 0,
            "limit": 10,
        },
    )

    assert filtered_response.status_code == 200
    filtered_tickets = filtered_response.json()
    assert len(filtered_tickets) == 1
    assert filtered_tickets[0]["id"] == ticket_ids[0]

    paginated_response = client.get(
        "/api/tickets",
        params={
            "sort_by": "id",
            "sort_order": "asc",
            "offset": 1,
            "limit": 1,
        },
    )
    assert paginated_response.status_code == 200
    paginated_tickets = paginated_response.json()
    assert len(paginated_tickets) == 1
    assert paginated_tickets[0]["id"] == ticket_ids[1]


def test_list_tickets_with_date_filters(client):
    create_response = client.post(
        "/api/tickets",
        json={
            "titulo": "Ticket fechas",
            "descripcion": "Con fechas",
            "prioridad": "low",
            "asignado_a": "maria",
        },
    )
    assert create_response.status_code == 201

    in_range_response = client.get(
        "/api/tickets",
        params={
            "creado_desde": "2000-01-01T00:00:00Z",
            "creado_hasta": "2100-01-01T00:00:00Z",
        },
    )
    assert in_range_response.status_code == 200
    assert len(in_range_response.json()) == 1

    out_of_range_response = client.get(
        "/api/tickets",
        params={
            "creado_desde": "2100-01-02T00:00:00Z",
            "creado_hasta": "2100-01-03T00:00:00Z",
        },
    )
    assert out_of_range_response.status_code == 200
    assert out_of_range_response.json() == []


def test_list_tickets_with_updated_date_filters(client):
    create_response = client.post(
        "/api/tickets",
        json={
            "titulo": "Ticket actualizado por filtro",
            "descripcion": "Con updated_at",
            "prioridad": "low",
            "asignado_a": "maria",
        },
    )
    assert create_response.status_code == 201
    ticket_id = create_response.json()["id"]

    patch_response = client.patch(
        f"/api/tickets/{ticket_id}",
        json={"descripcion": "Descripcion actualizada"},
    )
    assert patch_response.status_code == 200

    in_range_response = client.get(
        "/api/tickets",
        params={
            "actualizado_desde": "2000-01-01T00:00:00Z",
            "actualizado_hasta": "2100-01-01T00:00:00Z",
        },
    )
    assert in_range_response.status_code == 200
    assert len(in_range_response.json()) == 1

    out_of_range_response = client.get(
        "/api/tickets",
        params={
            "actualizado_desde": "2100-01-02T00:00:00Z",
            "actualizado_hasta": "2100-01-03T00:00:00Z",
        },
    )
    assert out_of_range_response.status_code == 200
    assert out_of_range_response.json() == []


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


def test_list_ticket_comments_newest_first_with_offset(client):
    create_payload = {
        "titulo": "Ticket para listar comentarios",
        "descripcion": "Descripcion base",
        "prioridad": "medium",
        "asignado_a": "dev",
    }
    create_response = client.post("/api/tickets", json=create_payload)
    assert create_response.status_code == 201
    ticket_id = create_response.json()["id"]

    first_comment = client.post(
        f"/api/tickets/{ticket_id}/comentarios",
        json={"contenido": "Comentario 1", "autor": "qa1"},
    )
    second_comment = client.post(
        f"/api/tickets/{ticket_id}/comentarios",
        json={"contenido": "Comentario 2", "autor": "qa2"},
    )
    third_comment = client.post(
        f"/api/tickets/{ticket_id}/comentarios",
        json={"contenido": "Comentario 3", "autor": "qa3"},
    )

    assert first_comment.status_code == 201
    assert second_comment.status_code == 201
    assert third_comment.status_code == 201

    list_response = client.get(
        f"/api/tickets/{ticket_id}/comentarios",
        params={"offset": 0, "limit": 2},
    )
    assert list_response.status_code == 200
    comments = list_response.json()
    assert len(comments) == 2
    assert comments[0]["contenido"] == "Comentario 3"
    assert comments[1]["contenido"] == "Comentario 2"

    paginated_response = client.get(
        f"/api/tickets/{ticket_id}/comentarios",
        params={"offset": 2, "limit": 2},
    )
    assert paginated_response.status_code == 200
    paginated_comments = paginated_response.json()
    assert len(paginated_comments) == 1
    assert paginated_comments[0]["contenido"] == "Comentario 1"


def test_list_ticket_comments_not_found(client):
    response = client.get("/api/tickets/999/comentarios")

    assert response.status_code == 404
    assert response.json() == {"detail": "Ticket no encontrado"}


def test_ticket_state_transition_valid_flow(client):
    create_response = client.post(
        "/api/tickets",
        json={
            "titulo": "Ticket para flujo de estados",
            "descripcion": "flujo",
            "prioridad": "medium",
            "asignado_a": "dev",
        },
    )
    assert create_response.status_code == 201
    ticket_id = create_response.json()["id"]

    en_progreso = client.post(
        f"/api/tickets/{ticket_id}/transiciones",
        json={"estado": "en_progreso"},
    )
    assert en_progreso.status_code == 200
    assert en_progreso.json()["estado"] == "en_progreso"

    resuelto = client.post(
        f"/api/tickets/{ticket_id}/transiciones",
        json={"estado": "resuelto"},
    )
    assert resuelto.status_code == 200
    assert resuelto.json()["estado"] == "resuelto"

    cerrado = client.post(
        f"/api/tickets/{ticket_id}/transiciones",
        json={"estado": "cerrado"},
    )
    assert cerrado.status_code == 200
    assert cerrado.json()["estado"] == "cerrado"


def test_ticket_state_transition_allows_reabierto_from_resuelto(client):
    create_response = client.post(
        "/api/tickets",
        json={
            "titulo": "Ticket reabierto",
            "descripcion": "reapertura",
            "prioridad": "medium",
            "asignado_a": "dev",
        },
    )
    assert create_response.status_code == 201
    ticket_id = create_response.json()["id"]

    first_transition = client.post(
        f"/api/tickets/{ticket_id}/transiciones",
        json={"estado": "en_progreso"},
    )
    second_transition = client.post(
        f"/api/tickets/{ticket_id}/transiciones",
        json={"estado": "resuelto"},
    )
    reopen_transition = client.post(
        f"/api/tickets/{ticket_id}/transiciones",
        json={"estado": "reabierto"},
    )

    assert first_transition.status_code == 200
    assert second_transition.status_code == 200
    assert reopen_transition.status_code == 200
    assert reopen_transition.json()["estado"] == "reabierto"


def test_ticket_state_transition_invalid_returns_typed_409(client):
    create_response = client.post(
        "/api/tickets",
        json={
            "titulo": "Ticket invalido",
            "descripcion": "invalid transition",
            "prioridad": "low",
            "asignado_a": "qa",
        },
    )
    assert create_response.status_code == 201
    ticket_id = create_response.json()["id"]

    response = client.post(
        f"/api/tickets/{ticket_id}/transiciones",
        json={"estado": "cerrado"},
    )

    assert response.status_code == 409
    assert response.json() == {
        "error": "invalid_state_transition",
        "mensaje": "Transicion de estado invalida",
        "estado_actual": "abierto",
        "estado_objetivo": "cerrado",
        "transiciones_permitidas": ["en_progreso"],
    }


def test_patch_ticket_rejects_invalid_state_transition_with_409(client):
    create_response = client.post(
        "/api/tickets",
        json={
            "titulo": "Ticket patch invalido",
            "descripcion": "invalid patch transition",
            "prioridad": "low",
            "asignado_a": "qa",
        },
    )
    assert create_response.status_code == 201
    ticket_id = create_response.json()["id"]

    response = client.patch(
        f"/api/tickets/{ticket_id}",
        json={"estado": "cerrado"},
    )

    assert response.status_code == 409
    assert response.json() == {
        "error": "invalid_state_transition",
        "mensaje": "Transicion de estado invalida",
        "estado_actual": "abierto",
        "estado_objetivo": "cerrado",
        "transiciones_permitidas": ["en_progreso"],
    }


def test_patch_ticket_allows_same_estado_idempotent(client):
    create_response = client.post(
        "/api/tickets",
        json={
            "titulo": "Ticket idempotente",
            "descripcion": "mismo estado",
            "prioridad": "medium",
            "asignado_a": "qa",
        },
    )
    assert create_response.status_code == 201
    ticket_id = create_response.json()["id"]

    response = client.patch(
        f"/api/tickets/{ticket_id}",
        json={"estado": "abierto"},
    )

    assert response.status_code == 200
    assert response.json()["estado"] == "abierto"
