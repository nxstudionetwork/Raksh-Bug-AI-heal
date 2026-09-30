import pytest
from app.authentication.password import hash_password, verify_password
from app.authentication.jwt import (
    create_access_token, create_refresh_token,
    decode_token, generate_email_verification_token,
    generate_password_reset_token,
)


class TestPassword:
    def test_hash_and_verify(self):
        pw = "SecureP@ss123"
        hashed = hash_password(pw)
        assert hashed != pw
        assert verify_password(pw, hashed) is True
        assert verify_password("wrong", hashed) is False


class TestJWT:
    def test_access_token(self):
        token = create_access_token(user_id=1, role="user")
        payload = decode_token(token)
        assert payload is not None
        assert int(payload["sub"]) == 1
        assert payload["type"] == "access"
        assert payload["role"] == "user"

    def test_refresh_token(self):
        token = create_refresh_token(user_id=42)
        payload = decode_token(token)
        assert payload is not None
        assert int(payload["sub"]) == 42
        assert payload["type"] == "refresh"

    def test_verify_tokens(self):
        vt = generate_email_verification_token()
        assert isinstance(vt, str) and len(vt) > 20

        rt = generate_password_reset_token()
        assert isinstance(rt, str) and len(rt) > 20

    def test_invalid_token_returns_none(self):
        assert decode_token("invalid.token.here") is None
        assert decode_token("") is None
