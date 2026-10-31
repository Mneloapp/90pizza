"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mix, scenePose, smooth } from "./scene-math";

type Props = {
  progress: RefObject<number>;
  turns: number;
  paused: boolean;
  reduced: boolean;
  label: string;
};

function disposeTree(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    const list = Array.isArray(object.material)
      ? object.material
      : [object.material];
    list.forEach((m) => {
      materials.add(m);
      Object.values(m).forEach((v) => {
        if (v instanceof THREE.Texture) textures.add(v);
      });
    });
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  textures.forEach((t) => {
    t.dispose();
    if (typeof ImageBitmap !== "undefined" && t.image instanceof ImageBitmap)
      t.image.close();
  });
}

export default function DetourScene(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef(props);
  live.current = props;

  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    const element: HTMLDivElement = mount;
    let disposed = false;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      element.dataset.state = "fallback";
      return;
    }
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.5 : 1.75),
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.86;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute("aria-hidden", "true");
    element.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f4f4f2");
    scene.fog = new THREE.Fog("#f4f4f2", 15, 40);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 60);
    const environment = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(environment, 0.04);
    scene.environment = env.texture;
    scene.environmentIntensity = 0.2;
    environment.dispose();
    pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xffffff, 0xc2b2a1, 0.8));
    const key = new THREE.DirectionalLight(0xfff6e9, 2);
    key.position.set(-3, 8, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, {
      left: -7,
      right: 7,
      top: 7,
      bottom: -7,
      near: 0.5,
      far: 25,
    });
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.025;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(4, 2, -4);
    scene.add(fill);

    const red = new THREE.MeshStandardMaterial({
      color: "#b4070d",
      roughness: 0.6,
    });
    const floor = new THREE.MeshStandardMaterial({
      color: "#e4e4df",
      roughness: 0.9,
    });
    const steel = new THREE.MeshStandardMaterial({
      color: "#c6c9c7",
      roughness: 0.32,
      metalness: 0.75,
    });
    function block(
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      material: THREE.Material,
      radius = 0.025,
    ) {
      const mesh = new THREE.Mesh(
        new RoundedBoxGeometry(w, h, d, 2, radius),
        material,
      );
      mesh.position.set(x, y, z);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      scene.add(mesh);
      return mesh;
    }
    block(50, 0.12, 50, 0, -0.62, 0, floor);
    block(3.45, 0.1, 7, 0, -0.49, 1.9, red);
    block(8, 0.1, 3.45, 2.275, -0.49, 7.125, red);
    const plinth = block(3.35, 0.36, 3.35, 0, -0.25, 0, red);
    const plate = block(3.16, 0.045, 3.16, 0, -0.035, 0, steel, 0.015);
    const product = new THREE.Group();
    scene.add(product);
    const slices: { object: THREE.Object3D; base: THREE.Vector3 }[] = [];
    const draco = new DRACOLoader()
      .setDecoderPath("/draco/")
      .setDecoderConfig({ type: "wasm" })
      .setWorkerLimit(1);
    const loader = new GLTFLoader().setDRACOLoader(draco);
    loader.load(
      "/models/detour-pizza.glb",
      (gltf) => {
        if (disposed) {
          disposeTree(gltf.scene);
          return;
        }
        product.add(gltf.scene);
        gltf.scene.traverse((object) => {
          if (/^Slice_\d+$/.test(object.name))
            slices.push({ object, base: object.position.clone() });
          if (object instanceof THREE.Mesh) {
            object.castShadow = true;
            object.receiveShadow = true;
            const mats = Array.isArray(object.material)
              ? object.material
              : [object.material];
            mats.forEach((m: THREE.MeshStandardMaterial) => {
              if (m.map)
                m.map.anisotropy = Math.min(
                  8,
                  renderer.capabilities.getMaxAnisotropy(),
                );
              m.envMapIntensity = 0.25;
              if (m.name === "BakedSurface") {
                m.roughness = 0.66;
                m.metalness = 0;
              }
            });
          }
        });
        element.dataset.slices = String(slices.length);
        element.dataset.state = "ready";
      },
      undefined,
      () => {
        if (!disposed) element.dataset.state = "fallback";
      },
    );

    let inView = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
      },
      { rootMargin: "100px" },
    );
    observer.observe(element);
    let width = 1,
      height = 1;
    const resize = () => {
      const rect = element.getBoundingClientRect();
      if (rect.width && rect.height) {
        width = rect.width;
        height = rect.height;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    };
    const resizer = new ResizeObserver(resize);
    resizer.observe(element);
    resize();
    const pointer = new THREE.Vector2();
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = element.getBoundingClientRect();
      pointer.set(
        (event.clientX - rect.left) / rect.width - 0.5,
        (event.clientY - rect.top) / rect.height - 0.5,
      );
    };
    const resetPointer = () => pointer.set(0, 0);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("blur", resetPointer);
    const onLoss = (event: Event) => {
      event.preventDefault();
      element.dataset.state = "fallback";
    };
    renderer.domElement.addEventListener("webglcontextlost", onLoss);
    let frame = 0,
      last = 0,
      elapsed = 0,
      rotation = 0,
      renderedProgress = 0;
    let lastInput = "";
    const target = new THREE.Vector3();
    const box = new THREE.Box3();
    const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
    function projectedBounds() {
      let left = Infinity,
        right = -Infinity,
        top = Infinity,
        bottom = -Infinity;
      corners.forEach((point, i) => {
        point
          .set(
            i & 1 ? box.max.x : box.min.x,
            i & 2 ? box.max.y : box.min.y,
            i & 4 ? box.max.z : box.min.z,
          )
          .project(camera);
        const x = ((point.x + 1) * width) / 2,
          y = ((1 - point.y) * height) / 2;
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      });
      return { left, right, top, bottom };
    }
    // Fit the actual transformed model into a copy-safe screen region, not a fixed zoom.
    function frameProduct() {
      if (!slices.length) return;
      const entrance = smooth((renderedProgress - 0.28) / 0.12);
      let region: number[];
      if (width < 768)
        region = [
          20,
          width - 20,
          height < 680 ? mix(240, 265, entrance) : 330,
          height - (height < 680 ? 130 : 215),
        ];
      else if (height < 540)
        region = [width * 0.46, width - 165, 104, height - 62];
      else if (width < 1024)
        region = [70, width - 70, mix(350, 410, entrance), height - 245];
      else
        region = [
          mix(width * 0.23, width * 0.38, entrance),
          mix(width * 0.77, width - 250, entrance),
          mix(height * 0.38, height * 0.3, entrance),
          mix(height - 125, height - 115, entrance),
        ];
      const regionWidth = Math.max(100, region[1] - region[0]);
      const regionHeight = Math.max(100, region[3] - region[2]);
      box.setFromObject(product);
      camera.clearViewOffset();
      camera.updateMatrixWorld();
      for (let i = 0; i < 3; i++) {
        const bounds = projectedBounds();
        const scale =
          Math.max(
            (bounds.right - bounds.left) / regionWidth,
            (bounds.bottom - bounds.top) / regionHeight,
          ) * 1.015;
        camera.position.sub(target).multiplyScalar(scale).add(target);
        camera.updateMatrixWorld();
      }
      const bounds = projectedBounds();
      camera.setViewOffset(
        width,
        height,
        (bounds.left + bounds.right - region[0] - region[1]) / 2,
        (bounds.top + bounds.bottom - region[2] - region[3]) / 2,
        width,
        height,
      );
      const framed = projectedBounds();
      element.dataset.bounds = JSON.stringify(
        Object.fromEntries(
          Object.entries(framed).map(([k, v]) => [k, Math.round(v)]),
        ),
      );
    }
    function tick(now: number) {
      frame = requestAnimationFrame(tick);
      if (
        !inView ||
        document.hidden ||
        now - last < 1000 / (width < 768 ? 30 : 45)
      )
        return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const { progress: progressRef, turns, paused, reduced } = live.current;
      const progress = progressRef.current;
      const input = `${progress}:${turns}:${paused}:${reduced}:${width}:${height}:${slices.length}`;
      if (
        (paused || reduced) &&
        input === lastInput &&
        Math.abs(progress - renderedProgress) < 0.0001 &&
        Math.abs((turns * Math.PI) / 2 - rotation) < 0.0001
      )
        return;
      if (!paused && !reduced) elapsed += dt;
      const damping = reduced ? 1 : 1 - Math.exp(-dt * 9);
      renderedProgress += (progress - renderedProgress) * damping;
      rotation += ((turns * Math.PI) / 2 - rotation) * damping;
      const pose = scenePose(renderedProgress, camera.aspect);
      const parallax = reduced || paused ? 0 : 0.13;
      camera.position.set(
        pose.position[0] + pointer.x * parallax,
        pose.position[1] - pointer.y * parallax,
        pose.position[2],
      );
      target.set(0, 0.04, 0);
      camera.lookAt(target);
      product.rotation.y =
        rotation + (!reduced && !paused ? Math.sin(elapsed * 0.28) * 0.035 : 0);
      slices.forEach(({ object, base }) => {
        object.position.copy(base);
        object.position.x += base.x * pose.split * 0.34;
        object.position.z += base.z * pose.split * 0.34;
        object.position.y +=
          pose.split * (0.12 + (Math.abs(base.x) + Math.abs(base.z)) * 0.065);
      });
      plinth.scale.setScalar(1 + pose.split * 0.2);
      plate.scale.set(1 + pose.split * 0.25, 1, 1 + pose.split * 0.25);
      frameProduct();
      renderer.render(scene, camera);
      element.dataset.progress = renderedProgress.toFixed(3);
      element.dataset.split = pose.split.toFixed(3);
      element.dataset.rotation = rotation.toFixed(3);
      element.dataset.triangles = String(renderer.info.render.triangles);
      lastInput = input;
    }
    frame = requestAnimationFrame(tick);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizer.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("blur", resetPointer);
      renderer.domElement.removeEventListener("webglcontextlost", onLoss);
      draco.dispose();
      disposeTree(scene);
      env.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={host}
      className="dt-canvas"
      role="img"
      aria-label={props.label}
      data-state="loading"
    >
      {/* The same Blender scene is the no-WebGL and data-saving fallback. */}
      <img
        className="dt-scene-fallback"
        src="/images/detour/hero.webp"
        alt=""
        width="1500"
        height="1000"
        fetchPriority="high"
      />
    </div>
  );
}
