# Sanders Logistics Network

Warehousing brokerage site for Sanders Moving (Nashville, TN). Project brief: [CLAUDE.md](CLAUDE.md).

Plain HTML, CSS and JavaScript. No build step and no server needed to preview.

| Page | File | What it is |
|---|---|---|
| Public site | `index.html` | Hero, proof strip, services, how it works, partner recruitment, quote CTA |
| Client portal | `quote.html` | Full request-for-quote form with live summary; tabs for requests, inventory, invoices |
| Partner portal | `partners.html` | Opportunity board (new / my quotes / booked), quoting, invoice upload, profile and COI |

The original design mockups are in `docs/mockups/` for reference.

## Preview locally

Open `index.html` in a browser, or run `python3 -m http.server` in this folder and visit http://localhost:8000.

## Publish free with GitHub Pages

Repo **Settings → Pages → Build and deployment → Deploy from a branch**, pick the branch and `/ (root)`, then Save.
The site appears at `https://<github-username>.github.io/Sanderswarehouseloadboard/` within a minute or two.
A custom domain (for example `warehousing.sandersmoving.net`) can be added on the same settings page.

## Settings

Everything you are likely to change is in `assets/js/config.js`: phone, address, public email,
quote response time, the WMS portal link, and `rfqEndpoint`.

## Current limits (demo mode)

- **Quote requests are not sent anywhere yet.** With `rfqEndpoint` empty, a submitted request is
  saved only in the visitor's own browser so the flow can be tested. Before launch, set `rfqEndpoint`
  to a URL that accepts a JSON POST and creates the Zoho CRM Deal (Phase 1 in CLAUDE.md), for
  example a Zoho Flow webhook. The JSON field names match the form's `name` attributes.
- **The partner board shows sample opportunities.** Quotes, invoices and profiles are saved in the
  partner's browser only. A real partner portal needs logins and a database (Phase 2).
- Styling uses the mockup palette until Sanders brand files are provided.
