# Instrucciones para Gemini

## Idioma
Definimos el idioma para comunicacion con Gemini en español (argentino).

## Comentarios
Realizar los comentarios en el codigo necesarios en idioma español, explicando el *porqué* de la lógica compleja, no el *qué*.

## Changelog
A medida que el proyecto avance, se registrarán los cambios significativos en `changelog.md` antes de hacer `git push`.

## Repositorio
- **URL:** https://github.com/dcolombres/DOTLINE
- **Rama Principal:** main

## Objetivo del Proyecto
Construir una aplicación completa y atractiva para que los usuarios puedan aprender y jugar al juego "DotLine". El objetivo es crear un juego pulido, robusto y con una buena experiencia de usuario.

## Plataformas
- **Principal:** Web (navegadores de escritorio y móviles).
- **Futuro:** Considerar la adaptación o creación de versiones nativas para iOS y Android a medida que el proyecto madure.

## Stack Tecnológico
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Librerías/Frameworks:** Por ahora, no se utilizarán librerías externas para mantener el proyecto simple. Se re-evaluará a medida que la complejidad aumente.

## Estructura de Directorios
```
/
|-- index.html
|-- css/
|   |-- style.css
|-- js/
|   |-- main.js
|-- README.md
|-- changelog.md
|-- z-gemini.md
```

## Estilo de Código y Convenciones

### JavaScript
- **Nomenclatura:**
    - Variables y funciones: `camelCase`
    - Clases: `PascalCase`
    - Constantes: `UPPER_CASE_SNAKE_CASE`
- **Indentación:** 4 espacios.
- **Punto y coma:** Obligatorio al final de cada declaración.
- **Variables:** Usar `const` por defecto, `let` solo cuando la variable necesite ser reasignada. Evitar `var`.
- **Modo Estricto:** Habilitar con `'use strict';` al inicio de los archivos.

### CSS
- **Nomenclatura:** `kebab-case` para selectores de clase e IDs.
- **Indentación:** 4 espacios.

### HTML
- **Indentación:** 4 espacios.
- **Estándar:** Seguir el estándar HTML5.

## Estrategia de Testing
- **Inicial:** Por el momento no se define un framework de testing. Se agregará uno (ej. Jest) cuando el proyecto adquiera mayor complejidad y se necesiten pruebas unitarias para asegurar la calidad.

## Despliegue (Deployment)
- **Plataforma:** No definida aún. Se podría considerar GitHub Pages, Netlify o Vercel en el futuro.

## Instrucciones Clave
- **Proactividad:** Eres responsable de proponer y crear la estructura de carpetas, los archivos de configuración y el código fuente necesarios para cumplir los objetivos.
- **Claridad:** Explica los cambios importantes y las decisiones de diseño que tomes.