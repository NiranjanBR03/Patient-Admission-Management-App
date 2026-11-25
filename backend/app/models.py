from datetime import datetime

from app import db
from app.validators import validate_patient_payload


class Patient(db.Model):
    __tablename__ = "patients"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(30), nullable=False)
    ward = db.Column(db.String(60), nullable=False)
    department = db.Column(db.String(80), nullable=False)
    doctor = db.Column(db.String(80), nullable=False)
    admission_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="Admitted")
    discharged_at = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    @staticmethod
    def validate_payload(payload):
        return validate_patient_payload(payload)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "age": self.age,
            "gender": self.gender,
            "ward": self.ward,
            "department": self.department,
            "doctor": self.doctor,
            "admission_date": self.admission_date.isoformat(),
            "status": self.status,
            "discharged_at": self.discharged_at.isoformat() if self.discharged_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

