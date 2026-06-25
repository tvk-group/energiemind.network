(function () {
  'use strict';

  var TOKEN_KEY = 'enm_admin_token';
  var apps = [];
  var selectedId = null;

  var loginScreen = document.getElementById('login-screen');
  var dashboard = document.getElementById('dashboard');
  var loginForm = document.getElementById('login-form');
  var loginError = document.getElementById('login-error');
  var appsBody = document.getElementById('apps-body');
  var loadError = document.getElementById('load-error');
  var filterStatus = document.getElementById('filter-status');
  var searchInput = document.getElementById('search-input');
  var modal = document.getElementById('detail-modal');
  var detailBody = document.getElementById('detail-body');
  var detailStatus = document.getElementById('detail-status');

  function token() {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  function setToken(t) {
    if (t) sessionStorage.setItem(TOKEN_KEY, t);
    else sessionStorage.removeItem(TOKEN_KEY);
  }

  function authHeaders() {
    return {
      Authorization: 'Bearer ' + token(),
      'Content-Type': 'application/json',
    };
  }

  function showLogin() {
    loginScreen.hidden = false;
    dashboard.hidden = true;
  }

  function showDashboard() {
    loginScreen.hidden = true;
    dashboard.hidden = false;
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function statusPill(s) {
    return '<span class="status-pill status-' + s + '">' + s + '</span>';
  }

  function updateStats(list) {
    document.getElementById('stat-total').textContent = list.length;
    document.getElementById('stat-new').textContent = list.filter(function (a) { return a.status === 'new'; }).length;
    document.getElementById('stat-review').textContent = list.filter(function (a) { return a.status === 'reviewing'; }).length;
    document.getElementById('stat-approved').textContent = list.filter(function (a) { return a.status === 'approved'; }).length;
  }

  function filteredApps() {
    var q = (searchInput.value || '').toLowerCase().trim();
    var st = filterStatus.value;
    return apps.filter(function (a) {
      if (st && a.status !== st) return false;
      if (!q) return true;
      var hay = [a.name, a.organization, a.email, a.country, a.site_type].join(' ').toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  function renderTable() {
    var list = filteredApps();
    if (!list.length) {
      appsBody.innerHTML = '<tr><td colspan="7" class="empty-row">No applications found</td></tr>';
      return;
    }
    appsBody.innerHTML = list.map(function (a) {
      return '<tr>' +
        '<td>' + fmtDate(a.created_at) + '</td>' +
        '<td>' + esc(a.name) + '</td>' +
        '<td>' + esc(a.organization) + '</td>' +
        '<td>' + esc(a.site_type) + '</td>' +
        '<td>' + esc(a.country) + '</td>' +
        '<td>' + statusPill(a.status || 'new') + '</td>' +
        '<td><button type="button" class="btn-view" data-id="' + a.id + '">View</button></td>' +
        '</tr>';
    }).join('');

    appsBody.querySelectorAll('.btn-view').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openDetail(btn.getAttribute('data-id'));
      });
    });
  }

  function esc(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function openDetail(id) {
    var a = apps.find(function (x) { return x.id === id; });
    if (!a) return;
    selectedId = id;
    document.getElementById('detail-title').textContent = a.organization || a.name;
    detailStatus.value = a.status || 'new';
    detailBody.innerHTML =
      row('Date', fmtDate(a.created_at)) +
      row('Name', a.name) +
      row('Organization', a.organization) +
      row('Email', '<a href="mailto:' + esc(a.email) + '">' + esc(a.email) + '</a>') +
      row('Phone', a.phone || '—') +
      row('Country', a.country) +
      row('Site type', a.site_type) +
      row('Capacity', a.capacity || '—') +
      row('Language', a.language || '—') +
      row('Message', esc(a.message).replace(/\n/g, '<br>'));
    modal.showModal();
  }

  function row(label, val) {
    return '<dl class="detail-row"><dt>' + label + '</dt><dd>' + val + '</dd></dl>';
  }

  function loadApps() {
    loadError.hidden = true;
    appsBody.innerHTML = '<tr><td colspan="7" class="empty-row">Loading…</td></tr>';

    fetch('/api/admin/applications', { headers: authHeaders() })
      .then(function (r) {
        if (r.status === 401) { setToken(null); showLogin(); throw new Error('Session expired'); }
        return r.json().then(function (d) { return { ok: r.ok, data: d }; });
      })
      .then(function (res) {
        if (!res.ok) throw new Error(res.data.error || 'Failed to load');
        apps = res.data.applications || [];
        updateStats(apps);
        renderTable();
      })
      .catch(function (err) {
        loadError.textContent = err.message || 'Could not load applications';
        loadError.hidden = false;
        appsBody.innerHTML = '<tr><td colspan="7" class="empty-row">Error loading data</td></tr>';
      });
  }

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    loginError.hidden = true;
    var pw = document.getElementById('admin-password').value;

    fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        if (!res.ok) {
          loginError.textContent = res.data.error || 'Login failed';
          loginError.hidden = false;
          return;
        }
        setToken(res.data.token);
        loginForm.reset();
        showDashboard();
        loadApps();
      })
      .catch(function () {
        loginError.textContent = 'Connection error';
        loginError.hidden = false;
      });
  });

  document.getElementById('logout-btn').addEventListener('click', function () {
    setToken(null);
    showLogin();
  });

  document.getElementById('refresh-btn').addEventListener('click', loadApps);
  filterStatus.addEventListener('change', renderTable);
  searchInput.addEventListener('input', renderTable);

  document.getElementById('modal-close').addEventListener('click', function () {
    modal.close();
  });

  document.getElementById('save-status').addEventListener('click', function () {
    if (!selectedId) return;
    var btn = document.getElementById('save-status');
    btn.disabled = true;

    fetch('/api/admin/applications', {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ id: selectedId, status: detailStatus.value }),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.data.error || 'Update failed');
        var idx = apps.findIndex(function (a) { return a.id === selectedId; });
        if (idx >= 0) apps[idx] = res.data.application;
        updateStats(apps);
        renderTable();
        modal.close();
      })
      .catch(function (err) {
        alert(err.message);
      })
      .finally(function () {
        btn.disabled = false;
      });
  });

  if (token()) {
    showDashboard();
    loadApps();
  } else {
    showLogin();
  }
})();
