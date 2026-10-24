<?php
/*
 * LA TIENDA Y EL SEGUIMIENTO EN www.deliservy.com (24-oct-2026).
 *
 * Gilberth: «vendedores, sus enlaces, la tienda del cliente y el seguimiento, todo en www.deliservy.com». El `.htaccess`
 * manda aquí, por dentro, dos direcciones:
 *   /v/<codigo>       el enlace de un vendedor (6 a 16 minúsculas y cifras)
 *   /pedido/<ficha>   el seguimiento de un pedido de la tienda web (la ficha firmada que da la API)
 * Este archivo le pide la página a la API de Deliservy (`https://api.deliservy.site/api/compartir/v/<codigo>` o
 * `…/compartir/pedido/<ficha>`) y la devuelve TAL CUAL: la barra del navegador sigue en www.deliservy.com y la vista
 * previa de WhatsApp sale con la foto del producto. Reenvía el `User-Agent`, el `Referer` y la IP de quien la abre (y
 * `?red=`), para que la visita y su red se cuenten bien. La página trae sus archivos y habla con la API por su
 * dirección entera (`https://api.deliservy.site/…`).
 *
 * Reglas: solo esas dos formas (lo demás, «no disponible» sin preguntar nada); tiempo límite; sin caché. Si la API no
 * contesta a tiempo (o se cae, o frena), el visitante va a la MISMA página en api.deliservy.site: nunca se queda sin
 * tienda. Nada se guarda ni se escribe aquí.
 */
declare(strict_types=1);

ini_set('display_errors', '0');

const API_DE_DELISERVY = 'https://api.deliservy.site';
const SEGUNDOS_PARA_CONECTAR = 3;
const SEGUNDOS_EN_TOTAL = 6;
const TAMANO_MAXIMO = 2097152; // 2 MB: la página pesa unos pocos KB

/** La API: la de siempre. Solo una prueba local puede cambiarla, y solo por un localhost. */
function base_de_la_api(): string
{
    $b = $_SERVER['DELISERVY_API_PRUEBA'] ?? getenv('DELISERVY_API_PRUEBA');
    if (is_string($b) && preg_match('#^http://(127\.0\.0\.1|localhost):\d{2,5}$#', $b)) {
        return $b;
    }
    return API_DE_DELISERVY;
}

/** Sin caché (es de una persona o cuenta una visita) y fuera de los buscadores. */
function cabeceras_de_la_pagina(): void
{
    header_remove('X-Powered-By');
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Robots-Tag: noindex');
    header('X-Content-Type-Options: nosniff');
    // En la tienda se escribe la tarjeta: que ninguna otra página la meta en un marco.
    header('X-Frame-Options: SAMEORIGIN');
    header("Content-Security-Policy: frame-ancestors 'self'");
}

function no_esta(): void
{
    http_response_code(404);
    cabeceras_de_la_pagina();
    echo '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        . '<meta name="robots" content="noindex"><title>Deliservy</title></head>'
        . '<body style="font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:48px 16px">'
        . '<h1 style="font-size:22px">Esto ya no está disponible</h1>'
        . '<p><a href="https://www.deliservy.com/" style="color:#e41616;font-weight:700">Ir a Deliservy</a></p></body></html>';
    exit;
}

/** La API no contestó como debía: la misma página, pero en api.deliservy.site. */
function ir_a_la_api(string $ruta): void
{
    header_remove('X-Powered-By');
    header('Cache-Control: no-store');
    header('Location: ' . base_de_la_api() . $ruta, true, 302);
    exit;
}

/** Una cabecera del visitante, sin saltos de línea ni caracteres de control, y corta. */
function del_visitante(string $nombre, int $largo): ?string
{
    $v = $_SERVER[$nombre] ?? '';
    if (!is_string($v) || $v === '') {
        return null;
    }
    $v = substr((string) preg_replace('/[\x00-\x1F\x7F]/', '', $v), 0, $largo);
    return $v === '' ? null : $v;
}

/** Con cURL (lo normal en Ferozo). `null` si no hay cURL. */
function pedir_con_curl(string $url, array $cabeceras): ?array
{
    if (!function_exists('curl_init')) {
        return null;
    }
    $cuerpo = '';
    $c = curl_init($url);
    curl_setopt_array($c, [
        CURLOPT_HTTPHEADER => $cabeceras,
        CURLOPT_CONNECTTIMEOUT => SEGUNDOS_PARA_CONECTAR,
        CURLOPT_TIMEOUT => SEGUNDOS_EN_TOTAL,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_ENCODING => '',
        CURLOPT_WRITEFUNCTION => function ($_c, string $trozo) use (&$cuerpo): int {
            $cuerpo .= $trozo;
            return strlen($cuerpo) > TAMANO_MAXIMO ? 0 : strlen($trozo); // 0 = cortar: ya es demasiado
        },
    ]);
    $ok = curl_exec($c);
    $estado = (int) curl_getinfo($c, CURLINFO_RESPONSE_CODE);
    $tipo = (string) curl_getinfo($c, CURLINFO_CONTENT_TYPE);
    unset($c);
    if ($ok === false) {
        return ['estado' => 0, 'tipo' => '', 'cuerpo' => ''];
    }
    return ['estado' => $estado, 'tipo' => $tipo, 'cuerpo' => $cuerpo];
}

/** Sin cURL: con el «http» de PHP, si el hosting lo deja. `null` si tampoco. */
function pedir_con_php(string $url, array $cabeceras): ?array
{
    if (!filter_var(ini_get('allow_url_fopen'), FILTER_VALIDATE_BOOLEAN)) {
        return null;
    }
    $contexto = stream_context_create(['http' => [
        'method' => 'GET', 'header' => implode("\r\n", $cabeceras), 'timeout' => SEGUNDOS_EN_TOTAL,
        'follow_location' => 0, 'max_redirects' => 0, 'ignore_errors' => true,
    ]]);
    $cuerpo = @file_get_contents($url, false, $contexto, 0, TAMANO_MAXIMO + 1);
    $lineas = function_exists('http_get_last_response_headers') ? (http_get_last_response_headers() ?? []) : ($http_response_header ?? []);
    if ($cuerpo === false || !$lineas) {
        return ['estado' => 0, 'tipo' => '', 'cuerpo' => ''];
    }
    $estado = preg_match('#^HTTP/\S+\s+(\d{3})#', (string) $lineas[0], $m) ? (int) $m[1] : 0;
    $tipo = '';
    foreach ($lineas as $l) {
        if (stripos((string) $l, 'Content-Type:') === 0) {
            $tipo = trim(substr((string) $l, 13));
        }
    }
    return ['estado' => $estado, 'tipo' => $tipo, 'cuerpo' => (string) $cuerpo];
}

// ── Qué se pide ─────────────────────────────────────────────────────────────

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($metodo !== 'GET' && $metodo !== 'HEAD') {
    header_remove('X-Powered-By');
    http_response_code(405);
    header('Allow: GET, HEAD');
    header('Cache-Control: no-store');
    exit;
}

$camino = (string) parse_url((string) ($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH);
if (preg_match('#^/v/([a-z0-9]{6,16})/?$#', $camino, $m)) {
    $ruta = '/api/compartir/v/' . $m[1];
    // De qué red viene, si el enlace lo dice (`?red=instagram`): solo una palabra corta.
    $red = $_GET['red'] ?? '';
    if (is_string($red) && preg_match('/^[a-z]{1,20}$/', $red)) {
        $ruta .= '?red=' . $red;
    }
} elseif (preg_match('#^/pedido/([A-Za-z0-9_-]{16,556}\.[A-Za-z0-9_-]{43})/?$#', $camino, $m)) {
    $ruta = '/api/compartir/pedido/' . $m[1];
} else {
    no_esta();
}

// ── Se le pide a la API, como si fuera el visitante ─────────────────────────

$cabeceras = ['Accept: text/html', 'X-Deliservy-Desde: www.deliservy.com'];
foreach ([['HTTP_USER_AGENT', 'User-Agent', 512], ['HTTP_REFERER', 'Referer', 1024], ['HTTP_ACCEPT_LANGUAGE', 'Accept-Language', 128]] as [$var, $nombre, $largo]) {
    $v = del_visitante($var, $largo);
    if ($v !== null) {
        $cabeceras[] = $nombre . ': ' . $v;
    }
}
$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
if (filter_var($ip, FILTER_VALIDATE_IP)) {
    $cabeceras[] = 'X-Forwarded-For: ' . $ip;
    $cabeceras[] = 'X-Real-IP: ' . $ip;
}

$url = base_de_la_api() . $ruta;
$r = pedir_con_curl($url, $cabeceras) ?? pedir_con_php($url, $cabeceras);

// Solo la página de verdad (la tienda, el seguimiento o «ya no está disponible»); si no, a la API directamente.
if ($r === null || !in_array($r['estado'], [200, 404], true) || stripos($r['tipo'], 'text/html') !== 0
    || $r['cuerpo'] === '' || strlen($r['cuerpo']) > TAMANO_MAXIMO) {
    ir_a_la_api($ruta);
}

http_response_code($r['estado']);
cabeceras_de_la_pagina();
echo $r['cuerpo'];
