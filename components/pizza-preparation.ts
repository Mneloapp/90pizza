import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { Resources } from "./pizza-model";

const smooth = THREE.MathUtils.smoothstep;
const random = (n: number) => {
  const v = Math.sin(n * 127.1 + 41.7) * 43758.5453;
  return v - Math.floor(v);
};

export function buildPreparation({ keep }: Resources, onAsset: () => void) {
  const group = new THREE.Group();
  const geometry = keep(new THREE.SphereGeometry(1, 48, 24));
  const original = new Float32Array(geometry.attributes.position.array);
  const doughMaterial = keep(
    new THREE.MeshStandardMaterial({ color: "#ead7b1", roughness: 0.97 }),
  );
  const dough = new THREE.Mesh(geometry, doughMaterial);
  dough.castShadow = true;
  dough.receiveShadow = true;
  group.add(dough);
  const sauceMaterial = keep(
    new THREE.MeshStandardMaterial({ color: "#a91d0d", roughness: 0.43 }),
  );
  const sauce = new THREE.Mesh(
    keep(new RoundedBoxGeometry(3.35, 0.025, 3.35, 3, 0.012)),
    sauceMaterial,
  );
  sauce.position.y = 0.079;
  sauce.receiveShadow = true;
  group.add(sauce);
  const spiralPoints = Array.from({ length: 100 }, (_, i) => {
    const angle = (i / 99) * Math.PI * 8,
      r = 0.08 + (i / 99) * 1.55;
    return new THREE.Vector3(Math.cos(angle) * r, 0.103, Math.sin(angle) * r);
  });
  const spiralGeometry = keep(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(spiralPoints),
      160,
      0.045,
      5,
      false,
    ),
  );
  const spiral = new THREE.Mesh(spiralGeometry, sauceMaterial);
  group.add(spiral);

  const cheeseGeometry = keep(new THREE.CapsuleGeometry(0.022, 0.12, 2, 5));
  const cheeseMaterial = keep(
    new THREE.MeshStandardMaterial({ color: "#fff0d3", roughness: 0.65 }),
  );
  const shreds = new THREE.InstancedMesh(cheeseGeometry, cheeseMaterial, 260);
  shreds.frustumCulled = false;
  keep(shreds);
  shreds.castShadow = true;
  shreds.receiveShadow = true;
  group.add(shreds);
  const dummy = new THREE.Object3D();
  const pepperoniGeometry = keep(new THREE.CircleGeometry(0.19, 32));
  const p = pepperoniGeometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      z = p.getY(i),
      r = Math.hypot(x, z) / 0.19;
    p.setXYZ(i, x, 0.01 + r ** 4 * 0.045, z);
  }
  pepperoniGeometry.computeVertexNormals();
  const pepperoniTexture = keep(
    new THREE.TextureLoader().load("/images/journey/pepperoni.webp", onAsset),
  );
  pepperoniTexture.colorSpace = THREE.SRGBColorSpace;
  const pepperoniMaterial = keep(
    new THREE.MeshStandardMaterial({
      map: pepperoniTexture,
      side: THREE.DoubleSide,
      roughness: 0.48,
      alphaTest: 0.25,
    }),
  );
  const pepperonis = new THREE.InstancedMesh(
    pepperoniGeometry,
    pepperoniMaterial,
    25,
  );
  pepperonis.frustumCulled = false;
  keep(pepperonis);
  pepperonis.castShadow = true;
  pepperonis.receiveShadow = true;
  group.add(pepperonis);

  function update(form: number, topping: number, time: number, quiet: boolean) {
    const shape = smooth(form, 0.03, 0.82);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const nx = original[i * 3],
        ny = original[i * 3 + 1],
        nz = original[i * 3 + 2];
      positions.setXYZ(
        i,
        THREE.MathUtils.lerp(
          nx * 0.75,
          Math.sign(nx) * Math.abs(nx) ** 0.18 * 1.8,
          shape,
        ),
        THREE.MathUtils.lerp(
          ny * 0.38,
          Math.sign(ny) * Math.abs(ny) ** 0.25 * 0.065,
          shape,
        ),
        THREE.MathUtils.lerp(
          nz * 0.75,
          Math.sign(nz) * Math.abs(nz) ** 0.18 * 1.8,
          shape,
        ),
      );
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    const sauceProgress = smooth(topping, 0.02, 0.42);
    sauce.visible = topping > 0.12;
    sauce.scale.set(
      Math.max(0.001, sauceProgress),
      1,
      Math.max(0.001, sauceProgress),
    );
    spiral.visible = topping > 0.01;
    spiralGeometry.setDrawRange(
      0,
      Math.floor(smooth(topping, 0, 0.35) * 160) * 5 * 6,
    );
    for (let i = 0; i < 260; i++) {
      const land = smooth(
        topping,
        0.18 + random(i + 2) * 0.28,
        0.41 + random(i + 2) * 0.28,
      );
      const y = 0.13 + (1 - land) * (1.2 + random(i + 400) * 1.5);
      dummy.position.set(
        (random(i * 3 + 1) - 0.5) * 3.15,
        y,
        (random(i * 3 + 2) - 0.5) * 3.15,
      );
      dummy.rotation.set(
        Math.PI / 2,
        random(i + 90) * Math.PI,
        random(i + 43) * Math.PI + (quiet ? 0 : (1 - land) * time * 0.0002),
      );
      dummy.scale.setScalar(topping > 0.17 ? 0.8 + random(i + 5) * 0.5 : 0);
      dummy.updateMatrix();
      shreds.setMatrixAt(i, dummy.matrix);
    }
    shreds.instanceMatrix.needsUpdate = true;
    shreds.visible = topping > 0.17;
    for (let i = 0; i < 25; i++) {
      const land = smooth(
        topping,
        0.48 + random(i + 100) * 0.2,
        0.7 + random(i + 100) * 0.22,
      );
      dummy.position.set(
        ((i % 5) - 2) * 0.63 + (random(i + 6) - 0.5) * 0.2,
        0.16 + (1 - land) * (1.8 + random(i + 9)),
        (Math.floor(i / 5) - 2) * 0.64 + (random(i + 20) - 0.5) * 0.16,
      );
      dummy.rotation.set((1 - land) * 0.7, random(i + 1) * 6, (1 - land) * 0.5);
      dummy.scale.setScalar(0.87 + random(i + 33) * 0.22);
      dummy.updateMatrix();
      pepperonis.setMatrixAt(i, dummy.matrix);
    }
    pepperonis.instanceMatrix.needsUpdate = true;
    pepperonis.visible = topping > 0.47;
  }
  return { group, update };
}

export function buildOven({ keep }: Resources) {
  const group = new THREE.Group();
  const metal = keep(
    new THREE.MeshStandardMaterial({
      color: "#30302e",
      roughness: 0.65,
      metalness: 0.6,
    }),
  );
  const stone = keep(
    new THREE.MeshStandardMaterial({ color: "#6f675b", roughness: 1 }),
  );
  const hot = keep(
    new THREE.MeshStandardMaterial({
      color: "#ff4a12",
      emissive: "#ff3005",
      emissiveIntensity: 2,
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
  ) {
    const mesh = new THREE.Mesh(
      keep(new RoundedBoxGeometry(w, h, d, 2, 0.035)),
      material,
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }
  block(4.6, 0.18, 4, 0, -0.18, -3.1, stone);
  block(0.23, 1.6, 4, -2.2, 0.62, -3.1, metal);
  block(0.23, 1.6, 4, 2.2, 0.62, -3.1, metal);
  block(4.6, 0.2, 4, 0, 1.46, -3.1, metal);
  block(4.3, 1.4, 0.12, 0, 0.55, -5.1, metal);
  block(4.05, 0.05, 0.08, 0, 1.26, -1.2, hot);
  for (let i = 0; i < 5; i++)
    block(3.85, 0.025, 0.04, 0, 1.25, -1.8 - i * 0.6, hot);
  const light = new THREE.PointLight("#ff6b26", 0, 7, 2);
  light.position.set(0, 0.85, -2.6);
  group.add(light);
  return { group, light, hot };
}
