# Release process

Form Safe is [published on Chrome Web Store](https://chromewebstore.google.com/detail/form-safe/mhbeeoegononcomocnaekfibmjahmamk). GitHub releases and Chrome store updates are separate steps, following the manual release convention in Superfill and the API v2 publishing convention in Helium Synk.

## Version a change

`package.json` is the single version source. WXT uses that version in both browser manifests.

1. Run `bun run changeset` for a user-visible change, select `form-safe`, and choose patch, minor, or major. Commit the changeset with the implementation.
2. Before releasing, run `bun run version`. Changesets updates `package.json` and `CHANGELOG.md` and consumes pending changesets.
3. Review and commit those version changes on `main`. A store update must have a version higher than the version currently published. The existing Chrome release is 1.0.0; uploading another 1.0.0 will be rejected.
4. Wait for the [Build workflow](https://github.com/mikr13/form-safe/actions/workflows/ci.yml) on that commit to pass. Complete the [manual browser checks](docs/DEVELOPMENT.md#verify-a-change) for behavior changes.

Use numeric `X.Y.Z` versions with each component at most 65535; Chrome release packages do not use semver prerelease suffixes. Do not run `changeset publish`: this private project is distributed through GitHub and browser stores, not npm.

## Preview a GitHub release

Open [Release](https://github.com/mikr13/form-safe/actions/workflows/ci-release.yaml), choose **Run workflow**, select `main`, and keep `dry_run` checked. Leave `chrome_action` as `none`.

The workflow installs locked dependencies, checks TypeScript, runs release tests, builds Chrome and Firefox, and validates the package manifests. Its `form-safe-release` artifact contains:

- `form-safe-X.Y.Z-chrome.zip`
- `form-safe-X.Y.Z-firefox.zip`
- `form-safe-X.Y.Z-sources.zip`
- `extension-build.json` with the version, exact source commit, store IDs, and asset hashes
- `SHA256SUMS`

A preview creates no tag, GitHub release, store draft, or review submission. Locally, after committing your changes, run `bun run release:prepare` to produce the same files under the ignored `release/` directory. A dirty checkout is rejected so its contents cannot be attributed to the wrong commit.

## Publish a GitHub release

Run the same workflow on the reviewed `main` commit with `dry_run` unchecked. Leave `chrome_action` as `none` to publish only to GitHub.

The publish job checks the artifact hashes again, then creates `vX.Y.Z` on the exact verified commit with all five assets and generated release notes. It refuses an existing tag and never replaces earlier assets. If GitHub reports a failure after creation, inspect the tag, release, and assets before retrying; do not delete or overwrite a release to silence a failure.

You can optionally select `dry-run`, `upload-draft`, or `submit-review` as `chrome_action` to run Chrome publishing after the GitHub release succeeds. Missing store credentials make that job fail visibly while preserving the successful GitHub release. The separate Chrome workflow can then be retried against the existing tag.

GitHub ZIPs are source-built development packages. Unpack the Chrome ZIP and load its folder using **Load unpacked**; use Firefox's temporary add-on loader for the Firefox ZIP. The Firefox archive is unsigned and has no configured Firefox Add-ons listing. GitHub publication does not update the Chrome Web Store listing.

## Configure Chrome publishing

These repository **Actions variables** identify Form Safe:

| Variable | Value |
| --- | --- |
| `CHROME_EXTENSION_ID` | `mhbeeoegononcomocnaekfibmjahmamk` |
| `CHROME_PUBLISHER_ID` | `d135b9ba-ba1d-4ce7-8215-a93984939697` |

Add two repository **Actions secrets** in [GitHub settings](https://github.com/mikr13/form-safe/settings/secrets/actions):

| Secret | Contents |
| --- | --- |
| `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL` | The linked Google service account's `client_email` |
| `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY` | The complete RSA `private_key` PEM, including its BEGIN/END lines |

Use the service account already linked to this publisher if one exists. GitHub does not let you read back another repository's secret values; add the same authorized credentials to Form Safe from your original secure source. Do not put keys in the repository, release archives, logs, or chat.

The key helper accepts multiline PEM, escaped-newline PEM, a JSON-encoded PEM string, or the service-account JSON containing `private_key`. It validates and normalizes the key in memory without printing it. Store the email separately in its own secret.

The Chrome Web Store API must be enabled in the service account's Google Cloud project, and that account must be linked in the publisher's Developer Dashboard. See Google's [service-account setup](https://developer.chrome.com/docs/webstore/service-accounts). A successful dry-run verifies authentication and access; the presence of secrets alone does not.

## Authenticate, upload, and submit

Use [Chrome Web Store](https://github.com/mikr13/form-safe/actions/workflows/chrome-publish.yml) on `main`:

| Action | Required tag | Effect |
| --- | --- | --- |
| `dry-run` | Optional | Authenticates and checks API access; does not upload or submit |
| `upload-draft` | Existing published GitHub release | Uploads the verified Chrome ZIP without submitting review |
| `submit-review` | Existing published GitHub release | Uploads the same verified ZIP and submits it for review |

With a tag, the workflow downloads the release's Chrome ZIP and `extension-build.json`. It compares the recorded source SHA and version with the checked-out tag, checks the ZIP hash, and inspects its manifest. Publishing code and dependencies come from the workflow revision, not from the tag being submitted. Store credentials are passed only to the validation and submission steps.

Without a tag, only `dry-run` is permitted. It builds a candidate from the workflow revision for an authentication check. To retry a store failure, run this workflow against the existing release; it does not rebuild the released Chrome ZIP.

`publish_type` defaults to `STAGED_PUBLISH`: after approval, a final dashboard **Publish** is required. `DEFAULT_PUBLISH` goes live automatically after review approval. Select it deliberately. Neither mode bypasses review, and the workflow does not cancel pending reviews. See Google's [API guide](https://developer.chrome.com/docs/webstore/using-api).

Dashboard: [Form Safe developer listing](https://chrome.google.com/webstore/devconsole/d135b9ba-ba1d-4ce7-8215-a93984939697/mhbeeoegononcomocnaekfibmjahmamk/edit).

## Verify the result

Check the workflow summary and retained artifacts, the exact GitHub tag/release assets, and the developer dashboard's upload/review status. After Chrome approval and publication, check the public listing's version and install that store version for real browser testing. A successful GitHub release or API upload is not proof of store approval or live availability.

The [Privacy Policy](PRIVACY.md) remains the canonical policy. Extension behavior and permission changes require corresponding listing/privacy review. Firefox signing and publishing can be added once an actual Firefox listing and credentials are available.
