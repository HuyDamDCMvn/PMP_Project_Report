import sys
import unittest
from pathlib import Path
import pandas as pd
import openpyxl

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from build_dashboard_data import validate_family_source, equivalence_links


class SourceIntegrityTests(unittest.TestCase):
    def test_source_and_metadata(self):
        p = ROOT / 'RawSource/Family_Upload_vs_Annotation_Tickets_Checked.xlsx'
        frame = pd.read_excel(p, sheet_name='Family_vs_Tickets')
        scope = frame[frame['Project Name'] == 'DCMvn_Annotation Project']
        matrix = pd.read_excel(ROOT / 'RawSource/Annotation_Ticket_User_Matrix_Checked.xlsx', sheet_name='Matrix')
        validate_family_source(scope, matrix)
        self.assertEqual(len(frame), 2044)
        self.assertEqual(len(scope), 2002)
        row = scope[scope['Family Name'] == '434_PF_CO_cCap_Mapress'].iloc[0]
        self.assertEqual(row['Ticket_Count'], 1)
        w = openpyxl.load_workbook(p, read_only=True, data_only=True)
        # Workbook metadata retains the earlier 2043-row snapshot; actual
        # Family_vs_Tickets rows above are authoritative, not this cached note.
        self.assertEqual(w['Meta']['B15'].value, 2043)
        self.assertEqual(w['Meta']['B31'].value, 1)  # Historical draft note.
        w.close()
        w = openpyxl.load_workbook(ROOT / 'RawSource/Annotation_RFA_equivalence_Checked.xlsx', read_only=True, data_only=True)
        rows = list(w['Equivalence'].values)[1:]
        self.assertEqual(w['Meta']['B5'].value, len(rows))
        for r in range(2, 5):
            decision = w['Summary'].cell(r, 1).value
            self.assertEqual(w['Summary'].cell(r, 2).value, sum(x[5] == decision for x in rows))
        w.close()

    def test_bad_count_fanout_and_key(self):
        row = {'Family Name': 'Cap', 'Ticket_IDs': '72579', 'Ticket_Count': 1}
        matrix = pd.DataFrame([{'Ticket ID': 72579}])
        for field, value in [('Ticket_Count', 2), ('Ticket_IDs', '999')]:
            with self.subTest(field=field), self.assertRaises(ValueError):
                validate_family_source(pd.DataFrame([{**row, field: value}]), matrix)
        for second in [row, {**row, 'Family Name': 'Other'}]:
            with self.assertRaises(ValueError):
                validate_family_source(pd.DataFrame([row, second]), matrix)

    def test_weight_columns_are_optional_and_ignored(self):
        row = {'Family Name': 'Cap', 'Ticket_IDs': '72579', 'Ticket_Count': 1}
        matrix = pd.DataFrame([{'Ticket ID': 72579}])
        validate_family_source(pd.DataFrame([row]), matrix)
        validate_family_source(pd.DataFrame([{**row, 'Weigh Score Sum': 999}]), matrix)

    def test_equivalence_ticket_mismatch(self):
        row = {'Uploaded family': 'Cap', 'Equivalent TIDP family': 'Plan', 'In TIDP (Y/N)': 'Y', 'Ticket ID': '72578'}
        with self.assertRaisesRegex(ValueError, 'Ticket ID differs'):
            equivalence_links(pd.DataFrame([row]), {'cap': {'id': 'F1', 'ticketIds': [72579]}}, {'plan'})
