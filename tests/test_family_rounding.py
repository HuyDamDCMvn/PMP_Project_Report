import unittest
from decimal import Decimal
from scripts.build_family_role_hours import nearest_quarter


class FamilyRoundingTests(unittest.TestCase):
    def test_nearest_quarter(self):
        for source, expected in [('3.4966666667', '3.5'), ('2.4966666667', '2.5'), ('0.1249', '0'), ('0.125', '0.25'), ('0.375', '0.5'), ('0.625', '0.75'), ('0.875', '1')]:
            self.assertEqual(nearest_quarter(Decimal(source)), Decimal(expected))
