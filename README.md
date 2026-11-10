# meto.com.ar

Sitio oficial de MeTo — home + política de privacidad + términos y condiciones.

**Live:** https://meto.com.ar

## Páginas

- `index.html` — home institucional (hero, tagline, pills de "próximamente").
- `privacy.html` → servida en `/privacy` (Política de privacidad, Ley 25.326 AR).
- `terms.html` → servida en `/terms` (Términos y condiciones).
- `styles.css` — tokens de marca + layout compartido.

## Stack

HTML + CSS puro. Inter de Google Fonts. Cero JS. Deploy por Vercel con `cleanUrls: true` para servir `/privacy` y `/terms` sin extensión `.html`.

## Actualizar

Editá los archivos y hacé commit a `main`. Vercel re-deploya automático.

Si cambia la Política de privacidad o los Términos, subí también la versión y la fecha de entrada en vigor arriba de cada doc.

---
Avalon Agency SRL · CUIT 30-71734263-8 · hola@meto.com.ar
