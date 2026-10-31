import * as THREE from "three";
import type { Resources } from "./pizza-model";

const { smoothstep: smooth } = THREE.MathUtils;
const random = (n: number) => {
  const value = Math.sin(n * 127.1 + 19.3) * 43758.5453;
  return value - Math.floor(value);
};

export function cheeseConnections() {
  const cuts: { a: number; b: number; axis: "x" | "z" }[] = [];
  for (let i = 0; i < 9; i++) {
    if (i % 3 < 2) cuts.push({ a: i, b: i + 1, axis: "x" });
    if (i < 6) cuts.push({ a: i, b: i + 3, axis: "z" });
  }
  return cuts;
}

export function positionSlice(
  slice: THREE.Group,
  index: number,
  spread: number,
  lift: number,
) {
  const home = slice.userData.home as THREE.Vector3;
  const delay = ((index % 3) + Math.floor(index / 3)) * 0.045;
  const slide = smooth(spread, delay, 0.75 + delay);
  slice.position.copy(home).multiplyScalar(1 + slide * 0.065);
  slice.position.y = 0;
  slice.rotation.set(0, 0, 0);
  if (index === 6) {
    slice.position.x -= lift * 0.28;
    slice.position.z += lift * 0.12;
    slice.position.y += lift * 0.94;
    slice.rotation.z = lift * 0.09;
    slice.rotation.x = lift * 0.05;
  }
}

export function buildCheese({ keep }: Resources) {
  const group = new THREE.Group();
  const cuts = cheeseConnections();
  const across = 28,
    along = 14;
  // Thin membranes narrow, perforate and release; they are not cylindrical cords.
  const films = cuts.flatMap((cut, index) =>
    [0, 1].map((part) => {
      const seed = random(index * 11 + part * 7 + 3);
      const opening = { value: 0 };
      const material = keep(
        new THREE.MeshPhysicalMaterial({
          color: "#f1dfbc",
          roughness: 0.42,
          clearcoat: 0.14,
          sheen: 0.2,
          sheenColor: new THREE.Color("#fff4d9"),
          side: THREE.DoubleSide,
          alphaTest: 0.5,
          alphaToCoverage: true,
        }),
      );
      material.onBeforeCompile = (shader) => {
        shader.uniforms.filmOpening = opening;
        shader.uniforms.filmSeed = { value: seed };
        shader.vertexShader =
          `varying vec2 filmUv;\n${shader.vertexShader}`.replace(
            "#include <begin_vertex>",
            "#include <begin_vertex>\nfilmUv = uv;",
          );
        shader.fragmentShader =
          `varying vec2 filmUv; uniform float filmOpening; uniform float filmSeed;\n${shader.fragmentShader}`.replace(
            "#include <alphatest_fragment>",
            `
        vec2 q = vec2(filmUv.x, filmUv.y * 2.0 - 1.0);
        float a = length((q - vec2(0.46 + filmSeed * 0.07, 0.28)) / vec2(0.29, 0.48 * filmOpening + 0.001));
        float b = length((q - vec2(0.57, -0.46)) / vec2(0.23, 0.38 * filmOpening + 0.001));
        float edge = min(a, b);
        diffuseColor.a *= smoothstep(1.0 - fwidth(edge), 1.0 + fwidth(edge), edge);
        #include <alphatest_fragment>
      `,
          );
      };
      const geometry = keep(new THREE.BufferGeometry());
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(
          new Float32Array((across + 1) * (along + 1) * 3),
          3,
        ).setUsage(THREE.DynamicDrawUsage),
      );
      const uv: number[] = [],
        indices: number[] = [];
      for (let i = 0; i <= across; i++)
        for (let j = 0; j <= along; j++) {
          uv.push(i / across, j / along);
          if (i < across && j < along) {
            const k = i * (along + 1) + j;
            indices.push(
              k,
              k + along + 1,
              k + 1,
              k + 1,
              k + along + 1,
              k + along + 2,
            );
          }
        }
      geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      geometry.setIndex(indices);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      mesh.receiveShadow = true;
      group.add(mesh);
      return {
        ...cut,
        mesh,
        part,
        seed,
        opening,
        width: part ? 0.1 + seed * 0.07 : 0.46 + seed * 0.1,
        offset: part ? (index % 2 ? -0.38 : 0.38) : (seed - 0.5) * 0.28,
      };
    }),
  );
  const start = new THREE.Vector3(),
    end = new THREE.Vector3();
  const sideA = new THREE.Vector3(),
    sideB = new THREE.Vector3(),
    side = new THREE.Vector3(),
    point = new THREE.Vector3();
  let previous = "",
    active = 0;
  function update(slices: THREE.Group[], spread: number, lift: number) {
    group.visible = spread > 0.02 || lift > 0.02;
    if (!group.visible) {
      active = 0;
      previous = "";
      return;
    }
    const signature = spread.toFixed(4) + "/" + lift.toFixed(4);
    if (signature === previous) return;
    previous = signature;
    active = 0;
    slices.forEach((slice) => slice.updateMatrix());
    for (const film of films) {
      const { a, b, axis, mesh, seed, part, offset } = film;
      const retained = (a === 6 || b === 6) && !part;
      start
        .set(
          axis === "x" ? 0.597 : offset,
          0.058,
          axis === "z" ? 0.597 : offset,
        )
        .applyMatrix4(slices[a].matrix);
      end
        .set(
          axis === "x" ? -0.597 : offset + (seed - 0.5) * 0.045,
          0.058,
          axis === "z" ? -0.597 : offset + (seed - 0.5) * 0.045,
        )
        .applyMatrix4(slices[b].matrix);
      const distance = start.distanceTo(end);
      const release = retained
        ? 0
        : smooth(spread, 0.42 + seed * 0.16, 0.68 + seed * 0.18);
      mesh.visible = distance > 0.024 && release < 0.995;
      if (!mesh.visible) continue;
      active++;
      film.opening.value = smooth(distance, 0.025, 0.22) * 0.74;
      sideA
        .set(axis === "z" ? 1 : 0, 0, axis === "x" ? 1 : 0)
        .transformDirection(slices[a].matrix);
      sideB
        .set(axis === "z" ? 1 : 0, 0, axis === "x" ? 1 : 0)
        .transformDirection(slices[b].matrix);
      const positions = mesh.geometry.attributes
        .position as THREE.BufferAttribute;
      const neck = Math.min(0.72, 0.25 + distance * 0.6);
      const sag = Math.min(0.18, distance * 0.14);
      for (let i = 0; i <= across; i++) {
        const t = i / across,
          middle = Math.sin(t * Math.PI);
        const width =
          film.width *
          (retained ? 0.2 + 0.8 * smooth(lift, 0, 0.65) : 1) *
          (1 - neck * middle ** 0.7) *
          (1 - release * middle ** 0.3);
        side.lerpVectors(sideA, sideB, t).normalize();
        for (let j = 0; j <= along; j++) {
          const u = (j / along) * 2 - 1;
          point
            .lerpVectors(start, end, t)
            .addScaledVector(side, u * width * 0.5);
          point.y -= middle * sag;
          point.y += middle * Math.sin(u * 4.2 + seed * 8 + t * 2) * 0.008;
          point.y += middle * (1 - u * u) * 0.009;
          point.addScaledVector(
            side,
            middle * Math.sin(t * 4 + seed * 6) * distance * 0.025,
          );
          positions.setXYZ(i * (along + 1) + j, point.x, point.y, point.z);
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
