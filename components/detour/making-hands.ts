import * as THREE from "three";
import { MarchingCubes } from "three/examples/jsm/objects/MarchingCubes.js";
import type { Resources } from "../pizza-model";
import { doughPose, doughHeightAt } from "../pizza-dough";
import { mix, smooth } from "./scene-math";

const noise = (n: number) => {
  const v = Math.sin(n * 127.13 + 48.8) * 43758.5453;
  return v - Math.floor(v);
};
const union = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};

export function buildHands({ keep }: Resources) {
  const group = new THREE.Group();
  const pixels = new Uint8Array(256 * 256 * 4);
  for (let i = 0; i < 256 * 256; i++) {
    const grain = noise(i) * 10,
      patch =
        Math.sin((i % 256) * 0.12) * Math.sin(Math.floor(i / 256) * 0.17) * 3;
    pixels.set([198 + grain + patch, 151 + grain, 125 + grain, 255], i * 4);
  }
  const texture = keep(new THREE.DataTexture(pixels, 256, 256));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  const curl = { value: 0 };
  const skin = keep(
    new THREE.MeshPhysicalMaterial({
      color: "#b58b72",
      roughness: 0.86,
      sheen: 0.12,
      sheenColor: new THREE.Color("#f7e5d2"),
      bumpMap: texture,
      bumpScale: 0.008,
    }),
  );
  skin.onBeforeCompile = (shader) => {
    shader.uniforms.handCurl = curl;
    shader.vertexShader =
      `varying vec3 skinPosition; uniform float handCurl;\n${shader.vertexShader}`.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nskinPosition = position; transformed.y -= pow(max(0.0,position.z-.1),2.0)*handCurl;",
      );
    shader.fragmentShader =
      `varying vec3 skinPosition;\n${shader.fragmentShader}`.replace(
        "#include <color_fragment>",
        `#include <color_fragment>
      float pore = fract(sin(dot(floor(skinPosition.xz * 640.0),vec2(12.9898,78.233)))*43758.5453);
      float powder = smoothstep(.85,.98,pore)*.07;
      diffuseColor.rgb = mix(diffuseColor.rgb * (.96+pore*.04),vec3(.91,.88,.81),powder);`,
      );
  };
  const nail = keep(
    new THREE.MeshPhysicalMaterial({
      color: "#c6a78e",
      roughness: 0.55,
      clearcoat: 0.08,
    }),
  );
  const cuff = keep(
    new THREE.MeshStandardMaterial({ color: "#e7e4dc", roughness: 1 }),
  );
  // A blended distance field joins the palm, fingers and wrist without intersecting capsules.
  const field = new MarchingCubes(58, skin, false, false, 45000);
  field.isolation = 0;
  const fingers = [
    [-0.32, 0.28, -0.35, 1.04, 0.102],
    [-0.11, 0.34, -0.12, 1.2, 0.108],
    [0.11, 0.32, 0.13, 1.13, 0.103],
    [0.3, 0.23, 0.35, 0.91, 0.091],
    [-0.33, -0.19, -0.64, 0.33, 0.13],
  ];
  const capsule = (
    x: number,
    y: number,
    z: number,
    ax: number,
    az: number,
    bx: number,
    bz: number,
    r: number,
  ) => {
    const dx = bx - ax,
      dz = bz - az,
      t = THREE.MathUtils.clamp(
        ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz),
        0,
        1,
      );
    const bend = Math.sin(t * Math.PI) * 0.018;
    return (
      Math.sqrt(
        (x - ax - dx * t) ** 2 + (y - bend) ** 2 + (z - az - dz * t) ** 2,
      ) -
      r * (1 - 0.18 * t)
    );
  };
  const size = 58;
  for (let z = 0; z < size; z++)
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const px = ((x / size) * 2 - 1) * 1.6,
          py = ((y / size) * 2 - 1) * 1.6,
          pz = ((z / size) * 2 - 1) * 1.6;
        const q = Math.sqrt(
          (px / 0.43) ** 2 + (py / 0.145) ** 2 + ((pz + 0.05) / 0.55) ** 2,
        );
        let d = (q - 1) * 0.145;
        d = union(d, capsule(px, py, pz, 0, -1.55, 0, -0.42, 0.24), 0.13);
        for (const [ax, az, bx, bz, r] of fingers)
          d = union(d, capsule(px, py, pz, ax, az, bx, bz, r), 0.065);
        field.field[x + size * y + size * size * z] = -d;
      }
  field.update();
  const geometry = keep(field.geometry.clone());
  field.geometry.dispose();
  const sphere = keep(new THREE.SphereGeometry(1, 20, 12));
  const hands = [-1, 1].map((side) => {
    const hand = new THREE.Group();
    const mesh = new THREE.Mesh(geometry, skin);
    mesh.scale.set(1.6 * side, 1.6, 1.6);
    mesh.castShadow = mesh.receiveShadow = true;
    hand.add(mesh);
    fingers.forEach(([, , bx, bz, r]) => {
      const n = new THREE.Mesh(sphere, nail);
      n.position.set(bx * side, 0.084, bz - 0.055);
      n.scale.set(r * 0.68, 0.012, r * 0.85);
      n.rotation.y = bx < -0.5 ? -0.45 * side : 0;
      hand.add(n);
    });
    const forearm = new THREE.Mesh(
      keep(new THREE.CylinderGeometry(0.235, 0.34, 3.4, 32)),
      skin,
    );
    forearm.rotation.x = Math.PI / 2;
    forearm.position.set(0, 0, -2.78);
    forearm.castShadow = true;
    hand.add(forearm);
    const sleeve = new THREE.Mesh(
      keep(new THREE.CylinderGeometry(0.35, 0.4, 1.1, 32)),
      cuff,
    );
    sleeve.rotation.x = Math.PI / 2;
    sleeve.position.set(0, 0, -4.5);
    sleeve.castShadow = true;
    hand.add(sleeve);
    hand.scale.setScalar(0.88);
    group.add(hand);
    return { hand, side };
  });
  function update(time: number, form: number, amount: number) {
    group.visible = amount > 0.001;
    if (!group.visible) return;
    const pose = doughPose(form);
    const shaping = smooth(form / 0.3),
      working = form * 4.7;
    curl.value = 0.035 + Math.sin((time < 5 ? time : working) * 4) * 0.025;
    const arrival = 1 - amount;
    hands.forEach(({ hand, side }, i) => {
      const press =
        Math.sin((time < 5 ? time * 4 : working * 5) + i * 0.8) * 0.5 + 0.5;
      const spread = mix(0.4, 0.68, shaping) + Math.sin(working * 4) * 0.04;
      const x = side * spread,
        z = mix(0.8, 0.6, shaping) - press * 0.12;
      const h = doughHeightAt(x, z, pose) * 0.84 + 0.032;
      hand.position.set(
        x * 0.84 + side * arrival * 2.2,
        h + 0.07 + (1 - press) * 0.045 + arrival * 0.75,
        z,
      );
      hand.rotation.set(
        -0.04 + (1 - press) * 0.07,
        Math.PI + side * 0.12,
        side * 0.025,
      );
    });
  }
  return { group, update };
}

export function buildWater({ keep }: Resources) {
  const group = new THREE.Group();
  const material = keep(
    new THREE.MeshPhysicalMaterial({
      color: "#d7ecf0",
      roughness: 0.1,
      metalness: 0.05,
      transparent: true,
      opacity: 0.72,
      clearcoat: 1,
    }),
  );
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.85, 2.9, -0.55),
    new THREE.Vector3(0.7, 1.6, -0.35),
    new THREE.Vector3(0.1, 0.02, 0),
  ]);
  const stream = new THREE.Mesh(
    keep(new THREE.TubeGeometry(curve, 32, 0.026, 8, false)),
    material,
  );
  group.add(stream);
  const ripple = new THREE.Mesh(
    keep(new THREE.RingGeometry(0.12, 0.17, 48)),
    material,
  );
  ripple.rotation.x = -Math.PI / 2;
  ripple.position.y = 0.04;
  group.add(ripple);
  return {
    group,
    update(time: number, amount: number) {
      group.visible = amount > 0.001;
      stream.scale.x = amount;
      material.opacity = 0.65 * amount;
      ripple.scale.setScalar(1 + ((time * 2) % 1) * 2);
    },
  };
}
