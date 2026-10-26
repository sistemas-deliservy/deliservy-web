# Per-shipment platform fees and urban parcel unit economics

Research date: 25 October 2026. Scope is parcel / encomiendas / urban motorcycle courier software and customer prices, not restaurant-delivery commissions, except for one explicit contrast. No price is recommended for Deliservy. Every figure below is either copied from a cited page or arithmetic on those figures. Where a vendor does not publish the rate needed to finish the sum, the cell is left blank and recorded as a gap.

Billable-unit warning used in every calculation: vendors do not define “1 parcel” the same way.

- Onfleet bills a completed **task**, and a task is one pickup **or** one delivery. A parcel with both ends can be two tasks. — [Onfleet pricing](https://onfleet.com/pricing)
- Tookan bills one task for “1 pickup or 1 delivery or a pickup & delivery.” Each extra connected stop is half a task. — [Tookan pricing](https://jungleworks.com/tookan/pricing/)
- Spoke Dispatch (formerly Circuit for Teams) bills a **stop**, and a stop is used if a driver attempts it, it is a depot stop, it is marked failed or delivered, or it is accessed via the API, exported, or printed. — [Spoke Dispatch pricing](https://spoke.com/dispatch/pricing)
- Shipday bills an **order**. Shippo and EasyPost bill a **shipping label** (postage is extra). Those label fees are not an urban-dispatch fee.

The tables below assume **one billable unit per parcel** unless a second case is shown. That assumption understates Onfleet if pickup and drop-off are both tasks, and it understates Spoke if depot stops, failed attempts, exports, or prints are also billed.

## What per-task or per-stop fees do last-mile vendors publish, and what is the platform bill at 500, 2,000, and 8,000 parcels a month?

### Takeaway

At a one-unit-per-parcel reading of pages fetched on 25 October 2026, the cheapest published way to cover 2,000 parcels is on the order of **$165–$279 per month** ($0.08–$0.14 per parcel) at Tookan, Shipday, and Spoke, while Onfleet’s smallest published plan is a **$619 floor** ($0.31 per parcel) because its Launch plan is sold in a block of 2,500 tasks. At 8,000 parcels the same three vendors land around **$0.05–$0.10 per parcel** if the buyer is allowed to stay on the cheap plan and pay the published overage. Onfleet’s overage rate is not on its pricing page, so the 8,000-parcel Onfleet bill cannot be calculated. Route4Me does not sell by the parcel.

### Cited Findings

- Onfleet, live pricing page, fetched 25 October 2026: Launch **$619 per month** including **2,500** completed delivery or pickup tasks; Scale **$1,349** including **5,000**; Enterprise **starting at $3,099** for **10,000+** tasks; Courier Suite add-on **starting at $299 per month**. Users are unlimited on these plans. A task counts only when it reaches Completed status. SMS and voice are billed separately, per segment, the month after use; the page says to contact sales if the country is not listed. The page does **not** publish a per-task overage price. — [Onfleet pricing](https://onfleet.com/pricing)
- Onfleet’s own blog post dated 29 August 2025 still listed the older card: Launch $599 / 2,500 tasks, Scale $1,299 / 5,000, Enterprise starting at $2,999 / 10,000+. — [Onfleet blog, 29 Aug 2025](https://onfleet.com/blog/last-mile-delivery-companies/). The live page on 25 October 2026 shows the higher card ($619 / $1,349 / $3,099). FarEye, writing in 2026 and saying it verified the official page in August 2026, reports the same higher card and states that the overage rate is unpublished; it says third-party guides circulate “roughly $0.26 per task” and that both sources it checked hedge that figure. — [FarEye, Onfleet pricing](https://fareye.com/resources/blogs/onfleet-pricing). That $0.26 is **not** used in the arithmetic below.
- Onfleet’s help center confirms that completed tasks, remaining allowance, overages, and telephony fees are visible in the dashboard, and that a task is counted when completed in the driver app or by API. The indexed article does not state the overage cents. — [Onfleet billing help](https://support.onfleet.com/hc/en-us/articles/360023669252-Billing)
- Tookan pricing page, fetched 25 October 2026, renders **two** rate cards for the same task caps. Lower card: Startup **$99/month**, 1,000 tasks, extra **$0.12**; Growth **$249**, 3,000 tasks, extra **$0.09**; Standard **$399**, 6,000 tasks, extra **$0.06**; Enterprise 50,000+ tasks, extra **$0.03**, base price custom. Higher card: Startup **$129**, extra **$0.15**; Growth **$299**, extra **$0.12**; Standard **$499**, extra **$0.09**; Enterprise extra **$0.04**. The lower card is printed as “$99 /month $129” (and the same pattern for the other tiers), which is how many pages show a discounted figure beside a list figure, and the FAQ says annual plans are twelve months paid upfront. The fetch does not label which card is the annual monthly-equivalent. Free plan: 100 tasks and 2 drivers, not enough for 500 parcels. — [Tookan pricing](https://jungleworks.com/tookan/pricing/)
- Tookan FAQ: one pickup plus one delivery counts as one task; each additional connected stop counts as half a task. Route optimization is a post-paid extension at **$0.01 per task**. — [Tookan billing FAQ](https://jungleworks.com/tookan/resources/faq-billing/). An older Jungleworks help article and the Shopify app listing still show a previous grid (for example Startup $99 for 700 tasks). Those are not the live pricing-page card and are not used below. — [Jungleworks billing overview](https://help.jungleworks.com/knowledge-base/billing-overview-for-tookan/); [Shopify app listing](https://apps.shopify.com/tookan)
- Shipday pricing page, fetched 25 October 2026, publishes a Professional plan **starting at $49/month**, **300 orders included**, **$0.10 per extra order**, and a comparison table (the one that also lists dispatch-staff caps and unlimited drivers) in which Business AI is **$399** with **1,500 orders included** and **$0.25 per extra order**. Branded Elite is $99 with 300 orders and $0.20 extra; Business AI Lite is $199 with 750 orders and $0.20 extra. The same fetch also shows a merchant-oriented Business AI at $399 with **unlimited** orders. The FAQ says merchant plans are for a business delivering its own goods and delivery-company plans are for couriers delivering for other businesses. All of these are “starts at.” Basic/free is capped at 300 orders a month. — [Shipday pricing](https://www.shipday.com/pricing)
- Spoke Dispatch, formerly Circuit for Teams (getcircuit.com/teams/pricing returned the same card): Starter **$125/month**, **1,000 stops**, extra **$0.04**; Premium **$200**, **2,000 stops**, extra **$0.06**; Expert **$1,000**, **12,000 stops**, extra **$0.07**. Prices in USD and “may differ depending on your region.” Extra stops are billed the following month. A third-party check dated 12 October 2026 records the same three prices and notes that an older Circuit card (Starter $100 and other tiers) is outdated. — [Spoke Dispatch pricing](https://spoke.com/dispatch/pricing); [Spoke help, products and pricing](https://routeplannerhelp.spoke.com/en/articles/16162270-spoke-products-pricing); [Front Desk Review, checked 12 Oct 2026](https://frontdeskreview.com/software/route-optimization/circuit-for-teams/)
- Route4Me’s billing guide says a package includes a set number of **users**, and adding users changes the price **per user**. It also describes monthly pay-as-you-go, annual, and a custom volume plan. It does not publish a per-stop or per-parcel price. — [Route4Me billing model](https://support.route4me.com/billing-model/). The public get-started page’s structured data, as returned in search on 25 October 2026, contains an offer range of **USD 199 to 349**. A reviewer who checked on 30 September 2026 says the visible page has no dollar figure, that those 199/299/349 amounts sit only in JSON-LD with `priceValidUntil` 30 October 2026, and that older per-user rates ($40 / $60 / $90) no longer appear on the vendor’s site. — [route4me.com/get-started](https://route4me.com/get-started); [Fleet Ops Club, 30 Sep 2026](https://fleetopsclub.com/software/route4me/pricing)
- Shippo API Starter, official API pricing page: **30 labels per month free, then $0.07 per label**. Separate fees: tracking **$0.02** per track, rating **$0.01** per rate generation, US address validation **$0.02**, non-US address validation **$0.08**. Insurance is 1.25% of declared value plus shipping (US) or 1.5% (international). Postage is not included in the $0.07. This is a label API aimed at USPS, UPS, FedEx, and DHL, not a motorcycle-dispatch product. — [Shippo API pricing](https://goshippo.com/pricing/api)
- EasyPost pricing page, fetched 25 October 2026: wallet-carrier access is **free for up to 3,000 labels** (postage not included) and then a **per-label fee whose amount is not printed**; Bring Your Own Carrier Accounts is **$20 per month plus a per-label fee**, amount not printed; enterprise is custom. Tracking API is **$0.01–$0.03 per shipment**; advanced tracking **$0.03 per shipment**; insurance **1% of shipment value, minimum $1**. — [EasyPost pricing](https://www.easypost.com/pricing/). Secondary pages disagree on the missing cents (one 2026 blog says $0.05 after 3,000 labels; a Sacra note says support docs list $0.08). Those cents are not used here because the vendor page fetched on this date does not state them. — [Cargoson](https://www.cargoson.com/en/blog/top-multi-carrier-shipping-software-mcs-providers); [Sacra](https://sacra.com/chat/h/459dc68b-39b0-4be4-8dee-2861ffde8922/)

### Inferences

Arithmetic uses the cheapest **published** combination that covers the volume, one billable unit per parcel, no add-ons (no Onfleet Courier Suite, no Onfleet SMS, no Tookan route-optimization $0.01, no Shippo tracking or address validation). “Lower” and “higher” are the two Tookan cards on the same page. Shipday uses the Professional plan at the published “starts at” price of $49 plus $0.10. Spoke uses Starter plus its published $0.04 extra stop even above 1,000 stops, because that sum is lower than upgrading; the pricing page does not say a buyer is forbidden to do that. Onfleet at 500 and 2,000 is the Launch floor of $619, because 2,000 tasks fit inside 2,500.

| Vendor, one unit = one parcel | 500 / month | 2,000 / month | 8,000 / month |
|---|---|---|---|
| Onfleet | $619 → **$1.24**/parcel | $619 → **$0.31**/parcel | Not computable. Enterprise list price $3,099 / 8,000 = **$0.39** only if that starting price covers 8,000 tasks. The page sells Enterprise as 10,000+ and does not publish the overage on Scale’s 5,000-task cap. |
| Tookan, lower card | $99 → **$0.20** | $99 + 1,000 × $0.12 = **$219** → **$0.11** | $399 + 2,000 × $0.06 = **$519** → **$0.065** |
| Tookan, higher card | $129 → **$0.26** | $129 + 1,000 × $0.15 = **$279** → **$0.14** | $499 + 2,000 × $0.09 = **$679** → **$0.085** |
| Shipday Professional | $49 + 200 × $0.10 = **$69** → **$0.14** | $49 + 1,700 × $0.10 = **$219** → **$0.11** | $49 + 7,700 × $0.10 = **$819** → **$0.10** |
| Spoke Dispatch, Starter + $0.04 | $125 → **$0.25** | $125 + 1,000 × $0.04 = **$165** → **$0.083** | $125 + 7,000 × $0.04 = **$405** → **$0.051** |
| Shippo label fee only | 470 × $0.07 = **$32.90** → **$0.066** | 1,970 × $0.07 = **$137.90** → **$0.069** | 7,970 × $0.07 = **$557.90** → **$0.070** |
| EasyPost wallet labels | $0 platform label fee (under 3,000) | $0 platform label fee (under 3,000) | Not computable. 5,000 labels sit past the free 3,000 and the per-label fee is unpublished. BYOCA adds $20 plus that same unpublished fee. |
| Route4Me | Not computable. No per-parcel price. | Not computable. | Not computable. |

Per included unit, before overage, the published blocks work out to: Onfleet Launch $619/2,500 = **$0.25**, Scale $1,349/5,000 = **$0.27**, Enterprise $3,099/10,000 = **$0.31**; Spoke Starter $125/1,000 = **$0.125**, Premium $200/2,000 = **$0.10**, Expert $1,000/12,000 = **$0.083**. Spoke’s **extra**-stop price goes the other way ($0.04, then $0.06, then $0.07), so on the printed card the Starter overage is cheaper than moving up a tier at 2,000 and at 8,000.

If an Onfleet parcel is two tasks (one pickup and one delivery):

- 500 parcels = 1,000 tasks, still inside Launch: still **$619** (**$1.24** per parcel).
- 2,000 parcels = 4,000 tasks. Launch’s 2,500-task cap is exceeded and the overage is unpublished. The cheapest published plan that includes 4,000 tasks is Scale at **$1,349** (**$0.67** per parcel).
- 8,000 parcels = 16,000 tasks, above the 10,000-task Enterprise starting point. The bill is not published. $3,099 would be only a lower anchor if the “starting at” price still applied at 16,000 tasks, which the page does not say.

Tookan would still count that same pickup-plus-delivery as **one** task, so the Tookan column does not double.

Tookan route optimization, if switched on for every task at the published $0.01, adds $5, $20, and $80 at the three volumes. That is omitted from the table.

### Gaps

- Onfleet’s per-task overage, in cents, is not on the pricing page or in the help-center text retrieved here. The 8,000-parcel (and the two-task 2,000-parcel) Onfleet bill is therefore unknown. The circulating $0.26 is a third-party approximation, not a vendor price.
- Onfleet telephony rates for Venezuela are not in the fetched pricing text.
- Tookan’s page shows two cards and does not, in the fetched text, say which one is the monthly list and which is the annual equivalent. Both are reported. A contract could differ from either.
- Shipday prices are “starts at.” The fetch mixes merchant and delivery-company tables; the $49 / $0.10 path is what the delivery-company comparison table supports, but a sales quote could put a courier on a different card. One merchant card shows unlimited orders at $399, which would change the 8,000-order sum to $399 (**$0.05** per order) if that card applied. It is not used as the courier figure.
- Whether Spoke allows a Starter subscriber to run 8,000 stops at $0.04 rather than being moved to Expert is not stated. The $405 figure is the printed arithmetic, not a confirmed invoice.
- Spoke stop definition includes depot stops, failures, API reads, exports, and printouts, so stops per physical parcel are greater than one by an unknown amount.
- Route4Me cannot be turned into a per-parcel fee without a user count and a visible per-user price. The 199–349 USD range is structured data, not a rate a buyer can check out, and it is not stated as per user.
- EasyPost’s per-label cents are not on the pricing page fetched on this date. No Uber Direct, DoorDash Drive, Stuart, or Borzo per-delivery API fee was found in this pass; those products were not confirmed as publishing a 2025–2026 list price here.
- No vendor page above is a Venezuelan-peso or bolívar price. All software figures are US dollars as printed by the vendor.

## What does urban parcel or motorcycle-courier delivery cost the customer in Venezuela in 2025–2026?

### Takeaway

The only same-day motorcycle figures found are a **Caracas launch price starting at US$0.66** (Yango Envíos, October 2025, not a flat fare) and a **Valencia/Naguanagua retailer posting US$3** for its own motorcycle delivery (undated). National couriers that do publish a tariff are in a different product: Tealca’s web tariff dated **8 January 2026** is **US$2.19** for a Zone 1 envelope up to 150 g, before IVA and the postal stamp, payable in bolívares at the BCV rate of the payment day. MRW, Zoom, and Domesa do not publish a numeric urban tariff on the pages found. No live Liberty Express tariff could be confirmed: the indexed URL returned 404 on 25 October 2026.

### Cited Findings

- **Yango Envíos, Caracas, motorcycle and car, October 2025.** Two outlets report the launch of point-to-point package delivery inside the Yango app in Caracas. Both say fares **start at US$0.66 on a motorcycle and US$1.24 in a car**, and that the fare then moves with distance and package size. El Farandi (15 October 2025) calls these “costos iniciales.” Descifrado (9 October 2025) says users get a limited-time promotion on the first use, and that the service “inicia en” those amounts. This is a starting fare at launch, not a citywide flat rate, and it is not a 2026 price. — [El Farandi, 15 Oct 2025](https://www.elfarandi.com/2025/10/15/yango-servicio-envios-caracas/); [Descifrado, 9 Oct 2025](https://www.descifrado.com/2025/10/09/yango-venezuela-amplia-su-servicio-con-el-lanzamiento-de-envios-en-caracas/)
- **Tealca, national parcel tariff marked 8 January 2026, in US dollars.** The company page says the figures are approximate, the final invoice can differ, and they are referential until the office quotes the shipment. **IVA is not included. Franqueo Postal Obligatorio is not included.** Zone 1 is defined as “Urbano y Gran Caracas.” Cash (contado), Zone 1: **US$2.19** for 0–150 g and **US$2.45** for 151–250 g. COD, Zone 1: **US$2.30** and **US$2.58** for those two weight bands. Zone 2 (“Hasta 300 KM”), contado: **US$2.47** (0–150 g) and **US$3.30** (151–250 g). The page says dollar prices **may be paid in bolívares at the Banco Central de Venezuela rate in force on the day of payment**. It does not print that rate. A 3% IGTF surcharge applies to payments in a currency other than the bolívar in cash, citing the large-financial-transactions tax. Heavier pieces above 4 kg use a base plus an extra-kilo price that the fetched table does not list. — [Tealca, tarifas sobre nacional](https://www.tealca.com/tarifas-sobre-nacional/)
- **Retailer motorcycle delivery in Valencia, undated, in US dollars.** Espacio Ananá’s shipping policy posts its own delivery, by motorcycle only, in “Zona Metropolitana de Valencia y Naguanagua” at **US$3**. If the rider arrives and nobody is there, a reattempt is another **US$3**. The same page posts what the shop charges the customer for national MRW, paid by the shop: **US$5** for 0–1 kg, **US$7** for 1–2 kg, **US$10** for 2–3 kg, agency delivery, not home delivery; cash-on-delivery MRW is described as “sobre $5, aprox. en su equivalente en Bs.” The indexed text has **no publication date**. These are the shop’s prices to its buyers, not a tariff page of MRW or of a courier company. — [Espacio Ananá, política de envío](https://espacioanana.com/policies/shipping-policy)
- **MRW Venezuela, no numeric freight tariff on the pages found.** The FAQ says the price is calculated from weight, points to an online calculator, and says corporate rates are quoted by email. Transit time is estimated at 24–72 hours. Optional “resguardo” is **3% of declared value, excluding IVA**, mandatory for phones and electronics, covering a declared value from **US$1 to US$600**. The calculator page says the result is approximate and does not expose a static price list. — [MRW FAQ](https://mrwve.com/preguntas-frecuentes); [MRW calculator](https://mrwve.com/calcula-envio)
- **ZOOM, no numeric tariff found.** The national-shipments page says price depends on weight and distance, that same-city COD has discounts, and that lightweight pieces up to 250 g have preferential same-city prices. It does not print those prices. A 13 November 2025 post says **73% of national shipments arrive in 24–48 hours**, with examples that include Valencia–Maturín in 24 hours. That post is about time, not price. — [ZOOM envíos nacionales](https://zoom.red/envios-nacionales-personas/); [ZOOM, 13 Nov 2025](https://zoom.red/tus-envios-nacionales-ahora-son-mas-rapidos-con-zoom/)
- **Domesa.** The public portal retrieved in search lists contact channels and tracking. No tariff table was found. — [Domesa](https://www.portal.domesa.com.ve/)
- **Anecdote, not a tariff, September 2025.** In a Reddit thread dated 13 September 2025 about a **Caracas-to-Cojedes** Mercado Libre shipment (intercity, not a city motorcycle trip), one comment says the minimum is “entre 3$ 4$ bcv.” Another, the next day, recalls that about two months earlier **0.5 kg was around US$3 at MRW and about US$6 at Zoom**, route not stated. — [r/venezuela, 13 Sep 2025](https://www.reddit.com/r/venezuela/comments/1ng92jw/cu%C3%A1nto_cuesta_un_env%C3%ADo_en_mrw_o_zoom/)
- **Liberty Express, not confirmed live.** Search still indexes `https://libertyexpress.com/tarifa/tarifa-nacional-venezuela-cobro-en-destino/` as “Tarifa Urbana Zona 1 Venezuela,” naming Maracay, Valencia, Gran Caracas, Barcelona, and Barquisimeto, with a table in bolívares (the extra-kilo line in the snippet is “Bs. 508,50”) and, for cash-at-origin, a 0.25 kg total of 722.70, a 0.5 kg total of 1,445.40, and a 1 kg total of 1,593.90, each including a postal-stamp column. A direct fetch of that URL on **25 October 2026 returned 404**. Those bolívar figures are therefore **not** treated as a current tariff. The indexed page, as captured in search, did not state a BCV rate.

### Inferences

Set next to the one-unit software bills, using only prices that were confirmed on a live or dated page:

| Customer price used as the denominator | What it actually is | Software bill at 2,000 parcels, as a share of that customer price |
|---|---|---|
| US$0.66 | Yango motorcycle **starting** fare, Caracas, October 2025, before distance | Onfleet $0.31 = **47%**. Tookan higher card $0.14 = **21%**. Shipday $0.11 = **17%**. Spoke $0.083 = **13%**. |
| US$2.19 | Tealca Zone 1, 0–150 g, contado, 8 Jan 2026, **before IVA and FPO** | Onfleet $0.31 = **14%**. Tookan higher $0.14 = **6%**. Shipday $0.11 = **5%**. Spoke $0.083 = **4%**. Tookan lower $0.11 = **5%**. |
| US$3 | One Valencia retailer’s own motorcycle fee, undated | Onfleet $0.31 = **10%**. Tookan higher $0.14 = **5%**. Shipday $0.11 = **4%**. Spoke $0.083 = **3%**. |

At 500 parcels the Onfleet floor is $1.24, which is **larger than the Yango starting fare** and about **57%** of the Tealca US$2.19 envelope (1.24 / 2.19). That comparison is the cost of buying a 2,500-task block for 500 parcels, not a per-task meter. At 8,000 parcels, Spoke’s printed $0.051 is about **2%** of US$2.19 and about **8%** of US$0.66; Tookan’s higher card at $0.085 is about **4%** of US$2.19 and about **13%** of US$0.66.

These percentages are shares of the **price the end customer pays the carrier or the shop**, not shares of what the operator keeps. The operator’s net is a gap (next section). Tealca’s US$2.19 is also a different product from a same-day motorcycle trip: it is a light national-courier envelope in “Urbano y Gran Caracas,” office-quoted, tax and postal stamp on top.

Zone 2 on the same Tealca card (up to 300 km, which is the distance band that would cover a Valencia–Caracas road haul of roughly that length) is US$2.47 for 0–150 g contado. The page does not say that a Valencia–Caracas shipment is Zone 2; that placement is a reading of the kilometer labels, not a route quote.

No bolívar amount is converted to dollars here. Tealca already states dollars and says bolívares follow the BCV rate of the payment day without printing the rate. The Liberty table, unconfirmed, was left in bolívares.

### Gaps

- No 2025–2026 price list, in dollars or bolívares, was found for a named Valencia motorcycle courier (as opposed to one retailer’s own US$3 delivery).
- No current numeric tariff was confirmed for MRW, Zoom, Domesa, or Liberty. MRW’s calculator does not publish a static rate. Liberty’s indexed URL was a 404 on the research date.
- Yango’s US$0.66 and US$1.24 are October 2025 **starting** fares at launch, with a first-use promotion mentioned. The fare after a longer trip, and the fare in October 2026, were not found.
- Tealca does not print the BCV rate, the IVA rate on the freight, or the postal-stamp amount, so the cash the customer hands over is higher than US$2.19 by an unstated amount.
- Reddit figures are single comments about an intercity purchase. They are not a company tariff.

## What slice of the customer price is courier pay versus company margin?

### Takeaway

No credible 2024–2026 source found in this pass states what share of a Venezuelan, or even a Latin American urban parcel, price is paid to the rider and what share the company keeps. The closest primary statements are a food-delivery marketplace (Deliveroo, 2024) whose cost of sales is mostly rider cost, and a 2022 Brazilian paper that **explicitly refused to estimate the app’s cut** because the platforms do not disclose it. Those are not a parcel-company split and are not used as one.

### Cited Findings

- Mello et al., *Transportes* 30(2), 2022, studying instant-delivery **food, drink, and pharmacy** apps in eight Brazilian cities, write that they treated the delivery fee shown by the app as the courier’s pay, and that “we recognise that the application retains a percentage of the delivery fee for system management; however, this information is unclear and was not considered in the study.” They repeat that the analysis did not include “the percentage of the delivery fee allocated to the application management.” — [Mello et al. 2022, PDF](https://www.revistatransportes.org.br/anpet/article/download/2641/957)
- Deliveroo’s 2024 annual report (food marketplace, not a parcel carrier) states revenue of **£2,071.9 million** and a **revenue take rate of 27.9% of GTV** (gross transaction value). Gross profit was **£766.9 million**, and gross profit margin was **10.3% of GTV**. The report says gross profit is revenue less cost of sales, and that cost of sales **“primarily comprises rider costs and credit card fees.”** Cost of sales per order was **£4.41** in 2024. — [Deliveroo annual report 2024, performance extract](https://deliveroo.annualreport2024.com/media/52ljc4pz/deliveroo-ar2024-our-performance.pdf)
- ZTO Express, in its 4Q24 and FY2024 financial-details sheet, reports a gross profit margin of **31.0%**, and **31.5%** for the core express-delivery business (31.0% in 2023 for that core line, as printed on the sheet). This is a Chinese national express network’s gross margin on its own revenue, not a rider’s share of an urban fare. — [ZTO 4Q24 and FY2024 financial details](https://filecache.investorroom.com/mr5ir_zto/387/ZTO%204Q24%20and%20FY2024%20Financial%20Details%20for%20Earnings%20Call.pdf)
- Delhivery’s FY24 earnings call (year ended 31 March 2024) says the company delivered **740 million express parcels** and that express-parcel revenue was **Rs 5,077 crore**, up from Rs 4,552 crore and 663 million shipments in FY23. That is an India-wide express network. The call does not split that revenue into courier pay and company margin. — [Delhivery Q4 FY24 transcript, May 2024](https://www.delhivery.com/uploads/2024/05/EarningsCallTranscript_Q4FY24.pdf)

### Inferences

From Deliveroo’s two published ratios only: cost of sales as a share of GTV is 27.9% − 10.3% = **17.6% of GTV**. Cost of sales as a share of Deliveroo’s own revenue is 17.6 / 27.9 = **63%**. Because card fees sit inside that cost of sales, rider cost is **less than** 63% of revenue and **less than** 17.6% of the consumer’s basket. The report does not publish the rider-only percentage. This describes a restaurant marketplace in which the platform’s revenue is a cut of the whole order, and riders are the main cost of that cut. It is not evidence about a Venezuelan parcel company that charges the customer US$0.66–$3 and pays a motorcycle courier.

ZTO’s 31% gross margin means about **69% of express revenue** was cost of revenue in that year. Cost of revenue for a national express company includes line-haul, sorting, and last-mile, so it is not “courier pay.”

Delhivery’s FY24 express average, as arithmetic on the two figures in the transcript: Rs 5,077 crore / 740 million parcels = **about Rs 69 per express parcel**. That is average revenue, not the rider’s wage, and it is a national network rather than a single-city motorcycle operation.

None of these can be applied to the Tealca, Yango, or Valencia prices. A platform software fee can be compared with the customer price (previous section). It cannot, on this evidence, be compared with what the operator “actually earns” after courier pay, fuel, and maintenance.

### Gaps

- No academic paper, company filing, or news report found here gives courier pay as a percentage of the customer price for urban parcels in Venezuela, Colombia, or elsewhere in northern Latin America in 2024–2026.
- No source gives fuel, maintenance, or dispatcher cost per urban parcel in Valencia or Caracas.
- Older figures that sometimes circulate (a 2016 news story that UberRush paid riders 80% of the customer fee; a 2018 paper citing a Business Insider claim that the last mile is 53% of delivery cost) are the wrong year and the wrong object. They are not used. A trade blog’s suggestion that FedEx Ground line-haul drivers “should” be paid 30–40% of the haul is a guideline for a different job, not a measured urban-parcel split, and is not used.

## How do Rappi and PedidosYa take rates differ from B2B parcel-software fees?

### Takeaway

Restaurant marketplaces charge a **large percent of the food ticket**. In Argentina in 2024 that percent was negotiated in the high teens to low thirties, and Deliveroo’s own 2024 accounts put marketplace revenue at **27.9% of everything the consumer spent**. Parcel software reviewed above charges a **fixed monthly block plus a few cents per task**, which at 2,000 parcels is about **$0.08–$0.31 per parcel**. Those cents are a few percent of a US$2–$3 shipment and are not a 15–30% commission on the shipment.

### Cited Findings

- PedidosYa’s Argentina restaurant page offers **10% commission for 30 days** and says that after that the commission is a percentage of each order, varying by partner type, location, and market. It does not print the standing rate. — [PedidosYa socios, Argentina](https://socios.pedidosya.com.ar/)
- Rappi’s Argentina restaurant page offers **0% fees for 30 days** and says the charge is a commission, a percentage plus IVA, on each sale. It says the percentage varies by country and is shown during registration. It does not print a standing Venezuela or Argentina rate. — [Rappi Partners, Argentina](https://merchants.rappi.com/es-ar/restaurants)
- Diario La Unión, 14 September 2024, quotes the president of the Cámara de Comercio de Banfield: a chamber deal cut **Rappi’s commission from 27% to 17%** and **PedidosYa’s from 33% to 16%** for gastronomic businesses, extended to Lomas. — [Diario La Unión, 14 Sep 2024](https://launion.com.ar/nota/41317/2024/09/el-acuerdo-con-apps-de-delivery-en-banfield-que-beneficia-a-los-comerciantes)
- Minuto Santa Fe, 25 October 2024, reporting Rosario restaurant owners: commissions “pueden llegar hasta el **25 por ciento** del precio del ticket”; owners recall an early range of 8–10 points and say the average is now **21 to 23**; one owner pays **18%** when the app’s riders are used; after PedidosYa’s 10% introductory month, merchants describe a range of **17% to 25%**, depending on the contract and on whether the shop uses the app’s riders. — [Minuto Santa Fe, 25 Oct 2024](https://minutosantafe.ar/apps-de-delivery-las-promociones-ponen-en-alerta-a-los-comerciantes/)
- Deliveroo 2024, primary accounts: revenue take rate **27.9% of GTV**, gross profit **10.3% of GTV**, cost of sales mainly rider costs and card fees. — [Deliveroo annual report 2024](https://deliveroo.annualreport2024.com/media/52ljc4pz/deliveroo-ar2024-our-performance.pdf)

### Inferences

The marketplace percentage applies to the **meal (or the whole basket)**, not to a parcel tariff. A 20% commission on a food ticket is a different base from $0.10 on a delivery task. Putting the two on the same parcel only as a scale check, and only against confirmed customer prices:

- 20% of Tealca’s US$2.19 envelope is **US$0.44 per shipment**. The 2,000-parcel software bills above are **US$0.08–$0.31**, so about one-fifth to two-thirds of that hypothetical 20% cut, and Onfleet’s $0.31 is the only one close to it.
- 20% of the Valencia retailer’s US$3 motorcycle fee is **US$0.60**. Spoke at $0.083 is about **one-seventh** of that; Onfleet at $0.31 is about **half**.
- 20% of Yango’s US$0.66 starting motorcycle fare is **US$0.13**. At 2,000 parcels, Tookan, Shipday, and Onfleet (**$0.14, $0.11, and $0.31**) sit on top of or above that 20% slice. The fare is a launch minimum, so this line is the most fragile of the three.

A 17–33% restaurant commission, applied by mistake to parcel **software**, would describe a different industry. The software products do not take a percent of freight. They sell a monthly allowance plus an overage in cents. The food apps also employ or dispatch the rider inside that commission; the software vendors do not pay the courier.

No Venezuela-specific Rappi or PedidosYa commission was found. The percentages above are Argentina, 2024, plus Deliveroo’s group accounts for 2024.

### Gaps

- Rappi and PedidosYa do not publish a current Venezuela commission on the pages found.
- The Argentine percentages are restaurant commissions. They are not a parcel marketplace and not a B2B software fee.
- Deliveroo does not operate the Venezuelan parcel market. It is included only because its annual report is a primary source for a marketplace take rate and for the fact that rider cost, not software, is the bulk of cost of sales.

## What monthly volume is plausible for a new city operator in the first six months, versus a mature single-city courier?

### Takeaway

**The evidence for a Valencia, Caracas, or other northern Latin American city parcel operator is missing.** Nothing found in this pass states how many parcels a new urban courier moves in its first six months, or how many a mature single-city courier moves, in Venezuela or the region in 2024–2026. The 500 / 2,000 / 8,000 scenarios used above are the volumes requested for the fee arithmetic. They are not an estimate of Valencia demand.

### Cited Findings

- No 2024–2026 article, company page, or statistical release found here gives monthly parcel counts for MRW, Zoom, Tealca, Liberty, Domesa, Yango Envíos, or an independent motorcycle courier in Valencia or Caracas.
- Older and non-comparable counts that did turn up, so they are not mistaken for a local benchmark:
  - Parsel, a funded hyperlocal startup in India, told YourStory it was doing **600 deliveries a day** when it opened Mumbai in September 2015 and **13,000 a day** by December 2015, about six months after a June 2015 founding, across Delhi NCR and Mumbai, with an average transaction of Rs 100. — [YourStory, January 2016](https://yourstory.com/2016/01/parsel)
  - An Economic Times profile of Mirakle Couriers in Mumbai says the firm, started in 2009, was handling **about 65,000 deliveries a month** with 50 people. The extract does not show a publication date, and the narrative is not a 2024–2026 figure and not a first-six-months figure. — [Economic Times](https://economictimes.indiatimes.com/small-biz/startups/dhruv-lakra-employs-only-hearing-impaired-to-run-rs-25-lakh-firm-mirakle-couriers/articleshow/19877447.cms)
  - Xentra Transport, a same-day courier in New York, said on 14 March 2026 that in its first year it served **more than 500 businesses** with **more than 10 drivers**. It did not state a parcel count. — [EIN Presswire, 14 Mar 2026](https://www.einpresswire.com/article/899302625/xentra-transport-expands-same-day-courier-service-across-nyc-serving-over-500-businesses-in-first-year-of-operations)
  - Delhivery’s **740 million** express parcels in FY24 are a national Indian network, on the order of 60 million parcels a month for the whole company, not one city. — [Delhivery Q4 FY24 transcript](https://www.delhivery.com/uploads/2024/05/EarningsCallTranscript_Q4FY24.pdf)

### Inferences

None that would assign a volume to a new or mature operator in Valencia. Using Parsel’s 13,000 deliveries a day, or Delhivery’s national total, as a stand-in for a Venezuelan city would invent a market. The fee tables already show how the **same software bill changes** between 500, 2,000, and 8,000 parcels: Onfleet stays on a $619 floor through 2,000 (one task per parcel), while Spoke’s printed per-stop cost falls from $0.25 to $0.05. That is a property of the price cards, not a forecast of demand.

### Gaps

- First-six-months volume for a new city parcel operator in Venezuela or northern Latin America: not found.
- Mature single-city courier volume in Valencia, Caracas, or a comparable city in the region, 2024–2026: not found.
- Yango did not publish a shipment count with the October 2025 Caracas launch.
- The Indian and New York items above do not fill those gaps.
