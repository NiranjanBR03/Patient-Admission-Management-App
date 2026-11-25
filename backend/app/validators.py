import re
from datetime import date, datetime
from zoneinfo import ZoneInfo

GENDERS = ("Female", "Male", "Other")
WARDS = ("General", "ICU", "Emergency", "Maternity", "Pediatrics")
DEPARTMENTS = ("Cardiology", "Neurology", "Orthopedics", "Pediatrics", "General Medicine", "Obstetrics", "Gynecology")
DOCTORS = ("Dr. Sharma", "Dr. Patel", "Dr. Mehta", "Dr. Rao", "Dr. Singh")
STATUSES = ("Admitted", "Discharged")
WARD_DEPARTMENTS = {
    "General": {"Cardiology", "Neurology", "Orthopedics", "General Medicine"},
    "ICU": {"Cardiology", "Neurology", "General Medicine"},
    "Emergency": {"Cardiology", "Neurology", "Orthopedics", "General Medicine"},
    "Maternity": {"Obstetrics", "Gynecology", "Pediatrics"},
    "Pediatrics": {"Pediatrics"},
}
NAME_RE = re.compile(r"^[A-Za-z]+(?:[ '-][A-Za-z]+)*$")
IST = ZoneInfo("Asia/Kolkata")


def today_ist():
    return datetime.now(IST).date()


def title_case_name(value):
    return " ".join(part.capitalize() for part in value.strip().split())


def validate_patient_payload(payload):
    errors = {}
    name = str(payload.get("name", "")).strip()
    if not name:
        errors["name"] = "Name is required"
    elif len(name) < 2:
        errors["name"] = "Name must be at least 2 characters"
    elif len(name) > 50:
        errors["name"] = "Name must be 50 characters or fewer"
    elif not NAME_RE.fullmatch(name):
        errors["name"] = "Name may contain letters, spaces, hyphens and apostrophes only"

    raw_age = payload.get("age")
    if raw_age in (None, ""):
        errors["age"] = "Age is required"
    elif isinstance(raw_age, bool) or not re.fullmatch(r"\d+", str(raw_age).strip()):
        errors["age"] = "Age must be an integer"
    elif not 0 <= int(raw_age) <= 120:
        errors["age"] = "Age must be between 0 and 120"

    for field, allowed in (("gender", GENDERS), ("ward", WARDS), ("department", DEPARTMENTS), ("doctor", DOCTORS)):
        value = payload.get(field)
        if not value:
            errors[field] = f"{field.capitalize()} is required"
        elif value not in allowed:
            errors[field] = f"Invalid {field}"

    ward, department = payload.get("ward"), payload.get("department")
    if ward in WARD_DEPARTMENTS and department and department not in WARD_DEPARTMENTS[ward]:
        errors["department"] = f"{department} is not available in the {ward} ward"

    raw_date = payload.get("admission_date")
    if not raw_date:
        errors["admission_date"] = "Admission date is required"
    else:
        try:
            admission_date = date.fromisoformat(raw_date)
            if admission_date > today_ist():
                errors["admission_date"] = "Admission date cannot be in the future"
        except (TypeError, ValueError):
            errors["admission_date"] = "Admission date must be a valid date"

    status = payload.get("status", "Admitted")
    if status not in STATUSES:
        errors["status"] = "Status must be Admitted or Discharged"
    return errors

