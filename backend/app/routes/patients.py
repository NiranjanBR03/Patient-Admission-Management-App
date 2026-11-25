from datetime import date

from flask import Blueprint, jsonify, request
from sqlalchemy import func

from app import db
from app.models import Patient
from app.validators import today_ist, title_case_name

patients_bp = Blueprint("patients", __name__)


def ok(data, status=200, warnings=None):
    body = {"success": True, "data": data}
    if warnings:
        body["warnings"] = warnings
    return jsonify(body), status


def invalid(errors, status=422):
    return jsonify({"success": False, "errors": errors}), status


def find_patient(patient_id):
    patient = db.session.get(Patient, patient_id)
    if not patient:
        return None, (jsonify({"success": False, "error": "Patient not found"}), 404)
    return patient, None


def save_patient(patient, payload):
    patient.name = title_case_name(payload["name"])
    patient.age = int(payload["age"])
    patient.gender = payload["gender"]
    patient.ward = payload["ward"]
    patient.department = payload["department"]
    patient.doctor = payload["doctor"]
    patient.admission_date = date.fromisoformat(payload["admission_date"])
    patient.status = payload.get("status", "Admitted")
    if patient.status == "Admitted":
        patient.discharged_at = None
    elif not patient.discharged_at:
        patient.discharged_at = today_ist()


def duplicate_warning(payload, exclude_id=None):
    query = Patient.query.filter(
        func.lower(Patient.name) == title_case_name(payload.get("name", "")).lower(),
        Patient.age == int(payload.get("age")),
        Patient.admission_date == date.fromisoformat(payload.get("admission_date")),
    )
    if exclude_id:
        query = query.filter(Patient.id != exclude_id)
    return ["A patient with the same name, age and admission date already exists."] if query.first() else []


@patients_bp.get("")
def list_patients():
    query = Patient.query
    search = (request.args.get("q") or request.args.get("search") or "").strip()
    for field in ("ward", "department", "doctor", "status"):
        value = request.args.get(field, "").strip()
        if value:
            query = query.filter(getattr(Patient, field) == value)
    if search:
        query = query.filter(func.lower(Patient.name).contains(search.lower()))
    total = query.count()
    patients = query.order_by(Patient.admission_date.desc(), Patient.created_at.desc()).all()
    all_patients = Patient.query.order_by(Patient.admission_date.desc(), Patient.created_at.desc()).all()
    stats = {"total": len(all_patients), "admitted": sum(p.status == "Admitted" for p in all_patients), "discharged": sum(p.status == "Discharged" for p in all_patients)}
    return ok({"patients": [p.to_dict() for p in patients], "total": total, "stats": stats, "recent_admissions": [p.to_dict() for p in all_patients[:5]]})


@patients_bp.get("/<int:patient_id>")
def get_patient(patient_id):
    patient, error = find_patient(patient_id)
    return error or ok(patient.to_dict())


@patients_bp.post("")
def create_patient():
    payload = request.get_json(silent=True) or {}
    errors = Patient.validate_payload(payload)
    if errors:
        return invalid(errors)
    patient = Patient()
    save_patient(patient, payload)
    db.session.add(patient)
    db.session.commit()
    return ok(patient.to_dict(), 201, duplicate_warning(payload, patient.id))


@patients_bp.put("/<int:patient_id>")
def update_patient(patient_id):
    patient, error = find_patient(patient_id)
    if error:
        return error
    payload = request.get_json(silent=True) or {}
    errors = Patient.validate_payload(payload)
    if errors:
        return invalid(errors)
    save_patient(patient, payload)
    db.session.commit()
    return ok(patient.to_dict(), warnings=duplicate_warning(payload, patient_id))


@patients_bp.delete("/<int:patient_id>")
def delete_patient(patient_id):
    patient, error = find_patient(patient_id)
    if error:
        return error
    db.session.delete(patient)
    db.session.commit()
    return ok({"id": patient_id, "message": "Patient deleted successfully."})


@patients_bp.patch("/<int:patient_id>/discharge")
def discharge_patient(patient_id):
    patient, error = find_patient(patient_id)
    if error:
        return error
    patient.status = "Discharged"
    patient.discharged_at = today_ist()
    db.session.commit()
    return ok(patient.to_dict())

