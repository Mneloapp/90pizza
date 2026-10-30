import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

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

export function buildBox({ keep }: Resources) {
  const group = new THREE.Group();
  const red = keep(
    new THREE.MeshStandardMaterial({ color: "#e01010", roughness: 0.72 }),
  );
  const kraft = keep(
    new THREE.MeshStandardMaterial({ color: "#c19b70", roughness: 1 }),
  );
  const white = keep(
    new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.8 }),
  );
  function panel(
    width: number,
    height: number,
    depth: number,
    material: THREE.Material,
    parent = group,
  ) {
    const mesh = new THREE.Mesh(
      keep(new RoundedBoxGeometry(width, height, depth, 2, 0.009)),
      material,
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  panel(4.04, 0.045, 4.04, red).position.y = -0.12;
  panel(3.96, 0.02, 3.96, kraft).position.y = -0.085;
  for (const x of [-1.99, 1.99]) {
    panel(0.035, 0.19, 4, red).position.set(x, -0.015, 0);
    panel(0.008, 0.17, 3.94, kraft).position.set(
      x - Math.sign(x) * 0.023,
      -0.02,
      0,
    );
  }
  panel(4, 0.19, 0.035, red).position.set(0, -0.015, 1.99);
  panel(3.94, 0.17, 0.009, kraft).position.set(0, -0.02, 1.967);
  panel(4, 0.12, 0.035, red).position.set(0, -0.05, -1.99);
  const hinge = new THREE.Group();
  hinge.position.set(0, -0.07, -2);
  group.add(hinge);
  panel(4.04, 0.035, 4.04, red, hinge).position.set(0, 0, 2);
  panel(3.95, 0.009, 3.95, kraft, hinge).position.set(0, -0.023, 2);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#e01010";
  ctx.fillRect(0, 0, 1024, 1024);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 185px Arial";
  ctx.textAlign = "center";
  ctx.fillText("90pizza", 512, 580);
  ctx.font = "24px Arial";
  ctx.fillText("PIZZA AT THE RIGHT ANGLE", 512, 645);
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(90, 90);
  ctx.lineTo(90, 190);
  ctx.lineTo(190, 190);
  ctx.stroke();
  ctx.font = "30px Arial";
  ctx.fillText("30 × 30 / 09", 512, 922);
  const artwork = keep(new THREE.CanvasTexture(canvas));
  artwork.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(
    keep(new THREE.PlaneGeometry(4, 4)),
    keep(new THREE.MeshStandardMaterial({ map: artwork, roughness: 0.76 })),
  );
  face.rotation.x = -Math.PI / 2;
  face.position.set(0, 0.021, 2);
  hinge.add(face);
  const insideCanvas = document.createElement("canvas");
  insideCanvas.width = insideCanvas.height = 1024;
  const inside = insideCanvas.getContext("2d")!;
  inside.fillStyle = "#c19b70";
  inside.fillRect(0, 0, 1024, 1024);
  inside.fillStyle = "#171310";
  inside.font = "bold 176px Arial";
  inside.textAlign = "center";
  inside.fillText("90pizza", 512, 555);
  inside.font = "24px Arial";
  inside.fillText("30 × 30 / 09", 512, 620);
  inside.strokeStyle = "#171310";
  inside.lineWidth = 8;
  inside.beginPath();
  inside.moveTo(90, 110);
  inside.lineTo(90, 200);
  inside.lineTo(180, 200);
  inside.stroke();
  const insideTexture = keep(new THREE.CanvasTexture(insideCanvas));
  insideTexture.colorSpace = THREE.SRGBColorSpace;
  const insideFace = new THREE.Mesh(
    keep(new THREE.PlaneGeometry(3.94, 3.94)),
    keep(new THREE.MeshStandardMaterial({ map: insideTexture, roughness: 1 })),
  );
  insideFace.rotation.x = Math.PI / 2;
  insideFace.position.set(0, -0.031, 2);
  hinge.add(insideFace);
  // Small physical tabs, not an extra frame around the pizza.
  for (const x of [-1.98, 1.98])
    panel(0.035, 0.12, 3.9, red, hinge).position.set(x, -0.07, 2);
  const label = new THREE.Mesh(keep(new THREE.PlaneGeometry(0.56, 0.1)), white);
  label.position.set(1.25, -0.015, 2.011);
  group.add(label);
  return { group, hinge };
}

export function buildCheese({ keep }: Resources) {
  const group = new THREE.Group();
  const material = keep(
    new THREE.MeshPhysicalMaterial({
      color: "#ffe7ac",
      roughness: 0.34,
      clearcoat: 0.22,
      side: THREE.DoubleSide,
    }),
  );
  const strands = Array.from({ length: 6 }, () => {
    const geometry = keep(new THREE.BufferGeometry());
    const positions = new Float32Array(33 * 6 * 3);
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const indices: number[] = [];
    for (let s = 0; s < 32; s++)
      for (let r = 0; r < 6; r++) {
        const a = s * 6 + r,
          b = s * 6 + ((r + 1) % 6);
        indices.push(a, b, a + 6, b, b + 6, a + 6);
      }
    geometry.setIndex(indices);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    group.add(mesh);
    return geometry;
  });
  const start = new THREE.Vector3(),
    end = new THREE.Vector3();
  const anchors = [
    [0.57, -0.45],
    [0.57, 0.04],
    [0.57, 0.42],
    [-0.42, -0.57],
    [0.03, -0.57],
    [0.45, -0.57],
  ];
  function update(slice: THREE.Group, lift: number) {
    group.visible = lift > 0.025;
    if (!group.visible) return;
    slice.updateMatrix();
    strands.forEach((geometry, index) => {
      const [x, z] = anchors[index];
      start.set(
        -1.208 + x + (index < 3 ? 0.065 : 0),
        0.06,
        1.208 + z - (index >= 3 ? 0.065 : 0),
      );
      end.set(x, 0.05, z).applyMatrix4(slice.matrix);
      const attribute = geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      for (let s = 0; s <= 32; s++) {
        const t = s / 32;
        const sag = Math.sin(t * Math.PI) * (0.13 + index * 0.02) * lift;
        const radius =
          (0.014 + Math.pow(Math.abs(t - 0.5) * 2, 5) * 0.044) *
          (1 - 0.15 * lift);
        const bend =
          Math.sin(t * Math.PI) * (index % 2 ? -0.065 : 0.085) * lift;
        for (let r = 0; r < 6; r++) {
          const angle = (r / 6) * Math.PI * 2;
          attribute.setXYZ(
            s * 6 + r,
            THREE.MathUtils.lerp(start.x, end.x, t) +
              bend +
              Math.cos(angle) * radius,
            THREE.MathUtils.lerp(start.y, end.y, t) - sag,
            THREE.MathUtils.lerp(start.z, end.z, t) + Math.sin(angle) * radius,
          );
        }
      }
      attribute.needsUpdate = true;
      geometry.computeVertexNormals();
    });
  }
  return { group, update };
}
