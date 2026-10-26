# Precios de pedido en USD en Mercado Libre Venezuela: máquinas del hogar y hobby (26 de octubre de 2026)

Observación hecha el 26 de octubre de 2026 sobre páginas públicas de Mercado Libre Venezuela (`listado.mercadolibre.com.ve`, `articulo.mercadolibre.com.ve`, `www.mercadolibre.com.ve`). Solo reventa pública. No se convirtieron bolívares a dólares: si una ficha no mostraba un monto en US$, queda como no verificable. Los montos se copian como aparecen (punto de miles y coma decimal: US$ 1.130 = 1130 dólares; US$ 259,20 = 259,20 dólares).

## Cómo se leyeron las páginas y qué no se pudo abrir

### Takeaway
El 26 de octubre de 2026 Mercado Libre Venezuela bloqueó la apertura directa de listados y de varias fichas (HTTP 403). Los precios de abajo salen de fragmentos públicos indexados ese día. Varias fichas con US$ dicen «Publicación pausada», así que ese monto puede no ser un pedido activo.

### Cited Findings
- Abrir `https://listado.mercadolibre.com.ve/maquina-para-hacer-helados-cremosos` devolvió 403 Forbidden el 26 de octubre de 2026. — [Listado Ninja Creami](https://listado.mercadolibre.com.ve/maquina-para-hacer-helados-cremosos)
- Abrir la ficha de la Ninja Creami de 7 programas (`MLV-714609887`) devolvió 403. El mismo URL, vía el índice de búsqueda, sí mostró título, «Nuevo | +5 vendidos», US$ 419 y «Publicación pausada». — [Ficha Creami](https://articulo.mercadolibre.com.ve/MLV-714609887-creami-maquina-fabricadora-de-helados-y-batidos-ninja-_JM)
- Abrir la ficha del G-Shock GA-900-1A (`MLV-778883926`) devolvió 403. El índice de búsqueda mostró US$ 165 y «Publicación pausada». — [Ficha GA-900-1A](https://articulo.mercadolibre.com.ve/MLV-778883926-reloj-casio-g-shock-ga-900-1a-analogico-digital-original-_JM)
- La ficha del Elite Trainer Box Twilight Masquerade (`MLV-802272236`) no abrió: la página pública pedía iniciar sesión («Para continuar, ingresa a tu cuenta»). No hubo precio. — [Ficha ETB Twilight Masquerade](https://articulo.mercadolibre.com.ve/MLV-802272236-pokemon-elite-trainer-box-etb-twilight-masquerade-_JM)

### Inferences
- Un US$ visto solo en un fragmento de listado no trae vendedor, condición ni vendidos si el fragmento no los trae. Abajo, «no figura» significa eso, no que el dato sea cero.
- «Publicación pausada» más un US$ en el índice no prueba que el 26 de octubre de 2026 ese pedido siguiera a la venta.

### Gaps
- No se recorrió la paginación en vivo de cada categoría. El recuento («vi N líneas») es el de los fragmentos, no el inventario completo del sitio.
- No se confirmó en el HTML en vivo que el botón de compra siguiera activo.

## 1. Breville Bambino, Barista Express y otras cafeteras Breville

### Takeaway
No apareció un título con la palabra «Bambino». Sí apareció una sola línea «Cafetera Eléctrica Breville Bes450bss1bus1» a US$ 1.130. La Barista Express BES870XL tiene ficha, pausada, y el fragmento no muestra precio en US$. Otras cafeteras Breville sí tienen US$: Vertuo desde US$ 603,97 (tres líneas) y Creatista Plus en US$ 2.606,50 y US$ 3.283.

### Cited Findings
- **BES450 (el código de la Bambino; el título no dice Bambino).** Título: «Cafetera Eléctrica Breville Bes450bss1bus1». Precio: US$ 1.130. Condición, vendidos y vendedor: no figuran. La misma línea sale en dos listados. — [Cafetera semi express](https://listado.mercadolibre.com.ve/pequenos-electrodomesticos-cocina/cafetera-semi-express); [Máquina para café casera](https://listado.mercadolibre.com.ve/pequenos-electrodomesticos-cocina/maquina-para-cafe-casera)
- **Barista Express BES870XL: sin precio USD en la ficha indexada.** Título: «Breville Barista Express Espresso Bes870xl Cafetera Acero». Condición en la ficha: «Nuevo | +5 vendidos». Modelo en características: BES870XL, 110 V, línea Barista. Estado: «Publicación pausada». Vendedor: MercadoLíder Gold, 1926 ventas concretadas del vendedor (no es el conteo de esta máquina). La descripción dice «PRODUCTO TOTALMENTE NUEVO SELLADO» y menciona Zelle y USDT, sin un monto. El precio en US$ no figura. — [Ficha BES870XL](https://articulo.mercadolibre.com.ve/MLV-726597562-breville-barista-express-espresso-bes870xl-cafetera-acero-_JM)
- **«Barista Touch», no Express.** Título: «Maquina Cafetera Barista Cafe Expresso Touch Breville 15 Bar». Precio: US$ 2.760. Condición, vendidos y vendedor: no figuran. Una línea. — [Listado donde aparece](https://listado.mercadolibre.com.ve/maquina-industrial-para-tostar-cafe)
- **«Barista» sin modelo.** Título: «Maquina Cafetera Expresso Profesional Barista Marca Breville». Precio: US$ 1.920. Vendidos: 1. Condición y vendedor: no figuran. Una línea. — [Listado donde aparece](https://listado.mercadolibre.com.ve/cafeteras/cafetera-professional-series-collezioni)
- **Creatista Plus, ficha.** Título: «Cafetera De Expreso Nespresso Plus 1,5lts Acero Breville». Condición: «Nuevo | 2 vendidos». Precio: US$ 2.606,50 (la ficha también muestra Bs. 1.056.544,78; no se usó para calcular nada). Vendedor: tienda oficial Inversiones Tecnology 2030. Modelo en características: BNE800BSS / BNE800, línea Creatista Plus, cápsulas Nespresso. — [Ficha Creatista Plus](https://articulo.mercadolibre.com.ve/MLV-765327924-cafetera-de-expreso-nespresso-plus-15lts-acero-breville-_JM)
- **Creatista Plus, otra línea de listado.** Título: «Cafetera Nespresso Breville Creatista Plus Bne800dbl». Precio: US$ 3.283. Vendedor en el fragmento: Inversiones Tecnology 2030. Condición y vendidos: no figuran. — [Café en cápsulas](https://listado.mercadolibre.com.ve/cocina/cafe-en-capsulas)
- **Vertuo, tres líneas con el mismo tipo de título.** «Cafetera Expreso Breville Nespresso/vertuo De Capsulas Negro» a US$ 603,97, US$ 604,31 y US$ 666,88. Pedido más bajo visto: US$ 603,97. Condición, vendidos y vendedor: no figuran. — [Café en cápsulas](https://listado.mercadolibre.com.ve/cocina/cafe-en-capsulas)
- Una búsqueda de «Bambino» en fichas de `articulo.mercadolibre.com.ve` devolvió ropa de bebé de la marca Bambino, no una cafetera. — [Mono para bebé Bambino](https://articulo.mercadolibre.com.ve/MLV-541300475-mono-para-bebe-bambino-basico-unicolor-_JM)

### Inferences
- El código BES450BSS es el de la Breville Bambino (la Bambino Plus es BES500; la Barista Express es BES870). El aviso de US$ 1.130 no usa la palabra Bambino; se identifica por el código del título.
- US$ 1.920 y US$ 2.760 no se pueden tratar como Barista Express: los títulos dicen «Barista» y, en un caso, «Touch», sin el código BES870.
- La Creatista Plus y la Vertuo son cafeteras de cápsula con marca Breville en el título, no la Bambino ni la Express.

### Gaps
- Barista Express BES870XL: sin precio USD verificable (ficha pausada, monto ausente en el fragmento).
- No hay URL de ficha para la BES450, la Touch de US$ 2.760, la «Profesional Barista» de US$ 1.920 ni las tres Vertuo: solo el listado.
- No figura condición ni vendedor de la BES450.

## 2. Ninja Creami

### Takeaway
Hay varios pedidos en US$. El más bajo visto es US$ 390 (4 vendidos). Se vieron cinco montos de máquina Creami: 390, 419 (ficha pausada), 480, 580 (NC301) y 773,50 (Deluxe).

### Cited Findings
- Título: «Máquina Para Hacer Helados Ninja Creami». Precio: US$ 390. Vendidos: 4. Calificación 5.0. Envío gratis. Condición y vendedor: no figuran. — [Listado máquinas de helado](https://listado.mercadolibre.com.ve/maquina-para-hacer-helados-cremosos)
- Título: «Ninja Creami Maquina Para Hacer Helados 7 Programas». Precio: US$ 480. Vendidos: 1. Condición y vendedor: no figuran. — [Listado máquinas de helado](https://listado.mercadolibre.com.ve/maquina-para-hacer-helados-cremosos)
- Título: «Máquina Para Hacer Helados Ninja Creami Profesional Nc301». Precio: US$ 580. Vendidos: 1. Vendedor: Inversiones Tecnology 2030. Calificación 5.0. Envío gratis. Condición: no figura en el fragmento del listado. — [Listado máquinas de helado](https://listado.mercadolibre.com.ve/maquina-para-hacer-helados-cremosos)
- Título: «Maquina Para Hacer Helado Ninja Creami Deluxe 11 Programas». Precio: US$ 773,50. Vendedor: Inversiones Tecnology 2030. Envío gratis. Condición y vendidos: no figuran. — [Listado máquinas de helado](https://listado.mercadolibre.com.ve/maquina-para-hacer-helados-cremosos)
- Título: «Creami Maquina Fabricadora De Helados Y Batidos Ninja». Condición: «Nuevo | +5 vendidos». Precio: US$ 419. Estado: «Publicación pausada». La descripción dice 7 programas e incluye tres vasos de 16 onzas. El nombre comercial de la tienda no figura; el bloque dice «Tienda oficial de Mercado Libre», MercadoLíder Platinum. La apertura directa de esta ficha dio 403. — [Ficha Creami 7 programas](https://articulo.mercadolibre.com.ve/MLV-714609887-creami-maquina-fabricadora-de-helados-y-batidos-ninja-_JM)

### Inferences
- US$ 390, US$ 419 y US$ 480 pueden ser la Creami de 7 programas; US$ 580 y US$ 773,50 están atados en el título a NC301 y a Deluxe 11 programas. No conviene un solo «precio de la Creami».
- El pedido más bajo entre esas cinco líneas es US$ 390.

### Gaps
- Las cuatro líneas del listado no tienen URL de ficha en el fragmento.
- No se pudo abrir la ficha de US$ 419 para ver si el 26 de octubre seguía pausada.
- El listado en vivo devolvió 403, así que no se comprobó si había más Creami más abajo en la página.

## 3. Freidora Ninja o Ninja Foodi

### Takeaway
Hay varios pedidos en US$, con capacidades distintas. En la Ninja AF141 de 4,7 L el más bajo visto es US$ 202 (Naida Hogar), entre unas cinco líneas. En doble cesta / Foodi el más bajo con US$ es US$ 335 (10 qarts, ficha pausada). Varias fichas Foodi (DZ201, SP200) no muestran US$.

### Cited Findings
Freidora de una cuba, modelo AF141, 4,7 L (el título no dice Foodi). Pedido más bajo: US$ 202. Líneas vistas:

- «Freidora De Aire Ninja 4.7 Lts 4 En 1 Air Crisp Negro». US$ 202. Vendedor: Naida Hogar. Envío gratis. Condición y vendidos: no figuran. — [Listado donde aparece](https://listado.mercadolibre.com.ve/electrodomesticos/c-47-papercraft)
- «Freidora De Aire Ninja 4 En 1 Af141». US$ 245. Envío gratis. Condición, vendidos y vendedor: no figuran. — [Mismo listado](https://listado.mercadolibre.com.ve/electrodomesticos/c-47-papercraft)
- «Freidora De Aire Ninja Digital 4 En 1 Pro 1750w 4.7l Af-141». Vendedor: Al Giorno. US$ 432 tachado y US$ 259,20 (el fragmento dice 40% OFF). Envío gratis. — [Mismo listado](https://listado.mercadolibre.com.ve/electrodomesticos/c-47-papercraft)
- «Freidora De Aire Ninja Pro 4 En 1 4.7lts Af141». Vendedor: Inversiones Tecnology 2030. US$ 416 tachado y US$ 260 (el fragmento dice 37% OFF). La línea se repite en el mismo fragmento; se cuenta una vez. — [Mismo listado](https://listado.mercadolibre.com.ve/electrodomesticos/c-47-papercraft)
- «Freidora De Aire Ninja Pro 4 En 1 4.7lts Af141». US$ 276,21. Vendedor: no figura en esa línea. — [Mismo listado](https://listado.mercadolibre.com.ve/electrodomesticos/c-47-papercraft)

Otras Ninja con litros, cuartos o modelo en el título:

- «Freidora De Aire Ninja Af 101 Cruje Asa Recalienta Deshidrat». US$ 179,99. Vendidos: 3. Calificación 5.0. Condición y vendedor: no figuran. El título no dice litros. — [Freidora de aire ideal](https://listado.mercadolibre.com.ve/freidora-de-aire-ideal)
- «Freidora De Aire Ninja 8q Airfryer 6 En 1, 2 Cestas 8lts 201». US$ 800. Vendidos: 3. Calificación 5.0. Envío gratis. Condición y vendedor: no figuran. El título junta 8 q y 8 L. — [Freidora de aire ideal](https://listado.mercadolibre.com.ve/freidora-de-aire-ideal)
- «Freidora Ninja Air Fryer 6 En 1 Dualzone 10 Qt Dz401 / Bcv». US$ 483,59. Envío gratis. Condición, vendidos y vendedor: no figuran. — [Freidora de aire ideal](https://listado.mercadolibre.com.ve/freidora-de-aire-ideal)
- «Freidora De Aire Ninja Doble Canasta 10 Qarts Original». Condición: «Nuevo | +5 vendidos». Precio: US$ 335. Estado: «Publicación pausada». Vendedor: CAROLSAYE (MercadoLíder, +1000 ventas del vendedor). Modelo en características: AD350CO. Capacidad en características: 10 L y 2 canastos. La descripción también dice «8 cuartos» y «10 cuartos». — [Ficha 10 qarts](https://articulo.mercadolibre.com.ve/MLV-759804888-freidora-de-aire-ninja-doble-canasta-10-qarts-original-_JM)
- «Ninja Combi Horno Freidora Multicoccion 14 En 1 1760w». Vendedor: KoolDepot. Una línea: US$ 799 tachado y US$ 759,05 (5% OFF), 1 vendido. Otra línea del mismo título y vendedor: US$ 799, sin vendidos en el fragmento. — [Freidora de aire ideal](https://listado.mercadolibre.com.ve/freidora-de-aire-ideal); [Power Air Fryer](https://listado.mercadolibre.com.ve/electrodomesticos/power-air-fryer)
- «Horno Tostador Convección Ninja Dt201 Foodi 10 En 1 1800w». US$ 549,99. Envío gratis. Condición, vendidos y vendedor: no figuran. — [Listado donde aparece](https://listado.mercadolibre.com.ve/coccion/vendo-tostadora-de-pan)
- «Olla Cocción Rápida+freidora De Aire 6l 12 Funciones Ninja». Vendedor: KoolDepot. US$ 499. Envío gratis. Condición y vendidos: no figuran. El título no dice Foodi. — [Freidora fitness](https://listado.mercadolibre.com.ve/para-cocina-preparacion-alimentos-freidoras/freidora-fitness)
- «Horno Ninja Tostador Con Freidora De Aire 8en1 Sp151». Vendedor: Inversiones Tecnology 2030. US$ 611 tachado y US$ 465 (el fragmento dice 23% OFF). — [Listado donde aparece](https://listado.mercadolibre.com.ve/coccion/vendo-tostadora-de-pan)
- **Sin US$ en el fragmento.** «Freidora De Aire Ninja Dz201». Condición: «Nuevo | 1 vendido». Vendedor: ARDASE2020. Características: DZ201, 1.800 W, 6 L, 2 canastos. La descripción dice «Ninja DZ201 Foodi» y «8 cuartos». No hay monto en US$. — [Ficha DZ201](https://articulo.mercadolibre.com.ve/MLV-725004992-freidora-de-aire-ninja-dz201-_JM)
- **Sin US$ en el fragmento.** «Freidora De Aire Ninja 6 En 1 Sp200 Air Fryer». Vendedor: MAXIPLACETEKNOCA. Modelo: SP200. No hay monto en US$. — [Ficha SP200](https://articulo.mercadolibre.com.ve/MLV-825954754-freidora-de-aire-ninja-6-en-1-sp200-air-fryer-_JM)
- Títulos vistos sin precio en el fragmento: «Freidora De Aire 6 En 1 Xl 10 Litros 2 Cestas Ninja» (KoolDepot), «Freidora De Aire Ninja Foodie Dz201 2 Cestas 7.5l 1960w», «Ninja Foodi 2 Cestas Air Fryer Ad150», «Freidora De Aire Y Olla De Presión Ninja Foodie Xl 8qt», «Freidora De Aire /olla A Presión Ninja Foodi 13 En 1 6.5qt», «Ninja Foodi Olla A Presión 10 En 1 + Freidora De Aire 6litro», «Ninja Foodi Os301 Olla A Presión Y Freidora 10 En 1 / Bcv». — [Listado Ninja](https://listado.mercadolibre.com.ve/electrodomesticos/ninja); [Olla freidora](https://listado.mercadolibre.com.ve/olla-freidora)

### Inferences
- AF141 de 4,7 L es el grupo más repetido: cinco líneas, pedido vigente más bajo US$ 202 y varias ofertas cerca de US$ 245–276.
- US$ 335, US$ 483,59 y US$ 800 no son el mismo aparato: 10 qarts, DZ401 de 10 qt y una de 8 q / 8 L.

### Gaps
- DZ201 de 6 L y SP200: sin precio USD verificable en la ficha indexada.
- Casi ninguna freidora del listado trae URL de ficha, condición ni vendedor, salvo las fichas citadas.

## 4. Cricut Maker o Cricut Explore

### Takeaway
En el listado de máquinas de corte hay US$ para Maker 3 y para Explore. Maker 3 suelta: US$ 500 (una línea; otro título de Maker 3 con vinilo está a US$ 2.134). Explore nueva: el más bajo visto es US$ 500 y hay varias entre US$ 550 y US$ 690. Una Explore Air 2 usada está a US$ 350.

### Cited Findings
Listado: [Máquina de corte Cricut](https://listado.mercadolibre.com.ve/maquina-de-corte-cricut). Salvo que se diga lo contrario, condición, vendidos y vendedor no figuran, y no hay URL de ficha.

Maker:

- «Maquina Cricut Maker 3. Modelo 2008343 Original.» US$ 500.
- «Cricut Maker 3 Maquina Vinilo Planchado Juego Corte Para Htv». US$ 2.134. El título incluye vinilo y juego de corte, no solo la máquina.

Explore (pedido más bajo entre las que no dicen «Usado»: US$ 500). Líneas de máquina, sin cuchillas ni tapetes:

- «Impresora Cricut Explore Air 2 Plotter De Corte». US$ 500. Envío gratis.
- «Maquina Cricut Explore Air 2 Totalmente Nueva». US$ 550. La condición va en el título («Totalmente Nueva»), no como etiqueta aparte.
- «Máquina De Corte Artesanal 12 Pulgadas Cricut Explore Air 2». Vendedor: Inversiones Tecnology 2030. US$ 806 tachado y US$ 550 (el fragmento dice 31% OFF). Envío gratis.
- «Máquina De Corte Artesanal 12 Pulgadas Cricut Explore Air 2». US$ 663,80. Sin el vendedor de la línea anterior.
- «Cricut Explore 3. Es Una Máquina De Corte». US$ 650.
- «Cricut Explore 4 , Maquina De Repujado , Corte Y Marcador». US$ 690.
- «Máquina De Corte Cricut Air 2». US$ 350. El fragmento marca «Usado».

Joy, fuera de Maker/Explore, en el mismo listado: «Cricut Joy Machine-maquina Compacta De Corte Inteligente» US$ 350; «Cricut Joy Maquina Tapete Corte Juego Boligrafo Muestra» US$ 152,36; «Plotter De Corte Cricut Joy» US$ 350; «Cricut Joy Plotter De Corte 11.4 Cm Ancho De Corte» US$ 550,60; «Cricut Joy Xtra Smart Maquina Corte Color Blanco» US$ 981,62.

- La ficha «Mini Plotter Portátil Cricut Joy» no muestra US$ en el fragmento. Vendedor: INVERSIONESDYSCA, Barquisimeto. Calificación 5.0, 2 opiniones. — [Ficha Cricut Joy](https://articulo.mercadolibre.com.ve/MLV-745543485-mini-plotter-portatil-cricut-joy-_JM)

### Inferences
- Para una Maker 3 descrita como máquina original, el único pedido visto es US$ 500. US$ 2.134 es otro título, con materiales.
- En Explore nueva, lo repetido está entre US$ 500 y US$ 690. US$ 350 es la única línea marcada usada.

### Gaps
- No hay URL de ficha, vendidos ni vendedor para la Maker 3 de US$ 500 ni para la mayoría de las Explore.
- No se abrió el listado en vivo (el patrón de estos listados fue 403). Puede haber más máquinas fuera del fragmento.

## 5. Máquina de coser Brother

### Takeaway
La computarizada con modelo y US$ que sí aparece es la Brother SE400, usada, a US$ 800 (una línea). La ES2000 está titulada computarizada y no trae US$. En bordadoras computarizadas el grupo repetido es la PE545: pedido más bajo US$ 940,50, y se vieron unos cinco montos entre 940,50 y 1.390 dólares.

### Cited Findings
- «Máquina De Coser Brother Se400 Monitor». US$ 800. El listado está bajo usados y la línea dice «Usado». Vendidos y vendedor: no figuran. — [Listado de usadas](https://listado.mercadolibre.com.ve/maquinas-coser/usados/manual-armar-maquina)
- Títulos sin US$ en el fragmento: «Maquina De Coser Brother Modelo Es2000 Computarizada 39punt»; «Maquina De Coser Es-2000 39 Puntadas» (Inversiones Tecnology 2030, envío gratis, dos veces); «Maquina De Coser Digital Brother Es2000» (marcada usada). — [Listado ES2000](https://listado.mercadolibre.com.ve/maquina-de-coser-brother-es2000)
- Títulos sin US$: «Brother Se625 - Máquina De Coser Computarizada Y Bordado» y «Brother Cp100x Maquina Coser Acolchar Computarizada 10». — [Listado bordados Brother](https://listado.mercadolibre.com.ve/maquina-de-bordados-brother)
- Bordadora PE545, pedido más bajo US$ 940,50. En [el listado de bordadoras](https://listado.mercadolibre.com.ve/textil-calzado-confeccion-ropa-maquinas-bordar-en-distrito-capital/maquinas-para-bordar-nombres): «Máquina De Bordar Brother Pe545 Nueva Bcv» US$ 990 tachado y US$ 940,50 (5% OFF); «Máquina De Bordar Brother Modelo Pe545» Inversiones Tecnology 2030 US$ 1.370 (la línea se repite); «Máquina De Bordar Brother Pe545» US$ 1.390; «Maquina Bordadora Brother Pe545» US$ 1.199. Condición y vendidos: no figuran. El primer título dice «Nueva».
- «Máquina De Bordar Brother Se725» US$ 600 y «Bordadora Brother Se725» US$ 899. Condición, vendidos y vendedor: no figuran. — [Mismo listado de bordadoras](https://listado.mercadolibre.com.ve/textil-calzado-confeccion-ropa-maquinas-bordar-en-distrito-capital/maquinas-para-bordar-nombres)
- «Bordadora Pe900 Brother Domestica» US$ 2.499 y «Bordadora Domestica Pe800 Lcd» US$ 1.399. El segundo título no dice Brother. Condición, vendidos y vendedor: no figuran. — [Mismo listado](https://listado.mercadolibre.com.ve/textil-calzado-confeccion-ropa-maquinas-bordar-en-distrito-capital/maquinas-para-bordar-nombres)
- Brother que el fragmento no llama computarizada, en el listado de usadas: «Maquina Coser Brother Ls2125i En Perfecto Estado» US$ 160; «Máquina De Coser Brother Ls-2125i» US$ 75; «Maquina De Coser Brother , Motor Nuevo, Para Trabajo Pesado.» US$ 140; «Máquina De Coser Casera Brother» US$ 140. Todas marcadas «Usado». — [Listado de usadas](https://listado.mercadolibre.com.ve/maquinas-coser/usados/manual-armar-maquina)
- Ficha «Máquina De Coser 17 Puntadas Fb1757t Brother»: «Nuevo | +5 vendidos», «Publicación pausada», vendedor Inversiones Tecnology 2030 (4821 ventas concretadas). Modelo FB1757T. No hay US$ en el fragmento. La descripción habla de disco de puntadas, no de pantalla. — [Ficha FB1757T](https://articulo.mercadolibre.com.ve/MLV-578196380-maquina-de-coser-17-puntadas-fb1757t-brother-_JM)

### Inferences
- La única máquina de coser Brother que el título trata como computarizada y que además muestra US$ es la SE400 usada a US$ 800. Es una sola línea, no un rango.
- PE545 y SE725 son bordadoras (la PE545, de uso doméstico computarizado). Sirven como precio de máquina Brother computarizada de costura/bordado, no como una ES2000.
- LS-2125i a US$ 75 y US$ 160 es otra máquina, mecánica según el modelo del título, y usada.

### Gaps
- ES2000 computarizada: sin precio USD verificable.
- SE625 y CP100X: sin precio USD verificable.
- FB1757T: ficha pausada sin US$ en el fragmento.
- Ninguna de las líneas con US$ de esta sección trae URL de ficha.

## 6. LEGO Icons, Tudor Corner 10350 y Botanical

### Takeaway
Tudor Corner 10350: sin listing verificable. Tampoco apareció un set Botanical con número y US$. Sí hay cuatro Icons con número de set y US$, todos en fichas pausadas: 10318 a US$ 444, 10317 a US$ 500, 10278 a US$ 652 y 10294 a US$ 2.216. Son sets distintos, no un rango del mismo set.

### Cited Findings
- «Lego Icons 10318 Airbus Concorde». Precio: US$ 444. Estado: «Publicación pausada». Vendedor: LABRICKERIA. Modelo: 10318. Piezas en características: 2083. La descripción dice «Nuevo, Caja Sellada». Vendidos de esta publicación: no figuran. La etiqueta «Nuevo» de Mercado Libre no aparece en el encabezado de este fragmento. — [Ficha 10318](https://articulo.mercadolibre.com.ve/MLV-774588578-lego-icons-10318-airbus-concorde-_JM)
- «Lego Icons 10317 Land Rover Classic Defender 90». Condición: «Nuevo | 1 vendido». Precio: US$ 500. Estado: «Publicación pausada». Vendedor: LABRICKERIA. Modelo: 10317. La descripción dice «Nuevo, Caja Sellada». — [Ficha 10317](https://articulo.mercadolibre.com.ve/MLV-822714788-lego-icons-10317-land-rover-classic-defender-90-_JM)
- «Lego Icons 10278 Police Station - Original». El encabezado dice «Nuevo». Precio: US$ 652. Estado: «Publicación pausada». Vendedor: BRICKFANCCS. Modelo: 10278. Piezas: 2923. Vendidos: no figuran. — [Ficha 10278](https://articulo.mercadolibre.com.ve/MLV-721160917-lego-icons-10278-police-station-original-_JM)
- «Lego Icons 10294 Titanic - Original». Condición: «Nuevo | 4 vendidos». Precio: US$ 2.216. Estado: «Publicación pausada». Vendedor: BRICKFANCCS. Modelo: 10294. Piezas: 9090. — [Ficha 10294](https://articulo.mercadolibre.com.ve/MLV-721262870-lego-icons-10294-titanic-original-_JM)
- Una búsqueda de 10350, Tudor y Botanical en Mercado Libre Venezuela no devolvió ese set. Las fichas que sí volvieron son las cuatro de arriba. — [10318](https://articulo.mercadolibre.com.ve/MLV-774588578-lego-icons-10318-airbus-concorde-_JM)

### Inferences
- No hay un «precio del LEGO Icons» único: el Concorde pedido a US$ 444 y el Titanic a US$ 2.216 son sets de tamaño distinto.
- Las cuatro fichas están pausadas. El US$ está en el índice, no en una compra abierta comprobada el 26 de octubre de 2026.

### Gaps
- Set 10350 Tudor Corner: sin listing verificable.
- Línea Botanical (cualquier número de set) con US$: sin listing verificable.
- No se vio un segundo vendedor del mismo número de set, así que no hay rango por set.

## 7. Pokémon TCG, Elite Trainer Box o booster box sellado

### Takeaway
Sin listing verificable de un Elite Trainer Box o de un booster box sellado con nombre de set y precio en US$. La ficha del ETB Twilight Masquerade no abrió (pedía cuenta) y no mostró precio. Lo que sí tiene US$ son sobres sueltos, mazos y booster bundles, que no son una caja de sobres de expansión ni un ETB.

### Cited Findings
- El URL del «Pokemon Elite Trainer Box Etb Twilight Masquerade» devolvió la pantalla de ingreso a la cuenta. Sin título de precio, sin condición, sin vendidos y sin vendedor. — [Ficha que no abrió](https://articulo.mercadolibre.com.ve/MLV-802272236-pokemon-elite-trainer-box-etb-twilight-masquerade-_JM)
- En un listado aparece el título «Pokemon Tcg: Crown Zenith Elite Trainer Box», sin monto en US$. — [Listado donde aparece el título](https://listado.mercadolibre.com.ve/juegos-y-juguetes/wide-crown-starpler)
- No se usa como respuesta, por no ser ETB ni booster box con set: «Caja Completa 36 Sobres Pokemon T.c.g 360 Cartas Inglés», US$ 35, envío gratis, calificación 4.8. El título no nombra el set. Condición, vendidos y vendedor: no figuran. — [Listado de cartas en Distrito Capital](https://listado.mercadolibre.com.ve/juegos-mesa-cartas-en-distrito-capital/pnl-para-aprender-ingles)
- Booster bundles (el título dice bundle, no box), sin condición, vendidos ni vendedor: «Cartas Original Pokémon Tcg Booster Bundle Journey Together» US$ 80,91; «Booster Bundle Cartas - Pokémon Prismatic Evolutions» US$ 131,48; «Carta Original Pokémon Tcg Booster Bundle Stellar Crown» US$ 111,25. También «Carta Original Pokémon Tcg Surprise Box Prismatic Evolutions» US$ 101,14. — [Mismo listado](https://listado.mercadolibre.com.ve/juegos-mesa-cartas-en-distrito-capital/pnl-para-aprender-ingles)
- Sobre suelto, no caja: «Cartas Pokémon Tcg Scarlet & Violet - Sobres - Originales». Condición: «Nuevo | +5 vendidos». Precio: US$ 4,99. Estado: «Publicación pausada». Vendedor: VICIUSGAME VE. Edición en características: Scarlet & Violet. Cantidad de cartas: 10. — [Ficha de sobre](https://articulo.mercadolibre.com.ve/MLV-780633912-cartas-pokemon-tcg-scarlet-violet-sobres-originales-_JM)
- Mazo sellado, no ETB: «Mazo Pokémon Tcg Lucario Ex Battle Deck - Original - Cartas». Condición: «Nuevo | +5 vendidos». Precio: US$ 15,99. Vendedor: VICIUSGAME VE. — [Ficha del mazo](https://articulo.mercadolibre.com.ve/MLV-759874572-mazo-pokemon-tcg-lucario-ex-battle-deck-original-cartas-_JM)

### Inferences
- El mercado visible en US$ para Pokémon en estos fragmentos es de sobres (unos 5 dólares), mazos (unos 16 dólares) y bundles (unos 81 a 131 dólares), no de ETB ni de booster box de expansión.
- US$ 35 por «36 sobres» sin nombre de set queda fuera: no se puede decir de qué expansión es y no se presentó como Elite Trainer Box.

### Gaps
- Elite Trainer Box sellado con US$: sin listing verificable.
- Booster box sellado con nombre de set y US$: sin listing verificable.
- La ficha Twilight Masquerade no abrió.

## 8. Casio G-Shock

### Takeaway
Hay varios G-Shock con US$ y modelo. Entre los que traen modelo, el pedido más bajo visto es el GA-900-1A a US$ 165 (ficha pausada). El DW-6900U aparece dos veces, a US$ 169,20 (con descuento) y US$ 253. Una línea genérica sin modelo está a US$ 36 y no se mezcla con esos modelos.

### Cited Findings
- «Reloj Casio G-shock Ga-900-1a Analogico Digital Original». Precio: US$ 165. Estado: «Publicación pausada». Hay 1 opinión y calificación 5.0. Condición, vendidos y vendedor: no figuran en el fragmento. La apertura directa dio 403. — [Ficha GA-900-1A](https://articulo.mercadolibre.com.ve/MLV-778883926-reloj-casio-g-shock-ga-900-1a-analogico-digital-original-_JM)
- «Reloj Casio G-shock Original Dw-6900u». US$ 180 tachado y US$ 169,20 (el fragmento dice 6% OFF). Envío gratis. Condición, vendidos y vendedor: no figuran. — [Listado DW](https://listado.mercadolibre.com.ve/relojes/reloj-casio-shock-dw-200)
- «Reloj Casio G-shock/ Digital/ Caballero/ Dw-6900u». US$ 253. Envío gratis. Condición, vendidos y vendedor: no figuran. La misma línea también aparece en el otro listado. — [Listado DW](https://listado.mercadolibre.com.ve/relojes/reloj-casio-shock-dw-200); [Listado WR 200 m](https://listado.mercadolibre.com.ve/relojes-pulsera/reloj-casio-wr-200-m)
- «Reloj Casio G-shock Para Caballero / Dw-5600bbn-1». US$ 240. Condición, vendidos y vendedor: no figuran. — [Listado DW](https://listado.mercadolibre.com.ve/relojes/reloj-casio-shock-dw-200)
- «Reloj Original Casio® G-shock Tough Solar 200m Water Resist». Precio: US$ 200. Lugar: Caracas. El fragmento dice «¡Última disponible!». Vendedor: MICRO101, con «+5 ventas» en el bloque del vendedor. Modelo en características: GR-8900-1DR. Condición y vendidos de la publicación: no figuran en el encabezado. La descripción del índice dice nuevo, caja y «Modelo: GR-8900-1». — [Ficha GR-8900](https://articulo.mercadolibre.com.ve/MLV-831597722-reloj-original-casio-g-shock-tough-solar-200m-water-resist-_JM)
- «Reloj Original Casio® G Shock Grande Gd-x6900 200 Mts Nuevo». Precio: US$ 220. Estado: «Publicación pausada». Vendedor: CASIO VZLA. Modelo en características: GDX-6900-1; la descripción dice GD-X6900-1 y «USD: 220 $». Condición: el título dice «Nuevo»; no hay «N vendidos». — [Ficha GD-X6900](https://articulo.mercadolibre.com.ve/MLV-719599255-reloj-original-casio-g-shock-grande-gd-x6900-200-mts-nuevo-_JM)
- «Reloj Original Casio® G Shock Frogman Buceo 200m Japón Nuevo». La descripción dice «Modelo: GF-8250-9DR», «Condición: Nuevo» y «USD: 550 $». El fragmento indexado no muestra la etiqueta de precio US$ de Mercado Libre, solo ese texto dentro de la descripción. Vendidos y un nombre de vendedor con monto de ficha: no figuran. — [Ficha Frogman](https://articulo.mercadolibre.com.ve/MLV-721362745-reloj-original-casio-g-shock-frogman-buceo-200m-japon-nuevo-_JM)
- Sin modelo en el título: «Reloj Casio G-shock». US$ 52,14 tachado y US$ 36 (el fragmento dice 30% OFF). «+25 vendidos». Calificación 4.4. Envío gratis. Vendedor: no figura. — [Listado WR 200 m](https://listado.mercadolibre.com.ve/relojes-pulsera/reloj-casio-wr-200-m)

### Inferences
- Con modelo en el título o en la ficha, se vieron siete publicaciones: GA-900-1A, dos DW-6900U, DW-5600BBN-1, GR-8900-1DR, GD-X6900 y Frogman. El pedido más bajo con etiqueta US$ de Mercado Libre es US$ 165.
- US$ 36 no trae modelo y queda muy por debajo del resto. No se usa como precio de un DW-6900 ni de un GA-900.
- Los 550 dólares del Frogman están escritos en la descripción («USD: 550 $»), no como etiqueta US$ vista en el encabezado.

### Gaps
- No hay URL de ficha para los DW-6900U, el DW-5600BBN-1 ni el G-Shock genérico de US$ 36.
- No figura cuántos GA-900 o GR-8900 se vendieron.
- No se comprobó en vivo el GA-900 (403).

## 9. Apple Pencil Pro o Apple Pencil con generación

### Takeaway
Hay US$ en un listado, sin URL de ficha. Pencil Pro: dos líneas, US$ 38 (más de 5 vendidos, calificación 1.0) y US$ 257 titulada «Original» (más de 5 vendidos, calificación 5.0). El pedido más bajo que dice Pro es US$ 38. Primera generación: US$ 36 y más de 50 vendidos. Una línea mezcla «Usb-c» y «2da Gen» a US$ 179.

### Cited Findings
Todas en [este listado](https://listado.mercadolibre.com.ve/tablet-epad-zt-180-102). No hay URL de ficha. Vendedor: no figura.

- «Lápiz Apple Pencil Pro Para Tablet iPad». US$ 38. «+5 vendidos». Calificación 1.0. Envío gratis. Condición: no figura.
- «Lápiz Original Apple Pencil Pro Para Tablet iPad». US$ 257. «+5 vendidos». Calificación 5.0. Envío gratis. Condición: no figura. En otro listado el título cercano es «Lápiz Apple Pencil Pro Original Para Tablet iPad», con calificación 5 de 5 y 2 calificaciones, sin repetir el monto. — [Tabletas y lápiz](https://listado.mercadolibre.com.ve/computacion/tablets-y-accesorios/tablet-lapiz)
- «Lápiz - Apple Pencil Para Tablet iPad (1era Generación)». US$ 36. «+50 vendidos». Calificación 4.9. Envío gratis. Condición: no figura.
- «Lápiz Original Apple Pencil Usb-c Para Tablet iPad (2da Gen)». US$ 179. 4 vendidos. Envío gratis. Condición: no figura.

Un stylus genérico no es Apple Pencil: «Lápiz Óptico Para Pantallas Táctiles Android Ios Apple», marca BEGROTROL, «Nuevo | +5 vendidos», US$ 15, pausada, vendedor HOMETECHSTORE. — [Ficha del stylus](https://articulo.mercadolibre.com.ve/MLV-781138404-lapiz-optico-para-pantallas-tactiles-android-ios-apple-_JM)

### Inferences
- Los dos títulos «Pencil Pro» no forman un rango estrecho: US$ 38 frente a US$ 257. La de US$ 38 tiene calificación 1.0.
- El título de US$ 179 dice a la vez USB-C y segunda generación. Esas son dos versiones distintas del Apple Pencil; el aviso no aclara cuál es.

### Gaps
- Ninguna ficha de Apple Pencil Pro abrió con vendedor y condición.
- No se vio un Apple Pencil de 2.ª generación cuyo título no mezclara «Usb-c».

## 10. Tableta Wacom

### Takeaway
El listado de Intuos Pro muestra muchos US$. En Intuos chica (CTL-4100) el pedido más bajo es US$ 80 y hay varias entre unos 104 y 278 dólares. En Intuos Pro chica (PTH-460) el más bajo es US$ 459, entre cuatro líneas. En Intuos Pro mediana (PTH-660) las líneas claras van de US$ 560 a US$ 972,67, más una usada a US$ 280. Casi ninguna trae vendidos ni URL de ficha.

### Cited Findings
Salvo que se diga lo contrario, están en [Wacom Intuos Pro](https://listado.mercadolibre.com.ve/computacion/wacom-intuos-pro). Condición no marcada como usada, vendidos ausentes y sin URL de ficha.

Intuos no Pro, modelo CTL-4100 o «Intuos» pequeña. Pedido más bajo: US$ 80. Líneas:

- «Tableta Gráfica Pequeña Intuos Wacom Para Pc Ctl4100 Nueva». US$ 80. El título dice «Nueva».
- «Tablet Grafica Wacom Ctl4100 Intuos». US$ 109,99 tachado y US$ 104,49 (5% OFF).
- «Tableta Gráfica Pequeña Intuos Wacom Para Pc». Vendedor: Área Electrónica. US$ 140.
- «Tableta Grafica De Dibujo Digital Wacom Intuos». Vendedor: Importadora Plata. US$ 140.
- «Tableta 7x8'' Diseño Dibujo Wacom Ctl4100 Intuos + Software». US$ 192.
- «Tableta Wacom Intuos Ctl-4100 Dibujo». US$ 260,21.
- «Tableta Gráfica Wacom Ctl-4100 Negra 8 X7 Intuos / Bcv». US$ 277,90.
- Con Bluetooth, título «Intuos» sin decir Pro: Área Electrónica US$ 219,99 y Importadora Plata US$ 220 («Tableta Gráfica De Dibujo Intuos Wacom Para Pc Con Bluetooth»).
- «Wacom Intuos Ctl6100wlk0 Tableta Gráfica Bluetooth / Bcv». US$ 518,76. Es otro modelo (CTL-6100WL).

Intuos Pro chica, PTH-460 o 28×18 / 11×7. Pedido más bajo: US$ 459. Cuatro líneas:

- «Tableta Grafica 28x18cm Diseño Dibujo Wacom Intuos Pro Inala». US$ 459.
- «Tableta 11x7'' Diseño Dibujo Wacom Pth460k0a Intuos Pro Blue». US$ 552.
- «Wacom Intuos Pro Pth460k0a Tableta Digitalizadora Small». US$ 748,16.
- «Wacom Intuos Pro Pth460k0a Tableta Dibujo Inala 28x18cm Bcv». US$ 798,97.

Intuos Pro mediana, PTH-660 o 34×22 / 13×9. Entre las que se leen como la tableta: pedido más bajo US$ 560.

- «Tableta Grafica 34x22cm Pth660 Intuos Pro Bluetooth Wacom». US$ 560.
- «Tableta Grafica Dibujo 13x9'' Diseño Wacom Pth660 Bluetooth». US$ 599.
- «Tableta 13x9'' Diseño Dibujo Pth660 Intuos Pro Bluetooth». US$ 669.
- «Wacom Intuos Pro Mediana Bluetooth 13x9'' Tableta Dibujo». US$ 910,78.
- «Tableta Wacom Intuos Pro Mediana Bluetooth 34x22cm / Bcv». US$ 972,67.
- «Tablet Wacom Intuos Pro Medium Con Pro Pen 2 Incluida». US$ 280. El fragmento marca «Usado».

Líneas del mismo listado que no se tratan como el mismo aparato: «Tableta Lapiz Wacom Intuo Pro Paper Edition Pth660p T7» US$ 2.048; «Pth660 Intuo Pro Boligrafo Creativo Mediano Negro Corel» US$ 1.913; «Intuo Pro Numero Producto Incluidos: 1 Pieza S Negro» US$ 1.280; «Intuo Pro S Tavoletta Grafica Negro» US$ 928,84; «Intuo Pro Pen Tableta Tactil Mediana Pth-651 K1» US$ 1.075.

Tabletas con pantalla, títulos distintos, una línea cada precio:

- «Tableta Gráfica Wacom Movinkpad 11 Diseño Todo En Uno» US$ 700.
- «Wacom Movinkpad Pantalla 11 Tableta De Dibujo Móvil» US$ 770.
- «Wacom Movinkpad 11 Tableta Dibujo Slim Pro Independiente» US$ 1.105.
- «Tableta Wacom Movinkpad 11 Slim Pro 8gb Ram 128gb Ssd / Bcv» US$ 1.189.
- «Tableta De Dibujo Wacom Movink Con Pantalla Táctil Oled» US$ 1.100.
- «Tableta De Dibujo Wacom Movink Con Pantalla Táctil 13.3» US$ 1.210.
- «Tableta Wacom Movink 13.3 Oled Pro Pen Mac, Pc, Chrome Bcv» US$ 1.869.
- «Tableta Wacom One 13.3 Oled Pro Pen 3 Android Pc Mac» US$ 1.320.

Un accesorio, no la tableta: «Wacom Wireless Accessory Kit Ack40401», «Nuevo | 2 vendidos», US$ 22,50, pausada, vendedor CADIZER. — [Ficha del kit](https://articulo.mercadolibre.com.ve/MLV-724922524-wacom-wireless-accessory-kit-ack40401-kit-inalambrico-wacom-_JM)

### Inferences
- El grupo que más se repite en una banda parecida es la Intuos CTL-4100: ocho líneas de US$ 80 a US$ 277,90, con dos vendedores nombrados (Área Electrónica e Importadora Plata) en US$ 140.
- Intuos Pro chica y mediana no comparten precio: la Pro chica más baja vista es US$ 459 y la mediana nueva más baja es US$ 560.
- Movinkpad 11 va de US$ 700 a US$ 1.189, pero una línea incluye 8 GB de RAM y 128 GB, así que no es seguro que sea el mismo producto.

### Gaps
- Casi ningún aviso de tableta trae vendidos, condición explícita ni URL de ficha.
- No se abrió ninguna ficha de Intuos Pro para confirmar que el US$ siguiera publicado el 26 de octubre de 2026.

## 11. Otros del hogar o el hobby con varios pedidos en USD

### Takeaway
Cinco grupos, distintos de la lista anterior, mostraron más de un pedido en US$ en una banda reconocible: batidoras KitchenAid (usadas, sobre todo de 290 a 700 dólares), Instant Pot (tres líneas, la más baja US$ 250), GoPro Hero 10 (tres líneas, la más baja US$ 841,50), Kindle de entrada (varias líneas, la más baja US$ 237,50) y Nespresso De'Longhi Essenza (dos líneas, US$ 850,99 y US$ 939,09).

### Cited Findings
**Batidoras KitchenAid.** En usadas, se dejan fuera US$ 5 y US$ 50 (una dice «leer descripción») y los repuestos. Pedido más bajo de una batidora completa en ese listado: US$ 290. — [Batidora KitchenAid profesional, usadas](https://listado.mercadolibre.com.ve/para-cocina-preparacion-alimentos-batidoras/usados/batidora-kitchenaid-profesional)

- «Batidora Kitchenaid Artisan 4.7 Litros 325 Watt». US$ 290. Usado.
- «Batidora Kitchenaid De 4.7 Litros 325 Watts Color Gris». US$ 300. Usado.
- «Batidora Profesional, Marca Kitchenaid». US$ 350. Usado.
- «Batidora De Pie Kitchenaid Artisan». US$ 400. Usado.
- «Batidora Kitchenaid Artisan ( Disponible Bcv)». US$ 400. Usado.
- «Batidora Profesional Hd Heavy Duty 10 Velocidades Kitchenaid». US$ 500. Usado.
- «Kitchenaid Batidora Profesional 5 Plus 525w». US$ 700. Usado.
- «Batidora Profesional De 5.7l 6velocidades Y 590v Potencia». US$ 700. Usado. El título no repite KitchenAid.

En otro listado, sin la etiqueta «Usado» en el fragmento: «Batidora Kichen Aid Artisan Beetroot 4.7 L» US$ 499; «Batidora Kitchenaid De 325w Bowl De Vidrio» US$ 650; «Batidora Kitchenaid Artisan» US$ 650; «Batidora Profesional Kitchinaid 4,7 L 525w 10 Velocidades» US$ 990. Vendedor, vendidos y condición: no figuran. — [Listado donde aparecen](https://listado.mercadolibre.com.ve/electrodomesticos/c-47-papercraft)

**Instant Pot.** Tres líneas. Pedido más bajo: US$ 250.

- «Olla Presión Electrica Instant Pot Duo60 V3, 5,68 L, 6 Quart». US$ 250. Condición, vendidos y vendedor: no figuran. — [Listado donde aparece](https://listado.mercadolibre.com.ve/cucharones-racion)
- «Olla De Presion Electrica Multiuso 6l Instant Pot Serie Rio». Vendedor: KoolDepot. US$ 399. 2 vendidos. Calificación 5.0. Envío gratis. Condición: no figura. — [Listado donde aparece](https://listado.mercadolibre.com.ve/apagador-jet-kit)
- «Olla De Presión Electrónica 6l 9 Funciones Instant Pot». Vendedor: KoolDepot. US$ 469. Envío gratis. Condición y vendidos: no figuran. — [Freidora fitness](https://listado.mercadolibre.com.ve/para-cocina-preparacion-alimentos-freidoras/freidora-fitness)

**GoPro Hero 10.** Tres líneas del mismo título, pedido más bajo US$ 841,50. Condición, vendidos y vendedor: no figuran. — [Cámaras](https://listado.mercadolibre.com.ve/camaras-y-accesorios/camaras/camaras-digitales/camara-para-tomar-foto)

- «Cámara Gopro Hero10 Fotos D/23mp 5.3 Ka 60 Fps C/accesorios». US$ 841,50.
- La misma fórmula de título: US$ 1.080.
- La misma fórmula de título: US$ 1.132, con envío gratis.

**Kindle de entrada (no Paperwhite ni Scribe).** Pedido más bajo: US$ 237,50. Condición, vendidos y vendedor: no figuran. — [Listado donde aparecen](https://listado.mercadolibre.com.ve/computacion/lectura-en-frio)

- «Kindle Basic 2024 Matcha + Fundas Color Diseño». US$ 250 tachado y US$ 237,50 (5% OFF).
- «Kindle 11 Gen 16gb E-reader - Lectura Digital Amazon». US$ 240.
- «Tablet Amazon Kindle 16gb 11ava Gen 2024 6 Pulgadas». US$ 258,98 tachado y US$ 246,03 (5% OFF).
- «Kindle Gen 11 6 16gb Táctil Con Luz Y Audiolibros». US$ 340.

Otros Kindle en el mismo listado, modelos distintos: Paperwhite 8 GB US$ 450 tachado y US$ 399,99; Paperwhite Kids 16 GB US$ 290; «Kindle Paperwhite 16gb Gen 12 Bcv» US$ 480; Paperwhite Signature 32 GB US$ 560; Colorsoft Signature 32 GB US$ 470 tachado y US$ 446,50; Scribe 16 GB US$ 600.

**De'Longhi Essenza.** Dos líneas, pedido más bajo US$ 850,99. Título: «Cafetera Expreso Delonghi Nespresso Essenza 19bares/capsula», a US$ 850,99 y a US$ 939,09. Condición, vendidos y vendedor: no figuran. — [Café en cápsulas](https://listado.mercadolibre.com.ve/cocina/cafe-en-capsulas)

### Inferences
- KitchenAid usada, Artisan de 4,7 L y Professional, se agrupa entre US$ 290 y US$ 700 en ocho líneas. US$ 499 a US$ 990 del otro listado no dice «Usado», pero tampoco dice «Nuevo».
- Instant Pot no es un solo modelo: Duo60 de 6 cuartos a US$ 250, Rio de 6 L a US$ 399 y otra de 6 L y 9 funciones a US$ 469.
- Hero 10 es el único de estos cinco con el mismo título repetido tres veces (US$ 841,50 a US$ 1.132).

### Gaps
- Ninguno de estos cinco tiene URL de ficha en los fragmentos.
- No hay vendidos en KitchenAid, Hero 10, Kindle ni Essenza.
- No se buscó un sexto rubro después de estos; drones, perfume, medicinas, suplementos, teléfonos y laptops quedaron fuera a propósito.
