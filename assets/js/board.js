// Partner load board: search/filter/sort, quoting, booked jobs, partner profile.
// Loads are client-anonymized by design: no client name, contact or sell rate ever appears here.
(function () {
  var S = window.Sanders;
  var esc = S.esc;
  var BIDS_KEY = 'sanders.partner.bids';
  var PROFILE_KEY = 'sanders.partner.profile';
  var INVOICES_KEY = 'sanders.partner.invoices';

  var ALL = window.SANDERS_LOADS;
  var SERVICES = ['Storage', 'Receiving', 'Cross-dock', 'Transload', 'Pick/pack', 'Staging'];
  var ENVS = ['Ambient', 'Climate'];
  var AGE_ORDER = function (p) { var n = parseInt(p, 10); return p.slice(-1) === 'h' ? n : p.slice(-1) === 'd' ? n * 24 : n * 168; };

  var params = new URLSearchParams(location.search);
  var qInput = document.getElementById('q');
  if (params.has('q')) qInput.value = params.get('q');

  var state = {
    tab: 'new',
    services: [],
    envs: [],
    query: qInput.value,
    sort: 'age',
    selected: null,
    bids: S.store(BIDS_KEY, {}),
    invoices: S.store(INVOICES_KEY, {})
  };

  var listEl = document.getElementById('list');
  var detailEl = document.getElementById('detail');

  function inTab(j, tab) {
    if (tab === 'booked') return !!j.booked;
    if (j.booked) return false;
    return tab === 'bids' ? !!state.bids[j.id] : !state.bids[j.id];
  }
  function city() { return (state.query || '').split(',')[0].trim().toLowerCase(); }

  function shown() {
    var q = city();
    var rows = ALL.filter(function (j) {
      return inTab(j, state.tab) &&
        (!q || j.location.toLowerCase().indexOf(q) !== -1) &&
        (!state.services.length || state.services.indexOf(j.service) !== -1) &&
        (!state.envs.length || state.envs.indexOf(j.env) !== -1);
    });
    var key = {
      age: function (j) { return AGE_ORDER(j.posted); },
      start: function (j) { return j.start === 'ASAP' ? '00' : j.start; },
      market: function (j) { return j.location; }
    }[state.sort];
    return rows.sort(function (a, b) { var x = key(a), y = key(b); return x < y ? -1 : x > y ? 1 : 0; });
  }

  function money(n) { return '$' + Number(n).toLocaleString('en-US'); }

  function checkboxes(hostId, values, picked, name) {
    document.getElementById(hostId).innerHTML = values.map(function (v) {
      var n = ALL.filter(function (j) { return (name === 'svc' ? j.service : j.env) === v && inTab(j, state.tab); }).length;
      return '<label class="choice"><input type="checkbox" data-' + name + '="' + esc(v) + '"' + (picked.indexOf(v) !== -1 ? ' checked' : '') + '>' +
        esc(v) + ' <span class="small muted" style="margin-left:auto">' + n + '</span></label>';
    }).join('');
  }
  function renderFilters() {
    checkboxes('filters', SERVICES, state.services, 'svc');
    checkboxes('env-filters', ENVS, state.envs, 'env');
  }

  function renderKpis() {
    var open = ALL.filter(function (j) { return !j.booked; });
    var markets = {};
    var plt = 0;
    open.forEach(function (j) {
      markets[j.location] = 1;
      var m = /^([\d,]+)\s*plt/.exec(j.size);
      if (m) plt += Number(m[1].replace(/,/g, ''));
    });
    document.getElementById('k-open').textContent = open.length;
    document.getElementById('k-markets').textContent = Object.keys(markets).length;
    document.getElementById('k-plt').textContent = plt.toLocaleString('en-US');
  }

  function renderCounts() {
    ['new', 'bids', 'booked'].forEach(function (t) {
      var n = ALL.filter(function (j) { return inTab(j, t); }).length;
      document.getElementById('c-' + t).textContent = n || '';
    });
  }

  function status(j) {
    if (j.booked) return state.invoices[j.id] ? ['badge-booked', 'Invoiced'] : ['badge-booked', 'Booked'];
    if (state.bids[j.id]) return ['badge-quoted', 'Quoted ' + money(state.bids[j.id].price)];
    return ['badge-open', 'Open'];
  }

  function renderList() {
    var jobs = shown();
    var q = city();
    document.getElementById('result-line').textContent =
      jobs.length + (jobs.length === 1 ? ' load' : ' loads') + (q ? ' in ' + state.query : ' in all markets');
    if (!jobs.length) {
      listEl.innerHTML = '<div class="empty">No loads match. Clear the market or filters to see every load.</div>';
      return;
    }
    listEl.innerHTML = '<div class="table-wrap" style="border-radius:0"><table class="board"><thead><tr>' +
      '<th scope="col">Load #</th><th scope="col">Market</th><th scope="col">Service</th>' +
      '<th scope="col">Start</th><th scope="col">Volume</th><th scope="col">Status</th>' +
      '<th scope="col"><span class="visually-hidden">Action</span></th></tr></thead><tbody>' +
      jobs.map(function (j) {
        var sel = state.selected === j.id;
        var st = status(j);
        return '<tr' + (sel ? ' class="selected"' : '') + '>' +
          '<td data-label="Load #" class="id">' + esc(j.id) + '<span class="sub">' + esc(j.posted) + ' ago</span></td>' +
          '<td data-label="Market"><span class="title">' + esc(j.location) + '</span><span class="sub">' + esc(j.title) + '</span></td>' +
          '<td data-label="Service"><span class="badge">' + esc(j.service) + '</span></td>' +
          '<td data-label="Start" class="num nowrap">' + esc(j.start) + '</td>' +
          '<td data-label="Volume">' + esc(j.size) + '<span class="sub">' + esc(j.env) + '</span></td>' +
          '<td data-label="Status"><span class="badge ' + st[0] + '">' + esc(st[1]) + '</span></td>' +
          '<td class="act"><button type="button" class="btn ' + (sel ? 'btn-dark' : 'btn-outline') + ' btn-sm" data-select="' + esc(j.id) + '" aria-pressed="' + sel + '">' +
          (j.booked ? 'Manage' : state.bids[j.id] ? 'View' : 'Quote') + '</button></td>' +
          '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  function renderDetail() {
    var j = ALL.filter(function (x) { return x.id === state.selected; })[0];
    if (!j) {
      detailEl.innerHTML = '<div class="panel-head light">Load details</div><div class="panel-body small muted" style="line-height:1.6">' +
        'Select a load to see the full scope and send your rate.<br><br>Sanders presents your quote to the client. If it\'s accepted, your Sanders consultant confirms the details, and Sanders pays you after the job is complete.</div>';
      return;
    }
    var bid = state.bids[j.id];
    var html = '<div class="panel-head">Load ' + esc(j.id) + '</div><div class="panel-body detail stack">' +
      '<h2 tabindex="-1" id="detail-h">' + esc(j.title) + '</h2>' +
      '<dl>' +
      '<div><dt>Market</dt><dd>' + esc(j.location) + '</dd></div>' +
      '<div><dt>Service</dt><dd>' + esc(j.service) + '</dd></div>' +
      '<div><dt>Window</dt><dd>' + esc(j.window) + '</dd></div>' +
      '<div><dt>Volume</dt><dd>' + esc(j.size) + '</dd></div>' +
      '<div><dt>Environment</dt><dd>' + esc(j.env) + '</dd></div>' +
      '<div><dt>Posted</dt><dd>' + esc(j.posted) + ' ago</dd></div>' +
      '</dl>' +
      '<div><h3>Scope</h3><p>' + esc(j.scope) + '</p></div>' +
      '<div><h3>Requirements</h3><p>' + esc(j.reqs) + '</p></div>';

    if (j.booked) {
      var inv = state.invoices[j.id];
      html += '<div class="divider stack">' +
        '<div><h3>Payment status</h3><span class="badge ' + (inv ? 'badge-quoted' : 'badge-accent') + '">' + esc(inv ? 'Invoice received · processing' : j.payment) + '</span></div>' +
        (inv ? '<p class="small muted">Invoice <strong>' + esc(inv.file) + '</strong> submitted ' + esc(new Date(inv.at).toLocaleDateString()) + '.</p>' : '') +
        '<label class="field">Upload invoice (PDF)<input class="input" type="file" accept=".pdf,image/*" id="inv-file" style="padding-top:9px"></label>' +
        '<button type="button" class="btn btn-dark" id="inv-send">' + (inv ? 'Replace invoice' : 'Submit invoice') + '</button>' +
        '</div>';
    } else if (bid) {
      html += '<div class="divider stack">' +
        '<div><h3>Your quote</h3><strong style="font-size:20px">' + esc(money(bid.price)) + '</strong></div>' +
        (bid.available ? '<div class="small">Earliest availability: ' + esc(bid.available) + '</div>' : '') +
        (bid.notes ? '<div class="small muted">' + esc(bid.notes) + '</div>' : '') +
        '<p class="small muted">Your Sanders consultant will present it to the client and confirm if it\'s accepted.</p>' +
        '<button type="button" class="btn btn-outline btn-sm" id="withdraw">Withdraw quote</button>' +
        '</div>';
    } else {
      html += '<form class="divider stack" id="quote-form" novalidate>' +
        '<label class="field">Your rate (USD) <span class="hint">Total for the scope above</span><input class="input" type="number" min="1" inputmode="decimal" name="price" required></label>' +
        '<label class="field">Earliest availability<input class="input" type="date" name="available"></label>' +
        '<label class="field">Notes for Sanders<textarea class="textarea" name="notes" rows="3" placeholder="Storage rate basis, in/out handling fees, dock hours"></textarea></label>' +
        '<p class="error-text" id="quote-err" hidden style="margin:0">Enter a rate to send your quote.</p>' +
        '<button type="submit" class="btn btn-primary">Send quote to Sanders</button>' +
        '</form>';
    }
    html += '</div>';
    detailEl.innerHTML = html;
  }

  function render() {
    renderFilters();
    renderCounts();
    renderKpis();
    renderList();
    renderDetail();
  }

  function selectLoad(id, focus) {
    state.selected = id;
    renderList();
    renderDetail();
    if (!focus) return;
    var h = document.getElementById('detail-h');
    var narrow = window.innerWidth < 1280;
    if (narrow) detailEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (h) h.focus({ preventScroll: !narrow });
  }

  // ----- events -----
  S.tabs(document.querySelector('[role="tablist"]'), function (btn) {
    state.tab = btn.getAttribute('data-tab');
    state.selected = null;
    document.getElementById('board').setAttribute('aria-labelledby', btn.id);
    render();
  });
  document.getElementById('board').hidden = false; // one panel serves all three tabs

  qInput.addEventListener('input', function (e) { state.query = e.target.value; renderList(); });
  document.getElementById('sort').addEventListener('change', function (e) { state.sort = e.target.value; renderList(); });
  document.querySelector('.filters').addEventListener('change', function (e) {
    var svc = e.target.getAttribute('data-svc');
    var env = e.target.getAttribute('data-env');
    var list = svc ? state.services : env ? state.envs : null;
    if (!list) return;
    var v = svc || env;
    var i = list.indexOf(v);
    if (e.target.checked && i === -1) list.push(v);
    if (!e.target.checked && i !== -1) list.splice(i, 1);
    renderList();
  });
  document.getElementById('clear').addEventListener('click', function () {
    state.services = []; state.envs = []; state.query = ''; qInput.value = '';
    renderFilters(); renderList();
  });
  listEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-select]');
    if (b) selectLoad(b.getAttribute('data-select'), true);
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
    state.bids[state.selected] = { price: price, available: f.elements.available.value, notes: f.elements.notes.value.trim(), at: new Date().toISOString() };
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
    document.getElementById('partner-name').textContent = p.name || 'Guest warehouse';
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
  document.getElementById('open-profile').addEventListener('click', function (e) { e.preventDefault(); openProfile(); });
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
  // Deep links: #profile opens the profile; #SWL-1042 opens that load.
  if (location.hash === '#profile') openProfile();
  else if (location.hash.length > 1) {
    var id = decodeURIComponent(location.hash.slice(1));
    if (ALL.some(function (j) { return j.id === id && inTab(j, 'new'); })) selectLoad(id, false);
  }
})();
