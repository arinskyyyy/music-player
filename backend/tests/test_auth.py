"""Tests for authentication and password utilities."""
from backend.routers.auth import get_password_hash, verify_password, create_access_token
from jose import jwt
from backend.config import settings

def test_password_hashing():
    pwd = "secret_password_123"
    h = get_password_hash(pwd)
    assert verify_password(pwd, h) is True
    assert verify_password("wrong_password", h) is False

def test_token_creation():
    token = create_access_token({"sub": "42", "username": "pixel_listener"})
    payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    assert payload.get("sub") == "42"
    assert payload.get("username") == "pixel_listener"

def test_oauth_model():
    from backend.routers.auth import OAuthLoginRequest
    req = OAuthLoginRequest(id_token="sample_id_token_123")
    assert req.id_token == "sample_id_token_123"
