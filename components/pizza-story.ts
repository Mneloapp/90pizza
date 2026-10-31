export const storyStops = [0, 0.14, 0.32, 0.5, 0.68, 0.84, 1] as const;
export const storyIds = [
  "hero",
  "dough",
  "toppings",
  "oven",
  "slices",
  "box",
] as const;

export function storyAt(progress: number) {
  const value = Math.max(0, Math.min(1, progress));
  let index = 0;
  for (let i = 1; i < storyIds.length; i++)
    if (value >= storyStops[i]) index = i;
  const local =
    (value - storyStops[index]) / (storyStops[index + 1] - storyStops[index]);
  return { index, id: storyIds[index], local };
}

export function storyTarget(index: number) {
  return index === 0
    ? 0
    : storyStops[index] +
        (storyStops[index + 1] - storyStops[index]) *
          (index === 5 ? 0.88 : 0.55);
}
