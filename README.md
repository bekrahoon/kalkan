# Kalkan — check before you click

**Live:** https://kalkan-sigma.vercel.app · **Telegram bot:** [@kalkan_kgs_bot](https://t.me/kalkan_kgs_bot)

Kalkan ("shield" in Kyrgyz) tells people in a few seconds whether a link, a
message, a screenshot, a document or an app looks like a scam, and what to do
about it. It answers in Russian, Kyrgyz and English.

Online fraud in Kyrgyzstan almost doubled in early 2026: fake bank pages, fake
"vote for my niece" polls, messages from "relatives" asking for money. People
decide in a second whether to tap a link. Kalkan is built to answer in that
second.

> Калкан проверяет ссылки, сообщения, скриншоты, документы и приложения и за
> несколько секунд говорит, похоже ли это на мошенников. На русском, кыргызском и английском.

## What it checks

| Input | How |
|---|---|
| **Link** | The server opens it like a phone would, follows every redirect and looks at what the final page asks for (card number, password, SMS code). It checks domain age (RDAP, with WHOIS fallback for `.kg`), look-alikes of banks and well-known brands, phishing feeds (OpenPhish, optional Google Safe Browsing) and user reports. |
| **Message or screenshot** | Gemini Flash reads the text or image, recognises known scam schemes and explains the verdict in plain words. Links found inside are checked as above. |
| **QR code** | Decoded from the photo, then checked as a link. |
| **Document photo or PDF** | Summons, fines, contracts, receipts: Kalkan explains what to verify. It does not claim to prove a document is genuine. |
| **Google Play app** | Developer, install count, rating, release date, permissions and user reports. |
| **Company or project** | Switch to "Компания" and paste a name, an INN or what they promise. Kalkan finds the red flags of pyramids and fake companies (guaranteed or very high returns, pay for referrals, deposits to a personal card, upfront fees), checks any website given, and explains how to verify in the official registries (Ministry of Justice, National Bank, financial market regulator). It never claims a company is registered: it has no registry access. |
| **Phone number** | Recognises the number, flags foreign country codes and explains what to do. Kalkan deliberately keeps no reports on numbers: a false label could hurt an honest person. |

If the AI is unavailable, links still get a verdict from the technical checks
alone.

## Measured accuracy

Measured on 15 October 2026 with [`scripts/eval-links.mts`](scripts/eval-links.mts)
(raw results in [`docs/eval`](docs/eval)). Technical checks only, no AI.

| | Result |
|---|---|
| Real phishing links flagged (OpenPhish + Phishing Army) | **180 of 200 (90%)** |
| Flagged by Kalkan's own checks, without the phishing lists | **171 of 200 (86%)** |
| False alarms on real Kyrgyz bank, government, media and shop sites | **0 of 100** |

The second row matters: it shows the engine catches new phishing that is not
yet on any blocklist.

## Features

- Web app in Russian, Kyrgyz and English, light and dark theme, installable as a PWA
- Android share sheet: send a link from any app straight to Kalkan
- Telegram bot, including a "chat guard" mode that quietly checks links in family or neighbourhood groups and warns about dangerous ones
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

| What | Where |
|---|---|
| Entry point that routes any input to the right check | `src/lib/check/index.ts` |
| Link engine: redirects, page signals, brand look-alikes | `src/lib/check/link.ts`, `official.ts` |
| Domain age (RDAP / WHOIS) | `src/lib/check/domain-age.ts` |
| Phishing feeds | `src/lib/check/feeds.ts` |
| Apps, phone numbers, QR codes | `src/lib/check/app.ts`, `phone.ts`, `qr.ts` |
| Company / pyramid check | `src/lib/check/company.ts` |
| AI verdict and prompts | `src/lib/check/ai-verdict.ts`, `src/lib/ai.ts` |
| API routes | `src/app/api/check`, `src/app/api/report`, `src/app/api/telegram` |
| Rate limits and origin checks | `src/lib/guard.ts` |
| UI strings (RU/KG/EN) | `src/lib/i18n.ts` |

## Run locally

```bash
npm install
cp .env.example .env.local   # add GEMINI_API_KEY
npm run dev                  # http://localhost:3000
```

Without a key the link checks still work, and the example buttons show prepared reports.

Re-run the accuracy evaluation:

```bash
NODE_OPTIONS=--conditions=react-server npx tsx scripts/eval-links.mts > eval.json
```

## Honest limits

Kalkan works from signals and can be wrong. "No signs of fraud" is not a
guarantee. It cannot verify whether a document in a photo is genuine.

## Author

Aba Bekrahoon Umurjanov — [LinkedIn](https://www.linkedin.com/in/aba-bekrahoon-umurjanov-183b39352) · [GitHub](https://github.com/bekrahoon)
