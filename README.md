# Sanders Warehouse Loads (sanderswarehouseloads)

Warehousing brokerage site for Sanders Moving (Nashville, TN). Project brief: [CLAUDE.md](CLAUDE.md).

Plain HTML, CSS and JavaScript. No build step and no server needed to preview.

| Page | File | What it is |
|---|---|---|
| Home | `index.html` | Search box (need space / have space), open loads table, services, how it works, partner sign-up |
| Client portal | `quote.html` | Full request-for-quote form with live summary; tabs for requests, inventory, invoices |
| Load board | `partners.html` | Partner load board: filter sidebar, load table, quote panel, booked jobs with invoice upload, profile and COI |

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
- Brand colors were sampled from sandersmoving.net: navy `#1A2332` / `#222F44`, gold `#C8A961`.
  They live at the top of `assets/css/styles.css`. Gold buttons use navy text (white on gold fails WCAG AA contrast).
- Logo: `assets/img/sanders-moving-logo.png` was cut from a screenshot of sandersmoving.net. Swap in the
  original logo file (white version, same name) for sharper results.
- Hero photo: [Nashville skyline.jpg](https://commons.wikimedia.org/wiki/File:Nashville_skyline.jpg) by
  Travlin Braden, CC BY-SA, loaded from Wikimedia Commons. Keep the photo credit on the page while it's used.
  To use your own photo, save it as `assets/img/hero.jpg` and delete the `style="--hero-photo: ..."`
  attribute on the hero in `index.html`.

## After changing CSS or JS

GitHub Pages lets browsers cache files for about 10 minutes. Each page loads `styles.css` and the scripts with
a `?v=` number; bump that number in all three HTML files whenever you change those files, so visitors never
get new pages with an old stylesheet.
