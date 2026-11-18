# Margin — web app (v1)

A quiet place for small moments of self-awareness. Settle → Name → Note → Home → Archive.

**Everything stays on the device.** Moments are saved in the browser's own storage
(IndexedDB). There is no server, no account, no analytics, no fonts or scripts from
anywhere else. The page's Content-Security-Policy (`index.html`) sets `connect-src 'none'`,
so the browser itself refuses any network request from the app.

## Run it on your computer

No install, no build. From the repo root:

```
cd web
python3 -m http.server 8000
```

Then open <http://localhost:8000>. (To see it phone-sized: browser DevTools → device toolbar.)

## Put it on a phone

It must be served over **HTTPS** for the offline cache and "Add to Home Screen" to work
(any static host works: the folder `web/` is the whole site). On iPhone: open the link in
**Safari → Share → Add to Home Screen**. Installing matters — Safari may clear storage for
sites that aren't installed, and v1 has no backup, so use **export my moments** (bottom of
Archive) now and then.

## Where things are

| | |
|---|---|
| `js/config.js` | Tunable hypotheses: breath count, the 8 words, body locations, insight gates |
| `js/insight.js` | The deterministic Insight Engine (no LLM; never reads the note) |
| `js/views.js` | The five screens |
| `js/store.js` | On-device storage |
| `css/tokens.css` | Design tokens (ported from `Margin/DesignSystem/Theme.swift`) |

## Guardrails that are tested, not just promised

- No pattern line from sparse data (needs ≥ 8 moments across ≥ 4 days); otherwise an honest plain line.
- Equal footing for pleasant and hard states — including when two patterns tie (settled by
  evidence, then recency; never by which feeling is "good" or "bad").
- Word palette is flat: same treatment for every word, interleaved order, no colour by valence.
- No counts, streaks, or scores anywhere. The note is never analysed.
- Fonts: Newsreader, Hanken Grotesk, Spline Sans Mono (SIL OFL, self-hosted in `fonts/`).
