import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import JSZip from 'jszip';

export const extensionId = 'mhbeeoegononcomocnaekfibmjahmamk';
export const publisherId = 'd135b9ba-ba1d-4ce7-8215-a93984939697';
export function validateVersion(version) {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version) ||
      version.split('.').some(part => Number(part) > 65535) || version === '0.0.0') {
    throw new Error('Use a Chrome-compatible X.Y.Z version (components 0–65535).');
  }
  return version;
}
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export async function inspectSources(bytes) {
  const zip = await JSZip.loadAsync(bytes, { checkCRC32: true });
  if (!zip.file('package.json') || !zip.file('wxt.config.ts') || !zip.file('entrypoints/content.ts')) {
    throw new Error('Source archive is missing build inputs.');
  }
  for (const name of Object.keys(zip.files)) {
    if (/^(release|node_modules|\.git)\//.test(name) || /(^|\/)\.env(?:\.|$)|\.(pem|key)$/.test(name)) {
      throw new Error('Source archive contains generated releases or credential files.');
    }
  }
}
export async function inspectArchive(bytes, version, browser) {
  const zip = await JSZip.loadAsync(bytes, { checkCRC32: true });
  const file = zip.file('manifest.json');
  if (!file) throw new Error('Archive has no root manifest.json.');
  const manifest = JSON.parse(await file.async('string'));
  const content = manifest.content_scripts;
  if (manifest.name !== 'Form Safe' || manifest.version !== version ||
      manifest.manifest_version !== (browser === 'chrome' ? 3 : 2) ||
      (manifest.permissions?.length ?? 0) !== 0 ||
      (manifest.host_permissions?.length ?? 0) !== 0 ||
      content?.length !== 1 || JSON.stringify(content[0].matches) !== '["*://*/*"]' ||
      content[0].all_frames === true || manifest.background || manifest.action ||
      content[0].run_at !== 'document_idle') {
    throw new Error('Archive manifest differs from the expected Form Safe version or permission boundary.');
  }
  for (const asset of [...content[0].js, ...Object.values(manifest.icons ?? {})]) {
    if (!zip.file(asset.replace(/^\//, ''))) throw new Error(`Archive is missing ${asset}.`);
  }
  return manifest;
}
async function sourceInfo(root) {
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  if (pkg.name !== 'form-safe') throw new Error('Wrong source project.');
  const version = validateVersion(pkg.version);
  const sourceSha = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  return { version, sourceSha };
}
export async function prepareRelease(root = process.cwd()) {
  if (execFileSync('git', ['-C', root, 'status', '--porcelain'], { encoding: 'utf8' }).trim()) {
    throw new Error('Build releases from a clean Git checkout. Commit or set aside changes first.');
  }
  const { version, sourceSha } = await sourceInfo(root);
  const release = path.join(root, 'release');
  await mkdir(release, { recursive: true });
  const assets = [];
  for (const browser of ['chrome', 'firefox', 'sources']) {
    const name = `form-safe-${version}-${browser}.zip`;
    const bytes = await readFile(path.join(root, '.output', name));
    if (browser !== 'sources') await inspectArchive(bytes, version, browser);
    else await inspectSources(bytes);
    await copyFile(path.join(root, '.output', name), path.join(release, name));
    assets.push({ name, sha256: sha256(bytes), size: bytes.length });
  }
  const build = { schemaVersion: 1, project: 'mikr13/form-safe', version, sourceSha, extensionId, publisherId, assets };
  await writeFile(path.join(release, 'extension-build.json'), JSON.stringify(build, null, 2) + '\n');
  await writeFile(path.join(release, 'SHA256SUMS'), assets.map(a => `${a.sha256}  ${a.name}`).join('\n') + '\n');
  console.log(`Prepared v${version} from ${sourceSha}: Chrome, Firefox, sources, provenance, and checksums.`);
  return build;
}
export async function verifyRelease({ root = process.cwd(), directory = path.join(root, 'release'), tag, chromeOnly = false }) {
  const { version, sourceSha } = await sourceInfo(root);
  const build = JSON.parse(await readFile(path.join(directory, 'extension-build.json'), 'utf8'));
  if (tag !== `v${version}` || build.schemaVersion !== 1 || build.project !== 'mikr13/form-safe' ||
      build.version !== version || build.sourceSha !== sourceSha ||
      build.extensionId !== extensionId || build.publisherId !== publisherId) {
    throw new Error('Release tag, source commit, version, or store identity mismatch.');
  }
  const names = ['chrome', 'firefox', 'sources'].map(b => `form-safe-${version}-${b}.zip`);
  if (build.assets?.length !== names.length || !names.every(name => build.assets.filter(a => a.name === name).length === 1)) {
    throw new Error('Release has an unexpected asset set.');
  }
  for (const browser of (chromeOnly ? ['chrome'] : ['chrome', 'firefox', 'sources'])) {
    const name = `form-safe-${version}-${browser}.zip`;
    const asset = build.assets.find(a => a.name === name);
    const bytes = await readFile(path.join(directory, name));
    if (asset.size !== bytes.length || asset.sha256 !== sha256(bytes)) throw new Error(`Checksum mismatch: ${name}.`);
    if (browser !== 'sources') await inspectArchive(bytes, version, browser);
    else await inspectSources(bytes);
  }
  console.log(`Verified ${tag}, source ${sourceSha}, checksums, and ${chromeOnly ? 'Chrome manifest' : 'browser manifests'}.`);
  return build;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.includes('--verify')) {
      await verifyRelease({ root: path.resolve(process.env.SOURCE_DIR || '.'), directory: path.resolve(process.env.RELEASE_DIR || 'release'), tag: process.env.TAG, chromeOnly: process.argv.includes('--chrome-only') });
    } else await prepareRelease();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
