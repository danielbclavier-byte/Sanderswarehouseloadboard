// Client portal: RFQ form, live summary, submission, "Your requests" list.
(function () {
  var S = window.Sanders;
  var cfg = S.cfg;
  var STORE_KEY = 'sanders.requests';

  var form = document.getElementById('rfq-form');
  var confirmBox = document.getElementById('rfq-confirm');
  var errorsBox = document.getElementById('form-errors');
  var submitBtn = document.getElementById('submit-btn');

  var tabCtl = S.tabs(document.querySelector('[role="tablist"]'), function (btn) {
    if (btn.id === 't-req') renderRequests();
  });

  document.getElementById('wms-link').href = cfg.wmsPortalUrl || '#';

  function values() {
    var fd = new FormData(form);
    var v = {};
    fd.forEach(function (val, key) {
      if (key === 'services' || key === 'certifications') {
        (v[key] = v[key] || []).push(val);
      } else {
        v[key] = typeof val === 'string' ? val.trim() : val;
      }
    });
    v.services = v.services || [];
    v.certifications = v.certifications || [];
    return v;
  }

  function updateSummary() {
    var v = values();
    document.getElementById('sum-services').textContent = v.services.length ? v.services.join(', ') : 'None selected yet';
    document.getElementById('sum-where').textContent = v.location ? v.location + ' · within ' + v.radius : 'Not set';
    document.getElementById('sum-volume').textContent = v.quantity ? v.quantity + ' ' + v.unit.toLowerCase() + ' · ' + v.arrivesAs.toLowerCase() : 'Not set';
    document.getElementById('sum-env').textContent = v.environment;
    document.getElementById('sum-certs').textContent = v.certifications.length ? v.certifications.join(', ') : 'None';
  }

  function validate(v) {
    var problems = [];
    form.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });
    function bad(name, msg) {
      var el = form.elements[name];
      if (el && el.setAttribute) el.setAttribute('aria-invalid', 'true');
      problems.push({ name: name, msg: msg });
    }
    if (!v.services.length) problems.push({ name: 'services', msg: 'Pick at least one service.' });
    if (!v.location) bad('location', 'Tell us where you need space.');
    if (!v.inboundDate) bad('inboundDate', 'Add an inbound date (an estimate is fine).');
    if (!v.quantity || Number(v.quantity) < 1) bad('quantity', 'Add a quantity.');
    if (!v.commodity) bad('commodity', "Tell us what's being stored.");
    if (!v.name) bad('name', 'Add your name.');
    if (!v.company) bad('company', 'Add your company.');
    if (!v.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) bad('email', 'Add a valid email address.');
    return problems;
  }

  function showErrors(problems) {
    if (!problems.length) { errorsBox.hidden = true; return; }
    errorsBox.innerHTML = '<strong>Please fix ' + problems.length + (problems.length === 1 ? ' thing' : ' things') + ':</strong><ul>' +
      problems.map(function (p) { return '<li><a href="#" data-target="' + p.name + '">' + S.esc(p.msg) + '</a></li>'; }).join('') + '</ul>';
    errorsBox.hidden = false;
    errorsBox.focus();
  }
  errorsBox.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-target]');
    if (!a) return;
    e.preventDefault();
    var name = a.getAttribute('data-target');
    var el = name === 'services' ? form.querySelector('input[name="services"]') : form.elements[name];
    if (el) el.focus();
  });

  function newId() {
    // RQ- + base-36 timestamp tail: unique enough for a reference number shown to the client.
    return 'RQ-' + Date.now().toString(36).toUpperCase().slice(-6);
  }

  function submit(payload) {
    if (!cfg.rfqEndpoint) return Promise.resolve({ demo: true });
    return fetch(cfg.rfqEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json().catch(function () { return {}; });
    });
  }

  form.addEventListener('input', function (e) {
    if (e.target.removeAttribute) e.target.removeAttribute('aria-invalid');
    updateSummary();
  });
  form.addEventListener('change', updateSummary);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = values();
    if (v.website) return; // honeypot tripped
    var problems = validate(v);
    showErrors(problems);
    if (problems.length) return;

    var payload = Object.assign({}, v, {
      requestId: newId(),
      submittedAt: new Date().toISOString(),
      source: 'sanders-logistics-network-web',
      status: 'Request submitted'
    });
    delete payload.website;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    submit(payload).then(function (res) {
      if (res && res.requestId) payload.requestId = res.requestId;
      var list = S.store(STORE_KEY, []);
      list.unshift(payload);
      S.save(STORE_KEY, list);
      updateCount();
      document.getElementById('confirm-id').textContent = payload.requestId;
      document.getElementById('demo-note').hidden = !(res && res.demo);
      form.hidden = true;
      confirmBox.hidden = false;
      confirmBox.focus();
      window.scrollTo(0, 0);
    }).catch(function () {
      showErrors([{ name: 'email', msg: 'We could not send your request. Please try again, or call ' + cfg.phone + '.' }]);
    }).then(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit request';
    });
  });

  document.getElementById('again').addEventListener('click', function () {
    form.reset();
    updateSummary();
    confirmBox.hidden = true;
    form.hidden = false;
    form.querySelector('input').focus();
  });
  document.getElementById('see-requests').addEventListener('click', function () {
    tabCtl.select(document.getElementById('t-req'), true);
  });

  function updateCount() {
    var n = S.store(STORE_KEY, []).length;
    document.getElementById('req-count').textContent = n ? n : '';
  }

  function renderRequests() {
    var list = S.store(STORE_KEY, []);
    var host = document.getElementById('req-list');
    if (!list.length) {
      host.innerHTML = '<div class="empty">No requests yet. Submitted requests and their status show up here.</div>';
      return;
    }
    host.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr>' +
      '<th scope="col">Request</th><th scope="col">Services</th><th scope="col">Where</th><th scope="col">Volume</th><th scope="col">Inbound</th><th scope="col">Status</th>' +
      '</tr></thead><tbody>' + list.map(function (r) {
        return '<tr><td class="mono">' + S.esc(r.requestId) + '<div class="small muted" style="font-family:var(--font-body)">' +
          S.esc(new Date(r.submittedAt).toLocaleDateString()) + '</div></td>' +
          '<td>' + S.esc(r.services.join(', ')) + '</td>' +
          '<td>' + S.esc(r.location) + '</td>' +
          '<td>' + S.esc(r.quantity + ' ' + r.unit.toLowerCase()) + '</td>' +
          '<td>' + S.esc(r.inboundDate) + '</td>' +
          '<td><span class="badge">' + S.esc(r.status) + '</span></td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="small muted">Status updates from your consultant: Request submitted → Reviewing → Quoted → Won → In storage → Released → Invoiced.</p>';
  }

  updateSummary();
  updateCount();
})();
