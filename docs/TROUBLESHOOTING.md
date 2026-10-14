# Troubleshooting

## No warning appears

Confirm that the extension is enabled, has site access, and was loaded using the correct build directory or Firefox manifest. Reload pages opened before installation.

Use a regular HTTP or HTTPS page and edit a standard `input`, `textarea`, or `select` yourself. Browser-internal pages, restricted websites, local files, rich-text editors, shadow DOM fields, and child frames are outside the current coverage.

The browser requires prior user interaction and decides whether to show a warning. Single-page app navigation may keep the document alive, so it never reaches `beforeunload`. Browser crashes and operating-system termination are not reliably covered. See [MDN's browser notes](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event).

## A warning appears after undoing an edit or after autosave

Form Safe tracks whether an edit event happened, not whether the current value differs from an earlier value. It cannot determine whether a website's autosave succeeded. The guard remains active until a watched form emits `submit` or `reset`, or the page unloads.

## A warning disappears while another form is unfinished

The guard is page-wide. Submitting or resetting any watched form clears it for the whole page. A later edit re-enables it. The extension cannot distinguish separate forms or confirm successful server-side saving.

## Firefox removes the extension after a restart

Firefox's **Load Temporary Add-on…** installation lasts only for the current session. Load it again for development. Permanent installation requires a Mozilla-signed package; an unsigned archive does not provide that.

## TypeScript cannot find `.wxt/tsconfig.json`

Run `bun install --frozen-lockfile` from the project root. The install hook generates WXT's types. If dependencies are already installed, run `bunx wxt prepare`, then `bun run compile`.

## Report a reproducible problem

[Open a bug report](https://github.com/mikr13/form-safe/issues/new?template=bug_report.yml) with your extension, browser and OS versions, installation method, and exact steps. Prefer a small HTML example with fake data. Do not post passwords, private URLs, real form contents, or sensitive screenshots. Use [private reporting](../SECURITY.md) for security problems.
