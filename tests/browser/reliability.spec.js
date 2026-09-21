import { test, expect } from '@playwright/test';
import JSZip from 'jszip';
import { readFile } from 'node:fs/promises';

async function openEditor(page) {
  await page.goto('./');
  const preview = page.frameLocator('#preview');
  await expect(preview.locator('.sf-navigation-controls')).toBeVisible();
  return preview;
}

test('navigation buttons and Arrow, Home and End keys remain available', async ({ page }) => {
  const preview = await openEditor(page);
  const previous = preview.locator('[data-nav="previous"]');
  const next = preview.locator('[data-nav="next"]');
  await expect(previous).toBeDisabled();
  await next.click();
  await expect(previous).toBeEnabled();
  await preview.locator('body').click({ position: { x: 200, y: 200 } });
  await page.keyboard.press('End');
  await expect(preview.locator('[data-nav="end"]')).toBeDisabled();
  await page.keyboard.press('Home');
  await expect(previous).toBeDisabled();
  await page.keyboard.press('ArrowRight');
  await expect(previous).toBeEnabled();
  await page.keyboard.press('ArrowLeft');
  await expect(previous).toBeDisabled();
});

test('Mermaid and compact Markdown tables render without overflow errors', async ({ page }) => {
  const preview = await openEditor(page);
  await page.locator('#content').fill(`# Diagrama\n\n:::mermaid\nflowchart LR\n  A[Una etiqueta extensa que debe ajustarse dentro de la figura] --> B[Resultado]\n:::\n\n| Concepto | Descripción |\n| --- | --- |\n| UI | Interfaz visible |\n| UX | Experiencia completa |`);
  await expect(preview.locator('.sf-mermaid svg')).toBeVisible();
  await expect(preview.locator('.sf-mermaid')).not.toContainText('Error en Mermaid');
  await expect(preview.locator('.sf-table-wrap table')).toBeVisible();
  const fits = await preview.locator('.sf-table-wrap').evaluate(wrapper => {
    const inner = wrapper.closest('.sf-slide-inner');
    return wrapper.getBoundingClientRect().width <= inner.getBoundingClientRect().width + 1;
  });
  expect(fits).toBe(true);
});

test('preview updates one slide and IndexedDB stores resources separately', async ({ page }) => {
  const preview = await openEditor(page);
  const before = await preview.locator('body').evaluate(() => ({ ...window.__slideforgeDiagnostics }));
  await page.locator('#content').fill('# Actualización incremental\n\nContenido editado.');
  await expect(preview.locator('.slides > section').first().locator('h1')).toContainText('Actualización incremental');
  const after = await preview.locator('body').evaluate(() => ({ ...window.__slideforgeDiagnostics }));
  expect(after.fullRenders).toBe(before.fullRenders);
  expect(after.incrementalRenders).toBeGreaterThan(before.incrementalRenders);

  const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
  await page.locator('#image-input').setInputFiles({ name: 'pixel.png', mimeType: 'image/png', buffer: pixel });
  await expect(page.locator('#save-status')).toHaveText('Guardado en este dispositivo');
  await page.getByRole('button', { name: /Recursos/ }).click();
  await expect(page.locator('.asset-item')).toContainText('pixel.png');

  const stored = await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => { const request = indexedDB.open('slideforge'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    const transaction = db.transaction(['projects', 'resources'], 'readonly');
    const get = (store, key) => new Promise((resolve, reject) => { const request = transaction.objectStore(store).get(key); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    const project = await get('projects', 'current');
    const resource = await get('resources', 'asset:pixel.png');
    return { reference: project.assets['pixel.png'], resource };
  });
  expect(stored.reference).toEqual({ storage: 'indexeddb', id: 'asset:pixel.png' });
  expect(stored.resource).toMatch(/^data:image\/png;base64,/);

  await page.reload();
  await page.getByRole('button', { name: 'Restaurar última sesión' }).click();
  await expect(page.locator('#content')).toHaveValue(/assets\/pixel\.png/);
  await page.getByRole('button', { name: /Recursos/ }).click();
  await expect(page.locator('.asset-item img')).toHaveAttribute('src', /^data:image\/png;base64,/);
});

test('unsafe HTML is sanitized and imported JavaScript stays disabled', async ({ page }) => {
  const preview = await openEditor(page);
  await page.locator('#content').fill('# Seguridad\n\n<img src="x" onerror="window.__unsafeHtml=true"><script>window.__unsafeScript=true</script>');
  const firstSlide = preview.locator('.slides > section').first();
  await expect(firstSlide.locator('h1')).toContainText('Seguridad');
  expect(await firstSlide.locator('img').getAttribute('onerror')).toBeNull();
  expect(await preview.locator('script').count()).toBe(1);
  expect(await preview.locator('body').evaluate(() => ({ html: window.__unsafeHtml, script: window.__unsafeScript }))).toEqual({ html: undefined, script: undefined });

  const imported = {
    version: 1,
    config: { title: 'Importado', enableCustomJs: true, customJs: 'window.__importedJsExecuted = true' },
    slides: [{ kind: 'content', name: 'Importada', content: '# Importada', notes: '' }],
    assets: {}
  };
  const importedZip = new JSZip();
  importedZip.file('project.json', JSON.stringify(imported));
  await page.locator('#file-input').setInputFiles({ name: 'proyecto.slideforge.zip', mimeType: 'application/zip', buffer: await importedZip.generateAsync({ type: 'nodebuffer' }) });
  await expect(preview.locator('.slides > section').first().locator('h1')).toContainText('Importada');
  expect(await preview.locator('body').evaluate(() => window.__importedJsExecuted)).toBeUndefined();
  await page.getByRole('button', { name: 'Tema y navegación' }).click();
  await expect(page.locator('[data-setting="enableCustomJs"]')).not.toBeChecked();
});

test('web ZIP contains the current interactive runtime and portable project files', async ({ page }) => {
  await openEditor(page);
  const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
  await page.locator('#image-input').setInputFiles({ name: 'pixel.png', mimeType: 'image/png', buffer: pixel });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar web ZIP' }).click();
  const download = await downloadPromise;
  const zip = await JSZip.loadAsync(await readFile(await download.path()));
  for (const path of ['index.html', 'slides.md', 'config.json', 'project.json', 'js/player.js', 'css/player.css']) expect(zip.file(path), path).not.toBeNull();
  expect(await zip.file('js/player.js').async('text')).toContain('sf-navigation-controls');
  expect(await zip.file('css/player.css').async('text')).toContain('sf-navigation-controls');
  expect(zip.file('assets/pixel.png')).not.toBeNull();
  const html = await zip.file('index.html').async('text');
  expect(html).not.toContain('data:image/png');
  expect(JSON.parse(await zip.file('project.json').async('text')).assets['pixel.png']).toBe('assets/pixel.png');
  expect((await zip.file('css/player.css').async('text')).length).toBeLessThan(200_000);
});

test('published presentations use the synchronized current runtime', async ({ page }) => {
  await page.goto('./presentations/ihm/clase01_ihm/index.html');
  await expect(page.locator('.sf-navigation-controls')).toBeVisible();
  await expect(page.locator('.sf-mermaid svg').first()).toBeVisible();
  await page.locator('[data-nav="next"]').click();
  await expect(page.locator('[data-nav="previous"]')).toBeEnabled();
});
