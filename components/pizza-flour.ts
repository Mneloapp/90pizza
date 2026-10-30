import * as THREE from "three";
import type { Resources } from "./pizza-model";

const random = (n: number) => {
  const v = Math.sin(n * 127.1 + 17.3) * 43758.5453;
  return v - Math.floor(v);
};

const movement = `
  float gather = smoothstep(1.8, 4.45, elapsed);
  float impulse = 1.0 - exp(-max(0.0, elapsed - seed.w * 0.13) * 5.5);
  float radius = impulse * (0.65 + seed.z * 1.65);
  vec3 outward = direction * radius;
  outward.y = outward.y * 0.67 + 0.24 - elapsed * elapsed * 0.08;
  float angle = gather * (1.0 - gather) * 3.5;
  outward.xz = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * outward.xz;
  vec3 target = direction * vec3(0.84, 0.46, 0.8);
  target.y += 0.04;
  vec3 center = mix(outward, target, gather);
`;

export function buildFlour({ keep }: Resources, compact: boolean) {
  const curtain = new THREE.Group();
  const noiseData = new Uint8Array(64 * 64);
  for (let i = 0; i < noiseData.length; i++)
    noiseData[i] = random(i + 491) * 255;
  const noiseMap = keep(
    new THREE.DataTexture(noiseData, 64, 64, THREE.RedFormat),
  );
  noiseMap.wrapS = noiseMap.wrapT = THREE.RepeatWrapping;
  noiseMap.minFilter = noiseMap.magFilter = THREE.LinearFilter;
  noiseMap.needsUpdate = true;
  const uniforms = {
    elapsed: { value: 0 },
    pixelRatio: { value: 1 },
    viewportHeight: { value: 800 },
    noiseMap: { value: noiseMap },
  };
  function attributes(count: number) {
    const direction = new Float32Array(count * 3);
    const seed = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      const y = random(i + 29) * 2 - 1;
      const angle = random(i + 2) * Math.PI * 2;
      const r = Math.sqrt(1 - y * y);
      direction.set([Math.cos(angle) * r, y, Math.sin(angle) * r], i * 3);
      seed.set(
        [random(i + 4), random(i + 57), random(i + 87), random(i + 121)],
        i * 4,
      );
    }
    return { direction, seed };
  }

  // Depth-positioned, noise-shaped billboards provide the powder's mass.
  // Fine grains share the same burst-and-gather trajectory, rather than raining.
  const cloudCount = compact ? 36 : 52;
  const cloudAttributes = attributes(cloudCount);
  const cloudsGeometry = keep(new THREE.InstancedBufferGeometry());
  cloudsGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0],
      3,
    ),
  );
  cloudsGeometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2),
  );
  cloudsGeometry.setIndex([0, 1, 2, 0, 2, 3]);
  cloudsGeometry.setAttribute(
    "direction",
    new THREE.InstancedBufferAttribute(cloudAttributes.direction, 3),
  );
  cloudsGeometry.setAttribute(
    "seed",
    new THREE.InstancedBufferAttribute(cloudAttributes.seed, 4),
  );
  cloudsGeometry.instanceCount = cloudCount;
  const cloudsMaterial = keep(
    new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexShader: `
      attribute vec3 direction;
      attribute vec4 seed;
      uniform float elapsed;
      varying vec2 vUv;
      varying vec4 vSeed;
      varying float vOpacity;
      void main() {
        ${movement}
        vec4 view = modelViewMatrix * vec4(center, 1.0);
        float size = (0.15 + impulse * 0.65) * (0.7 + seed.x * 0.5) * (1.0 - gather * 0.87);
        float rotation = seed.y * 6.28 + elapsed * (seed.z - 0.5) * 0.15;
        vec2 offset = mat2(cos(rotation), -sin(rotation), sin(rotation), cos(rotation)) * position.xy;
        view.xy += offset * size * length(modelMatrix[0].xyz);
        gl_Position = projectionMatrix * view;
        vUv = uv;
        vSeed = seed;
        vOpacity = smoothstep(0.0, 0.18, elapsed) * (1.0 - smoothstep(3.4, 4.7, elapsed));
      }
    `,
      fragmentShader: `
      varying vec2 vUv;
      varying vec4 vSeed;
      varying float vOpacity;
      uniform sampler2D noiseMap;
      float noise(vec2 p) {
        return texture2D(noiseMap, p / 64.0).r;
      }
      float fbm(vec2 p) {
        return noise(p) * 0.53 + noise(p * 2.07) * 0.27 + noise(p * 4.13) * 0.13 + noise(p * 8.21) * 0.07;
      }
      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float billow = fbm(p * 3.0 + vSeed.xy * 31.0);
        float density = smoothstep(0.12, 0.65, (1.0 - length(p)) * 0.85 + (billow - 0.45) * 1.2);
        float edge = 1.0 - smoothstep(0.65, 1.0, max(abs(p.x), abs(p.y)));
        float light = 0.73 + billow * 0.22 + (1.0 - vUv.y) * 0.09;
        float alpha = density * edge * vOpacity * 0.24;
        if (alpha < 0.008) discard;
        gl_FragColor = vec4(vec3(0.96, 0.94, 0.9) * light, alpha);
      }
    `,
    }),
  );
  const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
  clouds.frustumCulled = false;
  clouds.renderOrder = 2;
  curtain.add(clouds);

  const count = compact ? 6500 : 11000;
  const grainAttributes = attributes(count);
  const geometry = keep(new THREE.BufferGeometry());
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(count * 3), 3),
  );
  geometry.setAttribute(
    "direction",
    new THREE.BufferAttribute(grainAttributes.direction, 3),
  );
  geometry.setAttribute(
    "seed",
    new THREE.BufferAttribute(grainAttributes.seed, 4),
  );
  const material = keep(
    new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      vertexShader: `
      attribute vec3 direction;
      attribute vec4 seed;
      uniform float elapsed, pixelRatio, viewportHeight;
      varying float opacity;
      void main() {
        ${movement}
        vec4 view = modelViewMatrix * vec4(center, 1.0);
        gl_Position = projectionMatrix * view;
        gl_PointSize = clamp((0.004 + seed.x * 0.009) * viewportHeight * pixelRatio / max(1.0, -view.z), 0.6, 3.0 * pixelRatio);
        opacity = smoothstep(0.02, 0.2, elapsed) * (1.0 - smoothstep(4.1, 4.8, elapsed)) * (0.2 + seed.z * 0.45);
      }
    `,
      fragmentShader: `
      varying float opacity;
      void main() {
        float alpha = (1.0 - smoothstep(0.2, 0.5, length(gl_PointCoord - 0.5))) * opacity;
        if (alpha < 0.02) discard;
        gl_FragColor = vec4(0.94, 0.92, 0.87, alpha);
      }
    `,
    }),
  );
  const grains = new THREE.Points(geometry, material);
  grains.frustumCulled = false;
  grains.renderOrder = 3;
  curtain.add(grains);

  const group = new THREE.Group();
  const residuePositions = new Float32Array(1100 * 3);
  for (let i = 0; i < 1100; i++) {
    const angle = random(i + 20) * Math.PI * 2;
    const r = 0.72 + random(i + 48) ** 2 * 0.8;
    residuePositions.set(
      [Math.cos(angle) * r, -0.365, Math.sin(angle) * r],
      i * 3,
    );
  }
  const residueGeometry = keep(new THREE.BufferGeometry());
  residueGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(residuePositions, 3),
  );
  const residueMaterial = keep(
    new THREE.PointsMaterial({
      color: "#d6d1c7",
      size: 0.008,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    }),
  );
  group.add(new THREE.Points(residueGeometry, residueMaterial));

  return {
    group,
    curtain,
    update(
      elapsed: number,
      visible: boolean,
      quiet: boolean,
      pixelRatio: number,
      viewportHeight: number,
    ) {
      const time = quiet ? 6 : elapsed;
      curtain.visible = visible && !quiet && time < 4.8;
      uniforms.elapsed.value = time;
      uniforms.pixelRatio.value = pixelRatio;
      uniforms.viewportHeight.value = viewportHeight;
      group.visible = visible;
      residueMaterial.opacity =
        THREE.MathUtils.smoothstep(time, 2.8, 4.8) * 0.38;
    },
  };
}
