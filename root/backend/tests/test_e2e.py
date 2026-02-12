import uuid


def test_register_verify_login_and_measurements_and_fhir(app_client):
    # Unique email per run
    email = f"user-{uuid.uuid4().hex[:8]}@example.com"
    password = "strongpass123"

    # Register
    r = app_client.post("/auth/register", json={"email": email, "password": password})
    assert r.status_code == 201, r.text

    # Verify via POST using fixed OTP from env
    r = app_client.post("/auth/verify-otp", json={"email": email, "otp": "1111"})
    assert r.status_code in (200, 303)

    # JSON login
    r = app_client.post("/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Protected route check
    r = app_client.get("/authenticated-route", headers=headers)
    assert r.status_code == 200, r.text

    # Create BP measurement
    payload = {
        "systolic": 123,
        "diastolic": 77,
        "pulse": 65,
        "timestamp": "2024-01-01T12:00:00+00:00",
        "tags": ["home"],
        "notes": "ok",
    }
    r = app_client.post("/measurements/bp", json=payload, headers=headers)
    assert r.status_code == 200, r.text
    m_id = r.json()["id"]

    # List BP
    r = app_client.get("/measurements/bp", headers=headers)
    assert r.status_code == 200
    items = r.json()
    assert any(it["id"] == m_id for it in items)

    # FHIR POST Observation (BP panel + HR)
    fhir_payload = {
        "resourceType": "Bundle",
        "type": "collection",
        "entry": [
            {
                "resource": {
                    "resourceType": "Observation",
                    "status": "final",
                    "code": {
                        "coding": [{"system": "http://loinc.org", "code": "85354-9"}],
                    },
                    "effectiveDateTime": "2024-01-02T10:00:00Z",
                    "component": [
                        {
                            "code": {"coding": [{"system": "http://loinc.org", "code": "8480-6"}]},
                            "valueQuantity": {"value": 120, "unit": "mmHg"},
                        },
                        {
                            "code": {"coding": [{"system": "http://loinc.org", "code": "8462-4"}]},
                            "valueQuantity": {"value": 80, "unit": "mmHg"},
                        },
                    ],
                }
            },
            {
                "resource": {
                    "resourceType": "Observation",
                    "status": "final",
                    "code": {"coding": [{"system": "http://loinc.org", "code": "8867-4"}]},
                    "valueQuantity": {"value": 62, "unit": "/min"},
                }
            },
        ],
    }
    r = app_client.post("/fhir/Observation", json=fhir_payload, headers=headers)
    assert r.status_code == 200, r.text
    assert r.json().get("resourceType") == "Bundle"

    # FHIR GET
    r = app_client.get("/fhir/Observation", headers=headers)
    assert r.status_code == 200
    bundle = r.json()
    assert bundle.get("resourceType") == "Bundle"
    assert isinstance(bundle.get("entry"), list) and len(bundle["entry"]) >= 2

