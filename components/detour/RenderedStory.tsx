"use client";

import { useEffect, useRef, type RefObject } from "react";
import { ATELIER_DURATION } from "./atelier-timeline";

const FRAME_COUNT = 360;
const LAST = FRAME_COUNT - 1;
const FRAME_ROOT = '/images/handless-v2';
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
type Props = { progress: RefObject<number>; paused: boolean; replay: number; reduced: boolean; saveData: boolean; label: string };

export default function RenderedStory(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef(props); live.current = props;

  useEffect(() => {
    const element = host.current, surface = canvas.current;
    if (!element || !surface) return;
    const mount: HTMLDivElement = element;
    const ctx = surface.getContext("2d", { alpha: false });
    if (!ctx) { mount.dataset.state = "fallback"; return; }
    let disposed = false, visible = true, frame = 0, current = 0, target = 0, painted = -1;
    let width = 1, height = 1, pixelRatio = 1, intro = 0, replay = live.current.replay;
    let last = performance.now(), direction = 1;
    const mobile = matchMedia("(max-width: 767px)").matches;
    const cache = new Map<number, HTMLImageElement>();
    const loading = new Map<number, HTMLImageElement>();
    const failed = new Set<number>();
    let wanted: number[] = [];

    function paint(index: number) {
      const img = cache.get(index);
      if (!img || !ctx || disposed) return;
      if (live.current.paused && painted >= 0 && index !== painted) return;
      painted = index;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.fillStyle = "#101410"; ctx.fillRect(0, 0, width, height);
      const compact = width < 768;
      const shortPhone = compact && height < 700;
      const aspect = img.naturalWidth / img.naturalHeight;
      const settledWidth = compact ? Math.min(width * 1.06, height * (shortPhone ? .46 : .54)) : Math.min(width * .78, (height - 110) * aspect);
      const coverWidth = Math.max(width, height * aspect);
      const q = clamp((index / LAST * ATELIER_DURATION - 1.4) / 3.1, 0, 1);
      const settle = q * q * (3 - 2 * q);
      const w = coverWidth + (settledWidth - coverWidth) * settle;
      const h = w / aspect;
      const settledX = compact ? (width - settledWidth) / 2 : width - settledWidth;
      const x = (width - coverWidth) / 2 * (1 - settle) + settledX * settle;
      const centerY = height * (.5 + (compact ? (shortPhone ? .06 : .09) : .03) * settle);
      const y = centerY - h / 2;
      ctx.drawImage(img, x, y, w, h);
      // Feather the stage edges into the page; the product stays unframed.
      const edge = Math.max(.01, (compact ? 24 : 80) * settle);
      const verticalEdge = Math.min(edge, 32);
      for (const [x0, y0, x1, y1, rx, ry, rw, rh] of [
        [x, y, x + edge, y, x, y, edge, h],
        [x + w, y, x + w - edge, y, x + w - edge, y, edge, h],
        [x, y, x, y + verticalEdge, x, y, w, verticalEdge],
        [x, y + h, x, y + h - verticalEdge, x, y + h - verticalEdge, w, verticalEdge],
      ]) {
        const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
        gradient.addColorStop(0, "#101410"); gradient.addColorStop(1, "#10141000");
        ctx.fillStyle = gradient; ctx.fillRect(rx, ry, rw, rh);
      }
      mount.dataset.state = "ready";
      mount.dataset.frame = String(index);
      mount.dataset.time = (index / LAST * ATELIER_DURATION).toFixed(3);
    }

    function evict() {
      while (cache.size > 14) {
        let farthest = -1, distance = -1;
        for (const i of cache.keys()) if (Math.abs(i - target) > distance && i !== painted) { farthest = i; distance = Math.abs(i - target); }
        if (farthest < 0) break;
        cache.delete(farthest);
      }
    }

    function paintNearest() {
      let nearest = painted, distance = painted < 0 ? Infinity : Math.abs(painted - target);
      for (const index of cache.keys()) {
        if (Math.abs(index - target) < distance) { nearest = index; distance = Math.abs(index - target); }
      }
      if (nearest >= 0 && nearest !== painted) paint(nearest);
    }

    function pump() {
      if (disposed) return;
      for (const index of wanted) {
        if (loading.size >= (live.current.saveData ? 1 : 3)) break;
        if (cache.has(index) || loading.has(index) || failed.has(index)) continue;
        const img = new Image(); loading.set(index, img);
        img.decoding = "async";
        img.onload = async () => {
          try { await img.decode(); } catch { /* onload already provides a drawable image. */ }
          loading.delete(index);
          if (disposed) return;
          cache.set(index, img); evict();
          paintNearest();
          pump();
        };
        img.onerror = () => {
          loading.delete(index); failed.add(index);
          if (painted < 0) mount!.dataset.state = "fallback";
          pump();
        };
        img.src = `${FRAME_ROOT}/${mobile ? "mobile" : "desktop"}/${String(index).padStart(4, "0")}.webp`;
      }
    }

    function request(index: number) {
      target = clamp(index, 0, LAST);
      wanted = [target];
      for (let i = 1; i <= (live.current.saveData ? 1 : 9); i++) wanted.push(clamp(target + i * direction, 0, LAST));
      for (let i = 1; i <= (live.current.saveData ? 0 : 3); i++) wanted.push(clamp(target - i * direction, 0, LAST));
      wanted = [...new Set(wanted)];
      paintNearest();
      pump();
    }

    const resize = new ResizeObserver(() => {
      width = mount.clientWidth; height = mount.clientHeight;
      pixelRatio = Math.min(devicePixelRatio, mobile ? 1.5 : 1.75);
      surface.width = Math.round(width * pixelRatio); surface.height = Math.round(height * pixelRatio);
      if (painted >= 0) paint(painted);
    });
    resize.observe(mount);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    intersection.observe(mount);
    request(0);
    function tick(now: number) {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (!visible || document.hidden) return;
      const p = live.current;
      if (replay !== p.replay) { replay = p.replay; intro = 0; current = 0; request(0); }
      if (p.paused) return;
      if (!p.reduced && !p.saveData && p.progress.current < .004 && painted >= 0) intro = Math.min(3.1, intro + dt);
      if (p.progress.current > .08) intro = 0;
      const desired = Math.max(intro, p.progress.current * ATELIER_DURATION) / ATELIER_DURATION * LAST;
      direction = desired >= current ? 1 : -1;
      current = p.reduced ? desired : current + (desired - current) * (1 - Math.exp(-18 * dt));
      const index = clamp(Math.round(current), 0, LAST);
      if (index !== target) request(index);
      mount.dataset.progress = (current / LAST).toFixed(5);
      mount.dataset.cache = String(cache.size);
    }
    frame = requestAnimationFrame(tick);
    return () => {
      disposed = true; cancelAnimationFrame(frame); resize.disconnect(); intersection.disconnect();
      loading.forEach((img) => { img.onload = img.onerror = null; img.src = ""; });
      cache.clear(); loading.clear();
    };
  }, []);

  return <div ref={host} className="dt-canvas dt-rendered-story" data-state="loading" role="img" aria-label={props.label}>
    <img className="dt-scene-fallback" src={`${FRAME_ROOT}/poster.webp`} alt="" />
    <canvas ref={canvas} aria-hidden="true" />
  </div>;
}
