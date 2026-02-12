import uuid


def test_register_duplicate_user_returns_error(app_client):
    email = f"dup-{uuid.uuid4().hex[:8]}@example.com"
    password = "strongpass123"

    r1 = app_client.post("/auth/register", json={"email": email, "password": password})
    assert r1.status_code == 201, r1.text

    r2 = app_client.post("/auth/register", json={"email": email, "password": password})
    assert r2.status_code == 400, r2.text
    body = r2.json()
    # Our custom handler returns this code
    assert body.get("detail") == "REGISTER_USER_ALREADY_EXISTS"


def test_register_invalid_password_errors(app_client):
    email = f"weak-{uuid.uuid4().hex[:8]}@example.com"
    # too short
    r = app_client.post("/auth/register", json={"email": email, "password": "123"})
    assert r.status_code == 400
    assert "INVALID_PASSWORD" in r.json().get("detail", "")

    # contains email
    r = app_client.post("/auth/register", json={"email": email, "password": email})
    assert r.status_code == 400
    assert "INVALID_PASSWORD" in r.json().get("detail", "")

