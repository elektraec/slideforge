# SlideForge

Editor libre de presentaciones docentes interactivas. Usa Reveal.js para las diapositivas, Mermaid para diagramas y una paleta institucional configurable. Funciona sin backend ni API de IA.

## Inicio rápido

```bash
npm install
npm run dev
```

Para generar la aplicación estática: `npm run build`. El resultado está en `dist/` y usa la ruta base `/slideforge/` para GitHub Pages. Para previsualizar el build: `npm run preview`.

## Autoría

Edita Markdown o HTML en cada diapositiva. El menú **Insertar** añade ejemplos de componentes. Separa diapositivas importadas de Markdown con `---`. Las notas pueden escribirse en el campo de notas o al final de una diapositiva importada con `Notes:`.

En **Tema y navegación → Avanzado** puedes añadir CSS y JavaScript propios. El JavaScript requiere activar la casilla correspondiente y se ejecuta en la presentación; revísalo antes de activar un proyecto ajeno.

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

La vista previa, el modo presentar y el ZIP web usan el mismo reproductor. Los datos se guardan automáticamente en el almacenamiento local del navegador. Las imágenes grandes pueden agotar su cuota; exporta el proyecto para una copia portátil.

El logo se carga en **Branding institucional**. No se incluye ningún logo ficticio. Puedes colocar uno en `public/branding/logo-institucional.png` para personalizar una instalación, o cargarlo desde la interfaz para incluirlo en un proyecto concreto.

## Publicación

El workflow `.github/workflows/pages.yml` compila la app y publica `dist/` en GitHub Pages. Activa GitHub Pages con fuente **GitHub Actions** en la configuración del repositorio. La ruta de la app es `https://USUARIO.github.io/slideforge/`. Un ZIP web exportado puede desplegarse en cualquier carpeta estática y embeberse en Canvas LMS mediante un `iframe`.

## Licencia

MIT. Las dependencias mantienen sus propias licencias.
