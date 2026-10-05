import sys
import unittest
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from build_dashboard_data import equivalence_links


class EquivalenceTests(unittest.TestCase):
    def setUp(self):
        self.row = {"Uploaded family": "Upload.rfa", "Equivalent TIDP family": "Plan.rfa",
                    "In TIDP (Y/N)": "Y", "Decision": "proposed", "Confidence %": 64,
                    "Method": "similarity", "Ticket ID": "5, 8"}
        self.families = {"upload": {"id": "F1", "ticketIds": [5, 8]}}

    def test_temporary_approval_keeps_original_decision_and_evidence(self):
        link = equivalence_links(pd.DataFrame([self.row]), self.families, {"plan"})["plan"]
        self.assertEqual(link["familyId"], "F1")
        self.assertEqual(link["sourceDecision"], "proposed")
        self.assertEqual(link["ticketIds"], [5, 8])
        self.assertEqual(link["sourceConfidence"], 64)
        self.assertEqual(link["sourceRow"], 2)

    def test_missing_endpoint_duplicate_and_conflict_fail_closed(self):
        invalid = [{**self.row, "Uploaded family": "Other project"},
                   {**self.row, "Equivalent TIDP family": "Unknown"},
                   {**self.row, "In TIDP (Y/N)": "N"}]
        for row in invalid:
            with self.subTest(row=row), self.assertRaises(ValueError):
                equivalence_links(pd.DataFrame([row]), self.families, {"plan"})
        with self.assertRaises(ValueError):
            equivalence_links(pd.DataFrame([self.row, self.row]), self.families, {"plan"})
        with self.assertRaises(ValueError):
            equivalence_links(pd.DataFrame([self.row]), {**self.families, "plan": {"id": "F2"}}, {"plan"})


if __name__ == "__main__":
    unittest.main()
