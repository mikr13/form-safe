# Changesets

Run `bun run changeset` for a user-visible change and choose a patch, minor, or major bump for `form-safe`. Commit the resulting Markdown file with the change.

Before a release, run `bun run version`. Changesets updates `package.json` and `CHANGELOG.md` and consumes pending changesets. WXT takes the extension version from `package.json`; there is no second manifest version to update.

Commit and review the version changes before running the Release workflow. Do not use `changeset publish`: this private package is distributed through GitHub and browser stores, not npm. See [RELEASING.md](../RELEASING.md).
