#!/bin/bash
# Fotos de fondo de /comida, /taxi y /flota (25-nov-2026): pasa las fotos originales (JPG) a WebP en `assets/fotos/`
# con los nombres que piden las páginas. Horizontal: 1920×1080 (16:9, computadora). Vertical: 1080×1920 (9:16, teléfono).
# Cualquier tamaño de entrada sirve: se recorta a la proporción y se reduce. Hace falta `cwebp` y `sips`.
# Uso (desde la raíz de la web): bash herramientas/fotos-web/convertir.sh "<carpeta con las fotos originales>"
# Para cambiar una foto: reemplazar el original (mismo nombre) y volver a correrlo.
set -euo pipefail
cd "$(dirname "$0")/../.."
ORIGEN="${1:-_provisionales/gemini}"; DESTINO=assets/fotos; CALIDAD=${CALIDAD:-88}

# convertir <entrada> <salida> <ancho> <alto> [corte vertical 0-100: qué parte se queda si sobra alto; 50 = centro]
convertir() {
  local entrada="$ORIGEN/$1" salida="$DESTINO/$2" W=$3 H=$4 corte=${5:-50}
  [ -f "$entrada" ] || { echo "falta $entrada"; return 0; }
  local w h; w=$(sips -g pixelWidth "$entrada" | awk '/pixelWidth/{print $2}'); h=$(sips -g pixelHeight "$entrada" | awk '/pixelHeight/{print $2}')
  local cw=$w ch=$(( w * H / W ))
  if [ "$ch" -gt "$h" ]; then ch=$h; cw=$(( h * W / H )); fi
  local x=$(( (w - cw) / 2 )) y=$(( (h - ch) * corte / 100 ))
  cwebp -quiet -q "$CALIDAD" -m 6 -crop "$x" "$y" "$cw" "$ch" -resize "$W" "$H" "$entrada" -o "$salida"
  echo "$salida  $(( $(stat -f%z "$salida") / 1024 )) KB"
}

# /comida (solo computadora; la comida a la derecha y la izquierda oscura para el texto)
convertir comida-1-mesa.jpg comida-1-h.webp 1920 1080
convertir comida-2-hamburguesa-pizza.jpg comida-2-h.webp 1920 1080
convertir comida-3-vegano.jpg comida-3-h.webp 1920 1080
# /taxi (mototaxi y taxi; en la vertical, lo importante arriba)
convertir moto-h.jpg taxi-moto-h.webp 1920 1080
convertir moto-v.jpg taxi-moto-v.webp 1080 1920
convertir taxi-h.jpg taxi-carro-h.webp 1920 1080
convertir taxi-v.jpg taxi-carro-v.webp 1080 1920
# /flota (el centro comercial con los motorizados pasando)
convertir flota-h.jpg flota-1-h.webp 1920 1080
convertir flota-v.jpg flota-1-v.webp 1080 1920
