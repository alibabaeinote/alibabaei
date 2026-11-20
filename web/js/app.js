// Margin (web) — Home is the base; a Moment (Settle → Name → Note) begins from
// Home, is saved on this device, and returns to Home. Everything stays local.
import { allMoments, addMoment, clearAll } from "./store.js";
import * as view from "./views.js";

const root = document.getElementById("app");
let current = null;

// iOS doesn't shrink the layout viewport when the keyboard opens, which can hide
// the field being typed in. Track the *visual* viewport instead, and bring a
// focused field into view.
const vv = window.visualViewport;
if (vv) {
  const fit = () => { root.style.height = `${vv.height}px`; window.scrollTo(0, 0); };
  vv.addEventListener("resize", fit); fit();
}
document.addEventListener("focusin", (e) => {
  if (e.target.matches("input, textarea")) setTimeout(() => e.target.scrollIntoView({ block: "center", behavior: "smooth" }), 320);
});

function show(screen) {
  const prev = current;
  current = screen;
  const mount = () => { root.replaceChildren(screen); screen.querySelector?.("[autofocus]")?.focus(); };
  if (prev && matchMedia("(prefers-reduced-motion: no-preference)").matches) {
    prev.cleanup?.(); prev.classList.add("leaving");
    setTimeout(mount, 300);
  } else { prev?.cleanup?.(); mount(); }
}

async function goHome() {
  const moments = await allMoments();
  show(view.home({ moments, onBegin: goSettle, onOpenArchive: goArchive }));
}
async function goArchive() {
  const moments = await allMoments();
  show(view.archive({ moments, onBack: goHome, onExport: () => exportMoments(moments), onDeleteAll: deleteAll }));
}
const goSettle = () => show(view.settle({ onContinue: goName }));
const goName = () => show(view.name({ onComplete: (draft) => goNote(draft) }));
const goNote = (draft) => show(view.note({
  draft,
  // Save once, at the end of the flow — invisible, no confirmation.
  onComplete: async (done) => { await addMoment(done); goHome(); },
}));

function exportMoments(moments) {
  const blob = new Blob([JSON.stringify({ app: "margin", exportedAt: new Date().toISOString(), moments }, null, 2)],
    { type: "application/json" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "margin-moments.json" });
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
async function deleteAll() {
  if (!confirm("Delete every moment on this device? This can't be undone.")) return;
  await clearAll(); goHome();
}

goHome();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
