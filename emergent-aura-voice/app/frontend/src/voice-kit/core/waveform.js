export const BAR_BASELINE = 15;
export const BAR_MAX = 100;
const BAR_WEIGHTS = [0.55, 0.8, 1, 0.8, 0.55];

export function levelToHeight(level) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(level) ? level : 0));
  return Math.round(BAR_BASELINE + (BAR_MAX - BAR_BASELINE) * clamped);
}

export function computeBarHeights(level, phase = Math.PI / 2, count = 5) {
  return Array.from({ length: count }, (_, i) => {
    const wobble = 0.75 + 0.25 * Math.sin(phase + i * 0.9);
    return levelToHeight(level * BAR_WEIGHTS[i % BAR_WEIGHTS.length] * wobble);
  });
}
