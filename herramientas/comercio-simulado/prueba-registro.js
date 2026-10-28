#!/usr/bin/env node
/*
 * Registro del comercio, aprobación, contraseña y «No tengo RIF» contra el servidor simulado.
 * No habla con producción.  node herramientas/comercio-simulado/prueba-registro.js
 */
'use strict';

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const PUERTO = 8791;
const FOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAg=';
const base = { nombreTienda: 'Arepera La Nueva', razonSocial: 'La Nueva C.A.', telefonoComercio: '0414-555-0198', duenoNombre: 'María Pérez', cedulaDueno: FOTO, mismaPersona: true, rif: 'J-504754129', rifArchivo: FOTO, correo: 'maria-prueba@ejemplo.com', clave: 'clave-segura', direccion: 'Av. Bolívar Norte, local 12, Valencia', categoriaId: 12, telefono: '0412-555-0197', codigo: '123456' };

function pedir(metodo, ruta, cuerpo) {
  return new Promise((ok, mal) => {
    const datos = cuerpo ? Buffer.from(JSON.stringify(cuerpo)) : null;
    const req = http.request({ hostname: '127.0.0.1', port: PUERTO, path: ruta, method: metodo, headers: datos ? { 'Content-Type': 'application/json', 'Content-Length': datos.length } : {} }, (res) => {
      const trozos = [];
      res.on('data', (c) => trozos.push(c));
      res.on('end', () => {
        let json = {};
        try { json = JSON.parse(Buffer.concat(trozos).toString('utf8') || '{}'); } catch (_) { json = {}; }
        ok({ status: res.statusCode, json });
      });
    });
    req.on('error', mal);
    if (datos) req.write(datos);
    req.end();
  });
}

function igual(nombre, visto, esperado) {
  const a = JSON.stringify(visto);
  const b = JSON.stringify(esperado);
  if (a !== b) throw new Error(nombre + '\n  visto: ' + a + '\n  esperado: ' + b);
  console.log('ok  ' + nombre);
}

async function main() {
  const hijo = spawn(process.execPath, [path.join(__dirname, 'servidor.js')], { env: { ...process.env, PUERTO: String(PUERTO) }, stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((ok, mal) => {
    const t = setTimeout(() => mal(new Error('el simulado no arrancó')), 8000);
    hijo.stdout.on('data', (b) => { if (String(b).includes('simulada')) { clearTimeout(t); ok(); } });
    hijo.on('exit', (c) => { clearTimeout(t); mal(new Error('salió ' + c)); });
  });
  try {
    const falta = await pedir('POST', '/api/comercio/registro', { ...base, nombreTienda: ' ' });
    igual('falta el nombre', [falta.status, falta.json.campo], [400, 'nombreTienda']);

    const misma = await pedir('POST', '/api/comercio/registro', base);
    igual('misma persona queda en revisión', [misma.status, misma.json.estado, misma.json.token || null], [200, 'pendiente', null]);

    const otra = await pedir('POST', '/api/comercio/registro', { ...base, telefono: '0414-555-0196', mismaPersona: false, correo: 'otra@ejemplo.com' });
    igual('sin la casilla falta la cédula del encargado', [otra.status, otra.json.campo], [400, 'cedulaEncargado']);

    const antes = await pedir('POST', '/api/comercio/acceso/clave', { correo: base.correo, clave: base.clave });
    igual('en revisión no entra con contraseña', antes.status, 409);

    const aprobado = await pedir('POST', '/__simulado/aprobar-comercio');
    igual('aprobar', [aprobado.status, aprobado.json.estado], [200, 'aprobado']);

    const malClave = await pedir('POST', '/api/comercio/acceso/clave', { correo: base.correo, clave: 'no-es-la-clave' });
    igual('contraseña distinta', malClave.status, 401);

    const bien = await pedir('POST', '/api/comercio/acceso/clave', { correo: base.correo, clave: base.clave });
    igual('entra con correo y contraseña', [bien.status, typeof bien.json.token === 'string' && bien.json.token.length === 43], [200, true]);

    const codigo = await pedir('POST', '/api/comercio/codigo', { telefono: base.telefono });
    const entra = await pedir('POST', '/api/comercio/entrar', { telefono: base.telefono, codigo: '123456' });
    igual('sigue el código de WhatsApp', [codigo.status, entra.status, typeof entra.json.token === 'string'], [200, 200, true]);

    const sinCedula = await pedir('POST', '/api/vendedor/registro', { codigo: '123456', sinRif: true });
    igual('sin cédula no pasa', [sinCedula.status, sinCedula.json.campo], [400, 'cedulaArchivo']);

    const sinRif = await pedir('POST', '/api/vendedor/registro', { codigo: '123456', sinRif: true, cedulaArchivo: FOTO });
    igual('No tengo RIF', [sinRif.status, sinRif.json.estado], [200, 'pendiente']);

    const sinNumero = await pedir('POST', '/api/vendedor/registro', { codigo: '123456', cedulaArchivo: FOTO });
    igual('con RIF falta el número', [sinNumero.status, sinNumero.json.campo], [400, 'rifNumero']);
  } finally {
    hijo.kill('SIGTERM');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
