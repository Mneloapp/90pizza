"use client";

import { useEffect, useRef, useState } from "react";
import type { MotionValue } from "framer-motion";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildBox, buildCheese, buildPizza } from "./pizza-model";
import { buildPreparation, buildOven } from "./pizza-preparation";
import { storyAt } from "./pizza-story";

export type StageState = {
  open: boolean;
  lift: boolean;
  spread: boolean;
  turn: number;
};
type Props = {
  state: StageState;
  progress: MotionValue<number>;
  reduced: boolean;
  label: string;
  onReady: (ready: boolean) => void;
  onInteract: () => void;
};

export default function PizzaStage({
  state,
  progress,
  reduced,
  label,
  onReady,
  onInteract,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const inputs = useRef({ state, reduced, onReady, onInteract });
  const invalidate = useRef<() => void>(() => {});
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    inputs.current = { state, reduced, onReady, onInteract };
    invalidate.current();
  }, [state, reduced, onReady, onInteract]);

  useEffect(() => {
    const element = root.current,
      surface = canvas.current;
    if (!element || !surface) return;
    const resources: { dispose(): void }[] = [];
    const keep = <T extends { dispose(): void }>(resource: T) => {
      resources.push(resource);
      return resource;
    };
    let renderer: THREE.WebGLRenderer | undefined;
    let resize: ResizeObserver | undefined,
      intersection: IntersectionObserver | undefined;
    let disposed = false,
      visible = true,
      frame = 0,
      last = 0,
      loaded = false;
    let removeProgress = () => {};
    let move = (_event: PointerEvent) => {},
      leave = () => {},
      visibility = () => {},
      contextLost = (_event: Event) => {};
    let down = (_event: PointerEvent) => {},
      up = (_event: PointerEvent) => {},
      cancel = () => {};
    const image = new window.Image();
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: surface,
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 0.95;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.VSMShadowMap;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
      const pmrem = keep(new THREE.PMREMGenerator(renderer));
      const room = new RoomEnvironment();
      const environment = keep(pmrem.fromScene(room, 0.04));
      room.dispose();
      scene.environment = environment.texture;
      scene.environmentIntensity = 0.45;
      scene.add(new THREE.AmbientLight(0xffffff, 0.3));
      const key = new THREE.DirectionalLight(0xfff8eb, 1.8);
      key.position.set(-4, 8, 5);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.left = -6;
      key.shadow.camera.right = 6;
      key.shadow.camera.top = 6;
      key.shadow.camera.bottom = -6;
      key.shadow.normalBias = 0.02;
      key.shadow.bias = -0.0002;
      key.shadow.radius = 4;
      key.shadow.blurSamples = 8;
      resources.push({ dispose: () => key.shadow.dispose() });
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 0.5);
      fill.position.set(5, 3, -4);
      scene.add(fill);
      const world = new THREE.Group();
      world.rotation.y = -0.32;
      scene.add(world);
      const box = buildBox({ keep });
      world.add(box.group);
      const food = new THREE.Group();
      food.position.y = 0.015;
      world.add(food);
      const preparation = buildPreparation({ keep }, () => request());
      food.add(preparation.group);
      const oven = buildOven({ keep });
      world.add(oven.group);
      const cheese = buildCheese({ keep });
      food.add(cheese.group);
      const floor = new THREE.Mesh(
        keep(new THREE.PlaneGeometry(50, 50)),
        keep(new THREE.ShadowMaterial({ opacity: 0.17, color: "#000000" })),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.9;
      floor.receiveShadow = true;
      scene.add(floor);
      let pizza: ReturnType<typeof buildPizza> | undefined;
      let opening = 0,
        lifting = 0,
        spreading = 0,
        rotation = -0.32,
        chapter = 0;
      let width = 1,
        height = 1;
      const pointer = new THREE.Vector2(),
        pointerTarget = new THREE.Vector2(),
        center = new THREE.Vector2();
      const raycaster = new THREE.Raycaster(),
        hitPoint = new THREE.Vector2();
      let touchStart: { x: number; y: number } | null = null;
      const look = new THREE.Vector3(0, 0.4, -0.3);
      const smooth = THREE.MathUtils.smoothstep;
      function render(time: number) {
        frame = 0;
        if (disposed || !renderer || !element) return;
        if (!visible || document.hidden) return;
        const { state: current, reduced: quiet } = inputs.current;
        const dt = Math.min(0.05, Math.max(0.001, (time - last) / 1000));
        if (
          last &&
          time - last < (width < 650 ? 1000 / 30 : 1000 / 40) &&
          !quiet
        ) {
          frame = requestAnimationFrame(render);
          return;
        }
        last = time;
        const raw = progress.get();
        const step = storyAt(raw);
        const { index, local } = step;
        const targetChapter = index === 0 ? 0 : 1;
        chapter = quiet
          ? targetChapter
          : THREE.MathUtils.damp(chapter, targetChapter, 6, dt);
        const openTarget = index === 5 ? 1 - smooth(local, 0.45, 0.98) : 1;
        const liftTarget = (index === 0 || index === 4) && current.lift ? 1 : 0;
        const spreadTarget =
          index === 4 && !current.lift ? smooth(local, 0.02, 0.35) : 0;
        const damp = (a: number, b: number) =>
          quiet ? b : THREE.MathUtils.damp(a, b, 5, dt);
        opening = damp(opening, openTarget);
        lifting = damp(lifting, liftTarget);
        spreading = damp(spreading, spreadTarget);
        rotation = damp(
          rotation,
          index === 3 ? -0.1 : -0.32 + (current.turn * Math.PI) / 2,
        );
        pointer.lerp(quiet ? center : pointerTarget, 0.07);
        world.rotation.y = rotation + pointer.x * 0.13;
        world.rotation.x = pointer.y * 0.035;
        world.rotation.z = quiet ? 0 : Math.sin(time * 0.00055) * 0.012;
        const mobile = window.innerWidth < 700;
        world.position.x = mobile ? (index === 0 ? 0.14 : 0) : chapter * 1.65;
        const sizeTarget =
          index === 0 ? 1.42 : index === 3 ? 1.06 : index === 5 ? 1.06 : 1.36;
        world.scale.setScalar(damp(world.scale.x, sizeTarget));
        world.position.y =
          (index === 1 || index === 2 ? 0.2 : -0.1) +
          (quiet ? 0 : Math.sin(time * 0.0008) * 0.025);
        box.hinge.rotation.x = -opening * 2.05;
        box.group.position.y = -0.3 * (1 - smooth(local, 0, 0.35));
        box.group.scale.setScalar(
          index === 5 ? Math.max(0.001, smooth(local, 0, 0.3)) : 0.001,
        );
        box.group.visible = index === 5;
        food.position.y =
          index === 5 ? 0.015 + 0.35 * (1 - smooth(local, 0, 0.4)) : 0.015;
        const entering = smooth(local, 0.05, 0.4),
          exiting = smooth(local, 0.66, 0.98);
        food.position.z = index === 3 ? -3.0 * entering * (1 - exiting) : 0;
        oven.group.visible = index === 3;
        oven.group.scale.setScalar(
          index === 3 ? 0.9 + 0.1 * smooth(local, 0, 0.12) : 0.001,
        );
        oven.light.intensity =
          index === 3 ? 8 + (quiet ? 0 : Math.sin(time * 0.002) * 0.8) : 0;
        const preparing =
          index === 1 || index === 2 || (index === 3 && local < 0.56);
        preparation.group.visible = preparing;
        if (preparing)
          preparation.update(
            index === 1 ? local : 1,
            index === 1 ? 0 : index === 2 ? local : 1,
            time,
            quiet,
          );
        const ovenCamera = index === 3 ? 1 : 0;
        const distance = camera.aspect < 1 ? 1.25 / camera.aspect : 1.08;
        camera.position
          .set(4.2, THREE.MathUtils.lerp(7.8, 4.3, ovenCamera), 8.6)
          .multiplyScalar(distance);
        look.set(0, index === 5 ? 1 : 0.35, index === 3 ? -1.1 : -0.15);
        camera.lookAt(look);
        if (pizza) {
          pizza.group.visible = !preparing;
          pizza.slices.forEach((slice, index) => {
            const home = slice.userData.home as THREE.Vector3;
            slice.position.copy(home).multiplyScalar(1 + spreading * 0.13);
            slice.position.y = spreading * Math.sin(index * 0.95) * 0.055;
            slice.rotation.set(0, 0, 0);
            if (index === 6) {
              slice.position.x -= lifting * 0.6;
              slice.position.z += lifting * 0.12;
              slice.position.y += lifting * 1.8;
              slice.rotation.z = lifting * 0.14;
              slice.rotation.x = lifting * 0.12;
            }
          });
          cheese.update(pizza.slices[6], lifting);
          cheese.group.visible = cheese.group.visible && !preparing;
        }
        renderer.render(scene, camera);
        element.dataset.frame = String(Math.round(time));
        element.dataset.lift = lifting.toFixed(2);
        element.dataset.open = opening.toFixed(2);
        element.dataset.spread = spreading.toFixed(2);
        element.dataset.phase = step.id;
        element.dataset.local = local.toFixed(3);
        if (loaded && element.dataset.ready !== "true") {
          element.dataset.ready = "true";
          setReady(true);
          inputs.current.onReady(true);
        }
        if (!quiet) frame = requestAnimationFrame(render);
      }
      function request() {
        if (!disposed && !frame && visible && !document.hidden)
          frame = requestAnimationFrame(render);
      }
      invalidate.current = request;
      image.onload = () => {
        if (disposed) return;
        pizza = buildPizza(image, { keep });
        food.add(pizza.group);
        element.dataset.triangles = String(9 * 42 * 42 * 2);
        loaded = true;
        request();
      };
      image.onerror = () => {
        if (!disposed) {
          setFailed(true);
          inputs.current.onReady(false);
        }
      };
      image.src = "/images/square-drop/pepperoni.webp";
      resize = new ResizeObserver(([entry]) => {
        width = entry.contentRect.width;
        height = entry.contentRect.height;
        if (!width || !height || !renderer) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        const distance =
          camera.aspect < 1
            ? 1.22 / camera.aspect
            : camera.aspect > 2.4
              ? 0.94
              : 1.04;
        camera.position.set(4.2, 7.8, 8.6).multiplyScalar(distance);
        camera.lookAt(look);
        camera.updateProjectionMatrix();
        request();
      });
      resize.observe(element);
      intersection = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) request();
      });
      intersection.observe(element);
      move = (event) => {
        const rect = element.getBoundingClientRect();
        pointerTarget.set(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          ((event.clientY - rect.top) / rect.height) * 2 - 1,
        );
        request();
      };
      leave = () => {
        pointerTarget.set(0, 0);
        request();
      };
      down = (event) => {
        touchStart = { x: event.clientX, y: event.clientY };
      };
      up = (event) => {
        if (!touchStart || !pizza) return;
        const distance = Math.hypot(
          event.clientX - touchStart.x,
          event.clientY - touchStart.y,
        );
        touchStart = null;
        if (distance > 9) return;
        const bounds = element.getBoundingClientRect();
        hitPoint.set(
          ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
          (-(event.clientY - bounds.top) / bounds.height) * 2 + 1,
        );
        raycaster.setFromCamera(hitPoint, camera);
        if (raycaster.intersectObject(pizza.group, true).length)
          inputs.current.onInteract();
      };
      cancel = () => {
        touchStart = null;
        pointerTarget.set(0, 0);
      };
      element.addEventListener("pointermove", move, { passive: true });
      element.addEventListener("pointerleave", leave);
      element.addEventListener("pointerdown", down, { passive: true });
      element.addEventListener("pointerup", up);
      element.addEventListener("pointercancel", cancel);
      visibility = () => {
        if (!document.hidden) request();
      };
      document.addEventListener("visibilitychange", visibility);
      removeProgress = progress.on("change", request);
      contextLost = (event) => {
        event.preventDefault();
        cancelAnimationFrame(frame);
        setFailed(true);
        inputs.current.onReady(false);
      };
      surface.addEventListener("webglcontextlost", contextLost);
      request();
    } catch {
      setFailed(true);
      inputs.current.onReady(false);
    }
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize?.disconnect();
      intersection?.disconnect();
      removeProgress();
      image.onload = null;
      image.onerror = null;
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", leave);
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointerup", up);
      element.removeEventListener("pointercancel", cancel);
      document.removeEventListener("visibilitychange", visibility);
      surface.removeEventListener("webglcontextlost", contextLost);
      invalidate.current = () => {};
      resources.forEach((resource) => resource.dispose());
      renderer?.dispose();
    };
  }, [progress]);

  return (
    <div
      ref={root}
      className="xp-stage"
      data-ready={ready}
      data-failed={failed}
    >
      <canvas ref={canvas} aria-label={label} role="img" />
      {(!ready || failed) && (
        <div className="xp-stage-fallback">
          <img src="/images/square-drop/pepperoni.webp" alt={label} />
        </div>
      )}
    </div>
  );
}
