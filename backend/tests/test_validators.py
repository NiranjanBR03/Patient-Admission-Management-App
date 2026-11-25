import unittest
from datetime import date, timedelta

from app.validators import validate_patient_payload


def valid(**changes):
    value = {"name": "Rahul Kumar", "age": 35, "gender": "Male", "ward": "General", "department": "Cardiology", "doctor": "Dr. Sharma", "admission_date": date.today().isoformat(), "status": "Admitted"}
    value.update(changes)
    return value


class PatientValidatorTests(unittest.TestCase):
    def test_valid_patient(self): self.assertEqual(validate_patient_payload(valid()), {})
    def test_empty_name(self): self.assertIn("name", validate_patient_payload(valid(name="")))
    def test_name_with_digits(self): self.assertIn("name", validate_patient_payload(valid(name="Rahul 2")))
    def test_hyphen_and_apostrophe_name(self): self.assertNotIn("name", validate_patient_payload(valid(name="Mary-Jane O'Brien")))
    def test_age_range(self): self.assertIn("age", validate_patient_payload(valid(age=121)))
    def test_invalid_gender(self): self.assertIn("gender", validate_patient_payload(valid(gender="Unknown")))
    def test_future_date(self): self.assertIn("admission_date", validate_patient_payload(valid(admission_date=(date.today() + timedelta(days=1)).isoformat())))
    def test_bad_ward_department_mapping(self): self.assertIn("department", validate_patient_payload(valid(ward="Maternity", department="Cardiology")))
    def test_invalid_status(self): self.assertIn("status", validate_patient_payload(valid(status="Pending")))


if __name__ == "__main__":
    unittest.main()

