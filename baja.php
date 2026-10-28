<?php
/*
 * La baja del correo, en www.deliservy.com (28-oct-2026).
 * El correo no enseña admin.deliservy.site. Este archivo le pide la página al panel y la devuelve tal cual.
 */
declare(strict_types=1);

ini_set('display_errors', '0');

$token = '';
$ruta = $_SERVER['REQUEST_URI'] ?? '';
if (preg_match('#/baja/([A-Za-z0-9]{8,80})/?(\?|$)#', $ruta, $m)) {
    $token = $m[1];
}
if ($token === '') {
    http_response_code(404);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Deliservy</title></head><body style="font-family:sans-serif;text-align:center;padding:48px"><p>Ese enlace no es válido.</p></body></html>';
    exit;
}

$destino = 'https://admin.deliservy.site/api/campanas/baja/' . rawurlencode($token);
$metodo = ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST' ? 'POST' : 'GET';
$cuerpo = $metodo === 'POST' ? (string) file_get_contents('php://input') : '';

$ch = curl_init($destino);
curl_setopt_array($ch, [
    CURLOPT_CUSTOMREQUEST => $metodo,
    CURLOPT_POSTFIELDS => $metodo === 'POST' ? $cuerpo : null,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_CONNECTTIMEOUT => 4,
    CURLOPT_TIMEOUT => 8,
    CURLOPT_HTTPHEADER => ['Accept: text/html,application/json'],
]);
$raw = curl_exec($ch);
$codigo = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$corte = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

if (!is_string($raw) || $codigo < 200 || $codigo >= 400) {
    http_response_code(200);
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    echo '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Deliservy</title></head><body style="font-family:sans-serif;text-align:center;padding:48px"><p>Responda a este correo con la palabra BAJA y no le volvemos a escribir.</p></body></html>';
    exit;
}

$cuerpoRespuesta = substr($raw, $corte);
http_response_code($codigo > 0 ? $codigo : 200);
header($metodo === 'POST' ? 'Content-Type: application/json; charset=utf-8' : 'Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');
echo $cuerpoRespuesta;
