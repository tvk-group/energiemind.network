#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public');
const languages = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/languages.json'), 'utf8'));
const siteConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/site.json'), 'utf8'));
const DOMAIN = siteConfig.domain;

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

function sectionBlock(section, reverse = false) {
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

  return `<section id="${section.id}" class="section ${reverse ? 'section-alt' : ''}" aria-labelledby="${section.id}-title">
      <div class="container">
        <header class="section-header">
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
          <button type="submit" class="btn btn-primary btn-lg">${esc(t.form.submit)}</button>
          <p class="form-success" id="form-success" hidden>${esc(t.form.success)}</p>
        </form>`;
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
  const ogImage = `${DOMAIN}/assets/images/og-default.svg`;
  const stats = t.hero.stats
    .map((s) => `<div class="stat"><span class="stat-value">${esc(s.value)}</span><span class="stat-label">${esc(s.label)}</span></div>`)
    .join('\n          ');

  const sections = Object.values(t.sections);
  const sectionHtml = sections.map((s, i) => sectionBlock(s, i % 2 === 1)).join('\n\n    ');

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
  <link rel="icon" href="/assets/images/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/assets/images/apple-touch-icon.svg" />
  <link rel="stylesheet" href="/assets/css/style.css" />
  ${jsonLd(t, lang, canonical)}
</head>
<body>
  <a class="skip-link" href="#main">${esc(t.skipLink)}</a>
  <header class="site-header" role="banner">
    <div class="container header-inner">
      <a href="${canonical}" class="logo" aria-label="${esc(t.brand)}">
        <img src="/assets/images/logo.svg" alt="${esc(t.brand)}" width="180" height="40" />
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
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-bg"></div>
      <div class="container hero-content">
        <span class="hero-badge">${esc(t.hero.badge)}</span>
        <h1 id="hero-title">${esc(t.hero.title)}</h1>
        <p class="hero-subtitle">${esc(t.hero.subtitle)}</p>
        <div class="hero-actions">
          <a href="#application" class="btn btn-primary btn-lg">${esc(t.hero.cta)}</a>
          <a href="#pilot-sites" class="btn btn-outline btn-lg">${esc(t.hero.secondary)}</a>
        </div>
        <div class="hero-stats">
          ${stats}
        </div>
      </div>
    </section>

    ${sectionHtml}

    <section id="enm-notice" class="section enm-section" aria-labelledby="enm-title">
      <div class="container">
        <div class="enm-card">
          <h2 id="enm-title">${esc(t.enm.title)}</h2>
          <p>${esc(t.enm.text)}</p>
        </div>
      </div>
    </section>

    <section id="application" class="section section-alt" aria-labelledby="application-title">
      <div class="container">
        <header class="section-header">
          <h2 id="application-title">${esc(t.form.title)}</h2>
          <p class="section-subtitle">${esc(t.form.subtitle)}</p>
        </header>
        ${formBlock(t)}
      </div>
    </section>

    <section id="faq" class="section" aria-labelledby="faq-title" itemscope itemtype="https://schema.org/FAQPage">
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
        <img src="/assets/images/logo.svg" alt="${esc(t.brand)}" width="160" height="36" />
        <p>${esc(t.footer.about)}</p>
      </div>
      <nav class="footer-nav" aria-label="Footer">
        <h3>${esc(t.nav.partnerNetwork)}</h3>
        <ul>
          <li><a href="#partner-network">${esc(t.footer.links.network)}</a></li>
          <li><a href="#pilot-sites">${esc(t.footer.links.pilots)}</a></li>
          <li><a href="#application">${esc(t.footer.links.apply)}</a></li>
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
  console.log('  ✓ /assets/');

  for (const lang of languages) {
    const t = loadTranslation(lang.code);
    const outDir = path.join(OUT, lang.code);
    ensureDir(outDir);
    const html = buildPage(lang, t);
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
    console.log(`  ✓ /${lang.code}/index.html`);
  }

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

  console.log('  ✓ sitemaps, robots.txt, root redirect → public/');
  console.log('Done.');
}

main();
