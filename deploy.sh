#!/bin/bash
# Deploy script para deliservy.com en VPS interbank (34.122.172.173)
# Ejecutar en el VPS: bash deploy.sh

set -e

DOMAIN="deliservy.com"
WWW_DIR="/var/www/deliservy"

echo "→ Creando directorio web..."
sudo mkdir -p $WWW_DIR

echo "→ Clonando/actualizando repo..."
if [ -d "$WWW_DIR/.git" ]; then
  cd $WWW_DIR && sudo git pull origin main
else
  sudo git clone https://github.com/TuUsuario/deliservy-web.git $WWW_DIR
fi

echo "→ Ajustando permisos..."
sudo chown -R www-data:www-data $WWW_DIR
sudo chmod -R 755 $WWW_DIR

echo "→ Configurando Nginx..."
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null <<NGINX
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    root $WWW_DIR;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/javascript image/svg+xml;
    gzip_min_length 1024;

    location / {
        try_files \$uri \$uri/ =404;
    }

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Redirect www → apex
    if (\$host = www.$DOMAIN) {
        return 301 https://$DOMAIN\$request_uri;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
sudo nginx -t && sudo nginx -s reload

echo "→ Instalando certbot si no está..."
if ! command -v certbot &> /dev/null; then
  sudo apt-get install -y certbot python3-certbot-nginx
fi

echo "→ Obteniendo SSL con Let's Encrypt..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@deliservy.com

echo "✓ Deploy completo. Sitio disponible en https://$DOMAIN"
