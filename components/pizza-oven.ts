import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { Resources } from "./pizza-model";

const { smoothstep: smooth, lerp } = THREE.MathUtils;

export function ovenMotion(local: number) {
  const insert = smooth(local, 0.08, 0.34);
  const withdraw = smooth(local, 0.35, 0.52);
  return {
    pizzaZ: lerp(1.1, -1.85, insert),
    pizzaY: lerp(0.025, -0.026, smooth(local, 0.34, 0.4)),
    peelZ: lerp(1.1, -1.85, insert) + withdraw * 10,
    peelY: -withdraw * 0.07,
    peelVisible: local < 0.53,
  };
}

export function buildOven({ keep }: Resources, onAsset: () => void) {
  const group = new THREE.Group();
  const texture = keep(
    new THREE.TextureLoader().load(
      "/images/materials/oven-stone.webp",
      onAsset,
    ),
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.anisotropy = 4;
  const stone = keep(
    new THREE.MeshStandardMaterial({
      map: texture,
      bumpMap: texture,
      bumpScale: 0.025,
      roughness: 0.95,
      color: "#9d958a",
    }),
  );
  const refractory = keep(
    new THREE.MeshStandardMaterial({
      map: texture,
      bumpMap: texture,
      bumpScale: 0.018,
      roughness: 1,
      color: "#74685b",
    }),
  );
  const steel = keep(
    new THREE.MeshStandardMaterial({
      color: "#242629",
      metalness: 0.74,
      roughness: 0.48,
    }),
  );
  const black = keep(
    new THREE.MeshStandardMaterial({
      color: "#101113",
      metalness: 0.35,
      roughness: 0.7,
    }),
  );
  const hot = keep(
    new THREE.MeshStandardMaterial({
      color: "#743923",
      emissive: "#ff541c",
      emissiveIntensity: 1.6,
      roughness: 0.65,
    }),
  );
  function block(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material,
    parent = group,
  ) {
    const mesh = new THREE.Mesh(
      keep(new RoundedBoxGeometry(w, h, d, 2, 0.025)),
      material,
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  // A low baking chamber with an actual mouth and a single continuous hearth.
  block(6.6, 0.22, 8.8, 0, -0.19, -1.6, stone);
  block(0.26, 2.4, 7, -3.25, 1.06, -1.85, refractory);
  block(0.26, 2.4, 7, 3.25, 1.06, -1.85, refractory);
  block(6.7, 2.4, 0.24, 0, 1.06, -5.3, refractory);
  block(6.7, 0.23, 7, 0, 2.24, -1.85, refractory);
  // The dark fascia is part of the oven, not a UI frame around the scene.
  block(30, 12, 0.5, 0, 8.4, 1.8, black);
  block(30, 12, 0.5, 0, -6.35, 1.8, black);
  block(12, 2.8, 0.5, -9.4, 1.05, 1.8, black);
  block(12, 2.8, 0.5, 9.4, 1.05, 1.8, black);
  block(7, 0.15, 0.44, 0, 2.32, 1.9, steel);
  block(7, 0.12, 0.62, 0, -0.24, 2, steel);
  for (const x of [-3.38, 3.38]) block(0.16, 2.6, 0.44, x, 1.04, 1.9, steel);
  for (let i = 0; i < 5; i++) {
    block(0.07, 0.055, 5.7, -2.2 + i * 1.1, 2.17, -1.9, hot);
    block(0.13, 0.055, 5.8, -2.2 + i * 1.1, 2.15, -1.9, steel);
  }
  const light = new THREE.PointLight("#ffae65", 13, 10, 1.5);
  light.position.set(-2.25, 1.55, -2.8);
  group.add(light);
  const fill = new THREE.PointLight("#ffd9a5", 8, 9, 1.5);
  fill.position.set(2.3, 1.65, -1.1);
  group.add(fill);
  const contact = new THREE.SpotLight("#ffe1b0", 10, 9, 1.15, 0.7, 1.5);
  contact.position.set(-1.6, 1.8, -1);
  contact.target.position.set(0, 0, -1.85);
  contact.castShadow = true;
  contact.shadow.mapSize.set(1024, 1024);
  contact.shadow.bias = -0.0003;
  contact.shadow.normalBias = 0.008;
  contact.shadow.radius = 3;
  group.add(contact, contact.target);
  keep({ dispose: () => contact.shadow.dispose() });
  const peel = new THREE.Group();
  group.add(peel);
  const aluminium = keep(
    new THREE.MeshStandardMaterial({
      color: "#a0a2a3",
      metalness: 0.82,
      roughness: 0.36,
    }),
  );
  block(3.9, 0.035, 3.95, 0, -0.049, 0, aluminium, peel);
  block(0.15, 0.1, 4.9, 0, -0.05, 4.05, aluminium, peel);
  const handle = new THREE.Mesh(
    keep(new THREE.CylinderGeometry(0.11, 0.11, 2, 20)),
    keep(new THREE.MeshStandardMaterial({ color: "#986b40", roughness: 0.8 })),
  );
  handle.rotation.x = Math.PI / 2;
  handle.position.set(0, -0.05, 6.5);
  handle.castShadow = true;
  peel.add(handle);
  function update(local: number, time: number, quiet: boolean) {
    const pose = ovenMotion(local);
    peel.visible = pose.peelVisible;
    peel.position.set(0, pose.peelY, pose.peelZ);
    light.intensity = 13 + (quiet ? 0 : Math.sin(time * 0.0017) * 0.22);
  }
  return { group, light, hot, update, peel };
}
