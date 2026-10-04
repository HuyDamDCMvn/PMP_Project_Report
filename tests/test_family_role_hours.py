import unittest
from decimal import Decimal
from scripts.build_family_role_hours import attribute

class AttributionTests(unittest.TestCase):
    def event(self, user, hours, stamp):
        return {'user': user, 'hours': hours, 'workDate': '2026-09-01', 'changedAt': stamp}

    def test_deletion_by_other_person_reverses_original_author(self):
        totals, gaps = attribute([self.event('mm','7.5','2026-09-01'), self.event('dc','-7.5','2026-09-02')], '2026-09-30')
        self.assertEqual(sum(totals.values(), Decimal(0)), 0)
        self.assertEqual(gaps, 0)

    def test_ambiguous_deletion_is_not_attributed_to_deleter(self):
        totals, gaps = attribute([self.event('a','2','2026-09-01'), self.event('b','2','2026-09-02'), self.event('c','-2','2026-09-03')], '2026-09-30')
        self.assertEqual(gaps, 1)
        self.assertNotIn('c', totals)

    def test_later_edit_excluded_and_repeated_work_preserved(self):
        totals, gaps = attribute([self.event('a','2','2026-09-01'), self.event('a','2','2026-09-02'), self.event('a','-2','2026-10-01')], '2026-09-30')
        self.assertEqual(totals['a'], 4)
        self.assertEqual(gaps, 0)

    def test_deleted_display_precision_preserves_signed_net(self):
        totals, gaps = attribute([self.event('a','2.8333333333333','2026-09-01'), self.event('a','-2.83','2026-09-02')], '2026-09-30')
        self.assertEqual(totals['a'], Decimal('0.0033333333333'))
        self.assertEqual(gaps, 0)
