"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

type SquareWorldProps = {
  texture: string;
  mode: "box" | "pizza";
  opened: boolean;
  separated: boolean;
  label: string;
  reducedMotion: boolean;
};

type Disposable = { dispose: () => void };
type SurfaceSample = { vertex: number; u: number; v: number; height: number };
type Slice = {
  mesh: THREE.Mesh;
  samples: SurfaceSample[];
  column: number;
  row: number;
};
type Runtime = { load: (url: string) => void; invalidate: () => void };

const PIZZA_SIZE = 3.12;
const HALF_PIZZA = PIZZA_SIZE / 2;
const OPEN_ANGLE = -THREE.MathUtils.degToRad(108);

function canvas2d(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");
  return { canvas, context };
}

function noise(x: number, y: number) {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function paperGrain() {
  const { canvas, context } = canvas2d(128, 128);
  const pixels = context.createImageData(128, 128);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const shade = 175 + noise(i, 17) * 65;
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = shade;
    pixels.data[i + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);
  return canvas;
}

function breadTexture(cut: boolean) {
  const { canvas, context } = canvas2d(512, 128);
  const gradient = context.createLinearGradient(0, 0, 0, 128);
  gradient.addColorStop(0, cut ? "#eac081" : "#a84f20");
  gradient.addColorStop(0.22, cut ? "#f6dbac" : "#e6a54e");
  gradient.addColorStop(0.75, cut ? "#edcd99" : "#c88135");
  gradient.addColorStop(1, "#a4592a");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 1050; i++) {
    const x = noise(i, 1) * 512;
    const y = noise(i, 2) * 128;
    const radius = (cut ? 0.4 : 0.7) + noise(i, 3) * (cut ? 2.5 : 5);
    context.fillStyle = cut
      ? `rgba(131,85,42,${0.09 + noise(i, 4) * 0.17})`
      : `rgba(82,31,12,${0.06 + noise(i, 4) * 0.26})`;
    context.beginPath();
    context.ellipse(x, y, radius * 1.7, radius, noise(i, 5), 0, Math.PI * 2);
    context.fill();
  }
  return canvas;
}

function lidPrint(inside: boolean, logo?: HTMLImageElement) {
  const { canvas, context: ctx } = canvas2d(1024, 1024);
  ctx.fillStyle = inside ? "#eedcc1" : "#e01010";
  ctx.fillRect(0, 0, 1024, 1024);
  ctx.fillStyle = inside ? "#b61723" : "#fffaf4";
  ctx.textAlign = "center";
  if (logo) {
    const size = inside ? 230 : 360;
    const y = inside ? 235 : 190;
    ctx.save();
    ctx.beginPath();
    ctx.arc(512, y + size / 2, size * 0.48, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logo, 512 - size / 2, y, size, size);
    ctx.restore();
  }
  ctx.font = `900 ${inside ? 106 : 150}px Arial, sans-serif`;
  ctx.fillText("90pizza", 512, inside ? 585 : 737);
  ctx.font = "600 24px Arial, sans-serif";
  ctx.fillText("30 x 30 CM     /     9 SLICES", 512, inside ? 650 : 810);
  ctx.strokeStyle = inside ? "rgba(182,23,35,0.35)" : "rgba(255,250,244,0.65)";
  ctx.lineWidth = 2;
  ctx.strokeRect(65, 65, 894, 894);
  if (!inside) {
    ctx.font = "700 21px Arial, sans-serif";
    ctx.fillText("THE SQUARE DROP", 512, 121);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++)
        ctx.strokeRect(470 + i * 29, 870 + j * 20, 23, 14);
    }
  }
  return canvas;
}

function sliceGeometry(column: number, row: number) {
  const segments = 26;
  const stride = segments + 1;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const samples: SurfaceSample[] = [];
  const centerX = (column - 1) * (PIZZA_SIZE / 3);
  const centerZ = (row - 1) * (PIZZA_SIZE / 3);
  const half = PIZZA_SIZE / 6 - 0.006;
  const point = (x: number, z: number) => {
    // Round only the four outside corners; the nine cut faces stay straight.
    const radius = 0.13;
    const limit = HALF_PIZZA - radius;
    const dx = Math.max(0, Math.abs(x) - limit);
    const dz = Math.max(0, Math.abs(z) - limit);
    const distance = Math.hypot(dx, dz);
    if (distance > radius) {
      x = Math.sign(x) * (limit + (dx / distance) * radius);
      z = Math.sign(z) * (limit + (dz / distance) * radius);
    }
    const edge = HALF_PIZZA - Math.max(Math.abs(x), Math.abs(z));
    const crust = 1 - THREE.MathUtils.smoothstep(edge, 0.025, 0.17);
    const height = 0.105 + crust * 0.067 + Math.sin(x * 29 + z * 19) * 0.004;
    return { x, z, height, u: x / PIZZA_SIZE + 0.5, v: 0.5 - z / PIZZA_SIZE };
  };
  const top: ReturnType<typeof point>[] = [];
  for (let z = 0; z <= segments; z++) {
    for (let x = 0; x <= segments; x++) {
      const p = point(
        centerX - half + (x / segments) * half * 2,
        centerZ - half + (z / segments) * half * 2,
      );
      const vertex = positions.length / 3;
      positions.push(p.x - centerX, p.height, p.z - centerZ);
      uvs.push(p.u, p.v);
      samples.push({ vertex, u: p.u, v: p.v, height: p.height });
      top.push(p);
    }
  }
  for (let z = 0; z < segments; z++) {
    for (let x = 0; x < segments; x++) {
      const a = z * stride + x;
      indices.push(a, a + stride, a + 1, a + 1, a + stride, a + stride + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.addGroup(0, indices.length, 0);
  const edges = [
    { points: Array.from({ length: stride }, (_, i) => i), outside: row === 0 },
    {
      points: Array.from({ length: stride }, (_, i) => i * stride + segments),
      outside: column === 2,
    },
    {
      points: Array.from(
        { length: stride },
        (_, i) => segments * stride + segments - i,
      ),
      outside: row === 2,
    },
    {
      points: Array.from({ length: stride }, (_, i) => (segments - i) * stride),
      outside: column === 0,
    },
  ];
  for (const edge of edges) {
    const start = indices.length;
    const base = positions.length / 3;
    edge.points.forEach((index, i) => {
      const p = top[index];
      const vertex = positions.length / 3;
      positions.push(
        p.x - centerX,
        p.height,
        p.z - centerZ,
        p.x - centerX,
        -0.15,
        p.z - centerZ,
      );
      uvs.push(i / segments, 1, i / segments, 0);
      samples.push({ vertex, u: p.u, v: p.v, height: p.height });
    });
    for (let i = 0; i < segments; i++) {
      const a = base + i * 2;
      indices.push(a, a + 2, a + 1, a + 2, a + 3, a + 1);
    }
    geometry.addGroup(start, indices.length - start, edge.outside ? 1 : 2);
  }
  const bottom = positions.length / 3;
  for (const index of [0, segments, stride * stride - 1, segments * stride]) {
    const p = top[index];
    positions.push(p.x - centerX, -0.15, p.z - centerZ);
    uvs.push(p.u, p.v);
  }
  const start = indices.length;
  indices.push(bottom, bottom + 1, bottom + 2, bottom, bottom + 2, bottom + 3);
  geometry.addGroup(start, 6, 2);
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return { geometry, samples };
}

function leafGeometry() {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const width = Math.pow(Math.sin(t * Math.PI), 0.85) * 0.14;
    for (let j = 0; j < 3; j++) {
      positions.push(
        (j - 1) * width,
        Math.sin(t * Math.PI) * (j === 1 ? 0.055 : -0.012),
        (t - 0.5) * 0.48,
      );
      uvs.push(j / 2, t);
    }
    if (i < 16) {
      for (let j = 0; j < 2; j++) {
        const a = i * 3 + j;
        indices.push(a, a + 3, a + 1, a + 1, a + 3, a + 4);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export default function SquareWorld({
  texture,
  mode,
  opened,
  separated,
  label,
  reducedMotion,
}: SquareWorldProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const settingsRef = useRef({ mode, opened, separated, reducedMotion });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    settingsRef.current = { mode, opened, separated, reducedMotion };
    runtimeRef.current?.invalidate();
  }, [mode, opened, separated, reducedMotion]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    let disposed = false;
    let failed = false;
    let frame = 0;
    let previousTime = 0;
    let elapsed = 0;
    let inView = true;
    let width = 0;
    let height = 0;
    let hasPhoto = false;
    let announcedReady = false;
    let loadedTextureVersion = 0;
    let textureVersion = 0;
    let requestedUrl = "";
    let currentPhoto: THREE.Texture | null = null;
    let renderer: THREE.WebGLRenderer | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let intersectionObserver: IntersectionObserver | undefined;
    let logo: HTMLImageElement | undefined;
    const resources = new Set<Disposable>();
    const removers: (() => void)[] = [];
    const keep = <T extends Disposable>(resource: T): T => {
      resources.add(resource);
      return resource;
    };
    const release = (resource: Disposable) => {
      if (resources.delete(resource)) resource.dispose();
    };
    const cleanup = () => {
      if (disposed) return;
      disposed = true;
      textureVersion++;
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      removers.forEach((remove) => remove());
      if (logo) {
        logo.onload = null;
        logo.onerror = null;
        logo.src = "";
      }
      runtimeRef.current = null;
      resources.forEach((resource) => resource.dispose());
      resources.clear();
      renderer?.renderLists.dispose();
      renderer?.dispose();
      // Strict Mode reuses the connected canvas immediately after its trial cleanup.
      if (!canvas.isConnected) renderer?.forceContextLoss();
    };

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      const gl = renderer;
      gl.setClearColor(0x000000, 0);
      gl.outputColorSpace = THREE.SRGBColorSpace;
      gl.toneMapping = THREE.NeutralToneMapping;
      gl.toneMappingExposure = 0.9;
      gl.shadowMap.enabled = true;
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
      const direction = new THREE.Vector3(0.37, 0.66, 0.72).normalize();
      const right = new THREE.Vector3()
        .crossVectors(new THREE.Vector3(0, 1, 0), direction)
        .normalize();
      const up = new THREE.Vector3().crossVectors(direction, right).normalize();
      const cameraTarget = new THREE.Vector3();
      const desiredTarget = new THREE.Vector3();
      let cameraDistance = 10;
      let framingInitialized = false;
      const world = new THREE.Group();
      const product = new THREE.Group();
      const box = new THREE.Group();
      const pizza = new THREE.Group();
      scene.add(world);
      world.add(product);
      product.add(box, pizza);

      const createEnvironment = () => {
        const environment = keep(new RoomEnvironment());
        const pmrem = keep(new THREE.PMREMGenerator(gl));
        const target = keep(pmrem.fromScene(environment, 0.05));
        scene.environment = target.texture;
        release(environment);
        release(pmrem);
        return target;
      };
      let environmentTarget = createEnvironment();
      scene.environmentIntensity = 0.45;
      scene.add(new THREE.HemisphereLight(0xfff5e9, 0x817a79, 0.9));
      const key = new THREE.DirectionalLight(0xffe2ba, 2.4);
      key.position.set(-3.5, 7, 4.5);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.left = key.shadow.camera.bottom = -4;
      key.shadow.camera.right = key.shadow.camera.top = 4;
      key.shadow.camera.near = 0.5;
      key.shadow.camera.far = 18;
      key.shadow.normalBias = 0.025;
      key.shadow.bias = -0.0003;
      keep(key.shadow);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xe8f3ff, 0.9);
      fill.position.set(4, 3, 5);
      scene.add(fill);
      const rim = new THREE.DirectionalLight(0xffdcb7, 1.8);
      rim.position.set(1, 5, -5);
      scene.add(rim);

      const makeTexture = (source: HTMLCanvasElement, color = true) => {
        const result = keep(new THREE.CanvasTexture(source));
        if (color) result.colorSpace = THREE.SRGBColorSpace;
        result.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
        return result;
      };
      const grain = makeTexture(paperGrain(), false);
      grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
      grain.repeat.set(5, 5);
      const red = keep(
        new THREE.MeshStandardMaterial({
          color: 0xe01010,
          roughness: 0.78,
          bumpMap: grain,
          bumpScale: 0.006,
        }),
      );
      const kraft = keep(
        new THREE.MeshStandardMaterial({
          color: 0xdec3a0,
          roughness: 0.96,
          bumpMap: grain,
          bumpScale: 0.009,
        }),
      );
      const edgeMaterial = keep(
        new THREE.MeshStandardMaterial({ color: 0xb98450, roughness: 1 }),
      );
      const ink = keep(
        new THREE.MeshStandardMaterial({ color: 0xfff7ed, roughness: 0.8 }),
      );
      const rounded = (
        parent: THREE.Group,
        size: [number, number, number],
        position: [number, number, number],
        material: THREE.Material,
        radius = 0.02,
      ) => {
        const mesh = new THREE.Mesh(
          keep(new RoundedBoxGeometry(...size, 2, radius)),
          material,
        );
        mesh.position.set(...position);
        mesh.castShadow = mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
      };
      rounded(box, [3.72, 0.055, 3.72], [0, -0.24, 0], red);
      rounded(box, [3.58, 0.025, 3.58], [0, -0.199, 0], kraft, 0.01);
      for (const x of [-1.825, 1.825]) {
        rounded(box, [0.065, 0.43, 3.68], [x, -0.002, 0], red);
        rounded(
          box,
          [0.012, 0.385, 3.5],
          [x - Math.sign(x) * 0.04, -0.008, 0],
          kraft,
          0.005,
        );
        rounded(box, [0.052, 0.008, 3.61], [x, 0.215, 0], edgeMaterial, 0.003);
      }
      for (const z of [-1.825, 1.825]) {
        rounded(box, [3.59, 0.43, 0.065], [0, -0.002, z], red);
        rounded(
          box,
          [3.48, 0.385, 0.012],
          [0, -0.008, z - Math.sign(z) * 0.04],
          kraft,
          0.005,
        );
        rounded(box, [3.56, 0.008, 0.052], [0, 0.215, z], edgeMaterial, 0.003);
      }
      for (const x of [-1.69, 1.69]) {
        const fold = rounded(
          box,
          [0.14, 0.37, 0.018],
          [x, -0.005, 1.777],
          kraft,
          0.007,
        );
        fold.rotation.y = Math.sign(x) * -0.35;
      }
      // Tiny exposed corrugations make the wall rims read as cardboard, not plastic.
      const corrugation = keep(new THREE.BoxGeometry(0.018, 0.009, 0.042));
      const corrugations = new THREE.InstancedMesh(corrugation, kraft, 88);
      const stamp = new THREE.Object3D();
      for (let i = 0; i < 88; i++) {
        stamp.position.set(
          -1.72 + (i % 44) * 0.08,
          0.221,
          i < 44 ? -1.825 : 1.825,
        );
        stamp.updateMatrix();
        corrugations.setMatrixAt(i, stamp.matrix);
      }
      keep(corrugations);
      box.add(corrugations);

      const linerCanvas = canvas2d(512, 512);
      linerCanvas.context.fillStyle = "#f8eddb";
      linerCanvas.context.fillRect(0, 0, 512, 512);
      linerCanvas.context.strokeStyle = "rgba(185,32,40,0.16)";
      linerCanvas.context.lineWidth = 1;
      for (let i = 24; i < 512; i += 45) {
        linerCanvas.context.strokeRect(i, 0, 0, 512);
        linerCanvas.context.strokeRect(0, i, 512, 0);
      }
      const linerMaterial = keep(
        new THREE.MeshStandardMaterial({
          map: makeTexture(linerCanvas.canvas),
          roughness: 1,
          side: THREE.DoubleSide,
        }),
      );
      const liner = new THREE.Mesh(
        keep(new THREE.PlaneGeometry(3.46, 3.46, 16, 16)),
        linerMaterial,
      );
      liner.rotation.x = -Math.PI / 2;
      liner.rotation.z = 0.025;
      liner.position.y = -0.18;
      liner.receiveShadow = true;
      box.add(liner);

      const hinge = new THREE.Group();
      hinge.position.set(0, 0.25, -1.835);
      box.add(hinge);
      rounded(hinge, [3.72, 0.05, 3.73], [0, 0, 1.84], red);
      rounded(hinge, [3.6, 0.009, 3.59], [0, -0.029, 1.84], kraft, 0.004);
      rounded(hinge, [3.55, 0.12, 0.04], [0, -0.075, 3.66], red, 0.009);
      for (const x of [-1.8, 1.8])
        rounded(hinge, [0.035, 0.1, 3.45], [x, -0.065, 1.84], red, 0.008);
      rounded(
        hinge,
        [3.58, 0.018, 0.065],
        [0, 0.002, 0.025],
        edgeMaterial,
        0.006,
      );

      const outsidePrint = makeTexture(lidPrint(false));
      const insidePrint = makeTexture(lidPrint(true));
      const printMaterial = (map: THREE.Texture) =>
        keep(
          new THREE.MeshStandardMaterial({
            map,
            roughness: 0.88,
            bumpMap: grain,
            bumpScale: 0.003,
          }),
        );
      const outside = new THREE.Mesh(
        keep(new THREE.PlaneGeometry(3.63, 3.63)),
        printMaterial(outsidePrint),
      );
      outside.rotation.x = -Math.PI / 2;
      outside.position.set(0, 0.026, 1.84);
      hinge.add(outside);
      const inside = new THREE.Mesh(
        keep(new THREE.PlaneGeometry(3.53, 3.53)),
        printMaterial(insidePrint),
      );
      inside.rotation.x = Math.PI / 2;
      inside.position.set(0, -0.035, 1.84);
      hinge.add(inside);

      const frontCanvas = canvas2d(1024, 128);
      frontCanvas.context.fillStyle = "#e01010";
      frontCanvas.context.fillRect(0, 0, 1024, 128);
      frontCanvas.context.fillStyle = "#fffaf4";
      frontCanvas.context.font = "900 67px Arial, sans-serif";
      frontCanvas.context.fillText("90pizza", 53, 87);
      frontCanvas.context.font = "700 28px Arial, sans-serif";
      frontCanvas.context.textAlign = "right";
      frontCanvas.context.fillText("30 x 30 / 9 SLICES", 972, 77);
      const front = new THREE.Mesh(
        keep(new THREE.PlaneGeometry(3.45, 0.365)),
        printMaterial(makeTexture(frontCanvas.canvas)),
      );
      front.position.set(0, 0, 1.859);
      box.add(front);
      logo = new window.Image();
      logo.onload = () => {
        if (disposed || !logo) return;
        outsidePrint.image = lidPrint(false, logo);
        insidePrint.image = lidPrint(true, logo);
        outsidePrint.needsUpdate = insidePrint.needsUpdate = true;
        invalidate();
      };
      logo.src = "/images/90pizza-logo.png";

      const crustMap = makeTexture(breadTexture(false));
      const crumbMap = makeTexture(breadTexture(true));
      const crust = keep(
        new THREE.MeshStandardMaterial({
          map: crustMap,
          roughness: 0.9,
          bumpMap: crustMap,
          bumpScale: 0.015,
        }),
      );
      const crumb = keep(
        new THREE.MeshStandardMaterial({
          map: crumbMap,
          roughness: 0.98,
          bumpMap: crumbMap,
          bumpScale: 0.009,
        }),
      );
      const topping = keep(
        new THREE.MeshPhysicalMaterial({
          roughness: 0.65,
          clearcoat: 0.12,
          clearcoatRoughness: 0.5,
          metalness: 0,
        }),
      );
      const slices: Slice[] = [];
      for (let row = 0; row < 3; row++) {
        for (let column = 0; column < 3; column++) {
          const { geometry, samples } = sliceGeometry(column, row);
          const mesh = new THREE.Mesh(keep(geometry), [topping, crust, crumb]);
          mesh.castShadow = mesh.receiveShadow = true;
          pizza.add(mesh);
          slices.push({ mesh, samples, column, row });
        }
      }

      const garnish = new THREE.Group();
      world.add(garnish);
      const leafMaterial = keep(
        new THREE.MeshPhysicalMaterial({
          color: 0x397c33,
          roughness: 0.68,
          side: THREE.DoubleSide,
          clearcoat: 0.15,
        }),
      );
      const leafShape = keep(leafGeometry());
      const leaves: THREE.Group[] = [];
      const veinMaterial = keep(
        new THREE.LineBasicMaterial({
          color: 0x76a04e,
          transparent: true,
          opacity: 0.58,
        }),
      );
      for (let i = 0; i < 2; i++) {
        const sprig = new THREE.Group();
        sprig.add(new THREE.Mesh(leafShape, leafMaterial));
        const veinPoints = Array.from({ length: 17 }, (_, j) => {
          const t = j / 16;
          return new THREE.Vector3(
            0,
            Math.sin(t * Math.PI) * 0.055 + 0.002,
            (t - 0.5) * 0.48,
          );
        });
        sprig.add(
          new THREE.Line(
            keep(new THREE.BufferGeometry().setFromPoints(veinPoints)),
            veinMaterial,
          ),
        );
        sprig.position.set(
          i === 0 ? -2 : 1.98,
          i === 0 ? 0.6 : 0.35,
          i === 0 ? 0.4 : -0.45,
        );
        sprig.rotation.set(0.25, i === 0 ? 0.6 : -0.9, i === 0 ? -0.5 : 0.5);
        sprig.scale.setScalar(i === 0 ? 0.85 : 0.7);
        garnish.add(sprig);
        leaves.push(sprig);
      }
      const chiliPath = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.14, 0, 0),
        new THREE.Vector3(-0.04, 0.03, 0),
        new THREE.Vector3(0.11, 0.09, 0),
        new THREE.Vector3(0.23, 0.2, 0.015),
      ]);
      const chiliGeometry = keep(
        new THREE.TubeGeometry(chiliPath, 18, 0.048, 8, false),
      );
      const chiliPositions = chiliGeometry.getAttribute("position");
      for (let i = 0; i < chiliPositions.count; i++) {
        const t = Math.floor(i / 9) / 18;
        const center = chiliPath.getPointAt(t);
        const taper = 1 - Math.pow(t, 2.5) * 0.94;
        chiliPositions.setXYZ(
          i,
          center.x + (chiliPositions.getX(i) - center.x) * taper,
          center.y + (chiliPositions.getY(i) - center.y) * taper,
          center.z + (chiliPositions.getZ(i) - center.z) * taper,
        );
      }
      chiliGeometry.computeVertexNormals();
      const chili = new THREE.Mesh(
        chiliGeometry,
        keep(
          new THREE.MeshPhysicalMaterial({
            color: 0xb31820,
            roughness: 0.4,
            clearcoat: 0.4,
          }),
        ),
      );
      chili.position.set(1.96, 0.24, 1.17);
      chili.rotation.set(-0.25, 0.4, 0.4);
      garnish.add(chili);

      const shadowCanvas = canvas2d(128, 128);
      const shadowGradient = shadowCanvas.context.createRadialGradient(
        64,
        64,
        8,
        64,
        64,
        63,
      );
      shadowGradient.addColorStop(0, "rgba(48,23,19,0.24)");
      shadowGradient.addColorStop(0.5, "rgba(48,23,19,0.11)");
      shadowGradient.addColorStop(1, "rgba(48,23,19,0)");
      shadowCanvas.context.fillStyle = shadowGradient;
      shadowCanvas.context.fillRect(0, 0, 128, 128);
      const shadow = new THREE.Mesh(
        keep(new THREE.PlaneGeometry(5.2, 5.2)),
        keep(
          new THREE.MeshBasicMaterial({
            map: makeTexture(shadowCanvas.canvas),
            transparent: true,
            depthWrite: false,
          }),
        ),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = -0.69;
      scene.add(shadow);

      let lidAngle = settingsRef.current.opened ? OPEN_ANGLE : 0;
      let spread = settingsRef.current.separated ? 1 : 0;
      let yaw = 0;
      let pitch = 0;
      let desiredYaw = 0;
      let desiredPitch = 0;
      let pointer: {
        id: number;
        x: number;
        y: number;
        yaw: number;
        pitch: number;
        captured: boolean;
        touch: boolean;
      } | null = null;
      const framingGroups = [box, pizza, garnish].map((group) => {
        const meshes: THREE.Mesh[] = [];
        group.traverse((object) => {
          if (
            object instanceof THREE.Mesh &&
            !(object instanceof THREE.InstancedMesh)
          ) {
            if (!object.geometry.boundingBox)
              object.geometry.computeBoundingBox();
            meshes.push(object);
          }
        });
        return { group, meshes };
      });
      const corners: THREE.Vector3[] = [];
      const relative = new THREE.Vector3();
      const canRender = () =>
        !disposed &&
        !failed &&
        inView &&
        !document.hidden &&
        width > 0 &&
        height > 0;
      function invalidate() {
        if (canRender() && !frame) frame = requestAnimationFrame(render);
      }
      function render(time: number) {
        frame = 0;
        if (!canRender()) return;
        const dt = previousTime
          ? Math.min((time - previousTime) / 1000, 0.05)
          : 1 / 60;
        previousTime = time;
        const settings = settingsRef.current;
        const still = settings.reducedMotion;
        if (!still) elapsed += dt;
        const ease = still ? 1 : 1 - Math.exp(-dt * 8);
        const targetLid = settings.opened ? OPEN_ANGLE : 0;
        const targetSpread =
          settings.separated && (settings.mode === "pizza" || settings.opened)
            ? 1
            : 0;
        lidAngle = THREE.MathUtils.lerp(lidAngle, targetLid, ease);
        spread = THREE.MathUtils.lerp(spread, targetSpread, ease);
        yaw = THREE.MathUtils.lerp(yaw, desiredYaw, ease);
        pitch = THREE.MathUtils.lerp(pitch, desiredPitch, ease);
        const float = still ? 0 : Math.sin(elapsed * 0.85) * 0.035;
        world.position.y = float;
        world.rotation.set(
          pitch + (still ? 0 : Math.sin(elapsed * 0.48) * 0.012),
          yaw - 0.12,
          -0.025,
        );
        box.visible = settings.mode === "box";
        hinge.rotation.x = lidAngle;
        const exposure = box.visible
          ? THREE.MathUtils.smoothstep(Math.abs(lidAngle), 0.4, 1.45)
          : 1;
        const separation = spread * exposure * (box.visible ? 0.13 : 0.27);
        pizza.position.y = box.visible ? -0.014 : 0;
        for (const slice of slices) {
          const x = slice.column - 1;
          const z = slice.row - 1;
          slice.mesh.position.set(
            x * (PIZZA_SIZE / 3 + separation),
            separation * (0.3 + (x + z + 2) * 0.11),
            z * (PIZZA_SIZE / 3 + separation),
          );
          slice.mesh.rotation.set(
            z * separation * 0.085,
            0,
            -x * separation * 0.085,
          );
        }
        garnish.visible = !box.visible || Math.abs(lidAngle) > 0.9;
        leaves.forEach((leaf, i) => {
          leaf.position.y =
            (i === 0 ? 0.6 : 0.35) +
            (still ? 0 : Math.sin(elapsed * 0.8 + i * 2) * 0.055);
          leaf.rotation.y =
            (i === 0 ? 0.6 : -0.9) +
            (still ? 0 : Math.sin(elapsed * 0.45 + i) * 0.12);
        });
        chili.position.y =
          0.24 + (still ? 0 : Math.sin(elapsed * 0.7 + 1) * 0.035);

        // Fit each part in camera space; a tall open lid must not shrink the pizza-only view.
        world.updateMatrixWorld(true);
        let cornerCount = 0;
        let minRight = Infinity,
          maxRight = -Infinity;
        let minUp = Infinity,
          maxUp = -Infinity;
        let minDepth = Infinity,
          maxDepth = -Infinity;
        for (const { group, meshes } of framingGroups) {
          if (!group.visible) continue;
          for (const mesh of meshes) {
            const bounds = mesh.geometry.boundingBox;
            if (!bounds) continue;
            for (let i = 0; i < 8; i++) {
              const corner =
                corners[cornerCount] ??
                (corners[cornerCount] = new THREE.Vector3());
              cornerCount++;
              corner
                .set(
                  i & 1 ? bounds.max.x : bounds.min.x,
                  i & 2 ? bounds.max.y : bounds.min.y,
                  i & 4 ? bounds.max.z : bounds.min.z,
                )
                .applyMatrix4(mesh.matrixWorld);
              const x = corner.dot(right),
                y = corner.dot(up),
                z = corner.dot(direction);
              minRight = Math.min(minRight, x);
              maxRight = Math.max(maxRight, x);
              minUp = Math.min(minUp, y);
              maxUp = Math.max(maxUp, y);
              minDepth = Math.min(minDepth, z);
              maxDepth = Math.max(maxDepth, z);
            }
          }
        }
        desiredTarget
          .copy(right)
          .multiplyScalar((minRight + maxRight) / 2)
          .addScaledVector(up, (minUp + maxUp) / 2)
          .addScaledVector(direction, (minDepth + maxDepth) / 2);
        const cameraEase =
          still || !framingInitialized ? 1 : 1 - Math.exp(-dt * 9);
        cameraTarget.lerp(desiredTarget, cameraEase);
        let distance = 0;
        const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        const tanH = tanV * camera.aspect;
        for (let i = 0; i < cornerCount; i++) {
          relative.copy(corners[i]).sub(cameraTarget);
          const depth = relative.dot(direction);
          distance = Math.max(
            distance,
            (Math.abs(relative.dot(right)) * 1.12) / tanH + depth,
            (Math.abs(relative.dot(up)) * 1.12) / tanV + depth,
          );
        }
        // Outward fitting is immediate so a lid or drag can never cross the viewport edge.
        cameraDistance =
          distance > cameraDistance || !framingInitialized
            ? distance
            : THREE.MathUtils.lerp(cameraDistance, distance, cameraEase);
        camera.position
          .copy(direction)
          .multiplyScalar(cameraDistance)
          .add(cameraTarget);
        camera.lookAt(cameraTarget);
        framingInitialized = true;
        try {
          gl.render(scene, camera);
          if (hasPhoto && !announcedReady) {
            announcedReady = true;
            setReady(true);
          }
        } catch {
          failed = true;
          setReady(false);
          return;
        }
        const settling =
          Math.abs(lidAngle - targetLid) +
            Math.abs(spread - targetSpread) +
            Math.abs(yaw - desiredYaw) +
            Math.abs(pitch - desiredPitch) >
          0.0002;
        if ((!still && hasPhoto) || settling) invalidate();
      }

      const load = (url: string) => {
        if (disposed || requestedUrl === url) return;
        requestedUrl = url;
        const version = ++textureVersion;
        hasPhoto = false;
        announcedReady = false;
        setReady(false);
        const candidate = keep(
          new THREE.TextureLoader().load(
            url,
            (photo) => {
              if (disposed || version !== textureVersion) {
                release(photo);
                return;
              }
              photo.colorSpace = THREE.SRGBColorSpace;
              photo.anisotropy = Math.min(
                8,
                gl.capabilities.getMaxAnisotropy(),
              );
              const previous = currentPhoto;
              topping.map = photo;
              topping.needsUpdate = true;
              currentPhoto = photo;
              if (previous) release(previous);
              // The photo supplies real topping relief as well as color, without another asset.
              try {
                const sample = canvas2d(384, 384);
                sample.context.drawImage(
                  photo.image as CanvasImageSource,
                  0,
                  0,
                  384,
                  384,
                );
                const pixels = sample.context.getImageData(0, 0, 384, 384).data;
                for (const slice of slices) {
                  const positions =
                    slice.mesh.geometry.getAttribute("position");
                  for (const vertex of slice.samples) {
                    const x = Math.min(
                      383,
                      Math.max(0, Math.round(vertex.u * 383)),
                    );
                    const y = Math.min(
                      383,
                      Math.max(0, Math.round((1 - vertex.v) * 383)),
                    );
                    const i = (y * 384 + x) * 4;
                    const luminance =
                      (pixels[i] * 0.3 +
                        pixels[i + 1] * 0.59 +
                        pixels[i + 2] * 0.11) /
                      255;
                    const redTopping =
                      Math.max(0, pixels[i] - pixels[i + 1] * 1.3) / 255;
                    positions.setY(
                      vertex.vertex,
                      vertex.height + luminance * 0.012 + redTopping * 0.017,
                    );
                  }
                  positions.needsUpdate = true;
                  slice.mesh.geometry.computeVertexNormals();
                  slice.mesh.geometry.computeBoundingBox();
                  slice.mesh.geometry.computeBoundingSphere();
                }
              } catch {
                // Cross-origin images remain usable as color maps when pixel reads are blocked.
              }
              hasPhoto = true;
              loadedTextureVersion = version;
              invalidate();
            },
            undefined,
            () => {
              release(candidate);
              if (!disposed && version === textureVersion) {
                hasPhoto = false;
                setReady(false);
              }
            },
          ),
        );
      };
      runtimeRef.current = { load, invalidate };

      const resize = () => {
        const rect = root.getBoundingClientRect();
        width = Math.round(rect.width);
        height = Math.round(rect.height);
        if (!width || !height || disposed) return;
        gl.setPixelRatio(
          Math.min(window.devicePixelRatio || 1, width < 600 ? 1.65 : 2),
        );
        gl.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        framingInitialized = false;
        invalidate();
      };
      const listen = <K extends keyof HTMLElementEventMap>(
        target: HTMLElement,
        type: K,
        handler: (event: HTMLElementEventMap[K]) => void,
      ) => {
        target.addEventListener(type, handler);
        removers.push(() => target.removeEventListener(type, handler));
      };
      const endPointer = (event: PointerEvent) => {
        if (!pointer || event.pointerId !== pointer.id) return;
        if (canvas.hasPointerCapture(event.pointerId))
          canvas.releasePointerCapture(event.pointerId);
        pointer = null;
        canvas.style.cursor = "grab";
      };
      listen(canvas, "pointerdown", (event) => {
        if (!event.isPrimary || event.button !== 0 || pointer) return;
        pointer = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          yaw: desiredYaw,
          pitch: desiredPitch,
          captured: event.pointerType !== "touch",
          touch: event.pointerType === "touch",
        };
        if (pointer.captured) canvas.setPointerCapture(event.pointerId);
        canvas.style.cursor = "grabbing";
      });
      listen(canvas, "pointermove", (event) => {
        if (!pointer || event.pointerId !== pointer.id) return;
        const dx = event.clientX - pointer.x;
        const dy = event.clientY - pointer.y;
        if (pointer.touch && !pointer.captured) {
          if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
            pointer = null;
            canvas.style.cursor = "grab";
            return;
          }
          if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 1.15) return;
          canvas.setPointerCapture(event.pointerId);
          pointer.captured = true;
        }
        desiredYaw = THREE.MathUtils.clamp(
          pointer.yaw + (dx / Math.max(width, 240)) * 1.8,
          -0.52,
          0.52,
        );
        desiredPitch = THREE.MathUtils.clamp(
          pointer.pitch + (dy / Math.max(height, 240)) * 0.7,
          -0.13,
          0.17,
        );
        invalidate();
      });
      listen(canvas, "pointerup", endPointer);
      listen(canvas, "pointercancel", endPointer);
      listen(canvas, "lostpointercapture", endPointer);
      listen(root, "keydown", (event) => {
        if (
          !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(
            event.key,
          )
        )
          return;
        event.preventDefault();
        if (event.key === "Home") desiredYaw = desiredPitch = 0;
        if (event.key === "ArrowLeft")
          desiredYaw = Math.max(-0.52, desiredYaw - 0.12);
        if (event.key === "ArrowRight")
          desiredYaw = Math.min(0.52, desiredYaw + 0.12);
        if (event.key === "ArrowUp")
          desiredPitch = Math.max(-0.13, desiredPitch - 0.06);
        if (event.key === "ArrowDown")
          desiredPitch = Math.min(0.17, desiredPitch + 0.06);
        invalidate();
      });
      const pauseOrResume = () => {
        previousTime = 0;
        if (canRender()) invalidate();
        else {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      };
      document.addEventListener("visibilitychange", pauseOrResume);
      removers.push(() =>
        document.removeEventListener("visibilitychange", pauseOrResume),
      );
      const contextLost = (event: Event) => {
        event.preventDefault();
        failed = true;
        hasPhoto = false;
        announcedReady = false;
        cancelAnimationFrame(frame);
        frame = 0;
        setReady(false);
      };
      const contextRestored = () => {
        try {
          // Render-target contents do not survive context loss, unlike image-backed maps.
          release(environmentTarget);
          environmentTarget = createEnvironment();
          key.shadow.dispose();
          key.shadow.map = null;
          key.shadow.mapPass = null;
          failed = false;
          hasPhoto =
            currentPhoto !== null && loadedTextureVersion === textureVersion;
          framingInitialized = false;
          invalidate();
        } catch {
          failed = true;
          setReady(false);
        }
      };
      canvas.addEventListener("webglcontextlost", contextLost);
      canvas.addEventListener("webglcontextrestored", contextRestored);
      removers.push(() => {
        canvas.removeEventListener("webglcontextlost", contextLost);
        canvas.removeEventListener("webglcontextrestored", contextRestored);
      });
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(root);
      }
      window.addEventListener("resize", resize);
      removers.push(() => window.removeEventListener("resize", resize));
      if (typeof IntersectionObserver !== "undefined") {
        intersectionObserver = new IntersectionObserver(
          ([entry]) => {
            inView = entry.isIntersecting;
            pauseOrResume();
          },
          { threshold: 0 },
        );
        intersectionObserver.observe(root);
      }
      resize();
    } catch {
      cleanup();
      setReady(false);
    }
    return cleanup;
  }, []);

  useEffect(() => {
    runtimeRef.current?.load(texture);
  }, [texture]);

  return (
    <div
      ref={rootRef}
      className="square-world"
      data-square-world={mode}
      data-ready={ready ? "true" : "false"}
      role="img"
      aria-label={label}
      tabIndex={0}
      style={{ position: "relative", overflow: "hidden", isolation: "isolate" }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          width: "100%",
          height: "100%",
          opacity: ready ? 1 : 0,
          cursor: "grab",
          touchAction: "pan-y pinch-zoom",
        }}
      />
      <Image
        className="square-world-fallback"
        src={texture}
        alt=""
        aria-hidden="true"
        fill
        unoptimized
        sizes="(max-width: 768px) 100vw, 60vw"
        draggable={false}
        style={{
          objectFit: "contain",
          pointerEvents: "none",
          visibility: ready ? "hidden" : "visible",
        }}
      />
    </div>
  );
}
