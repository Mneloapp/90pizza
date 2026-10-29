"use client";

import { useEffect, useRef, useState } from "react";
import type { MotionValue } from "framer-motion";
import { RotateCw } from "lucide-react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

type Props = {
  progress: MotionValue<number>;
  reduced: boolean;
  label: string;
  rotateLabel: string;
};

export default function DeliveryBox({
  progress,
  reduced,
  label,
  rotateLabel,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const rotate = useRef<(() => void) | null>(null);
  const reducedRef = useRef(reduced);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);

  useEffect(() => {
    const element = root.current,
      surface = canvas.current;
    if (!element || !surface) return;
    let renderer: THREE.WebGLRenderer | undefined;
    let frame = 0,
      disposed = false,
      visible = false,
      extraTurn = 0,
      angle = -0.25;
    let lastTime = 0,
      hasRendered = false;
    const resources: { dispose(): void }[] = [];
    const keep = <T extends { dispose(): void }>(resource: T) => {
      resources.push(resource);
      return resource;
    };
    let resize: ResizeObserver | undefined,
      visibility: IntersectionObserver | undefined;
    let logo: HTMLImageElement | undefined;
    let removeProgress = () => {};
    let onVisibility = () => {};
    let onContextLost = (_event: Event) => {};
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: surface,
        antialias: true,
        powerPreference: "low-power",
      });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 1;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#f4f4f4");
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
      camera.position.set(4.8, 6.8, 7.8).multiplyScalar(0.68);
      camera.lookAt(0, 0.1, 0);
      const pmrem = keep(new THREE.PMREMGenerator(renderer));
      const room = new RoomEnvironment();
      const environment = keep(pmrem.fromScene(room, 0.04));
      room.dispose();
      scene.environment = environment.texture;
      scene.environmentIntensity = 0.55;
      scene.add(new THREE.AmbientLight(0xffffff, 1));
      const light = new THREE.DirectionalLight(0xffffff, 2);
      light.position.set(-3, 7, 4);
      light.castShadow = true;
      light.shadow.mapSize.set(1024, 1024);
      light.shadow.camera.left = -5;
      light.shadow.camera.right = 5;
      light.shadow.camera.top = 5;
      light.shadow.camera.bottom = -5;
      light.shadow.normalBias = 0.025;
      light.shadow.radius = 5;
      scene.add(light);
      const box = new THREE.Group();
      box.position.y = 0.32;
      scene.add(box);
      const red = keep(
        new THREE.MeshStandardMaterial({ color: "#d50c0c", roughness: 0.78 }),
      );
      const kraft = keep(
        new THREE.MeshStandardMaterial({ color: "#b98252", roughness: 1 }),
      );
      const body = new THREE.Mesh(
        keep(new RoundedBoxGeometry(3.5, 0.29, 3.5, 3, 0.025)),
        red,
      );
      body.castShadow = true;
      body.receiveShadow = true;
      box.add(body);
      const edge = new THREE.Mesh(
        keep(new THREE.BoxGeometry(3.485, 0.018, 3.485)),
        kraft,
      );
      edge.position.y = 0.062;
      box.add(edge);

      const artwork = document.createElement("canvas");
      artwork.width = artwork.height = 1024;
      const ctx = artwork.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      const texture = keep(new THREE.CanvasTexture(artwork));
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(
        4,
        renderer.capabilities.getMaxAnisotropy(),
      );
      const draw = () => {
        ctx.fillStyle = "#e01010";
        ctx.fillRect(0, 0, 1024, 1024);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.strokeRect(55, 55, 914, 914);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 184px Arial";
        ctx.textAlign = "center";
        ctx.fillText("90pizza", 512, 630);
        ctx.font = "24px Arial";
        ctx.fillText("PIZZA AT THE RIGHT ANGLE", 512, 695);
        ctx.font = "bold 30px Arial";
        ctx.fillText("30 × 30", 512, 890);
        if (logo?.complete && logo.naturalWidth) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(512, 340, 135, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(logo, 377, 205, 270, 270);
          ctx.restore();
        }
        texture.needsUpdate = true;
      };
      draw();
      logo = new window.Image();
      logo.onload = () => {
        if (!disposed) {
          draw();
          invalidate();
        }
      };
      logo.src = "/images/90pizza-logo.png";
      const lid = new THREE.Mesh(
        keep(new THREE.PlaneGeometry(3.46, 3.46)),
        keep(new THREE.MeshStandardMaterial({ map: texture, roughness: 0.88 })),
      );
      lid.rotation.x = -Math.PI / 2;
      lid.position.y = 0.146;
      box.add(lid);
      const floor = new THREE.Mesh(
        keep(new THREE.PlaneGeometry(200, 200)),
        keep(new THREE.ShadowMaterial({ color: "#272727", opacity: 0.18 })),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = 0;
      floor.receiveShadow = true;
      scene.add(floor);

      function render(time: number) {
        frame = 0;
        if (disposed || !renderer) return;
        const target =
          -0.25 +
          (reducedRef.current ? 0 : (progress.get() * Math.PI) / 2) +
          extraTurn;
        const dt = Math.min(0.05, (time - lastTime) / 1000 || 0.016);
        lastTime = time;
        angle = reducedRef.current
          ? target
          : THREE.MathUtils.damp(angle, target, 6, dt);
        box.rotation.y = angle;
        box.rotation.z = reducedRef.current
          ? 0
          : Math.sin(time * 0.0006) * 0.018;
        renderer.render(scene, camera);
        if (!hasRendered) {
          hasRendered = true;
          setReady(true);
        }
        if (visible && !document.hidden && !reducedRef.current)
          frame = requestAnimationFrame(render);
      }
      function invalidate() {
        if (!disposed && !frame) frame = requestAnimationFrame(render);
      }
      rotate.current = () => {
        extraTurn += Math.PI / 2;
        invalidate();
      };
      resize = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        if (!width || !height || !renderer) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.position
          .set(4.8, 6.8, 7.8)
          .multiplyScalar(camera.aspect < 1.1 ? 0.92 : 0.7);
        camera.lookAt(0, 0.1, 0);
        camera.updateProjectionMatrix();
        invalidate();
      });
      resize.observe(element);
      visibility = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          if (visible) invalidate();
        },
        { rootMargin: "80px" },
      );
      visibility.observe(element);
      removeProgress = progress.on("change", () => {
        if (!reducedRef.current) invalidate();
      });
      onVisibility = () => {
        if (!document.hidden) invalidate();
      };
      document.addEventListener("visibilitychange", onVisibility);
      onContextLost = (event) => {
        event.preventDefault();
        cancelAnimationFrame(frame);
        setFailed(true);
      };
      surface.addEventListener("webglcontextlost", onContextLost);
    } catch {
      setFailed(true);
    }
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize?.disconnect();
      visibility?.disconnect();
      removeProgress();
      document.removeEventListener("visibilitychange", onVisibility);
      surface.removeEventListener("webglcontextlost", onContextLost);
      if (logo) logo.onload = null;
      rotate.current = null;
      resources.forEach((r) => r.dispose());
      renderer?.dispose();
    };
  }, [progress]);

  return (
    <div
      className="delivery-box"
      ref={root}
      data-ready={ready}
      data-failed={failed}
    >
      <canvas ref={canvas} role="img" aria-label={label} />
      {(!ready || failed) && (
        <div className="box-fallback" aria-hidden="true">
          <span>90pizza</span>
          <small>30×30</small>
        </div>
      )}
      <button
        type="button"
        className="icon-button box-turn"
        onClick={() => rotate.current?.()}
        disabled={!ready || failed}
        aria-label={rotateLabel}
        title={rotateLabel}
      >
        <RotateCw size={21} />
      </button>
    </div>
  );
}
