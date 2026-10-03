// Site settings. Edit these values; no other file needs to change.
window.SANDERS_CONFIG = {
  phone: '(615) 350-7080',
  phoneHref: 'tel:+16153507080',
  address: '7149 Centennial Blvd, Nashville, TN 37209',
  usdot: '975147',

  // Open question in CLAUDE.md: public email address. Leave '' to hide it.
  email: '',

  // Open question in CLAUDE.md: committed quote response time, e.g. '4 business hours'.
  // Leave '' and the copy omits the promise.
  responseTime: '',

  // Where the quote form sends submissions (Phase 1 -> Zoho CRM).
  // '' = demo mode: requests are kept only in this browser so the flow can be tested.
  // Set to an HTTPS endpoint that accepts a JSON POST (e.g. a Zoho Flow webhook or a
  // small serverless function that creates the Zoho Deal) to go live.
  rfqEndpoint: '',

  // Existing Sanders WMS client login (Inventory tab links here).
  wmsPortalUrl: 'https://sandersmovingportal.net'
};
