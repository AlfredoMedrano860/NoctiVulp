# NoctiVulp

Página de NoctiVulp: herramientas de código abierto para Linux. Hecha con React, TypeScript y Vite.

## Comandos

```bash
npm install
npm run dev       # desarrollo en http://localhost:5173
npm run build     # build de producción en dist/
npm run preview   # sirve dist/ con las mismas cabeceras de seguridad que producción
npm run lint
```

## Configuración

- **`src/config.ts`**: enlaces a YouTube, Patreon, etc. Un botón cuyo enlace está vacío no se muestra.
  `PATREON_PROJECTS` lista los repos cuyo compilado está en Patreon. `PAINTED_BACKGROUND` activa el fondo pintado del hero.
- **`.env`**: `SITE_URL` es el dominio público (se usa en Open Graph, canonical y el sitemap).
  `UMAMI_SRC` y `UMAMI_WEBSITE_ID` activan métricas con [Umami](https://umami.is) si se completan.
- **`src/i18n.ts`**: todos los textos, en español e inglés.
- **`src/data/projects.ts`**: categoría de cada repo y la lista de respaldo por si GitHub no responde.

## Capturas de los proyectos

Pon las imágenes en `public/projects/<nombre-del-repo>/` (`.webp`, `.png`, `.jpg` o `.avif`).
Se ordenan por nombre: la primera es la portada (slider, índice, imagen al compartir) y el resto
aparece en la ficha del proyecto. También sirve un archivo suelto: `public/projects/<repo>.webp`.

```
public/projects/cast-dlna/01-principal.webp
public/projects/cast-dlna/02-ajustes.webp
```

Si un repo no tiene capturas, se usa una portada generada.

## Build

`npm run build` consulta la API de GitHub y genera una página estática por idioma y por proyecto
(`/`, `/en/`, `/p/<repo>/`, `/en/p/<repo>/`) con su título, descripción y Open Graph, además de
`sitemap.xml`, `robots.txt`, `404.html` y `_headers` (cabeceras de seguridad).

## Publicar

En **Cloudflare Pages** o **Netlify**: comando de build `npm run build`, carpeta `dist`.
Las cabeceras de `dist/_headers` se aplican solas en ambos.
