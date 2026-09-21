import { access, copyFile, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';

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
  await mkdir(join(directory, 'js'), { recursive: true });
  await mkdir(join(directory, 'css'), { recursive: true });
  await copyFile(join(runtimeRoot, 'player.js'), join(directory, 'js', 'player.js'));
  await copyFile(join(runtimeRoot, 'player.css'), join(directory, 'css', 'player.css'));
}

if (directories.length) console.log(`Runtimes sincronizados: ${directories.length}`);
