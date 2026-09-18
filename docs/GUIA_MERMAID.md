# Guía de Mermaid para SlideForge

SlideForge usa **Mermaid 11.17.2** para convertir texto en diagramas. Sirve para explicar procesos, relaciones, cronologías, datos y estructuras sin dibujar cada elemento a mano.

## Cómo usar un diagrama

En el editor de una diapositiva, elige **Insertar → Mermaid** o pega un bloque como este:

```markdown
:::mermaid
flowchart LR
  Estudiante --> Actividad
  Actividad --> Retroalimentacion
:::
```

También puedes usar un bloque de código Markdown que empiece con tres comillas invertidas y la palabra `mermaid`. Escribe **un diagrama por bloque**. La primera línea dentro del bloque indica el tipo; al editarlo, la vista previa se actualiza.

> **Para importar un `.md` como presentación:** separa las diapositivas con una línea `---` fuera de los bloques. Los ejemplos de esta guía se pueden copiar dentro de una diapositiva existente.

## Qué puedes crear

| Tipo | Comienza con | Útil para |
| --- | --- | --- |
| Diagrama de flujo | `flowchart` | Procesos, decisiones, rutas de aprendizaje y arquitectura básica |
| Secuencia | `sequenceDiagram` | Conversaciones entre usuario, interfaz, servicios o actores |
| Estados | `stateDiagram-v2` | Ciclo de vida de un objeto o estados de una interfaz |
| Clases | `classDiagram` | Modelos orientados a objetos y relaciones entre clases |
| Entidad–relación | `erDiagram` | Estructuras de datos y relaciones entre entidades |
| Gantt | `gantt` | Cronogramas y fases de un proyecto |
| Línea de tiempo | `timeline` | Hitos históricos o evolución de una idea |
| Mapa mental | `mindmap` | Organización jerárquica de temas |
| Circular | `pie` | Proporciones de pocas categorías |
| Experiencia de usuario | `journey` | Etapas, tareas y satisfacción de un usuario |
| Historial Git | `gitGraph` | Ramas, commits y fusiones |
| Gráfico XY | `xychart-beta` | Barras y series numéricas sencillas |
| Cuadrantes | `quadrantChart` | Comparación en dos ejes |
| Sankey | `sankey-beta` | Flujos de cantidades entre etapas |

Mermaid también incluye otros tipos y algunas sintaxis experimentales. Antes de usar un diagrama poco habitual en clase, pruébalo en la vista previa y en el ZIP web exportado.

Otros tipos que reconoce la versión instalada son `block-beta` (bloques y distribuciones), `requirementDiagram` (requisitos), `C4Context` (arquitectura C4), `architecture-beta` (arquitectura de sistemas), `kanban` (tableros), `packet-beta` (paquetes de red), `radar-beta` (comparaciones radiales), `treemap-beta` (jerarquías por área) y `venn-beta` (conjuntos). Varias de estas sintaxis son experimentales y pueden cambiar al actualizar Mermaid; consulta la [lista oficial de tipos](https://mermaid.js.org/intro/) para sus ejemplos completos.

## Ejemplos listos para pegar

### 1. Proceso o decisión

```markdown
:::mermaid
flowchart LR
  A[Inicio] --> B{¿Comprendió el tema?}
  B -->|Sí| C[Avanzar]
  B -->|No| D[Revisar ejemplo]
  D --> B
:::
```

`LR` ordena de izquierda a derecha; `TD` ordena de arriba hacia abajo.

### 2. Interacción entre actores

```markdown
:::mermaid
sequenceDiagram
  actor Estudiante
  participant Interfaz
  participant Sistema
  Estudiante->>Interfaz: Envía respuesta
  Interfaz->>Sistema: Solicita evaluación
  Sistema-->>Interfaz: Devuelve resultado
  Interfaz-->>Estudiante: Muestra feedback
:::
```

### 3. Estados de una actividad

```markdown
:::mermaid
stateDiagram-v2
  [*] --> Pendiente
  Pendiente --> EnCurso: iniciar
  EnCurso --> Entregada: enviar
  Entregada --> Revisada: evaluar
  Revisada --> [*]
:::
```

### 4. Clases de un sistema

```markdown
:::mermaid
classDiagram
  class Curso {
    +String nombre
    +agregarEstudiante()
  }
  class Estudiante {
    +String nombre
    +entregarActividad()
  }
  Curso "1" --> "muchos" Estudiante : incluye
:::
```

### 5. Entidades de una base de datos

```markdown
:::mermaid
erDiagram
  CURSO ||--o{ ACTIVIDAD : contiene
  ESTUDIANTE ||--o{ ENTREGA : realiza
  ACTIVIDAD ||--o{ ENTREGA : recibe
:::
```

### 6. Cronograma

```markdown
:::mermaid
gantt
  title Plan de la unidad
  dateFormat YYYY-MM-DD
  section Preparación
  Lecturas :a1, 2026-10-01, 3d
  section Trabajo
  Taller :a2, after a1, 4d
  Presentación :a3, after a2, 1d
:::
```

### 7. Línea de tiempo

```markdown
:::mermaid
timeline
  title Evolución del curso
  2022 : Primera versión
  2024 : Nuevas actividades
  2026 : Presentaciones interactivas
:::
```

### 8. Mapa mental

```markdown
:::mermaid
mindmap
  root((Diseño de interacción))
    Usuarios
      Necesidades
      Contexto
    Interfaz
      Navegación
      Feedback
    Evaluación
      Pruebas
      Mejoras
:::
```

### 9. Proporciones

```markdown
:::mermaid
pie showData
  title Formas de participación
  "Debate" : 40
  "Taller" : 35
  "Lectura" : 25
:::
```

### 10. Experiencia de usuario

```markdown
:::mermaid
journey
  title Inscripción en una actividad
  section Descubrimiento
    Encuentra la actividad: 4: Estudiante
    Lee las instrucciones: 3: Estudiante
  section Entrega
    Sube el archivo: 5: Estudiante
    Recibe confirmación: 5: Estudiante
:::
```

### 11. Flujo de trabajo con Git

```markdown
:::mermaid
gitGraph
  commit id: "Inicio"
  branch actividad
  checkout actividad
  commit id: "Borrador"
  checkout main
  merge actividad
:::
```

### 12. Barras o líneas

```markdown
:::mermaid
xychart-beta
  title "Resultados por semana"
  x-axis [S1, S2, S3, S4]
  y-axis "Puntos" 0 --> 100
  bar [35, 52, 68, 81]
  line [35, 52, 68, 81]
:::
```

### 13. Matriz de prioridades

```markdown
:::mermaid
quadrantChart
  title Prioridad de actividades
  x-axis Bajo impacto --> Alto impacto
  y-axis Bajo esfuerzo --> Alto esfuerzo
  quadrant-1 Planificar
  quadrant-2 Revisar
  quadrant-3 Descartar
  quadrant-4 Hacer primero
  Taller: [0.85, 0.25]
  Lectura: [0.45, 0.35]
  Proyecto: [0.9, 0.8]
:::
```

### 14. Flujos de cantidades

```markdown
:::mermaid
sankey-beta
  Inicio,Clase,40
  Inicio,Taller,30
  Clase,Evaluación,35
  Taller,Evaluación,25
:::
```

## Consejos para que se vea bien en una diapositiva

- Usa pocos nodos y etiquetas breves; divide diagramas grandes en varias diapositivas.
- En `flowchart`, SlideForge ajusta automáticamente las etiquetas largas de nodos rectangulares. Puedes forzar un salto de línea con `<br>` dentro de una etiqueta.
- Para líneas de tiempo con muchos eventos o frases largas, prueba `timeline TD` para distribuirlos de arriba hacia abajo.
- Prefiere `LR` para procesos cortos y `TD` para diagramas con muchas ramas.
- Mantén una línea por relación o elemento. Respeta la indentación en mapas mentales.
- Si aparece **Error en Mermaid**, revisa la primera línea, los dos puntos, las comillas y los identificadores. Prueba primero un ejemplo mínimo.
- Los enlaces y eventos de Mermaid pueden estar limitados por la configuración de seguridad de SlideForge. Para interactividad docente usa los componentes propios de la app.
- Prueba el ZIP exportado en un servidor estático antes de publicarlo en Canvas o GitHub Pages.

## Documentación oficial

- [Lista de tipos y sintaxis de Mermaid](https://mermaid.js.org/intro/)
- [Diagramas de flujo](https://mermaid.js.org/syntax/flowchart.html)
- [Diagramas de secuencia](https://mermaid.js.org/syntax/sequenceDiagram.html)
- [Diagramas de clases](https://mermaid.js.org/syntax/classDiagram.html)
- [Diagramas de Gantt](https://mermaid.js.org/syntax/gantt.html)
- [Líneas de tiempo](https://mermaid.js.org/syntax/timeline.html)
