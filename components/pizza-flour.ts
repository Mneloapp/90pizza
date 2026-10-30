import * as THREE from "three";
import type { Resources } from "./pizza-model";

const noise = (n: number) => {
  const value = Math.sin(n * 127.1 + 17.3) * 43758.5453;
  return value - Math.floor(value);
};

export function buildFlour({ keep }: Resources, compact: boolean) {
  // Clip-space grains cover the viewport independently of the product camera.
  const count = compact ? 10000 : 18000;
  const seeds = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    seeds.set(
      [noise(i + 1), noise(i + 21), noise(i + 48), noise(i + 79)],
      i * 4,
    );
  }
  const geometry = keep(new THREE.BufferGeometry());
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(count * 3), 3),
  );
  geometry.setAttribute("seed", new THREE.BufferAttribute(seeds, 4));
  const material = keep(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: { elapsed: { value: 0 }, pixelRatio: { value: 1 } },
      vertexShader: `
      attribute vec4 seed;
      uniform float elapsed;
      uniform float pixelRatio;
      varying float opacity;
      varying float grain;
      void main() {
        float age = elapsed - seed.y * 2.45;
        float drift = sin(age * 2.1 + seed.z * 18.0) * 0.07 * age;
        float x = (seed.x * 2.3 - 1.15) + drift;
        float y = 1.2 - max(age, 0.0) * max(age, 0.0) * (0.63 + seed.z * 0.25);
        gl_Position = vec4(x, y, 0.0, 1.0);
        gl_PointSize = (0.7 + seed.w * 2.0) * pixelRatio;
        opacity = step(0.0, age) * (1.0 - smoothstep(3.7, 4.8, elapsed)) * (0.4 + seed.w * 0.6);
        grain = seed.z;
      }
    `,
      fragmentShader: `
      varying float opacity;
      varying float grain;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float edge = 0.38 + sin(atan(uv.y, uv.x) * 5.0 + grain * 20.0) * 0.055;
        float alpha = (1.0 - smoothstep(edge - 0.1, edge, length(uv))) * opacity;
        if (alpha < 0.02) discard;
        gl_FragColor = vec4(vec3(0.98, 0.97, 0.94), alpha);
      }
    `,
    }),
  );
  const curtain = new THREE.Points(geometry, material);
  curtain.frustumCulled = false;
  curtain.renderOrder = 8;

  const group = new THREE.Group();
  const heapGeometry = keep(new THREE.PlaneGeometry(4.2, 4.2, 64, 64));
  const p = heapGeometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      z = p.getY(i),
      radius = Math.hypot(x, z);
    const height = Math.max(0, 1 - radius / 1.8) ** 2 * 0.3;
    p.setXYZ(i, x, height + (noise(i) - 0.5) * 0.018 - 0.13, z);
  }
  heapGeometry.computeVertexNormals();
  // A dithered edge lets the powder taper into the dark surface, without a plate.
  const heapMaterial = keep(
    new THREE.MeshStandardMaterial({
      color: "#eeebe3",
      roughness: 1,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
    }),
  );
  heapMaterial.onBeforeCompile = (shader) => {
    shader.vertexShader =
      `varying vec2 flourPosition;\n${shader.vertexShader}`.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nflourPosition = position.xz;",
      );
    shader.fragmentShader =
      `varying vec2 flourPosition;\n${shader.fragmentShader}`.replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float radius = length(flourPosition);
        float grain = fract(sin(dot(floor(flourPosition * 240.0), vec2(12.9898, 78.233))) * 43758.5453);
        float cover = 1.0 - smoothstep(0.8, 1.9, radius);
        if (grain > cover) discard;
        diffuseColor.rgb *= 0.88 + grain * 0.12;
      `,
      );
  };
  const heap = new THREE.Mesh(heapGeometry, heapMaterial);
  heap.receiveShadow = true;
  group.add(heap);
  return {
    group,
    curtain,
    update(
      elapsed: number,
      visible: boolean,
      quiet: boolean,
      pixelRatio: number,
    ) {
      const time = quiet ? 6 : elapsed;
      curtain.visible = visible && !quiet && time < 4.8;
      material.uniforms.elapsed.value = time;
      material.uniforms.pixelRatio.value = pixelRatio;
      group.visible = visible;
      group.scale.setScalar(
        0.15 + THREE.MathUtils.smoothstep(time, 0.5, 3.5) * 0.5,
      );
    },
  };
}
