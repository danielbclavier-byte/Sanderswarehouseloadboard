// Partner portal: opportunity board, quoting, booked jobs, partner profile.
// Opportunities are client-anonymized by design: no client name, contact or rate ever appears here.
(function () {
  var S = window.Sanders;
  var BIDS_KEY = 'sanders.partner.bids';
  var PROFILE_KEY = 'sanders.partner.profile';
  var INVOICES_KEY = 'sanders.partner.invoices';

  // Sample data until opportunities are posted from real quote requests.
  var ALL = [
    { id: 'SLN-1042', title: 'Hotel FF&E receiving and storage', service: 'Receiving', location: 'Nashville, TN', window: 'Nov 2 – Dec 15', size: '22 pallets + loose FF&E', posted: '2h ago', env: 'Climate-controlled', scope: 'Receive deliveries from multiple vendors, inspect against the manifest, photo-document damage and store until Sanders pulls by floor for the renovation.', reqs: 'Dock-high doors, climate-controlled space, COI naming Sanders as additional insured.' },
    { id: 'SLN-1039', title: 'Rejected load, immediate storage', service: 'Storage', location: 'Nashville, TN', window: 'Inbound tomorrow, ~2 weeks', size: '26 pallets', posted: '3h ago', env: 'Ambient', scope: 'A truckload refused at the receiver needs to come off the trailer and be held until the shipper reroutes it.', reqs: 'Receive within 24 hours, forklift on site, inventory count on receipt.' },
    { id: 'SLN-1037', title: 'Short-term overflow storage', service: 'Storage', location: 'Nashville, TN', window: '30 days from Oct 20', size: '14 pallets', posted: '1d ago', env: 'Ambient', scope: 'Inbound overflow inventory held for about 30 days, released in two outbound pulls.', reqs: 'Inventory report on receipt, 48-hour release notice.' },
    { id: 'SLN-1035', title: 'Retail fixtures cross-dock to 8 store runs', service: 'Cross-dock', location: 'Nashville, TN', window: 'Nov 10 – 14', size: '1 inbound trailer · 8 outbound', posted: '1d ago', env: 'Ambient', scope: 'Receive one trailer of store fixtures, sort by store and stage for Sanders trucks to pick up each morning.', reqs: 'Floor space to stage 8 lanes, 6am dock access.' },
    { id: 'SLN-1031', title: 'Multifamily furniture staging, 64 units', service: 'Staging', location: 'Chattanooga, TN', window: 'Nov 15 – Dec 12', size: '64 unit packages', posted: '2d ago', env: 'Ambient', scope: 'Receive furniture packages for a lease-up, store by unit and release 8 to 10 units per day on schedule.', reqs: 'Labeled storage by unit number, daily release log.' },
    { id: 'SLN-1028', title: 'Seasonal retail overflow', service: 'Storage', location: 'Atlanta, GA', window: 'Nov 1 – Jan 15', size: '120 pallets', posted: '3d ago', env: 'Ambient', scope: 'Holiday inventory overflow with weekly replenishment pulls back to the client DC.', reqs: 'Racked storage, weekly inventory report, WMS or spreadsheet visibility.' },
    { id: 'SLN-1024', title: 'Transload two 53-foot trailers', service: 'Transload', location: 'Memphis, TN', window: 'Oct 28', size: '2 trailers', posted: '4d ago', env: 'Ambient', scope: 'Floor-loaded freight transferred to pallets and reloaded to outbound trailers.', reqs: 'Same-day turnaround, pallets and stretch wrap supplied.' },
    { id: 'SLN-1019', title: 'Event materials storage', service: 'Staging', location: 'Nashville, TN', window: 'Completed Oct 1', size: '9 pallets', posted: '2w ago', env: 'Ambient', scope: 'Stored exhibit materials between two conventions and released to Sanders trucks for load-in.', reqs: 'Release on 24-hour notice.', booked: true, payment: 'Awaiting invoice' }
  ];
  var SERVICES = ['All', 'Storage', 'Receiving', 'Cross-dock', 'Transload', 'Staging'];

  var state = {
    tab: 'new',
    service: 'All',
    query: document.getElementById('q').value,
    selected: null,
    bids: S.store(BIDS_KEY, {}),
    invoices: S.store(INVOICES_KEY, {})
  };

  var listEl = document.getElementById('list');
  var detailEl = document.getElementById('detail');
  var esc = S.esc;

  function inTab(j, tab) {
    if (tab === 'booked') return !!j.booked;
    if (j.booked) return false;
    return tab === 'bids' ? !!state.bids[j.id] : !state.bids[j.id];
  }
  function city() { return (state.query || '').split(',')[0].trim().toLowerCase(); }

  function shown() {
    var q = city();
    return ALL.filter(function (j) {
      return inTab(j, state.tab) &&
        (!q || j.location.toLowerCase().indexOf(q) !== -1) &&
        (state.service === 'All' || j.service === state.service);
    });
  }

  function money(n) { return '$' + Number(n).toLocaleString('en-US'); }

  function renderFilters() {
    document.getElementById('filters').innerHTML = SERVICES.map(function (f) {
      return '<button type="button" class="pill" data-svc="' + esc(f) + '" aria-pressed="' + (state.service === f) + '">' + esc(f) + '</button>';
    }).join('');
  }

  function renderCounts() {
    ['new', 'bids', 'booked'].forEach(function (t) {
      document.getElementById('c-' + t).textContent = ALL.filter(function (j) { return inTab(j, t); }).length;
    });
  }

  function statusText(j) {
    if (j.booked) return state.invoices[j.id] ? 'Booked · invoice submitted' : 'Booked · invoice needed';
    if (state.bids[j.id]) return 'Quoted ' + money(state.bids[j.id].price);
    return 'Open for quotes';
  }
  function cta(j) {
    if (j.booked) return 'Manage job';
    return state.bids[j.id] ? 'View quote' : 'View and quote';
  }

  function renderList() {
    var jobs = shown();
    var q = city();
    document.getElementById('result-line').textContent =
      jobs.length + (jobs.length === 1 ? ' opportunity' : ' opportunities') + (q ? ' in ' + state.query : ' in all markets');
    if (!jobs.length) {
      listEl.innerHTML = '<div class="empty">Nothing here yet. Try another location, or clear the location to see every market.</div>';
      return;
    }
    listEl.innerHTML = jobs.map(function (j) {
      var sel = state.selected === j.id;
      return '<article class="opp' + (sel ? ' selected' : '') + '">' +
        '<div class="top"><span class="id">' + esc(j.id) + ' · posted ' + esc(j.posted) + '</span><span class="badge">' + esc(j.service) + '</span></div>' +
        '<h3>' + esc(j.title) + '</h3>' +
        '<div class="meta"><span>' + esc(j.location) + '</span><span>' + esc(j.window) + '</span><span>' + esc(j.size) + '</span></div>' +
        '<div class="bottom"><span class="status">' + esc(statusText(j)) + '</span>' +
        '<button type="button" class="btn btn-outline btn-sm" data-select="' + esc(j.id) + '" aria-pressed="' + sel + '">' + esc(cta(j)) + '</button></div>' +
        '</article>';
    }).join('');
  }

  function renderDetail() {
    var j = ALL.filter(function (x) { return x.id === state.selected; })[0];
    if (!j) {
      detailEl.innerHTML = '<div style="padding: 8px 0; color: var(--muted); line-height:1.6">' +
        '<p class="eyebrow" style="font-size:12px">How quoting works</p>' +
        'Select an opportunity to see the full scope and send your quote. Sanders presents quotes to the client; if yours is accepted, your Sanders consultant confirms the details and Sanders pays you after completion.</div>';
      return;
    }
    var bid = state.bids[j.id];
    var html = '<div class="detail stack-lg">' +
      '<span class="mono small" style="color: var(--muted-2)">' + esc(j.id) + '</span>' +
      '<h2 class="display" style="font-size:24px; line-height:1.2" tabindex="-1" id="detail-h">' + esc(j.title) + '</h2>' +
      '<dl>' +
      '<div><dt>Location</dt><dd>' + esc(j.location) + '</dd></div>' +
      '<div><dt>Service</dt><dd>' + esc(j.service) + '</dd></div>' +
      '<div><dt>Window</dt><dd>' + esc(j.window) + '</dd></div>' +
      '<div><dt>Volume</dt><dd>' + esc(j.size) + '</dd></div>' +
      '<div><dt>Environment</dt><dd>' + esc(j.env) + '</dd></div>' +
      '</dl>' +
      '<div><div style="font-weight:600; margin-bottom:6px">Scope</div><p style="margin:0; line-height:1.6; color:#3A4250">' + esc(j.scope) + '</p></div>' +
      '<div><div style="font-weight:600; margin-bottom:6px">Requirements</div><p style="margin:0; line-height:1.6; color:#3A4250">' + esc(j.reqs) + '</p></div>';

    if (j.booked) {
      var inv = state.invoices[j.id];
      html += '<div class="divider stack">' +
        '<div style="font-weight:600">Booked · job complete</div>' +
        '<div><span class="small muted">Payment status</span><br><span class="badge ' + (inv ? 'badge-neutral' : '') + '">' + esc(inv ? 'Invoice received · processing' : j.payment) + '</span></div>' +
        (inv ? '<p class="small muted" style="margin:0">Invoice <strong>' + esc(inv.file) + '</strong> submitted ' + esc(new Date(inv.at).toLocaleDateString()) + '.</p>' : '') +
        '<label class="field">Upload invoice (PDF)<input class="input" type="file" accept=".pdf,image/*" id="inv-file" style="padding-top:9px"></label>' +
        '<button type="button" class="btn btn-dark btn-sm" id="inv-send">' + (inv ? 'Replace invoice' : 'Submit invoice') + '</button>' +
        '</div>';
    } else if (bid) {
      html += '<div class="divider" style="line-height:1.6">' +
        '<div style="font-weight:600; margin-bottom:4px">Quote sent: ' + esc(money(bid.price)) + '</div>' +
        (bid.available ? '<div class="small">Earliest availability: ' + esc(bid.available) + '</div>' : '') +
        (bid.notes ? '<div class="small muted" style="margin-top:6px">' + esc(bid.notes) + '</div>' : '') +
        '<div class="muted" style="margin-top:8px">Your Sanders consultant will present it to the client and confirm if it\'s accepted.</div>' +
        '<button type="button" class="btn btn-outline btn-sm" id="withdraw" style="margin-top:12px">Withdraw quote</button>' +
        '</div>';
    } else {
      html += '<form class="divider stack" id="quote-form" novalidate>' +
        '<label class="field">Your price (USD) <span class="hint">Total for the scope above</span><input class="input" type="number" min="1" inputmode="decimal" name="price" required></label>' +
        '<label class="field">Earliest availability<input class="input" type="date" name="available"></label>' +
        '<label class="field">Notes for Sanders<textarea class="textarea" name="notes" rows="3" placeholder="Storage rate basis, in/out handling fees, dock hours"></textarea></label>' +
        '<p class="error-text" id="quote-err" hidden style="margin:0">Enter a price to send your quote.</p>' +
        '<button type="submit" class="btn btn-primary">Send quote to Sanders</button>' +
        '</form>';
    }
    html += '</div>';
    detailEl.innerHTML = html;
  }

  function render() {
    renderFilters();
    renderCounts();
    renderList();
    renderDetail();
  }

  // ----- events -----
  S.tabs(document.querySelector('[role="tablist"]'), function (btn) {
    state.tab = btn.getAttribute('data-tab');
    state.selected = null;
    document.getElementById('board').setAttribute('aria-labelledby', btn.id);
    render();
  });
  // One panel serves all three tabs; keep it visible.
  document.getElementById('board').hidden = false;

  document.getElementById('q').addEventListener('input', function (e) {
    state.query = e.target.value;
    renderList();
  });
  document.getElementById('filters').addEventListener('click', function (e) {
    var b = e.target.closest('[data-svc]');
    if (!b) return;
    state.service = b.getAttribute('data-svc');
    renderFilters();
    renderList();
  });
  listEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-select]');
    if (!b) return;
    state.selected = b.getAttribute('data-select');
    renderList();
    renderDetail();
    var h = document.getElementById('detail-h');
    if (window.innerWidth < 960) detailEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (h) h.focus({ preventScroll: window.innerWidth >= 960 });
  });

  detailEl.addEventListener('submit', function (e) {
    if (e.target.id !== 'quote-form') return;
    e.preventDefault();
    var f = e.target;
    var price = Number(f.elements.price.value);
    if (!price || price <= 0) {
      document.getElementById('quote-err').hidden = false;
      f.elements.price.setAttribute('aria-invalid', 'true');
      f.elements.price.focus();
      return;
    }
    state.bids[state.selected] = {
      price: price,
      available: f.elements.available.value,
      notes: f.elements.notes.value.trim(),
      at: new Date().toISOString()
    };
    S.save(BIDS_KEY, state.bids);
    S.toast('Quote sent to Sanders for ' + state.selected + '.');
    render();
  });

  detailEl.addEventListener('click', function (e) {
    if (e.target.id === 'withdraw') {
      delete state.bids[state.selected];
      S.save(BIDS_KEY, state.bids);
      S.toast('Quote withdrawn.');
      render();
    }
    if (e.target.id === 'inv-send') {
      var input = document.getElementById('inv-file');
      if (!input.files.length) { input.focus(); S.toast('Choose an invoice file first.'); return; }
      state.invoices[state.selected] = { file: input.files[0].name, at: new Date().toISOString() };
      S.save(INVOICES_KEY, state.invoices);
      S.toast('Invoice submitted. Sanders will update the payment status.');
      render();
    }
  });

  // ----- profile dialog -----
  var dlg = document.getElementById('profile');
  var pform = document.getElementById('profile-form');

  function loadProfile() {
    var p = S.store(PROFILE_KEY, null);
    if (!p) return;
    document.getElementById('partner-name').textContent = p.name || 'Your warehouse';
    Object.keys(p).forEach(function (k) {
      var el = pform.elements[k];
      if (!el || k === 'coi') return;
      if (Array.isArray(p[k])) {
        pform.querySelectorAll('input[name="' + k + '"]').forEach(function (cb) { cb.checked = p[k].indexOf(cb.value) !== -1; });
      } else if (el.type !== 'file') {
        el.value = p[k];
      }
    });
  }
  function openProfile() {
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  }
  document.getElementById('open-profile').addEventListener('click', openProfile);
  dlg.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', function () { dlg.close(); }); });
  pform.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!pform.checkValidity()) { pform.reportValidity(); return; }
    var p = {};
    new FormData(pform).forEach(function (v, k) {
      if (k === 'caps' || k === 'certs') (p[k] = p[k] || []).push(v);
      else if (k === 'coi') { if (v && v.name) p.coiFile = v.name; }
      else p[k] = v;
    });
    var prev = S.store(PROFILE_KEY, {}) || {};
    if (!p.coiFile && prev.coiFile) p.coiFile = prev.coiFile;
    S.save(PROFILE_KEY, p);
    loadProfile();
    dlg.close();
    S.toast('Profile saved.');
  });

  loadProfile();
  render();
  if (location.hash === '#profile') openProfile();
})();
