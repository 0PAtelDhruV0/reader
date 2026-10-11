# Reader — French & English Hourly Reader

A clean, iPad-friendly French B1–B2 reading app. The entire screen fits the iPad viewport: **50% French text on the left, 50% English translation on the right**. Both reading panes scroll independently; the app header, passage title, and audio controls stay fixed.

## Features

- **Reader** app name and a distraction-free side-by-side layout on iPad, iPhone, Windows, and desktop.
- **Three compact audio buttons at the top:** Play (or Resume), Pause, and Stop. French speech uses your device's built-in text-to-speech voice.
- **Tap any French word** to instantly stop speaking and see its English meaning. Common words are translated locally; other words use the free MyMemory translation service, which receives the selected word.
- **English paragraphs are always visible**, no reveal switch required. Only French and English passage panes scroll.
- **Hourly passage updates** replace `current.json` using GitHub Actions; the source library is predefined, so no paid AI service is required.

## Enable the website

The files are already published at **https://github.com/0PAtelDhruV0/reader**.

1. In **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions**.
2. In **Actions**, select **Publish fresh French essay**, then **Run workflow** on `main`.
3. Once GitHub reports a successful Pages deployment, open **https://0pateldhruv0.github.io/reader/**. You can add this address to the iPad Home Screen.

If the commit step reports insufficient permissions, review **Settings → Actions → General → Workflow permissions** and allow read/write permissions where possible.

## How hourly rotation works

- GitHub Actions is scheduled with `cron: '7 * * * *'` (around **minute 07 of every UTC hour**). GitHub can delay or occasionally skip scheduled runs; it is not a real-time timer. Re-enable scheduled workflows if GitHub disables them after repository inactivity.
- Each run uses `scripts/rotate.py` to select a passage from `content/essays.json`, **replacing** `current.json`, committing that one file to the repository, and deploying the four public site files (`index.html`, `styles.css`, `app.js`, `current.json`).
- The included library uses **12 topics, each with 3 story-example pairings × 2 reflection orders × 3 conclusions: 216 distinct assembled passages (9 days of hourly updates)**, then combinations repeat. These are **prewritten and recombined**, not AI-generated fresh essays, and avoid paying for a translation/generation API. To extend the rotation, add more hand-authored themes or variants to `content/essays.json`; it will automatically increase the number of distinct hourly passages.
- Paragraph translations are included in the library so they work regardless of translation-API availability.

## Manual testing

```bash
python3 scripts/rotate.py                   # create/replace current.json with this hour's passage
python3 scripts/rotate.py --at 2026-10-12T18:00:00Z
python3 -m unittest discover -s tests -v  # validate JSON and hourly rotation
python3 -m http.server 8000               # open http://localhost:8000/
```

Using `file://` to open the HTML file directly is not supported because the app fetches `current.json` over HTTP. The published GitHub Pages version works normally.

## Files

- `index.html`, `styles.css`, `app.js` — self-contained responsive reader, text-to-speech and word meaning lookup.
- `current.json` — **the only currently published essay**.
- `content/essays.json` — reusable French/English source segments (not included in public site artifact).
- `scripts/rotate.py` — selects the passage for the current UTC hour.
- `.github/workflows/hourly-passage.yml` — updates repository content + deploys GitHub Pages hourly.

## Limitations and privacy

French speech quality and playback behavior can vary across browsers, particularly some iOS/iPadOS versions. User interaction is required to start audio, and a French system voice may need to be installed in device settings. Word translation may fail offline or due to limits on the public MyMemory service, but the essay's English translation is bundled and always available once loaded. This app does not run an AI model and does not save essays in a server database.