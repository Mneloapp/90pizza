"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { MarchingCubes } from "three/addons/objects/MarchingCubes.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export type ProductPointer = { x: number; y: number; pressed: boolean };
type Props = {
  active: boolean;
  pointer: RefObject<ProductPointer>;
  onStatus: (available: boolean) => void;
};

export default function LiveCheese({ active, pointer, onStatus }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLCanvasElement>(null);
  const settings = useRef({ active, onStatus });
  useEffect(() => {
    settings.current = { active, onStatus };
  }, [active, onStatus]);

  useEffect(() => {
    const element = root.current,
      canvas = surface.current;
    if (!element || !canvas) return;
    let renderer: THREE.WebGLRenderer | undefined;
    let resize: ResizeObserver | undefined,
      observer: IntersectionObserver | undefined;
    let frame = 0,
      visible = false,
      disposed = false,
      failed = false,
      announced = false;
    let width = 1,
      height = 1,
      elapsed = 0,
      previous = 0,
      lastDraw = 0,
      energy = 0.16;
    const resources = new Set<{ dispose(): void }>();
    const keep = <T extends { dispose(): void }>(value: T) => {
      resources.add(value);
      return value;
    };
    const center = new THREE.Vector3();
    const pointerPosition = new THREE.Vector2();
    const pointerTarget = new THREE.Vector2();
    const shadowOffset = new THREE.Vector3(0.045, -0.09, -0.27);
    const cubicSize = 8;
    const subtract = 12;
    let viewWidth = 10;

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
    };
    let wake = () => {};
    const visibilityChanged = () => {
      if (document.hidden) stop();
      else wake();
    };
    const contextLost = (event: Event) => {
      event.preventDefault();
      failed = true;
      stop();
      element.dataset.failed = "true";
      settings.current.onStatus(false);
    };

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 0.95;
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 30);
      camera.position.z = 12;
      const pmrem = keep(new THREE.PMREMGenerator(renderer));
      const room = new RoomEnvironment();
      const environment = keep(pmrem.fromScene(room, 0.035));
      room.dispose();
      scene.environment = environment.texture;
      scene.environmentIntensity = 0.55;
      scene.add(new THREE.AmbientLight(0xffffff, 1.15));
      const key = new THREE.DirectionalLight(0xfffbef, 2.8);
      key.position.set(-4, 6, 7);
      scene.add(key);
      const light = new THREE.PointLight(0xffffff, 32, 25, 2);
      light.position.set(3, 1, 5);
      scene.add(light);
      const material = keep(
        new THREE.MeshPhysicalMaterial({
          color: "#fff0ce",
          roughness: 0.38,
          metalness: 0,
          clearcoat: 0.45,
          clearcoatRoughness: 0.2,
          sheen: 0.3,
          sheenColor: new THREE.Color("#fff8e7"),
          sheenRoughness: 0.55,
          vertexColors: true,
        }),
      );
      const smallDevice = matchMedia("(max-width: 760px)").matches;
      material.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader
          .replace(
            "#include <common>",
            "#include <common>\nvarying vec3 vCheeseSurface;",
          )
          .replace(
            "#include <begin_vertex>",
            "#include <begin_vertex>\nvCheeseSurface = position;",
          );
        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            "#include <common>\nvarying vec3 vCheeseSurface;",
          )
          .replace(
            "#include <color_fragment>",
            "#include <color_fragment>\nfloat cheeseGrain = fract(sin(dot(floor(vCheeseSurface.xy * 210.0), vec2(12.9898, 78.233))) * 43758.5453);\ndiffuseColor.rgb *= 0.965 + cheeseGrain * 0.035;",
          );
      };
      const fluid = new MarchingCubes(
        smallDevice ? 56 : 72,
        material,
        false,
        true,
        14000,
      );
      keep(fluid.geometry);
      fluid.isolation = 42;
      fluid.scale.setScalar(cubicSize / 2);
      fluid.frustumCulled = false;
      fluid.renderOrder = 2;
      scene.add(fluid);
      const shadowMaterial = keep(
        new THREE.MeshBasicMaterial({
          color: "#291400",
          transparent: true,
          opacity: 0.2,
          depthWrite: false,
        }),
      );
      const shadow = new THREE.Mesh(fluid.geometry, shadowMaterial);
      shadow.scale.copy(fluid.scale);
      shadow.frustumCulled = false;
      shadow.renderOrder = 1;
      scene.add(shadow);
      const cream = [
        new THREE.Color("#ffffff"),
        new THREE.Color("#fff5df"),
        new THREE.Color("#fffaf0"),
      ];

      function ball(x: number, y: number, z: number, radius: number, tint = 0) {
        const nx = ((x - 0.5) * viewWidth - center.x) / cubicSize + 0.5;
        const ny = ((0.5 - y) * 10 - center.y) / cubicSize + 0.5;
        const nz = z / cubicSize + 0.5;
        fluid.addBall(
          nx,
          ny,
          nz,
          (fluid.isolation + subtract) * (radius / cubicSize) ** 2,
          subtract,
          cream[tint],
        );
      }

      function render(time: number) {
        frame = 0;
        if (disposed || failed || !visible || document.hidden || !renderer || !element)
          return;
        const interval = 1000 / (smallDevice ? 20 : 24);
        if (time - lastDraw < interval) {
          frame = requestAnimationFrame(render);
          return;
        }
        const dt = previous ? Math.min(0.06, (time - previous) / 1000) : 0.016;
        previous = time;
        lastDraw = time;
        elapsed += dt;
        const intro =
          THREE.MathUtils.smoothstep(elapsed, 0.3, 1.8) *
          (1 - THREE.MathUtils.smoothstep(elapsed, 3, 6));
        const pressed = pointer.current.pressed;
        energy = THREE.MathUtils.damp(
          energy,
          settings.current.active || pressed ? 1 : 0.2 + intro * 0.6,
          3,
          dt,
        );
        pointerPosition.lerp(
          pointerTarget.set(pointer.current.x, pointer.current.y),
          1 - Math.exp(-dt * 6),
        );
        light.position.x = pointerPosition.x * viewWidth * 0.5;
        light.position.y = -pointerPosition.y * 3 + 2;
        fluid.reset();
        const mobile = width < 760;
        const left = mobile ? 0.98 - energy * 0.25 : 0.98 - energy * 0.28;
        const sourceY = height < 360 ? 0.42 : mobile ? 0.49 : 0.67;
        const span = 1.08 - left;
        // A joined isosurface forms the lip and unequal hanging drips, not separate wires.
        for (let i = 0; i <= 34; i++) {
          const s = i / 34;
          const x = left + s * span;
          const y =
            sourceY -
            s * 0.12 +
            Math.sin(s * Math.PI) * 0.025 +
            Math.sin(s * 7 + elapsed * 0.4) * 0.014;
          ball(
            x,
            y,
            Math.sin(s * 5) * 0.12,
            0.12 + energy * 0.1 + Math.sin(s * Math.PI) * 0.035,
            i % 3,
          );
          const depth = (0.018 + Math.pow(s, 0.7) * 0.12) * energy;
          const rows = Math.ceil(depth * 55);
          for (let row = 1; row <= rows; row++) {
            const f = row / rows;
            ball(
              x + Math.sin(f * 3 + s * 4) * 0.004,
              y - depth * f,
              Math.sin(s * 5 + f * 1.4) * 0.12,
              0.12 + energy * 0.045,
              (i + row) % 3,
            );
          }
        }
        for (let i = 0; i < 3; i++) {
          const position = [0.16, 0.59, 0.91][i];
          const startX = left + span * position;
          const startY =
            sourceY -
            position * 0.12 +
            Math.sin(position * Math.PI) * 0.025 +
            Math.sin(position * 7 + elapsed * 0.4) * 0.014;
          const cycle = (Math.sin(elapsed * 0.65 + i * 1.9) + 1) * 0.5;
          const length =
            (mobile ? [0.11, 0.25, 0.13][i] : [0.27, 0.18, 0.09][i]) *
            energy *
            (0.76 + cycle * 0.24);
          const steps = 20;
          for (let j = 1; j <= steps; j++) {
            const t = j / steps;
            const bend =
              Math.sin(t * 2.6 + i) * 0.012 * energy +
              pointerPosition.x * 0.028 * t * t;
            const y = startY + length * t + pointerPosition.y * 0.012 * t;
            const radius =
              (0.14 + energy * 0.09) *
                (1 - Math.sin(t * Math.PI * 0.7) * 0.56) +
              Math.pow(t, 12) * (0.05 + energy * 0.085);
            ball(startX + bend, y, 0.12 + Math.sin(t * 2) * 0.18, radius, i);
          }
        }
        fluid.update();
        fluid.position.copy(center);
        shadow.position.copy(center).add(shadowOffset);
        renderer.render(scene, camera);
        if (!announced && fluid.count > 0) {
          announced = true;
          element.dataset.ready = "true";
          settings.current.onStatus(true);
        }
        element.dataset.vertices = String(fluid.count);
        element.dataset.energy = energy.toFixed(3);
        element.dataset.frame = String(Math.round(elapsed * 24));
        frame = requestAnimationFrame(render);
      }
      wake = () => {
        if (!disposed && !failed && visible && !document.hidden && !frame)
          frame = requestAnimationFrame(render);
      };
      resize = new ResizeObserver(([entry]) => {
        width = entry.contentRect.width;
        height = entry.contentRect.height;
        if (!width || !height || !renderer) return;
        viewWidth = (width / height) * 10;
        camera.left = -viewWidth / 2;
        camera.right = viewWidth / 2;
        camera.updateProjectionMatrix();
        center.set(viewWidth / 2 - 3.8, -2, 0);
        renderer.setSize(width, height, false);
        wake();
      });
      resize.observe(element);
      observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) wake();
        else stop();
      });
      observer.observe(element);
      document.addEventListener("visibilitychange", visibilityChanged);
      canvas.addEventListener("webglcontextlost", contextLost);
    } catch {
      failed = true;
      element.dataset.failed = "true";
      settings.current.onStatus(false);
    }
    return () => {
      disposed = true;
      stop();
      resize?.disconnect();
      observer?.disconnect();
      document.removeEventListener("visibilitychange", visibilityChanged);
      canvas.removeEventListener("webglcontextlost", contextLost);
      resources.forEach((resource) => resource.dispose());
      renderer?.dispose();
    };
  }, [pointer]);

  return (
    <div ref={root} className="live-cheese" aria-hidden="true">
      <canvas ref={surface} />
    </div>
  );
}
