import { spawnSync } from 'node:child_process';
import { createPrivateKey } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { extensionId, publisherId } from './package-release.mjs';

export function normalizeChromeKey(raw) {
  try {
    let value = raw?.trim();
    if (value?.startsWith('{') || value?.startsWith('"')) {
      const parsed = JSON.parse(value);
      value = typeof parsed === 'string' ? parsed : parsed.private_key;
    }
    const key = createPrivateKey(value.replace(/\\r\\n|\\n/g, '\n'));
    if (key.asymmetricKeyType !== 'rsa') throw new Error();
    return key.export({ type: 'pkcs8', format: 'pem' }).toString();
  } catch {
    throw new Error('CHROME_SERVICE_ACCOUNT_PRIVATE_KEY must contain a complete RSA private_key PEM. Key contents are not logged.');
  }
}
export function chromeArguments(env) {
  if (env.CHROME_EXTENSION_ID !== extensionId || env.CHROME_PUBLISHER_ID !== publisherId) throw new Error('Chrome store identity does not match Form Safe.');
  if (!env.CHROME_ZIP) throw new Error('Missing verified CHROME_ZIP.');
  if (!['STAGED_PUBLISH', 'DEFAULT_PUBLISH'].includes(env.CHROME_PUBLISH_TYPE)) throw new Error('Unknown Chrome publish type.');
  const args = ['submit', '--chrome-api-version', 'v2', '--chrome-zip', env.CHROME_ZIP];
  switch (env.ACTION) {
    case 'dry-run': args.push('--dry-run'); break;
    case 'upload-draft': args.push('--chrome-skip-submit-review'); break;
    case 'submit-review': break;
    default: throw new Error('Unknown Chrome action.');
  }
  return args;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = chromeArguments(process.env);
    if (!process.env.CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL) throw new Error('Missing CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL.');
    const privateKey = normalizeChromeKey(process.env.CHROME_SERVICE_ACCOUNT_PRIVATE_KEY);
    const result = spawnSync('node', [fileURLToPath(new URL('../node_modules/wxt/bin/wxt.mjs', import.meta.url)), ...args], {
      stdio: 'inherit',
      env: { ...process.env, CHROME_API_VERSION: 'v2', CHROME_SERVICE_ACCOUNT_PRIVATE_KEY: privateKey },
    });
    process.exitCode = result.status ?? 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
