"""Tests for score.py: python3 -m unittest test_score (run from this folder)."""
import unittest
from score import letters, marks_differ, rom_lvq, outcome, control_rates, sound, proposal, issue

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

    def test_sound_forgives_notation_short_e_o_helping_vowel(self):
        for a, b in [('taalit', 'taalet'), ('la7aalu', 'la7aalo'), ('Sifir', 'Sifr'), ('shamis', 'shams'),
                     ('ibin 3amme', 'ibn 3amme'), ('shughul', 'shughl'), ('ysallmak', 'yisallmak'),
                     ("3al-wa't", "3a il-wa't"), ("3al-wa't", "3a l-wa't"), ('allaah ma3ak', 'allah ma3ak'),
                     ('khubiz w mili7', 'khubz u-mili7'), ('3ala raasi w 3eeni', '3ala raasi w-3eeni'),
                     ('mabruuk il-beet il-jdiid', 'mabruuk il-beet ij-jdiid')]:
            self.assertEqual(sound(a), sound(b), (a, b))

    def test_sound_keeps_real_differences(self):
        for a, b in [('jamal', 'jamaal'), ('7ubb', '7abb'), ('niji7', 'naja7'), ('beet', 'biit'),
                     ("'ahwe", 'qahwe'), ('thaani', 'taani'), ('Sifr', 'Sfr'), ('saar', 'Saar'), ('la', 'laa')]:
            self.assertNotEqual(sound(a), sound(b), (a, b))

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


class NewRules(unittest.TestCase):
    def test_A_with_sound_equivalence(self):
        k = dict(OURS, our_romanization='taalit', our_vowelled='تالِت')
        self.assertEqual(outcome(k, [run('taalit', 'تالِت'), run('taalet', 'تالِت'), run('taalit', 'تالِت')])['outcome'], 'A')

    def test_A2_two_independent_runs_match(self):
        self.assertEqual(outcome(OURS, [run(rom='bayt'), run(), run()])['outcome'], 'A2')
        self.assertEqual(outcome(OURS, [run(), run(rom='bayt'), run()])['outcome'], 'E')   # Claude + one is not enough

    def test_A2_needs_clean(self):
        self.assertEqual(outcome(OURS, [run(rom='bayt', conf='low'), run(), run()])['outcome'], 'E')

    def test_D2_two_runs_say_not_palestinian(self):
        self.assertEqual(outcome(OURS, [run(dialect='msa', alt='دار'), run(alt='دار'), run()])['outcome'], 'D2')
        self.assertEqual(outcome(OURS, [run(dialect='msa'), run(), run()])['outcome'], 'D')


class Proposals(unittest.TestCase):
    def test_two_match_ours(self):
        p = proposal(OURS, [run(), run(rom='bayt', vow='بَيت'), run()])
        self.assertEqual((p['romanization'], p['why']), ('beet', '2 of 3 models match ours'))

    def test_two_agree_on_other(self):
        p = proposal(OURS, [run(rom='bayt', vow='بَيت'), run(), run(rom='bayt', vow='بَيت')])
        self.assertEqual((p['romanization'], p['vowelled'], p['why']), ('bayt', 'بَيت', '2 of 3 models agree on this form, not ours'))

    def test_no_majority_keeps_ours(self):
        p = proposal(OURS, [run(rom='bayt'), run(rom='biit'), run(rom='bit')])
        self.assertEqual((p['romanization'], p['why']), ('beet', 'no majority: ours shown, no model matches it'))

    def test_letters_only(self):
        p = proposal(OURS, [run(vow='بيته'), run(vow='بيته'), run()])
        self.assertEqual((p['vowelled'], p['why']), ('بيته', '2 of 3 models agree on this form, not ours'))


class Issues(unittest.TestCase):
    def label(self, runs):
        return issue(OURS, runs, outcome(OURS, runs))

    def test_labels(self):
        self.assertEqual(self.label([run(), run(rom='baat'), run(rom='bit')]), 'vowels')
        self.assertEqual(self.label([run(), run(rom='beet'), run(rom='beek')]), 'consonants')
        self.assertEqual(self.label([run(), run(rom='beeth'), run()]), "q or ', th or t, or doubling")
        self.assertEqual(self.label([run(), run(vow='بيته'), run()]), 'Arabic letters only')
        self.assertEqual(self.label([run(), run(alt='دار'), run()]), 'one model says not Palestinian')


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
