"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { MotionValue } from "framer-motion";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { breadTexture, canvas2d, sliceGeometry } from "./journey-mesh";

type Props = {
  progress: MotionValue<number>;
  texture: string;
  split: boolean;
  pull: boolean;
  reduced: boolean;
  label: string;
};
type Resource = { dispose(): void };
const smooth = (a: number, b: number, x: number) =>
  THREE.MathUtils.smoothstep(x, a, b);
const keyValue = (values: number[], p: number) => {
  const i = Math.min(3, Math.floor(p));
  return THREE.MathUtils.lerp(values[i], values[i + 1], smooth(0, 1, p - i));
};

function stoneTexture() {
  const { canvas, context } = canvas2d(256, 256);
  const image = context.createImageData(256, 256);
  for (let i = 0; i < image.data.length; i += 4) {
    const grain = 80 + Math.random() * 70;
    image.data[i] = grain;
    image.data[i + 1] = grain * 0.98;
    image.data[i + 2] = grain * 0.92;
    image.data[i + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

export default function JourneyWorld({
  progress,
  texture,
  split,
  pull,
  reduced,
  label,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const runtime = useRef<{
    load(url: string): void;
    invalidate(): void;
  } | null>(null);
  const settings = useRef({ split, pull, reduced });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    settings.current = { split, pull, reduced };
    runtime.current?.invalidate();
  }, [split, pull, reduced]);

  useEffect(() => {
    const element = root.current,
      surface = canvas.current;
    if (!element || !surface) return;
    let disposed = false,
      failed = false,
      frame = 0,
      lastTime = 0,
      elapsed = 0,
      width = 0,
      height = 0;
    let currentProgress = progress.get(),
      photo: THREE.Texture | null = null,
      version = 0,
      requested = "",
      announcedReady = false;
    let renderer: THREE.WebGLRenderer | undefined,
      observer: ResizeObserver | undefined,
      loaderImage: HTMLImageElement | undefined;
    const resources = new Set<Resource>();
    const keep = <T extends Resource>(value: T) => {
      resources.add(value);
      return value;
    };
    const release = (value: Resource) => {
      if (resources.delete(value)) value.dispose();
    };
    const removers: (() => void)[] = [];
    const cleanup = () => {
      disposed = true;
      version++;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      removers.forEach((remove) => remove());
      if (loaderImage) {
        loaderImage.onload = null;
        loaderImage.src = "";
      }
      resources.forEach((resource) => resource.dispose());
      resources.clear();
      renderer?.renderLists.dispose();
      renderer?.dispose();
      runtime.current = null;
    };
    try {
      const gl = (renderer = new THREE.WebGLRenderer({
        canvas: surface,
        antialias: true,
        powerPreference: "high-performance",
      }));
      gl.outputColorSpace = THREE.SRGBColorSpace;
      gl.toneMapping = THREE.NeutralToneMapping;
      gl.toneMappingExposure = 0.88;
      gl.shadowMap.enabled = true;
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
      const scene = new THREE.Scene();
      const dark = new THREE.Color("#111212"),
        paper = new THREE.Color("#f4f4f4"),
        redRoom = new THREE.Color("#210b0c"),
        floorColor = new THREE.Color("#080c0d");
      const background = dark.clone();
      scene.background = background;
      const fog = new THREE.FogExp2(background, 0.032);
      scene.fog = fog;
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 90);
      const environment = keep(new RoomEnvironment()),
        pmrem = keep(new THREE.PMREMGenerator(gl));
      let envTarget = keep(pmrem.fromScene(environment, 0.04));
      scene.environment = envTarget.texture;
      scene.environmentIntensity = 0.45;
      release(environment);
      release(pmrem);
      scene.add(new THREE.HemisphereLight(0xfff4ed, 0x1d2428, 0.85));
      const key = new THREE.DirectionalLight(0xfff1e2, 2.6);
      key.position.set(-3, 7, 6);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.left = key.shadow.camera.bottom = -6;
      key.shadow.camera.right = key.shadow.camera.top = 6;
      key.shadow.normalBias = 0.025;
      keep(key.shadow);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xe0ebff, 0.7);
      fill.position.set(5, 3, 0);
      scene.add(fill);
      const ovenLight = new THREE.PointLight(0xff410c, 85, 13, 2);
      ovenLight.position.set(0, 0.5, -3.5);
      scene.add(ovenLight);
      const rim = new THREE.PointLight(0xff180d, 15, 18, 2);
      rim.position.set(-4, 2, 0);
      scene.add(rim);
      const map = (source: HTMLCanvasElement, color = true) => {
        const t = keep(new THREE.CanvasTexture(source));
        if (color) t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
        return t;
      };
      const grain = map(stoneTexture(), false);
      const stone = keep(
        new THREE.MeshStandardMaterial({
          color: "#161d21",
          roughness: 0.98,
          bumpMap: grain,
          bumpScale: 0.05,
        }),
      );
      const floorMaterial = keep(
        new THREE.MeshStandardMaterial({
          color: "#080c0d",
          roughness: 0.88,
          bumpMap: grain,
          bumpScale: 0.018,
        }),
      );
      const make = (
        parent: THREE.Object3D,
        geometry: THREE.BufferGeometry,
        material: THREE.Material | THREE.Material[],
        position: [number, number, number],
      ) => {
        const mesh = new THREE.Mesh(keep(geometry), material);
        mesh.position.set(...position);
        mesh.castShadow = mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
      };
      const floor = make(
        scene,
        new THREE.PlaneGeometry(60, 70),
        floorMaterial,
        [0, -1.45, -12],
      );
      floor.rotation.x = -Math.PI / 2;
      const oven = new THREE.Group();
      scene.add(oven);
      const brickGeometry = keep(
        new RoundedBoxGeometry(1.1, 0.42, 0.6, 1, 0.02),
      );
      const brickPositions: THREE.Vector3[] = [];
      for (let row = 0; row < 15; row++)
        for (let col = 0; col < 15; col++) {
          const x = (col - 7) * 1.12 + (row % 2) * 0.56,
            y = -1.2 + row * 0.45;
          if (Math.abs(x) > 3.4 || y > 2.7)
            brickPositions.push(new THREE.Vector3(x, y, -4.5));
        }
      const bricks = new THREE.InstancedMesh(
        brickGeometry,
        stone,
        brickPositions.length,
      );
      const stamp = new THREE.Object3D();
      brickPositions.forEach((p, i) => {
        stamp.position.copy(p);
        stamp.rotation.z = Math.sin(i * 9) * 0.009;
        stamp.updateMatrix();
        bricks.setMatrixAt(i, stamp.matrix);
      });
      bricks.receiveShadow = true;
      oven.add(bricks);
      const hot = keep(
        new THREE.MeshBasicMaterial({ color: "#e01010", toneMapped: false }),
      );
      for (const x of [-3.25, 3.25])
        make(oven, new THREE.BoxGeometry(0.035, 3.95, 0.05), hot, [
          x,
          0.62,
          -4.12,
        ]);
      make(
        oven,
        new THREE.BoxGeometry(6.55, 0.035, 0.05),
        hot,
        [0, 2.6, -4.12],
      );
      for (let i = 0; i < 7; i++)
        make(oven, new THREE.BoxGeometry(4.8, 0.025, 0.045), hot, [
          0,
          0.7 + i * 0.24,
          -8,
        ]);
      const interior = keep(
        new THREE.MeshStandardMaterial({ color: "#10110f", roughness: 1 }),
      );
      make(oven, new THREE.BoxGeometry(7, 5, 0.1), interior, [0, 0.8, -8.5]);

      const tunnels = new THREE.Group();
      scene.add(tunnels);
      const tunnelMat = keep(
        new THREE.MeshBasicMaterial({
          color: "#b41a16",
          transparent: true,
          opacity: 0.55,
        }),
      );
      for (let i = 0; i < 6; i++) {
        const frameGroup = new THREE.Group();
        frameGroup.position.z = -5 - i * 3;
        const size = 4.2 + i * 0.16;
        for (const x of [-size, size])
          make(
            frameGroup,
            new THREE.BoxGeometry(0.018, size * 2, 0.018),
            tunnelMat,
            [x, 0, 0],
          );
        for (const y of [-size, size])
          make(
            frameGroup,
            new THREE.BoxGeometry(size * 2, 0.018, 0.018),
            tunnelMat,
            [0, y, 0],
          );
        frameGroup.rotation.z = i * 0.08;
        tunnels.add(frameGroup);
      }

      const product = new THREE.Group();
      scene.add(product);
      const pizza = new THREE.Group();
      product.add(pizza);
      const crustMap = map(breadTexture(false)),
        crumbMap = map(breadTexture(true));
      const crust = keep(
        new THREE.MeshStandardMaterial({
          map: crustMap,
          roughness: 0.85,
          bumpMap: crustMap,
          bumpScale: 0.015,
        }),
      );
      const crumb = keep(
        new THREE.MeshStandardMaterial({ map: crumbMap, roughness: 1 }),
      );
      const topping = keep(
        new THREE.MeshPhysicalMaterial({
          roughness: 0.7,
          clearcoat: 0.1,
          clearcoatRoughness: 0.6,
        }),
      );
      const slices: { mesh: THREE.Mesh; x: number; z: number }[] = [];
      for (let row = 0; row < 3; row++)
        for (let col = 0; col < 3; col++) {
          const { geometry } = sliceGeometry(col, row);
          const mesh = make(
            pizza,
            geometry,
            [topping, crust, crumb],
            [col - 1, 0, row - 1],
          );
          mesh.scale.y = 0.3;
          slices.push({ mesh, x: col - 1, z: row - 1 });
        }

      const cheese = new THREE.Group();
      pizza.add(cheese);
      const cheeseMaterial = keep(
        new THREE.MeshPhysicalMaterial({
          color: "#ffefd1",
          emissive: "#ffd88a",
          emissiveIntensity: 0.2,
          roughness: 0.38,
          clearcoat: 0.32,
          clearcoatRoughness: 0.25,
        }),
      );
      const strandOffsets = [-0.42, -0.31, -0.24, -0.08, 0.03, 0.16, 0.39];
      const strands = Array.from({ length: 14 }, (_, index) => {
        const edge = index < 7 ? 0 : 1;
        const offset = strandOffsets[index % 7];
        const geometry = new THREE.TubeGeometry(
          new THREE.LineCurve3(new THREE.Vector3(), new THREE.Vector3(0, 1, 0)),
          20,
          0.009,
          6,
          false,
        );
        for (const name of ["position", "normal"]) {
          const attribute = geometry.getAttribute(name);
          if (attribute instanceof THREE.BufferAttribute)
            attribute.setUsage(THREE.DynamicDrawUsage);
        }
        const mesh = make(cheese, geometry, cheeseMaterial, [0, 0, 0]);
        mesh.frustumCulled = false;
        return {
          geometry,
          edge,
          offset,
          index,
          radius:
            index % 7 === 1 || index % 7 === 4
              ? 0.024
              : 0.008 + (index % 3) * 0.003,
        };
      });
      const anchor = new THREE.Vector3(),
        lifted = new THREE.Vector3(),
        control = new THREE.Vector3();
      const center = new THREE.Vector3(),
        tangent = new THREE.Vector3(),
        normal = new THREE.Vector3(),
        binormal = new THREE.Vector3();
      const upAxis = new THREE.Vector3(0, 1, 0),
        forwardAxis = new THREE.Vector3(0, 0, 1);

      const box = new THREE.Group();
      product.add(box);
      const boxRed = keep(
        new THREE.MeshStandardMaterial({ color: "#e01010", roughness: 0.8 }),
      );
      const kraft = keep(
        new THREE.MeshStandardMaterial({
          color: "#b98252",
          roughness: 1,
          bumpMap: grain,
          bumpScale: 0.008,
        }),
      );
      make(
        box,
        new RoundedBoxGeometry(3.65, 0.065, 3.65, 2, 0.02),
        boxRed,
        [0, -0.22, 0],
      );
      make(
        box,
        new THREE.BoxGeometry(3.49, 0.018, 3.49),
        kraft,
        [0, -0.178, 0],
      );
      for (const x of [-1.79, 1.79])
        make(box, new THREE.BoxGeometry(0.07, 0.4, 3.6), boxRed, [x, -0.01, 0]);
      for (const z of [-1.79, 1.79])
        make(box, new THREE.BoxGeometry(3.6, 0.4, 0.07), boxRed, [0, -0.01, z]);
      const hinge = new THREE.Group();
      hinge.position.set(0, 0.23, -1.8);
      box.add(hinge);
      make(
        hinge,
        new RoundedBoxGeometry(3.66, 0.05, 3.66, 2, 0.025),
        boxRed,
        [0, 0, 1.8],
      );
      make(
        hinge,
        new THREE.BoxGeometry(3.52, 0.009, 3.52),
        kraft,
        [0, -0.031, 1.8],
      );
      const print = canvas2d(1024, 1024);
      const drawPrint = (logo?: HTMLImageElement) => {
        const ctx = print.context;
        ctx.fillStyle = "#e01010";
        ctx.fillRect(0, 0, 1024, 1024);
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 194px Arial";
        ctx.textAlign = "center";
        ctx.fillText("90pizza", 512, 670);
        ctx.font = "600 26px Arial";
        ctx.fillText("PIZZA AT THE RIGHT ANGLE", 512, 750);
        ctx.font = "600 21px Arial";
        ctx.fillText("30 x 30 CM / 9 EQUAL SLICES", 512, 937);
        if (logo) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(512, 327, 146, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(logo, 365, 180, 294, 294);
          ctx.restore();
        }
      };
      drawPrint();
      const printMap = map(print.canvas);
      const lidPrint = make(
        hinge,
        new THREE.PlaneGeometry(3.57, 3.57),
        keep(new THREE.MeshBasicMaterial({ map: printMap, toneMapped: false })),
        [0, 0.027, 1.8],
      );
      lidPrint.rotation.x = -Math.PI / 2;
      loaderImage = new window.Image();
      loaderImage.onload = () => {
        if (!disposed && loaderImage) {
          drawPrint(loaderImage);
          printMap.needsUpdate = true;
          invalidate();
        }
      };
      loaderImage.src = "/images/90pizza-logo.png";
      const frontPrint = canvas2d(512, 64);
      frontPrint.context.fillStyle = "#e01010";
      frontPrint.context.fillRect(0, 0, 512, 64);
      frontPrint.context.fillStyle = "white";
      frontPrint.context.font = "900 36px Arial";
      frontPrint.context.fillText("90pizza", 25, 46);
      make(
        box,
        new THREE.PlaneGeometry(3.45, 0.34),
        keep(
          new THREE.MeshStandardMaterial({
            map: map(frontPrint.canvas),
            roughness: 0.9,
          }),
        ),
        [0, 0, 1.828],
      );

      const ingredients = new THREE.Group();
      scene.add(ingredients);
      const ingredientMaterials = [
        "pepperoni",
        "basil",
        "mozzarella",
        "tomato",
      ].map((name) => {
        const photo = keep(
          new THREE.TextureLoader().load(
            "/images/journey/" + name + ".webp",
            () => {
              if (!disposed) invalidate();
            },
          ),
        );
        photo.colorSpace = THREE.SRGBColorSpace;
        return keep(
          new THREE.MeshBasicMaterial({
            map: photo,
            transparent: true,
            alphaTest: 0.04,
            side: THREE.DoubleSide,
            toneMapped: false,
          }),
        );
      });
      const ingredientItems: {
        mesh: THREE.Object3D;
        index: number;
      }[] = [];
      for (let i = 0; i < 12; i++) {
        const geometry = new THREE.PlaneGeometry(1.05, 1.05, 10, 10);
        const vertices = geometry.getAttribute("position");
        for (let j = 0; j < vertices.count; j++)
          vertices.setZ(
            j,
            Math.sin(vertices.getX(j) * Math.PI) *
              Math.sin(vertices.getY(j) * Math.PI) *
              0.06,
          );
        const item = make(
          ingredients,
          geometry,
          ingredientMaterials[i % 4],
          [0, 0, 0],
        );
        ingredientItems.push({ mesh: item, index: i });
      }

      const measure = new THREE.Group();
      product.add(measure);
      const measureMat = keep(
        new THREE.LineBasicMaterial({
          color: "#e01010",
          transparent: true,
          opacity: 0.85,
        }),
      );
      const line = (points: number[][]) => {
        const geometry = keep(
          new THREE.BufferGeometry().setFromPoints(
            points.map(
              (v) => new THREE.Vector3(...(v as [number, number, number])),
            ),
          ),
        );
        const mesh = new THREE.Line(geometry, measureMat);
        measure.add(mesh);
      };
      line([
        [-1.85, -0.1, -1.85],
        [1.85, -0.1, -1.85],
        [1.85, -0.1, 1.85],
        [-1.85, -0.1, 1.85],
        [-1.85, -0.1, -1.85],
      ]);
      for (const x of [-1.85, 1.85])
        line([
          [x, -0.1, -2.05],
          [x, -0.1, -1.65],
        ]);
      for (const z of [-1.85, 1.85])
        line([
          [1.65, -0.1, z],
          [2.05, -0.1, z],
        ]);

      const ingredientSlots = [
        [-0.07, 0.5],
        [0.4, 0.52],
        [0.85, 0.45],
        [0.2, 0.1],
        [0.66, 0.08],
        [0.95, -0.3],
        [0.25, -0.45],
        [0.65, -0.6],
        [0.88, -0.7],
        [0.5, 0.3],
        [-0.1, 0.24],
        [0.97, 0.05],
      ];
      const mobileSlots = [
        [-0.65, 0.5],
        [0.45, 0.5],
        [0.03, 0.18],
        [0.7, 0.05],
        [-0.65, -0.03],
        [0.35, -0.08],
        [-0.15, 0.52],
        [0.95, 0.38],
        [-0.95, 0.25],
        [0.5, 0.25],
        [-0.15, -0.1],
        [0.9, -0.1],
      ];
      const position = new THREE.Vector3(),
        aim = new THREE.Vector3(),
        projected = new THREE.Vector3();
      const cameraPath = new THREE.CatmullRomCurve3([
        new THREE.Vector3(4.4, 4.3, 8.5),
        new THREE.Vector3(-1.8, 2.7, 6.3),
        new THREE.Vector3(3.2, 6.2, 6.3),
        new THREE.Vector3(-2.8, 6.1, 6.8),
        new THREE.Vector3(3.4, 4.6, 7.6),
      ]);
      let pointerX = 0,
        pointerY = 0,
        pointerAimX = 0,
        pointerAimY = 0;
      let manualSpread = 0;
      let cheesePull = 0;
      const canRender = () =>
        !disposed && !failed && !document.hidden && width > 0 && height > 0;
      function invalidate() {
        if (!frame && canRender()) frame = requestAnimationFrame(render);
      }
      function render(time: number) {
        frame = 0;
        if (!canRender()) return;
        if (
          !settings.current.reduced &&
          width < 700 &&
          lastTime &&
          time - lastTime < 30
        ) {
          invalidate();
          return;
        }
        const mobile = width / height < 0.9;
        const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 1 / 60;
        lastTime = time;
        const still = settings.current.reduced;
        const requestedProgress = still
          ? Math.round(progress.get() * 4) / 4
          : progress.get();
        currentProgress = still
          ? requestedProgress
          : THREE.MathUtils.damp(currentProgress, requestedProgress, 8, dt);
        if (!still) elapsed += dt;
        const p = THREE.MathUtils.clamp(currentProgress, 0, 1),
          stage = p * 4;
        element!.dataset.stage = String(Math.round(stage));
        element!.dataset.progress = stage.toFixed(3);
        const arrival = smooth(3.3, 3.65, stage);
        const splitTarget =
          settings.current.split && stage > 2.5 && stage < 3.5 ? 1 : 0;
        manualSpread = still
          ? splitTarget
          : THREE.MathUtils.damp(manualSpread, splitTarget, 9, dt);
        const productScale =
          mobile && height < 800
            ? height < 620
              ? 0.68
              : 0.8
            : !mobile && height < 600
              ? 0.86
              : 1;
        product.scale.setScalar(productScale * (1 - manualSpread * 0.12));
        background
          .copy(dark)
          .lerp(redRoom, Math.sin(p * Math.PI) * 0.4)
          .lerp(paper, arrival);
        fog.color.copy(background);
        floorMaterial.color.copy(floorColor).lerp(paper, arrival);
        floor.visible = stage < 0.6 || stage > 1.65;
        scene.environmentIntensity = 0.4 + arrival * 0.3;
        ovenLight.intensity =
          (1 - smooth(0.3, 1.2, stage)) * (32 + Math.sin(elapsed * 5) * 2);
        rim.intensity = (1 - arrival) * 9;
        oven.visible = stage < 0.75;
        oven.position.z = -smooth(0, 0.9, stage) * 18;
        tunnels.visible = stage > 0.7 && stage < 3.5;
        tunnels.position.z = smooth(1, 3, stage) * 5;
        tunnelMat.opacity = Math.sin(smooth(0.7, 3.5, stage) * Math.PI) * 0.5;
        product.position.set(0, keyValue([-0.8, 0.05, 0, 0.12, 0.1], stage), 0);
        product.rotation.set(
          keyValue([0, -0.08, 0.02, 0.08, 0], stage),
          keyValue([-0.12, 0.28, 1.45, 1.75, -0.2], stage),
          still ? 0 : Math.sin(elapsed * 0.5) * 0.012,
        );
        const spread =
          keyValue([0, 0.65, 0, 0.24, 0], stage) + manualSpread * 0.28;
        for (const slice of slices) {
          slice.mesh.position.set(
            slice.x * (1.04 + spread),
            stage < 1.5
              ? spread * (slice.z + 1) * 0.18
              : spread * (slice.x + slice.z + 2) * 0.13,
            slice.z * (1.04 + spread),
          );
          slice.mesh.rotation.set(
            slice.z * spread * 0.12,
            0,
            -slice.x * spread * 0.12,
          );
        }
        const pullWindow =
          smooth(2.6, 2.95, stage) * (1 - smooth(3.22, 3.55, stage));
        const desiredPull = settings.current.pull
          ? pullWindow * (still ? 0.85 : 0.85 + Math.sin(elapsed * 0.8) * 0.06)
          : 0;
        cheesePull = still
          ? desiredPull
          : THREE.MathUtils.damp(cheesePull, desiredPull, 7, dt);
        const corner = slices[8].mesh;
        corner.position.y += cheesePull * 1.25;
        corner.position.x += cheesePull * 0.18;
        corner.position.z += cheesePull * 0.18;
        corner.rotation.x += cheesePull * 0.1;
        corner.rotation.z -= cheesePull * 0.11;
        cheese.visible = cheesePull > 0.012 && stage > 2.45 && stage < 3.65;
        element!.dataset.cheesePull = cheese.visible
          ? cheesePull.toFixed(3)
          : "0";
        if (cheese.visible) {
          corner.updateMatrix();
          slices[7].mesh.updateMatrix();
          slices[5].mesh.updateMatrix();
          for (const strand of strands) {
            const neighbor =
              strand.edge === 0 ? slices[7].mesh : slices[5].mesh;
            const liftedOffset =
              strand.offset * 0.72 + Math.sin(strand.index * 2.13) * 0.035;
            const anchorOffset =
              strand.offset + Math.cos(strand.index * 1.8) * 0.025;
            lifted
              .set(
                strand.edge === 0 ? -0.49 : liftedOffset,
                0.11,
                strand.edge === 0 ? liftedOffset : -0.49,
              )
              .applyMatrix4(corner.matrix);
            anchor
              .set(
                strand.edge === 0 ? 0.49 : anchorOffset,
                0.11,
                strand.edge === 0 ? anchorOffset : 0.49,
              )
              .applyMatrix4(neighbor.matrix);
            control.copy(anchor).lerp(lifted, 0.5);
            control.y -=
              0.08 + cheesePull * (0.13 + Math.sin(strand.index * 2.7) * 0.055);
            control.x += Math.sin(strand.index * 1.7) * 0.035;
            control.z += Math.cos(strand.index * 2.3) * 0.035;
            const positions = strand.geometry.getAttribute("position"),
              normals = strand.geometry.getAttribute("normal");
            for (let ring = 0; ring <= 20; ring++) {
              const t = ring / 20,
                inv = 1 - t;
              center
                .copy(anchor)
                .multiplyScalar(inv * inv)
                .addScaledVector(control, 2 * inv * t)
                .addScaledVector(lifted, t * t);
              tangent
                .copy(control)
                .sub(anchor)
                .multiplyScalar(2 * inv)
                .addScaledVector(binormal.copy(lifted).sub(control), 2 * t)
                .normalize();
              normal.crossVectors(tangent, upAxis);
              if (normal.lengthSq() < 0.0001)
                normal.crossVectors(tangent, forwardAxis);
              normal.normalize();
              binormal.crossVectors(tangent, normal).normalize();
              const radius =
                strand.radius * (0.35 + Math.pow(Math.abs(2 * t - 1), 2) * 2.2);
              for (let side = 0; side <= 6; side++) {
                const a = (side / 6) * Math.PI * 2,
                  c = Math.cos(a),
                  s = Math.sin(a),
                  vertex = ring * 7 + side;
                const nx = (normal.x * c) / 1.7 + (binormal.x * s) / 0.5,
                  ny = (normal.y * c) / 1.7 + (binormal.y * s) / 0.5,
                  nz = (normal.z * c) / 1.7 + (binormal.z * s) / 0.5;
                const normalLength = Math.hypot(c / 1.7, s / 0.5);
                positions.setXYZ(
                  vertex,
                  center.x +
                    (normal.x * c * 1.7 + binormal.x * s * 0.5) * radius,
                  center.y +
                    (normal.y * c * 1.7 + binormal.y * s * 0.5) * radius,
                  center.z +
                    (normal.z * c * 1.7 + binormal.z * s * 0.5) * radius,
                );
                normals.setXYZ(
                  vertex,
                  nx / normalLength,
                  ny / normalLength,
                  nz / normalLength,
                );
              }
            }
            positions.needsUpdate = true;
            normals.needsUpdate = true;
          }
        }
        pizza.position.y = -0.13 * smooth(3.3, 3.72, stage);
        const pizzaOpacity = Math.min(
          1,
          1 - smooth(0.3, 0.65, stage) + smooth(1.2, 1.7, stage),
        );
        pizza.visible = pizzaOpacity > 0.001;
        for (const material of [topping, crust, crumb]) {
          material.transparent = pizzaOpacity < 1;
          material.opacity = pizzaOpacity;
        }
        pizza.scale.set(1, 1, 1);
        box.visible = stage > 3.28;
        box.scale.setScalar(Math.max(0.001, smooth(3.28, 3.72, stage)));
        hinge.rotation.x = -1.88 * (1 - smooth(3.65, 4, stage));
        measure.visible = stage > 1.5 && stage < 3.4;
        measure.rotation.y = 0;
        const ingredientStrength =
          smooth(0.2, 0.8, stage) * (1 - smooth(1.3, 2.1, stage));
        ingredients.visible = ingredientStrength > 0.001;
        ingredients.rotation.y = keyValue([0, 0.1, 1.2, 1.2, 1.2], stage);
        cameraPath.getPointAt(p, position);
        const fit = mobile ? Math.max(1.35, 0.78 / camera.aspect) : 1;
        position.multiplyScalar(fit);
        pointerX = THREE.MathUtils.damp(pointerX, pointerAimX, 5, dt);
        pointerY = THREE.MathUtils.damp(pointerY, pointerAimY, 5, dt);
        if (!still) {
          position.x += pointerX * 0.22;
          position.y += pointerY * 0.12 + Math.sin(elapsed * 0.45) * 0.025;
        }
        camera.position.copy(position);
        aim.set(
          mobile ? 0 : -1.25,
          mobile ? (height < 620 ? -2.25 : height < 800 ? -2.6 : -1.8) : -0.05,
          0,
        );
        camera.lookAt(aim);
        camera.updateMatrixWorld();
        ingredients.updateMatrixWorld(true);
        for (const item of ingredientItems) {
          const slot = (mobile ? mobileSlots : ingredientSlots)[item.index];
          const travel = 1 + (stage - 1) * 0.5;
          const slotX =
            !mobile && height < 600 ? Math.max(0.15, slot[0]) : slot[0];
          const slotY =
            !mobile && height < 600 ? Math.min(0.35, slot[1]) : slot[1];
          projected
            .set(
              slotX * travel +
                (still ? 0 : Math.sin(elapsed * 0.4 + item.index) * 0.015),
              slotY * travel,
              0.5,
            )
            .unproject(camera);
          projected
            .sub(camera.position)
            .normalize()
            .multiplyScalar(4.5 + (item.index % 3) * 1.4)
            .add(camera.position);
          item.mesh.position.copy(ingredients.worldToLocal(projected));
          item.mesh.scale.setScalar(
            ingredientStrength * (mobile ? 0.55 : 0.85),
          );
          item.mesh.quaternion.copy(camera.quaternion);
          item.mesh.rotateZ(
            item.index * 0.45 +
              (still ? 0 : Math.sin(elapsed * 0.3 + item.index) * 0.1),
          );
          item.mesh.visible = true;
        }
        try {
          gl.render(scene, camera);
        } catch {
          failed = true;
          setReady(false);
          return;
        }
        if (photo && !announcedReady) {
          announcedReady = true;
          setReady(true);
        }
        if (!still || Math.abs(currentProgress - requestedProgress) > 0.0001)
          invalidate();
      }
      const load = (url: string) => {
        if (url === requested || disposed) return;
        requested = url;
        const requestVersion = ++version;
        new THREE.TextureLoader().load(
          url,
          (texture) => {
            if (disposed || requestVersion !== version) {
              texture.dispose();
              return;
            }
            keep(texture);
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = Math.min(
              8,
              gl.capabilities.getMaxAnisotropy(),
            );
            topping.map = texture;
            topping.needsUpdate = true;
            if (photo) release(photo);
            photo = texture;
            invalidate();
          },
          undefined,
          () => {
            if (!disposed && !photo) setReady(false);
          },
        );
      };
      runtime.current = { load, invalidate };
      const resize = () => {
        const r = element.getBoundingClientRect();
        width = r.width;
        height = r.height;
        gl.setPixelRatio(Math.min(devicePixelRatio, width < 700 ? 1.4 : 1.8));
        gl.setSize(width, height, false);
        camera.aspect = width / Math.max(height, 1);
        camera.updateProjectionMatrix();
        invalidate();
      };
      observer = new ResizeObserver(resize);
      observer.observe(element);
      resize();
      const changed = progress.on("change", invalidate);
      removers.push(changed);
      const visibility = () => {
        lastTime = 0;
        if (document.hidden) {
          cancelAnimationFrame(frame);
          frame = 0;
        } else invalidate();
      };
      document.addEventListener("visibilitychange", visibility);
      removers.push(() =>
        document.removeEventListener("visibilitychange", visibility),
      );
      const pointer = (event: PointerEvent) => {
        if (event.pointerType === "touch") return;
        pointerAimX = event.clientX / width - 0.5;
        pointerAimY = event.clientY / height - 0.5;
        invalidate();
      };
      window.addEventListener("pointermove", pointer, { passive: true });
      removers.push(() => window.removeEventListener("pointermove", pointer));
      const lost = (event: Event) => {
        event.preventDefault();
        failed = true;
        announcedReady = false;
        cancelAnimationFrame(frame);
        frame = 0;
        setReady(false);
      };
      const restored = () => {
        try {
          release(envTarget);
          const room = keep(new RoomEnvironment()),
            generator = keep(new THREE.PMREMGenerator(gl));
          envTarget = keep(generator.fromScene(room, 0.04));
          scene.environment = envTarget.texture;
          release(room);
          release(generator);
          key.shadow.dispose();
          key.shadow.map = null;
          key.shadow.mapPass = null;
          failed = false;
          invalidate();
        } catch {
          setReady(false);
        }
      };
      surface.addEventListener("webglcontextlost", lost);
      surface.addEventListener("webglcontextrestored", restored);
      removers.push(() => {
        surface.removeEventListener("webglcontextlost", lost);
        surface.removeEventListener("webglcontextrestored", restored);
      });
    } catch {
      cleanup();
      setReady(false);
    }
    return cleanup;
  }, [progress]);

  useEffect(() => {
    runtime.current?.load(texture);
  }, [texture]);

  return (
    <div
      className="journey-world"
      ref={root}
      data-ready={ready}
      role="img"
      aria-label={label}
    >
      <canvas
        ref={canvas}
        aria-hidden="true"
        style={{ opacity: ready ? 1 : 0 }}
      />
      <div className="journey-fallback" hidden={ready}>
        <Image
          src={texture}
          alt=""
          fill
          sizes="(max-width: 700px) 90vw, 650px"
          priority
        />
      </div>
    </div>
  );
}
