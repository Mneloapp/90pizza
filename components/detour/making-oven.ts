import * as THREE from "three";
import type { Resources } from "../pizza-model";

export function buildMakingOven({ keep }: Resources, onAsset: () => void) {
  const group = new THREE.Group();
  const stoneMap = keep(
    new THREE.TextureLoader().load(
      "/images/materials/oven-stone.webp",
      onAsset,
    ),
  );
  stoneMap.colorSpace = THREE.SRGBColorSpace;
  stoneMap.wrapS = stoneMap.wrapT = THREE.RepeatWrapping;
  stoneMap.repeat.set(3, 3);
  const stone = keep(
    new THREE.MeshStandardMaterial({
      map: stoneMap,
      color: "#55463b",
      bumpMap: stoneMap,
      bumpScale: 0.045,
      roughness: 0.97,
    }),
  );
  const iron = keep(
    new THREE.MeshStandardMaterial({
      color: "#181917",
      roughness: 0.65,
      metalness: 0.7,
    }),
  );
  const ember = keep(
    new THREE.MeshStandardMaterial({
      color: "#e77229",
      emissive: "#ff4b0a",
      emissiveIntensity: 3,
      roughness: 0.8,
    }),
  );
  const cube = keep(new THREE.BoxGeometry(1, 1, 1));
  function panel(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    material: THREE.Material,
  ) {
    const mesh = new THREE.Mesh(cube, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    group.add(mesh);
    return mesh;
  }
  panel(0, -0.12, 0, 18, 0.2, 16, stone);
  panel(0, 6, -7, 40, 12, 0.18, stone);
  panel(-14, 6, 0, 0.2, 12, 14, iron);
  panel(14, 6, 0, 0.2, 12, 14, iron);
  panel(0, 12, 0, 28, 0.2, 14, iron);
  const coilPoints = Array.from(
    { length: 48 },
    (_, i) =>
      new THREE.Vector3(
        -7 + i * 0.3,
        2.2 + Math.sin((i * Math.PI) / 2) * 0.07,
        -6.8,
      ),
  );
  const coil = new THREE.Mesh(
    keep(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(coilPoints),
        128,
        0.017,
        8,
        false,
      ),
    ),
    ember,
  );
  group.add(coil);
  const light = new THREE.PointLight("#ff953c", 0, 14, 2);
  light.position.set(-1, 2, -2.3);
  group.add(light);
  const glow = new THREE.PointLight("#ffd6a0", 0, 10, 2);
  glow.position.set(2, 1.5, 1);
  group.add(glow);
  const bubbles = new THREE.InstancedMesh(
    keep(new THREE.SphereGeometry(1, 12, 8)),
    keep(
      new THREE.MeshPhysicalMaterial({
        color: "#f2c778",
        roughness: 0.4,
        clearcoat: 0.2,
      }),
    ),
    36,
  );
  const dummy = new THREE.Object3D();
  group.add(bubbles);
  const seeds = Array.from({ length: 36 }, (_, i) => {
    const n = (j: number) => Math.abs(Math.sin(j * 127.1) * 43758.5453) % 1;
    return {
      x: (n(i + 1) - 0.5) * 2.65,
      z: (n(i + 72) - 0.5) * 2.65,
      phase: n(i + 36) * 6.28,
      r: 0.018 + n(i + 18) * 0.025,
    };
  });
  return {
    group,
    update(amount: number, bake: number, time: number) {
      group.visible = amount > 0.002;
      group.position.z = -(1 - amount) * 18;
      light.intensity = amount * (16 + Math.sin(time * 3.7) * 0.6);
      glow.intensity = amount * 7;
      bubbles.visible = amount > 0.7 && bake > 0.1 && bake < 0.98;
      if (bubbles.visible) {
        seeds.forEach((s, i) => {
          const pulse = Math.sin(time * 2 + s.phase) * 0.5 + 0.5;
          dummy.position.set(s.x, 0.14, s.z);
          dummy.scale.set(s.r * (0.8 + pulse * 0.35), s.r * (0.3 + pulse), s.r);
          dummy.updateMatrix();
          bubbles.setMatrixAt(i, dummy.matrix);
        });
        bubbles.instanceMatrix.needsUpdate = true;
      }
    },
  };
}
