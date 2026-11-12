# Start here — Assignment Six

This pack contains the application and final workflow files. Follow the sequence below so the GitHub repository history shows that you built the CI pipeline first and then layered on security, as Module 6 instructs.

## 1. Prepare your computer

- Install Git for Windows and Node.js 22 LTS.
- Extract this ZIP to a folder you can find, for example `C:\Users\YOUR-USER\Documents\devsecops-pipeline`.
- Open PowerShell in that folder.
- Set your Git identity once if you have not already:

```powershell
git config --global user.name "YOUR NAME"
git config --global user.email "YOUR GITHUB EMAIL"
node --version
git --version
```

The Node output should start with `v22.`.

## 2. Generate the lockfile and prove the app works locally

The ZIP intentionally does not contain a fabricated npm lockfile. Run this once on your computer so npm generates the authentic lockfile for the dependency tree it actually resolves:

```powershell
npm install
npm test
npm run lint
npm run build
npm run security:sast
```

All commands should complete successfully. `npm install` creates `package-lock.json`; keep it and commit it. GitHub Actions then uses `npm ci` against that exact lockfile.

Start the API:

```powershell
npm start
```

Open a second PowerShell window and run:

```powershell
Invoke-RestMethod http://localhost:3000/health
Invoke-RestMethod http://localhost:3000/api/books
```

Stop the server with Ctrl+C when finished.

## 3. Create the GitHub repository

1. Sign in to GitHub.
2. Click **New repository**.
3. Repository name: `devsecops-pipeline`.
4. Select **Private**.
5. Do not initialize it with a README, `.gitignore`, or licence; this folder already contains those project files.
6. Create the repository.
7. Copy its HTTPS URL. It should look like `https://github.com/YOUR-USERNAME/devsecops-pipeline.git`.
8. In the repository, open **Settings → Collaborators** (or **Collaborators and teams**) and invite your instructor's exact GitHub username. If GitHub does not allow you to add them, make the repository public and state that fact in Task 5/Task 6 evidence; do not invent an invite.

### Check your GitHub plan before relying on a private repository

GitHub Free personal accounts can have private repositories and collaborators, but protected-branch rules are available on Free only for public repositories; protecting a private repository requires GitHub Pro or a higher eligible plan. GitHub Code Scanning uploads are free for public repositories; private repositories need GitHub Code Security. The supplied CodeQL workflow uses `upload: never`, so CodeQL still runs and its SARIF threshold can fail the Actions check in a private repository, but its alerts will not appear in the GitHub Security dashboard.

For a complete Task 5 merge-block demonstration on GitHub Free, the repository needs to be public. The assignment prefers private, so do not change visibility without checking that public code is permitted by your instructor; you can still invite the instructor as a collaborator on a public repository. Otherwise, use an eligible paid/education account for private branch protection, and use GitHub Code Security if you also need CodeQL alerts in the private repository's Security dashboard. Do not claim that a gate blocks merging unless the required status rule is actually active.

## 4. Stage one — push the base CI pipeline only

To demonstrate the module's intended progression, temporarily use the CI-only version of the workflow before adding the security workflow files. Save the final `security.yml` and `codeql.yml` files somewhere safe, then temporarily move them out of `.github/workflows/` so only `ci.yml` is active.

The supplied `ci.yml` already has the correct base sequence. Run:

```powershell
git init
git add .
git commit -m "Add Express API and base CI workflow"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/devsecops-pipeline.git
git push -u origin main
```

Replace the URL with the URL from your repository. On GitHub, open **Actions**, open the latest **CI** run, and wait for all steps to finish. Record the successful run URL and keep the visible job log for Task 2.

## 5. Stage two — prove CI fails, then fix it

Create an isolated branch:

```powershell
git switch -c lab/intentional-ci-failure
```

Open `test/app.test.js` and temporarily change this assertion in the health test:

```javascript
assert.equal(response.status, 200);
```

to:

```javascript
assert.equal(response.status, 500);
```

Save, then run and commit:

```powershell
npm test
git add test/app.test.js
git commit -m "Lab: introduce a controlled failing test"
git push -u origin lab/intentional-ci-failure
```

The local test and the Actions test step should fail. Open **Actions**, open the red run, and record its URL plus the `AssertionError` text. Do not merge this branch.

Fix the assertion back to `200`, then:

```powershell
npm test
git add test/app.test.js
git commit -m "Fix the controlled test failure"
git push
```

Record the green Actions run URL and the passing test log. You may delete the lab branch after you have captured the evidence.

## 6. Stage three — add automated security checks

Restore the supplied `.github/workflows/security.yml` and `.github/workflows/codeql.yml` into `.github/workflows/`. Then:

```powershell
git switch main
git pull
git add .github/workflows/security.yml .github/workflows/codeql.yml SECURITY-GATE.md scripts/security-scan.js scripts/check-codeql-sarif.js
git commit -m "Add secret, dependency and CodeQL security gates"
git push
```

Open **Actions** and confirm all three workflows are running and green. The supplied CodeQL workflow uses `upload: never`: it still performs CodeQL analysis, saves SARIF in the runner's temporary results directory, and applies the high/critical threshold gate in the job log. This is deliberately compatible with a private repository that has no Code Security licence. GitHub Code Scanning dashboard uploads are available for public repositories, or private repositories with GitHub Code Security enabled; GitHub Free/Pro cannot upload CodeQL findings for private repositories. If your repository is eligible and you want dashboard alerts, change `upload: never` to `upload: always` and add `security-events: write` under workflow permissions. State honestly which mode you used in the answers file.

## 7. Task 3 — demonstrate secret detection safely

Use a throwaway branch only. Do not use a real credential. The Gitleaks rule set recognises common token formats; use a fake token-like string with the `ghp_` prefix and 36 invented letters/digits in a temporary text file. Never use a credential copied from an account or service.

```powershell
git switch main
git pull
git switch -c lab/fake-secret-detection
```

Create `secret-lab.txt` containing only the fake, invented value, then:

```powershell
git add secret-lab.txt
git commit -m "Lab: demonstrate fake secret detection"
git push -u origin lab/fake-secret-detection
```

Open the **Security** workflow run and record the Gitleaks finding and failed step. Do not open a PR or merge this branch. After capturing evidence, delete the remote lab branch in GitHub and delete the local branch. Continue from clean `main`:

```powershell
git switch main
git pull
git branch -D lab/fake-secret-detection
```

If Gitleaks does not detect the dummy pattern on the first try, read the job log and choose a fake token pattern listed in Gitleaks' public rules; never substitute a real credential. Do not copy the fake token into the answers file.

## 8. Task 4A — dependency scan, vulnerable example, remediation

Start another throwaway branch:

```powershell
git switch -c lab/dependency-vulnerability
npm install lodash@4.17.20 --save-exact
npm audit --audit-level=high
```

The `npm audit` command should identify high-severity advisory/advisories for the direct `lodash` dependency. As of 12 November 2026, `lodash@4.17.20` is affected by multiple advisories; `4.17.21` is not a sufficient current remediation because later advisories affect versions through 4.17.23. Use `4.18.1` for the clean rescan. The exact advisory wording and count come from the live registry on the day you run it. Save the terminal output; commit `package.json` and `package-lock.json`, push the branch, and save the red Security workflow URL/log.

Remediate it:

```powershell
npm install lodash@4.18.1 --save-exact
npm test
npm audit --audit-level=high
git add package.json package-lock.json
git commit -m "Lab: remediate vulnerable lodash dependency"
git push
```

Record the clean rescan output and green run. Then remove the lab-only dependency so the final app does not keep an unused package:

```powershell
npm uninstall lodash
npm test
npm audit --audit-level=high
git add package.json package-lock.json
git commit -m "Remove dependency used only for the audit lab"
git push
```

Do not merge this lab branch. You can delete it after evidence capture.

## 9. Task 4B — controlled SAST finding, then fix

Create a new lab branch from clean `main`:

```powershell
git switch main
git pull
git switch -c lab/sast-code-injection
```

Create `src/lab-insecure.js` with this intentionally unsafe demonstration (do not add a real credential):

```javascript
'use strict';
const express = require('express');
const app = express();
app.get('/unsafe-evaluate', (req, res) => {
  const expression = req.query.expression;
  const result = eval(expression); // Intentionally insecure: never use this in a real application.
  res.send(String(result));
});
module.exports = app;
```

Run `npm run lint` and `npm run security:sast`; both should fail because the code uses `eval()`. Commit and push the branch. CodeQL should also report a code-injection finding; the supplied private-compatible workflow prints its SARIF rule, severity, file and line in the red Actions log. To show the alert in **Security → Code scanning**, the repo must be public or have GitHub Code Security enabled and the workflow must upload SARIF. Record the rule, severity, file and line, the red workflow URL, and relevant log text.

Fix the underlying problem by deleting `src/lab-insecure.js` (the real application has no need to evaluate user-supplied code):

```powershell
Remove-Item src/lab-insecure.js
npm test
npm run lint
npm run security:sast
git add -A
git commit -m "Fix SAST lab by removing unsafe dynamic evaluation"
git push
```

Wait for CodeQL to analyse the new commit. Record the green run and confirm the finding is absent from the latest SARIF results; if you enabled dashboard uploads, also confirm the Code Scanning alert is closed/fixed. Do not merge this lab branch.

## 10. Task 5 — configure the real merge gate

First make sure the three final workflows have completed successfully on `main`, so GitHub has check names to offer. Then open:

**Settings → Branches → Add branch protection rule** (or the equivalent ruleset UI).

Set the branch pattern to `main`. Enable **Require a pull request before merging** and **Require status checks to pass before merging**. Select the three job checks produced by your runs:

- `build-and-test` (from CI)
- `security-gates` (from Security)
- `codeql-security-analysis` (from CodeQL)

GitHub may display a workflow prefix; select the exact three check entries from your repository. Enable **Require branches to be up to date before merging** if available. Save the rule. Capture a screenshot showing the branch pattern and selected required checks.

Now create a clean branch and open a PR so you can prove the protection works:

```powershell
git switch main
git pull
git switch -c lab/branch-protection-proof
```

Temporarily change the health test expected status from `200` to `500`, commit, push, and open a PR targeting `main`. Capture a screenshot of the PR showing the failed required status and the disabled/blocked merge state. Then restore `200`, commit and push to the same branch. Wait for all required checks to become green, capture the green PR screenshot, then merge the PR. This PR demonstrates the branch protection gate; it also leaves the final main branch green.

## 11. Task 6 — secrets and environment separation

No actual external secret is required for this demo. For the written answer, explain that a future scanning/deployment credential would be created under **Settings → Secrets and variables → Actions → New repository secret** (or under a named Environment for environment-specific credentials), and referenced as `${{ secrets.SECRET_NAME }}` in a step's `env` block. Never put the secret value in YAML, code, commits, screenshots or the answers file.

Separate development, testing, staging and production secrets because each environment should receive only the credentials and permissions it needs (least privilege); a development leak must not expose production. GitHub Environments can scope secrets and require approvals for more sensitive deployments.

## 12. Finish the answers file

Open the separate `assignment6-answers.txt` file. Replace all square-bracket placeholders with your own:

- Name/student number.
- GitHub repository link and privacy/collaborator status.
- Real successful and failed Actions run URLs.
- Relevant log excerpts and scan findings from your actual run.
- Screenshots where requested (embed them in a DOCX, or submit them as clearly named image files if your instructor accepts attachments).
- Exact branch protection check names and screenshot details.

Do not write that a workflow succeeded or a gate blocked merging until you have observed it in GitHub. Keep Task 2, Task 3, Task 4 and Task 5 evidence separate and labelled.

## Important final checks

```powershell
git status
npm test
npm run lint
npm run build
npm run security:sast
npm audit --audit-level=high
```

Check that `package-lock.json` is committed, no `secret-lab.txt`, `src/lab-insecure.js`, `.env`, or node_modules directory is committed, the repository is named exactly `devsecops-pipeline`, and the latest `main` Actions checks are green.
