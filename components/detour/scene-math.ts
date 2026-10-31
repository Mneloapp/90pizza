export const clamp = (n: number, lo = 0, hi = 1) =>
  Math.min(hi, Math.max(lo, n));
export const smooth = (n: number) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const chapterStops = [0, 0.14, 0.34, 0.61, 0.78, 0.91, 1] as const;
export const chapterTargets = [0, 0.245, 0.48, 0.705, 0.86, 0.997] as const;
export function chapterFor(p: number) {
  for (let i = chapterStops.length - 2; i >= 0; i--)
    if (clamp(p) >= chapterStops[i]) return i;
  return 0;
}

// The approved six-act story has one reversible timeline; only the flour opening uses time.
export function assemblyAt(p: number, elapsed: number) {
  const time = Math.max(clamp(elapsed, 0, 6), smooth(p / 0.14) * 6);
  const topping =
    p < 0.43
      ? mix(0, 0.43, clamp((p - 0.34) / 0.09))
      : p < 0.53
        ? mix(0.43, 0.75, clamp((p - 0.43) / 0.1))
        : mix(0.75, 1, clamp((p - 0.53) / 0.08));
  const oven = smooth((p - 0.61) / 0.035) * (1 - smooth((p - 0.75) / 0.03));
  const lift = smooth((p - 0.815) / 0.055) * (1 - smooth((p - 0.9) / 0.025));
  return {
    time,
    formation: smooth((time - 2.05) / 2.6),
    water: smooth((time - 1.45) / 0.35) * (1 - smooth((time - 2.6) / 0.5)),
    form: smooth((p - 0.14) / 0.2),
    topping,
    hands: smooth((time - 2) / 0.5) * (1 - smooth((p - 0.31) / 0.03)),
    bake: smooth((p - 0.645) / 0.075),
    handoff: smooth((p - 0.69) / 0.035),
    oven,
    cut: smooth((p - 0.78) / 0.035),
    lift,
    release: smooth((p - 0.87) / 0.018),
    box: smooth((p - 0.915) / 0.035),
    lid: smooth((p - 0.96) / 0.037),
    orbit:
      p < 0.61
        ? mix(0.12, 0.67, smooth((p - 0.14) / 0.25))
        : p < 0.78
          ? mix(0.67, 0.32, smooth((p - 0.61) / 0.045))
          : mix(0.32, 0.48, smooth((p - 0.91) / 0.08)),
  };
}

export function scenePose(progress: number, aspect: number) {
  const mobile = aspect < 0.9;
  const p = clamp(progress) * 3,
    segment = Math.min(2, Math.floor(p)),
    t = smooth(p - segment);
  const views = mobile
    ? [
        [4, 9, 10],
        [0.2, 6, 11],
        [0, 13, 4.5],
        [-4, 9, 10],
      ]
    : [
        [3.5, 6, 6.3],
        [0.2, 4.4, 7],
        [0, 9.4, 3.5],
        [-3.5, 6, 7],
      ];
  return {
    position: views[segment].map((v, i) => mix(v, views[segment + 1][i], t)),
  };
}
