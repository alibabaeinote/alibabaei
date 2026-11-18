// The Insight Engine (CLAUDE.md §5) — deterministic, on-device, no LLM.
// Ported from Margin/Insight/InsightEngine.swift.
//
// Two hard guardrails:
//  1. MIRROR, NOT JUDGE — plain, balanced observations. Never interpret,
//     diagnose, evaluate or prescribe.
//  2. NEVER INVENT — a pattern shows only when literally true AND past a
//     sufficiency gate. Otherwise an honest non-pattern line (or nothing).
//
// Reads ONLY structured fields: timestamp, band, part of day. The note is
// never touched — not by a model, not by these rules.

import { InsightConfig as C } from "./config.js";

const BANDS = ["activated", "weighted", "settled"];

const partOfDay = (hour) =>
  hour >= 5 && hour < 12 ? "morning"
  : hour >= 12 && hour < 17 ? "afternoon"
  : hour >= 17 && hour < 22 ? "evening" : "night";

const descriptor = { activated: "charged", weighted: "heavy", settled: "settled" };
const noun = { activated: "charge", weighted: "weight", settled: "ease" };

function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function statsOf(moments) {
  const days = new Set();
  const bandCounts = {};
  const covered = new Set();
  const bandByPart = {};
  const lastByBand = {};
  for (const m of moments) {
    days.add(dayKey(m.timestamp));
    const part = partOfDay(new Date(m.timestamp).getHours());
    covered.add(part);
    if (m.band) { // a written-in word (band null) never feeds band rules
      bandCounts[m.band] = (bandCounts[m.band] ?? 0) + 1;
      lastByBand[m.band] = Math.max(lastByBand[m.band] ?? 0, m.timestamp);
      (bandByPart[m.band] ??= {})[part] = (bandByPart[m.band][part] ?? 0) + 1;
    }
  }
  return { total: moments.length, distinctDays: days.size, bandCounts, covered, bandByPart, lastByBand };
}

// ---- rules: each returns copy ONLY when its trigger is literally true ----

const timeOfDayRule = {
  id: "time-of-day",
  evaluate(s) {
    if (s.covered.size < C.minCoveredPartsForTimeRule) return null;
    let best = null;
    for (const band of BANDS) {
      const count = s.bandCounts[band] ?? 0;
      if (count < C.minBandCountForTimeRule) continue;
      const parts = Object.entries(s.bandByPart[band] ?? {});
      if (!parts.length) continue;
      const [part, partCount] = parts.reduce((a, b) => (b[1] > a[1] ? b : a));
      const share = partCount / count;
      if (share < C.timeConcentration) continue;
      // Ties are settled by evidence (more moments), then recency — NEVER by
      // which band is pleasant or hard (valence balance, CLAUDE.md §1.3).
      const stronger = !best || share > best.share
        || (share === best.share && (count > best.count
          || (count === best.count && s.lastByBand[band] > s.lastByBand[best.band])));
      if (stronger) best = { band, part, share, count };
    }
    return best ? `Your ${descriptor[best.band]} moments tend to gather in the ${best.part}.` : null;
  },
};

const balanceRule = {
  id: "balance",
  evaluate(s) {
    const ranked = BANDS.map((b) => [b, s.bandCounts[b] ?? 0])
      .sort((a, b) => b[1] - a[1] || (s.lastByBand[b[0]] ?? 0) - (s.lastByBand[a[0]] ?? 0));
    const [top, second] = ranked;
    if (second[1] < C.minSecondBandForBalance) return null;
    if (top[1] < C.balanceMargin * second[1]) return null;
    return `More ${noun[top[0]]} than ${noun[second[0]]}, these last few days.`;
  },
};

const patternRules = [timeOfDayRule, balanceRule];

function fallback(total, distinctDays) {
  if (total <= C.coldStartThreshold || distinctDays <= 1) {
    // reflect the act of pausing, not who someone is (cold start, §5)
    return { text: "The map starts here — these first marks are yours.", ruleID: "cold-start" };
  }
  return { text: "No strong pattern yet — just your days, as they are.", ruleID: "quiet" };
}

/** The standing line for Home. `null` only when there are no Moments. */
export function standingInsight(moments, now = Date.now()) {
  if (!moments.length) return null;
  const cutoff = now - C.standingWindowDays * 86_400_000;
  const win = statsOf(moments.filter((m) => m.timestamp >= cutoff));

  if (win.total >= C.minMomentsForPattern && win.distinctDays >= C.minDistinctDaysForPattern) {
    for (const rule of patternRules) {
      const text = rule.evaluate(win);
      if (text) return report({ text, ruleID: rule.id });
    }
  }
  const all = statsOf(moments);
  return report(fallback(all.total, all.distinctDays));
}

// Which rule fired — visible in the browser console while developing.
function report(insight) {
  console.debug(`Insight ▶ [${insight.ruleID}] ${insight.text}`);
  return insight;
}
