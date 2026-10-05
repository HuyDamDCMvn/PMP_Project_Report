# Push files into PMP_Project_Report RawSource/ from a local clone (Windows PowerShell).
# No Cursor cloud agent. Review before first use.
#
# Usage:
#   .\push_rawsource_local.ps1 -DryRun -Files "C:\path\Family_Upload_vs_Annotation_Tickets_Checked.xlsx"
#   .\push_rawsource_local.ps1 -Message "Family Checked: …" -Files "C:\path\Family_….xlsx"
#
# Defaults for HuyDam:
#   Repo = D:\03_DCMvn\PMP Dashboard
#   Branch = main
#
# Requirements: git on PATH; remote already authenticated. Never prints tokens.

[CmdletBinding()]
param(
  [string]$Repo = $(if ($env:PMP_REPO) { $env:PMP_REPO } else { 'D:\03_DCMvn\PMP Dashboard' }),
  [string]$Branch = $(if ($env:PMP_BRANCH) { $env:PMP_BRANCH } else { 'main' }),
  [string]$Message = '',
  [switch]$DryRun,
  [Parameter(Mandatory = $true)]
  [string[]]$Files
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath (Join-Path $Repo '.git'))) {
  throw "Not a git repo: $Repo (set -Repo or PMP_REPO)"
}
$raw = Join-Path $Repo 'RawSource'
if (-not (Test-Path -LiteralPath $raw)) {
  throw "Missing RawSource under: $Repo"
}

Write-Host "Repo:    $Repo"
Write-Host "Branch:  $Branch"
Write-Host "Dry-run: $DryRun"

Push-Location -LiteralPath $Repo
try {
  git fetch origin $Branch
  if ($LASTEXITCODE -ne 0) { throw "git fetch failed" }
  git checkout $Branch
  if ($LASTEXITCODE -ne 0) { throw "git checkout failed" }
  git pull --ff-only origin $Branch
  if ($LASTEXITCODE -ne 0) { throw "git pull --ff-only failed" }

  $copied = @()
  foreach ($src in $Files) {
    if (-not (Test-Path -LiteralPath $src -PathType Leaf)) {
      throw "Not a file: $src"
    }
    $base = Split-Path -Leaf $src
    $dest = Join-Path $raw $base
    $len = (Get-Item -LiteralPath $src).Length
    Write-Host "Copy: $src -> RawSource\$base ($len bytes)"
    if (-not $DryRun) {
      Copy-Item -LiteralPath $src -Destination $dest -Force
    }
    $copied += "RawSource/$base"
  }

  if ($DryRun) {
    Write-Host 'Dry-run only — no commit/push.'
    git status --short -- @copied
    return
  }

  git add -- @copied
  if ($LASTEXITCODE -ne 0) { throw "git add failed" }

  git diff --cached --quiet
  if ($LASTEXITCODE -eq 0) {
    Write-Host 'No changes to commit (files identical).'
    return
  }

  if ([string]::IsNullOrWhiteSpace($Message)) {
    $Message = "RawSource: update $($copied -join ' ') ($(Get-Date -Format yyyy-MM-dd))"
  }

  git commit -m $Message
  if ($LASTEXITCODE -ne 0) { throw "git commit failed" }
  git push origin $Branch
  if ($LASTEXITCODE -ne 0) { throw "git push failed" }
  $sha = (git rev-parse --short HEAD).Trim()
  Write-Host "Pushed: $sha on $Branch"
  git log -1 --oneline
}
finally {
  Pop-Location
}
