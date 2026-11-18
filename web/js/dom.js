// Tiny element helper. Text always goes in as text nodes (never innerHTML),
// so a person's words and notes can never be interpreted as markup.
export function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props ?? {})) {
    if (v === false || v == null) continue;
    if (k === "class") el.className = v;
    else if (k === "style") el.style.cssText = v; // CSSOM, not setAttribute: allowed by our strict CSP
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid === false || kid == null) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));

// A soft ink mark. `tone` is a band name, or null for a neutral (written-in word).
export function ink(tone, size, extraStyle = "") {
  const el = h("div", { class: `ink tone-${tone ?? "neutral"}` });
  el.style.cssText = `--size:${size}px;width:${size}px;height:${size}px;${extraStyle}`;
  return el;
}

// Stable value in [0,1) from an id, so a mark sits in the same place every launch.
export function stableUnit(id, salt = 0) {
  let x = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) { x ^= id.charCodeAt(i); x = Math.imul(x, 16777619) >>> 0; }
  x ^= salt; x = Math.imul(x, 16777619) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0; x = Math.imul(x, 0x45d9f3b) >>> 0; x = (x ^ (x >>> 16)) >>> 0; // keep unsigned
  return (x % 10000) / 10000;
}
