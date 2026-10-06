"""Run the helper ONLY against isolated temporary Git fixtures, never the working repo."""
import os
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

    def test_branch_input_preflight_and_remote_advance(self):
        with tempfile.TemporaryDirectory(prefix='pmp-isolated-') as directory:
            root=Path(directory); repo=root/'checkout'; remote=root/'remote.git'
            def git(path,*args):
                return subprocess.check_output(['git','-C',str(path),*args],text=True).strip()
            repo.mkdir();git(repo,'init','-b','main');git(repo,'config','user.name','Fixture');git(repo,'config','user.email','fixture@example.invalid')
            (repo/'RawSource').mkdir();source=repo/'RawSource/Family_Upload_vs_Annotation_Tickets_Checked.xlsx';source.write_bytes(b'isolated fixture')
            git(repo,'add','.');git(repo,'commit','-m','fixture');subprocess.check_call(['git','init','--bare',str(remote)],stdout=subprocess.DEVNULL)
            git(repo,'remote','add','origin',str(remote));git(repo,'push','origin','main')
            def snapshot():
                return (git(repo,'rev-parse','HEAD'),git(repo,'status','--porcelain'),(repo/'.git/index').read_bytes(),source.read_bytes())
            before=snapshot()
            base=['powershell','-NoProfile','-ExecutionPolicy','Bypass','-File',str(HELPER),'-Repo',str(repo)]
            for args in [['-Branch','other','-DryRun','-Files',str(source)],['-Execute','-Files',str(root/'missing.xlsx')],['-Execute','-Files',str(HELPER)]]:
                result=subprocess.run(base+args,capture_output=True,text=True)
                self.assertNotEqual(result.returncode,0);self.assertEqual(snapshot(),before)
            other=root/'other';subprocess.check_call(['git','clone','--branch','main',str(remote),str(other)],stdout=subprocess.DEVNULL)
            git(other,'config','user.name','Fixture');git(other,'config','user.email','fixture@example.invalid');(other/'advance').write_text('advance')
            git(other,'add','.');git(other,'commit','-m','advance');git(other,'push','origin','main')
            result=subprocess.run(base+['-Execute','-Files',str(source)],capture_output=True,text=True)
            self.assertNotEqual(result.returncode,0);self.assertIn('Remote advanced',result.stderr);self.assertEqual(snapshot(),before)

    def test_candidate_gates_allowlist_noop_and_publication_are_isolated(self):
        with tempfile.TemporaryDirectory(prefix='pmp-candidate-gates-') as directory:
            root=Path(directory); repo=root/'checkout'; remote=root/'remote.git';repo.mkdir()
            def git(path,*args):
                return subprocess.check_output(['git','-C',str(path),*args],text=True).strip()
            git(repo,'init','-b','main');git(repo,'config','user.name','Fixture');git(repo,'config','user.email','fixture@example.invalid')
            for name in ['RawSource','scripts','tests','public/data']:(repo/name).mkdir(parents=True,exist_ok=True)
            (repo/'.gitignore').write_text('__pycache__/\n')
            source=repo/'RawSource/Family_Upload_vs_Annotation_Tickets_Checked.xlsx';source.write_bytes(b'old')
            incoming=root/source.name;incoming.write_bytes(b'new')
            # Stub only fixture gates: test real helper orchestration, not workbook semantics.
            (repo/'scripts/build_dashboard_data.py').write_text("import os,sys\nfrom pathlib import Path\nif os.environ.get('PMP_FAIL')=='data':sys.exit(1)\nif os.environ.get('PMP_EXTRA'):Path('unexpected.txt').write_text('reject')\n",encoding='utf-8')
            (repo/'tests/test_gate.py').write_text("import os,unittest\nclass Gate(unittest.TestCase):\n def test_gate(self):self.assertNotEqual(os.environ.get('PMP_FAIL'),'python')\n",encoding='utf-8')
            (repo/'scripts/validate_bundle.mjs').write_text("process.exit(process.env.PMP_FAIL==='bundle'?1:0);",encoding='utf-8')
            for name in ['dashboard-data','family-role-hours','weekly-hours','bundle-manifest']:(repo/f'public/data/{name}.json').write_text('{}')
            git(repo,'add','.');git(repo,'commit','-m','fixture');subprocess.check_call(['git','init','--bare',str(remote)],stdout=subprocess.DEVNULL)
            git(repo,'remote','add','origin',str(remote));git(repo,'push','origin','main')
            driver=root/'driver.ps1';driver.write_text("param([string]$Repo,[string]$InputFile,[string]$Helper,[switch]$Publish)\nfunction global:npm { if ($env:PMP_FAIL -eq $args[-1]) { $global:LASTEXITCODE=1 } else { $global:LASTEXITCODE=0 } }\n& $Helper -Repo $Repo -Execute -Publish:$Publish -Files $InputFile\n",encoding='utf-8')
            before=(git(repo,'rev-parse','HEAD'),(repo/'.git/index').read_bytes(),source.read_bytes(),git(repo,'status','--porcelain'))
            def run(inputfile=incoming,publish=False,fail='',extra=''):
                env={**os.environ,'TEMP':str(root),'TMP':str(root),'PMP_FAIL':fail,'PMP_EXTRA':extra}
                cmd=['powershell','-NoProfile','-ExecutionPolicy','Bypass','-File',str(driver),'-Repo',str(repo),'-InputFile',str(inputfile),'-Helper',str(HELPER)]
                if publish:cmd.append('-Publish')
                result=subprocess.run(cmd,capture_output=True,text=True,env=env)
                self.assertEqual((git(repo,'rev-parse','HEAD'),(repo/'.git/index').read_bytes(),source.read_bytes(),git(repo,'status','--porcelain')),before)
                return result
            for gate in ['data','python','lint','test','build','bundle']:
                result=run(publish=True,fail=gate);self.assertNotEqual(result.returncode,0,result.stdout)
                self.assertEqual(git(remote,'rev-parse','main'),before[0])
            result=run();self.assertEqual(result.returncode,0,result.stderr);self.assertIn('No commit/push',result.stdout)
            result=run(publish=True,extra='yes');self.assertNotEqual(result.returncode,0);self.assertIn('Unexpected generated change',result.stderr)
            result=run(source,publish=True);self.assertEqual(result.returncode,0,result.stderr);self.assertIn('No changes',result.stdout)
            result=run(publish=True);self.assertEqual(result.returncode,0,result.stderr)
            self.assertEqual(git(remote,'diff','--name-only',before[0],'main'),'RawSource/'+source.name)

if __name__ == '__main__':
    unittest.main()
