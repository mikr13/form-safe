# Release process

Form Safe currently documents local source installation. This guide prepares packages for a future release; it does not imply a browser-store listing or signed Firefox package exists.

## Prepare and verify

1. Start from a clean checkout of the intended commit on `main`.
2. Set the same version in `package.json` and `wxt.config.ts`.
3. Update documentation for any behavior or privacy changes.
4. Install and build:

   ```sh
   bun install --frozen-lockfile
   bun run compile
   bun run zip
   bun run zip:firefox
   git diff --check
   ```

5. Inspect generated manifests and archives under `.output`. Verify versions, icons, content script matches, and permissions.
6. Complete the [manual browser checks](docs/DEVELOPMENT.md#verify-a-change) using the actual packages. Record browser versions and untested cases.
7. Commit through the normal review process. Wait for CI on the exact commit to pass before publishing.

## GitHub packages

Create a version tag such as `v1.0.0` on the verified commit and a GitHub release with the matching Chrome and Firefox ZIP archives. Identify packages as source-built and unsigned where appropriate. Explain how to unpack and load the Chrome package, and that Firefox requires Mozilla signing for permanent installation.

GitHub Actions artifacts are development packages, not published releases. They are available from successful runs while retained by GitHub; downloading them requires a GitHub login.

Once a release is published, add its verified download link to the README. Add store badges and installation links only after those destinations exist.

## Browser stores

Chrome Web Store and Firefox Add-ons publication are separate from GitHub releases. Confirm current store requirements, provide the [canonical privacy policy](https://github.com/mikr13/form-safe/blob/main/PRIVACY.md), and accurately disclose website access and data handling.

WXT's [publishing guide](https://wxt.dev/guide/essentials/publishing.html) covers packaging and store submission. A ZIP build or GitHub release is not evidence of store approval or Mozilla signing.
