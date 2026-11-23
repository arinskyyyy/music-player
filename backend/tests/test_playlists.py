"""Tests for playlist JSON encoding and data validation."""
import json

def test_playlist_json_handling():
    tracks = [{"id": "track-1", "title": "Loop", "artist": "Columbina"}]
    serialized = json.dumps(tracks)
    deserialized = json.loads(serialized)
    assert len(deserialized) == 1
    assert deserialized[0]["id"] == "track-1"
