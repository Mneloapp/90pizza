"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { assemblyAt, mix, scenePose, smooth } from "./scene-math";
import { buildPreparation } from "../pizza-preparation";
import { buildFlour } from "../pizza-flour";
import { buildBox } from "../pizza-packaging";
import { buildHands, buildWater } from "./making-hands";
import { buildMakingOven } from "./making-oven";
import { buildFirstBite } from "./making-bite";

type Props = {
  progress: RefObject<number>;
  turns: number;
  replay: number;
  paused: boolean;
  reduced: boolean;
  label: string;
  fallbackSrc: string;
  fallbackMobileSrc: string;
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
    let failed = false;
    const showFallback = () => {
      failed = true;
      element.dataset.state = "fallback";
      element.parentElement?.style.setProperty("--dt-scene-ink", "#ffffff");
    };
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      showFallback();
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

    const floor = new THREE.MeshStandardMaterial({
      color: "#292c29",
      roughness: 0.9,
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
    const worktable = block(50, 0.12, 50, 0, -0.075, 0, floor);
    const product = new THREE.Group();
    scene.add(product);
    const resources: { dispose(): void }[] = [];
    const keep = <T extends { dispose(): void }>(resource: T) => {
      resources.push(resource);
      return resource;
    };
    let assetVersion = 0;
    const surface = keep(
      new THREE.TextureLoader().load(
        "/images/materials/oven-stone.webp",
        () => assetVersion++,
      ),
    );
    surface.colorSpace = THREE.SRGBColorSpace;
    surface.wrapS = surface.wrapT = THREE.RepeatWrapping;
    surface.repeat.set(12, 12);
    floor.bumpMap = surface;
    floor.bumpScale = 0.008;
    const preparation = buildPreparation({ keep }, () => {
      assetVersion++;
    });
    preparation.group.scale.setScalar(0.84);
    preparation.group.position.y = 0.032;
    scene.add(preparation.group);
    const flour = buildFlour({ keep }, window.innerWidth < 768);
    const flourRoot = new THREE.Group();
    flourRoot.scale.setScalar(0.84);
    flourRoot.position.y = 0.032;
    flourRoot.add(flour.group, flour.curtain);
    scene.add(flourRoot);
    const hands = buildHands({ keep });
    scene.add(hands.group);
    const water = buildWater({ keep });
    scene.add(water.group);
    const oven = buildMakingOven({ keep }, () => assetVersion++);
    scene.add(oven.group);
    const bite = buildFirstBite({ keep });
    scene.add(bite.group);
    const packaging = buildBox({ keep }, () => assetVersion++);
    packaging.group.scale.setScalar(0.83);
    scene.add(packaging.group);
    const handoff = { value: 0 };
    const dissolved = new Set<THREE.Material>();
    function dissolve(material: THREE.Material, incoming: boolean) {
      if (dissolved.has(material)) return;
      dissolved.add(material);
      const original = material.onBeforeCompile;
      const key = material.customProgramCacheKey();
      material.onBeforeCompile = (shader, renderer) => {
        original.call(material, shader, renderer);
        shader.uniforms.assemblyBlend = handoff;
        shader.fragmentShader =
          `uniform float assemblyBlend;\n${shader.fragmentShader}`.replace(
            "#include <alphatest_fragment>",
            `#include <alphatest_fragment>\ndiffuseColor.a *= ${incoming ? "assemblyBlend" : "1.0 - assemblyBlend"};`,
          );
      };
      material.customProgramCacheKey = () => `${key}/assembly-${incoming}`;
      material.needsUpdate = true;
    }
    preparation.group.traverse((object) => {
      if (object instanceof THREE.Mesh)
        (Array.isArray(object.material)
          ? object.material
          : [object.material]
        ).forEach((m) => dissolve(m, false));
    });
    const slices: {
      object: THREE.Object3D;
      base: THREE.Vector3;
      rest: THREE.Quaternion;
    }[] = [];
    const draco = new DRACOLoader()
      .setDecoderPath("/draco/")
      .setDecoderConfig({ type: "wasm" })
      .setWorkerLimit(1);
    const loader = new GLTFLoader().setDRACOLoader(draco);
    loader.load(
      "/models/detour-pizza.glb",
      (gltf) => {
        if (disposed || failed) {
          disposeTree(gltf.scene);
          return;
        }
        product.add(gltf.scene);
        gltf.scene.traverse((object) => {
          if (/^Slice_\d+$/.test(object.name))
            slices.push({
              object,
              base: object.position.clone(),
              rest: object.quaternion.clone(),
            });
          if (object instanceof THREE.Mesh) {
            object.renderOrder = 1;
            object.castShadow = true;
            object.receiveShadow = true;
            const mats = Array.isArray(object.material)
              ? object.material
              : [object.material];
            mats.forEach((m: THREE.MeshStandardMaterial) => {
              dissolve(m, true);
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
        if (!disposed) showFallback();
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
      showFallback();
    };
    renderer.domElement.addEventListener("webglcontextlost", onLoss);
    let frame = 0,
      last = 0,
      elapsed = 0,
      rotation = 0,
      renderedProgress = 0,
      introElapsed = 0,
      lastReplay = props.replay;
    let lastInput = "";
    const target = new THREE.Vector3();
    const box = new THREE.Box3();
    const bakedBox = new THREE.Box3();
    const rotationMatrix = new THREE.Matrix4();
    const dark = new THREE.Color("#111111");
    const light = new THREE.Color("#242622");
    const groundColor = new THREE.Color("#303130");
    const ovenColor = new THREE.Color("#140c08");
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
    function frameProduct(
      blend: number,
      introZoom: number,
      assembly: ReturnType<typeof assemblyAt>,
    ) {
      const entrance = smooth((renderedProgress - 0.13) / 0.12);
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
      if (blend < 1) {
        // A stable work area preserves the flour-to-dough growth and leaves room for falling ingredients.
        box.min.set(-2.05, -0.02, -2.05);
        box.max.set(2.05, 1.7, 2.05);
        box.applyMatrix4(rotationMatrix.makeRotationY(product.rotation.y));
        if (blend > 0) {
          bakedBox.setFromObject(product);
          box.min.lerp(bakedBox.min, blend);
          box.max.lerp(bakedBox.max, blend);
        }
      } else box.setFromObject(product);
      if (assembly.box > 0) {
        bakedBox.min.set(-1.75, -0.1, -1.85);
        bakedBox.max.set(
          1.75,
          0.5 + Math.sin((1 - assembly.lid) * 1.65) * 3.34,
          1.85,
        );
        bakedBox.applyMatrix4(rotationMatrix.makeRotationY(product.rotation.y));
        box.min.lerp(bakedBox.min, assembly.box);
        box.max.lerp(bakedBox.max, assembly.box);
      }
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
      camera.position
        .sub(target)
        .multiplyScalar(1 / introZoom)
        .add(target);
      camera.updateMatrixWorld();
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
        failed ||
        !inView ||
        document.hidden ||
        now - last < 1000 / (width < 768 ? 30 : 45)
      )
        return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const {
        progress: progressRef,
        turns,
        replay,
        paused,
        reduced,
      } = live.current;
      const progress = progressRef.current;
      if (replay !== lastReplay) {
        lastReplay = replay;
        introElapsed = 0;
      }
      if (reduced) introElapsed = 6;
      else if (!paused) introElapsed = Math.min(6, introElapsed + dt);
      const input = `${progress}:${turns}:${replay}:${introElapsed}:${paused}:${reduced}:${width}:${height}:${slices.length}:${assetVersion}`;
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
      const assembly = assemblyAt(renderedProgress, introElapsed);
      const pose = scenePose(assembly.orbit, camera.aspect);
      const blend = slices.length ? assembly.handoff : 0;
      const blending = blend > 0.0001 && blend < 0.9999;
      dissolved.forEach((material) => {
        if (material.transparent !== blending) {
          material.transparent = blending;
          material.depthWrite = !blending;
          material.needsUpdate = true;
        }
      });
      handoff.value = blend;
      preparation.group.visible = blend < 1;
      if (preparation.group.visible)
        preparation.update(
          assembly.form,
          assembly.topping,
          assembly.bake,
          assembly.formation,
        );
      preparation.pin.visible = false;
      hands.update(assembly.time, assembly.form, assembly.hands);
      water.update(assembly.time, assembly.water);
      oven.update(assembly.oven, assembly.bake, elapsed);
      flour.update(
        assembly.time,
        renderedProgress < 0.34,
        reduced,
        renderer.getPixelRatio(),
        height,
        assembly.form,
      );
      product.visible = blend > 0;
      const daylight = smooth((assembly.time - 4.65) / 1.25);
      (scene.background as THREE.Color)
        .copy(dark)
        .lerp(light, daylight)
        .lerp(ovenColor, assembly.oven);
      (scene.fog as THREE.Fog).color.copy(scene.background as THREE.Color);
      floor.color.copy(dark).lerp(groundColor, daylight);
      element.parentElement?.style.setProperty("--dt-scene-ink", "#ffffff");
      worktable.visible = assembly.oven < 0.98;
      key.intensity = 2 * (1 - assembly.oven * 0.65);
      fill.intensity = 0.5 * (1 - assembly.oven * 0.8);
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
      preparation.group.rotation.y = product.rotation.y;
      flourRoot.rotation.y = product.rotation.y;
      hands.group.rotation.y = product.rotation.y;
      water.group.rotation.y = product.rotation.y;
      product.position.y =
        assembly.box * 0.032 + Math.sin(assembly.box * Math.PI) * 0.48;
      bite.group.rotation.y = product.rotation.y;
      bite.group.position.y = product.position.y;
      slices.forEach(({ object, base, rest }) => {
        object.position.copy(base);
        object.quaternion.copy(rest);
        object.position.x += base.x * assembly.cut * 0.008;
        object.position.z += base.z * assembly.cut * 0.008;
        if (base.x < -0.5 && base.z > 0.5) {
          object.position.x -= assembly.lift * 0.3;
          object.position.z += assembly.lift * 0.32;
          object.position.y += assembly.lift * 0.65;
          object.rotateZ(assembly.lift * 0.12);
          object.rotateX(assembly.lift * 0.04);
        }
      });
      bite.update(slices, assembly.cut, assembly.lift, assembly.release);
      packaging.group.visible = renderedProgress > 0.915;
      packaging.group.position.set((1 - assembly.box) * 4.6, 0.08, 0);
      packaging.group.rotation.y = product.rotation.y;
      packaging.hinge.rotation.x = -(1 - assembly.lid) * 1.65;
      frameProduct(
        blend,
        reduced ? 1 : mix(1.9, 1, smooth((assembly.time - 2) / 3.2)),
        assembly,
      );
      renderer.render(scene, camera);
      if (element.dataset.state === "loading") element.dataset.state = "ready";
      element.dataset.progress = renderedProgress.toFixed(3);
      element.dataset.lift = assembly.lift.toFixed(3);
      element.dataset.cut = assembly.cut.toFixed(3);
      element.dataset.cheese = String(bite.active);
      element.dataset.raised = String(
        slices.filter(({ object, base }) => object.position.y - base.y > 0.05)
          .length,
      );
      element.dataset.hands = String(hands.group.visible);
      element.dataset.water = String(water.group.visible);
      element.dataset.oven = assembly.oven.toFixed(3);
      element.dataset.box = assembly.box.toFixed(3);
      element.dataset.lid = assembly.lid.toFixed(3);
      element.dataset.branding = String(packaging.loaded.size);
      element.dataset.intro = assembly.time.toFixed(3);
      element.dataset.formation = assembly.formation.toFixed(3);
      element.dataset.form = assembly.form.toFixed(3);
      element.dataset.topping = assembly.topping.toFixed(3);
      element.dataset.bake = assembly.bake.toFixed(3);
      element.dataset.handoff = blend.toFixed(3);
      element.dataset.flour = String(flour.curtain.visible);
      element.dataset.product = blend < 1 ? "preparation" : "baked";
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
      scene.remove(
        preparation.group,
        flourRoot,
        hands.group,
        water.group,
        oven.group,
        bite.group,
        packaging.group,
      );
      resources.forEach((resource) => resource.dispose());
      key.shadow.dispose();
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
      {/* Rendered stills keep the opening legible when WebGL is unavailable. */}
      <picture>
        <source media="(max-width: 767px)" srcSet={props.fallbackMobileSrc} />
        <img
          className="dt-scene-fallback"
          src={props.fallbackSrc}
          alt=""
          width="1500"
          height="1000"
          fetchPriority="high"
        />
      </picture>
    </div>
  );
}
