export const ATELIER_DURATION = 52;
export const atelierStops = [0, 4, 10, 24, 34, 43, 52];
export const atelierTargets = [0, 7 / 52, 21 / 52, 28 / 52, 40 / 52, 51.8 / 52];

export function atelierChapter(progress: number) {
  for (let i = 5; i > 0; i--) if (progress * ATELIER_DURATION >= atelierStops[i]) return i;
  return 0;
}
