# Parlez — French Hourly Reader

A small French B1–B2 reading/listening web app for iPad, iPhone, Windows, and desktop browsers. Free GitHub Pages hosting, no backend, no signup, and no paid AI API key.

## What it does

- Displays **one French essay** as six short paragraphs, with a clear English translation for each paragraph (press **Show meaning**).
- Tap **any French word** to stop audio immediately and see its English meaning in a small panel. Common words are in the offline glossary; other word meanings use the free MyMemory translation endpoint, so an internet connection is needed for those. (Third party may receive only the selected word.)
- Exactly one speech player: **Play**, **Pause**, **Resume**, **Cancel**. Uses your device's **built-in French text-to-speech voice**. No downloadable audio is necessary; voice quality depends on the phone/browser/installed voices.
- Every hourly GitHub Actions run overwrites **`current.json`**, then deploys the website using GitHub Pages. The old passage is no longer among the live site files. Normal Git history retains old versions of `current.json`.
- When you reload/open the app, it fetches the newest passage without using a stale browser cache. If your internet is offline, it can reuse the most recently opened passage from local storage.

## Upload to GitHub (one time)

1. Open **https://github.com/new** while signed into GitHub.
2. Choose repository name **`reader`** and visibility **Public**. Create the repository. You may leave the README checkbox unchecked, so the repository starts empty.
3. **Unzip** `french-hourly-reader.zip` on your computer. Do **not** upload the ZIP itself. Upload the **contents** of the unzipped `french-hourly-reader` folder to the **root of the new repository**. Include its `.github/workflows/hourly-passage.yml` folder/file, `content`, `scripts`, the HTML, CSS, JS, and `current.json`. On an empty repository, click **uploading an existing file**; otherwise choose **Add file → Upload files**. Drag the folder's contents and commit to the **main** branch.
4. In the repository, open **Settings → Pages → Build and deployment → Source → GitHub Actions**. Save/select GitHub Actions. No template file is needed because the workflow was uploaded already.
5. Open the **Actions** tab, choose **Publish fresh French essay**, click **Run workflow** (branch `main`) to deploy immediately. If Actions are disabled, enable them; check the Actions run to confirm the green check.
6. Your expected reader URL will be **`https://YOUR-GITHUB-USERNAME.github.io/reader/`**. Replace `YOUR-GITHUB-USERNAME` with your real handle. GitHub shows the confirmed URL in **Settings → Pages** after deployment. You can bookmark it or add it to your iPad Home Screen.

> If Actions reports `Resource not accessible by integration` on the commit step, check **Settings → Actions → General → Workflow permissions**, choose **Read and write permissions** where permitted, and run the workflow again. The YAML requests the required permissions, but organization rules may override them.

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