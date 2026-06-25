# energiemind.network

Partner / Pilot / Infrastructure Network website for the EnergieMIND ecosystem.

## Overview

Static multilingual site for hotels, farms, solar sites, greenhouse operators, mining hosts, energy partners and infrastructure operators to apply as pilot partners.

**Main CTA:** Apply as Pilot Partner

## Languages (25)

| Code | Language | Code | Language |
|------|----------|------|----------|
| `/en/` | English | `/pl/` | Polski |
| `/tr/` | Türkçe | `/ro/` | Română |
| `/de/` | Deutsch | `/el/` | Ελληνικά |
| `/fr/` | Français | `/sv/` | Svenska |
| `/es/` | Español | `/no/` | Norsk |
| `/it/` | Italiano | `/da/` | Dansk |
| `/pt/` | Português | `/fi/` | Suomi |
| `/nl/` | Nederlands | `/he/` | עברית |
| `/ar/` | العربية | `/id/` | Bahasa Indonesia |
| `/ru/` | Русский | | |
| `/zh-cn/` | 简体中文 | | |
| `/zh-tw/` | 繁體中文 | | |
| `/ja/` | 日本語 | | |
| `/ko/` | 한국어 | | |
| `/hi/` | हिन्दी | | |
| `/ur/` | اردو | | |

Each language has a fully translated page — no Google Translate widgets.

## Build

```bash
npm run build
```

Generates deployable static output in `/public/`:

- 25 language directories with `index.html`
- Language-specific sitemaps in `/sitemaps/`
- `/sitemap-index.xml`
- `/robots.txt`
- Root redirect to `/en/`

Vercel deploys from the `public/` output directory (see `vercel.json`).

## SEO

Every page includes:
- Unique title, meta description, keywords
- Open Graph and Twitter Card tags
- Canonical URL and full hreflang cluster
- JSON-LD: Organization, WebSite, BreadcrumbList, Article, FAQPage
- Crawler directives for Google, Bing, Yandex, Baidu

## Structure

```
content/          Translation JSON per language
config/           Site and language configuration
scripts/build.js  Static site generator
assets/           CSS, JS, images
```

## License

MIT — TVK Group / TVK Labs & Technologies LTD
