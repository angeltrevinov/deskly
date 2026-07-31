from app.routers.tickets.routes import ticket_ws_manager


def test_ws_global_receives_ticket_created_event(client):
    with client.websocket_connect("/api/tickets/ws/tickets") as websocket:
        create_response = client.post(
            "/api/tickets",
            json={
                "titulo": "Ticket WS creado",
                "descripcion": "Evento creado",
                "prioridad": "medium",
                "asignado_a": "dev",
            },
        )

        assert create_response.status_code == 201
        created_ticket = create_response.json()

        event = websocket.receive_json()
        assert event["event"] == "ticket.creado"
        assert event["ticket_id"] == created_ticket["id"]
        assert event["payload"]["id"] == created_ticket["id"]
        assert event["payload"]["titulo"] == "Ticket WS creado"


def test_ws_ticket_subscription_receives_only_configured_ticket_events(client):
    ticket_one = client.post(
        "/api/tickets",
        json={
            "titulo": "Ticket uno",
            "descripcion": "A",
            "prioridad": "medium",
            "asignado_a": "dev",
        },
    ).json()
    ticket_two = client.post(
        "/api/tickets",
        json={
            "titulo": "Ticket dos",
            "descripcion": "B",
            "prioridad": "medium",
            "asignado_a": "dev",
        },
    ).json()

    with client.websocket_connect(
        f"/api/tickets/ws/tickets?ticket_id={ticket_one['id']}"
    ) as websocket:
        update_other = client.patch(
            f"/api/tickets/{ticket_two['id']}",
            json={"descripcion": "Otro ticket"},
        )
        update_target = client.patch(
            f"/api/tickets/{ticket_one['id']}",
            json={"descripcion": "Ticket suscrito"},
        )

        assert update_other.status_code == 200
        assert update_target.status_code == 200

        event = websocket.receive_json()
        assert event["event"] == "ticket.actualizado"
        assert event["ticket_id"] == ticket_one["id"]
        assert event["payload"]["id"] == ticket_one["id"]


def test_ws_global_receives_ticket_commented_event(client):
    create_response = client.post(
        "/api/tickets",
        json={
            "titulo": "Ticket comentario WS",
            "descripcion": "Comentario",
            "prioridad": "medium",
            "asignado_a": "qa",
        },
    )
    assert create_response.status_code == 201
    ticket = create_response.json()

    with client.websocket_connect("/api/tickets/ws/tickets") as websocket:
        comment_response = client.post(
            f"/api/tickets/{ticket['id']}/comentarios",
            json={"contenido": "Hola", "autor": "qa"},
        )

        assert comment_response.status_code == 201
        event = websocket.receive_json()

        assert event["event"] == "ticket.comentado"
        assert event["ticket_id"] == ticket["id"]
        assert event["payload"]["ticket_id"] == ticket["id"]
        assert event["payload"]["contenido"] == "Hola"


def test_ws_disconnect_is_clean_and_does_not_leave_dead_connections(client):
    with client.websocket_connect("/api/tickets/ws/tickets"):
        pass

    assert ticket_ws_manager.active_connection_count_from_sync() == 0

    create_response = client.post(
        "/api/tickets",
        json={
            "titulo": "Ticket post disconnect",
            "descripcion": "Sin fugas",
            "prioridad": "medium",
            "asignado_a": "dev",
        },
    )

    assert create_response.status_code == 201
