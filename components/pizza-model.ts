import * as THREE from "three";

export type Resources = { keep: <T extends { dispose(): void }>(item: T) => T };
const SIZE = 3.6;
const SEGMENTS = 42;

function noise(x: number, y: number) {
  return (Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1;
}

export function makeDoughTexture({ keep }: Resources) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const pixels = ctx.createImageData(512, 128);
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 512; x++) {
      const n = Math.abs(noise(x, y));
      const pore = n > 0.95 ? 0.45 : 0.85 + n * 0.2;
      const toast = y < 25 || y > 105 ? 0.75 : 1;
      const i = (y * 512 + x) * 4;
      pixels.data[i] = 217 * pore * toast;
      pixels.data[i + 1] = 155 * pore * toast;
      pixels.data[i + 2] = 73 * pore * toast;
      pixels.data[i + 3] = 255;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  const texture = keep(new THREE.CanvasTexture(canvas));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.set(2, 1);
  return texture;
}

export function buildPizza(image: HTMLImageElement, { keep }: Resources) {
  const texture = keep(new THREE.Texture(image));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  const sample = document.createElement("canvas");
  sample.width = sample.height = 256;
  const ctx = sample.getContext("2d")!;
  ctx.drawImage(image, 0, 0, 256, 256);
  const pixels = ctx.getImageData(0, 0, 256, 256).data;
  // The photographed ingredients drive the surface relief, not just its color.
  function height(u: number, v: number) {
    const x = Math.min(255, Math.max(0, Math.round(u * 255)));
    const z = Math.min(255, Math.max(0, Math.round(v * 255)));
    const p = (z * 256 + x) * 4;
    const red = Math.max(0, pixels[p] - pixels[p + 1] * 1.24) / 255;
    const edge = Math.min(u, v, 1 - u, 1 - v);
    return (
      0.052 +
      red * 0.043 +
      Math.sin(u * 80) * Math.cos(v * 79) * 0.008 +
      (edge < 0.026 ? 0.025 : 0)
    );
  }
  const surface = keep(
    new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.69,
      metalness: 0,
      bumpMap: texture,
      bumpScale: 0.018,
    }),
  );
  const dough = keep(
    new THREE.MeshStandardMaterial({
      map: makeDoughTexture({ keep }),
      roughness: 0.94,
    }),
  );
  const group = new THREE.Group();
  const slices: THREE.Group[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const slice = new THREE.Group();
      slice.position.set((col - 1) * 1.208, 0, (row - 1) * 1.208);
      slice.userData.home = slice.position.clone();
      const positions: number[] = [],
        uvs: number[] = [],
        indices: number[] = [];
      for (let z = 0; z <= SEGMENTS; z++) {
        for (let x = 0; x <= SEGMENTS; x++) {
          const u = (col + x / SEGMENTS) / 3,
            v = (row + z / SEGMENTS) / 3;
          positions.push(
            ((x / SEGMENTS - 0.5) * SIZE) / 3,
            height(u, v),
            ((z / SEGMENTS - 0.5) * SIZE) / 3,
          );
          uvs.push(u, 1 - v);
          if (z < SEGMENTS && x < SEGMENTS) {
            const i = z * (SEGMENTS + 1) + x;
            indices.push(
              i,
              i + SEGMENTS + 1,
              i + 1,
              i + 1,
              i + SEGMENTS + 1,
              i + SEGMENTS + 2,
            );
          }
        }
      }
      const top = keep(new THREE.BufferGeometry());
      top.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      top.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      top.setIndex(indices);
      top.computeVertexNormals();
      const topMesh = new THREE.Mesh(top, surface);
      topMesh.castShadow = true;
      topMesh.receiveShadow = true;
      slice.add(topMesh);
      const sidePositions: number[] = [],
        sideUvs: number[] = [],
        sideIndices: number[] = [];
      const rim: [number, number][] = [];
      for (let x = 0; x <= SEGMENTS; x++) rim.push([x / SEGMENTS, 0]);
      for (let z = 1; z <= SEGMENTS; z++) rim.push([1, z / SEGMENTS]);
      for (let x = SEGMENTS - 1; x >= 0; x--) rim.push([x / SEGMENTS, 1]);
      for (let z = SEGMENTS - 1; z >= 0; z--) rim.push([0, z / SEGMENTS]);
      rim.forEach(([x, z], i) => {
        const h = height((col + x) / 3, (row + z) / 3);
        sidePositions.push(
          (x - 0.5) * 1.2,
          h,
          (z - 0.5) * 1.2,
          (x - 0.5) * 1.2,
          -0.036,
          (z - 0.5) * 1.2,
        );
        sideUvs.push((i / rim.length) * 2, 1, (i / rim.length) * 2, 0);
        if (i < rim.length - 1)
          sideIndices.push(
            i * 2,
            i * 2 + 2,
            i * 2 + 1,
            i * 2 + 1,
            i * 2 + 2,
            i * 2 + 3,
          );
      });
      const side = keep(new THREE.BufferGeometry());
      side.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(sidePositions, 3),
      );
      side.setAttribute("uv", new THREE.Float32BufferAttribute(sideUvs, 2));
      side.setIndex(sideIndices);
      side.computeVertexNormals();
      const sides = new THREE.Mesh(side, dough);
      sides.castShadow = true;
      slice.add(sides);
      const bottom = new THREE.Mesh(
        keep(new THREE.PlaneGeometry(1.2, 1.2)),
        dough,
      );
      bottom.rotation.x = Math.PI / 2;
      bottom.position.y = -0.036;
      slice.add(bottom);
      group.add(slice);
      slices.push(slice);
    }
  }
  return { group, slices };
}
