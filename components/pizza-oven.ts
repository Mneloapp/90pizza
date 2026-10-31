import * as THREE from "three";
import type { Resources } from "./pizza-model";

// The oven is an environment surrounding the camera, not a miniature prop.
export function buildOven({ keep }: Resources) {
  const group = new THREE.Group();
  const pixels = new Uint8Array(256 * 256 * 4);
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) {
      const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      const grain = (n - Math.floor(n)) * 9;
      const soot = Math.sin(x * 0.03) * Math.cos(y * 0.04) * 6;
      pixels.set(
        [86 + grain + soot, 79 + grain + soot, 68 + grain + soot, 255],
        (y * 256 + x) * 4,
      );
    }
  const texture = keep(new THREE.DataTexture(pixels, 256, 256));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  const stone = keep(
    new THREE.MeshStandardMaterial({
      map: texture,
      bumpMap: texture,
      bumpScale: 0.018,
      roughness: 0.98,
    }),
  );
  const dark = keep(
    new THREE.MeshStandardMaterial({ color: "#241d19", roughness: 0.9 }),
  );
  const hot = keep(
    new THREE.MeshStandardMaterial({
      color: "#d75f24",
      emissive: "#ff4b0b",
      emissiveIntensity: 3,
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
    const mesh = new THREE.Mesh(keep(new THREE.BoxGeometry(w, h, d)), material);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }
  block(24, 0.2, 30, 0, -0.18, -3, stone);
  block(24, 10, 0.3, 0, 4.7, -5.6, dark);
  block(0.3, 10, 30, -12, 4.7, -3, stone);
  block(0.3, 10, 30, 12, 4.7, -3, stone);
  block(24, 0.22, 3.5, 0, 3.6, -4, stone);
  for (let x = -9; x <= 9; x += 4) block(0.009, 0.004, 30, x, -0.076, -3, dark);
  for (let z = -12; z < 12; z += 4) block(24, 0.004, 0.009, 0, -0.075, z, dark);
  for (let i = 0; i < 5; i++) {
    block(16, 0.035, 0.045, 0, 1.05 + i * 0.37, -5.4, hot);
    block(0.055, 0.05, 3.2, -6 + i * 3, 3.43, -4, hot);
  }
  const light = new THREE.PointLight("#ff8749", 18, 18, 1.7);
  light.position.set(-1, 2.8, -3.6);
  group.add(light);
  const warm = new THREE.PointLight("#ffe2b9", 8, 20, 1.7);
  warm.position.set(4, 4, 2);
  group.add(warm);
  return { group, light, hot };
}
