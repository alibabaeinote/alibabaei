// On-device storage only (IndexedDB). No network, no account, no sync.
// A Moment: { id, timestamp, band|null, word, bodyLocation|null, note|null }
// `word` and `note` are kept for the person only — never read by any model.

const DB_NAME = "margin";
const STORE = "moments";

let dbPromise;
let memory = null; // fallback if IndexedDB is unavailable (some private modes)

function openDB() {
  dbPromise ??= new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("no indexedDB"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const result = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(result.result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export async function allMoments() {
  let list;
  try { list = await tx(await openDB(), "readonly", (s) => s.getAll()); }
  catch { memory ??= []; list = memory; }
  return [...list].sort((a, b) => b.timestamp - a.timestamp); // newest first
}

export async function addMoment({ word, band = null, bodyLocation = null, note = null }) {
  const moment = { id: crypto.randomUUID(), timestamp: Date.now(), band, word, bodyLocation, note };
  try { await tx(await openDB(), "readwrite", (s) => s.put(moment)); }
  catch { (memory ??= []).push(moment); }
  // Ask the browser not to evict a person's marks (there is no backup in v1).
  try { await navigator.storage?.persist?.(); } catch {}
  return moment;
}

export async function clearAll() {
  try { await tx(await openDB(), "readwrite", (s) => s.clear()); }
  catch { memory = []; }
}
