import * as THREE from "three";

type SurfaceSample = { vertex: number; u: number; v: number; height: number };
const PIZZA_SIZE = 3.12;
const HALF_PIZZA = PIZZA_SIZE / 2;

export function canvas2d(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");
  return { canvas, context };
}

function noise(x: number, y: number) {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

export function breadTexture(cut: boolean) {
  const { canvas, context } = canvas2d(512, 128);
  const gradient = context.createLinearGradient(0, 0, 0, 128);
  gradient.addColorStop(0, cut ? "#eac081" : "#a84f20");
  gradient.addColorStop(0.22, cut ? "#f6dbac" : "#e6a54e");
  gradient.addColorStop(0.75, cut ? "#edcd99" : "#c88135");
  gradient.addColorStop(1, "#a4592a");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 1050; i++) {
    const x = noise(i, 1) * 512;
    const y = noise(i, 2) * 128;
    const radius = (cut ? 0.4 : 0.7) + noise(i, 3) * (cut ? 2.5 : 5);
    context.fillStyle = cut
      ? `rgba(131,85,42,${0.09 + noise(i, 4) * 0.17})`
      : `rgba(82,31,12,${0.06 + noise(i, 4) * 0.26})`;
    context.beginPath();
    context.ellipse(x, y, radius * 1.7, radius, noise(i, 5), 0, Math.PI * 2);
    context.fill();
  }
  return canvas;
}

export function sliceGeometry(column: number, row: number) {
  const segments = 26;
  const stride = segments + 1;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const samples: SurfaceSample[] = [];
  const centerX = (column - 1) * (PIZZA_SIZE / 3);
  const centerZ = (row - 1) * (PIZZA_SIZE / 3);
  const half = PIZZA_SIZE / 6 - 0.006;
  const point = (x: number, z: number) => {
    // Round only the four outside corners; the nine cut faces stay straight.
    const radius = 0.13;
    const limit = HALF_PIZZA - radius;
    const dx = Math.max(0, Math.abs(x) - limit);
    const dz = Math.max(0, Math.abs(z) - limit);
    const distance = Math.hypot(dx, dz);
    if (distance > radius) {
      x = Math.sign(x) * (limit + (dx / distance) * radius);
      z = Math.sign(z) * (limit + (dz / distance) * radius);
    }
    const edge = HALF_PIZZA - Math.max(Math.abs(x), Math.abs(z));
    const crust = 1 - THREE.MathUtils.smoothstep(edge, 0.025, 0.17);
    const height = 0.105 + crust * 0.067 + Math.sin(x * 29 + z * 19) * 0.004;
    return { x, z, height, u: x / PIZZA_SIZE + 0.5, v: 0.5 - z / PIZZA_SIZE };
  };
  const top: ReturnType<typeof point>[] = [];
  for (let z = 0; z <= segments; z++) {
    for (let x = 0; x <= segments; x++) {
      const p = point(
        centerX - half + (x / segments) * half * 2,
        centerZ - half + (z / segments) * half * 2,
      );
      const vertex = positions.length / 3;
      positions.push(p.x - centerX, p.height, p.z - centerZ);
      uvs.push(p.u, p.v);
      samples.push({ vertex, u: p.u, v: p.v, height: p.height });
      top.push(p);
    }
  }
  for (let z = 0; z < segments; z++) {
    for (let x = 0; x < segments; x++) {
      const a = z * stride + x;
      indices.push(a, a + stride, a + 1, a + 1, a + stride, a + stride + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.addGroup(0, indices.length, 0);
  const edges = [
    { points: Array.from({ length: stride }, (_, i) => i), outside: row === 0 },
    {
      points: Array.from({ length: stride }, (_, i) => i * stride + segments),
      outside: column === 2,
    },
    {
      points: Array.from(
        { length: stride },
        (_, i) => segments * stride + segments - i,
      ),
      outside: row === 2,
    },
    {
      points: Array.from({ length: stride }, (_, i) => (segments - i) * stride),
      outside: column === 0,
    },
  ];
  for (const edge of edges) {
    const start = indices.length;
    const base = positions.length / 3;
    edge.points.forEach((index, i) => {
      const p = top[index];
      const vertex = positions.length / 3;
      positions.push(
        p.x - centerX,
        p.height,
        p.z - centerZ,
        p.x - centerX,
        -0.15,
        p.z - centerZ,
      );
      uvs.push(i / segments, 1, i / segments, 0);
      samples.push({ vertex, u: p.u, v: p.v, height: p.height });
    });
    for (let i = 0; i < segments; i++) {
      const a = base + i * 2;
      indices.push(a, a + 2, a + 1, a + 2, a + 3, a + 1);
    }
    geometry.addGroup(start, indices.length - start, edge.outside ? 1 : 2);
  }
  const bottom = positions.length / 3;
  for (const index of [0, segments, stride * stride - 1, segments * stride]) {
    const p = top[index];
    positions.push(p.x - centerX, -0.15, p.z - centerZ);
    uvs.push(p.u, p.v);
  }
  const start = indices.length;
  indices.push(bottom, bottom + 1, bottom + 2, bottom, bottom + 2, bottom + 3);
  geometry.addGroup(start, 6, 2);
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return { geometry, samples };
}
