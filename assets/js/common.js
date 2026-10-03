// Shared helpers: fill contact details from config, small DOM utilities.
(function () {
  var cfg = window.SANDERS_CONFIG || {};

  function fillContact() {
    document.querySelectorAll('[data-cfg]').forEach(function (el) {
      var key = el.getAttribute('data-cfg');
      var val = cfg[key];
      if (!val) { el.hidden = true; return; }
      if (key === 'email') {
        el.innerHTML = '';
        var a = document.createElement('a');
        a.href = 'mailto:' + val;
        a.textContent = val;
        el.appendChild(a);
      } else if (key === 'phone') {
        el.innerHTML = '';
        var p = document.createElement('a');
        p.href = cfg.phoneHref || 'tel:' + val.replace(/\D/g, '');
        p.textContent = val;
        el.appendChild(p);
      } else {
        el.textContent = val;
      }
    });
    // Header phone button: <a data-cfg-href="phone"> + <span data-cfg-text="phone">.
    document.querySelectorAll('[data-cfg-href="phone"]').forEach(function (a) {
      a.href = cfg.phoneHref || 'tel:' + String(cfg.phone || '').replace(/\D/g, '');
      a.setAttribute('aria-label', 'Call Sanders at ' + cfg.phone);
    });
    document.querySelectorAll('[data-cfg-text]').forEach(function (el) {
      el.textContent = cfg[el.getAttribute('data-cfg-text')] || '';
    });
    // Sentences that only make sense with a committed response time.
    document.querySelectorAll('[data-response-time]').forEach(function (el) {
      el.textContent = cfg.responseTime
        ? el.getAttribute('data-with').replace('{t}', cfg.responseTime)
        : el.getAttribute('data-without');
    });
    var year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
  }

  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }

  function store(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode */ }
  }

  // Simple tab controller: buttons with [role=tab][aria-controls].
  function tabs(container, onChange) {
    var btns = Array.prototype.slice.call(container.querySelectorAll('[role="tab"]'));
    function select(btn, focus) {
      btns.forEach(function (b) {
        var on = b === btn;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(b.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) btn.focus();
      if (onChange) onChange(btn);
    }
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { select(b); });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          var n = (i + (e.key === 'ArrowRight' ? 1 : -1) + btns.length) % btns.length;
          select(btns[n], true);
          e.preventDefault();
        }
      });
    });
    return { select: select, buttons: btns };
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  window.Sanders = { cfg: cfg, toast: toast, store: store, save: save, tabs: tabs, esc: esc };
  document.addEventListener('DOMContentLoaded', fillContact);
})();
