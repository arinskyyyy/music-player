"""Tests for connection manager and room state synchronization."""
from backend.connection_manager import ConnectionManager

def test_connection_manager_state():
    cm = ConnectionManager()
    state = cm.get_or_create_state("test-room-1")
    assert state is not None
    assert "track" in state
    assert state["is_playing"] is False
    assert state["current_time"] == 0.0
