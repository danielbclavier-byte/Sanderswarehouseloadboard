# Sanders Warehousing Network — Project Brief

Context for Claude Code. Save as `CLAUDE.md` in the repo root.

## Owner
Daniel Clavier, Logistics Consultant at Sanders Moving (Nashville, TN). Building a new
revenue line for Sanders: **warehousing brokerage**.

## What we're building
A Sanders-branded warehousing marketplace with two sides, run by Sanders:

1. **Clients** request warehouse space and services through a structured quote form.
2. **Partner warehouses** see open opportunities in their market and submit quotes.
3. **Sanders** sits in the middle: fills its own Nashville facility first, brokers the
   overflow (or out-of-territory jobs) to partner warehouses, adds margin, quotes the
   client, manages the job, invoices the client and pays the partner.

The model is similar to OLIMP Warehousing's load board. Match the workflow and
industry-standard fields only. Do NOT copy OLIMP's design, copy, or code. OLIMP is
also a Sanders client.

## Scope
- IN: storage (overflow / short-term / long-term), receiving and inspection,
  cross-docking, transloading, pick/pack/fulfillment, pallet rework and labeling,
  project staging (FF&E for hotel, multifamily, retail), delivery from storage on
  Sanders' own trucks.
- OUT: freight brokerage (arranging loads on outside carriers). It requires FMCSA
  property broker authority plus a $75K BMC-84 bond. Not part of this build.

## Sanders facts (from sandersmoving.net; paraphrase, don't copy verbatim)
- Founded 1895. Allied Van Lines partner 65+ years. A+ BBB. US DOT 975147.
- HQ: 7149 Centennial Blvd, Nashville, TN 37209. Phone: (615) 350-7080.
- 66,000 sq ft Nashville facility: climate-controlled bays, high-density racking,
  fire suppression, 24/7 CCTV, controlled access, loading docks.
- Existing WMS with a client portal (SKU-level visibility, cycle counts, pick/pack).
  An existing client login lives at sandersmovingportal.net. Confirm what system it
  is before building a separate portal.
- Current site serves Nashville / Middle Tennessee. Partner warehouses extend reach
  across the Southeast.
- Current site quote form only captures name, phone, email, move date, and
  residential/commercial. That gap is the main reason for this build.
- Avoid duplicating existing site copy word for word (SEO duplicate-content risk).

## Screens (mockup exists, see below)
1. **Public site**: hero, proof strip (1895 / 66,000 sq ft / 24/7 security / Allied +
   BBB), services, how it works (request, one quote, we manage, one invoice), partner
   recruitment band, quote CTA, footer with real contact info.
2. **Client portal: Request for quote**
   - Services needed (multi-select): the IN-scope list above.
   - Location and timing: city/ZIP, search radius, inbound date, release date or
     duration.
   - Freight details: arrives as (palletized / floor-loaded / cartons / loose FF&E),
     quantity + unit (pallets, cartons, trailers, containers, sq ft), arriving on
     (53' trailer, container, box truck, LTL, parcel), avg weight per pallet,
     stackable, commodity description.
   - Environment: ambient / climate-controlled / refrigerated.
   - Certifications: food grade, hazmat, bonded, high-value/secured.
   - Notes; contact info (name, company, email, phone).
   - Live summary panel; submit shows a confirmation with a request number.
   - Tabs: Request a quote, Your requests, Inventory, Invoices.
   - Must work on mobile.
3. **Partner portal: Opportunity board**
   - Tabs: New opportunities, My quotes, Booked.
   - Filters: location (default Nashville, TN), service type.
   - Opportunity card: ID, title, service, location, window, volume, posted time.
   - Detail panel: scope, requirements, quote form (price, earliest availability,
     notes on storage rate basis / handling fees / dock hours).
   - Booked jobs: status, invoice upload, payment status.
   - Partner profile: locations, capabilities, certifications, COI upload.
   - **Partners never see the client's identity.** Sanders controls the margin.

## Data model (starting point)
- Client, ClientUser
- QuoteRequest (all RFQ fields above, status)
- Partner, PartnerLocation (address, sq ft, environments, certifications, dock info),
  PartnerDocument (COI with expiry date)
- Opportunity (posted from a QuoteRequest, client-anonymized)
- PartnerQuote (opportunity, partner, price, availability, notes, status)
- Job (accepted quote, client price, partner cost, margin, status)
- Invoice (partner invoice upload, client invoice, payment status)

Statuses: request submitted → reviewing → posted to partners → quoted to client →
won / lost → in storage → released → invoiced → paid.

## Integrations
- **Zoho CRM is the source of truth.** Every QuoteRequest creates a Zoho Deal.
  Won/lost and job status sync back to the Deal. Confirm real Zoho field names and
  API access before mapping; do not assume.
- Email notifications: new request (to Sanders), new opportunity in a partner's
  market (to partners), quote accepted (to partner).

## Build phases
1. **RFQ intake** that writes to Zoho. Smallest useful thing; ship first.
2. **Partner portal**, once manual bidding by email becomes the bottleneck.
3. **Status, invoice upload, payout tracking.**

Phase 1 alternative with no code: Zoho Forms → Zoho CRM. Compare effort before
writing a custom app.

## Design
- Must match sandersmoving.net branding (logo, colors, fonts, buttons). Brand assets
  pending; get a homepage screenshot or brand files before final styling.
- Mockup palette until then: ink #14202E, ground #F5F3EF, accent #C2410C
  (hover #9A3412); Archivo (display), IBM Plex Sans (body), IBM Plex Mono (IDs).
- 44px minimum touch targets, real form labels, WCAG AA contrast.

## Reference mockup
Interactive mockup (all screens): https://claude.ai/artifact/45ybtfTtcwUp92tmW95RrN
Source files (custom canvas format, use as visual and field reference, not
production code): Main.dc.html, Quote.dc.html, Board.dc.html.

## Open questions (resolve before launch)
- Insurance and liability on brokered jobs: is Sanders the contracting party? Require
  partners to name Sanders as additional insured?
- Commission basis on brokered revenue (revenue vs gross profit) and payout timing.
- Who at Sanders approves using the brand and changes to the website.
- What system runs sandersmovingportal.net, and can the RFQ live there?
- Zoho admin access for Daniel.
- Public email address and committed quote response time (currently [EMAIL] and [X]
  hours in the mockup).

## First task for Claude Code
Propose a stack and repo structure for Phase 1 (RFQ intake to Zoho CRM), compare it
against a Zoho Forms setup, and list what you need from me (Zoho API credentials
setup steps, field names, hosting, domain) before writing code.
