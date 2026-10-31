import * as THREE from "three";
import { buildToppings } from "./pizza-toppings";
import type { Resources } from "./pizza-model";
import {
  doughPose,
  doughHeightAt,
  sampleDough,
  type DoughPose,
} from "./pizza-dough";

const smooth = THREE.MathUtils.smoothstep;
const random = (n: number) => {
  const v = Math.sin(n * 127.1 + 41.7) * 43758.5453;
  return v - Math.floor(v);
};

function doughSurface({ keep }: Resources, onAsset: () => void) {
  const size = 256;
  const color = new Uint8Array(size * size * 4);
  const height = new Uint8Array(size * size);
  const hash = (x: number, y: number, period: number) => {
    let n = (x % period) * 374761393 + (y % period) * 668265263;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  function noise(u: number, v: number, period: number) {
    const x = u * period,
      y = v * period,
      ix = Math.floor(x),
      iy = Math.floor(y);
    const fx = THREE.MathUtils.smoothstep(x - ix, 0, 1),
      fy = THREE.MathUtils.smoothstep(y - iy, 0, 1);
    return THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(hash(ix, iy, period), hash(ix + 1, iy, period), fx),
      THREE.MathUtils.lerp(
        hash(ix, iy + 1, period),
        hash(ix + 1, iy + 1, period),
        fx,
      ),
      fy,
    );
  }
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = y * size + x,
        u = x / size,
        v = y / size;
      const patches = noise(u, v, 8) * 0.65 + noise(u, v, 32) * 0.35;
      const powder = smooth(patches, 0.42, 0.7);
      const pore = random(i) > 0.975 ? 17 : 0;
      const detail = (noise(u, v, 64) - 0.5) * 7 - pore * 0.15;
      color.set(
        [
          235 + powder * 17 + detail,
          222 + powder * 28 + detail,
          200 + powder * 46 + detail,
          255,
        ],
        i * 4,
      );
      height[i] =
        100 +
        noise(u, v, 16) * 28 +
        noise(u, v, 64) * 35 +
        random(i) * 14 -
        pore;
    }
  const map = keep(new THREE.DataTexture(color, size, size));
  map.colorSpace = THREE.SRGBColorSpace;
  const bump = keep(new THREE.DataTexture(height, size, size, THREE.RedFormat));
  for (const texture of [map, bump]) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
  }
  const material = keep(
    new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      map,
      bumpMap: bump,
      bumpScale: 0.035,
      roughness: 0.96,
      sheen: 0.12,
      sheenRoughness: 0.9,
      sheenColor: new THREE.Color("#fff6e5"),
    }),
  );
  const crustBake = { value: 0 };
  const crust = keep(
    new THREE.TextureLoader().load(
      "/images/square-drop/pepperoni.webp",
      onAsset,
    ),
  );
  crust.colorSpace = THREE.SRGBColorSpace;
  crust.anisotropy = 4;
  material.userData.crustBake = crustBake;
  // Object-space projection avoids pinching the flour texture at sphere UV poles.
  material.onBeforeCompile = (shader) => {
    shader.uniforms.crustBake = crustBake;
    shader.uniforms.crustMap = { value: crust };
    shader.vertexShader =
      `varying vec3 doughPosition; varying vec3 doughNormal;\n${shader.vertexShader}`.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\ndoughPosition = position; doughNormal = normal;",
      );
    shader.fragmentShader =
      `varying vec3 doughPosition; varying vec3 doughNormal; uniform float crustBake; uniform sampler2D crustMap;\n${shader.fragmentShader}`
        .replace(
          "#include <map_fragment>",
          `
        vec3 doughWeights = pow(abs(normalize(doughNormal)), vec3(4.0));
        doughWeights /= dot(doughWeights, vec3(1.0));
        vec3 doughUv = doughPosition * 0.85 + 0.5;
        diffuseColor *= texture2D(map, doughUv.yz) * doughWeights.x
          + texture2D(map, doughUv.xz) * doughWeights.y
          + texture2D(map, doughUv.xy) * doughWeights.z;
        vec2 crustUv = vec2(doughPosition.x / 3.6 + 0.5, 0.5 - doughPosition.z / 3.6);
        vec3 toasted = texture2D(crustMap, clamp(crustUv, 0.0, 1.0)).rgb;
        diffuseColor.rgb = mix(diffuseColor.rgb, toasted, crustBake * smoothstep(0.1, 0.6, doughNormal.y));
      `,
        )
        .replace(
          "#include <normal_fragment_maps>",
          `
        float doughHeight = dot(vec3(texture2D(bumpMap, doughUv.yz).r, texture2D(bumpMap, doughUv.xz).r, texture2D(bumpMap, doughUv.xy).r), doughWeights);
        normal = perturbNormalArb(-vViewPosition, normal, vec2(dFdx(doughHeight), dFdy(doughHeight)) * bumpScale, faceDirection);
      `,
        );
  };
  let active = true;
  keep({
    dispose: () => {
      active = false;
    },
  });
  const photo = keep(
    new THREE.TextureLoader().load(
      "/images/materials/dough-albedo.webp",
      (loaded) => {
        if (!active) return;
        material.map = loaded;
        material.bumpMap = loaded;
        material.needsUpdate = true;
        onAsset();
      },
      undefined,
      () => {},
    ),
  );
  photo.colorSpace = THREE.SRGBColorSpace;
  photo.wrapS = photo.wrapT = THREE.RepeatWrapping;
  photo.anisotropy = 4;
  return material;
}

function rollingPin({ keep }: Resources) {
  const grain = new Uint8Array(256 * 64 * 4);
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 256; x++) {
      const line = Math.sin(y * 2.8 + Math.sin(x * 0.035) * 1.5) * 3;
      const detail = random(x + y * 256) * 9 + line;
      grain.set(
        [171 + detail, 126 + detail, 77 + detail, 255],
        (y * 256 + x) * 4,
      );
    }
  const texture = keep(new THREE.DataTexture(grain, 256, 64));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  const wood = keep(
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.76 }),
  );
  const profile = [
    [0, -2.35],
    [0.065, -2.34],
    [0.078, -2.16],
    [0.09, -1.85],
    [0.145, -1.65],
    [0.16, -1.45],
    [0.16, 1.45],
    [0.145, 1.65],
    [0.09, 1.85],
    [0.078, 2.16],
    [0.065, 2.34],
    [0, 2.35],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const mesh = new THREE.Mesh(keep(new THREE.LatheGeometry(profile, 48)), wood);
  mesh.rotation.z = Math.PI / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const spin = new THREE.Group();
  spin.add(mesh);
  const group = new THREE.Group();
  group.add(spin);
  return {
    group,
    update(pose: DoughPose, form: number) {
      group.visible = pose.tool > 0.001;
      group.rotation.y = pose.turn;
      const lift =
        (1 - pose.tool) * 1.4 +
        Math.sin(smooth(form, 0.51, 0.61) * Math.PI) * 0.55;
      const x = Math.sin(pose.turn) * pose.travel;
      const z = Math.cos(pose.turn) * pose.travel;
      group.position.set(
        x,
        doughHeightAt(x, z, pose) -
          pose.halfHeight * pose.pressure * 0.16 +
          0.16 +
          lift,
        z,
      );
      group.scale.setScalar(0.85 + pose.tool * 0.15);
      spin.rotation.x = pose.travel / 0.16;
    },
  };
}

export function buildPreparation({ keep }: Resources, onAsset: () => void) {
  const group = new THREE.Group();
  const geometry = keep(new THREE.SphereGeometry(1, 96, 64));
  const original = new Float32Array(geometry.attributes.position.array);
  const point = new THREE.Vector3();
  const doughMaterial = doughSurface({ keep }, onAsset);
  const dough = new THREE.Mesh(geometry, doughMaterial);
  dough.castShadow = true;
  dough.receiveShadow = true;
  group.add(dough);
  const pin = rollingPin({ keep });
  group.add(pin.group);
  const toppings = buildToppings({ keep }, onAsset);
  group.add(toppings.group);

  let lastShape = -1;
  let pose = doughPose(0);
  function update(form: number, topping: number, bake: number, formation = 1) {
    const shape = form;
    doughMaterial.color.setRGB(1, 1 - bake * 0.29, 1 - bake * 0.57);
    doughMaterial.userData.crustBake.value = smooth(bake, 0.2, 0.9);
    dough.visible = formation > 0.001;
    const changing = Math.abs(form - lastShape) > 0.00005;
    if (changing) pose = doughPose(form);
    pin.update(pose, form);
    const massScale = Math.cbrt(Math.max(0.001, formation));
    dough.scale.setScalar(massScale);
    const positions = geometry.attributes.position;
    if (changing) {
      for (let i = 0; i < positions.count; i++) {
        const nx = original[i * 3],
          ny = original[i * 3 + 1],
          nz = original[i * 3 + 2];
        sampleDough(nx, ny, nz, pose, point);
        positions.setXYZ(i, point.x, point.y, point.z);
      }
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
      lastShape = shape;
    }
    toppings.update(topping, bake);
  }
  return { group, update, dough, pin: pin.group };
}
