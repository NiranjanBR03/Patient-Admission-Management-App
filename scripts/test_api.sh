#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://127.0.0.1:5000/api}"
TODAY="$(TZ=Asia/Kolkata date +%F)"
FUTURE="$(TZ=Asia/Kolkata date -d '+1 day' +%F 2>/dev/null || date -v+1d +%F)"

curl -fsS "$BASE_URL/health"
curl -fsS -X POST "$BASE_URL/patients" -H 'Content-Type: application/json' -d "{\"name\":\"Rahul Kumar\",\"age\":35,\"gender\":\"Male\",\"ward\":\"General\",\"department\":\"Cardiology\",\"doctor\":\"Dr. Sharma\",\"admission_date\":\"$TODAY\",\"status\":\"Admitted\"}"
curl -sS -o /dev/null -w '%{http_code}\n' -X POST "$BASE_URL/patients" -H 'Content-Type: application/json' -d '{"name":"","age":35,"gender":"Male","ward":"General","department":"Cardiology","doctor":"Dr. Sharma","admission_date":"2026-01-01","status":"Admitted"}'
curl -sS -o /dev/null -w '%{http_code}\n' -X POST "$BASE_URL/patients" -H 'Content-Type: application/json' -d '{"name":"Rahul 2","age":35,"gender":"Male","ward":"General","department":"Cardiology","doctor":"Dr. Sharma","admission_date":"2026-01-01","status":"Admitted"}'
curl -sS -o /dev/null -w '%{http_code}\n' -X POST "$BASE_URL/patients" -H 'Content-Type: application/json' -d '{"name":"Rahul Kumar","age":121,"gender":"Male","ward":"General","department":"Cardiology","doctor":"Dr. Sharma","admission_date":"2026-01-01","status":"Admitted"}'
curl -sS -o /dev/null -w '%{http_code}\n' -X POST "$BASE_URL/patients" -H 'Content-Type: application/json' -d "{\"name\":\"Rahul Kumar\",\"age\":35,\"gender\":\"Male\",\"ward\":\"General\",\"department\":\"Cardiology\",\"doctor\":\"Dr. Sharma\",\"admission_date\":\"$FUTURE\",\"status\":\"Admitted\"}"
curl -sS -o /dev/null -w '%{http_code}\n' -X POST "$BASE_URL/patients" -H 'Content-Type: application/json' -d '{"name":"Rahul Kumar","age":35,"gender":"Male","ward":"Unknown","department":"Cardiology","doctor":"Dr. Sharma","admission_date":"2026-01-01","status":"Admitted"}'
curl -sS -o /dev/null -w '%{http_code}\n' "$BASE_URL/patients/999999"
echo "Manual edit, discharge, and delete: use the returned patient id with PUT, PATCH /patients/{id}/discharge, and DELETE /patients/{id}."

