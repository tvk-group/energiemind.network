(function () {
  'use strict';

  var TOKEN_KEY = 'enm_admin_token';
  var apps = [];
  var selectedId = null;

  var loginScreen, dashboard, loginForm, loginError, loginBtn, appsBody, loadError;
  var filterStatus, searchInput, modal, detailBody, detailStatus;

  function $(id) {
    return document.getElementById(id);
  }

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
    if (loginScreen) loginScreen.hidden = false;
    if (dashboard) dashboard.hidden = true;
  }

  function showDashboard() {
    if (loginScreen) loginScreen.hidden = true;
    if (dashboard) dashboard.hidden = false;
  }

  function fetchJson(url, options) {
    return fetch(url, options).then(function (r) {
      return r.text().then(function (text) {
        var data = {};
        if (text) {
          try {
            data = JSON.parse(text);
          } catch (e) {
            data = { error: text || 'Invalid server response' };
          }
        }
        return { ok: r.ok, status: r.status, data: data };
      });
    });
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

  function esc(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function updateStats(list) {
    $('stat-total').textContent = list.length;
    $('stat-new').textContent = list.filter(function (a) { return a.status === 'new'; }).length;
    $('stat-review').textContent = list.filter(function (a) { return a.status === 'reviewing'; }).length;
    $('stat-approved').textContent = list.filter(function (a) { return a.status === 'approved'; }).length;
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

  function openDetail(id) {
    var a = apps.find(function (x) { return x.id === id; });
    if (!a) return;
    selectedId = id;
    $('detail-title').textContent = a.organization || a.name;
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
    if (!token()) {
      showLogin();
      return;
    }

    loadError.hidden = true;
    appsBody.innerHTML = '<tr><td colspan="7" class="empty-row">Loading…</td></tr>';

    fetchJson('/api/admin/applications', { headers: authHeaders() })
      .then(function (res) {
        if (res.status === 401) {
          setToken(null);
          showLogin();
          loginError.textContent = 'Session expired. Please sign in again.';
          loginError.hidden = false;
          return;
        }
        if (!res.ok) {
          loadError.textContent = res.data.error || res.data.detail || 'Failed to load applications';
          loadError.hidden = false;
          appsBody.innerHTML = '<tr><td colspan="7" class="empty-row">Could not load data</td></tr>';
          return;
        }
        apps = res.data.applications || [];
        updateStats(apps);
        renderTable();
      })
      .catch(function () {
        loadError.textContent = 'Network error loading applications';
        loadError.hidden = false;
        appsBody.innerHTML = '<tr><td colspan="7" class="empty-row">Network error</td></tr>';
      });
  }

  function handleLogin(e) {
    e.preventDefault();
    loginError.hidden = true;

    var pwInput = $('admin-password');
    var pw = pwInput ? pwInput.value : '';
    if (!pw) return;

    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.textContent = 'Signing in…';
    }

    fetchJson('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
      .then(function (res) {
        if (!res.ok) {
          if (res.status === 503) {
            loginError.textContent = 'Admin not configured. Set ADMIN_PASSWORD in Vercel, then redeploy.';
          } else if (res.status === 401) {
            loginError.textContent = res.data.error || 'Wrong password.';
          } else {
            loginError.textContent = res.data.error || 'Login failed (HTTP ' + res.status + ')';
          }
          loginError.hidden = false;
          return;
        }

        if (!res.data || !res.data.token) {
          loginError.textContent = 'Login succeeded but no session token received.';
          loginError.hidden = false;
          return;
        }

        setToken(res.data.token);
        if (loginForm) loginForm.reset();
        showDashboard();
        loadApps();
      })
      .catch(function () {
        loginError.textContent = 'Network error — could not reach login API.';
        loginError.hidden = false;
      })
      .finally(function () {
        if (loginBtn) {
          loginBtn.disabled = false;
          loginBtn.textContent = 'Sign in';
        }
      });
  }

  function init() {
    loginScreen = $('login-screen');
    dashboard = $('dashboard');
    loginForm = $('login-form');
    loginError = $('login-error');
    loginBtn = loginForm ? loginForm.querySelector('button[type="submit"]') : null;
    appsBody = $('apps-body');
    loadError = $('load-error');
    filterStatus = $('filter-status');
    searchInput = $('search-input');
    modal = $('detail-modal');
    detailBody = $('detail-body');
    detailStatus = $('detail-status');

    if (!loginForm) {
      console.error('Admin: login form not found');
      return;
    }

    loginForm.addEventListener('submit', handleLogin);

    var logoutBtn = $('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        setToken(null);
        showLogin();
      });
    }

    var refreshBtn = $('refresh-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', loadApps);

    if (filterStatus) filterStatus.addEventListener('change', renderTable);
    if (searchInput) searchInput.addEventListener('input', renderTable);

    var modalClose = $('modal-close');
    if (modalClose) modalClose.addEventListener('click', function () { modal.close(); });

    var saveStatus = $('save-status');
    if (saveStatus) {
      saveStatus.addEventListener('click', function () {
        if (!selectedId) return;
        saveStatus.disabled = true;

        fetchJson('/api/admin/applications', {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ id: selectedId, status: detailStatus.value }),
        })
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
            saveStatus.disabled = false;
          });
      });
    }

    if (token()) {
      showDashboard();
      loadApps();
    } else {
      showLogin();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
