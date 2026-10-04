import unittest
from decimal import Decimal
from scripts.build_weekly_hours import parse_event, quarter

class TimeHistoryTests(unittest.TestCase):
    def event(self, field, value):
        return parse_event({'field': {'name': field}, 'old_value': value})

    def test_add_delete_and_work_date(self):
        add = self.event('Time allocated', '25.9.2026: 4.5 h.')
        delete = self.event('Time allocated Deleted', '2026-09-25: 2,50 h.')
        self.assertEqual(add[0], delete[0])
        self.assertEqual(add[1] + delete[1], Decimal('2'))

    def test_floor_after_netting(self):
        self.assertEqual(quarter(Decimal('316.00666667')), Decimal('316'))
        self.assertEqual(quarter(Decimal('2.5')), Decimal('2.5'))
        self.assertEqual(quarter(Decimal('1.01') - Decimal('0.51')), Decimal('0.5'))

    def test_unknown_time_format_is_not_zero(self):
        with self.assertRaises(ValueError):
            self.event('Time allocated Deleted', 'unknown')
        self.assertIsNone(self.event('status', 'closed'))

if __name__ == '__main__':
    unittest.main()
