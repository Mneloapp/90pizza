import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { Resources } from "./pizza-model";

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
      transparent: true,
    }),
  );
  // Object-space projection avoids pinching the flour texture at sphere UV poles.
  material.onBeforeCompile = (shader) => {
    shader.vertexShader =
      `varying vec3 doughPosition; varying vec3 doughNormal;\n${shader.vertexShader}`.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\ndoughPosition = position; doughNormal = normal;",
      );
    shader.fragmentShader =
      `varying vec3 doughPosition; varying vec3 doughNormal;\n${shader.fragmentShader}`
        .replace(
          "#include <map_fragment>",
          `
        vec3 doughWeights = pow(abs(normalize(doughNormal)), vec3(4.0));
        doughWeights /= dot(doughWeights, vec3(1.0));
        vec3 doughUv = doughPosition * 0.85 + 0.5;
        diffuseColor *= texture2D(map, doughUv.yz) * doughWeights.x
          + texture2D(map, doughUv.xz) * doughWeights.y
          + texture2D(map, doughUv.xy) * doughWeights.z;
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

export function buildPreparation({ keep }: Resources, onAsset: () => void) {
  const group = new THREE.Group();
  const geometry = keep(new THREE.SphereGeometry(1, 96, 64));
  const original = new Float32Array(geometry.attributes.position.array);
  const doughMaterial = doughSurface({ keep }, onAsset);
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

  let lastShape = -1,
    lastFormation = -1;
  function update(
    form: number,
    topping: number,
    time: number,
    quiet: boolean,
    formation = 1,
  ) {
    const shape = smooth(form, 0.03, 0.82);
    doughMaterial.opacity = formation;
    doughMaterial.depthWrite = formation > 0.98;
    dough.visible = formation > 0.001;
    dough.castShadow = formation > 0.9;
    const positions = geometry.attributes.position;
    if (shape !== lastShape || formation !== lastFormation) {
      for (let i = 0; i < positions.count; i++) {
        const nx = original[i * 3],
          ny = original[i * 3 + 1],
          nz = original[i * 3 + 2];
        const angle = Math.atan2(nz, nx);
        const folds =
          Math.exp(-(((ny + 0.55) / 0.28) ** 2)) *
          Math.sin(angle * 11 + ny * 9) *
          0.035;
        const contour =
          1 +
          Math.sin(angle * 3 + ny * 2) * 0.035 +
          Math.cos(angle * 5 - ny * 3) * 0.018 -
          folds;
        const knead = (1 - formation) * Math.sin(angle * 4 + ny * 5) * 0.11;
        positions.setXYZ(
          i,
          THREE.MathUtils.lerp(
            nx * 0.88 * (contour + knead),
            Math.sign(nx) * Math.abs(nx) ** 0.18 * 1.8,
            shape,
          ),
          THREE.MathUtils.lerp(
            ny * (ny > 0 ? 0.5 : 0.36) +
              Math.sin(angle * 3) * (1 - ny * ny) * 0.017,
            Math.sign(ny) * Math.abs(ny) ** 0.25 * 0.065,
            shape,
          ),
          THREE.MathUtils.lerp(
            nz * 0.81 * (contour - knead * 0.5),
            Math.sign(nz) * Math.abs(nz) ** 0.18 * 1.8,
            shape,
          ),
        );
      }
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
      lastShape = shape;
      lastFormation = formation;
    }
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
