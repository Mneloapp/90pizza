import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Resources } from "../pizza-model";

type Slice = { object: THREE.Object3D; base: THREE.Vector3 };

export function buildFirstBite({ keep }: Resources) {
  const group = new THREE.Group();
  const releaseUniform = { value: 0 };
  const cheese = keep(
    new THREE.MeshPhysicalMaterial({
      color: "#ffe6b0",
      roughness: 0.43,
      clearcoat: 0.13,
      side: THREE.DoubleSide,
    }),
  );
  cheese.onBeforeCompile = (shader) => {
    shader.uniforms.strandRelease = releaseUniform;
    shader.vertexShader =
      `varying float strandT;\n${shader.vertexShader}`.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nstrandT=uv.x;",
      );
    shader.fragmentShader =
      `varying float strandT; uniform float strandRelease;\n${shader.fragmentShader}`.replace(
        "#include <alphatest_fragment>",
        "#include <alphatest_fragment>\nif(abs(strandT-.5)<strandRelease*.46) discard;",
      );
  };
  const steel = keep(
    new THREE.MeshStandardMaterial({
      color: "#b8b9b5",
      metalness: 0.9,
      roughness: 0.26,
    }),
  );
  const wood = keep(
    new THREE.MeshStandardMaterial({ color: "#312725", roughness: 0.88 }),
  );
  const spatula = new THREE.Group();
  const blade = new THREE.Mesh(
    keep(new RoundedBoxGeometry(0.83, 0.018, 0.86, 2, 0.02)),
    steel,
  );
  blade.position.set(0, -0.02, 0);
  spatula.add(blade);
  const handle = new THREE.Mesh(
    keep(new RoundedBoxGeometry(0.15, 0.05, 1.4, 2, 0.025)),
    wood,
  );
  handle.position.set(0, -0.03, 0.95);
  spatula.add(handle);
  group.add(spatula);
  const wheel = new THREE.Mesh(
    keep(new THREE.CylinderGeometry(0.18, 0.18, 0.018, 40)),
    steel,
  );
  wheel.rotation.z = Math.PI / 2;
  group.add(wheel);
  const frames = 32,
    rings = 8;
  const strands = [-0.27, 0.02, 0.27].map((offset, index) => {
    const g = keep(new THREE.BufferGeometry());
    const position = new THREE.BufferAttribute(
      new Float32Array((frames + 1) * rings * 3),
      3,
    ).setUsage(THREE.DynamicDrawUsage);
    const indices: number[] = [];
    const uv: number[] = [];
    for (let j = 0; j <= frames; j++)
      for (let k = 0; k < rings; k++) uv.push(j / frames, k / rings);
    for (let j = 0; j < frames; j++)
      for (let k = 0; k < rings; k++) {
        const a = j * rings + k,
          b = j * rings + ((k + 1) % rings),
          c = a + rings,
          d = b + rings;
        indices.push(a, c, b, b, c, d);
      }
    g.setAttribute("position", position);
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(indices);
    const mesh = new THREE.Mesh(g, cheese);
    mesh.frustumCulled = false;
    group.add(mesh);
    return { mesh, offset, index };
  });
  const a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    point = new THREE.Vector3();
  let active = 0;
  function update(slices: Slice[], cut: number, lift: number, release: number) {
    active = 0;
    releaseUniform.value = release;
    group.visible = cut > 0.001;
    if (!group.visible || slices.length !== 9) return;
    const selected = slices.find((s) => s.base.x < -0.5 && s.base.z > 0.5);
    if (!selected) return;
    const object = selected.object;
    object.updateMatrix();
    spatula.visible = lift > 0.01;
    spatula.position.copy(object.position);
    spatula.rotation.copy(object.rotation);
    wheel.visible = cut > 0.001 && cut < 0.995;
    const line = Math.min(3, Math.floor(cut * 4)),
      travel = ((cut * 4) % 1) * 3 - 1.5;
    wheel.position.set(
      line < 2 ? (line ? 0.5 : -0.5) : travel,
      0.22,
      line < 2 ? travel : line === 2 ? -0.5 : 0.5,
    );
    wheel.rotation.set(line < 2 ? 0 : Math.PI / 2, 0, Math.PI / 2);
    for (const strand of strands) {
      const { mesh, offset, index } = strand;
      mesh.visible = lift > 0.025 && release < 0.985;
      if (!mesh.visible) continue;
      active++;
      a.set(selected.base.x + 0.52, 0.072, selected.base.z + offset);
      b.set(0.49, 0.072, offset).applyMatrix4(object.matrix);
      const distance = a.distanceTo(b),
        positions = mesh.geometry.attributes.position;
      for (let j = 0; j <= frames; j++) {
        const t = j / frames,
          middle = Math.sin(t * Math.PI);
        const pinch = Math.pow(middle, 0.6);
        const r = (0.028 * (1 - pinch) + 0.011 * pinch) / (1 + distance * 0.8);
        const retract =
          t < 0.5 ? t * (1 - release * 0.6) : 1 - (1 - t) * (1 - release * 0.6);
        point.lerpVectors(a, b, retract);
        point.y -= middle * Math.min(0.045, distance * 0.09);
        point.x += Math.sin(t * Math.PI) * 0.012 * (index - 1);
        // A single neck thins and releases; no web across the other eight slices.
        const neck = 1 - release * Math.pow(middle, 2);
        for (let k = 0; k < rings; k++) {
          const angle = (k / rings) * Math.PI * 2;
          positions.setXYZ(
            j * rings + k,
            point.x + Math.cos(angle) * r * neck,
            point.y + Math.sin(angle) * r * neck,
            point.z,
          );
        }
      }
      positions.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
    }
  }
  return {
    group,
    update,
    get active() {
      return active;
    },
  };
}
