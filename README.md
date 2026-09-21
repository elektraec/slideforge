# SlideForge

Editor libre de presentaciones docentes interactivas. Usa Reveal.js para las diapositivas, Mermaid para diagramas y una paleta institucional configurable. Funciona sin backend ni API de IA.

Consulta la [guía de Mermaid](docs/GUIA_MERMAID.md) para ver qué diagramas puedes crear y copiar ejemplos a tus diapositivas.

## Inicio rápido

```bash
npm install
npm run dev
```

Para generar la aplicación estática: `npm run build`. El resultado está en `dist/` y usa la ruta base `/slideforge/` para GitHub Pages. Para previsualizar el build: `npm run preview`.

## Autoría

Edita Markdown o HTML en cada diapositiva. El menú **Insertar** añade ejemplos de componentes. Separa diapositivas importadas de Markdown con `---`. Las notas pueden escribirse en el campo de notas o al final de una diapositiva importada con `Notes:`.

En **Tema y navegación → Avanzado** puedes añadir CSS y JavaScript propios. El JavaScript requiere activar la casilla correspondiente y se ejecuta en la presentación; revísalo antes de activar un proyecto ajeno.

El HTML se sanitiza antes de mostrarse. Al importar un proyecto JSON o `.slideforge.zip`, SlideForge conserva su JavaScript personalizado pero lo deja desactivado hasta que el usuario lo revise y lo active manualmente. Los `iframe` insertados se ejecutan en un entorno aislado.

Los bloques interactivos usan esta forma:

```markdown
:::quiz
question: ¿Cuál es la respuesta?
- [ ] Primera
- [x] Segunda
feedback: Correcto.
:::
```

Existen `quiz`, `truefalse`, `flashcards`, `tabs`, `accordion`, `answer`, `sort`, `match`, `slider`, `hotspot`, `calculator`, `form`, `mermaid`, `columns` e `iframe`. El generador de prompts produce texto para copiar a una herramienta externa; no realiza peticiones a servicios de IA.

Los diagramas aceptan tanto `:::mermaid` como bloques de código Markdown etiquetados `mermaid`.

## Archivos

- **Exportar Markdown:** `slides.md` con notas y metadatos de plantilla.
- **Exportar proyecto:** ZIP con `project.json`, `config.json`, `slides.md`, `assets/` y `branding/`. Abrirlo reconstruye el proyecto.
- **Exportar web ZIP:** contiene `index.html`, el contenido, los activos y el runtime de Reveal.js/Mermaid e interacciones. Descomprímelo en un servidor estático o publícalo en GitHub Pages. Para probarlo localmente, usa `python -m http.server` dentro de la carpeta extraída.
- **PDF / Imprimir:** abre Reveal.js en modo `?print-pdf`; espera a que cargue la presentación y usa la opción de imprimir/guardar PDF del navegador.

La vista previa, el modo presentar y el ZIP web usan el mismo reproductor. La edición de contenido actualiza únicamente la diapositiva modificada; los cambios estructurales o de tema regeneran la presentación completa.

El autosave usa IndexedDB. El documento, las imágenes y el logo se almacenan en registros separados, con migración automática de sesiones antiguas guardadas en `localStorage`. La sección **Recursos** permite reutilizar y eliminar imágenes sin volver a cargarlas. Exporta el proyecto para mantener además una copia portátil.

El botón **Editor visual** permite insertar o modificar componentes `quiz`, `truefalse`, `flashcards`, `tabs`, `accordion`, `sort`, `match`, `slider`, `mermaid`, `iframe` y respuestas sin escribir manualmente la sintaxis. La barra superior incorpora deshacer y rehacer mediante botones o `Ctrl+Z` / `Ctrl+Y`.

La barra lateral incluye miniaturas y búsqueda por nombre, contenido o notas. **Diagnóstico** identifica slides con contenido horizontal o vertical fuera del área visible y combina estimaciones inmediatas con las medidas reales del preview. **Guardar y publicar** explica el flujo de autoguardado, proyecto portable, web ZIP, PDF y publicación estática.

El reproductor mantiene explícitamente la vista de diapositivas de Reveal.js, incluso dentro de previews e iframes estrechos, para conservar la navegación mediante botones, `←`, `→`, `Home` y `End`.

El logo se carga en **Branding institucional**. No se incluye ningún logo ficticio. Puedes colocar uno en `public/branding/logo-institucional.png` para personalizar una instalación, o cargarlo desde la interfaz para incluirlo en un proyecto concreto.

## Publicación

El workflow `.github/workflows/pages.yml` compila la app y publica `dist/` en GitHub Pages. Activa GitHub Pages con fuente **GitHub Actions** en la configuración del repositorio. La ruta de la app es `https://USUARIO.github.io/slideforge/`. Un ZIP web exportado puede desplegarse en cualquier carpeta estática y embeberse en Canvas LMS mediante un `iframe`.

Las presentaciones ubicadas bajo `public/presentations/` se enlazan automáticamente al runtime compartido durante `npm run dev` y `npm run build`. De este modo, una presentación publicada no conserva versiones antiguas ni duplica varios megabytes de JavaScript y CSS. Los ZIP web continúan incluyendo su propio runtime para funcionar de manera independiente.

## Pruebas

```bash
npm test
npx playwright install chromium
npm run test:browser
```

Las pruebas de navegador validan navegación mediante botones y teclado, renderizado Mermaid, tamaño de tablas, sanitización de contenido importado y la estructura del ZIP web. El workflow de GitHub Pages ejecuta las pruebas antes de publicar.

## Licencia

MIT. Las dependencias mantienen sus propias licencias.
