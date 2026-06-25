(function () {
  'use strict';

  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.main-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
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
        source: 'energiemind.network',
      };

      submitViaApi(payload)
        .catch(function () {
          return submitViaSupabase(payload);
        })
        .then(function () {
          showMessage('form-success', true);
          form.reset();
          document.getElementById('form-success').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

  var sections = document.querySelectorAll('section[id]');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.getAttribute('id');
            document.querySelectorAll('.main-nav a').forEach(function (a) {
              a.classList.toggle('active', a.getAttribute('href') === '#' + id);
            });
          }
        });
      },
      { rootMargin: '-40% 0px -50% 0px' }
    );
    sections.forEach(function (s) { observer.observe(s); });
  }
})();
