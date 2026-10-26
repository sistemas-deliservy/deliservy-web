# Precios Best Buy (EE. UU.) al 26 de octubre de 2026

Fecha de lectura: 26 de octubre de 2026. Tienda en línea de Estados Unidos, precios en USD antes de impuesto estatal. El navegador de la sesión tenía como tienda cercana Fort Lauderdale y código postal **33301**; la disponibilidad de envío de abajo es la que Best Buy mostró para ese destino, no un inventario nacional.

Método: se abrieron páginas de resultados de Best Buy y se leyó el registro de producto que la propia página ya había cargado (precio de contado `customerPrice` / `FULL_SRP`, SKU, modelo, URL y elegibilidad de envío). Las fichas de producto (`/product/.../sku/...`) no llegaron a renderizarse: dos intentos devolvieron error de carga y, después de varias búsquedas seguidas, Best Buy respondió **Access Denied** (Akamai). No se inventan precios de lo que no se llegó a leer. El peso de caja de Best Buy no apareció en los resultados; donde hay peso, es el **peso del producto** publicado por Apple en su página de especificaciones, no el peso de envío.

## Precio, modelo, almacenamiento, color, SKU y URL

### Takeaway
Al 26 de octubre de 2026 Best Buy vendía nuevo el iPhone 18 Pro de 256 GB a 1.199,99 USD con AT&T o Verizon, el MacBook Air de 13 pulgadas M5 (16 GB / 512 GB) a 1.149 USD (precio regular 1.299 USD) y el Mac mini M6 de 16 GB / 256 GB a 799 USD (regular 899 USD). No apareció un iPhone 18 de 128 GB en los primeros resultados, y el iPhone 17 nuevo que sí se leyó era de 256 GB a 929,99 USD.

### Cited Findings
Páginas de resultados abiertas (el precio sale del registro de producto de esa página, no de un resumen de buscador):

- Búsqueda iPhone 18 Pro: [iphone 18 pro 256gb - Best Buy](https://www.bestbuy.com/site/searchpage.jsp?id=pcat17071&st=iphone+18+pro+256gb)
- Búsqueda iPhone 18 / 128 GB / unlocked: [iphone 18 128gb unlocked - Best Buy](https://www.bestbuy.com/site/searchpage.jsp?id=pcat17071&st=iphone+18+128gb+unlocked)
- Búsqueda MacBook Air 13: [macbook air 13-inch - Best Buy](https://www.bestbuy.com/site/searchpage.jsp?id=pcat17071&st=macbook+air+13-inch)
- Búsqueda Mac mini: [mac mini - Best Buy](https://www.bestbuy.com/site/searchpage.jsp?id=pcat17071&st=mac+mini)
- Búsqueda iPad Air 11: [ipad air 11 - Best Buy](https://www.bestbuy.com/site/searchpage.jsp?id=pcat17071&st=ipad+air+11)

Precios de contado leídos (nuevo, vendido por Best Buy, `seller` 1P). En los iPhone la tarjeta visible destacaba la cuota a 36 meses; el precio de abajo es el `FULL_SRP` / `customerPrice` del mismo registro.

| Producto | Precio actual | Precio regular | Modelo | SKU | Color / config | URL del SKU |
|---|---:|---:|---|---|---|---|
| iPhone 18 Pro 256 GB (AT&T) | 1.199,99 USD | 1.199,99 USD (ahorro 0) | MJQ54LL/A | 6443256 | Burgundy, 256 GB, 6,3 in | [ficha](https://www.bestbuy.com/product/apple-iphone-18-pro-256gb-burgundy-at-t/JCQ6HRFTC9/sku/6443256) |
| iPhone 18 Pro 256 GB (Verizon) | 1.199,99 USD | 1.199,99 USD | MJQ54LL/A | 6443160 | Burgundy, 256 GB | [ficha](https://www.bestbuy.com/product/apple-iphone-18-pro-256gb-burgundy-verizon/JCQ6HRFQRC/sku/6443160) |
| iPhone 18 Pro 512 GB (AT&T) | 1.399,99 USD | 1.399,99 USD | MJQ74LL/A | 6443254 | Black, 512 GB | [ficha](https://www.bestbuy.com/product/apple-iphone-18-pro-512gb-black-at-t/JCQ6HRFTJF/sku/6443254) |
| iPhone 18 Pro Max 256 GB (AT&T) | 1.299,99 USD | 1.299,99 USD | MJW74LL/A | 6443272 | Glacier, 256 GB | [ficha](https://www.bestbuy.com/product/apple-iphone-18-pro-max-256gb-glacier-at-t/JCQ6HRFTL5/sku/6443272) |
| iPhone 17 256 GB (Verizon), generación anterior | 929,99 USD | 929,99 USD | MG464LL/A | 6487349 | Black, 256 GB | [ficha](https://www.bestbuy.com/product/apple-iphone-17-256gb-black-verizon/JCQ6HHJ5RZ/sku/6487349) |
| iPhone 17 Pro 512 GB (Verizon), anuncio patrocinado | 1.299,99 USD | 1.299,99 USD | MG7Q4LL/A | 6443169 | Deep Blue, 512 GB | [ficha](https://www.bestbuy.com/product/apple-iphone-17-pro-512gb-deep-blue-verizon/JCQ6HRFQTZ/sku/6443169) |
| iPhone 16e 128 GB (Unlocked) | 539,99 USD | 599,99 USD (ahorro 60) | MD0W4LL/A | 6507524 | White, 128 GB | [ficha](https://www.bestbuy.com/product/apple-iphone-16e-128gb-apple-intelligence-unlocked-white/JJGCQG2GTF/sku/6507524) |
| iPhone Air 256 GB (Unlocked) | 999,99 USD | 1.099,99 USD (ahorro 100) | MG184LL/A | 6473225 | Space Black, 256 GB | [ficha](https://www.bestbuy.com/product/apple-iphone-air-256gb-unlocked-space-black/JJGCQLRKC2/sku/6473225) |
| MacBook Air 13 M5, 10 núcleos CPU / 8 núcleos GPU, 16 GB, 512 GB | 1.149 USD | 1.299 USD (ahorro 150) | MDHE4LL/A | 6397846 | Midnight | [ficha](https://www.bestbuy.com/product/apple-macbook-air-13-inch-laptop-m5-chip-with-10-core-cpu-and-8-core-gpu-16gb-memory-512gb-ssd-midnight/JJGCQLKXL7/sku/6397846) |
| Mac mini M6, 16 GB, 256 GB | 799 USD | 899 USD (ahorro 100) | MHQK4LL/A | 6566933 | Silver | [ficha](https://www.bestbuy.com/product/apple-mac-mini-desktop-m6-chip-16gb-memory-256gb-ssd-silver/JJGCQYQLWR/sku/6566933) |
| Mac mini M4, 16 GB, 256 GB (generación anterior, nuevo) | 649 USD | 799 USD (ahorro 150) | MU9D3LL/A | 6566918 | Silver | [ficha](https://www.bestbuy.com/product/apple-mac-mini-desktop-m4-chip-built-for-apple-intelligence-16gb-memory-256gb-ssd-silver/JJGCQXH2S4/sku/6566918) |
| iPad Air 11 M4 Wi-Fi 128 GB | 709 USD | 749 USD (ahorro 40) | MH304LL/A | 6586895 | Space Gray | [ficha](https://www.bestbuy.com/product/apple-11-inch-ipad-air-m4-chip-wi-fi-128gb-space-gray/JJGCQYCTW2/sku/6586895) |
| iPad Air 11 M4 Wi-Fi 256 GB | 799 USD | 849 USD (ahorro 50) | MH354LL/A | 6586899 | Space Gray | [ficha](https://www.bestbuy.com/product/apple-11-inch-ipad-air-m4-chip-wi-fi-256gb-space-gray/JJGCQYCKXQ/sku/6586899) |

Fechas de calle en el mismo registro: iPhone 18 Pro y Pro Max `2026-09-18`; iPhone 17 y iPhone Air `2025-09-19`. El iPhone 16e no traía fecha de calle en el registro leído. — mismas páginas de resultados de arriba.

La página de especificaciones de Apple del MacBook Air, abierta el mismo día, lista el modelo 1 de 13 pulgadas a **1.299 USD**, con chip M5 de 8 núcleos de GPU y **512 GB** de base (no existe 256 GB en esa tabla). Eso coincide con el precio regular de Best Buy del SKU 6397846. — [MacBook Air - Tech Specs - Apple](https://www.apple.com/macbook-air/specs/)

La página de especificaciones del Mac mini lista el primer precio en **899 USD** con chip M6, igual al precio regular de Best Buy del SKU 6566933. — [Mac mini - Technical Specifications - Apple](https://www.apple.com/mac-mini/specs/)

### Inferences
- El flagship de iPhone en Best Buy el 26 de octubre de 2026 es el **iPhone 18 Pro**, no el 17. El 256 GB de contado con operadora está a 1.199,99 USD.
- La config base vigente del MacBook Air de 13 pulgadas en Apple y en el primer resultado de Best Buy es **M5, 16 GB, 512 GB**, no 256 GB. El precio que un comprador podía reordenar ese día en Best Buy era 1.149 USD, 150 USD bajo el regular de 1.299 USD.
- El Mac mini base vigente es el **M6 de 16 GB / 256 GB** a 799 USD; el M4 equivalente seguía nuevo a 649 USD.
- El iPad Air base leído es el **11 pulgadas M4 Wi-Fi 128 GB** a 709 USD.

### Gaps
- No se verificó un iPhone 18 (no Pro) de 128 GB. En la búsqueda «iphone 18 128gb unlocked» había 16 resultados y solo se leyeron los 4 primeros del DOM: Pro Max 256 GB, Pro 512 GB, 16e 128 GB desbloqueado y iPhone Air 256 GB desbloqueado. Los filtros de familia de esa página listaban iPhone 16, 16 Plus, 16e, 15, 15 Plus, Air, 18 Pro y 18 Pro Max. No se puede afirmar que un iPhone 18 de 128 GB no exista en el catálogo.
- No se leyó un iPhone 17 Pro de **256 GB**. El 17 Pro que sí apareció era de 512 GB y, además, era un anuncio patrocinado con envío no elegible.
- No se confirmó si el precio de 1.199,99 USD del iPhone 18 Pro cambia con el color. Solo se leyó Burgundy en 256 GB.
- Sin precio verificado, porque Best Buy pasó a Access Denied antes de abrir la búsqueda: iPad estándar (el filtro de la búsqueda del Air mencionaba «Apple iPad (A16)», sin precio), AirPods Pro, AirPods Max, Apple Watch, PlayStation 5 (Disc, Digital y Pro), Nintendo Switch 2, Samsung Galaxy S, Sony WH-1000XM, GPU NVIDIA, GoPro, Meta Quest, Kindle, cuerpo mirrorless Canon o Sony, y SSD portátil Samsung de 2 TB.
- Tampoco se leyó ningún control pesado de bajo valor (televisor, impresora u otro bulto barato). Esos ítems quedan sin precio y sin peso.
- Las URL de ficha están en el registro de la página de resultados. Esas fichas no se pudieron abrir en el navegador.

## Peso (producto frente a peso de envío)

### Takeaway
Best Buy no mostró peso de envío ni peso de caja en los resultados abiertos. Apple publica el peso del producto, no el de la caja: iPhone 18 Pro 7,44 oz (211 g, 0,465 lb), MacBook Air 13 M5 2,7 lb (1,23 kg), Mac mini M6 1,5 lb (0,67 kg) e iPad Air 11 Wi-Fi 1,02 lb (464 g).

### Cited Findings
Conversión usada: 1 kg = 2,20462 lb. 1 lb = 16 oz.

- iPhone 18 Pro: ancho 2,83 in (71,9 mm), alto 5,91 in (150,0 mm), fondo 0,34 in (8,75 mm). **Peso del producto: 7,44 onzas (211 gramos)**. 7,44 / 16 = **0,465 lb**. 211 g = 0,211 kg; 0,211 × 2,20462 = **0,465 lb**. El Pro Max pesa 8,78 onzas (249 g, 0,549 lb). Apple aclara que tamaño y peso varían por configuración y proceso de fabricación. No es peso de envío. — [iPhone 18 Pro and 18 Pro Max - Technical Specifications - Apple](https://www.apple.com/iphone-18-pro/specs/), página abierta el 26 de octubre de 2026. Capacidades listadas: 256 GB, 512 GB, 1 TB y 2 TB. Colores: Black, Silver, Glacier, Burgundy.
- MacBook Air (pestaña 13 pulgadas, chip M5): alto 0,44 in (1,13 cm), ancho 11,97 in (30,41 cm), fondo 8,46 in (21,5 cm). **Peso del producto: 2,7 libras (1,23 kg)**. 1,23 × 2,20462 = 2,71 lb, que Apple redondea a 2,7 lb. Almacenamiento base del modelo 1: 512 GB. No es peso de envío. — [MacBook Air - Tech Specs - Apple](https://www.apple.com/macbook-air/specs/)
- Mac mini M6: alto 2,0 in (5,0 cm), ancho y fondo 5,0 in (12,7 cm). **Peso del producto (M6): 1,5 libras (0,67 kg)**. 0,67 × 2,20462 = 1,48 lb; Apple lo publica como 1,5 lb. En la misma página el M5 Pro pesa 1,6 lb (0,73 kg). No hay M4 en esa página. No es peso de envío. — [Mac mini - Technical Specifications - Apple](https://www.apple.com/mac-mini/specs/)
- iPad Air 11 Wi-Fi: alto 9,74 in (247,6 mm), ancho 7,02 in (178,5 mm), fondo 0,24 in (6,1 mm). **Peso del producto, modelos Wi-Fi: 1,02 libras (464 gramos)**. 464 g = 0,464 kg; 0,464 × 2,20462 = **1,023 lb**. Wi-Fi + Cellular: 1,03 lb (465 g). El 13 pulgadas Wi-Fi pesa 1,36 lb (616 g). Capacidades del 11 pulgadas: 128, 256, 512 GB y 1 TB. Chip de esa página: M4. No es peso de envío. — [iPad Air - Technical Specifications - Apple](https://www.apple.com/ipad-air/specs/)

### Inferences
Dólares por libra usando el **peso del producto** (el de la caja es desconocido, así que el valor por libra enviada sería más bajo):

- iPhone 18 Pro 256 GB a 1.199,99 USD / 0,465 lb ≈ **2.580 USD por libra** de producto.
- iPad Air 11 128 GB a 709 USD / 1,02 lb ≈ **695 USD por libra**.
- Mac mini M6 a 799 USD / 1,5 lb ≈ **533 USD por libra**.
- MacBook Air 13 M5 a 1.149 USD / 2,7 lb ≈ **426 USD por libra**.
- Mac mini M4 a 649 USD: sin peso verificado, no se calcula.

Con el peso del producto, el iPhone 18 Pro concentra mucho más valor por libra que el Air, el mini y el iPad Air. Sin el peso de la caja no se puede cerrar una prueba de costo de envío.

### Gaps
- Peso de envío o de caja de Best Buy: no encontrado en ninguna página abierta. Las API de especificaciones probadas desde la sesión (`/api/1.0/product/specifications/6443256.json` y rutas parecidas) respondieron 404 o 500.
- Sin peso, ni de producto ni de caja: iPhone 17, iPhone 17 Pro, iPhone 16e, iPhone Air, Mac mini M4, y todos los productos que quedaron sin abrir (consolas, GPU, audífonos, reloj, GoPro, Quest, Kindle, cámara, SSD y controles pesados).
- Apple menciona en el MacBook Air un desglose del empaque minorista de EE. UU. por peso, sin una cifra de libras del paquete en el texto leído.

## Disponibilidad para envío en EE. UU.

### Takeaway
Los equipos de la tabla con `shippingEligible: true` figuraban enviables al 33301 el 26 de octubre de 2026, en varios casos con terrestre gratis y entrega el 27 de octubre. La excepción leída fue el iPhone 17 Pro 512 GB patrocinado, marcado como no enviable.

### Cited Findings
Del registro de cumplimiento de las mismas páginas de resultados, destino 33301:

- iPhone 18 Pro 256 GB AT&T (SKU 6443256) y Verizon (SKU 6443160): `shippingEligible` true. Niveles vistos: Same Day 9,99 USD con fecha 2026-10-26 y One Day 0 USD con fecha 2026-10-27. Recogida en tienda con inventario (`instoreInventoryAvailable` true, fecha máxima 2026-10-26). El botón era «See Details», no «Add to cart», porque son teléfonos con plan. Condición `new`. Calle 2026-09-18.
- iPhone 18 Pro 512 GB AT&T (SKU 6443254): enviable; One Day 0 USD el 2026-10-27.
- iPhone 18 Pro Max 256 GB (SKU 6443272): enviable; Same Day 9,99 USD el 2026-10-26 y One Day 0 USD el 2026-10-27.
- iPhone 17 256 GB Verizon (SKU 6487349): enviable; Same Day 9,99 USD el 2026-10-26 y One Day 0 USD el 2026-10-27. Recogida el mismo día.
- iPhone 17 Pro 512 GB Verizon (SKU 6443169): `shippingEligible` **false**. En la página, «Pickup unavailable» y «Shipping unavailable». Era un resultado patrocinado. No cuenta como stock de reposición.
- iPhone 16e 128 GB desbloqueado (SKU 6507524): enviable; Same Day 9,99 USD el 2026-10-26 y Ground 0 USD el 2026-10-27. Botón «See Details».
- iPhone Air 256 GB desbloqueado (SKU 6473225): enviable; Same Day 9,99 USD el 2026-10-26 y Ground 0 USD el 2026-10-27.
- MacBook Air 13 M5 16/512 (SKU 6397846): enviable; Same Day 9,99 USD el 2026-10-26 y Ground 0 USD el 2026-10-27. Botón «Add to Cart». La página también decía «Pick up today» y «Get it tomorrow • FREE».
- Mac mini M6 16/256 (SKU 6566933): enviable; Ground 0 USD el 2026-10-27. Botón «Add to Cart».
- Mac mini M4 16/256 (SKU 6566918): enviable; Air 1-Day 23,96 USD el 2026-10-27 y Ground 0 USD el 2026-10-28. Botón «Add to Cart».
- iPad Air 11 M4 128 GB (SKU 6586895) y 256 GB (SKU 6586899): enviables; Same Day 9,99 USD el 2026-10-26 y Ground 0 USD el 2026-10-27. Botón «Add to Cart».

Ninguno de estos registros estaba en open-box (`openBoxCondition` nulo) ni agotado. No se completó una compra, así que esto es la bandera de cumplimiento de Best Buy en ese momento y para ese código postal.

### Inferences
- iPhone 18 Pro, MacBook Air M5, Mac mini M6, Mac mini M4 e iPad Air M4 128 GB se podían reordenar nuevos con envío a EE. UU. (al menos al 33301) el 26 de octubre de 2026. No eran unidades online-only agotadas.
- Los iPhone 18 Pro leídos están atados a AT&T o Verizon en el título. El 16e y el iPhone Air sí decían Unlocked. Para reventa fuera de EE. UU. esa diferencia de desbloqueo importa, y no se comprobó si el pago de contado con «See Details» deja el equipo libre.

### Gaps
- Disponibilidad de PlayStation, Switch, Galaxy, audífonos, reloj, GPU, GoPro, Quest, Kindle, cámara, SSD y controles pesados: no verificada. Best Buy bloqueó el acceso antes de esas búsquedas.
- No se comprobó otro código postal. Same Day y la recogida dependen de la tienda de Fort Lauderdale que tenía la sesión.

## Generación vigente y generación anterior todavía nueva

### Takeaway
La generación vigente leída es iPhone 18 Pro (calle 18 de septiembre de 2026), MacBook Air M5, Mac mini M6 e iPad Air M4. Best Buy seguía vendiendo nuevo el iPhone 17 de 256 GB a 929,99 USD y el Mac mini M4 de 16/256 a 649 USD.

### Cited Findings
- iPhone 18 Pro, calle `2026-09-18T05:00Z`, 256 GB a 1.199,99 USD. El iPhone 17 de 256 GB, calle `2025-09-19T05:00Z`, seguía nuevo a 929,99 USD (Verizon, SKU 6487349). — [búsqueda iPhone 18 Pro](https://www.bestbuy.com/site/searchpage.jsp?id=pcat17071&st=iphone+18+pro+256gb)
- En esa misma búsqueda los filtros de familia incluían iPhone 18 Pro, 18 Pro Max, iPhone Duo, iPhone Air, iPhone 17, iPhone 17 Pro y 17 Pro Max, y iPhone 16 Pro Max. No se leyeron precios de iPhone Duo ni de un iPhone 18 no Pro.
- Mac mini: el M6 16/256 es el más vendido de esa búsqueda, a 799 USD (regular 899). El M4 16/256 seguía nuevo a 649 USD (regular 799). — [búsqueda Mac mini](https://www.bestbuy.com/site/searchpage.jsp?id=pcat17071&st=mac+mini)
- MacBook Air: los cuatro primeros resultados eran M5 (13 pulgadas 16/512, 16/1 TB, 24/1 TB y 15 pulgadas 16/512). No se leyó un Air M4 en esos cuatro. — [búsqueda MacBook Air](https://www.bestbuy.com/site/searchpage.jsp?id=pcat17071&st=macbook+air+13-inch)
- iPad Air: los cuatro primeros eran M4. El filtro de familia también ofrecía iPad Air M3, M2, iPad (A16) e iPad Pro (M5), sin precios leídos de esos. — [búsqueda iPad Air](https://www.bestbuy.com/site/searchpage.jsp?id=pcat17071&st=ipad+air+11)
- iPhone 16e 128 GB desbloqueado seguía nuevo a 539,99 USD (regular 599,99). iPhone Air 256 GB desbloqueado, calle 2025-09-19, a 999,99 USD (regular 1.099,99). — [búsqueda 128 GB unlocked](https://www.bestbuy.com/site/searchpage.jsp?id=pcat17071&st=iphone+18+128gb+unlocked)

### Inferences
- Para «iPhone Pro 256 GB actual» el modelo es el **iPhone 18 Pro**. El anterior que Best Buy aún vendía nuevo, entre lo leído, es el **iPhone 17 de 256 GB a 929,99 USD**, no un 17 Pro de 256 GB.
- Para «iPhone base 128 GB», lo único desbloqueado de 128 GB leído fue el **iPhone 16e a 539,99 USD**. No es el flagship base de 2026. El iPhone 17 nuevo leído ya parte de 256 GB.
- Para Mac mini, el vigente es M6 y el anterior M4 sigue nuevo, 150 USD más barato que el regular del M4 (799 USD) y 150 USD por debajo del precio de oferta del M6 (799 USD).

### Gaps
- Generación vigente de PlayStation, Switch, Galaxy S, Sony XM, GPU NVIDIA, GoPro, Quest, Apple Watch, AirPods, iPad estándar, Kindle, mirrorless y SSD: no verificada en una página de Best Buy abierta.
- No se confirmó si Best Buy sigue vendiendo nuevo el MacBook Air M4 o el iPad Air M3, aunque el filtro del Air listaba M3 y M2.

## Open-box

### Takeaway
En los listados nuevos leídos no había precio open-box. El precio principal de esta nota es el de equipo nuevo, de oferta o regular, reordenable.

### Cited Findings
- En los registros extraídos, `openBoxCondition` era nulo y `openBoxSavings` era nulo. El filtro Open-Box existía en las páginas, pero no se activó. — páginas de resultados citadas arriba.
- Los ahorros que sí aparecen (150 USD en el Air M5, 100 USD en el mini M6, 150 USD en el mini M4, 40 USD en el iPad Air 128 GB, 60 USD en el 16e, 100 USD en el iPhone Air) son la diferencia entre `displayableRegularPrice` y `customerPrice` de la unidad **nueva**, no un open-box.

### Inferences
- El precio a usar para reordenar es el de la columna «Precio actual» de la primera tabla. No hay una nota de open-box que lo reemplace.

### Gaps
- No se abrió la vista Open-Box de ningún SKU, así que no hay precio open-box de lado para estos modelos.
