(function () {
  'use strict';

  var panels = document.querySelectorAll('[data-app-panel]');
  var navButtons = document.querySelectorAll('[data-app-tab]');
  var installBanner = document.getElementById('install-banner');
  var installBtn = document.getElementById('pwa-install-btn');
  var dismissInstall = document.getElementById('dismiss-install');
  var deferredPrompt = null;

  function showPanel(name) {
    panels.forEach(function (panel) {
      panel.classList.toggle('is-active', panel.getAttribute('data-app-panel') === name);
    });
    navButtons.forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-app-tab') === name);
    });
  }

  navButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      showPanel(btn.getAttribute('data-app-tab'));
    });
  });

  var hash = (window.location.hash || '').replace('#', '');
  if (hash === 'explore' || hash === 'install') showPanel(hash);
  else showPanel('apply');

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    if (installBanner) installBanner.hidden = false;
  });

  if (installBtn) {
    installBtn.addEventListener('click', function () {
      if (!deferredPrompt) {
        showPanel('install');
        if (installBanner) installBanner.hidden = true;
        return;
      }
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () {
        deferredPrompt = null;
        if (installBanner) installBanner.hidden = true;
      });
    });
  }

  if (dismissInstall) {
    dismissInstall.addEventListener('click', function () {
      if (installBanner) installBanner.hidden = true;
      try { sessionStorage.setItem('enm_install_dismissed', '1'); } catch (e) {}
    });
  }

  try {
    if (sessionStorage.getItem('enm_install_dismissed') === '1' && installBanner) {
      installBanner.hidden = true;
    }
  } catch (e) {}

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }

  var langSelect = document.getElementById('app-lang');
  if (langSelect) {
    langSelect.addEventListener('change', function () {
      if (langSelect.value) window.location.href = langSelect.value;
    });
  }

  function showMessage(id, show) {
    var el = document.getElementById(id);
    if (el) el.hidden = !show;
  }

  function submitViaApi(data) {
    return fetch('/api/partner-application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(function (res) {
      return res.json().then(function (body) {
        if (!res.ok) throw new Error(body.error || body.detail || 'Submit failed');
        return true;
      });
    });
  }

  function submitViaSupabase(data) {
    var cfg = window.ENM_FORM_CONFIG || {};
    if (!cfg.supabaseUrl || !cfg.supabaseKey) return Promise.reject(new Error('No Supabase config'));
    if (window.ENMSupabase && window.ENMSupabase.insertPartnerApplication) {
      return window.ENMSupabase.insertPartnerApplication(
        cfg.supabaseUrl,
        cfg.supabaseKey,
        cfg.table || 'partner_applications',
        data
      );
    }
    return Promise.reject(new Error('Supabase client not loaded'));
  }

  var form = document.getElementById('partner-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      showMessage('form-success', false);
      showMessage('form-error', false);

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      var originalText = btn ? btn.textContent : '';
      if (btn) {
        btn.disabled = true;
        btn.textContent = btn.getAttribute('data-loading') || '…';
      }

      var payload = {
        name: form.name.value.trim(),
        organization: form.organization.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim() || null,
        country: form.country.value.trim(),
        site_type: form.site_type.value,
        capacity: form.capacity.value.trim() || null,
        message: form.message.value.trim(),
        language: document.documentElement.lang || 'en',
        source: 'app.energiemind.network',
      };

      submitViaApi(payload)
        .catch(function () { return submitViaSupabase(payload); })
        .then(function () {
          showMessage('form-success', true);
          form.reset();
        })
        .catch(function () {
          showMessage('form-error', true);
        })
        .finally(function () {
          if (btn) {
            btn.disabled = false;
            btn.textContent = originalText;
          }
        });
    });
  }
})();
