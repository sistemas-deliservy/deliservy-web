# Tarifas de Liberty Express de Estados Unidos a Valencia

Consulta hecha el 26 de octubre de 2026. Las tres páginas de tarifa que el buscador sigue resumiendo (aéreo EE. UU. a Venezuela, casillero y AeroCarga) responden **404** al abrirlas, no están en el sitemap de tarifas (última modificación del sitemap: 23 de octubre de 2026) y la API pública de WordPress devuelve cero entradas para esos slugs. El menú de Venezuela enlaza `https://libertyexpress.com/es-ve/tarifas/` y esa dirección también es 404. La última captura de Archive.org de la página aérea con código 200 es del 21 de abril de 2024. Esas cifras del índice (6,50 USD por libra, tramos 5,95 / 5,70 / 5,45 / 5,20, AeroCarga 4,80 USD y mínimo 50 lb) no se tratan aquí como tarifa vigente.

Lo que sí está publicado el 26 de octubre de 2026 es la calculadora de Venezuela, `https://libertyexpress.com/es-ve/calculadora/`, que incrusta `https://iqpack.libertyexpress.com/Calculator?fromWebsite=true`. El JavaScript de esa calculadora lleva la marca `ver=261022_204342`. Las partidas de abajo son la respuesta HTTP 200 de `https://api.iqpackoffice.com/Cotizar` ese mismo día, con la ruta y el código de flete que usa esa calculadora. La tasa que acompaña el envío internacional prepagado es moneda USD, `cambio` 0 y `cambioConveniencia` 1. No hay tipo de cambio en bolívares en esa respuesta, y no se convierte nada.

La calculadora no deja elegir sucursal de destino en el envío internacional de Estados Unidos a Venezuela: el destino por defecto del país es la zona `VE.CCS` y la ruta queda `US.MIA-VE.CCS` si el origen es el de Miami. Valencia no tiene una zona propia con otro precio por libra.

## Tarifa aérea por libra y zona de Valencia

### Takeaway
Desde Miami (`US.MIA`) hacia la zona `VE.CCS`, el flete aéreo prepagado de paquete es 4,75 USD por libra por debajo de 10 lb. Las oficinas de Valencia ciudad y la entrega a domicilio de Valencia están en esa zona. La zona interior `VE.Z00` no cambia el precio por libra: suma 5 USD fijos de zona foránea.

### Cited Findings
- Producto `US-PPD-0008`, nombre «PPD FLETE PAQUETE AEREO», unidad `LBS/VOL`, precio 4,75 USD, operador de multiplicación, sin mínimo de cantidad ni de precio, ruta `US.MIA-VE.CCS`, 1 lb y FOB 100 USD: neto 4,75 USD. El mismo precio unitario se mantiene en 0,5 lb, 2 lb, 5 lb y 9 lb. — [Calculadora iQPack](https://iqpack.libertyexpress.com/Calculator?fromWebsite=true), cotización del 26 de octubre de 2026
- En el catálogo de destinos embebido en esa calculadora, estas oficinas de Carabobo tienen `codigoZona` `VE.CCS`: «Valencia – C.C Metro Sur» (código `VE.VLM`, id destino 546), «Valencia Norte» (`VE.VAN`, 547), «Valencia Centro» (`VE.VLC`, 5509), «Entrega a Domicilio Valencia» (`VE.RVA`, 497) y Puerto Cabello (`VE` id 519 y «Entrega a Domicilio Puerto Cabello» id 5465). Cotizar 1 lb y 10 lb contra MetroSur, Valencia Centro o el domicilio de Valencia, con ruta `US.MIA-VE.CCS`, da el mismo flete que la ruta sin sucursal (4,75 USD/lb por debajo de 10 lb; 3,98 USD/lb a las 10 lb) y no agrega zona foránea. — [Calculadora iQPack](https://iqpack.libertyexpress.com/Calculator?fromWebsite=true)
- La ruta `US.MIA-VE.Z00` mantiene el mismo flete por libra (4,75 USD en 1 lb; 3,98 USD en 10 lb) y agrega la partida «PPD ZONA FORANEA (A)», 5 USD por unidad, una sola vez. Total de 1 lb con FOB 100 USD: 16,64 USD en `VE.Z00` frente a 11,64 USD en `VE.CCS`. En el mismo catálogo están en `VE.Z00`: «Centro de Distribución Valencia- CDVLM» (`VE.CVL`, id 5517; el campo `Ruta` dice `US.MIA-VE.Z00`) y «Los Guayos» (id 5677). Cotizar Los Guayos con esa ruta también suma los 5 USD. — [Calculadora iQPack](https://iqpack.libertyexpress.com/Calculator?fromWebsite=true)
- Otras zonas de origen en Estados Unidos, 1 lb, FOB 100 USD, destino `VE.CCS`: `US.LAX`, `US.NYQ` y `US.HKT` cobran flete 5,00 USD/lb y manejo aduanal 1,50 USD/lb. `US.MOR` (el catálogo agrupa ahí Kissimmee y pickup Tampa) cobra flete 4,75 USD/lb y manejo aduanal 1,75 USD/lb. Combustible 0,15 USD/lb y manejo de guía 0,99 USD se mantienen en esas pruebas de 1 lb. — [Calculadora iQPack](https://iqpack.libertyexpress.com/Calculator?fromWebsite=true)
- La página de sucursales de Venezuela, modificada el 1 de octubre de 2026 (`article:modified_time` `2026-10-01T04:17:07+00:00`), lista en Carabobo «Valencia CC MetroSur», «Valencia Norte» y «Valencia Centro». En el HTML, Norte publica el teléfono 58 412 0629598 y Centro el 58 412 5327311. Las direcciones y los horarios de esas tres tarjetas van vacíos. El catálogo de la calculadora trae otras direcciones y, para Valencia Centro, el teléfono 58 424-2185231, distinto del de la página de sucursales. — [Sucursales Venezuela](https://libertyexpress.com/es-ve/sucursales/); [Calculadora iQPack](https://iqpack.libertyexpress.com/Calculator?fromWebsite=true)
- Direcciones del catálogo de la calculadora: Metro Sur, «Municipio Valencia. Galpón A-01. Centro Empresarial Metro Sur. Av. 73 (Humberto Celli) Zona Industrial Municipal. Parroquia Rafael Urdaneta. (Frente a la UNEFA La Isabélica)»; Valencia Norte, «Urbanizacion Agua Blanca, Valencia, Carabobo»; Valencia Centro, «Redoma de Guaparo, Valencia, Carabobo»; entrega a domicilio Valencia, «Av. Andrés Eloy Blanco, Valencia, Carabobo», teléfono 0501-(2687437). — [Calculadora iQPack](https://iqpack.libertyexpress.com/Calculator?fromWebsite=true)

### Inferences
- Para un comprador que usa el formulario sin elegir sucursal, el precio que devuelve la calculadora es el de `US.MIA-VE.CCS`. Las tres agencias de Valencia y el domicilio de Valencia caen en esa zona, así que no pagan el recargo de 5 USD. Los Guayos y el centro de distribución de Valencia sí están marcados `VE.Z00`.

### Gaps
- Los tramos por peso de más abajo están comprobados solo en `US.MIA-VE.CCS` y, en 1 lb y 10 lb, en `US.MIA-VE.Z00`. No se rehicieron los tramos de 15, 20 y 25 lb para Los Ángeles, Nueva York u Houston.
- El campo `Ruta` de las oficinas de Valencia ciudad dice `US.MIA-VE.Z00` aunque su `codigoZona` es `VE.CCS`. La cotización con el id de esas oficinas y la ruta `VE.CCS` no cobró zona foránea. No hay una página que explique cuál de los dos campos manda cuando un operador arma la guía a mano.

## Tramos por peso

### Takeaway
No hay una primera libra más cara y el resto a otro precio. Hay un solo precio por libra para todo el peso, y baja al cruzar 10, 15, 20 y 25 lb. El manejo aduanal sube de 0,75 a 1,03 USD por libra desde las 10 lb y ya no baja.

### Cited Findings
Ruta `US.MIA-VE.CCS`, producto `US-PPD-0008`, FOB 100 USD. El precio del flete se aplica a todas las libras (`operador` X). Cotización del 26 de octubre de 2026 en la [calculadora iQPack](https://iqpack.libertyexpress.com/Calculator?fromWebsite=true):

- Por debajo de 10 lb: flete 4,75 USD por `LBS/VOL`. Comprobado en 0,5, 1, 2, 5 y 9 lb. La fila de tarifa de 1 lb no trae rango (`desde` 0, `hasta` 0).
- De 10 a 14,99 lb: flete 3,98 USD por `LBS/VOL`. Comprobado en 10 y 14 lb.
- De 15 a 19,99 lb: flete 3,73 USD por `LBS/VOL`. Comprobado en 15 lb; el total de 19 lb (99,28 USD) cuadra con 3,73 USD por libra más las otras partidas.
- De 20 a 24,99 lb: flete 3,48 USD por `LBS/VOL`. Comprobado en 20 y 24 lb.
- De 25 a 9999 lb: flete 3,23 USD por `LBS/VOL`. Comprobado en 25, 30 y 50 lb.
- Manejo aduanal «PPD MANEJO ADUANAL AEREO» (`US-PPD-0007`): 0,75 USD por `LBS/VOL` por debajo de 10 lb; desde 10 lb, 1,03 USD por `LBS/VOL` con rango `desde` 10 `hasta` 100000000000. Comprobado en 9 lb (0,75) y en 10 lb en adelante (1,03).
- Estas cifras no son las del índice de búsqueda (5,95 / 5,70 / 5,45 / 5,20 USD). Esas páginas están en 404.

### Inferences
- El descuento es sobre el precio de cada libra del envío entero, no un premio solo a las libras que pasan el tramo. Por eso el total de 20 lb (99,19 USD) queda por debajo del de 19 lb (99,28 USD), y el de 25 lb (116,24 USD) por debajo del de 24 lb (117,83 USD), siempre con FOB 100 USD.

### Gaps
- No hay una fila publicada que diga el tope inferior del tramo de 4,75 USD. Solo se observó que a 9 lb sigue en 4,75 y a 10 lb pasa a 3,98.

## Mínimo por envío

### Takeaway
El aéreo prepagado de paquete no tiene mínimo: media libra se cobra como media libra. El documento es una tarifa plana de 26,99 USD. El casillero aéreo declara un mínimo de 1 lb y 3,25 USD de flete. Heavy Box tiene mínimo de 30 lb.

### Cited Findings
- 0,5 lb, ruta `US.MIA-VE.CCS`, FOB 100 USD: flete 4,75 × 0,5 = 2,38 USD. La fila de flete trae `cantidad_Minimo` 0 y `precio_Minimo` 0. — [Calculadora iQPack](https://iqpack.libertyexpress.com/Calculator?fromWebsite=true)
- Documentos, código `US-PPD-20966`, nombre «PPD FLETE PAQ DOC»: 26,99 USD de neto tanto en 1 lb como en 2 lb. En 2 lb el precio unitario sale 13,495 USD y el neto sigue en 26,99 USD (operador de igualdad, no de multiplicación). No se cobraron seguro, combustible ni manejo aduanal en esas dos cotizaciones, con FOB 0. — [Calculadora iQPack](https://iqpack.libertyexpress.com/Calculator?fromWebsite=true)
- Casillero aéreo, código `VE-COL-0218`, «COL FLETE PAQ»: la fila dice precio 3,25 USD por `LBS/VOL`, operador mínimo, `cantidad_Minimo` 1 y `precio_Minimo` 3,25. En 1 lb el precio cobrado es 3,25 USD y el neto 3,77 USD. — [Calculadora iQPack](https://iqpack.libertyexpress.com/Calculator?fromWebsite=true)
- La página del casillero de Venezuela, modificada el 1 de octubre de 2026, dice: «No hacemos consolidados ni re-empacamos en el caso de envíos pequeños solo cobramos la libra detallada sin mínimo (aéreo)». — [Casillero Venezuela](https://libertyexpress.com/es-ve/casillero-para-compras-por-internet/)
- Heavy Box, código `US-PPD-21410`, solo entra en el catálogo de la calculadora si el peso es de 30 lb o más (`unidad` libras, condición `>=`, valor 30). La fila «PPD FLETE HEAVY BOX (EEUU TARIFAS)» en `US.MIA-VE.CCS` tiene operador mínimo, `cantidad_Minimo` 30 y `precio_Minimo` 86,7 USD. El combustible tiene mínimo 30 lb y 13,5 USD. — [Calculadora iQPack](https://iqpack.libertyexpress.com/Calculator?fromWebsite=true)

### Inferences
- La frase «sin mínimo» de la página del casillero y el mínimo de 1 lb / 3,25 USD de la calculadora no dicen lo mismo. Las dos están publicadas.

### Gaps
- No se cotizó un documento de 3 lb. El código de documentos de Estados Unidos a Venezuela no trae tope de 2 lb. El «hasta 2 lbs» y los 22 USD (27 USD con zona foránea) están solo en páginas que hoy dan 404.

## Peso volumétrico

### Takeaway
El flete aéreo se factura con la unidad `LBS/VOL`, pero ni la calculadora ni la cotización publican la fórmula largo × ancho × alto. Mandar medidas en pulgadas no cambió las libras cobradas. La condición nacional sí dice que se cobra el mayor entre peso físico y volumétrico, y tampoco da la fórmula.

### Cited Findings
- El JavaScript de la calculadora (`main.js`, marca `ver=261022_204342`) oculta largo, ancho y alto cuando el origen es Estados Unidos, el servicio es envío internacional y el destino no es Europa ni México. Venezuela cae en ese caso. — [Calculadora iQPack](https://iqpack.libertyexpress.com/Calculator?fromWebsite=true)
- Cotizaciones del 26 de octubre de 2026 con 1 lb y caja de 20×20×20 pulgadas, con 1 lb y 12×12×12 pulgadas, y con 10 lb y 20×20×20 pulgadas: `pesoVolumetrico` volvió nulo y la cantidad cobrada siguió siendo el peso real (1 o 10). El total no se movió respecto de la misma cotización sin medidas. — [Calculadora iQPack](https://iqpack.libertyexpress.com/Calculator?fromWebsite=true)
- Condiciones del servicio de envíos nacionales, modificadas el 1 de octubre de 2026: «A los Envíos realizados por Liberty Express se le calculan tanto el peso físico como el peso volumétrico y el que predomine entre ambos será el considerado para realizar el cobro del mismo». No aparece factor ni fórmula. — [Condiciones de envíos nacionales](https://libertyexpress.com/es-ve/condiciones-del-servicio-envios-nacionales/)
- La página de España (electrónicos) a Venezuela sí publica fórmula y factor 167 para aéreo, 250 para marítimo y 333 para terrestre, y dice que se cobra el mayor entre peso y volumen. Es otro corredor, no el de Estados Unidos. — [Tarifa España electrónicos](https://libertyexpress.com/tarifa/tarifa-envio-aereo-desde-espana-electronicos-a-venezuela/)

### Inferences
- La unidad `LBS/VOL` anuncia que el flete puede salir del volumen, pero con esta calculadora y esta API, el 26 de octubre de 2026, un paquete de Estados Unidos a Venezuela se cobró por el peso digitado.

### Gaps
- No hay fórmula publicada para el corredor Estados Unidos–Venezuela. No se aplica aquí el 167 de la página de España.

## Seguro, combustible, manejo y aduana

### Takeaway
En el aéreo prepagado desde Miami a `VE.CCS` se suman, aparte del flete: seguro, manejo aduanal por libra, 0,99 USD de guía house y 0,15 USD de combustible por libra. El seguro es 5 USD fijos si el FOB va de 1 a 100 USD, y 5 % del FOB desde 101 USD. Con FOB 0 no se cobró seguro. Las partidas de impuesto aduanal volvieron en 0 en la cotización de FOB 100 USD.

### Cited Findings
Partidas de la cotización aérea prepagada, ruta `US.MIA-VE.CCS`, 26 de octubre de 2026, [calculadora iQPack](https://iqpack.libertyexpress.com/Calculator?fromWebsite=true):

- «PPD SEGURO AEREO» (`US-PPD-0006`). Fila de ruta y rango `US.MIA-VE.CCS`, `desde` 0 `hasta` 100, precio 5, unidad FOB, operador de igualdad: con FOB 1, 60, 61 y 100 USD el neto es 5 USD. Con FOB 0 esa partida no entra al cobro (1 lb queda en 6,64 USD en vez de 11,64 USD). Con FOB 101 USD el operador pasa a porcentaje, el precio de la fila es 5 y el neto es 5,05 USD. Con FOB 300, 500, 800 y 1000 USD el neto es el 5 % del FOB (15, 25, 40 y 50 USD).
- «PPD MANEJO ADUANAL AEREO»: 0,75 USD por `LBS/VOL` bajo 10 lb; 1,03 USD por `LBS/VOL` desde 10 lb. Ver la sección de tramos.
- «MANEJO Y PROCESAMIENTO GUIA HOUSE (A)» (`US-PPD-20737`): 0,99 USD por unidad, una vez, en todas las cotizaciones aéreas de paquete y de teléfono.
- «PPD MANEJO COMBUSTIBLE AEREO» (`US-PPD-22076`): 0,15 USD por `LBS` (no por `LBS/VOL` en la fila), multiplicado por las libras. Hay otra fila «PPD COMBUSTIBLE» (`US-PPD-20814`) a precio 0.
- «PPD IMPUESTO ADUANAL» y «PPD IMPUESTO ADUANAL (FOB)» salieron a precio 0 en la cotización de 1 lb y FOB 100 USD. No se sumaron al neto.
- «PPD ZONA FORANEA (A)»: precio 0 en `US.MIA-VE.CCS`; 5 USD por unidad en `US.MIA-VE.Z00`.
- Ejemplo de 1 lb, FOB 100 USD, Miami a `VE.CCS`: flete 4,75 + seguro 5 + manejo aduanal 0,75 + guía 0,99 + combustible 0,15 = 11,64 USD.
- Casillero aéreo (`VE-COL-0218`), cotización de 2 lb con FOB 100 USD: la tasa del mismo JSON es `isO2_Pais` VE, `isO3_Moneda` «BS.», `cambio` 0, `cambioConveniencia` 910. Los netos de las partidas suman el `valorCotizado` (19,09) y no se convierten aquí a bolívares. En esa cotización el impuesto de las partidas de flete, gestión, combustible y gastos operacionales es el 16 % del precio antes de impuesto (en 2 lb, flete 7,50 USD e impuesto 1,20 USD). El franqueo postal es el 10 % del flete antes de impuesto: la fila dice precio 10, unidad «Flete», operador porcentaje; en 1 lb el neto es 0,33 USD, en 2 lb 0,75 USD y en 10 lb 4,15 USD.
- Otras partidas del casillero aéreo, precios de la fila: gestión aduanal 1 USD por unidad (neto 1,16 USD con el impuesto), combustible 0,75 USD por `LBS/VOL`, gastos operacionales 0,75 USD por `LBS/VOL`. El seguro, con FOB 100 USD, salió en 5 USD; la fila dice 5 % del FOB. No se probaron otros FOB en casillero.

### Inferences
- En el casillero, el precio unitario cobrado del flete no es el 3,25 USD de la fila cuando hay más de una libra: 1 lb cobra 3,25 USD; 2 lb cobra 3,75 USD por libra; 10 lb cobra 4,15 USD por libra. Esos tres precios coinciden con una primera libra a 3,25 USD y cada libra adicional a 4,25 USD, promediadas en una sola partida: (3,25 + 4,25) / 2 = 3,75 y (3,25 + 9 × 4,25) / 10 = 4,15. La fila publicada solo muestra 3,25 USD y el mínimo. El 4,25 USD no aparece escrito como partida.

### Gaps
- No se cotizó el casillero con FOB distinto de 100 USD, así que no se confirma si su seguro de 5 USD bajo 100 USD es tarifa plana, como en el prepagado, o siempre el 5 %.
- El `cambioConveniencia` 910 está en la respuesta del casillero y no se usó para pasar los netos a bolívares.

## Teléfonos, tabletas, laptops y electrónicos

### Takeaway
En Estados Unidos a Venezuela el único especial publicado es «Teléfono móvil». No hay producto distinto para tabletas, laptops ni «electrónicos». El flete del teléfono es una tarifa plana que sustituye al precio por libra, al manejo aduanal y al combustible. El seguro y los 0,99 USD de la guía se siguen cobrando encima.

### Cited Findings
Catálogo de la calculadora, origen US y destino VE: dos códigos de teléfono, `US-PPD-20746` si el FOB es menor o igual a 500 USD, y `US-PPD-20745` si el FOB es mayor a 500 USD. No hay fila con `especiales` «electronico» para ese par de países. Cotizaciones del 26 de octubre de 2026, ruta `US.MIA-VE.CCS`, [calculadora iQPack](https://iqpack.libertyexpress.com/Calculator?fromWebsite=true):

- FOB 100 USD y FOB 500 USD: «PPD FLETE CELULARES FOB MENOR A $500», 25 USD por unidad. No aparecen flete por libra, manejo aduanal ni combustible. Sí aparecen el seguro (5 USD con FOB 100; 25 USD, el 5 %, con FOB 500) y la guía house de 0,99 USD. Totales: 30,99 USD y 50,99 USD.
- FOB 501 USD y FOB 1000 USD: «PPD FLETE CELULARES FOB MAYOR $500», 35 USD por unidad, más seguro del 5 % del FOB (25,05 USD y 50 USD) y la guía de 0,99 USD. Totales: 61,04 USD y 85,99 USD.
- El mismo código de FOB hasta 500 USD, con 5 lb y FOB 200 USD: el flete sigue en 25 USD. El peso no suma flete. El seguro es 10 USD (5 % de 200) y la guía 0,99 USD. Total 35,99 USD.
- La lectura anterior (25 USD + 5 % hasta 500 USD de FOB, y 35 USD + 5 % por encima) acierta en los 25 y los 35 USD. El 5 % no es plano desde el primer dólar: entre 1 y 100 USD de FOB el seguro de estas cotizaciones es 5 USD fijos, igual que en el paquete general. A partir de 101 USD el seguro sí es el 5 % del FOB, y por eso en 500 USD el seguro da 25 USD.

### Inferences
- Un teléfono no paga además las 4,75 USD por libra. La plana de 25 o 35 USD ocupa el lugar del flete, del manejo aduanal y del combustible.

### Gaps
- No hay tarifa publicada, en este corredor, para tableta, laptop o la categoría «electrónicos». Esas categorías sí tienen página propia desde España, Italia, Portugal y Alemania, con precios en euros, y no se usan aquí como tarifa de Estados Unidos.

## Entrega en Valencia

### Takeaway
La cotización internacional a las agencias de Valencia y a «Entrega a Domicilio Valencia», en zona `VE.CCS`, no agrega un recargo frente al retiro. El recargo de 5 USD aparece en la zona `VE.Z00` (Los Guayos y el centro de distribución), no como fee distinto de domicilio. El expreso nacional dice que su domicilio no cobra extra; esa página es de envíos dentro de Venezuela.

### Cited Findings
- 1 lb y 10 lb a «Entrega a Domicilio Valencia» (id 497) y a Metro Sur (id 546), ruta `US.MIA-VE.CCS`: mismos totales que la ruta sin sucursal (11,64 USD y 57,59 USD con FOB 100). No hay partida de domicilio. — [Calculadora iQPack](https://iqpack.libertyexpress.com/Calculator?fromWebsite=true)
- Los Guayos y el centro de distribución de Valencia, ruta `US.MIA-VE.Z00`: se suma «PPD ZONA FORANEA (A)» de 5 USD. El flete por libra no cambia. — [Calculadora iQPack](https://iqpack.libertyexpress.com/Calculator?fromWebsite=true)
- Expreso nacional, página modificada el 1 de octubre de 2026: «Puede elegir el servicio de despacho que desee: retiro en agencia o entrega a domicilio. Las entregas a domicilio a escala nacional, incluyendo las zonas en el interior que aun así cuenten con sucursales, no tendrán costo adicional». Las entregas de ese servicio son de lunes a viernes de 8:00 a.m. a 5:00 p.m. Para zonas de domicilio remite al call center 0501-COURIER. — [Expreso nacional](https://libertyexpress.com/es-ve/expreso-nacional/)
- El casillero dice que Liberty llama «para confirmar la disponibilidad del paquete para ser retirado en la tienda de tu elección o para coordinar la entrega a domicilio». No publica un monto por ese domicilio. — [Casillero Venezuela](https://libertyexpress.com/es-ve/casillero-para-compras-por-internet/)
- Condiciones nacionales, 1 de octubre de 2026: horario de sucursales de lunes a viernes de 8:00 a.m. a 5:00 p.m. y sábados de 8:00 a.m. a 2:00 p.m. «Todo paquete con un peso menor o igual a 500 gramos debe ser pagado en origen». — [Condiciones de envíos nacionales](https://libertyexpress.com/es-ve/condiciones-del-servicio-envios-nacionales/)

### Inferences
- El domicilio de Valencia, tal como está codificado, no es una zona foránea. Los Guayos sí.

### Gaps
- El formulario público no muestra el selector de sucursal de destino en este corredor, así que un usuario que solo oprime «Estados Unidos» y «Venezuela» no ve la diferencia de los 5 USD. Esa diferencia sale al cotizar la zona que el catálogo asigna a cada oficina.

## Marítimo y Heavy Box, y el caso AeroCarga

### Takeaway
AeroCarga no está publicado: la URL da 404, el sitemap y la API de WordPress no tienen esa entrada, y el catálogo de la calculadora no trae ese nombre. Lo que sí puede cotizarse hacia la zona de Valencia es el marítimo, por pie cúbico con mínimo de 1 pie, y Heavy Box desde 30 lb. El marítimo del casillero pide más de 19 lb en el catálogo y más de 20 lb o 3 pies cúbicos en la página.

### Cited Findings
- No existe el código AeroCarga entre los 11 fletes de US a VE de la calculadora. La búsqueda en el tipo `kon_tarifa` con la palabra AeroCarga devolvió cero. Abrir `https://libertyexpress.com/tarifa/tarifa-aerocarga-envio-aereo-desde-estados-unidos-a-venezuela/` el 26 de octubre de 2026 muestra la página «Página no encontrada». El 4,80 USD por libra y el mínimo de 50 lb de la lectura anterior no tienen página viva.
- Heavy Box, `US-PPD-21410`, ruta `US.MIA-VE.CCS` (la zona de las agencias de Valencia), cotización del 26 de octubre de 2026: flete 2,89 USD por libra con mínimo 30 lb y 86,70 USD; «PPD ENTREGA LOCAL HEAVY BOX» 5 USD; combustible con mínimo 30 lb y 13,50 USD (a 30 lb equivale a 0,45 USD por libra); seguro 5 USD con FOB 100. Total a 30 lb y FOB 100 USD: 110,20 USD. A 29 lb la API aplicó los mismos mínimos y el mismo total, aunque el catálogo solo ofrece el producto desde 30 lb. — [Calculadora iQPack](https://iqpack.libertyexpress.com/Calculator?fromWebsite=true)
- Marítimo prepagado, código `US-PPD-0002`, ruta `US.MIA-VE.CCS`. Sin medidas, 10, 20 y 50 lb solo cobraron el seguro de 5 USD; las partidas por pie cúbico no entraron porque el volumen fue nulo. Las filas publicadas, con mínimo de 1 pie cúbico, son: «PPD FLETE M MER» 22 USD por CFT (mínimo 22 USD); «PPD MANEJO ADUANAL MARITIMO» 10 USD por CFT (mínimo 10 USD); «PPD GUIA HOUSE (M)» 7 USD por CFT (mínimo 7 USD); «PPD TRASLADO CAJAS (M)» 5 USD por CFT (mínimo 5 USD); seguro marítimo 5 USD con FOB de 0 a 100 en la fila de rango 0 a 1 que apareció en la cotización sin volumen. — [Calculadora iQPack](https://iqpack.libertyexpress.com/Calculator?fromWebsite=true)
- Al enviar 12×12×12 pulgadas (un pie cúbico) la API no devolvió 1 CFT: cobró 61.023,8 CFT y un total de millones de dólares. Esa cantidad no se usa como tarifa. Los precios por pie cúbico de la fila sí quedan citados arriba.
- Casillero marítimo: el código `VE-COL-0367` aplica si el peso es mayor a 19 lb. El código `VE-ERR-0005` trae en la propia calculadora el texto «El peso no aplica para un envío marítimo». Otro mensaje del mismo bloque, `VE-ERR-0006`, dice «El peso no aplica para envío marítimo, debe ser mayor a 10kg». La página del casillero, modificada el 1 de octubre de 2026, dice: «Para ser enviadas vía marítima, tus compras deben pesar más de 20 libras u ocupar al 3 pies cúbicos», tránsito de 21 a 30 días desde el embarque, y que el servicio se pide por correo antes de que la compra llegue a Miami. Las filas del casillero marítimo en `US.MIA-VE.CCS` son flete 36 USD por CFT (la cotización de 20 lb sin medidas no lo aplicó) y franqueo del 10 % del flete. — [Casillero Venezuela](https://libertyexpress.com/es-ve/casillero-para-compras-por-internet/); [Calculadora iQPack](https://iqpack.libertyexpress.com/Calculator?fromWebsite=true)

### Inferences
- Heavy Box es el producto pesado que la calculadora ofrece hacia la misma zona `VE.CCS` de Valencia. No es AeroCarga y el mínimo publicado es 30 lb, no 50.

### Gaps
- No hay un total fiable en dólares para una caja marítima concreta: la conversión de pulgadas a pies cúbicos de esta llamada no dio un pie cúbico. Falta la fórmula que la página usa para el pie cúbico.
- Los dos textos del marítimo del casillero no coinciden: más de 19 lb en el catálogo, más de 20 lb o 3 pies cúbicos en la página, y un mensaje aparte que habla de más de 10 kg.

## Lo que la página dice que no viaja

### Takeaway
La lista de prohibidos hacia Venezuela no nombra teléfonos usados, un teléfono por caja ni baterías de litio. El litio está prohibido en el expreso nacional. La regla de equipos con menos de dos baterías está en la sección de Europa de la misma página, no en la de Venezuela.

### Cited Findings
- Página de artículos prohibidos de Venezuela, modificada el 1 de octubre de 2026. El texto de entrada dice que si el artículo llega al almacén de Miami, Canadá o Europa y está en la lista, no se transporta y el usuario asume destrucción y devolución al proveedor. Bajo el encabezado «Artículos Prohibidos para envíos a Venezuela» la lista es: máscara de gas; chalecos antibalas; pistola de aire, municiones de pintura o aire; tirolinas o «chinas»; gas pimienta; mazo; arma de electroshock; armas de airsoft; bolas de rodamientos; mármoles; artículos con gas o aire comprimido; cuchillos, machetes y hachas; batutas de policía; artículos de camuflaje; máscaras de rostro; material pornográfico; estupefacientes o psicotrópicos; armas blancas; animales vivos o muertos; valores, efectivo y cheques de viajero; productos químicos líquidos o peligrosos; alucinógenos; lo que suponga contrabando; pasaportes y documentos de identificación; antena Starlink y derivados; tarjetas de débito y crédito; dron; componentes para minar; y, marcados con asterisco y la nota «Con restricciones por cantidades» sin cifra: perfumes, vitaminas y suplementos, cosméticos y artículos de tocador. Cierra con «La aplicación inmediata de estas prohibiciones es obligatoria sin excepciones». — [Artículos prohibidos](https://libertyexpress.com/es-ve/articulos-prohibidos/)
- En otra sección de esa misma página, no bajo el encabezado de Venezuela, aparece «Celulares 2 HOMOLOGADOS (por caja)» junto a límites de zapatos, relojes, bolsos y un dron por caja, y el texto menciona DNI, CE y pasaporte. No se le atribuye a Valencia.
- La sección de envíos a Europa de esa página dice que sí se pueden equipos con menos de 2 baterías o 4 celdas de litio, con el ejemplo de un portátil con una batería y dos celdas de botón, y que no se aceptan baterías defectuosas, dañadas o retiradas del mercado. No está bajo el encabezado de Venezuela.
- Prohibidos del envío nacional en Venezuela, misma fecha de modificación: la lista incluye «Baterías de litio». — [Prohibidos nacionales](https://libertyexpress.com/es-ve/articulos-prohibidos-para-envios-nacionales-en-venezuela/)

### Inferences
- Nada en la lista vigente hacia Venezuela publica un cupo de un teléfono por caja ni una veda de teléfonos usados.

### Gaps
- La página no numera las «restricciones por cantidades» de perfumes, vitaminas, cosméticos y artículos de tocador hacia Venezuela.
