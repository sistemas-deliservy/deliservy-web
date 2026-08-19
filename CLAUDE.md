# CLAUDE.md — deliservy-web

Landing page de **Deliservy** (https://deliservy.com). Sitio estático, sin build ni
framework: se edita el HTML directamente y se sirve tal cual desde Nginx.

- Repo: `git@github.com:sistemas-deliservy/deliservy-web.git` · rama `main`
- Producción: VPS interbank `34.122.172.173` → `/var/www/deliservy`

---

## Estructura

```
index.html          Landing completa (HTML + CSS + JS en un solo archivo)
privacidad.html     Política de Privacidad
terminos.html       Términos y Condiciones
deploy.sh           Provisión de Nginx + SSL. Se ejecuta EN EL VPS, no en local
assets/             Imágenes locales (logo, capturas de la app, banners)
qr-descarga.png     QR único de descarga (ver "QR" abajo)
qr-appstore.png     QR heredado — ya no se usa en index.html
qr-playstore.png    QR heredado — ya no se usa en index.html
```

Todo el CSS va en un único `<style>` dentro de `index.html`, y el JS en `<script>`
al final del `<body>`. No hay bundler, ni npm, ni paso de compilación: lo que se
commitea es exactamente lo que se sirve.

---

## Identidad visual

No cambiar estos colores sin acuerdo explícito — son la marca:

| Token | Valor | Uso |
|---|---|---|
| `--red` | `#e41616` | Color primario |
| `--orange` | `#ff5a1f` | Acento / fin del degradado |
| `--grad` | `linear-gradient(135deg, var(--red), var(--orange))` | Botones, títulos destacados, iconos activos |
| `--dark` | `#08080a` | Fondo base |

Tipografía: **Inter** (Google Fonts). Fondo oscuro en todo el sitio.
El degradado sobre texto se aplica con la clase `.grad-text`.

---

## Convenciones que hay que respetar

### Enlaces a las tiendas
Están repartidos por toda la página y deben permanecer sincronizados:

- App Store: `https://apps.apple.com/us/app/deliservy/id6761390577`
- Play Store: `https://play.google.com/store/apps/details?id=com.ivc.deliservy`

Cualquier `<a>` con la clase **`.store-link`** es reescrito en runtime por un IIFE
al final del script: detecta iOS por `userAgent` y apunta a la tienda correcta.
Si añades un botón de descarga, ponle `.store-link` y déjale el enlace de Play Store
como valor por defecto en el HTML.

### QR
Hay **un solo QR** (`qr-descarga.png`). El enlace que codifica resuelve en el
servidor con un 302 según el dispositivo. Los archivos `qr-appstore.png` y
`qr-playstore.png` quedaron de la versión anterior de dos QR; no los referencies.

### Flag DONACIONES_OCULTAS
La sección de donaciones está **oculta, no borrada**. Busca el comentario
`DONACIONES_OCULTAS` — marca los cinco puntos que hay que tocar para reactivarla:

1. `<li>` de donaciones en el nav
2. Enlace de donaciones en el menú móvil
3. `style="display:none"` en `<section id="donations">`
4. `<li>` de donaciones en el footer
5. Las llamadas comentadas a `loadDonationData()` y su `setInterval` en el script

Al reactivar, quitar el `display:none` y descomentar las cinco.

### API de donaciones
- `GET https://api.deliservy.site/api/donation/totals`
- `GET https://api.deliservy.site/api/donation/recent`

Dos detalles que ya costaron un bug cada uno y no hay que revertir:

- `amountUsd` y `amountBs` llegan como **strings**, no como números → usar `parseFloat`.
- `createdAt` viene **sin sufijo de zona horaria** pero es UTC → `_timeAgo()` le
  añade la `Z` antes de parsear. Sin eso, los tiempos salen desfasados.

### Deep link de donación (`handleDonate`)
Intenta abrir la app instalada antes de mandar a la tienda:

- **Android**: `intent://donate#Intent;scheme=deliservy;package=com.ivc.deliservy;...`
- **iOS**: iframe oculto con `deliservy://donate`. El iframe es obligatorio — sin él
  Safari muestra "no puede abrir la página". Un listener de `blur` cancela el
  fallback si la app sí abrió.
- **Escritorio**: abre el modal `#donate-modal` con las dos tiendas.

### Contacto
- Soporte: `soporte@deliservy.com` · Contacto: `contacto@deliservy.com`
- WhatsApp: `https://wa.me/584265201529`
- Instagram: `https://www.instagram.com/deliservy.app`
- Facebook: **sin URL todavía** — el icono del footer apunta a `#`

---

## Deploy

`deploy.sh` se ejecuta **en el VPS**, no en local. Hace `git pull`, ajusta permisos,
escribe la config de Nginx (gzip, cache de 30 días para estáticos, redirect
www → apex) y pide el certificado con certbot.

```bash
# en el VPS
cd /var/www/deliservy && bash deploy.sh
```

> **Pendiente conocido:** el script clona desde
> `https://github.com/TuUsuario/deliservy-web.git` — ese `TuUsuario` es un
> marcador de posición que nunca se reemplazó. El remoto real es
> `sistemas-deliservy`. Solo afecta al primer clonado; en un directorio que ya
> tiene `.git` la rama del `git pull` funciona bien.

---

## Al trabajar en este repo

- Editar `index.html` directamente. No introducir build steps ni frameworks.
- Antes de tocar una sección, leer el `git log` de ese archivo: varios comportamientos
  raros (iframe de iOS, parseo UTC, QR único) son correcciones deliberadas.
- Probar siempre en móvil real o emulado: buena parte del tráfico es móvil y el
  sitio tiene una CTA fija inferior (`#sticky-mobile-cta`) que solo aparece
  por debajo de 900px.
- Al añadir imágenes, guardarlas en `assets/` y referenciarlas con ruta relativa.
  Las fotos de servicios y testimonios son URLs externas de Unsplash.
- Los anclajes del nav dependen de `scroll-margin-top`; si cambias la altura del
  nav, actualiza ese valor o los títulos quedarán tapados.
