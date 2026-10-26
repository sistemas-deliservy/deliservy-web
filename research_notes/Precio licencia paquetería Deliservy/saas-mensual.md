# Last-mile dispatch SaaS monthly prices (fetched 25 October 2026)

Scope: published USD prices for a dispatcher panel, a driver app, and customer tracking, for one small city parcel operator. Not a restaurant marketplace and not a from-scratch build. Scenarios used below: A = 10 drivers and 500 tasks/month; B = 25 drivers and 2,000 tasks/month; C = 50 drivers and 8,000 tasks/month. “Task”, “stop”, “order”, and “delivery” are each vendor’s own billing unit; they are not converted into each other. No price is recommended for Deliservy.

Pages were fetched on 25 October 2026 unless a source date is stated on the page itself.

## What do these vendors publish for monthly price, unit, and what is included?

### Takeaway

Vendors that print a number in 2026 bill either completed tasks/stops/orders (Onfleet, Tookan, Shipday, Spoke Dispatch, Routific, Onro, Track-POD’s order plans, and an AWS order quota for LogiNext) or drivers/users/vehicles (OptimoRoute, Upper, Track-POD’s driver plans, Cigo). Bringg, Locus, DispatchTrack, Beetrack, and Route4Me do not show a price a buyer can read. FarEye and LogiNext Enterprise are quote products; FarEye and LogiNext also have indicative AWS Marketplace contract prices. Several price pages are internally inconsistent (Tookan, Shipday, Track-POD’s English extract, Upper’s user caps).

### Cited Findings

#### Onfleet — per completed task, unlimited users

- Launch starts at $619/month and includes 2,500 delivery or pickup tasks. Scale starts at $1,349/month and includes 5,000. Enterprise starts at $3,099/month for 10,000+ tasks. Courier Suite starts at $299/month. — [Onfleet pricing](https://onfleet.com/pricing)
- Launch lists unlimited users, a driver app, photo and signature proof of delivery, driver–dispatcher chat, basic route optimization, status and ETA notifications, driver pay, 90-day reporting, API and webhooks, and a “branded tracking experience.” Scale adds barcode and ID scanning, advanced route optimization, dynamic ETAs, auto-dispatch, and 1-year reporting. Enterprise adds multi-brand and multi-region support and “enhanced branding and telephony.” — [Onfleet pricing](https://onfleet.com/pricing)
- A task is one pickup or one delivery at a destination, counted only when it reaches Completed, including via the driver app, the dashboard, or an API call. — [Onfleet pricing](https://onfleet.com/pricing)
- SMS and voice are billed on the 1st of the following month, per SMS segment, and are not inside the plan price. The fetched page says country rates are listed; the numeric rate table did not come through in the extract. — [Onfleet pricing](https://onfleet.com/pricing)
- Courier Suite ($299/month) lists client-facing order entry and tracking portals, rates, address book, invoicing, and labels. It is described as an add-on for couriers and carriers. — [Onfleet pricing](https://onfleet.com/pricing)
- Onfleet states it does not limit the number of drivers or dispatchers and bills completed pickup and delivery tasks. — [Onfleet FAQ](https://onfleet.com/blog/frequently-asked-questions-about-onfleet/)
- A FarEye article dated as verified in August 2026 repeats Launch $619 / 2,500, Scale $1,349 / 5,000, Enterprise $3,099 / 10,000+, Courier Suite $299, and says the overage rate is not on Onfleet’s pricing page. It treats older $599 / $1,299 / $2,999 figures, and a G2 entry near $500, as out of date. — [FarEye on Onfleet pricing](https://fareye.com/resources/blogs/onfleet-pricing)

#### Tookan (Jungleworks) — per task allowance; the live page shows two price sets

- The pricing page, fetched 25 October 2026, renders two cards and two comparison tables. Set A: Startup $99/month for 1,000 tasks, extra tasks $0.12; Growth $249 for 3,000, extra $0.09; Standard $399 for 6,000, extra $0.06. Set B: Startup $129, extra $0.15; Growth $299, extra $0.12; Standard $499, extra $0.09. Same allowances. Enterprise is “50,000+ tasks/month” and “custom pricing,” with additional tasks shown as $0.03 on one card and $0.04 on the other. — [Tookan pricing](https://jungleworks.com/tookan/pricing/)
- Free Forever: 100 tasks/month, 2 agents/drivers, proof of delivery, GPS tracking, auto assignment. Paid cards say unlimited agents/drivers and 24/7 support. Growth includes 1 customer booking form; Standard includes 2. — [Tookan pricing](https://jungleworks.com/tookan/pricing/)
- The comparison table marks route optimisation as “Paid,” customer booking forms as “Paid” on Startup (1 free on Growth, 2 free on Standard), and “Branded Agent App & Dashboard” as “Paid.” No dollar amount is printed for those add-ons. — [Tookan pricing](https://jungleworks.com/tookan/pricing/)
- One-year bundles, labeled “one time cost” and “1 year validity,” with a higher figure also printed: Tookan Pro $5,999 (also shows $11,028) for a white-label platform, agent/driver app and admin dashboard, unlimited drivers, and 40,000 tasks (also shows 20,000), extra tasks “as low as $0.10.” Tookan Premium $9,999 (also shows $16,356) and 80,000 tasks (also shows 50,000), extra “as low as $0.07.” Tookan Enterprise $19,999 (also shows $28,457) and 150,000 tasks (also shows 120,000), extra “as low as $0.05,” plus “Customer Web App” and “Headless Customer Application (Customizable).” — [Tookan pricing](https://jungleworks.com/tookan/pricing/)
- A connected pickup plus delivery counts as one task; each additional connected stop counts as half a task. — [Tookan pricing](https://jungleworks.com/tookan/pricing/)
- Older Jungleworks help text still describes different allowances (Startup 700 tasks at $99/month, Growth 2,000 at $229, Standard 5,000 at $429). That page was not the live price card. — [Tookan billing overview](https://help.jungleworks.com/knowledge-base/billing-overview-for-tookan/)
- The Shopify listing still shows yet another set (from $35/month for 200 tasks, then $99 / 700, $229 / 2,000, $429 / 5,000). Not used below. — [Tookan on Shopify](https://apps.shopify.com/tookan)

#### Shipday — per order after an included allowance; the page mixes several cards

- The clearest comparison table on the pricing page: Professional starts at $49/month, 300 orders included, then $0.10 per extra order, up to 5 dispatch/staff accounts, unlimited drivers. Branded Elite starts at $99/month, 300 included, then $0.20, 15 dispatch/staff accounts. Business AI Lite starts at $199/month, 750 included, then $0.20, unlimited dispatchers. Business AI starts at $399/month, 1,500 included, then $0.25, unlimited users. — [Shipday pricing](https://www.shipday.com/pricing)
- The same page also has a Business AI card that says “unlimited orders per location” at $399/month, and a comparison cell that says Business AI orders are unlimited. Those statements conflict with the 1,500-included / $0.25 row. — [Shipday pricing](https://www.shipday.com/pricing)
- Basic is $0 with a maximum of 300 orders/month, 10 driver accounts, 1 dispatch account, driver app, dispatch/admin app, real-time driver tracking, live ETA tracking for customers, and photo and signature proof of delivery. A “Professional Lite” row is labeled “starts at $29/month”; the extract does not give its included-order count or overage. — [Shipday pricing](https://www.shipday.com/pricing)
- Professional lists route optimization, auto-dispatch, customer order forms, driver–dispatcher chat, driver payment, API and webhooks. It does not list a branded driver app. Branded Elite lists a branded driver app, branded delivery tracking, barcode and ID checks, and removal of a generic presentation (a separate card says no “powered by Shipday” badge on a “Branded Premium” variant whose price on that card was $79; the live comparison table’s branded tier is Branded Elite at $99). — [Shipday pricing](https://www.shipday.com/pricing)
- Enterprise “starts at $3,499/month” for multi-location and multi-brand, with AI agents, SSO-style security language, and a dedicated manager. — [Shipday pricing](https://www.shipday.com/pricing)
- The page says merchant plans are for a business delivering its own goods, and delivery-company plans are for couriers delivering for others, including options to remove Shipday branding. Billing is at the end of the month on actual usage. — [Shipday pricing](https://www.shipday.com/pricing)
- A Shopify listing still shows Professional at $39 with $0.10 after 300, a $99 tier at $0.20 after 300, and a $394 tier at $0.25 after 1,000. The $394 figure does not match the $399 card on the vendor page fetched the same day. — [Shipday on Shopify](https://apps.shopify.com/shipday)

#### Spoke Dispatch (formerly Circuit for Teams) — per stop allowance, unlimited drivers

- Help article “Spoke products & pricing,” written by Ana Lopatina, `dateModified` 31 July 2026. Spoke Dispatch Starter: $125/month, 1,000 base stops, extra stops $0.04. Premium: $200/month, 2,000 stops, extra $0.06. Expert: $1,000/month, 12,000 stops, extra $0.07. Prices are USD and “may differ depending on your region and currency.” — [Spoke products and pricing](https://help.spoke.com/en/articles/1925291-spoke-products-pricing)
- All three plans include unlimited dashboard members, unlimited drivers, a driver app, route optimization, live route tracking, signature proof of delivery, photo proof (5 photos on Starter, 10 on Premium and Expert), barcode scanning, a standard recipient tracking page, and email and SMS notification customization. Premium and Expert add a branded recipient tracking page and a custom SMS sender name. There is no customer-installed app in the feature table. API is included; a dedicated success manager is only for accounts spending more than $50,000 a year. — [Spoke products and pricing](https://help.spoke.com/en/articles/1925291-spoke-products-pricing)
- A stop is used when attempted by a driver, when it is a depot stop, when marked failed or delivered, when accessed via API, exported, or printed. — [Spoke products and pricing](https://help.spoke.com/en/articles/1925291-spoke-products-pricing)
- getcircuit.com/teams pricing was already redirected to Spoke by October 2026. A third-party check dated 12 October 2026 records the same $125 / $200 / $1,000 plan set and says an older Starter $100 / Essential $250 / Standard $500 / Pro $750 set is outdated. — [Front Desk Review, Spoke, checked 2026-10-12](https://frontdeskreview.com/software/route-optimization/circuit-for-teams/)

#### OptimoRoute — per driver

- The pricing page’s default view shows Lite at $35.10 per driver per month billed annually, and Pro at $44.10 per driver per month billed annually. Custom is `sales@optimoroute.com` with no number. — [OptimoRoute pricing](https://optimoroute.com/pricing/)
- The same page’s FAQ says a year paid upfront gets a 10% discount, and gives a worked monthly example: “5 drivers × $49 / driver = $245 per month” on Pro. $49 × 0.9 = $44.10, which matches the annual figure on the card. Applying the same 10% to the displayed Lite annual price gives $35.10 / 0.9 = $39.00 month-to-month. A third party that clicked the monthly tab on 9 September 2026 reports Lite $39 and Pro $49 billed monthly. — [OptimoRoute pricing](https://optimoroute.com/pricing/); [Front Desk Review, checked 2026-09-09 and 2026-10-12](https://frontdeskreview.com/software/route-optimization/optimoroute/)
- Billing is for “the number of drivers for which they are planning within a month,” not for dispatchers and not for monthly order volume. An order cap applies to how many orders can be planned at one time: Lite 700, Pro 1,000, Custom “thousands.” “Daily or monthly order volume are not limited.” No setup fee and no monthly contract. — [OptimoRoute pricing](https://optimoroute.com/pricing/)
- Both Lite and Pro list a mobile driver app, live tracking, live ETA, and API. Pro adds analytics, weekly planning (activate by contacting them), realtime order tracking, proof of delivery, and customer feedback. The page does not list a white-label customer app. — [OptimoRoute pricing](https://optimoroute.com/pricing/)

#### Upper — per user, plus a per-driver tracking add-on

- Pricing page: Starter $50 per user/month, or $40 with “20% off” annual billing. Professional $60, or $48 annual. The next card (Optimize, from the feature list) is $89 per user/month, or $71 annual. Enterprise is custom. $89 × 0.8 = $71.20; the page prints $71. — [Upper pricing](https://www.upperinc.com/pricing/)
- Support doc, same four plans: Starter $50 monthly / $40 annual, Professional $60 / $48, Optimize $89 / $71, Enterprise custom. Driver-profile caps: Starter 10, Professional 15, Optimize 30, Enterprise unlimited. Stops per route: 250 / 500 / 1,500 / 1,500+. Monthly routes: unlimited on every plan. — [Upper plans and pricing](https://support.upperinc.com/docs/billing/plans-and-pricing)
- The pricing-page FAQ says that after the 7-day trial every Starter user is $50/month and every Professional user is $60/month, “with no set limit on the number of users.” That sentence conflicts with the support doc’s driver-profile caps. — [Upper pricing](https://www.upperinc.com/pricing/)
- Professional includes the driver app, proof of delivery, live tracking for admins, and customer email notifications. Customer live tracking (a link so the recipient watches the driver) is described on the support doc as an Optimize and Enterprise feature. The pricing page also sells “Live Tracking for Customers” at $20 per driver, “Customer Notifications” SMS “starting at $0.01 per text,” capacity optimization at $25 per driver, and barcode scanning at $50 per company. In-app navigation is listed with no price. — [Upper pricing](https://www.upperinc.com/pricing/); [Upper plans and pricing](https://support.upperinc.com/docs/billing/plans-and-pricing)
- The FAQ’s difference between Starter and Professional does not say customer live map tracking is inside Professional. It does say customer email notifications are. — [Upper pricing](https://www.upperinc.com/pricing/)

#### Route4Me — no readable public price

- The billing article explains per-user packages, add-ons, monthly and annual payment plans, and a 7-day trial. It prints no dollar amount. — [Route4Me billing model](https://support.route4me.com/billing-model/)
- A third-party check dated 30 September 2026 says route4me.com/pricing redirects to /get-started and the visible page has no dollar figure. It also says JSON-LD on that page contains offers of $199, $299, and $349 with `priceValidUntil` in October 2026, and that those figures are not shown to a buyer. It treats the older “$40 / $60 / $90 per user, five-user minimum” quotes as no longer on the vendor site. Those older figures are not used in the scenarios. — [Fleet Ops Club on Route4Me, 30 September 2026](https://fleetopsclub.com/software/route4me/pricing)

#### Track-POD — per driver, or per monthly order package

- English pricing page, fetched 25 October 2026. Advanced: $49 per driver/vehicle per month billed annually, or $59 month-to-month, minimum 3 drivers, 6,000 orders/month, 7 dashboard web users. Advanced Plus: $69 annually or $79 month-to-month, minimum 3, orders “UNLIMITED,” 50 web users. Ultimate: $89 per driver/vehicle per month billed annually, minimum 3, orders unlimited, 100 web users. The English extract did not keep a month-to-month price on Ultimate. — [Track-POD pricing](https://www.track-pod.com/pricing-delivery-app/)
- The Portuguese pricing page prints Ultimate as $89 billed annually or $99 month-to-month, still in dollars, not reais. — [Track-POD preços](https://www.track-pod.com/pt/precos/)
- The German page prints the driver plans as €49 / €59, €69 / €79, and €89 / €99. Same numerals, euro currency. Not converted. — [Track-POD Preise](https://www.track-pod.com/de/preise/)
- English order-based cards whose headings survived: Scale is “$1,170 a month per 9,000 orders” and “$0.13 per order/task,” unlimited vehicles and drivers, 100 web users. Enterprise is “Let’s talk,” “a month per 12,000+ orders,” unlimited drivers. Two earlier order cards in the same extract have no surviving heading: $510 with 3,000 orders/month and unlimited drivers, and $900 with 6,000 orders/month and unlimited drivers. $510 / 3,000 = $0.17 and $900 / 6,000 = $0.15 and $1,170 / 9,000 = $0.13, so the per-order line matches the package price divided by the included orders. It is not written as an overage on top of the package. — [Track-POD pricing](https://www.track-pod.com/pricing-delivery-app/)
- The Portuguese page names those order packages and adds two the English extract did not show: S Plan $285 for 1,500 orders; M Plan $510 per month per 3,000 orders at $0.17 per order; L Plan $900 per 6,000 at $0.15; XL Plan $1,440 per 12,000 at $0.12. — [Track-POD preços](https://www.track-pod.com/pt/precos/)
- The English cards list an iPhone and Android delivery app, signature and photo proof of delivery, “live tracking for your customer,” a live tracking page, “branded URL for live tracking page,” and email notifications with a live tracking link. SMS is a separate line, “All above notifications by SMS*,” so it is not treated here as included. The page layout is two columns, “Included feature” and “Additional cost”; the text extract flattened the columns, so which rows are add-ons is not fully recoverable. — [Track-POD pricing](https://www.track-pod.com/pricing-delivery-app/)
- A Track-POD help article says the order-based subscription is monthly only, unused tickets do not roll over, and “the cost per ticket ranges from $0.10 to $0.19 USD/EUR, depending on the package.” That range does not match Scale’s printed $0.13 or the Portuguese XL $0.12, so the help article and the price cards are not identical. — [Track-POD subscription help](https://track-pod.freshdesk.com/support/solutions/articles/103000049802-how-to-pay-for-track-pod-types-of-subscription-)
- An older Track-POD blog mentions getting started “for just $35/month” on a Standard per-driver plan. That $35 figure is not on the pricing page fetched on 25 October 2026, so it is not used. — [Track-POD licensing FAQ](https://www.track-pod.com/blog/licensing-model-faq/)

#### Routific — flat fee, then marginal cents per scheduled order; unlimited drivers

- Help article: up to 100 orders/month free; 101 to 1,000 orders $150/month; then “Add 15c per order” for 1,001–2,000; 13c for 2,001–3,000; 10c for 3,001–5,000; 8c for 5,001–10,000; 5c for 10,001–20,000; 3c for 20,001–50,000; above 50,000, talk to them. The article also says Routific “charges a flat monthly fee with additional per-order usage charges.” There is no worked numerical example, so the scenario math below treats each cent rate as applying only inside its band, on top of the $150. — [Routific help: how much does it cost](https://help.routific.com/en/articles/29-how-much-does-routific-cost)
- Included on every plan, including free: unlimited drivers, unlimited dispatchers, multiple depots, route optimization, free driver mobile app, real-time GPS, customer notifications by email, a customizable delivery tracker, and proof of delivery. SMS is an add-on; the pricing page says to ask for a quote because SMS rates vary by country. — [Routific help](https://help.routific.com/en/articles/29-how-much-does-routific-cost); [Routific pricing](https://www.routific.com/pricing)
- An order is counted once, when it is scheduled onto a route. Re-optimization and carrying an order to the next day are not charged again. Unscheduled uploads are not counted. Older Routific pricing was per driver; the change was in mid-2024. All plans are USD. — [Routific help](https://help.routific.com/en/articles/29-how-much-does-routific-cost)
- A separate Routific API price list is not the dispatcher product: Pro tiers of $150 / $275 / $600 / $1,500 per month for 1,000 / 2,000 / 5,000 / 15,000 visits, overage 15 cents per visit. Not used for the panel scenarios. — [Routific API pricing](https://dev.routific.com/pricing)

#### Onro — flat monthly fee for an included delivery count; white-label apps are custom

- Business is $239/month with 1,500 deliveries included. Lists driver app, dispatcher panel, admin dashboard, customer API, white-label tracking page, and “all essential features.” Unlimited users and drivers: “we just consider the number of deliveries.” No setup fee on Business. — [Onro pricing](https://onro.io/pricing/)
- Enterprise is “custom pricing.” It adds white-label customer portal, white-label customer apps, white-label driver apps, custom domains, removal of Onro branding, and publishing services. Publishing “has cost” (two Android apps and two iOS apps). Enterprise has “a minimal setup fee,” waived above 15,000 orders/month. No dollar amount for the fee or the monthly price. — [Onro pricing](https://onro.io/pricing/)
- The pricing page does not print an overage rate. A delivery is “a defined task assigned to a driver.” Above 500 delivery tasks per day, Onro says there are volume discounts via sales. — [Onro pricing](https://onro.io/pricing/)
- Onro’s own comparison article states a rate the price card does not: Business is $239/month with 1,500 deliveries and “$0.19 for each additional one,” and white-labeling the Business-tier portal and tracking page is “a one-time setup fee” with no amount. — [Onro, pickup and delivery software comparison](https://onro.io/best-pickup-and-delivery-software/)
- A third party that read onro.io/pricing on 16 October 2026 recorded Business at $239 and 1,500 deliveries and explicitly said no overage rate was on that page. A SocialAtoZ page also lists a Starter at $129 for 750 deliveries and $0.17 overage; that Starter is not on the pricing page fetched 25 October 2026 and is not used. — [Front Desk Review, Onro, 2026-10-16](https://frontdeskreview.com/software/route-optimization/onro/)

#### SimpliRoute — a floor, not a per-vehicle formula

- On a SimpliRoute page, Pro is “para empresas con flotas desde 6 vehículos,” “empezando desde U$240 /mes,” and the same block also prints “UF 7,2.” Pro includes “todo lo que incluye Lite,” a customer-success agent, WhatsApp and SMS notifications (asterisk), fleet management, zones, SAP B1, and API. Corporate is “personalizado” for fleets from 150 vehicles. Lite’s own price is not on that page. — [SimpliRoute, Pro desde U$240](https://simpliroute.com/es/novedades/mejora-tu-inteligencia-logistica-con-simpliroute)
- The same site describes online tracking for the end customer via a delivery code or a personal link, photo and signature proof, and a driver-facing flow. — [SimpliRoute](https://simpliroute.com/es/novedades/mejora-tu-inteligencia-logistica-con-simpliroute)
- Terms say subscriptions are monthly or annual “at the price listed on the website” and that prices posted inside SimpliRoute are in United States denominations unless designated otherwise. They do not print the price list. — [SimpliRoute terms](https://simpliroute.com/en/terms-and-conditions)
- UF 7.2 is left in UF. It is not converted to dollars. U$240 is the only USD figure used.
- G2’s comparison page lists “no pricing available” for SimpliRoute. A SpotSaaS page (18 May 2026) says “starts from $32/month when billed yearly” and attributes that to SimpliRoute’s site, but it does not show a per-vehicle formula that matches the vendor page’s “desde U$240.” The $32 figure is not used. — [G2 Beetrack vs SimpliRoute](https://www.g2.com/compare/beetrack-vs-simpliroute); [SpotSaaS, 18 May 2026](https://www.spotsaas.com/product/simpliroute/pricing)

#### LogiNext — website figures without a surviving unit; AWS has an order quota

- loginextsolutions.com/pricing shows Growth as “$0.15” and “$0.13” with “billed quarterly/annually.” The text extract does not contain the words “per order” or “per driver” next to those figures. Enterprise is custom. A 14-day trial is free. An FAQ asks for minimum and maximum resources and then says “indicative figures; actual values may vary,” without the numbers surviving in the extract. — [LogiNext pricing](https://www.loginextsolutions.com/pricing)
- AWS Marketplace, sold by the vendor: “Loginext Mile Plan Order Based Pricing,” $3,900 for 12 months, “an order quota of 30,000 orders over a 12 month duration.” The listing text says one order is one delivery or pickup task, and that route planning, scheduling, live tracking, and proof of delivery are inside that quota. It also says the pricing table does not define an automatic overage past 30,000 orders. $3,900 / 30,000 = $0.13 per order, which matches the $0.13 printed on the website. — [LogiNext Mile on AWS Marketplace](https://aws.amazon.com/marketplace/pp/prodview-7sjmz66uuxxe6)
- G2 lists “no pricing available” as LogiNext’s entry-level price. — [G2 Bringg vs LogiNext](https://www.g2.com/compare/bringg-vs-loginext-mile)
- Competitor blogs that quote $50 or $60 per driver, or $0.10 per order, are not the vendor page and conflict with each other. They are not used.

#### FarEye, Bringg, Locus — no SMB price card

- FarEye’s own comparison says neither FarEye nor Bringg publishes a standard enterprise rate card. Bringg is “subscription-based enterprise pricing, rates available on request.” — [FarEye vs Bringg](https://fareye.com/resources/blogs/fareye-vs-bringg)
- AWS Marketplace, sold by FarEye, lists an indicative annual platform fee of $50,000 per 12 months, plus $0.50 per additional transaction. The same listing says the amount “is indicative and will depend on your Scope of Work,” and it contradicts itself on whether 25,000 annual transactions are included: the overview says the fee includes 25,000 annual transactions, and the dimension description says the platform fee does not include any transaction. — [FarEye on AWS Marketplace](https://aws.amazon.com/marketplace/pp/prodview-2tkmicdjpwfgq)
- Locus is described by FarEye as custom pricing, demo only, with no public entry price. No Locus price page with a number was found. — [FarEye on LogiNext alternatives](https://fareye.com/ph/en/resources/blogs/loginext-mile-alternatives)

#### DispatchTrack and Beetrack — no public price

- G2 lists “no pricing available” for Beetrack. — [G2 Beetrack vs SimpliRoute](https://www.g2.com/compare/beetrack-vs-simpliroute)
- A FarEye article says DispatchTrack’s two editions are $75/month per “service unit” according to TrustRadius, and that a service unit “maps to a vehicle license or route deployment slot.” That is not DispatchTrack’s own page and not an invoice. It is not used as a published price. FarEye’s later alternatives article also calls DispatchTrack “not public” and “custom, quoted annually.” The two FarEye articles disagree. — [FarEye DispatchTrack pricing guide](https://fareye.com/resources/blogs/dispatchtrack-pricing-guide); [FarEye alternatives table](https://fareye.com/ph/en/resources/blogs/loginext-mile-alternatives)
- ITQlick’s “$10 to $100 per user” for Beetrack is an estimate range, not a vendor card. Not used.

#### Other panels with a number

- Cigo Tracker’s Canada page: “Pricing starts at $150 per vehicle per month, with discounts for fleets over 20 vehicles.” No setup fee, cancel anytime, 14-day trial. The discount amount is not printed. This is a regional marketing answer, not a full plan table. — [Cigo Tracker, Canada](https://cigotracker.com/cigo-world/canada/)
- Locate2u’s US pricing page: Platform “from $770/month USD,” “one platform fee,” “not a per-user charge,” team allocation included, “scales with the functionality you need.” Included: route optimization, live dispatch, GPS, proof of delivery, “branded customer tracking & notifications,” and “web & mobile driver apps.” White label (own DNS, branded tracking links, and a white-label driver app) is an optional module “priced separately,” with no number. The page says the USD figure is converted from an AUD list price and reviewed monthly. Enterprise is scoped, no number. — [Locate2u pricing](https://www.locate2u.com/us/pricing/)
- GetApp’s eLogii page, last updated October 2026, says “starting from US$3,000.00” and points at elogii.com/pricing. The retrieved text does not say whether that figure is per month, per year, or a setup. No vendor price card was retrieved. Not used in the scenarios. — [GetApp eLogii, October 2026](https://www.getapp.com/transportation-logistics-software/a/elogii/)

### Inferences

- For a parcel operator, the products that match “panel + driver app + customer tracking link” with a computable monthly bill are Onfleet, Shipday, Spoke, Routific, OptimoRoute Pro, Track-POD, Onro Business, and Upper once the $20 tracking add-on or the Optimize plan is counted. Tookan’s monthly cards are a task allowance plus unlimited agents; branded driver app and route optimisation are marked paid with no price, so the monthly card is a floor, not a confirmed all-in.
- “Starting at” on Onfleet, Shipday, Locate2u, and SimpliRoute means the printed number is a floor. Scenario math uses that floor only when the included allowance covers the scenario.
- Task-priced and driver-priced products will not rank in the same order at 10 drivers as at 50 drivers. That is a property of the published units, not a judgment about which product is better.

### Gaps

- Tookan’s page does not say which of the two price sets is monthly, which is annual, or whether both are experiments in the same HTML. The ratios are not a consistent 10% or 20% discount ($99/$129, $249/$299, $399/$499).
- Onfleet’s per-task overage and the actual SMS segment prices were not in the extract.
- Shipday’s Business AI “unlimited” card and the 1,500-order / $0.25 row cannot both be the current rule. Professional Lite’s allowance was not in the extract.
- Upper’s “no set limit” FAQ and the 10/15/30 driver-profile caps conflict.
- Track-POD’s included-versus-add-on columns did not survive the extract. The English page’s $510 and $900 cards lost their plan names.
- LogiNext’s website does not, in the extract, say what $0.15 and $0.13 buy. Minimum resource counts did not survive.
- No current CodeCanyon or “uber clone” script price was retrieved, so there is no sourced low-quality floor.
- DispatchTrack, Beetrack, Bringg, Locus, Route4Me, Onro Enterprise, and eLogii have no vendor number clean enough to calculate.

## What do those price lists imply per month for 10/500, 25/2,000, and 50/8,000?

### Takeaway

Where the unit price and the allowance are both published, a 10-driver / 500-task month falls about $99–$619, a 25-driver / 2,000-task month about $165–$2,225, and a 50-driver / 8,000-task month about $405–$3,950, depending on whether the vendor bills tasks or drivers. Several vendors cannot be computed for the largest scenario because the matching tier is “contact sales” or the overage is unpublished. Arithmetic uses the cheapest published combination that covers the volume, and a second line when a branded-tracking tier costs more. Drivers are the billed seats on per-driver products; 1–3 dispatchers are extra only where the vendor bills every user.

### Cited Findings

Assumptions used in every line: one vendor task/stop/order equals one parcel in the scenario; month-to-month prices, not the annual discount, unless noted; no SMS; no setup fee. If a cheaper plan plus a published overage beats the next tier, the cheaper result is shown and the tier price is shown next to it.

#### Onfleet (unlimited drivers; branded tracking is inside Launch)

Source: [Onfleet pricing](https://onfleet.com/pricing).

- A, 500 tasks: inside Launch’s 2,500, so $619.
- B, 2,000 tasks: still inside 2,500, so $619.
- C, 8,000 tasks: Scale includes 5,000 at $1,349. Enterprise starts at $3,099 for 10,000+. No overage rate is published, so there is no arithmetic for exactly 8,000. Adding Courier Suite is +$299 on any of these: $918, $918, and not computable.

#### Tookan monthly cards (unlimited agents on paid plans; branded app not in the base)

Source: [Tookan pricing](https://jungleworks.com/tookan/pricing/). Two sets, because the page prints both.

Set A ($99 / $0.12, $249 / $0.09, $399 / $0.06):

- A: 500 is inside 1,000, so Startup $99.
- B: Startup $99 + (2,000 − 1,000) × $0.12 = $99 + $120 = $219. Growth’s $249 for 3,000 included is higher, so $219 is the lower published result.
- C: Standard $399 + (8,000 − 6,000) × $0.06 = $399 + $120 = $519. Growth would be $249 + (8,000 − 3,000) × $0.09 = $249 + $450 = $699. Startup would be $99 + (8,000 − 1,000) × $0.12 = $99 + $840 = $939.

Set B ($129 / $0.15, $299 / $0.12, $499 / $0.09):

- A: Startup $129.
- B: Startup $129 + 1,000 × $0.15 = $129 + $150 = $279. Growth at $299 is higher.
- C: Standard $499 + 2,000 × $0.09 = $499 + $180 = $679. Growth would be $299 + 5,000 × $0.12 = $299 + $600 = $899.

These totals do not include the unpublished “Paid” route-optimisation or branded-app add-ons.

#### Shipday (unlimited drivers on Professional and above)

Source: the comparison table on [Shipday pricing](https://www.shipday.com/pricing) with included orders and overage. Professional is the unbranded tracking tier. Branded Elite is the branded driver app and branded tracking link.

Professional, $49 + $0.10 after 300:

- A: $49 + (500 − 300) × $0.10 = $49 + $20 = $69.
- B: $49 + (2,000 − 300) × $0.10 = $49 + $170 = $219.
- C: $49 + (8,000 − 300) × $0.10 = $49 + $770 = $819.

Branded Elite, $99 + $0.20 after 300:

- A: $99 + 200 × $0.20 = $99 + $40 = $139.
- B: $99 + 1,700 × $0.20 = $99 + $340 = $439.
- C: $99 + 7,700 × $0.20 = $99 + $1,540 = $1,639.

Business AI Lite, $199 + $0.20 after 750, only if that row is the one that applies:

- A: 500 is inside 750, so $199.
- B: $199 + (2,000 − 750) × $0.20 = $199 + $250 = $449.
- C: $199 + (8,000 − 750) × $0.20 = $199 + $1,450 = $1,649.

Business AI, $399 + $0.25 after 1,500, if the overage row applies:

- A: $399.
- B: $399 + (2,000 − 1,500) × $0.25 = $399 + $125 = $524.
- C: $399 + (8,000 − 1,500) × $0.25 = $399 + $1,625 = $2,024.

If the other card (“unlimited orders per location” at $399) is the one that applies, A, B, and C are all $399 and the three lines above are wrong. Basic free does not cover 500 orders (cap 300) and does not cover 25 or 50 drivers (cap 10 drivers).

#### Spoke Dispatch (unlimited drivers)

Source: [Spoke help, 31 July 2026](https://help.spoke.com/en/articles/1925291-spoke-products-pricing). Starter includes a standard tracking page. Premium is the first plan with a branded tracking page.

Starter, $125 for 1,000, then $0.04:

- A: 500 ≤ 1,000, so $125.
- B: $125 + (2,000 − 1,000) × $0.04 = $125 + $40 = $165.
- C: $125 + (8,000 − 1,000) × $0.04 = $125 + $280 = $405.

Premium, $200 for 2,000, then $0.06:

- A: $200.
- B: 2,000 is exactly the allowance, so $200.
- C: $200 + (8,000 − 2,000) × $0.06 = $200 + $360 = $560.

Expert, $1,000 for 12,000, covers A, B, and C at $1,000 with no overage. For C, Premium at $560 is lower than Expert if the operator does not need Expert-only items (5-year history, the unpublished geofence feature).

#### OptimoRoute Pro (the plan that lists proof of delivery and realtime order tracking)

Source: monthly $49 from the FAQ example on [OptimoRoute pricing](https://optimoroute.com/pricing/). Dispatchers are not a billed seat. Annual equivalent is $44.10, shown second.

- A: 10 × $49 = $490. Annual: 10 × $44.10 = $441.
- B: 25 × $49 = $1,225. Annual: 25 × $44.10 = $1,102.50.
- C: 50 × $49 = $2,450. Annual: 50 × $44.10 = $2,205.

Pro can plan 1,000 orders at once. The page says monthly volume is not limited. Scenario C is 8,000 in a month; if that is planned as more than 1,000 orders in one optimization, the page points to Custom, which has no price. Lite at the inferred $39 month-to-month would be 10 × $39 = $390, 25 × $39 = $975, and 50 × $39 = $1,950, but Lite’s card does not list proof of delivery, realtime order tracking, or customer feedback.

#### Upper

Source: [Upper pricing](https://www.upperinc.com/pricing/) and [support caps](https://support.upperinc.com/docs/billing/plans-and-pricing). Counts below are driver seats only. Each dispatcher who is also a “user” adds one more seat at the same rate. The $20 customer-live-tracking add-on is shown separately because the support doc also says that feature sits on Optimize.

Professional at $60, if the driver-profile cap of 15 is enforced:

- A: 10 × $60 = $600, plus 10 × $20 = $200 if the tracking add-on is required, total $800. Inside the 15-driver cap.
- B and C: 25 and 50 exceed the published cap of 15. No public Professional price for those headcounts if the cap holds. The FAQ’s “no set limit” would instead give 25 × $60 = $1,500 and 50 × $60 = $3,000, before the tracking add-on.

Optimize at $89, cap 30 drivers on the support doc:

- A: 10 × $89 = $890.
- B: 25 × $89 = $2,225.
- C: 50 exceeds 30. Enterprise has no public price. If the FAQ’s unlimited-users sentence were applied to Optimize anyway, 50 × $89 = $4,450, and that ignores the cap.

Annual Optimize is $71 per user: 10 × $71 = $710; 25 × $71 = $1,775.

#### Track-POD

Source: [English pricing](https://www.track-pod.com/pricing-delivery-app/) and, for the $285 and $99 figures, [Portuguese pricing](https://www.track-pod.com/pt/precos/).

Per driver, month-to-month, Advanced $59 until the 6,000-order cap, then Advanced Plus $79:

- A: 10 × $59 = $590 (500 orders is under 6,000).
- B: 25 × $59 = $1,475 (2,000 is under 6,000).
- C: 8,000 exceeds Advanced’s 6,000 orders, so Advanced Plus 50 × $79 = $3,950. Annual Advanced Plus would be 50 × $69 = $3,450.

Order packages, unlimited drivers. Next package that contains the volume:

- A: Portuguese S Plan $285 covers 1,500. The cheapest package confirmed on the English extract is $510 for 3,000, which also covers 500.
- B: $510 for 3,000 orders covers 2,000. ($510 / 3,000 = $0.17, matching the Portuguese per-order line; that rate is not added on top.)
- C: $900 covers only 6,000. Scale $1,170 covers 9,000. Enterprise at 12,000+ has no number. So the published cover for 8,000 is $1,170.

#### Routific

Source: [Routific help](https://help.routific.com/en/articles/29-how-much-does-routific-cost). Marginal reading of “add X per order.”

- A: 500 is inside 101–1,000, so $150.
- B: $150 + (2,000 − 1,000) × $0.15 = $150 + $150 = $300.
- C: $150 + 1,000 × $0.15 + 1,000 × $0.13 + 2,000 × $0.10 + 3,000 × $0.08 = $150 + $150 + $130 + $200 + $240 = $870.

The 1,000 orders in the 1,001–2,000 band, the 1,000 in 2,001–3,000, the 2,000 in 3,001–5,000, and the 3,000 in 5,001–8,000 are the slices. Unlimited drivers, so driver count does not change the bill. If the vendor instead charges the band rate on every order in the month and drops the $150, the page does not say that, and those alternatives are not shown.

#### Onro Business

Source: $239 and 1,500 included deliveries on [Onro pricing](https://onro.io/pricing/). The $0.19 rate is only on [Onro’s comparison article](https://onro.io/best-pickup-and-delivery-software/), not on the price card. Unlimited drivers.

- A: 500 ≤ 1,500, so $239. The $0.19 rate is not needed.
- B: 2,000 − 1,500 = 500 extra. If $0.19 applies, $239 + 500 × $0.19 = $239 + $95 = $334. If it does not, the bill is unpublished above $239.
- C: 8,000 − 1,500 = 6,500 extra. If $0.19 applies, $239 + 6,500 × $0.19 = $239 + $1,235 = $1,474. 8,000 in a 30-day month is about 267 tasks a day, under the “500 tasks a day” line where Onro says a volume discount exists, so that discount is not applied. Enterprise white-label apps have no monthly number.

#### SimpliRoute, Locate2u, Cigo, LogiNext AWS, FarEye AWS

- SimpliRoute Pro “desde U$240/mes” for fleets from 6 vehicles, with no per-vehicle multiplier on the page. A, B, and C are all fleets of 6 to 149 vehicles, so they sit on Pro, and the only published figure is a floor of $240. Corporate, from 150 vehicles, is custom. — [SimpliRoute](https://simpliroute.com/es/novedades/mejora-tu-inteligencia-logistica-con-simpliroute)
- Locate2u Platform is “from $770/month,” not per driver and not per task, and “scales” without a published formula. A, B, and C are each at least $770. The white-label module has no number. — [Locate2u pricing](https://www.locate2u.com/us/pricing/)
- Cigo at the printed $150 per vehicle, before the unpublished discount for fleets over 20: A is 10 × $150 = $1,500. B is 25 × $150 = $3,750 before that discount. C is 50 × $150 = $7,500 before that discount. — [Cigo Tracker, Canada](https://cigotracker.com/cigo-world/canada/)
- LogiNext’s AWS SKU is $3,900 per 12 months for 30,000 orders, not a monthly slider. Spread evenly that is $3,900 / 12 = $325 per month and $0.13 per order. Scenario A is 500 × 12 = 6,000 orders a year and scenario B is 24,000 a year, both inside one $3,900 contract if the buyer must take that SKU, so the monthly equivalent is $325 while most of the quota is unused. Scenario C is 8,000 × 12 = 96,000 orders a year, which is more than three times the 30,000 quota, and no overage is published, so C is not computable from that SKU. The website’s $0.15 and $0.13 are not multiplied here because the unit label did not survive the fetch. — [LogiNext on AWS](https://aws.amazon.com/marketplace/pp/prodview-7sjmz66uuxxe6)
- FarEye’s indicative AWS platform fee is $50,000 per 12 months, about $4,167 per month before the disputed transaction allowance, plus $0.50 per additional transaction if that meter applies. That is an enterprise marketplace list price marked as depending on a statement of work. It is not used as the small-operator bill. — [FarEye on AWS](https://aws.amazon.com/marketplace/pp/prodview-2tkmicdjpwfgq)

#### Not computed

Route4Me, Bringg, Locus, DispatchTrack, Beetrack, Onro Enterprise, Track-POD Enterprise, Upper Enterprise, SimpliRoute Corporate, LogiNext Enterprise, and eLogii: no public price, or no unit attached to the only figure found.

### Inferences

- At the launch-sized scenario (10 drivers, 500 tasks), task-priced products with a tracking link cluster from $99 (Tookan set A, base only) and $125 (Spoke) through $150 (Routific), $239 (Onro), and $285 (Track-POD S, Portuguese page) up to Onfleet’s $619, which is buying a 2,500-task bundle for 500 tasks. Per-driver products at 10 drivers are about $490 (OptimoRoute Pro) to $890 (Upper Optimize), or $1,500 at Cigo’s printed per-vehicle rate.
- At 25 drivers and 2,000 tasks, task-priced bills that can be computed stay under about $650 (Spoke Premium $200, Tookan $219–$279, Routific $300, Onro $334 if $0.19 is real, Shipday branded $439, Track-POD order plan $510, Onfleet $619). Per-driver bills jump: OptimoRoute $1,225, Track-POD per driver $1,475, Upper Optimize $2,225, Cigo’s undiscounted list $3,750.
- At 50 drivers and 8,000 tasks, the task-priced computable bills are Spoke $405–$560, Tookan $519–$679, Routific $870, Onro $1,474 if $0.19 is real, Shipday branded $1,639, Track-POD Scale $1,170. Onfleet has no published 8,000-task price. Per-driver OptimoRoute is $2,450 and Track-POD Advanced Plus is $3,950. Upper’s published caps run out before 50 drivers.

### Gaps

- Routific’s help text never multiplies a sample month, so the marginal reading could be wrong if “add 15c per order” means something other than the orders inside that band.
- Onro B and C depend on a rate that is on a comparison article and absent from the price card.
- Tookan totals exclude unpaid-for add-ons whose prices are missing.
- Shipday Business AI cannot be pinned to one formula.
- SimpliRoute and Locate2u can only contribute a floor.
- No vendor states that a “task” equals one parcel rather than a pickup plus a delivery. Tookan and Onfleet both define a single-stop task as one billable unit; a parcel with a separate pickup stop and delivery stop can count as more than one on those two products (Onfleet: each is a task; Tookan: the pair is one task and a further stop is half). The scenarios treat one parcel as one billed unit and would be low if the operator’s workflow creates two Onfleet tasks per parcel.

## Which vendors include a customer-facing branded or white-label app, versus only a driver app and a tracking link?

### Takeaway

Almost every published SMB plan is a driver app plus a tracking link or tracking page. A customer-installed app, white-labeled and published under the operator’s name, is a separate higher tier and usually has no monthly number: Onro Enterprise (custom), Tookan’s one-year bundles ($5,999 to $19,999 prepaid, and only the top bundle names a customer web app), and Locate2u’s white-label module (unpriced). Shipday’s branded tier brands the driver app and the tracking link. It does not describe a customer app in the stores.

### Cited Findings

- Onfleet Launch includes a “branded tracking experience,” which is a tracking experience, and the driver app. Courier Suite at $299/month adds “client-facing order entry and tracking portals” for a courier’s clients. The pricing page does not offer a white-label customer app in the App Store or Play Store. — [Onfleet pricing](https://onfleet.com/pricing)
- Shipday Branded Elite, from $99/month plus $0.20 per order after 300, includes “branded driver app” and “branded delivery tracking.” Professional at $49 does not list the branded driver app. Neither card describes a customer-installed app. — [Shipday pricing](https://www.shipday.com/pricing)
- Spoke Starter includes a “standard recipient tracking page.” Premium ($200) and Expert add a “branded recipient tracking page.” The driver app is on every plan. No customer app is listed. — [Spoke products and pricing](https://help.spoke.com/en/articles/1925291-spoke-products-pricing)
- Routific includes a “customizable delivery tracker” and email notifications on the free and paid plans. SMS is quoted separately. The driver app is free. No customer app is listed. — [Routific help](https://help.routific.com/en/articles/29-how-much-does-routific-cost)
- OptimoRoute Pro lists realtime order tracking, proof of delivery, and customer feedback, plus the driver app. No white-label customer app is listed. Lite does not list those customer-tracking items. — [OptimoRoute pricing](https://optimoroute.com/pricing/)
- Upper’s driver app is on the paid plans. Customer live tracking is a $20 per driver add-on on the pricing page and is also described as part of Optimize and Enterprise. That is a link, not a customer app. — [Upper pricing](https://www.upperinc.com/pricing/); [Upper support](https://support.upperinc.com/docs/billing/plans-and-pricing)
- Track-POD lists a delivery app for the driver and a live tracking page, including “branded URL for live tracking page” and “live tracking for your customer,” on the driver plans and the order plans. No customer-installed app is named in the extract. — [Track-POD pricing](https://www.track-pod.com/pricing-delivery-app/)
- Onro Business ($239, 1,500 deliveries) includes the driver app and a “white-label tracking page.” White-label customer apps and white-label driver apps are Enterprise, custom, plus a publishing cost and a setup fee with no amounts. Onro’s comparison article says branding the Business portal and tracking page (domain and logo) is a one-time setup fee, still with no amount. — [Onro pricing](https://onro.io/pricing/); [Onro comparison](https://onro.io/best-pickup-and-delivery-software/)
- Tookan monthly comparison table: “Branded Agent App & Dashboard” is “Paid,” price not shown. The one-year Pro bundle at $5,999 (1 year, 40,000 tasks, also printed as $11,028 and 20,000 tasks) includes “white-label platform” and “agent/driver app & admin dashboard.” The $19,999 Enterprise bundle (1 year, 150,000 tasks) adds “Customer Web App” and “Headless Customer Application (Customizable).” Dividing the prepaid fee by 12 is not a published monthly price; it is $5,999 / 12 = $499.92, $9,999 / 12 = $833.25, and $19,999 / 12 = $1,666.58 of prepaid fee per month of the stated one-year validity. Annual parcel counts of 500 × 12 = 6,000 and 2,000 × 12 = 24,000 fit inside the 40,000-task Pro bundle as printed. 8,000 × 12 = 96,000 does not fit Pro (40,000) or Premium (80,000); it fits the 150,000-task Enterprise bundle. — [Tookan pricing](https://jungleworks.com/tookan/pricing/)
- Locate2u Platform, from $770/month, includes branded customer tracking and driver apps. “White label” (own DNS, branded tracking links, and a white-label driver app) is a separate module with no price. The page does not say the white-label module includes a customer-installed app. — [Locate2u pricing](https://www.locate2u.com/us/pricing/)
- LogiNext’s AWS listing includes live tracking and proof of delivery inside the order quota. It does not mention a white-label customer app. — [LogiNext on AWS](https://aws.amazon.com/marketplace/pp/prodview-7sjmz66uuxxe6)

### Inferences

- “Branded” on these price pages usually means the operator’s logo on a tracking link, and sometimes on the driver app. That is a different product from giving the operator a customer app in the stores.
- The only sourced prices that explicitly buy a customer-facing app or customer web app are Tookan’s $19,999 one-year Enterprise bundle and Onro’s unpriced Enterprise plan. Shipday, Spoke Premium, Onfleet, and Onro Business buy branding of a page or of the driver app, at the prices already calculated.
- Pricing a white-label customer app “higher” than panel-plus-tracking is what the vendors do: Onro puts the apps on a custom tier above $239, and Tookan puts the customer web app on the $19,999 bundle rather than on the $99–$499 monthly cards.

### Gaps

- Tookan does not price the monthly “branded agent app” add-on, so the gap between the $99-class plan and a branded driver app is unknown.
- Onro’s publishing cost and setup fee have no numbers.
- Locate2u’s white-label module has no number.
- It is unconfirmed whether any of these driver apps can be rebuilt as the parcel section of an existing branded consumer app. The price lists sell the vendor’s own driver app, or a white-label rebuild of that app, not a license to embed into someone else’s app.

## What is the realistic monthly band for panel + driver app + customer tracking for one small operator in 2026?

### Takeaway

After dropping products that say “contact sales” and print no number, a single small-city operator at the stated launch size (on the order of 10 to 25 drivers, and a few hundred to about 2,000 parcels a month) pays roughly $100–$650 a month on the task-priced and stop-priced panels that include a driver app and a customer tracking link, and roughly $500–$2,200 a month on the per-driver panels at those same headcounts. A customer-installed white-label app is not inside that band; the only explicit published price found for one is Tookan’s $5,999–$19,999 prepaid for a year. This is a description of published bills, not a price for Deliservy.

### Cited Findings

The band uses only totals computed above from vendor pages (or, where flagged, from that vendor’s own article).

Launch-sized, scenario A (10 drivers, 500 tasks), panel + driver app + some form of customer tracking:

- Tookan monthly base, set A $99 or set B $129, with branded app and route optimisation not included. — [Tookan pricing](https://jungleworks.com/tookan/pricing/)
- Spoke standard tracking page $125; branded tracking page $200. — [Spoke help](https://help.spoke.com/en/articles/1925291-spoke-products-pricing)
- Shipday unbranded Professional $69; branded driver app and branded tracking $139. — [Shipday pricing](https://www.shipday.com/pricing)
- Routific $150, customizable tracker, email notifications, SMS extra. — [Routific help](https://help.routific.com/en/articles/29-how-much-does-routific-cost)
- Onro Business $239, white-label tracking page, driver app; customer apps custom. — [Onro pricing](https://onro.io/pricing/)
- Track-POD order package $285 (Portuguese S) or $510 (English 3,000-order card); per driver $590. — [Track-POD](https://www.track-pod.com/pricing-delivery-app/); [Track-POD PT](https://www.track-pod.com/pt/precos/)
- OptimoRoute Pro $490. — [OptimoRoute pricing](https://optimoroute.com/pricing/)
- Upper Professional $600 plus $200 if the $20 tracking add-on is required, or Optimize $890. — [Upper pricing](https://www.upperinc.com/pricing/)
- Onfleet Launch $619, which includes 2,500 tasks and branded tracking. — [Onfleet pricing](https://onfleet.com/pricing)
- SimpliRoute floor $240, Locate2u floor $770, Cigo $1,500. These are floors or a per-vehicle list, not the same kind of full slider. — sources in the previous section

Same products at scenario B (25 drivers, 2,000 tasks):

- Spoke $165 (standard page) or $200 (branded page).
- Tookan $219 or $279, base only.
- Routific $300.
- Onro $334 only if the $0.19 article rate applies.
- Shipday Professional $219; Branded Elite $439.
- Track-POD order plan $510; per driver $1,475.
- Onfleet $619.
- OptimoRoute Pro $1,225.
- Upper Optimize $2,225.
- Cigo undiscounted list $3,750. Locate2u still “from $770.” SimpliRoute still “from $240.”

Scenario C is outside the owner’s launch description (“possibly more later”). Computable task-priced bills there run from Spoke $405 to Shipday Branded Elite $1,639, with Onfleet not computable and per-driver OptimoRoute at $2,450 and Track-POD at $3,950.

Excluded from the band because there is no public number: Bringg, Locus, DispatchTrack, Beetrack, Route4Me, FarEye’s normal quote (the AWS $50,000/year figure is an indicative enterprise list price, about $4,167 a month before usage), LogiNext Enterprise, Onro Enterprise, Upper Enterprise, and Track-POD Enterprise.

### Inferences

- The tight cluster for “use someone else’s dispatch panel, driver app, and a tracking link” at a few hundred to about 2,000 parcels a month is about $100–$650 per month when the vendor bills the parcel rather than the driver. Crossing into a per-driver price at 10–25 drivers moves the same operation to about $500–$2,200 per month.
- Branding the tracking page, or branding the driver app, is a step up inside that cluster (Spoke $125 to $200, Shipday $69 to $139 at 500 orders, Onro’s tracking page already inside $239), not a separate market.
- A white-label customer app is priced like a project: custom, or about $6,000–$20,000 prepaid for a year on Tookan, which is about $500–$1,670 per month if the prepaid fee is spread over the 12 months the page calls “1 year validity.”
- SMS, telephony, and implementation are repeatedly outside the subscription. The band above is the software subscription only.
- Prices were fetched on 25 October 2026. Onfleet’s current card ($619 / $1,349 / $3,099) is higher than figures still repeated from older reviews. Route4Me’s old per-user card is no longer a public price.

### Gaps

- The band would shift if Tookan’s real checkout is only one of the two printed sets, if Onro does not charge $0.19, if Routific’s bands are not marginal, or if a parcel is billed as two tasks.
- No invoice or Capterra screenshot was found that confirms a 2025–2026 charge distinct from the vendor page. G2 was used only to record “no pricing available,” not as a price source.
- Regional currency: Track-POD’s German page is euros at the same numerals as the dollar page. SimpliRoute also prints UF 7.2 beside U$240. Locate2u says its USD figure is an AUD conversion reviewed monthly. None of those were converted further.
