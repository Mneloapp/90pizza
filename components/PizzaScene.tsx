"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as THREE from "three";

type Props = {
  src: string;
  alt: string;
  separated: boolean;
  reducedMotion: boolean;
};

function makeCrustTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const context = canvas.getContext("2d")!;
  const color = context.createLinearGradient(0, 0, 0, 64);
  color.addColorStop(0, "#e7b266");
  color.addColorStop(0.5, "#bf7435");
  color.addColorStop(1, "#6c3217");
  context.fillStyle = color;
  context.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 100; i++) {
    const x = (i * 73.13) % 256;
    const y = (i * 37.71) % 64;
    context.fillStyle = i % 3 ? "#572b164a" : "#ffdb9570";
    context.beginPath();
    context.ellipse(x, y, 1 + (i % 4), 1 + (i % 2), 0, 0, Math.PI * 2);
    context.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function PizzaScene({
  src,
  alt,
  separated,
  reducedMotion,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const separatedRef = useRef(separated);
  const requestRenderRef = useRef<(() => void) | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    separatedRef.current = separated;
    requestRenderRef.current?.();
  }, [separated]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    setReady(false);
    let stopped = false;
    let visible = true;
    let frame = 0;
    let loaded = false;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-4, 4, 3, -3, 0.1, 30);
    camera.position.set(0, -2.1, 10);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 2.1));
    const key = new THREE.DirectionalLight(0xfff4e4, 3);
    key.position.set(-3, 5, 8);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xe01010, 1.4);
    rim.position.set(4, -2, -1);
    scene.add(rim);

    const pizza = new THREE.Group();
    pizza.rotation.z = -0.14;
    scene.add(pizza);
    const geometry = new THREE.BoxGeometry(1.59, 1.59, 0.23);
    const crustTexture = makeCrustTexture();
    const side = new THREE.MeshStandardMaterial({
      map: crustTexture,
      roughness: 0.9,
    });
    const underside = new THREE.MeshStandardMaterial({
      color: 0x8f4b22,
      roughness: 1,
    });
    const textures: THREE.Texture[] = [];
    const materials: THREE.Material[] = [side, underside];
    const tiles: { mesh: THREE.Mesh; col: number; row: number }[] = [];

    const loader = new THREE.TextureLoader();
    const source = loader.load(src, (texture) => {
      if (stopped) {
        texture.dispose();
        return;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(
        renderer.capabilities.getMaxAnisotropy(),
        8,
      );
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const tileTexture = texture.clone();
          tileTexture.repeat.set(1 / 3, 1 / 3);
          tileTexture.offset.set(col / 3, (2 - row) / 3);
          tileTexture.needsUpdate = true;
          textures.push(tileTexture);
          // Keep the photograph's highlights; lights shape the real 3D crust.
          const top = new THREE.MeshBasicMaterial({ map: tileTexture });
          materials.push(top);
          const mesh = new THREE.Mesh(geometry, [
            side,
            side,
            side,
            side,
            top,
            underside,
          ]);
          mesh.position.set((col - 1) * 1.65, (1 - row) * 1.65, 0);
          pizza.add(mesh);
          tiles.push({ mesh, col, row });
        }
      }
      loaded = true;
      setReady(true);
      start();
    });

    const pointer = new THREE.Vector2(0, 0);
    const raycaster = new THREE.Raycaster();
    let hovering = false;
    let progress = 0;
    let startedAt = performance.now();
    let lastTime = 0;

    function resize() {
      if (!host) return;
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      const span = width < 600 ? 6.2 : 6.4;
      const aspect = width / height;
      camera.left = (-span * aspect) / 2;
      camera.right = (span * aspect) / 2;
      camera.top = span / 2;
      camera.bottom = -span / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      start();
    }

    function render(now: number) {
      frame = 0;
      if (stopped || !visible || document.hidden || !loaded) return;
      const elapsed = (now - startedAt) / 1000;
      const dt = Math.min((now - (lastTime || now)) / 1000, 0.05);
      lastTime = now;
      const damp = 1 - Math.exp(-dt * 7);
      progress += ((separatedRef.current ? 1 : 0) - progress) * damp;
      const enter = reducedMotion
        ? 1
        : 1 - Math.pow(1 - Math.min(elapsed / 1.5, 1), 3);
      const spread = progress * 0.38 + (1 - enter) * 0.75;
      pizza.rotation.x +=
        ((reducedMotion
          ? 0.04
          : pointer.y * 0.1 + Math.sin(elapsed * 0.5) * 0.025) -
          pizza.rotation.x) *
        damp;
      pizza.rotation.y +=
        ((reducedMotion ? 0 : pointer.x * 0.15) - pizza.rotation.y) * damp;
      pizza.rotation.z =
        -0.14 + (reducedMotion ? 0 : Math.sin(elapsed * 0.25) * 0.025);
      pizza.position.y = reducedMotion
        ? 0
        : Math.sin(elapsed * 0.8) * 0.055 - progress * 0.06;
      raycaster.setFromCamera(pointer, camera);
      const hit =
        hovering && !reducedMotion
          ? raycaster.intersectObjects(pizza.children)[0]?.object
          : null;
      tiles.forEach(({ mesh, col, row }, index) => {
        mesh.position.x = (col - 1) * (1.65 + spread);
        mesh.position.y = (1 - row) * (1.65 + spread);
        const lift =
          (hit === mesh ? 0.18 : 0) + (1 - enter) * (index % 3) * 0.2;
        mesh.position.z += (lift - mesh.position.z) * damp;
      });
      renderer.render(scene, camera);
      if (
        !reducedMotion ||
        Math.abs(progress - (separatedRef.current ? 1 : 0)) > 0.001
      )
        frame = requestAnimationFrame(render);
    }

    function start() {
      if (!frame && loaded && visible && !document.hidden) {
        lastTime = 0;
        frame = requestAnimationFrame(render);
      }
    }
    function move(event: PointerEvent) {
      const rect = host!.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      hovering = true;
      start();
    }
    function leave() {
      pointer.set(0, 0);
      hovering = false;
      start();
    }
    function visibility() {
      start();
    }
    requestRenderRef.current = start;
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
      },
      { rootMargin: "80px" },
    );
    observer.observe(host);
    host.addEventListener("pointermove", move, { passive: true });
    host.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", visibility);
    const onContextLost = (event: Event) => {
      event.preventDefault();
      setReady(false);
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    resize();

    return () => {
      stopped = true;
      requestRenderRef.current = null;
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener(
        "webglcontextlost",
        onContextLost,
      );
      geometry.dispose();
      crustTexture.dispose();
      source.dispose();
      textures.forEach((texture) => texture.dispose());
      materials.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [src, reducedMotion]);

  return (
    <div
      className="pizza-scene"
      ref={hostRef}
      data-ready={ready}
      role="img"
      aria-label={alt}
    >
      <div className={`scene-fallback ${ready ? "is-hidden" : ""}`}>
        <Image
          src={src}
          alt=""
          fill
          priority
          sizes="(max-width: 760px) 90vw, 650px"
        />
      </div>
    </div>
  );
}
