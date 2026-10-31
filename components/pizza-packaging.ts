import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { Resources } from "./pizza-model";

export const BOX_LID_HEIGHT = 0.42;

export function boxPose(local: number) {
  const { smoothstep: smooth } = THREE.MathUtils;
  return {
    arrival: smooth(local, 0, 0.2),
    landing: smooth(local, 0.08, 0.32),
    open: 1 - smooth(local, 0.34, 0.76),
  };
}

export function buildBox({ keep }: Resources, onAsset: () => void) {
  const group = new THREE.Group();
  const paper = keep(
    new THREE.MeshStandardMaterial({ color: "#fafafa", roughness: 0.86 }),
  );
  const kraft = keep(
    new THREE.MeshStandardMaterial({ color: "#bd9666", roughness: 1 }),
  );
  const edge = keep(
    new THREE.MeshStandardMaterial({ color: "#c0aa88", roughness: 1 }),
  );
  const loaded = new Set<string>();
  function panel(
    w: number,
    h: number,
    d: number,
    material: THREE.Material,
    parent = group,
  ) {
    const mesh = new THREE.Mesh(
      keep(new RoundedBoxGeometry(w, h, d, 2, 0.006)),
      material,
    );
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function print(name: string, w: number, h: number) {
    const texture = keep(
      new THREE.TextureLoader().load(`/images/packaging/${name}.webp`, () => {
        loaded.add(name);
        onAsset();
      }),
    );
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return new THREE.Mesh(
      keep(new THREE.PlaneGeometry(w, h)),
      keep(new THREE.MeshStandardMaterial({ map: texture, roughness: 0.88 })),
    );
  }
  panel(4.04, 0.04, 4.04, edge).position.y = -0.12;
  panel(3.96, 0.015, 3.96, kraft).position.y = -0.092;
  for (const x of [-1.99, 1.99]) {
    panel(0.035, 0.5, 4, paper).position.set(x, 0.15, 0);
    panel(0.009, 0.47, 3.94, kraft).position.set(
      x - Math.sign(x) * 0.024,
      0.15,
      0,
    );
    const side = print(x < 0 ? "left" : "right", 3.98, 0.5);
    side.rotation.y = (Math.sign(x) * Math.PI) / 2;
    side.position.set(x + Math.sign(x) * 0.019, 0.15, 0);
    group.add(side);
  }
  for (const z of [-1.99, 1.99]) {
    panel(4, 0.5, 0.035, paper).position.set(0, 0.15, z);
    panel(3.94, 0.47, 0.009, kraft).position.set(
      0,
      0.15,
      z - Math.sign(z) * 0.024,
    );
    const side = print(z > 0 ? "front" : "back", 3.98, 0.5);
    side.rotation.y = z > 0 ? 0 : Math.PI;
    side.position.set(0, 0.15, z + Math.sign(z) * 0.019);
    group.add(side);
  }
  const hinge = new THREE.Group();
  hinge.position.set(0, BOX_LID_HEIGHT, -2);
  group.add(hinge);
  panel(4.04, 0.027, 4.04, edge, hinge).position.set(0, 0, 2);
  panel(3.97, 0.008, 3.97, kraft, hinge).position.set(0, -0.019, 2);
  const lid = print("lid", 4.03, 4.03);
  lid.rotation.x = -Math.PI / 2;
  lid.position.set(0, 0.0145, 2);
  hinge.add(lid);
  for (const x of [-1.94, 1.94])
    panel(0.025, 0.23, 3.65, kraft, hinge).position.set(x, -0.128, 2);
  panel(3.8, 0.24, 0.026, paper, hinge).position.set(0, -0.13, 3.93);
  return { group, hinge, loaded };
}
