import { MathUtils, Vector3 } from "three";

const { smoothstep: smooth, lerp } = MathUtils;
const VOLUME = (4 * Math.PI * 0.88 * 0.81 * 0.43) / 3;
export const DOUGH_BASE = -0.052;

export function doughPose(progress: number) {
  const press = smooth(progress, 0.14, 0.4);
  const lengthen = smooth(progress, 0.3, 0.56);
  const widen = smooth(progress, 0.57, 0.91);
  const square = smooth(progress, 0.32, 0.94);
  const rx = 0.88 + press * 0.31 + widen * 0.61;
  const rz = 0.81 + press * 0.29 + lengthen * 0.7;
  const exponent = 2 + square * 10;
  const radialPower = lerp(1, 0.18, press * 0.3 + square * 0.7);
  const verticalPower = lerp(1, 0.28, press * 0.3 + square * 0.7);
  // Integrate the section profile so widening pushes mass outward, not into existence.
  let area = 0,
    profile = 0;
  const steps = 64;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const weight = i === 0 || i === steps ? 1 : i % 2 ? 4 : 2;
    area += weight * Math.max(0, 1 - t ** exponent) ** (1 / exponent);
    profile +=
      weight * Math.max(0, 1 - t ** (2 / verticalPower)) ** radialPower;
  }
  area *= 4 / (3 * steps);
  profile /= 3 * steps;
  const halfHeight = VOLUME / (2 * area * profile * rx * rz);
  const turn = smooth(progress, 0.52, 0.61);
  const travel =
    progress < 0.55
      ? lerp(-1.55, 1.95, smooth(progress, 0.08, 0.53))
      : lerp(1.95, -2.1, smooth(progress, 0.61, 0.92));
  const pressure =
    smooth(progress, 0.12, 0.21) * (1 - smooth(progress, 0.46, 0.53)) +
    smooth(progress, 0.62, 0.69) * (1 - smooth(progress, 0.84, 0.91));
  return {
    rx,
    rz,
    exponent,
    radialPower,
    verticalPower,
    halfHeight,
    square,
    turn: (turn * Math.PI) / 2,
    travel,
    pressure,
    tool: smooth(progress, 0.04, 0.12) * (1 - smooth(progress, 0.92, 1)),
  };
}

export type DoughPose = ReturnType<typeof doughPose>;

export function doughHeightAt(x: number, z: number, pose: DoughPose) {
  const radius =
    (Math.abs(x / pose.rx) ** pose.exponent +
      Math.abs(z / pose.rz) ** pose.exponent) **
    (1 / pose.exponent);
  const ny = Math.sqrt(Math.max(0, 1 - radius ** (2 / pose.radialPower)));
  return DOUGH_BASE + pose.halfHeight * (1 + ny ** pose.verticalPower);
}

export function sampleDough(
  nx: number,
  ny: number,
  nz: number,
  pose: DoughPose,
  out: Vector3,
) {
  const angle = Math.atan2(nz, nx);
  const radial = Math.max(0, 1 - ny * ny) ** (pose.radialPower / 2);
  const c = Math.cos(angle),
    s = Math.sin(angle);
  const edge =
    1 +
    (Math.sin(angle * 3 + ny * 2) * 0.018 +
      Math.cos(angle * 7 - ny * 3) * 0.009) *
      (1 - pose.square * 0.6);
  let x =
    Math.sign(c) * Math.abs(c) ** (2 / pose.exponent) * radial * pose.rx * edge;
  let z =
    Math.sign(s) * Math.abs(s) ** (2 / pose.exponent) * radial * pose.rz * edge;
  const top = Math.max(0, ny);
  const along = x * Math.sin(pose.turn) + z * Math.cos(pose.turn);
  const contact =
    Math.exp(-(((along - pose.travel) / 0.25) ** 2)) * pose.pressure;
  const displacement = contact * top * pose.halfHeight * 0.2;
  x *= 1 + contact * top * 0.012;
  z *= 1 + contact * top * 0.012;
  const y =
    DOUGH_BASE +
    pose.halfHeight +
    Math.sign(ny) * Math.abs(ny) ** pose.verticalPower * pose.halfHeight -
    displacement;
  return out.set(x, y, z);
}
