import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { Resources } from "./pizza-model";

const { smoothstep: smooth, lerp } = THREE.MathUtils;
const random = (n: number) => {
  const v = Math.sin(n * 127.1 + 41.7) * 43758.5453;
  return v - Math.floor(v);
};
const SHREDS = 1500;

export function saucePath(t: number) {
  const angle = t * Math.PI * 8;
  const c = Math.cos(angle),
    s = Math.sin(angle);
  const square = (Math.abs(c) ** 8 + Math.abs(s) ** 8) ** (-1 / 8);
  const radius = Math.min(1, t / 0.78) * 1.43;
  return { x: c * square * radius, z: s * square * radius };
}

export function toppingState(t: number) {
  return {
    sauce: smooth(t, 0.025, 0.4),
    cheese: smooth(t, 0.44, 0.75),
    pepperoni: smooth(t, 0.75, 0.98),
  };
}

export function buildToppings({ keep }: Resources, onAsset: () => void) {
  const group = new THREE.Group();
  const dummy = new THREE.Object3D();
  const size = 192;
  const pixels = new Uint8Array(size * size * 4);
  const path = Array.from({ length: 240 }, (_, i) => saucePath(i / 239));
  // Arrival-time field: each patch of sauce appears only after the spoon passes.
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const px = (x / (size - 1) - 0.5) * 3.32;
      const pz = (y / (size - 1) - 0.5) * 3.32;
      let arrival = 2;
      for (let i = 0; i < path.length; i++) {
        if (Math.hypot(px - path[i].x, pz - path[i].z) < 0.29) {
          arrival = i / 239;
          break;
        }
      }
      const n = random(x + y * size);
      const pulp = Math.sin(px * 61 + Math.cos(pz * 45)) * 0.5 + 0.5;
      pixels.set(
        [Math.min(255, arrival * 251), 110 + n * 90, pulp * 255, 255],
        (y * size + x) * 4,
      );
    }
  const field = keep(new THREE.DataTexture(pixels, size, size));
  field.needsUpdate = true;
  field.minFilter = field.magFilter = THREE.LinearFilter;
  const sauceAmount = { value: 0 };
  const tomato = keep(
    new THREE.TextureLoader().load(
      "/images/materials/tomato-albedo.webp",
      onAsset,
    ),
  );
  tomato.colorSpace = THREE.SRGBColorSpace;
  tomato.anisotropy = 4;
  const sauceMaterial = keep(
    new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      map: tomato,
      roughness: 0.58,
      clearcoat: 0.16,
      bumpMap: tomato,
      bumpScale: 0.014,
      side: THREE.DoubleSide,
    }),
  );
  sauceMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.arrivalField = { value: field };
    shader.uniforms.sauceAmount = sauceAmount;
    shader.vertexShader =
      `varying vec2 sauceUv;\n${shader.vertexShader}`.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nsauceUv = uv;",
      );
    shader.fragmentShader =
      `varying vec2 sauceUv; uniform sampler2D arrivalField; uniform float sauceAmount;\n${shader.fragmentShader}`.replace(
        "#include <color_fragment>",
        `#include <color_fragment>
      vec4 pulp = texture2D(arrivalField, sauceUv);
      if (pulp.r > sauceAmount || pulp.r > 0.99 || sauceAmount < 0.001) discard;
      diffuseColor.rgb *= 0.78 + pulp.g * 0.3 + pulp.b * 0.12;`,
      );
  };
  const surface = keep(new THREE.PlaneGeometry(3.32, 3.32, 72, 72));
  surface.rotateX(-Math.PI / 2);
  const positions = surface.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i),
      z = positions.getZ(i);
    positions.setY(i, 0.081 + Math.sin(x * 39) * Math.cos(z * 37) * 0.003);
  }
  // Plane UV's vertical axis is reversed relative to world Z.
  const uv = surface.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
  surface.computeVertexNormals();
  const sauce = new THREE.Mesh(surface, sauceMaterial);
  sauce.receiveShadow = true;
  group.add(sauce);

  const spoon = new THREE.Group();
  const steel = keep(
    new THREE.MeshStandardMaterial({
      color: "#c5c7c8",
      metalness: 0.92,
      roughness: 0.27,
    }),
  );
  const bowlProfile = [
    [0, 0],
    [0.07, 0.005],
    [0.15, 0.025],
    [0.235, 0.08],
    [0.24, 0.09],
    [0.225, 0.095],
    [0.14, 0.04],
    [0.06, 0.02],
    [0, 0.015],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const bowl = new THREE.Mesh(
    keep(new THREE.LatheGeometry(bowlProfile, 48)),
    steel,
  );
  bowl.scale.z = 1.2;
  spoon.add(bowl);
  const handle = new THREE.Mesh(
    keep(new RoundedBoxGeometry(0.075, 0.035, 1.35, 3, 0.015)),
    steel,
  );
  handle.position.set(0, 0.19, 0.86);
  handle.rotation.x = -0.13;
  spoon.add(handle);
  spoon.traverse((child) => {
    if (child instanceof THREE.Mesh) child.castShadow = true;
  });
  group.add(spoon);

  const cheeseAmount = { value: 0 },
    bakeAmount = { value: 0 };
  const mozzarella = keep(
    new THREE.TextureLoader().load(
      "/images/materials/mozzarella-albedo.webp",
      onAsset,
    ),
  );
  mozzarella.colorSpace = THREE.SRGBColorSpace;
  mozzarella.anisotropy = 4;
  const cheeseMaterial = keep(
    new THREE.MeshPhysicalMaterial({
      color: "#fff0d0",
      roughness: 0.79,
      clearcoat: 0.1,
      bumpMap: mozzarella,
      bumpScale: 0.025,
      side: THREE.DoubleSide,
    }),
  );
  cheeseMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.cheeseAmount = cheeseAmount;
    shader.uniforms.bakeAmount = bakeAmount;
    shader.uniforms.mozzarella = { value: mozzarella };
    shader.vertexShader =
      `varying vec2 cheeseUv;\n${shader.vertexShader}`.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\ncheeseUv = uv;",
      );
    shader.fragmentShader =
      `varying vec2 cheeseUv; uniform float cheeseAmount; uniform float bakeAmount; uniform sampler2D mozzarella;\n${shader.fragmentShader}`.replace(
        "#include <color_fragment>",
        `#include <color_fragment>
      vec2 cell = floor(cheeseUv * 62.0);
      float seed = fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
      vec2 edge = abs(cheeseUv - 0.5) * 2.0;
      float rim = pow(pow(edge.x, 16.0) + pow(edge.y, 16.0), 0.0625);
      if (cheeseAmount < 0.001 || seed > cheeseAmount || rim > 0.985 - seed * 0.018) discard;
      vec3 melted = texture2D(mozzarella, cheeseUv).rgb;
      diffuseColor.rgb = mix(diffuseColor.rgb * (0.96 + seed * 0.04), melted, bakeAmount);`,
      );
  };
  const bedGeometry = keep(surface.clone());
  const bedPositions = bedGeometry.attributes.position;
  for (let i = 0; i < bedPositions.count; i++) {
    const x = bedPositions.getX(i),
      z = bedPositions.getZ(i);
    bedPositions.setY(i, 0.113 + Math.sin(x * 32) * Math.cos(z * 28) * 0.008);
  }
  bedGeometry.computeVertexNormals();
  const bed = new THREE.Mesh(bedGeometry, cheeseMaterial);
  bed.receiveShadow = true;
  group.add(bed);
  const shredMaterial = keep(
    new THREE.MeshStandardMaterial({ color: "#fff3d8", roughness: 0.85 }),
  );
  const shreds = keep(
    new THREE.InstancedMesh(
      keep(new THREE.CapsuleGeometry(0.025, 0.12, 2, 4)),
      shredMaterial,
      SHREDS,
    ),
  );
  shreds.frustumCulled = false;
  shreds.receiveShadow = true;
  group.add(shreds);

  const pepperoniGeometry = keep(new THREE.RingGeometry(0.0001, 0.235, 48, 10));
  const p = pepperoniGeometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      z = p.getY(i),
      r = Math.hypot(x, z) / 0.235;
    p.setXYZ(i, x, 0.008 + r ** 4 * (0.035 + Math.sin(i * 1.7) * 0.008), z);
  }
  pepperoniGeometry.computeVertexNormals();
  const pepperoniTexture = keep(
    new THREE.TextureLoader().load("/images/journey/pepperoni.webp", onAsset),
  );
  pepperoniTexture.colorSpace = THREE.SRGBColorSpace;
  const meatMaterial = keep(
    new THREE.MeshPhysicalMaterial({
      map: pepperoniTexture,
      side: THREE.DoubleSide,
      roughness: 0.48,
      clearcoat: 0.2,
      alphaTest: 0.25,
    }),
  );
  const pepperonis = keep(
    new THREE.InstancedMesh(pepperoniGeometry, meatMaterial, 25),
  );
  pepperonis.frustumCulled = false;
  pepperonis.castShadow = pepperonis.receiveShadow = true;
  group.add(pepperonis);
  let lastTopping = -1,
    lastBake = -1;
  function update(t: number, bake = 0) {
    group.visible = t > 0;
    if (t === lastTopping && bake === lastBake) return;
    lastTopping = t;
    lastBake = bake;
    const state = toppingState(t);
    sauceAmount.value = state.sauce;
    cheeseAmount.value = state.cheese;
    bakeAmount.value = bake;
    cheeseMaterial.roughness = lerp(0.79, 0.43, bake);
    const pathPoint = saucePath(state.sauce);
    const toolLift = 1 - smooth(t, 0, 0.025) + smooth(t, 0.4, 0.46);
    spoon.visible = t > 0 && t < 0.46;
    spoon.position.set(pathPoint.x, 0.088 + toolLift * 1.7, pathPoint.z);
    spoon.rotation.y = -state.sauce * Math.PI * 8 + 0.3;
    spoon.rotation.z = 0.06;
    for (let i = 0; i < SHREDS; i++) {
      const start = 0.42 + random(i + 2) * 0.2;
      const flight = smooth(t, start, start + 0.12);
      const landed = flight >= 1;
      dummy.position.set(
        (random(i * 3 + 1) - 0.5) * 3.18,
        0.145 + random(i + 4) * 0.022 + (1 - flight * flight) * 1.8,
        (random(i * 3 + 2) - 0.5) * 3.18,
      );
      dummy.rotation.set(
        Math.PI / 2 + (1 - flight) * 3,
        0,
        random(i + 43) * Math.PI,
      );
      dummy.scale.setScalar(
        t > start
          ? (0.8 + random(i + 5) * 0.5) * (1 - smooth(bake, 0.05, 0.9))
          : 0,
      );
      if (landed) dummy.scale.y *= 1 - bake * 0.3;
      dummy.updateMatrix();
      shreds.setMatrixAt(i, dummy.matrix);
    }
    shreds.instanceMatrix.needsUpdate = true;
    shreds.visible = t > 0.42 && bake < 0.9;
    for (let i = 0; i < 25; i++) {
      const start = 0.75 + random(i + 100) * 0.12;
      const flight = smooth(t, start, start + 0.11);
      dummy.position.set(
        ((i % 5) - 2) * 0.62 + (random(i + 6) - 0.5) * 0.13,
        lerp(0.19, 0.135, bake) + (1 - flight * flight) * 1.6,
        (Math.floor(i / 5) - 2) * 0.62 + (random(i + 20) - 0.5) * 0.12,
      );
      dummy.rotation.set(
        (1 - flight) * 0.5,
        random(i + 1) * 6,
        (1 - flight) * 0.4,
      );
      dummy.scale.setScalar(t > start ? 0.95 + random(i + 33) * 0.12 : 0);
      dummy.updateMatrix();
      pepperonis.setMatrixAt(i, dummy.matrix);
    }
    pepperonis.instanceMatrix.needsUpdate = true;
    pepperonis.visible = t > 0.75;
  }
  return { group, update };
}
