$ErrorActionPreference = 'Stop'
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw 'GitHub CLI (gh) is required.' }
gh auth status
if (-not (Test-Path .git)) { git init -b main }
git add .
if (git status --porcelain) { git commit -m "feat: initialize ThaiVtuberPublic" }
if (-not (git remote)) {
  gh repo create Icezaza2543/ThaiVtuberPublic --public --source=. --remote=origin --push
} else {
  git push -u origin main
}
