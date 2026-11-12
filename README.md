# devsecops-pipeline

A small Node.js 22 and Express 5.3 API used for Assignment Six: Building a Secure CI/CD Pipeline with GitHub Actions.

## API endpoints

- `GET /health` — simple health response.
- `GET /api/books` — returns the in-memory book list.
- `POST /api/books` — creates a book when both `title` and `author` are valid strings.

The API uses in-memory data for the assignment demonstration; restarting the process resets the list. It does not need a real database, password, token, or connection string.

## Local setup

1. Install Node.js 22 and Git.
2. Open a terminal in this folder.
3. Run `npm install` once. This creates the required `package-lock.json` for reproducible CI installs.
4. Commit both `package.json` and `package-lock.json`.
5. Run `npm test`, `npm run lint`, `npm run build`, and `npm run security:sast`.
6. Start the API with `npm start`, then visit `http://localhost:3000/health`.

GitHub Actions uses `npm ci`, never `npm install`, because CI installs exactly the dependency tree recorded in the committed lockfile.

## GitHub Actions workflows

- `.github/workflows/ci.yml`: checkout, Node.js 22, `npm ci`, tests, ESLint, and a syntax-validation build check.
- `.github/workflows/security.yml`: Gitleaks secret scan, high/critical `npm audit` threshold, and the project's explicit static-security policies.
- `.github/workflows/codeql.yml`: CodeQL `security-extended` analysis and a SARIF threshold gate that blocks findings with security severity 7.0 or higher. The supplied configuration keeps SARIF local to the Actions run so it can also run in a private repository without a GitHub Code Security licence.

The API has no compile/bundle step. `npm run build` therefore performs a deterministic Node.js syntax validation of both application entry files, which is the sensible build substitute for this small interpreted API.

## Security notes

- Never commit `.env`, passwords, real keys, tokens, or connection strings.
- `.env.example` contains only a non-secret local port setting.
- Gitleaks is used as the automated secret scanner. For a personal GitHub account it does not require a Gitleaks license secret; organization-owned repositories have different licensing requirements.
- GitHub Actions secrets should be used for any real pipeline credential. This demo does not need an external scanning-service credential.
- The CodeQL action is set to `upload: never` in the supplied private-compatible workflow. To publish findings into GitHub's **Security → Code scanning** dashboard, the repository must be public or have GitHub Code Security enabled; on an eligible repository, change `upload: never` to `upload: always` and grant `security-events: write` in the workflow permissions. GitHub Free/Pro accounts cannot upload CodeQL findings for private repositories without Code Security.
- See `SECURITY-GATE.md` for the enforced policy.

## Assignment evidence

Real Actions run URLs, exact scan output, PR screenshots, instructor collaborator status, and branch-protection settings must be captured from the student's own GitHub repository. They are intentionally not fabricated in this template.
