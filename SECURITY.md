# Security

## Report a vulnerability

Report vulnerabilities through GitHub's [private vulnerability reporting](https://github.com/mikr13/form-safe/security/advisories/new), rather than a public issue.

Include the affected commit or extension version, browser version, a minimal reproduction with fake data, and the observed impact. Do not include passwords, real form contents, or other people's personal data.

If the private form is unavailable, open a public issue asking for a private contact channel without disclosing the vulnerability itself.

## Security boundary

Form Safe runs as a content script on HTTP and HTTPS pages. It observes form edit events and requests a browser-controlled unload warning. It does not save drafts or guarantee protection against lost data, malicious websites, browser crashes, or operating-system termination.

Security fixes are developed against the current `main` branch. There is no published release support schedule or guaranteed response time.
