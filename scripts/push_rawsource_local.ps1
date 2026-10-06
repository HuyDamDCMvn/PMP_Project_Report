# Fail-closed offline candidate workflow. DryRun is read-only, including Git refs/index.
# Publication requires BOTH -Execute and -Publish; never run on a dirty source clone.
[CmdletBinding()]
param(
  [string]$Repo = 'D:\03_DCMvn\PMP Dashboard',
  [string]$Branch = 'main',
  [string]$Message = 'RawSource: validated offline bundle update',
  [switch]$DryRun,
  [switch]$Execute,
  [switch]$Publish,
  [string]$Python = 'python',
  [Parameter(Mandatory=$true)][string[]]$Files
)
$ErrorActionPreference='Stop'
function InvokeRepoGit([string]$Path,[string[]]$Arguments) {
  $result = & git -C $Path @Arguments
  if ($LASTEXITCODE -ne 0) { throw "Git operation failed: $($Arguments[0])" }
  return $result
}
$repoPath=(Resolve-Path -LiteralPath $Repo).Path
$base=(InvokeRepoGit $repoPath @('rev-parse','HEAD')).Trim()
$current=(InvokeRepoGit $repoPath @('branch','--show-current')).Trim()
if ($current -ne $Branch) { throw 'Branch mismatch; no checkout is performed.' }
$allowed=@('Annotation_Ticket_User_Matrix_Checked.xlsx','DCMvn_TIDP_Combined_20260930.xlsx','Family_Upload_vs_Annotation_Tickets_Checked.xlsx')
$inputs=@{}
# Complete preflight before any candidate/copy. Supplemental equivalence changes require separate review.
foreach ($file in $Files) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { throw "Missing input: $file" }
  $resolved=(Resolve-Path -LiteralPath $file).Path
  $name=Split-Path -Leaf $resolved
  if ($name -notin $allowed -or $inputs.ContainsKey($name)) { throw "Unsupported or duplicate input: $name" }
  $inputs[$name]=$resolved
}
if ($DryRun -or -not $Execute) {
  Write-Output "Read-only preflight complete. HEAD=$base; inputs=$($inputs.Count). No fetch, checkout, copy, stage, commit or push."
  return
}
if ((InvokeRepoGit $repoPath @('status','--porcelain')).Count -gt 0) { throw 'Dirty source repository; preserve existing changes and use a clean candidate.' }
$remote=(InvokeRepoGit $repoPath @('remote','get-url','origin')).Trim()
$remoteLine=InvokeRepoGit $repoPath @('ls-remote','--heads','origin',$Branch)
if (-not $remoteLine -or ($remoteLine -split '\s+')[0] -ne $base) { throw 'Remote advanced or mismatched; stopped without changing local branch.' }
$candidate=Join-Path ([IO.Path]::GetTempPath()) ('pmp-candidate-'+[Guid]::NewGuid().ToString('N'))
InvokeRepoGit $repoPath @('clone','--no-hardlinks','--single-branch','--branch',$Branch,$repoPath,$candidate) | Out-Null
# Candidate is intentionally retained on failure for inspection; original index/checkout remain untouched.
foreach ($name in $inputs.Keys) { Copy-Item -LiteralPath $inputs[$name] -Destination (Join-Path $candidate "RawSource/$name") -Force }
Push-Location -LiteralPath $candidate
try {
  & $Python scripts/build_dashboard_data.py
  if ($LASTEXITCODE -ne 0) { throw 'Offline source build failed.' }
  & $Python -m unittest discover -s tests -p 'test_*.py'
  if ($LASTEXITCODE -ne 0) { throw 'Source tests failed.' }
  & npm ci
  if ($LASTEXITCODE -ne 0) { throw 'Dependency install failed.' }
  foreach ($gate in @('lint','test','build')) {
    & npm run $gate
    if ($LASTEXITCODE -ne 0) { throw "Validation failed: $gate" }
  }
  & node scripts/validate_bundle.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Bundle validation failed.' }
  if (-not $Publish) { Write-Output "Validated candidate retained: $candidate. No commit/push."; return }
  $paths=@($inputs.Keys | ForEach-Object { "RawSource/$_" })+@('public/data/dashboard-data.json','public/data/family-role-hours.json','public/data/weekly-hours.json','public/data/bundle-manifest.json')
  $changed=@(InvokeRepoGit $candidate @('status','--porcelain','--untracked-files=all') | ForEach-Object { $_.Substring(3) })
  foreach ($path in $changed) { if ($path -notin $paths) { throw "Unexpected generated change: $path" } }
  InvokeRepoGit $candidate (@('add','--')+$paths) | Out-Null
  $staged=InvokeRepoGit $candidate @('diff','--cached','--name-only')
  if (-not $staged) { Write-Output 'No changes; no commit/push.'; return }
  foreach ($path in $staged) { if ($path -notin $paths) { throw 'Unexpected staged path.' } }
  $latest=InvokeRepoGit $repoPath @('ls-remote','--heads','origin',$Branch)
  if (($latest -split '\s+')[0] -ne $base) { throw 'Remote advanced; stopped before commit/push.' }
  foreach ($identity in @('user.name','user.email')) {
    $value=(InvokeRepoGit $repoPath @('config',$identity)).Trim()
    InvokeRepoGit $candidate @('config',$identity,$value) | Out-Null
  }
  InvokeRepoGit $candidate @('commit','-m',$Message) | Out-Null
  # Normal non-force push also rejects a race after the final remote check.
  InvokeRepoGit $candidate @('push',$remote,"HEAD:refs/heads/$Branch") | Out-Null
  Write-Output "Published validated candidate: $candidate"
} finally { Pop-Location }
