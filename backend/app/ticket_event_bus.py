from app.ticket_ws_manager import TicketWebSocketManager


# Shared in-process event bus for all ticket-producing routes.
ticket_ws_manager = TicketWebSocketManager()
