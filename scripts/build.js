#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public');
const languages = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/languages.json'), 'utf8'));
const siteConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/site.json'), 'utf8'));
const DOMAIN = siteConfig.domain;
const APP_URL = siteConfig.appUrl || 'https://app.energiemind.network';
const EN = loadTranslation('en');

function withDefaults(t) {
  return {
    ...t,
    hero: { ...EN.hero, ...t.hero },
    partnerApp: { ...EN.partnerApp, ...(t.partnerApp || {}) },
    footer: {
      ...t.footer,
      links: { ...(EN.footer && EN.footer.links ? EN.footer.links : {}) , ...(t.footer && t.footer.links ? t.footer.links : {}) },
    },
  };
}

function loadTranslation(code) {
  const file = path.join(ROOT, 'content', `${code}.json`);
  if (!fs.existsSync(file)) throw new Error(`Missing translation: ${code}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function hreflangLinks(currentCode) {
  return languages
    .map((lang) => {
      const href = `${DOMAIN}/${lang.code}/`;
      return `  <link rel="alternate" hreflang="${lang.hreflang}" href="${href}" />`;
    })
    .concat(`  <link rel="alternate" hreflang="x-default" href="${DOMAIN}/en/" />`)
    .join('\n');
}

function langSwitcher(currentCode, t) {
  const options = languages
    .map((lang) => {
      const selected = lang.code === currentCode ? ' selected' : '';
      return `<option value="/${lang.code}/"${selected}>${esc(lang.name)}</option>`;
    })
    .join('\n');
  return `<label class="lang-label" for="lang-select">${esc(t.nav.language)}</label>
          <select id="lang-select" class="lang-select" aria-label="${esc(t.nav.language)}" onchange="if(this.value)window.location.href=this.value">
            ${options}
          </select>`;
}

function navLinks(t) {
  const items = [
    ['#partner-network', t.nav.partnerNetwork],
    ['#pilot-sites', t.nav.pilotSites],
    ['#mining-heat', t.nav.miningHeat],
    ['#solar-mining', t.nav.solarMining],
    ['#commercial-buildings', t.nav.commercial],
    ['#greenhouses', t.nav.greenhouses],
    ['#farms', t.nav.farms],
    ['#data-centers', t.nav.dataCenters],
    ['#application', t.nav.application],
    ['#faq', t.nav.faq],
  ];
  return items
    .map(([href, label]) => `<li><a href="${href}">${esc(label)}</a></li>`)
    .join('\n            ');
}

const SECTION_ICONS = {
  'partner-network': '◈',
  'pilot-sites': '◎',
  'mining-heat': '♨',
  'solar-mining': '☀',
  'commercial-buildings': '▣',
  'greenhouses': '❖',
  'farms': '⌂',
  'data-centers': '⬡',
};

function sectionBlock(section, reverse = false, toneIndex = 0) {
  const items = section.items
    .map((item) => {
      const link = item.link
        ? `<a href="${item.link}" class="card-link">${esc(item.title)} →</a>`
        : `<h3>${esc(item.title)}</h3>`;
      const heading = item.link ? '' : `<h3>${esc(item.title)}</h3>`;
      return `<article class="feature-card">
              ${item.link ? link : heading}
              <p>${esc(item.text)}</p>
            </article>`;
    })
    .join('\n          ');

  return `<section id="${section.id}" class="section section-tone-${toneIndex % 4} ${reverse ? 'section-alt' : ''}" aria-labelledby="${section.id}-title">
      <div class="container">
        <header class="section-header">
          <span class="section-icon" aria-hidden="true">${SECTION_ICONS[section.id] || '◆'}</span>
          <h2 id="${section.id}-title">${esc(section.title)}</h2>
          <p class="section-subtitle">${esc(section.subtitle)}</p>
        </header>
        <p class="section-intro">${esc(section.intro)}</p>
        <div class="feature-grid">
          ${items}
        </div>
        <div class="section-cta">
          <a href="#application" class="btn btn-secondary">${esc(section.cta)}</a>
        </div>
      </div>
    </section>`;
}

function faqBlock(t) {
  const items = t.faq.items
    .map(
      (item, i) => `<details class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
          <summary itemprop="name">${esc(item.q)}</summary>
          <div class="faq-answer" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
            <p itemprop="text">${esc(item.a)}</p>
          </div>
        </details>`
    )
    .join('\n        ');
  return items;
}

function formBlock(t) {
  const opts = t.form.fields.siteTypeOptions
    .map((o) => `<option value="${esc(o)}">${esc(o)}</option>`)
    .join('\n              ');
  return `<form class="partner-form" id="partner-form" action="#" method="post" novalidate>
          <div class="form-row">
            <div class="form-group">
              <label for="name">${esc(t.form.fields.name)}</label>
              <input type="text" id="name" name="name" required placeholder="${esc(t.form.fields.namePlaceholder)}" autocomplete="name" />
            </div>
            <div class="form-group">
              <label for="organization">${esc(t.form.fields.organization)}</label>
              <input type="text" id="organization" name="organization" required placeholder="${esc(t.form.fields.organizationPlaceholder)}" autocomplete="organization" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="email">${esc(t.form.fields.email)}</label>
              <input type="email" id="email" name="email" required placeholder="${esc(t.form.fields.emailPlaceholder)}" autocomplete="email" />
            </div>
            <div class="form-group">
              <label for="phone">${esc(t.form.fields.phone)}</label>
              <input type="tel" id="phone" name="phone" placeholder="${esc(t.form.fields.phonePlaceholder)}" autocomplete="tel" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="country">${esc(t.form.fields.country)}</label>
              <input type="text" id="country" name="country" required placeholder="${esc(t.form.fields.countryPlaceholder)}" autocomplete="country-name" />
            </div>
            <div class="form-group">
              <label for="site-type">${esc(t.form.fields.siteType)}</label>
              <select id="site-type" name="site_type" required>
                <option value="" disabled selected>—</option>
                ${opts}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="capacity">${esc(t.form.fields.capacity)}</label>
            <input type="text" id="capacity" name="capacity" placeholder="${esc(t.form.fields.capacityPlaceholder)}" />
          </div>
          <div class="form-group">
            <label for="message">${esc(t.form.fields.message)}</label>
            <textarea id="message" name="message" rows="5" required placeholder="${esc(t.form.fields.messagePlaceholder)}"></textarea>
          </div>
          <p class="form-disclaimer">${esc(t.form.disclaimer)}</p>
          <button type="submit" class="btn btn-primary btn-lg" data-loading="${esc(t.form.submitting || '…')}">${esc(t.form.submit)}</button>
          <p class="form-success" id="form-success" hidden>${esc(t.form.success)}</p>
          <p class="form-error" id="form-error" hidden>${esc(t.form.error || 'Something went wrong. Please try again or email partners@energiemind.network.')}</p>
        </form>`;
}

function partnerAppBlock(t) {
  const p = t.partnerApp;
  return `<section id="partner-app" class="section section-tone-1 partner-app-section" aria-labelledby="partner-app-heading">
      <div class="container">
        <div class="partner-app-card">
          <div class="partner-app-copy">
            <div class="kicker">${esc(p.kicker)}</div>
            <h2 id="partner-app-heading">${esc(p.headline)} <strong>${esc(p.domain)}</strong></h2>
            <p>${esc(p.description)}</p>
            <div class="partner-app-actions">
              <a class="btn btn-primary" href="${APP_URL}" rel="noopener noreferrer">${esc(p.ctaOpen)} →</a>
              <a class="btn btn-outline" href="#partner-app-install">${esc(p.ctaInstall)}</a>
            </div>
          </div>
          <div class="partner-app-install" id="partner-app-install">
            <div class="install-step">
              <span class="install-platform">${esc(p.iosLabel)}</span>
              <p>${esc(p.iosSteps)}</p>
            </div>
            <div class="install-step">
              <span class="install-platform">${esc(p.androidLabel)}</span>
              <p>${esc(p.androidSteps)}</p>
            </div>
            <div class="install-step">
              <span class="install-platform">${esc(p.desktopLabel)}</span>
              <p>${esc(p.desktopSteps)}</p>
            </div>
          </div>
        </div>
      </div>
    </section>`;
}

function appLangSwitcher(currentCode, t) {
  const options = languages
    .map((lang) => {
      const selected = lang.code === currentCode ? ' selected' : '';
      return `<option value="/app/${lang.code}/"${selected}>${esc(lang.name)}</option>`;
    })
    .join('\n');
  return `<label class="sr-only" for="app-lang">${esc(t.nav.language)}</label>
          <select id="app-lang" aria-label="${esc(t.nav.language)}">
            ${options}
          </select>`;
}

function appExploreLinks(langCode, t) {
  const base = `/${langCode}/#`;
  const links = [
    ['partner-network', t.sections.partnerNetwork.title, t.sections.partnerNetwork.subtitle],
    ['pilot-sites', t.sections.pilotSites.title, t.sections.pilotSites.subtitle],
    ['mining-heat', t.sections.miningHeat.title, t.sections.miningHeat.subtitle],
    ['solar-mining', t.sections.solarMining.title, t.sections.solarMining.subtitle],
    ['greenhouses', t.sections.greenhouses.title, t.sections.greenhouses.subtitle],
    ['farms', t.sections.farms.title, t.sections.farms.subtitle],
    ['data-centers', t.sections.dataCenters.title, t.sections.dataCenters.subtitle],
  ];
  return links
    .map(
      ([id, title, subtitle]) =>
        `<a class="quick-link" href="${base}${id}"><strong>${esc(title)}</strong><span>${esc(subtitle)}</span></a>`
    )
    .join('\n            ');
}

function buildAppPage(lang, t) {
  const p = t.partnerApp;
  const canonical = `${DOMAIN}/app/${lang.code}/`;
  const siteHome = `/${lang.code}/`;

  return `<!DOCTYPE html>
<html lang="${lang.hreflang}" dir="${lang.dir}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="robots" content="index, follow" />
  <title>${esc(t.brand)} — Partner App</title>
  <meta name="description" content="${esc(p.description)}" />
  <link rel="canonical" href="${canonical}" />
  <meta name="theme-color" content="#141c28" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-title" content="EnergieMIND" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="mobile-web-app-capable" content="yes" />
  <link rel="manifest" href="/assets/web-app-manifest.json" />
  <link rel="icon" href="/assets/images/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/assets/images/apple-touch-icon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&amp;display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/css/app.css" />
</head>
<body>
  <div class="app-root">
    <header class="app-header">
      <div class="app-header-inner">
        <a class="app-logo" href="${siteHome}" aria-label="${esc(t.brand)}">
          <img src="/assets/images/logo-light.svg" alt="${esc(t.brand)}" width="160" height="36" />
        </a>
        <div class="app-lang">${appLangSwitcher(lang.code, t)}</div>
      </div>
    </header>

    <main class="app-main">
      <div class="app-hero">
        <span class="kicker">${esc(p.kicker)}</span>
        <h1>${esc(p.appApplyTitle)}</h1>
        <p>${esc(p.appApplyIntro)}</p>
      </div>

      <section class="app-panel is-active" data-app-panel="apply" aria-label="${esc(p.tabApply)}">
        ${formBlock(t)}
      </section>

      <section class="app-panel" data-app-panel="explore" aria-label="${esc(p.tabExplore)}">
        <h2 style="margin:0 0 1rem;font-size:1.1rem;">${esc(p.appExploreTitle)}</h2>
        <div class="quick-links">
          ${appExploreLinks(lang.code, t)}
        </div>
      </section>

      <section class="app-panel" data-app-panel="install" aria-label="${esc(p.tabInstall)}">
        <h2 style="margin:0 0 1rem;font-size:1.1rem;">${esc(p.appInstallTitle)}</h2>
        <div class="install-steps">
          <div class="install-step"><span class="platform">${esc(p.iosLabel)}</span><p>${esc(p.iosSteps)}</p></div>
          <div class="install-step"><span class="platform">${esc(p.androidLabel)}</span><p>${esc(p.androidSteps)}</p></div>
          <div class="install-step"><span class="platform">${esc(p.desktopLabel)}</span><p>${esc(p.desktopSteps)}</p></div>
        </div>
        <p style="margin:1rem 0 0;color:var(--muted);font-size:0.875rem;">App Store listing planned for Phase 2.</p>
      </section>

      <p class="app-footer"><a href="${siteHome}">← ${esc(p.backToSite)}</a></p>
    </main>

    <div id="install-banner" class="install-banner" hidden>
      <p>${esc(p.stickyText)}</p>
      <div class="install-banner-actions">
        <button type="button" class="btn btn-primary" id="pwa-install-btn">Install</button>
        <button type="button" class="btn btn-outline" id="dismiss-install">${esc(p.stickyDismiss)}</button>
      </div>
    </div>

    <nav class="app-nav" aria-label="App navigation">
      <button type="button" class="is-active" data-app-tab="apply"><span class="icon">✎</span>${esc(p.tabApply)}</button>
      <button type="button" data-app-tab="explore"><span class="icon">◎</span>${esc(p.tabExplore)}</button>
      <button type="button" data-app-tab="install"><span class="icon">⬇</span>${esc(p.tabInstall)}</button>
    </nav>
  </div>

  <script src="/assets/js/supabase-client.js" defer></script>
  <script src="/assets/js/form-config.js" defer></script>
  <script src="/assets/js/app.js" defer></script>
</body>
</html>`;
}

function jsonLd(t, lang, canonical) {
  const org = siteConfig.organization;
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: org.name,
      legalName: org.legalName,
      url: org.url,
      logo: org.logo,
      email: org.email,
      foundingDate: org.foundingDate,
      sameAs: org.sameAs,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'partner inquiries',
        email: org.email,
        availableLanguage: languages.map((l) => l.hreflang),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: t.brand,
      url: canonical,
      description: t.meta.description,
      inLanguage: lang.hreflang,
      publisher: { '@type': 'Organization', name: org.name, url: org.url },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${DOMAIN}/${lang.code}/#application`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: t.breadcrumbs.home,
          item: canonical,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: t.breadcrumbs.network,
          item: `${canonical}#partner-network`,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: t.meta.title,
      description: t.meta.description,
      author: { '@type': 'Organization', name: org.name },
      publisher: {
        '@type': 'Organization',
        name: org.name,
        logo: { '@type': 'ImageObject', url: org.logo },
      },
      mainEntityOfPage: canonical,
      inLanguage: lang.hreflang,
      datePublished: '2026-01-15',
      dateModified: '2026-06-25',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: t.faq.items.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ];
  return `<script type="application/ld+json">\n${JSON.stringify(schemas, null, 2)}\n</script>`;
}

function buildPage(lang, t) {
  const canonical = `${DOMAIN}/${lang.code}/`;
  const homeUrl = `/${lang.code}/`;
  const ogImage = `${DOMAIN}/assets/images/og-default.svg`;
  const stats = t.hero.stats
    .map((s) => `<div class="stat"><span class="stat-value">${esc(s.value)}</span><span class="stat-label">${esc(s.label)}</span></div>`)
    .join('\n          ');

  const sections = Object.values(t.sections);
  const sectionHtml = sections.map((s, i) => sectionBlock(s, i % 2 === 1, i)).join('\n\n    ');

  return `<!DOCTYPE html>
<html lang="${lang.hreflang}" dir="${lang.dir}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(t.meta.title)}</title>
  <meta name="description" content="${esc(t.meta.description)}" />
  <meta name="keywords" content="${esc(t.meta.keywords)}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta name="author" content="TVK Labs &amp; Technologies LTD" />
  <meta name="googlebot" content="index, follow" />
  <meta name="bingbot" content="index, follow" />
  <meta name="yandex" content="index, follow" />
  <meta name="baiduspider" content="index, follow" />
  <link rel="canonical" href="${canonical}" />
${hreflangLinks(lang.code)}
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:site_name" content="${esc(t.brand)}" />
  <meta property="og:title" content="${esc(t.meta.ogTitle)}" />
  <meta property="og:description" content="${esc(t.meta.ogDescription)}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:locale" content="${lang.locale.replace('_', '-')}" />
${languages.filter((l) => l.code !== lang.code).map((l) => `  <meta property="og:locale:alternate" content="${l.locale.replace('_', '-')}" />`).join('\n')}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(t.meta.twitterTitle)}" />
  <meta name="twitter:description" content="${esc(t.meta.twitterDescription)}" />
  <meta name="twitter:image" content="${ogImage}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&amp;family=JetBrains+Mono:wght@500;600&amp;display=swap" rel="stylesheet" />
  <link rel="icon" href="/assets/images/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/assets/images/apple-touch-icon.svg" />
  <link rel="stylesheet" href="/assets/css/style.css" />
  ${jsonLd(t, lang, canonical)}
</head>
<body>
  <a class="skip-link" href="#main">${esc(t.skipLink)}</a>
  <header class="site-header" role="banner">
    <div class="container header-inner">
      <a href="${homeUrl}" class="logo" aria-label="${esc(t.brand)}" title="${esc(t.brand)}">
        <img src="/assets/images/logo-light.svg" alt="${esc(t.brand)}" width="200" height="44" />
      </a>
      <button class="menu-toggle" aria-expanded="false" aria-controls="main-nav" aria-label="${esc(t.menuToggle)}">
        <span></span><span></span><span></span>
      </button>
      <nav id="main-nav" class="main-nav" role="navigation" aria-label="Main">
        <ul>
            ${navLinks(t)}
        </ul>
      </nav>
      <div class="header-actions">
        ${langSwitcher(lang.code, t)}
        <a href="#application" class="btn btn-primary btn-sm">${esc(t.nav.apply)}</a>
      </div>
    </div>
  </header>

  <main id="main">
    <section id="top" class="hero" aria-labelledby="hero-title">
      <div class="hero-bg"></div>
      <div class="container hero-content">
        <span class="hero-badge">${esc(t.hero.badge)}</span>
        <h1 id="hero-title">${esc(t.hero.title)}</h1>
        <p class="hero-subtitle">${esc(t.hero.subtitle)}</p>
        <div class="hero-actions">
          <a href="#application" class="btn btn-primary btn-lg">${esc(t.hero.cta)}</a>
          <a href="#pilot-sites" class="btn btn-outline btn-lg">${esc(t.hero.secondary)}</a>
          <a href="${APP_URL}" class="btn btn-outline btn-lg" rel="noopener noreferrer">${esc(t.hero.appCta)}</a>
        </div>
        <div class="hero-stats">
          ${stats}
        </div>
      </div>
    </section>

    ${sectionHtml}

    ${partnerAppBlock(t)}

    <section id="enm-notice" class="section section-tone-2 enm-section" aria-labelledby="enm-title">
      <div class="container">
        <div class="enm-card">
          <h2 id="enm-title">${esc(t.enm.title)}</h2>
          <p>${esc(t.enm.text)}</p>
        </div>
      </div>
    </section>

    <section id="application" class="section section-tone-3 section-alt" aria-labelledby="application-title">
      <div class="container">
        <header class="section-header">
          <h2 id="application-title">${esc(t.form.title)}</h2>
          <p class="section-subtitle">${esc(t.form.subtitle)}</p>
        </header>
        ${formBlock(t)}
      </div>
    </section>

    <section id="faq" class="section section-tone-0" aria-labelledby="faq-title" itemscope itemtype="https://schema.org/FAQPage">
      <div class="container">
        <header class="section-header">
          <h2 id="faq-title">${esc(t.faq.title)}</h2>
          <p class="section-subtitle">${esc(t.faq.subtitle)}</p>
        </header>
        <div class="faq-list">
        ${faqBlock(t)}
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer" role="contentinfo">
    <div class="container footer-grid">
      <div class="footer-brand">
        <a href="${homeUrl}" class="footer-logo" aria-label="${esc(t.brand)}">
          <img src="/assets/images/logo-light.svg" alt="${esc(t.brand)}" width="180" height="40" />
        </a>
        <p>${esc(t.footer.about)}</p>
      </div>
      <nav class="footer-nav" aria-label="Footer">
        <h3>${esc(t.nav.partnerNetwork)}</h3>
        <ul>
          <li><a href="#partner-network">${esc(t.footer.links.network)}</a></li>
          <li><a href="#pilot-sites">${esc(t.footer.links.pilots)}</a></li>
          <li><a href="#application">${esc(t.footer.links.apply)}</a></li>
          <li><a href="${APP_URL}" rel="noopener noreferrer">${esc(t.footer.links.app || 'Partner App')}</a></li>
          <li><a href="#faq">${esc(t.footer.links.faq)}</a></li>
          <li><a href="#mining-heat">${esc(t.nav.miningHeat)}</a></li>
          <li><a href="#solar-mining">${esc(t.nav.solarMining)}</a></li>
          <li><a href="#greenhouses">${esc(t.nav.greenhouses)}</a></li>
          <li><a href="#farms">${esc(t.nav.farms)}</a></li>
          <li><a href="#data-centers">${esc(t.nav.dataCenters)}</a></li>
        </ul>
      </nav>
      <div class="footer-contact">
        <h3>${esc(t.nav.application)}</h3>
        <p><a href="mailto:${siteConfig.organization.email}">${esc(t.footer.contact)}</a></p>
        <p class="footer-legal">${esc(t.footer.legal)}</p>
        <p><a href="#">${esc(t.footer.privacy)}</a> · <a href="#">${esc(t.footer.terms)}</a></p>
      </div>
    </div>
  </footer>

  <div id="site-app-banner" class="site-app-banner" hidden>
    <p>${esc(t.partnerApp.stickyText)} · <strong>${esc(t.partnerApp.domain)}</strong></p>
    <div class="site-app-banner-actions">
      <a class="btn btn-primary btn-sm" href="${APP_URL}" rel="noopener noreferrer">${esc(t.partnerApp.ctaOpen)}</a>
      <button type="button" class="btn btn-outline btn-sm" id="site-app-dismiss">${esc(t.partnerApp.stickyDismiss)}</button>
    </div>
  </div>

  <script src="/assets/js/supabase-client.js" defer></script>
  <script src="/assets/js/form-config.js" defer></script>
  <script src="/assets/js/main.js" defer></script>
</body>
</html>`;
}

function buildSitemap(langCode) {
  const url = `${DOMAIN}/${langCode}/`;
  const lastmod = '2026-06-25';
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
${languages.map((l) => `    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${DOMAIN}/${l.code}/" />`).join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${DOMAIN}/en/" />
  </url>
</urlset>`;
}

function buildSitemapIndex() {
  const entries = languages
    .map(
      (l) => `  <sitemap>
    <loc>${DOMAIN}/sitemaps/sitemap-${l.code}.xml</loc>
    <lastmod>2026-06-25</lastmod>
  </sitemap>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;
}

function buildRobots() {
  return `User-agent: *
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Yandex
Allow: /

User-agent: Baiduspider
Allow: /

Sitemap: ${DOMAIN}/sitemap-index.xml

# Admin dashboard — noindex
User-agent: *
Disallow: /admin/
Disallow: /partner-admin/
`;
}

function buildRootRedirect() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0; url=/en/" />
  <link rel="canonical" href="${DOMAIN}/en/" />
  <title>EnergieMIND Network</title>
  <script>window.location.replace('/en/');</script>
</head>
<body>
  <p><a href="/en/">EnergieMIND Network</a></p>
</body>
</html>`;
}

function buildAppRedirect() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0; url=/app/en/" />
  <link rel="canonical" href="${DOMAIN}/app/en/" />
  <title>EnergieMIND Partner App</title>
  <script>window.location.replace('/app/en/');</script>
</head>
<body>
  <p><a href="/app/en/">EnergieMIND Partner App</a></p>
</body>
</html>`;
}

async function generateIcons() {
  try {
    const sharp = require('sharp');
    const svgPath = path.join(ROOT, 'assets/images/apple-touch-icon.svg');
    const outDir = path.join(OUT, 'assets/images');
    for (const size of [180, 192, 512]) {
      const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`;
      await sharp(svgPath).resize(size, size).png().toFile(path.join(outDir, name));
    }
    console.log('  ✓ PWA icons (PNG)');
  } catch (err) {
    console.warn('  ⚠ PWA icons skipped:', err.message);
  }
}

function buildFormConfig() {
  const config = {
    supabaseUrl:
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
    supabaseKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '',
    table: process.env.SUPABASE_TABLE || 'partner_applications',
  };
  return `window.ENM_FORM_CONFIG = ${JSON.stringify(config)};\n`;
}

function bundleSupabaseClient() {
  esbuild.buildSync({
    entryPoints: [path.join(ROOT, 'utils/supabase/browser-entry.js')],
    outfile: path.join(OUT, 'assets/js/supabase-client.js'),
    bundle: true,
    format: 'iife',
    globalName: 'ENMSupabase',
    platform: 'browser',
    minify: true,
  });
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

function main() {
  console.log('Building energiemind.network...');

  if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true });
  ensureDir(OUT);

  copyDir(path.join(ROOT, 'assets'), path.join(OUT, 'assets'));
  bundleSupabaseClient();
  fs.writeFileSync(path.join(OUT, 'assets', 'js', 'form-config.js'), buildFormConfig(), 'utf8');
  console.log('  ✓ /assets/ (+ supabase-client.js)');

  return generateIcons().then(function () {
    for (const lang of languages) {
      const t = withDefaults(loadTranslation(lang.code));
      const outDir = path.join(OUT, lang.code);
      ensureDir(outDir);
      fs.writeFileSync(path.join(outDir, 'index.html'), buildPage(lang, t), 'utf8');
      console.log(`  ✓ /${lang.code}/index.html`);
    }

    ensureDir(path.join(OUT, 'app'));
    fs.writeFileSync(path.join(OUT, 'app', 'index.html'), buildAppRedirect(), 'utf8');
    console.log('  ✓ /app/index.html (redirect)');
    for (const lang of languages) {
      const t = withDefaults(loadTranslation(lang.code));
      const appDir = path.join(OUT, 'app', lang.code);
      ensureDir(appDir);
      fs.writeFileSync(path.join(appDir, 'index.html'), buildAppPage(lang, t), 'utf8');
      console.log(`  ✓ /app/${lang.code}/index.html`);
    }

    fs.copyFileSync(path.join(ROOT, 'sw.js'), path.join(OUT, 'sw.js'));
    console.log('  ✓ /sw.js');

    ensureDir(path.join(OUT, 'sitemaps'));
    for (const lang of languages) {
      fs.writeFileSync(
        path.join(OUT, 'sitemaps', `sitemap-${lang.code}.xml`),
        buildSitemap(lang.code),
        'utf8'
      );
    }
    fs.writeFileSync(path.join(OUT, 'sitemap-index.xml'), buildSitemapIndex(), 'utf8');
    fs.writeFileSync(path.join(OUT, 'robots.txt'), buildRobots(), 'utf8');
    fs.writeFileSync(path.join(OUT, 'index.html'), buildRootRedirect(), 'utf8');

    ensureDir(path.join(OUT, 'admin'));
    ensureDir(path.join(OUT, 'partner-admin'));
    const adminSrc = path.join(ROOT, 'admin', 'index.html');
    fs.copyFileSync(adminSrc, path.join(OUT, 'admin', 'index.html'));
    fs.copyFileSync(adminSrc, path.join(OUT, 'partner-admin', 'index.html'));
    console.log('  ✓ /admin/index.html');
    console.log('  ✓ /partner-admin/index.html');

    const adminBuilt = path.join(OUT, 'admin', 'index.html');
    if (!fs.existsSync(adminBuilt)) {
      console.error('FATAL: admin page missing from build output');
      process.exit(1);
    }

    console.log('  ✓ sitemaps, robots.txt, root redirect → public/');
    console.log('Done.');
  });
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
