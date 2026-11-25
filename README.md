# DScribe Patient Admission Management

A full-stack hospital patient admission dashboard for the DScribe Software Engineer Intern Round 1 assignment.

## Why this stack

- React + Vite + React Router provide a fast, route-aware browser application.
- SQLAlchemy and Flask-Migrate keep persistence and schema changes explicit.
- PostgreSQL provides durable relational storage; Docker makes local setup repeatable.

## Features

- Overview dashboard with full-dataset statistics and recent admissions
- Patient records route at `/patients` with search and URL-synchronised filters
- Add, edit, delete, inspect, and discharge patients
- Frontend and backend validation with matching messages
- IST-aware admission-date validation
- Custom confirmation dialogs and toast notifications
- Health status polling every 30 seconds
- Responsive sidebar, table, forms, and modals

## Local run

Prerequisites: Docker Desktop, Node.js 20+, and npm.

Start the database and API:

```powershell
cd C:\Users\DELL\Desktop\Dscribe
Copy-Item .env.example .env
docker compose up -d postgres
docker compose run --rm backend flask db upgrade
docker compose up -d --build backend
```

Start the frontend in a second terminal:

```powershell
cd C:\Users\DELL\Desktop\Dscribe\frontend
npm install
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173/`. Check the API with `http://127.0.0.1:5000/health`.

## Environment variables

The root `.env` controls the local Docker database and backend. It is based on [.env.example](./.env.example) and is ignored by Git. Backend settings for a non-Docker run are based on [backend/.env.example](./backend/.env.example):

```text
DATABASE_URL=postgresql+psycopg://dscribe_app:replace-with-a-local-password@localhost:55432/dscribe
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Frontend `.env`:

```text
VITE_API_URL=http://127.0.0.1:5000/api
```

Secrets and `.env` files are excluded by `.gitignore`. Production values belong in Secret Manager or deployment environment variables.

## Architecture

```text
React/Vite frontend :5173
        |
        | Axios REST calls
        v
Flask/Gunicorn API :5000
        |
        v
PostgreSQL dscribe database
        |
        v
Docker named volume dscribe_dscribe-postgres
```

## Folder structure

```text
backend/app/__init__.py              application factory, CORS, health
backend/app/models.py                 SQLAlchemy Patient model
backend/app/validators.py             shared backend validation rules
backend/app/routes/patients.py        REST endpoints
backend/migrations/versions/          schema migrations
backend/tests/test_validators.py      nine backend validator tests
frontend/src/App.jsx                  routes, layout, pages, modals
frontend/src/validators.js             frontend validation rules
frontend/src/api.js                   Axios API client
frontend/src/constants.js             allowed values and ward mapping
scripts/test_api.sh                   curl API smoke tests
```

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` or `/api/health` | Database-backed health check |
| GET | `/api/patients` | List, filter, search, stats, recent admissions |
| GET | `/api/patients/<id>` | Get one patient; 404 if unknown |
| POST | `/api/patients` | Create patient; 422 on validation errors |
| PUT | `/api/patients/<id>` | Update patient |
| PATCH | `/api/patients/<id>/discharge` | Set status and IST discharge date |
| DELETE | `/api/patients/<id>` | Delete patient |

List query parameters include `q`, `ward`, `department`, `doctor`, and `status`.

## Validation rules

| Field | Rule |
|---|---|
| Name | Required, 2–50 characters, letters/spaces/hyphens/apostrophes, saved in title case |
| Age | Required integer from 0 through 120 |
| Gender/Ward/Department/Doctor | Required and must match an allowed value |
| Ward/Department | Must be a valid combination |
| Admission date | Required valid date, not after today in Asia/Kolkata |
| Status | Only `Admitted` or `Discharged` |

Validation errors have this shape:

```json
{"success": false, "errors": {"age": "Age must be between 0 and 120"}}
```

## Tests

Run backend validator tests:

```powershell
cd backend
python -m unittest discover -s tests -v
```

Run API smoke tests from Git Bash or WSL after starting the services:

```bash
bash scripts/test_api.sh
```

Build the frontend:

```powershell
cd frontend
npm run build
```

## Docker and GCP deployment

The backend production image uses Gunicorn and the Cloud Run `PORT` variable. For GCP, build and push the image to Artifact Registry, deploy Flask to Cloud Run with Cloud SQL connectivity, store `DATABASE_URL` in Secret Manager, and deploy `frontend/dist` to Firebase Hosting with an SPA rewrite.

```bash
gcloud builds submit ./backend --tag REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/dscribe-api
gcloud run deploy SERVICE_NAME --image REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/dscribe-api --region REGION --add-cloudsql-instances INSTANCE_CONNECTION_NAME
cd frontend && npm run build && firebase deploy
```

Live application URL: https://dscribe-patient-93800.web.app

### Automatic frontend deployment

Pushing to `main` runs frontend build and backend tests in DScribe CI. If both
succeed, the tested frontend build is deployed to Firebase Hosting automatically.
Pull requests run checks only; they do not deploy. Failed checks leave the live
website unchanged. Hosting deployment does not modify database contents.

The workflow uses the repository variables `GCP_PROJECT_ID`, `WIF_PROVIDER`, and
`WIF_SERVICE_ACCOUNT` for keyless Google Cloud authentication. The service account
needs Firebase Hosting Admin and Service Usage Consumer permissions in the target
project. No service-account JSON key or Firebase token is needed.

Optional repository variable `VITE_API_URL` overrides the default deployed
Cloud Run API URL. This is a public frontend setting, never a database password.

Watch **Actions → DScribe CI → Deploy Firebase Hosting** after pushing.
The separate backend workflow publishes an image only; Cloud Run deployment
and database migrations remain separate operations.

## Screenshots

Desktop Overview
<img width="960" height="540" alt="Screenshot 2026-11-25 175042" src="https://github.com/user-attachments/assets/ccd22ff9-7570-44b0-bcd6-cbbafea4f420" />
<img width="960" height="540" alt="Screenshot 2026-11-25 175017" src="https://github.com/user-attachments/assets/c34de8ae-66b9-4c56-a382-7f8028d8ea6d" />
<img width="960" height="540" alt="Screenshot 2026-11-25 175049" src="https://github.com/user-attachments/assets/2a4331d9-393f-49f8-ae39-249bdfc8039c" />
<img width="959" height="539" alt="Screenshot 2026-11-25 175105" src="https://github.com/user-attachments/assets/ffa493a0-8c1c-42b9-82aa-3e725e41a406" />
<img width="959" height="539" alt="Screenshot 2026-11-25 175136" src="https://github.com/user-attachments/assets/1f6e824b-7f52-4af8-8fdb-b089f81081ea" />
<img width="959" height="539" alt="Screenshot 2026-11-25 175146" src="https://github.com/user-attachments/assets/c037537b-4f87-47db-9957-e9a4b8cf82c1" />


Mobile Overview
<img width="592" height="1280" alt="WhatsApp Image 2026-11-25 at 5 54 20 PM" src="https://github.com/user-attachments/assets/91f69010-042c-471c-8bf1-37e25928e80e" />
<img width="592" height="1280" alt="WhatsApp Image 2026-11-25 at 5 54 20 PM (1)" src="https://github.com/user-attachments/assets/bdfbfbd7-8b26-4c55-9aa0-20e6809ecf44" />
<img width="592" height="1280" alt="WhatsApp Image 2026-11-25 at 5 54 21 PM (2)" src="https://github.com/user-attachments/assets/a31fceb7-5480-4325-9cc2-434dbbc174da" />
<img width="592" height="1280" alt="WhatsApp Image 2026-11-25 at 5 54 21 PM" src="https://github.com/user-attachments/assets/60fe563d-6216-402a-9451-155e7d2d273c" />


## Known limitations

- Local development uses Docker PostgreSQL; production requires Cloud SQL credentials and IAM configuration.

