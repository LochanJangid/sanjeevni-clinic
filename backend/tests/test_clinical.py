import unittest
from unittest.mock import patch
from routers import clinical

class ClinicalUnitTests(unittest.TestCase):
    def test_triage_detects_emergency_chest_pain(self):
        req = clinical.SymptomTriageRequest(
            symptoms=["Severe chest pain", "sweating"],
            description="Radiating to left shoulder and arm",
            has_chest_pain=True
        )
        result = clinical.evaluate_symptom_triage(req)
        self.assertTrue(result["is_emergency"])
        self.assertEqual(result["urgency_level"], "EMERGENCY - RED FLAG")
        self.assertEqual(result["specialty_recommended"], "Cardiology")
        self.assertGreater(len(result["emergency_reasons"]), 0)

    def test_triage_matches_dermatology_for_rash(self):
        req = clinical.SymptomTriageRequest(
            symptoms=["Skin rash", "severe itching"],
            description="Red patches with dry eczema flaking on forearms"
        )
        result = clinical.evaluate_symptom_triage(req)
        self.assertFalse(result["is_emergency"])
        self.assertEqual(result["specialty_recommended"], "Dermatology")
        self.assertIn("Contact Dermatitis / Eczema", result["suspected_conditions"])

    def test_triage_matches_pediatrics_for_child(self):
        req = clinical.SymptomTriageRequest(
            symptoms=["High fever", "cough"],
            age_years=4
        )
        result = clinical.evaluate_symptom_triage(req)
        self.assertEqual(result["specialty_recommended"], "Pediatrics")

    def test_pharmacy_empty_cart_raises_400(self):
        req = clinical.PharmacyOrderRequest(
            items=[],
            delivery_address="123 Hospital Lane",
            phone="9876543210"
        )
        with patch("routers.clinical.authenticated_token_claims", return_value={"id": 1, "role": "patient"}):
            with self.assertRaises(clinical.HTTPException) as ctx:
                clinical.place_pharmacy_order(req, "Bearer dummy")
            self.assertEqual(ctx.exception.status_code, 400)

if __name__ == "__main__":
    unittest.main()
