# Contributing to Form Safe

Focused fixes, reproducible bug reports, and clear documentation are welcome.

## Before you start

Search [existing issues](https://github.com/mikr13/form-safe/issues) before opening a new one. For a larger feature, describe the problem in a [feature request](https://github.com/mikr13/form-safe/issues/new?template=feature_request.yml) before building it. Keep the extension's narrow purpose and local operation in mind.

Bug reports should include browser and OS versions, the installation method, and a minimal reproduction using fake data. Use [SECURITY.md](SECURITY.md) for vulnerabilities.

## Pull requests

1. Follow [Development](docs/DEVELOPMENT.md) to install dependencies and locate the relevant source.
2. Make one focused change and update documentation if behavior changes.
3. Run `bun run compile`, `bun run test`, `bun run zip`, `bun run zip:firefox`, and `git diff --check`.
4. For behavior changes, run the manual browser checks and record what passed and what remains untested.
5. Explain the problem, resulting behavior, and validation in your pull request. Link a related issue when one exists.

Do not commit generated builds, dependency directories, secrets, or personal form data. Discuss the purpose and privacy implications before adding storage, telemetry, network requests, or broader permissions.

Be respectful and specific in discussions and reviews. Maintainer review is required before contributions are merged.

Run `bun run changeset` and include a changeset for a user-visible change. For changes that need no version bump, use `bun run changeset --empty`. Maintainers apply `bun run version` before release; the private npm package is not published to npm.
