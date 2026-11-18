import { h, ink, reducedMotion, sleep, stableUnit } from "./dom.js";
import { MomentConfig as M } from "./config.js";
import { standingInsight } from "./insight.js";

/* ============================ Settle (§6.2) ============================ */
// One slow exhale. Nothing is tappable until the breath completes.
export function settle({ onContinue }) {
  const bloom = h("div", { class: "ink bloom" });
  const guidance = h("div", { class: "guidance" }, "Breathe out, slowly.");
  const go = h("button", { class: "action go-on", disabled: true, onclick: onContinue }, "continue");
  const screen = h("main", { class: "screen settle" }, bloom, guidance, go);
  screen.style.setProperty("--exhale", `${M.exhaleDuration}s`);

  const reveal = () => { go.disabled = false; go.classList.add("on"); };
  let alive = true;
  (async () => {
    if (reducedMotion()) { bloom.classList.add("go"); bloom.style.transition = "none"; reveal(); return; }
    for (let i = 0; i < Math.max(1, M.breathCount); i++) {
      bloom.classList.remove("go"); void bloom.offsetWidth;
      await sleep(M.settleBeat); if (!alive) return;
      bloom.classList.add("go");
      await sleep(M.exhaleDuration); if (!alive) return;
    }
    guidance.classList.add("off");
    reveal();
  })();
  screen.cleanup = () => { alive = false; };
  return screen;
}

/* ============================== Name (§6.3) ============================== */
// Word first. The palette is flat: every chip is treated identically.
export function name({ onComplete }) {
  let word = null, band = null, writingOwn = false, bodyLoc = null;
  const hasWord = () => (word ?? "").trim().length > 0;

  const chips = M.words.map((c) =>
    h("button", { class: "chip", "aria-pressed": "false", onclick: () => pick(c) }, c.word));
  const palette = h("div", { class: "flow" }, chips);

  const input = h("input", {
    class: "own-input", type: "text", placeholder: "it feels like…", enterkeyhint: "done",
    autocomplete: "off", autocapitalize: "none", "aria-label": "your own word",
    oninput: () => { word = input.value; band = null; refresh(); },
    onkeydown: (e) => { if (e.key === "Enter") input.blur(); },
  });
  input.hidden = true;
  const cant = h("button", { class: "quiet center", onclick: () => {
    writingOwn = true; word = null; band = null; input.value = "";
    cant.hidden = true; input.hidden = false; input.focus(); refresh();
  } }, "can't name it");

  // Body: optional, second, never a gate.
  const bodyChip = (label) => {
    const b = h("button", { class: "chip sans", "aria-pressed": "false",
      onclick: () => { bodyLoc = bodyLoc === label ? null : label; refresh(); } }, label);
    b.dataset.v = label; return b;
  };
  const bodyChips = [...M.bodyLocations, M.bodyNotSure].map(bodyChip);
  const body = h("section", { class: "stack reveal", style: "gap:var(--md);padding-top:var(--sm)" },
    h("div", { style: "display:flex;flex-direction:column;gap:var(--xxs)" },
      h("div", { class: "title", style: "color:rgba(var(--ink-rgb),.7)" }, "Where does it sit?"),
      h("div", { class: "meta", style: "font-size:11px" }, "optional — or just continue")),
    // TODO: a "what does the body signal" helper — not built yet (§6.3).
    h("div", { class: "flow" }, bodyChips));
  body.hidden = true;

  const cont = h("button", { class: "action center reveal", style: "padding-top:var(--sm)", onclick: finish }, "continue");
  cont.hidden = true;

  function pick(c) { writingOwn = false; word = c.word; band = c.band; input.value = "";
    input.hidden = true; cant.hidden = false; refresh(); }
  function refresh() {
    chips.forEach((el, i) => el.setAttribute("aria-pressed", String(!writingOwn && word === M.words[i].word)));
    bodyChips.forEach((el) => el.setAttribute("aria-pressed", String(bodyLoc === el.dataset.v)));
    const show = hasWord();
    for (const el of [body, cont]) {
      if (show && el.hidden) { el.hidden = false; el.style.animation = "none"; void el.offsetWidth; el.style.animation = ""; }
      else if (!show) el.hidden = true;
    }
  }
  function finish() {
    const w = (word ?? "").trim(); if (!w) return;
    onComplete({ word: w, band, bodyLocation: bodyLoc });
  }

  return h("main", { class: "screen" },
    h("div", { class: "scroll" }, h("div", { class: "stack" },
      h("h1", { class: "prompt", style: "margin:0" }, "What's here right now?"),
      palette, cant, input, body, cont)));
}

/* ============================== Note (§6.4) ============================== */
// Optional, never required. "let it be" is an equal, natural choice.
export function note({ draft, onComplete }) {
  const area = h("textarea", { class: "well", rows: M.noteLinesMin, placeholder: "in your own words…",
    "aria-label": "a note, if you like", oninput: sync });
  const btn = h("button", { class: "action center", onclick: finish }, "let it be");
  const text = () => area.value.trim();
  function sync() {
    btn.textContent = text() ? "save" : "let it be";
    area.style.height = "auto";
    const lh = parseFloat(getComputedStyle(area).lineHeight) || 27;
    const cap = lh * M.noteLinesMax + 32;
    area.style.height = Math.min(area.scrollHeight, cap) + "px";
  }
  function finish() { onComplete({ ...draft, note: text() || null }); } // empty → no note
  return h("main", { class: "screen" },
    h("div", { class: "scroll" }, h("div", { class: "stack" },
      h("h1", { class: "prompt", style: "margin:0" }, "Anything you'd like to say about this?"),
      area, btn)));
}

/* ============================= Home (§6.6) ============================= */
// No streaks, counts, scores, goals. No valence colouring or ranking.
export function home({ moments, onBegin, onOpenArchive }) {
  const entry = h("button", { class: "entry", onclick: onBegin },
    h("span", { class: "ring" }, h("i")), h("span", { class: "quiet" }, "take a moment"));
  const footer = h("div", { class: "footer" }, entry);

  let content;
  if (!moments.length) {
    content = h("div", { class: "scroll" },
      h("p", { class: "empty" }, "Your first moment settles here."));
  } else {
    const insight = standingInsight(moments);
    const field = h("div", { class: "field", "aria-hidden": "true" },
      moments.map((m) => {
        const size = 54 + stableUnit(m.id, 7) * 58;
        const mark = ink(m.band, size,
          `left:calc(46px + ${stableUnit(m.id, 1)} * (100% - 92px));` +
          `top:calc(46px + ${stableUnit(m.id, 2)} * (100% - 92px));` +
          `opacity:${0.4 + stableUnit(m.id, 3) * 0.26}`);
        return mark;
      }));
    content = h("div", { class: "scroll" }, h("div", { class: "stack", style: "gap:var(--lg)" },
      h("div", { class: "head" },
        h("div", { class: "title" }, "You, lately"),
        h("button", { class: "eyebrow", onclick: onOpenArchive }, "where you've been")),
      insight && h("p", { class: "insight" }, insight.text),
      field,
      h("div", { class: "thread" },
        h("div", { class: "eyebrow" }, "recently"),
        moments.slice(0, M.homeRecentCount).map((m) =>
          h("div", { class: "item" },
            h("div", { class: "word" }, m.word),
            h("div", { class: "meta" }, [softWhen(m.timestamp), m.bodyLocation].filter(Boolean).join(" · ")))))));
  }
  return h("main", { class: "screen" }, content, footer);
}

/* ============================= Archive (§6.6) ============================= */
// A record, not a report. Chronological only; no counts, no insight here.
export function archive({ moments, onBack, onExport, onDeleteAll }) {
  const head = h("div", { class: "arch-head" },
    h("button", { class: "quiet", style: "font-size:12px", onclick: onBack }, "‹  home"),
    h("h1", {}, "Where you've been"));

  if (!moments.length) {
    return h("main", { class: "screen" }, head,
      h("div", { class: "scroll arch-scroll" },
        h("p", { class: "title", style: "color:rgba(var(--ink-rgb),.6);margin:0" }, "Where you've been will gather here.")));
  }
  const groups = new Map();
  for (const m of moments) { // already newest-first
    const key = new Date(m.timestamp).toDateString();
    (groups.get(key) ?? groups.set(key, []).get(key)).push(m);
  }
  const days = [...groups.values()].map((items) =>
    h("section", { class: "day" },
      h("div", { class: "eyebrow", style: "letter-spacing:.1em" }, dayLabel(items[0].timestamp)),
      items.map((m) =>
        h("div", { class: "row" },
          h("span", { class: "dot", style: `background:var(--${m.band ?? "neutral"})` }),
          h("div", { class: "col" },
            h("div", { class: "word" }, m.word),
            h("div", { class: "meta" }, [timeOfDay(m.timestamp), m.bodyLocation].filter(Boolean).join(" · ")),
            m.note && h("div", { class: "note", style: "margin-top:var(--xxs)" }, m.note))))));
  const priv = h("div", { class: "private" },
    h("button", { onclick: onExport }, "export my moments"),
    h("button", { onclick: onDeleteAll }, "delete everything"));
  return h("main", { class: "screen" }, head,
    h("div", { class: "scroll arch-scroll" }, days, priv));
}

/* ----------------------------- gentle labels ----------------------------- */
function timeOfDay(ts) {
  const hr = new Date(ts).getHours();
  return hr >= 5 && hr < 12 ? "morning" : hr < 17 && hr >= 12 ? "afternoon" : hr >= 17 && hr < 22 ? "evening" : "night";
}
const startOfDay = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
const daysAgo = (ts, now = Date.now()) => Math.round((startOfDay(now) - startOfDay(ts)) / 86_400_000);

function softWhen(ts) {
  const n = daysAgo(ts);
  if (n === 0) { const hr = new Date(ts).getHours();
    return hr >= 5 && hr < 12 ? "this morning" : hr >= 12 && hr < 17 ? "this afternoon" : hr >= 17 && hr < 22 ? "this evening" : "tonight"; }
  if (n === 1) return "yesterday";
  if (n < 7) return "earlier this week";
  if (n < 14) return "last week";
  return "a while ago";
}
function dayLabel(ts) {
  const n = daysAgo(ts);
  if (n === 0) return "Today";
  if (n === 1) return "Yesterday";
  if (n < 7) return new Date(ts).toLocaleDateString("en", { weekday: "long" });
  return new Date(ts).toLocaleDateString("en", { month: "long", day: "numeric" });
}
