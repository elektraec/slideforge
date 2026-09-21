import { access, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const presentationsRoot = 'public/presentations';
const runtimeRoot = 'public/runtime';

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function presentationDirectories(root) {
  if (!await exists(root)) return [];
  const found = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const directory = join(root, entry.name);
    if (await exists(join(directory, 'index.html')) && await exists(join(directory, 'project.json'))) found.push(directory);
    found.push(...await presentationDirectories(directory));
  }
  return found;
}

const directories = await presentationDirectories(presentationsRoot);
for (const directory of directories) {
  const prefix = relative(directory, runtimeRoot).replaceAll('\\', '/');
  const indexPath = join(directory, 'index.html');
  const html = (await readFile(indexPath, 'utf8'))
    .replace(/href="[^"]*(?:css|runtime)\/player\.css"/, `href="${prefix}/player.css"`)
    .replace(/src="[^"]*(?:js|runtime)\/player\.js"/, `src="${prefix}/player.js"`);
  await writeFile(indexPath, html);
  await rm(join(directory, 'js', 'player.js'), { force: true });
  await rm(join(directory, 'css', 'player.css'), { force: true });
}

if (directories.length) console.log(`Presentaciones enlazadas al runtime compartido: ${directories.length}`);
