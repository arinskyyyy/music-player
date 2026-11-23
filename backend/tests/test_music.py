"""Tests for public music catalog and search logic."""
from backend.routers.music import PUBLIC_CATALOG, search_tracks

def test_catalog_structure():
    assert len(PUBLIC_CATALOG) > 0
    for track in PUBLIC_CATALOG:
        assert "id" in track
        assert "title" in track
        assert "artist" in track
        assert "src" in track

def test_local_search():
    results = search_tracks("Cyber")
    assert any(t["id"] == "track-2" for t in results["tracks"])
