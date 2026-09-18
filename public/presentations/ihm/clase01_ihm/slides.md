<!-- slideforge:content:Introducci%C3%B3n%20a%20IHM -->
# Introducción a IHM

## Interacción, interfaz, UI, UX y usabilidad

**Asignatura:** Interacción Hombre-Máquina  
**Tema:** Fundamentos y análisis de interfaces cotidianas  
**Modalidad:** Clase introductoria interactiva



:::mermaid
erDiagram
    CAR ||--o{ NAMED-DRIVER : allows
    CAR {
        string registrationNumber PK
        string make
        string model
        string[] parts
    }
    PERSON ||--o{ NAMED-DRIVER : is
    PERSON {
        string driversLicense PK "The license #"
        string(99) firstName "Only 99 characters are allowed"
        string lastName
        string phone UK
        int age
    }
    NAMED-DRIVER {
        string carRegistrationNumber PK, FK
        string driverLicence PK, FK
    }
    MANUFACTURER only one to zero or more CAR : makes

:::

Notes:
Presenta la sesión como una introducción práctica. Explica que se analizarán interfaces cotidianas, no solo aplicaciones sofisticadas. Relaciona el tema con experiencias reales: Canvas LMS, apps bancarias, cajeros, formularios web y servicios móviles.

---

<!-- slideforge:content:Prop%C3%B3sito%20de%20la%20clase -->
# Propósito de la clase

Al finalizar, podrás:

- diferenciar interacción, interfaz, UI, UX y usabilidad;
- reconocer la evolución de los paradigmas de interacción;
- explicar el diseño centrado en las personas;
- comparar interfaces cotidianas usando criterios básicos de IHM.

Notes:
Explica que IHM no se limita al diseño visual. Incluye personas, tareas, contexto, tecnología, accesibilidad, emociones, errores y evaluación.

---

<!-- slideforge:content:Pregunta%20inicial -->
# Pregunta inicial

:::quiz
question: Cuando una aplicación es difícil de usar, ¿cuál suele ser una causa probable?
- [ ] El usuario no sabe usar tecnología
- [ ] La pantalla tiene pocos colores
- [x] La interfaz no comunica bien cómo interactuar
- [ ] El dispositivo siempre es el problema
feedback: Correcto. Muchas dificultades aparecen porque la interfaz no orienta, no da feedback o no coincide con las expectativas del usuario.
:::

Notes:
Usa esta pregunta para desmontar la idea de que el error siempre pertenece al usuario. En IHM se analiza la relación entre persona, tarea, interfaz y contexto.

---

<!-- slideforge:content:%C2%BFQu%C3%A9%20estudia%20la%20IHM%3F -->
# ¿Qué estudia la IHM?

La **Interacción Hombre-Máquina** estudia cómo las personas interactúan con sistemas tecnológicos.

Incluye:

- personas;
- objetivos;
- tareas;
- contexto;
- dispositivos;
- interfaces;
- experiencia;
- evaluación.

Notes:
Aclara que también se usa el término Interacción Humano-Computadora. Explica que una máquina puede ser una app, una web, un cajero, un auto, un sistema de IA, un dispositivo médico o una plataforma educativa.

---

<!-- slideforge:content:Interacci%C3%B3n -->
# Interacción

La **interacción** es el intercambio entre una persona y un sistema.

:::mermaid
flowchart LR
  subgraph Client
    UI[Web app]
    Cache[(Local cache)]
  end
  subgraph Services
    API[API gateway]
    Auth[Auth service]
    Orders[Order service]
  end
  subgraph Storage
    DB[(Orders DB)]
  end
  UI --> API
  UI --> Cache
  API --> Auth
  API --> Orders
  Orders --> DB
  Auth -. token .-> UI

:::

Ejemplos:

- tocar un botón;
- escribir una búsqueda;
- arrastrar un archivo;
- recibir una alerta;
- corregir un error.

Notes:
Explica que la interacción no es solo entrada de datos. También incluye interpretación, respuesta del sistema, aprendizaje, corrección y toma de decisiones.

---

<!-- slideforge:content:Interfaz -->
# Interfaz

La **interfaz** es el punto de contacto entre la persona y el sistema.

Puede ser:

- gráfica;
- táctil;
- verbal;
- física;
- gestual;
- conversacional;
- multimodal.

:::flashcards
- Interfaz gráfica | Pantallas, botones, menús, formularios e íconos
- Interfaz física | Teclado, mouse, volante, cajero, control remoto
- Interfaz conversacional | Chatbot, asistente de voz o sistema de diálogo
- Interfaz gestual | Gestos táctiles, corporales o de movimiento
:::

Notes:
Pide ejemplos a los estudiantes. Puedes usar Canvas LMS, WhatsApp, cajeros automáticos, ascensores, aplicaciones bancarias, controles de televisión y sistemas de turnos.

---

<!-- slideforge:content:UI%20y%20UX -->
# UI y UX

**UI** y **UX** están relacionadas, pero no son lo mismo.

| Concepto | Se enfoca en | Pregunta clave |
|---|---|---|
| UI | Elementos visibles e interactivos | ¿Cómo se ve y se usa la interfaz? |
| UX | Experiencia completa | ¿Cómo se siente y funciona la experiencia? |
| Usabilidad | Facilidad para lograr objetivos | ¿Es fácil, eficiente y satisfactorio? |

Notes:
Da un ejemplo: una app puede verse moderna pero ser frustrante. En ese caso puede tener una UI atractiva, pero mala UX o baja usabilidad.

---

<!-- slideforge:content:Actividad%3A%20UI%20o%20UX -->
# Actividad: UI o UX

:::match
title: Relaciona cada situación con el concepto más adecuado
pairs:
- Color del botón principal | UI
- Tamaño de los íconos | UI
- Tipografía de los menús | UI
- El usuario abandona una compra por demasiados pasos | UX
- Sensación de confianza al usar banca móvil | UX
- Facilidad para completar una tarea completa | UX
feedback: UI se concentra en los elementos visibles e interactivos. UX considera la experiencia completa antes, durante y después del uso.
:::

Notes:
Pide que justifiquen una o dos respuestas. El objetivo es que comprendan que UI forma parte de UX, pero no la reemplaza.

---

<!-- slideforge:content:Usabilidad -->
# Usabilidad

La **usabilidad** describe qué tan fácil, eficiente y satisfactorio es usar un sistema para lograr objetivos concretos.

Preguntas guía:

- ¿Puedo entender qué hacer?
- ¿Puedo hacerlo sin cometer errores graves?
- ¿Puedo completar la tarea con satisfacción?
- ¿Puedo aprender a usarlo con facilidad?

:::truefalse
question: Una interfaz visualmente atractiva siempre tiene buena usabilidad.
answer: false
feedback: Falso. La estética puede ayudar, pero no garantiza comprensión, eficiencia, prevención de errores ni satisfacción.
:::

Notes:
Explica que la usabilidad se evalúa con usuarios reales, tareas concretas y contextos específicos.

---

<!-- slideforge:content:Dimensiones%20de%20la%20usabilidad -->
# Dimensiones de la usabilidad

:::tabs
tab: Eficacia
El usuario logra completar la tarea prevista.

Ejemplo: pagar una factura sin errores.

tab: Eficiencia
La tarea requiere tiempo y esfuerzo razonables.

Ejemplo: realizar una transferencia en pocos pasos claros.

tab: Satisfacción
El usuario percibe control, confianza y comodidad.

Ejemplo: una app bancaria que transmite seguridad.

tab: Aprendizaje
El sistema puede entenderse sin entrenamiento excesivo.

Ejemplo: un formulario claro desde el primer uso.
:::

Notes:
Invita a pensar en una app usada durante la semana. Pregunta si fue eficaz, eficiente, satisfactoria y fácil de aprender.

---

<!-- slideforge:content:Evoluci%C3%B3n%20de%20las%20interfaces -->
# Evolución de las interfaces

:::mermaid
timeline
    title Evolución de paradigmas de interacción
    1950s : Computación por lotes
    1970s : Línea de comandos
    1980s : Interfaces gráficas
    1990s : Web
    2000s : Móvil y táctil
    2010s : Voz, sensores y nube
    2020s : IA conversacional, realidad extendida y sistemas contextuales
:::

Notes:
Explica que la evolución no elimina completamente paradigmas anteriores. Terminal, web, móvil, voz e IA conviven en distintos contextos.

---

<!-- slideforge:content:Paradigmas%20de%20interacci%C3%B3n -->
# Paradigmas de interacción

:::accordion
title: Línea de comandos
Precisa y rápida para usuarios expertos, pero poco amigable para principiantes.

title: Interfaz gráfica
Usa ventanas, íconos, menús y puntero. Facilita el reconocimiento visual.

title: Interacción táctil
Permite tocar, deslizar, pellizcar y arrastrar directamente sobre la pantalla.

title: Voz y conversación
Permite expresar intenciones mediante lenguaje natural.

title: Realidad extendida
Integra elementos digitales con espacios físicos o virtuales.

title: IA conversacional
El sistema interpreta, responde y genera contenido mediante diálogo.
:::

Notes:
Resalta que no existe un paradigma perfecto para todos los casos. La selección depende de usuario, tarea, contexto, riesgo y dispositivo.

---

<!-- slideforge:content:Mini%20debate -->
# Mini debate

:::quiz
question: ¿Qué paradigma sería más apropiado para cambiar la música mientras se conduce?
- [ ] Formulario largo
- [ ] Tabla con muchas opciones
- [x] Voz o controles físicos simples
- [ ] Menú con varios niveles
feedback: Correcto. En ese contexto importan la seguridad, la atención y la reducción de carga visual.
:::

Notes:
Conecta la respuesta con contexto de uso. Una interfaz útil en escritorio puede ser peligrosa en movilidad.

---

<!-- slideforge:content:Dise%C3%B1o%20centrado%20en%20las%20personas -->
# Diseño centrado en las personas

El diseño centrado en las personas busca comprender necesidades reales antes de construir soluciones.

:::mermaid
flowchart LR 
    Comprender[Comprender personas y contexto] --> Definir[Definir problema]
    Definir --> Idear[Idear soluciones]
    Idear --> Prototipar[Prototipar]
    Prototipar --> Evaluar[Evaluar con usuarios]
    Evaluar --> Comprender
:::

Notes:
Explica que el proceso es iterativo. Se aprende mediante observación, prototipos, pruebas y mejoras sucesivas.

---

<!-- slideforge:content:Principios%20del%20dise%C3%B1o%20centrado%20en%20las%20personas -->
# Principios del diseño centrado en las personas

- Observar antes de asumir.
- Diseñar para tareas reales.
- Prototipar temprano.
- Evaluar con usuarios.
- Iterar con evidencia.
- Considerar accesibilidad e inclusión.

:::sort
title: Ordena el proceso de diseño centrado en las personas
items:
- Comprender usuarios y contexto
- Definir el problema
- Idear soluciones
- Prototipar
- Evaluar con usuarios
answer:
- Comprender usuarios y contexto
- Definir el problema
- Idear soluciones
- Prototipar
- Evaluar con usuarios
feedback: El proceso puede repetirse varias veces, pero comprender a las personas debe ocurrir antes de proponer soluciones.
:::

Notes:
Aclara que diseñar no es decorar pantallas. Diseñar es tomar decisiones informadas para facilitar la interacción.

---

<!-- slideforge:content:Caso%20cotidiano%3A%20cajero%20autom%C3%A1tico -->
# Caso cotidiano: cajero automático

Analiza un cajero automático desde IHM:

- ¿La tarea principal es clara?
- ¿Los botones corresponden a lo que se muestra?
- ¿El sistema da feedback?
- ¿Previene errores?
- ¿Permite cancelar?
- ¿Protege la privacidad?

:::hotspot
image: assets/cajero-ejemplo.png
title: Zonas críticas de análisis
points:
- x: 20
  y: 25
  label: Pantalla
  feedback: Verificar claridad de instrucciones, tamaño de texto y mensajes de confirmación.
- x: 75
  y: 35
  label: Botones
  feedback: Revisar correspondencia entre botones físicos y opciones en pantalla.
- x: 55
  y: 75
  label: Ranuras
  feedback: Comprobar si la ubicación y señalización reducen errores de uso.
fallback: Si no hay imagen, analiza un cajero que hayas usado recientemente y ubica mentalmente pantalla, botones, ranuras y mensajes.
:::

Notes:
La imagen es opcional para probar el componente hotspot. Si no existe el archivo, usar el fallback conceptual. Pregunta qué errores han visto en cajeros reales.

---

<!-- slideforge:content:Caso%20cotidiano%3A%20formulario%20web -->
# Caso cotidiano: formulario web

Un formulario universitario pide:

- nombres completos;
- cédula;
- correo;
- teléfono;
- carrera;
- modalidad;
- jornada;
- archivo PDF;
- aceptación de términos.

:::quiz
question: ¿Qué mejora tendría mayor impacto en la usabilidad del formulario?
- [ ] Poner más colores
- [x] Validar errores en el momento y explicar cómo corregirlos
- [ ] Ocultar las etiquetas
- [ ] Usar únicamente íconos
feedback: Correcto. La prevención y corrección clara de errores reduce frustración, tiempo perdido y abandono.
:::

Notes:
Explica la diferencia entre decir "campo inválido" y explicar "ingrese un correo con formato nombre@dominio.com".

---

<!-- slideforge:content:An%C3%A1lisis%20comparativo%20de%20interfaces -->
# Análisis comparativo de interfaces

Criterios básicos:

| Criterio | Pregunta |
|---|---|
| Claridad | ¿Se entiende qué hacer? |
| Consistencia | ¿Los elementos funcionan de manera similar? |
| Feedback | ¿El sistema informa lo que ocurre? |
| Prevención de errores | ¿Evita acciones peligrosas? |
| Accesibilidad | ¿Puede usarla diversidad de personas? |
| Eficiencia | ¿Reduce pasos innecesarios? |
| Satisfacción | ¿Genera confianza y control? |

Notes:
Presenta esta tabla como mini rúbrica. Indica que se debe justificar cada evaluación con evidencia observable.

---

<!-- slideforge:content:Actividad%3A%20compara%20dos%20interfaces -->
# Actividad: compara dos interfaces

Elige dos interfaces cotidianas:

- app bancaria y app de delivery;
- Canvas LMS y correo institucional;
- cajero automático y app móvil;
- formulario antiguo y formulario moderno;
- app de transporte y sitio web municipal.

Evalúa de 1 a 5:

| Criterio | Interfaz A | Interfaz B | Evidencia |
|---|---:|---:|---|
| Claridad |  |  |  |
| Eficiencia |  |  |  |
| Feedback |  |  |  |
| Prevención de errores |  |  |  |
| Accesibilidad |  |  |  |
| Satisfacción |  |  |  |

Notes:
Usar como trabajo individual o grupal. La evidencia puede ser número de pasos, mensajes del sistema, errores comunes, navegación o claridad del lenguaje.

---

<!-- slideforge:content:Slider%3A%20esfuerzo%20percibido -->
# Slider: esfuerzo percibido

:::slider
label: Esfuerzo necesario para completar una tarea
min: 1
max: 10
value: 5
lowLabel: Muy fácil
highLabel: Muy difícil
feedback:
- 1-3: La tarea parece simple, clara y fluida.
- 4-7: Hay fricción moderada. Conviene revisar pasos, mensajes y jerarquía visual.
- 8-10: La experiencia puede causar errores, abandono o frustración.
:::

Notes:
Usa el slider para explicar que la experiencia también puede analizarse desde la percepción del usuario, no solo desde métricas técnicas.

---

<!-- slideforge:content:Problemas%20frecuentes%20de%20usabilidad -->
# Problemas frecuentes de usabilidad

Algunos patrones problemáticos:

- botones sin etiqueta clara;
- mensajes de error ambiguos;
- demasiados pasos;
- navegación inconsistente;
- lenguaje técnico;
- falta de confirmación;
- información importante oculta;
- dependencia exclusiva del color.

:::truefalse
question: Si una interfaz usa rojo para error y verde para éxito, ya es accesible.
answer: false
feedback: Falso. No se debe depender solo del color. También se requieren textos, íconos, contraste suficiente y estados claros.
:::

Notes:
Introduce accesibilidad de manera breve. Menciona daltonismo, lectores de pantalla, contraste, tamaño de texto y navegación por teclado.

---

<!-- slideforge:content:Relaci%C3%B3n%20entre%20UI%2C%20UX%20y%20usabilidad -->
# Relación entre UI, UX y usabilidad

:::mermaid
flowchart TD
    UI[UI: interfaz visible e interactiva]
    Usabilidad[Usabilidad: facilidad para lograr objetivos]
    UX[UX: experiencia completa]
    Contexto[Contexto de uso]
    Persona[Persona usuaria]

    UI --> Usabilidad
    Usabilidad --> UX
    Contexto --> UX
    Persona --> UX
    Contexto --> Usabilidad
:::

Notes:
Explica que UI influye en UX, pero UX también depende de expectativas, contexto, emociones, confianza, tarea y resultado.

---

<!-- slideforge:content:S%C3%ADntesis%20de%20conceptos -->
# Síntesis de conceptos

:::flashcards
- IHM | Estudio de la interacción entre personas y sistemas tecnológicos
- Interacción | Intercambio de acciones y respuestas entre persona y sistema
- Interfaz | Punto de contacto entre persona y sistema
- UI | Elementos visibles e interactivos de la interfaz
- UX | Experiencia completa de uso
- Usabilidad | Facilidad, eficiencia y satisfacción al lograr objetivos
- Diseño centrado en personas | Proceso que parte de necesidades, tareas y contexto reales
:::

Notes:
Usa las flashcards para repasar antes de la evaluación rápida. Pide a un estudiante explicar un concepto con sus propias palabras.

---

<!-- slideforge:content:Evaluaci%C3%B3n%20r%C3%A1pida -->
# Evaluación rápida

:::quiz
question: ¿Cuál afirmación resume mejor la relación entre UI y UX?
- [ ] UI y UX son exactamente lo mismo
- [x] UI es parte de la experiencia, pero UX incluye más aspectos
- [ ] UX solo trata de colores
- [ ] UI no afecta la experiencia
feedback: Correcto. La UI influye en la UX, pero la experiencia también depende de contexto, tareas, expectativas, confianza y resultados.
:::

Notes:
Si hay respuestas incorrectas, volver a la tabla UI, UX y usabilidad.

---

<!-- slideforge:content:Actividad%20final -->
# Actividad final

## Análisis de una interfaz cotidiana

Selecciona una interfaz que uses frecuentemente.

Entrega breve:

1. captura o descripción;
2. tarea principal;
3. tres aciertos;
4. tres problemas;
5. propuesta de mejora;
6. justificación desde IHM, UI, UX y usabilidad.

Notes:
Esta actividad puede convertirse en tarea o foro en Canvas LMS. Solicita evidencia concreta, no solo opiniones generales.

---

<!-- slideforge:content:Cierre -->
# Cierre

## Próxima sesión

**Evaluación heurística y principios de usabilidad**

Idea final:

> Una buena interfaz no obliga al usuario a pensar en la interfaz; le permite concentrarse en su objetivo.

Notes:
Cierra conectando con la siguiente clase. Explica que se estudiarán criterios para evaluar interfaces de manera más sistemática.