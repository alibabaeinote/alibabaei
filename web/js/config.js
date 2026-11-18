// Tunable constants — ported from Margin/Moment/MomentConfig.swift and
// Margin/Insight/InsightConfig.swift. Hypotheses (CLAUDE.md §8) live here so
// they can be flipped cheaply, never scattered through views.

export const MomentConfig = {
  // Settle (§6.2)
  breathCount: 1,          // hypothesis: one slow exhale
  exhaleDuration: 5,       // seconds
  settleBeat: 0.8,         // seconds

  // Name (§6.3). Deliberately INTERLEAVED so no light→heavy gradient is implied.
  // Do not re-sort into "positive/negative" groups. Bands are internal only.
  words: [
    { word: "light",    band: "settled" },
    { word: "tense",    band: "activated" },
    { word: "open",     band: "settled" },
    { word: "heavy",    band: "weighted" },
    { word: "alive",    band: "activated" },
    { word: "bright",   band: "settled" },
    { word: "restless", band: "activated" },
    { word: "drained",  band: "weighted" },
  ],
  bodyLocations: ["chest", "jaw", "shoulders", "stomach", "head", "hands"],
  bodyNotSure: "not sure",

  // Note
  noteLinesMin: 4,
  noteLinesMax: 12,

  // Home
  homeRecentCount: 5,
};

export const InsightConfig = {
  standingWindowDays: 7,

  // Pattern sufficiency gates — BOTH must pass before ANY pattern may fire.
  minMomentsForPattern: 8,
  minDistinctDaysForPattern: 4,

  // time-of-day rule
  minBandCountForTimeRule: 4,
  timeConcentration: 0.6,
  minCoveredPartsForTimeRule: 2,

  // balance rule
  balanceMargin: 1.6,
  minSecondBandForBalance: 2,

  // at/below this many marks the line reflects the act of pausing, not a trend
  coldStartThreshold: 3,
};
