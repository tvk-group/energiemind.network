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

## Supabase Integration

Uses `@supabase/supabase-js` and `@supabase/ssr`.

| Path | Purpose |
|------|---------|
| `utils/supabase/client.js` | Browser client helper |
| `utils/supabase/server.js` | Server client helpers |
| `utils/supabase/middleware.js` | Session refresh helper (for future Edge/Auth) |
| `lib/supabase.js` | Service-role client for API routes |
| `public/assets/js/supabase-client.js` | Bundled browser SDK (built at `npm run build`) |

### Environment variables

Copy `.env.example` → `.env.local` for local builds. Set the same in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — public form inserts
- `SUPABASE_SERVICE_ROLE_KEY` — admin API only (server)
- `ADMIN_PASSWORD` — `/admin/` login

Run `supabase/schema.sql` in your Supabase SQL Editor first.

> **Note:** This is a static site (not Next.js). There is no `page.tsx` or Next middleware — the partner form uses the bundled Supabase browser client; admin uses Vercel serverless API routes.

## Supabase (Partner Form)

To persist partner applications:

1. Create a Supabase project
2. Run `supabase/schema.sql` in the SQL Editor
3. Set Vercel env vars (see `.env.example`): `SUPABASE_URL`, `SUPABASE_ANON_KEY`
4. Redeploy — the build injects config into `public/assets/js/form-config.js`

Without Supabase, the form shows a success message in demo mode (no data saved).

## Admin Dashboard

Partner applications admin: **`/admin/`** or **`/partner-admin/`**

- Password-protected (set `ADMIN_PASSWORD` in Vercel)
- Lists all submissions from Supabase (requires `SUPABASE_SERVICE_ROLE_KEY`)
- Filter, search, view details, update status (new → reviewing → approved → declined)

See `.env.example` for required environment variables.

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
