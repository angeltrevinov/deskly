import asyncio
from collections import defaultdict

from anyio import from_thread
from fastapi import WebSocket


class TicketWebSocketManager:
    def __init__(self) -> None:
        self._all_connections: set[WebSocket] = set()
        self._ticket_connections: dict[int, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, ticket_id: int | None) -> None:
        await websocket.accept()
        async with self._lock:
            if ticket_id is None:
                self._all_connections.add(websocket)
            else:
                self._ticket_connections[ticket_id].add(websocket)

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._discard_locked(websocket)

    async def emit(self, event: str, ticket_id: int, payload: dict) -> None:
        async with self._lock:
            recipients = set(self._all_connections)
            recipients.update(self._ticket_connections.get(ticket_id, set()))

        dead_connections: list[WebSocket] = []
        message = {
            "event": event,
            "ticket_id": ticket_id,
            "payload": payload,
        }

        for websocket in recipients:
            try:
                await websocket.send_json(message)
            except Exception:
                dead_connections.append(websocket)

        if dead_connections:
            async with self._lock:
                for websocket in dead_connections:
                    self._discard_locked(websocket)

    async def active_connection_count(self) -> int:
        async with self._lock:
            all_connections = set(self._all_connections)
            for connections in self._ticket_connections.values():
                all_connections.update(connections)
            return len(all_connections)

    def emit_from_sync(self, event: str, ticket_id: int, payload: dict) -> None:
        try:
            from_thread.run(self.emit, event, ticket_id, payload)
        except RuntimeError:
            asyncio.run(self.emit(event, ticket_id, payload))

    def active_connection_count_from_sync(self) -> int:
        try:
            return from_thread.run(self.active_connection_count)
        except RuntimeError:
            return asyncio.run(self.active_connection_count())

    def _discard_locked(self, websocket: WebSocket) -> None:
        self._all_connections.discard(websocket)

        empty_ticket_ids: list[int] = []
        for ticket_id, connections in self._ticket_connections.items():
            connections.discard(websocket)
            if not connections:
                empty_ticket_ids.append(ticket_id)

        for ticket_id in empty_ticket_ids:
            del self._ticket_connections[ticket_id]
