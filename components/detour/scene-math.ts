export const clamp = (n: number, lo = 0, hi = 1) =>
  Math.min(hi, Math.max(lo, n));
export const smooth = (n: number) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const chapterStops = [0, 0.12, 0.28, 0.4, 0.49, 0.58, 0.8, 1] as const;
export const chapterTargets = [
  0, 0.21, 0.35, 0.455, 0.545, 0.73, 0.93,
] as const;
export function chapterFor(p: number) {
  for (let i = chapterStops.length - 2; i >= 0; i--)
    if (clamp(p) >= chapterStops[i]) return i;
  return 0;
}

export function assemblyAt(p: number, elapsed: number) {
  const time = Math.max(elapsed, smooth(p / 0.12) * 6);
  const topping =
    p < 0.4
      ? mix(0, 0.43, clamp((p - 0.28) / 0.12))
      : p < 0.49
        ? mix(0.43, 0.75, clamp((p - 0.4) / 0.09))
        : mix(0.75, 1, clamp((p - 0.49) / 0.09));
  return {
    time,
    formation: smooth((time - 2.05) / 2.6),
    form: smooth((p - 0.12) / 0.16),
    topping,
    bake: smooth((p - 0.58) / 0.1),
    handoff: smooth((p - 0.65) / 0.06),
    split: smooth((p - 0.8) / 0.09),
    orbit:
      p < 0.58
        ? mix(0.1, 0.66, smooth((p - 0.12) / 0.3))
        : p < 0.72
          ? mix(0.66, 0.33, smooth((p - 0.58) / 0.14))
          : mix(0.33, 0.66, smooth((p - 0.72) / 0.18)),
  };
}

// All camera targets keep the product below the copy, including narrow phones.
export function scenePose(progress: number, aspect: number) {
  const mobile = aspect < 0.9;
  const p = clamp(progress) * 3;
  const segment = Math.min(2, Math.floor(p));
  const t = smooth(p - segment);
  const lift = aspect > 0.53 ? 0.65 : 1.6;
  const views = mobile
    ? [
        [5.55, 8.7, 10.05, 0, lift, 0],
        [0.4, 5.8, 11, 0, lift, 0],
        [0.1, 13, 4.5, 0, lift, 0],
        [-5.55, 8.7, 10.05, 0, lift, 0],
      ]
    : [
        [3.5, 5, 6.3, 0, 1.15, 0],
        [0.2, 3.8, 6.8, -1.1, 0.7, 0],
        [0, 9.4, 3.5, -1.25, 0.9, 0],
        [-3.5, 5.5, 7, -1.1, 0.9, 0],
      ];
  const pose = views[segment].map((v, i) => mix(v, views[segment + 1][i], t));
  if (aspect > 1.9) {
    pose[3] = -2.1;
    pose[4] = 0.15;
  }
  // Open the grid only in the sharing chapter; reassemble before the flavor choice.
  const split =
    smooth((progress - 0.43) / 0.12) * (1 - smooth((progress - 0.77) / 0.13));
  return { position: pose.slice(0, 3), target: pose.slice(3), split };
}
