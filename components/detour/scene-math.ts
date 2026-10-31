export const clamp = (n: number, lo = 0, hi = 1) =>
  Math.min(hi, Math.max(lo, n));
export const smooth = (n: number) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const chapterFor = (p: number) => Math.min(3, Math.floor(clamp(p) * 4));

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
