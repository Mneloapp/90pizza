import * as THREE from "three";
import type { Resources } from "./pizza-model";

export function cheeseConnections() {
  const pairs: { a: number; b: number; axis: "x" | "z"; offset: number }[] = [];
  for (let i = 0; i < 9; i++) {
    for (const offset of [-0.39, -0.14, 0.12, 0.37]) {
      if (i % 3 < 2) pairs.push({ a: i, b: i + 1, axis: "x", offset });
      if (i < 6) pairs.push({ a: i, b: i + 3, axis: "z", offset });
    }
  }
  return pairs;
}

export function buildCheese({ keep }: Resources) {
  const group = new THREE.Group();
  const material = keep(
    new THREE.MeshPhysicalMaterial({
      color: "#fff0c5",
      roughness: 0.43,
      clearcoat: 0.16,
      side: THREE.DoubleSide,
    }),
  );
  const rings = 20,
    sides = 6;
  const pairs = cheeseConnections();
  const strands = pairs.map(() => {
    const geometry = keep(new THREE.BufferGeometry());
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float32Array((rings + 1) * sides * 3),
        3,
      ).setUsage(THREE.DynamicDrawUsage),
    );
    const indices: number[] = [];
    for (let s = 0; s < rings; s++)
      for (let r = 0; r < sides; r++) {
        const a = s * sides + r,
          b = s * sides + ((r + 1) % sides);
        indices.push(a, b, a + sides, b, b + sides, a + sides);
      }
    geometry.setIndex(indices);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    group.add(mesh);
    return mesh;
  });
  const start = new THREE.Vector3(),
    end = new THREE.Vector3(),
    tangent = new THREE.Vector3();
  const normal = new THREE.Vector3(),
    binormal = new THREE.Vector3(),
    point = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0),
    right = new THREE.Vector3(1, 0, 0);
  let active = 0,
    previous = "";
  function update(slices: THREE.Group[], spread: number, lift: number) {
    group.visible = spread > 0.015 || lift > 0.015;
    if (!group.visible) {
      active = 0;
      return;
    }
    const signature = `${spread.toFixed(4)}/${lift.toFixed(4)}`;
    if (signature === previous) return;
    previous = signature;
    active = 0;
    slices.forEach((slice) => slice.updateMatrix());
    pairs.forEach(({ a, b, axis, offset }, index) => {
      const variation = Math.sin((a * 13 + b * 7 + offset * 31) * 1.7);
      const unevenOffset = offset + variation * 0.055;
      start
        .set(
          axis === "x" ? 0.57 : unevenOffset,
          0.075,
          axis === "z" ? 0.57 : unevenOffset,
        )
        .applyMatrix4(slices[a].matrix);
      end
        .set(
          axis === "x" ? -0.57 : unevenOffset + variation * 0.025,
          0.075,
          axis === "z" ? -0.57 : unevenOffset + variation * 0.025,
        )
        .applyMatrix4(slices[b].matrix);
      const length = start.distanceTo(end);
      const mesh = strands[index];
      mesh.visible = length > 0.085;
      if (!mesh.visible) return;
      active++;
      const positions = mesh.geometry.attributes
        .position as THREE.BufferAttribute;
      const sag = Math.min(0.26, length * 0.22);
      for (let s = 0; s <= rings; s++) {
        const t = s / rings;
        point.lerpVectors(start, end, t);
        point.y -= Math.sin(t * Math.PI) * sag;
        tangent.subVectors(end, start);
        tangent.y -= Math.cos(t * Math.PI) * Math.PI * sag;
        tangent.normalize();
        normal
          .crossVectors(tangent, Math.abs(tangent.y) > 0.9 ? right : up)
          .normalize();
        binormal.crossVectors(tangent, normal).normalize();
        const attachment = Math.abs(t * 2 - 1) ** 4;
        const radius =
          ((0.014 + attachment * 0.042) * (0.9 + variation * 0.2)) /
          Math.sqrt(1 + length * 1.8);
        for (let r = 0; r < sides; r++) {
          const angle = (r / sides) * Math.PI * 2;
          const nx = Math.cos(angle) * radius,
            ny = Math.sin(angle) * radius;
          positions.setXYZ(
            s * sides + r,
            point.x + normal.x * nx + binormal.x * ny,
            point.y + normal.y * nx + binormal.y * ny,
            point.z + normal.z * nx + binormal.z * ny,
          );
        }
      }
      positions.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
    });
  }
  return {
    group,
    update,
    get active() {
      return active;
    },
  };
}
