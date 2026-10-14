# Privacy Policy for Form Safe

Last updated: 2026-10-14

Form Safe runs locally in your browser. It does not collect, store, or transmit personal data or usage data.

## What the extension does

The content script runs on HTTP and HTTPS pages where the browser permits it. It finds standard form controls and listens for `input` and `change` events. After an edit, it keeps a boolean flag in page memory and registers a `beforeunload` listener to request the browser's leave-page warning. A form `submit` or `reset` event clears the flag and removes the listener.

A `MutationObserver` watches for newly added fields and forms. The script does not read the values entered into those fields. Its temporary state disappears with the page; it does not save or recover drafts.

## Data and network access

- No form values, passwords, browsing history, or page contents are collected or persisted.
- No data is sent to a server or third-party service.
- No extension storage, cookies, analytics, telemetry, crash reporting, ads, or remote configuration are used.
- No account or sign-in is required.

The manifest requests no additional extension API permissions. Its content script matches HTTP and HTTPS websites, which can cause the browser to show a broad site-access notice. That access allows the script to find form controls and attach the listeners described above.

## Scope

This policy covers the Form Safe extension. Websites you visit, your browser's own services, and GitHub's handling of repository visits, downloads, or issue reports have their own policies. Avoid including personal form contents in public bug reports.

## Changes and contact

Updates to this policy are published here with a revised date. For privacy questions, [open an issue](https://github.com/mikr13/form-safe/issues/new/choose). Report security concerns privately as described in [SECURITY.md](SECURITY.md).

Canonical policy: <https://github.com/mikr13/form-safe/blob/main/PRIVACY.md>.
