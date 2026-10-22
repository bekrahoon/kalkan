# KalkanCheck — check before you click

**Live:** https://kalkan-sigma.vercel.app · **Telegram bot:** [@kalkan_kgs_bot](https://t.me/kalkan_kgs_bot)

KalkanCheck ("kalkan" is Kyrgyz for "shield") tells people in a few seconds whether a link, a
message, a screenshot, a document or an app looks like a scam, and what to do
about it. It answers in Russian, Kyrgyz and English.

Online fraud in Kyrgyzstan almost doubled in early 2026: fake bank pages, fake
"vote for my niece" polls, messages from "relatives" asking for money. People
decide in a second whether to tap a link. KalkanCheck is built to answer in that
second.

> KalkanCheck проверяет ссылки, сообщения, скриншоты, документы и приложения и за
> несколько секунд говорит, похоже ли это на мошенников. На русском, кыргызском и английском.

## What it checks

| Input | How |
|---|---|
| **Link** | The server opens it like a phone would, follows every redirect and looks at what the final page asks for (card number, password, SMS code). It checks domain age (RDAP, with WHOIS fallback for `.kg`), look-alikes of banks and well-known brands, phishing feeds (OpenPhish, optional Google Safe Browsing) and user reports. |
| **Message or screenshot** | Gemini Flash reads the text or image, recognises known scam schemes and explains the verdict in plain words. Links found inside are checked as above. |
| **QR code** | Decoded from the photo, then checked as a link. |
| **Document photo or PDF** | Summons, fines, contracts, receipts: KalkanCheck explains what to verify. It does not claim to prove a document is genuine. |
| **Google Play app** | Developer, install count, rating, release date, permissions and user reports. |
| **Company or project** | Switch to "Компания" and paste a name, an INN or what they promise. KalkanCheck finds the red flags of pyramids and fake companies (guaranteed or very high returns, pay for referrals, deposits to a personal card, upfront fees), checks any website given, and explains how to verify in the official registries (Ministry of Justice, National Bank, financial market regulator). It never claims a company is registered: it has no registry access. |
| **Phone number** | Recognises the number, flags foreign country codes and explains what to do. KalkanCheck deliberately keeps no reports on numbers: a false label could hurt an honest person. |

If the AI is unavailable, links still get a verdict from the technical checks
alone.

## Measured accuracy

Measured on 15 October 2026 with [`scripts/eval/eval-links.mts`](scripts/eval/eval-links.mts)
(raw results in [`docs/eval`](docs/eval)). Technical checks only, no AI.

| | Result |
|---|---|
| Real phishing links flagged (OpenPhish + Phishing Army) | **180 of 200 (90%)** |
| Flagged by KalkanCheck's own checks, without the phishing lists | **171 of 200 (86%)** |
| False alarms on real Kyrgyz bank, government, media and shop sites | **0 of 100** |

The second row matters: it shows the engine catches new phishing that is not
yet on any blocklist.

## Features

- Web app in Russian, Kyrgyz and English, light and dark theme, installable as a PWA
- Android share sheet: send a link from any app straight to KalkanCheck
- Telegram bot, including a "chat guard" mode that quietly checks links in family or neighbourhood groups and warns about dangerous ones
- **Trusted person** (Telegram, /family): an elderly user links a relative once. A dangerous check, or a message like "I already sent the money", instantly alerts the relative, so help arrives while the money can still be stopped
- Library of common scam schemes in Kyrgyzstan
- "Save a report for the police": a one-page PDF (via the print dialog) with what was checked, when, the verdict and the reasons; generated on the device, nothing is sent
- History of checks kept on the device only
- User reports on sites and apps, stored without any data about who reported
- Abuse protection for the shared AI key: same-origin requests only, per-IP limits per minute and per day

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Gemini Flash API ·
cheerio · tldts · jsQR · google-play-scraper · Vercel Blob · Telegram Bot API ·
deployed on Vercel.

## Project layout

```
src/
├── app/                 Routes only (pages + API), thin: validate input, call src/server, return JSON
│   ├── api/check        POST — run a check
│   ├── api/report       POST — "this is fraud" report; DELETE — admin moderation
│   └── api/telegram     Telegram webhook (+ /setup for the admin)
├── components/          React UI, grouped by feature
│   ├── checker/         Input form, loading, verdict, history
│   ├── layout/          Header with menu, footer, consent dialog
│   ├── pages/           Content of /about, /help, /schemes, /protect, legal pages
│   ├── providers/       Language context
│   └── ui/              Small reusable pieces (logo, reveal, PWA install card)
├── content/             Static texts: schemes, legal pages, about
├── lib/                 Code shared by browser and server: types, UI strings, demo results, local history
└── server/              Server-only code (secrets, network, AI) — never shipped to the browser
    ├── ai/              Gemini client with fallbacks and time budget
    ├── check/           Check engine: routing, links, domain age, feeds, apps, phones, QR, companies, AI verdict, rules
    ├── family/          Trusted person: invites, alerts
    ├── reports/         User reports: validation and storage (Vercel Blob)
    ├── security/        SSRF guard, rate limits, request origin, admin key / constant-time compare
    ├── telegram/        Bot: messages, group guard, HTML escaping
    └── config.ts        Public site URL
scripts/
├── eval/                Accuracy evaluation of the link engine
└── mobile-build/        Single-file offline demo build
```

An ESLint rule forbids importing `src/server` from `components`, `lib` or `content`, so server code cannot leak into the browser bundle.

## Security

- **SSRF:** links are opened through an HTTP agent that resolves the name and refuses private, loopback, link-local, metadata, CGNAT and IPv4-in-IPv6 addresses at connect time (safe against DNS rebinding); every redirect hop is checked; responses are capped at 1.5 MB.
- **API abuse:** `/api/check` and `/api/report` accept only same-origin requests from the site, with per-IP limits; request bodies, text and files are size- and type-checked.
- **Secrets:** API keys live only in server environment variables; admin routes require `ADMIN_KEY` (≥16 chars, `Authorization: Bearer`), compared in constant time; the Telegram webhook checks Telegram's secret header in constant time.
- **Output:** bot messages escape all user and AI text; the site sets a strict Content-Security-Policy, HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer- and Permissions-Policy.
- **Privacy:** the text, links and files a user checks are not stored; a report keeps only the reported domain or app id and a counter, never who reported it.
- Known limit: rate limits live in each server instance's memory. For a real attack add Vercel Firewall rate-limit rules.

## Run locally

```bash
npm install
cp .env.example .env.local   # add GEMINI_API_KEY
npm run dev                  # http://localhost:3000
```

Without a key the link checks still work, and the example buttons show prepared reports.

Re-run the accuracy evaluation:

```bash
NODE_OPTIONS=--conditions=react-server npx tsx scripts/eval/eval-links.mts > eval.json
```

## Honest limits

KalkanCheck works from signals and can be wrong. "No signs of fraud" is not a
guarantee. It cannot verify whether a document in a photo is genuine.

## Author

Aba Bekrahoon Umurjanov — [LinkedIn](https://www.linkedin.com/in/aba-bekrahoon-umurjanov-183b39352) · [GitHub](https://github.com/bekrahoon)
