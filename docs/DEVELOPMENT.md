# Development

Form Safe uses TypeScript and WXT. Bun installs dependencies from the committed `bun.lock`; Node.js 22.12 or later provides the runtime used by WXT's tooling.

## Set up

```sh
git clone https://github.com/mikr13/form-safe.git
cd form-safe
bun install --frozen-lockfile
```

The install hook runs `wxt prepare`, generating `.wxt/tsconfig.json` and WXT's types. Generated `.wxt`, `.output`, and `node_modules` directories are ignored by Git.

## Commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start WXT's Chrome development session |
| `bun run dev:firefox` | Start WXT's Firefox development session |
| `bun run compile` | Check TypeScript without emitting files |
| `bun run test` | Test release integrity, store identity, and publishing modes |
| `bun run changeset` | Record a user-visible change and its version bump |
| `bun run version` | Apply Changesets to `package.json` and `CHANGELOG.md` |
| `bun run release:prepare` | Check, test, package, and record release provenance from a clean checkout |
| `bun run build` | Build Chrome into `.output/chrome-mv3` |
| `bun run build:firefox` | Build Firefox into `.output/firefox-mv2` |
| `bun run zip` | Build and package Chrome into a ZIP in `.output` |
| `bun run zip:firefox` | Build and package Firefox, including its source archive, in `.output` |

Follow the [README](../README.md#install) for manual installation. Development mode may launch a separate browser profile. Reload the extension and test page after changing a manually loaded production build.

## Source map

| Path | Responsibility |
| --- | --- |
| [`entrypoints/content.ts`](../entrypoints/content.ts) | Field listeners, page-wide edit flag, unload guard, and mutation observer |
| [`wxt.config.ts`](../wxt.config.ts) | Manifest metadata, permissions, and icons |
| [`public/`](../public/) | Icons copied into the extension build |
| [`package.json`](../package.json) | Metadata, scripts, and development dependencies |
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | Type checking and Chrome/Firefox packaging |
| [`.github/workflows/ci-release.yaml`](../.github/workflows/ci-release.yaml) | Preview or publish a verified GitHub release |
| [`.github/workflows/chrome-publish.yml`](../.github/workflows/chrome-publish.yml) | Authenticate, upload a draft, or submit a tagged release to Chrome Web Store |
| [`scripts/`](../scripts/) | Archive/provenance verification and Chrome credential normalization |

There is no popup, options page, background script, storage layer, or application server.

## Verify a change

```sh
bun run compile
bun run test
bun run zip
bun run zip:firefox
git diff --check
```

CI runs these checks and uploads archives for inspection. Release tests reject altered ZIPs, mismatched source commits/versions/store identities, and unexpected permissions; they also check credential normalization and publishing modes. A successful build does not prove that a real browser displayed a warning. There is currently no automated browser-behavior test suite.

WXT derives the extension version from `package.json`. Use Changesets as described in [Release Process](../RELEASING.md); keep the next store version above the version already published. Firefox builds use the stable development ID `form-safe@mikr13.com` and declare no data collection; Firefox store signing and publication are not configured.

For content-script changes, use disposable test data and check each case in Chrome and Firefox:

1. Untouched fields navigate without an extension-requested warning.
2. Editing an input, text area, or select enables the warning on reload and document navigation.
3. Canceling the browser warning preserves the page and entered text.
4. Submitting or resetting a form clears the guard; another edit enables it again.
5. Fields and forms added after page load are watched.
6. Hidden and submit inputs do not enable the guard.
7. Tab close and back navigation work as expected under that browser's dialog policy.

Record browser and operating-system versions. Check the [documented limitations](../README.md#limits-to-know), including multiple forms and same-document navigation.
