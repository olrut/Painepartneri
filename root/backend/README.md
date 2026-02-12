# Backend

FastAPI backend for the project.

## Run with uv

- Install uv: Windows `winget install astral-sh.uv`
- Start Postgres: `docker compose up -d`
- Set DB URL in `.env` (already set): `DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/backend`
- Sync deps: `uv sync`
- Dev server: `uv run -- uvicorn app.app:app --reload --host 0.0.0.0 --port 8080 --env-file .env`
- Start: `uv run -- python main.py`

Environment variables are read from `.env` via `python-dotenv` in `main.py`.

### Environment Setup
- Copy `.env.example` to `.env` and fill in values as needed.
- `.env` is ignored by git (see `.gitignore`); do not commit real secrets.

### Email (Resend)
- Set `RESEND_API_KEY` to your Resend API key
- Set `SEND_FROM` to a verified sender (e.g., `Your App <no-reply@yourdomain.com>`)
- OTP emails are sent via Resend when requesting verification

#### Email Sending Toggle
- Set `SEND_EMAILS=false` in `.env` to skip sending real emails in development. The backend logs the OTP instead.
- When disabled, missing `RESEND_API_KEY`/`SEND_FROM` will not cause errors.

### OTP for Testing
- Set `TEST_FIXED_OTP=1111` in `.env` to force OTPs to the fixed value for both registration and verification-request flows.
- The `/auth/verify-otp` endpoint also accepts this fixed code even if the DB-stored OTP differs (testing convenience).
- Remove or leave `TEST_FIXED_OTP` empty to restore random 4-digit OTP generation.

### Post-Verification Redirect
- Optional: set `VERIFY_SUCCESS_REDIRECT` in `.env` to a URL where clients should be redirected after successful OTP verification (e.g., your frontend sign-in page).
- Alternatively, pass a `redirect_to` query param to `/auth/verify-otp` to override per request, for example: `/auth/verify-otp?redirect_to=http://localhost:5173/sign-in`.

### Database Schema in Dev vs Prod
- In development, the app auto-creates tables on startup. Control via `AUTO_CREATE_DB_SCHEMA=true|false`.
- For production, prefer migrations (e.g., Alembic) instead of `create_all`. If you want, I can add a basic Alembic setup.

### FHIR Endpoints (R4-ish)
- `GET /fhir/Observation`: returns a Bundle of the user's vital sign Observations:
  - Blood pressure panel (LOINC `85354-9`) with systolic (`8480-6`) and diastolic (`8462-4`) components, UCUM `mm[Hg]`.
  - Heart rate Observation (LOINC `8867-4`), UCUM `/min`.
- `POST /fhir/Observation`: accepts either a single Observation or a Bundle. Requires a BP panel (`85354-9`) and a heart rate (`8867-4`) and stores them as one internal measurement.
- `GET /fhir/Patient/me`: returns a minimal Patient resource for the current user.

Notes
- These endpoints provide a FHIR representation over the existing schema. The DB schema remains unchanged.
- If you want to persist raw FHIR JSON (e.g., in `JSONB`) or support broader resources, we can extend this.

### Kirjautuminen (Login)
- JSON-login: `POST /auth/login` rungolla `{ "email": "user@example.com", "password": "..." }` → palauttaa `{ access_token, token_type }`.
- FastAPI Users JWT -login: `POST /auth/jwt/login` form‑datalla (`Content-Type: application/x-www-form-urlencoded`) kentät `username=<email>` ja `password=<password>`.
- Molemmat reitit edellyttävät, että käyttäjä on verifioitu (`is_verified=True`). Varmista, että OTP‑vahvistus on onnistunut ennen kirjautumista.
- Vinkki: Jos lähetät vahingossa JSONin reitille `/auth/jwt/login`, saat 422‑virheen. Käytä tällöin joko `/auth/login` JSON‑reittiä tai vaihda form‑dataan.

### Docker Compose (database only)

`docker-compose.yml` provisions a local Postgres 16 instance exposed on `5432` with database `backend` and user/password `postgres/postgres`. Data persists in a local Docker volume `pgdata`.

pgAdmin 4 is also available at `http://localhost:5050` for convenience. Default credentials come from env variables and are set for local use only:

- PGADMIN_DEFAULT_EMAIL: `admin@example.com`
- PGADMIN_DEFAULT_PASSWORD: `admin`

Override these in your `.env` for any shared environment.

Commands:
- Start DB: `docker compose up -d`
- Stop DB: `docker compose down`
- Reset data: `docker compose down -v`
