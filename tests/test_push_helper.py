"""Run the helper ONLY against isolated temporary Git fixtures, never the working repo."""
import hashlib
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HELPER = ROOT / 'scripts/push_rawsource_local.ps1'

@unittest.skipUnless(shutil.which('powershell'), 'Windows PowerShell required')
class PushSafetyTests(unittest.TestCase):
    def test_readonly_dryrun_and_preflight_failure_preserve_repo(self):
        with tempfile.TemporaryDirectory(prefix='pmp-helper-test-') as directory:
            repo = Path(directory)
            def git(*args):
                return subprocess.check_output(['git', '-C', str(repo), *args], text=True).strip()
            git('init', '-b', 'main')
            git('config', 'user.name', 'Fixture')
            git('config', 'user.email', 'fixture@example.invalid')
            (repo / 'RawSource').mkdir()
            source = repo / 'RawSource/Family_Upload_vs_Annotation_Tickets_Checked.xlsx'
            source.write_bytes(b'fixture; not a real workbook')
            git('add', '.')
            git('commit', '-m', 'fixture')
            sentinel = repo / 'sentinel.txt'
            sentinel.write_text('preserve staged sentinel', encoding='utf-8')
            git('add', 'sentinel.txt')
            def snapshot():
                return (git('rev-parse', 'HEAD'), git('symbolic-ref', 'HEAD'), git('status', '--porcelain'),
                        hashlib.sha256((repo/'.git/index').read_bytes()).hexdigest(), source.read_bytes())
            before = snapshot()
            command = ['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', str(HELPER), '-Repo', str(repo), '-DryRun', '-Files', str(source)]
            dry = subprocess.run(command, capture_output=True, text=True)
            self.assertEqual(dry.returncode, 0, dry.stderr)
            self.assertEqual(snapshot(), before)
            failed = subprocess.run(command[:-1] + [str(repo/'missing.xlsx')], capture_output=True, text=True)
            self.assertNotEqual(failed.returncode, 0)
            self.assertEqual(snapshot(), before)
            dirty = subprocess.run(['powershell','-NoProfile','-ExecutionPolicy','Bypass','-File',str(HELPER),'-Repo',str(repo),'-Execute','-Files',str(source)], capture_output=True,text=True)
            self.assertNotEqual(dirty.returncode, 0)
            self.assertEqual(snapshot(), before)

if __name__ == '__main__':
    unittest.main()
