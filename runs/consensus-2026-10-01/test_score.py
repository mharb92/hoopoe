"""Tests for score.py: python3 -m unittest test_score (run from this folder)."""
import unittest
from score import letters, marks_differ, rom_lvq, outcome, control_rates

OURS = {'our_romanization': 'beet', 'our_vowelled': 'بَيْت', 'english': 'house'}


def run(rom='beet', vow='بَيْت', conf='high', meaning='yes', dialect='palestinian', alt=''):
    return {'romanization': rom, 'vowelled_arabic': vow, 'pronunciation_confidence': conf,
            'meaning_ok': meaning, 'dialect': dialect, 'palestinian_alternative': alt}


class Matching(unittest.TestCase):
    def test_letters_keep_shadda_drop_vowels(self):
        self.assertEqual(letters('قَدِّيش'), letters('قدّيش'))
        self.assertNotEqual(letters('قَدِّيش'), letters('قديش'))

    def test_long_vowel_spellings_equal(self):
        self.assertEqual(letters('عَلَيْكُم'), letters('عَلِيكُم'))
        self.assertFalse(marks_differ('عَلَيْكُم', 'عَلِيكُم'))

    def test_respelling_is_a_difference(self):
        self.assertNotEqual(letters('ثالِث'), letters('تالِت'))
        self.assertNotEqual(letters('أنا'), letters('انا'))

    def test_punctuation_tatweel_sukun_ignored(self):
        self.assertEqual(letters('السَّاعَة كَمْ؟'), letters('السّاعة  كم'))
        self.assertEqual(letters('كـتاب'), letters('كتاب'))

    def test_superscript_alif(self):
        self.assertEqual(letters('هٰدا'), letters('هادا'))
        self.assertEqual(letters('عَلىٰ'), letters('على'))

    def test_short_vowel_difference_reported(self):
        self.assertTrue(marks_differ('سَنَة', 'سَنِة'))
        self.assertFalse(marks_differ('سَنَة', 'سَنَة'))

    def test_lvq(self):
        self.assertTrue(rom_lvq('biit', 'beet'))
        self.assertTrue(rom_lvq('huun', 'hoon'))
        self.assertFalse(rom_lvq('beet', 'beet'))
        self.assertFalse(rom_lvq('bet', 'beet'))


class Outcomes(unittest.TestCase):
    def test_A(self):
        self.assertEqual(outcome(OURS, [run(), run(), run()])['outcome'], 'A')

    def test_A_tolerates_short_vowel_marks(self):
        self.assertEqual(outcome(OURS, [run(), run(vow='بِيت'), run()])['outcome'], 'A')

    def test_B(self):
        self.assertEqual(outcome(OURS, [run(), run(), run(rom='biit', vow='بِيت')])['outcome'], 'B')

    def test_two_lvq_is_not_B(self):
        self.assertEqual(outcome(OURS, [run(), run(rom='biit'), run(rom='biit')])['outcome'], 'E')

    def test_C(self):
        r = run(rom='bayt', vow='بَيت')
        self.assertEqual(outcome(OURS, [r, r, r])['outcome'], 'C')

    def test_D_meaning(self):
        self.assertEqual(outcome(OURS, [run(), run(meaning='partly'), run()])['outcome'], 'D')

    def test_D_dialect_and_alternative(self):
        self.assertEqual(outcome(OURS, [run(), run(dialect='other_levantine'), run()])['outcome'], 'D')
        self.assertEqual(outcome(OURS, [run(), run(alt='دار'), run()])['outcome'], 'D')

    def test_msa_ok_only_when_labelled(self):
        self.assertEqual(outcome(OURS, [run(), run(dialect='msa'), run()])['outcome'], 'D')
        labelled = dict(OURS, english='house (formal)')
        self.assertEqual(outcome(labelled, [run(), run(dialect='msa'), run()])['outcome'], 'A')

    def test_D_beats_C(self):
        r = run(rom='bayt', vow='بَيت')
        self.assertEqual(outcome(OURS, [r, r, dict(r, meaning_ok='no')])['outcome'], 'D')

    def test_low_confidence_is_E(self):
        self.assertEqual(outcome(OURS, [run(), run(conf='low'), run()])['outcome'], 'E')
        r = run(rom='bayt', vow='بَيت')
        self.assertEqual(outcome(OURS, [r, r, dict(r, pronunciation_confidence='low')])['outcome'], 'E')

    def test_unsure_dialect_blocks_raise(self):
        self.assertEqual(outcome(OURS, [run(), run(dialect='unsure'), run()])['outcome'], 'E')

    def test_split_is_E(self):
        self.assertEqual(outcome(OURS, [run(), run(rom='bayt'), run(rom='biit')])['outcome'], 'E')


class Controls(unittest.TestCase):
    def test_rates(self):
        rows = [{'outcome': 'A', 'unanimous': True, 'unanimous_matches_ours': True},
                {'outcome': 'B', 'unanimous': False, 'unanimous_matches_ours': False},
                {'outcome': 'C', 'unanimous': True, 'unanimous_matches_ours': False},
                {'outcome': 'E', 'unanimous': False, 'unanimous_matches_ours': False}]
        r = control_rates(rows)
        self.assertEqual(r['ab'], 0.5)
        self.assertEqual(r['unanimous_match'], 0.5)


if __name__ == '__main__':
    unittest.main()
