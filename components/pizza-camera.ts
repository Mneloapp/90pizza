import { MathUtils } from "three";

const { smoothstep: smooth, lerp } = MathUtils;

// The canvas never changes size between chapters. This continuous virtual frame
// moves the product around the copy without cutting to another camera or viewport.
export function sceneFraming(progress: number, width: number, height: number) {
  const work = smooth(progress, 0.12, 0.19);
  const oven = smooth(progress, 0.49, 0.54) * (1 - smooth(progress, 0.65, 0.7));
  const box = smooth(progress, 0.82, 0.87);
  const slices = smooth(progress, 0.65, 0.7);
  const mobile = width < 700;
  const landscape = !mobile && height < 620;
  const short = mobile && height < 650;
  const top = mobile
    ? lerp(short ? 0.39 : 0.34, short ? 0.35 : 0.31, slices)
    : landscape
      ? 0.16
      : 0.23;
  const bottom = mobile ? lerp(0.13, short ? 0.17 : 0.22, slices) : 0.12;
  const frame = {
    left: landscape ? 0.2 * work : 0,
    top: top * work,
    width: lerp(1, landscape ? 0.77 : 1, work),
    height: lerp(1, 1 - top - bottom, work),
  };
  const aspect = (width * frame.width) / (height * frame.height);
  return {
    frame,
    aspect,
    distance: aspect < 1 ? lerp(0.85, 1.25, work) / aspect : 1.08,
    cameraX: lerp(3.2, 4.2, work),
    cameraY: lerp(4.8, lerp(7.8, 4.3, oven), work),
    lookY: lerp(0.35, 1, box),
    lookZ: lerp(-0.15, -1.1, oven),
    x: mobile ? 0 : lerp(landscape ? 2 : 0, 1.65, work),
    y: -0.1 + 0.3 * work * (1 - smooth(progress, 0.48, 0.52)),
    scale: lerp(2.05, lerp(1.36, 1.06, Math.max(oven, box)), work),
    preparation: 1 - smooth(progress, 0.3, 0.34),
  };
}
