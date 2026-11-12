# Security gate policy

A pull request is eligible to merge only when all required checks are successful:

1. `build-and-test`: `npm ci`, automated tests, ESLint, and the build/syntax check all pass.
2. `security-gates`: Gitleaks finds no secret, `npm audit --audit-level=high` finds no high/critical dependency advisory, and the project SAST policy finds no `eval()`, dynamic `Function()`, or hard-coded credential pattern.
3. `codeql-security-analysis`: CodeQL completes, and the SARIF threshold step finds no CodeQL finding with a security severity of 7.0 or higher (high or critical).

Configure the default branch (`main`) to require the three job checks above. GitHub only enforces this policy after the check names have appeared at least once in the repository's Actions results. Choose the exact check labels shown by your repository's branch-protection screen.

The CodeQL threshold is deliberately risk-based: this gate blocks high/critical security findings, while lower-severity results still require review and a recorded remediation or risk decision. This avoids treating every informational or low-severity observation as an automatic release blocker.
