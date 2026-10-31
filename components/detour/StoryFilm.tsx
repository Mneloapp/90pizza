"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export const STORY_VIDEO = "https://d2ol7oe51mr4n9.cloudfront.net/user_3JSigfTotkxyaCMqXUGhwOyS6kk/22aab3f5-6ae0-41a9-aaf0-a842188e30bb.mp4";
const MOBILE_VIDEO = "https://d2ol7oe51mr4n9.cloudfront.net/user_3JSigfTotkxyaCMqXUGhwOyS6kk/f93af991-0c34-4bc6-8046-71200e9b3de6.mp4";
const POSTER = "https://d2ol7oe51mr4n9.cloudfront.net/user_3JSigfTotkxyaCMqXUGhwOyS6kk/bd098f05-0475-406e-8e73-74d12994028c.jpg";

export const filmStops = [0, 2.6 / (820 / 24), 6.8 / (820 / 24), 279 / 820, 423 / 820, 630 / 820, 1];
export const filmTargets = [0, 5 / (820 / 24), 9 / (820 / 24), 14.8 / (820 / 24), 24 / (820 / 24), 0.998];
export function filmChapter(p: number) {
  for (let i = filmStops.length - 2; i >= 0; i--) if (p >= filmStops[i]) return i;
  return 0;
}

export default function StoryFilm({ progress, paused, replay, reduced, saveData, label }: {
  progress: RefObject<number>;
  paused: boolean;
  replay: number;
  reduced: boolean;
  saveData: boolean;
  label: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState("");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const intro = useRef(false);
  const introHold = useRef(0);
  const initialAttempt = useRef(false);

  useEffect(() => {
    setSrc(matchMedia("(pointer: coarse)").matches || innerWidth < 768 ? MOBILE_VIDEO : STORY_VIDEO);
  }, []);

  useEffect(() => {
    if (!replay || !video.current) return;
    initialAttempt.current = false;
    intro.current = false;
    introHold.current = 0;
    video.current.currentTime = 0;
  }, [replay]);

  useEffect(() => {
    const film = video.current;
    if (!film || !src) return;
    let frame = 0;
    let visible = true;
    let disposed = false;
    let lastProgress = -1;
    const seek = () => {
      if (disposed || paused || intro.current || !visible || document.hidden || film.readyState < 1 || film.seeking) return;
      const p = Math.max(0, Math.min(1, progress.current));
      let target = p * Math.max(0, film.duration - 1 / 24);
      if (introHold.current && target < introHold.current) target = introHold.current;
      else introHold.current = 0;
      // Only one seek is in flight; seeked consumes the latest scroll position.
      if (Number.isFinite(target) && Math.abs(film.currentTime - target) > 1 / 24) film.currentTime = target;
    };
    const tick = () => {
      const p = progress.current;
      if (p !== lastProgress) {
        if (intro.current && p > 0.006) {
          intro.current = false;
          introHold.current = film.currentTime;
          film.pause();
        }
        lastProgress = p;
        seek();
      }
      frame = requestAnimationFrame(tick);
    };
    const loaded = () => {
      setReady(true);
      if (!initialAttempt.current && !paused && !reduced && !saveData && progress.current < 0.006) {
        initialAttempt.current = true;
        intro.current = true;
        void film.play().catch(() => { intro.current = false; });
      } else seek();
    };
    const time = () => {
      if (intro.current && film.currentTime >= 2.6) {
        intro.current = false;
        introHold.current = film.currentTime;
        film.pause();
        // Hold the flour opening until the next intentional scroll.
        lastProgress = progress.current;
      }
    };
    const visibility = () => {
      if (document.hidden) film.pause();
      else if (intro.current && !paused) void film.play().catch(() => { intro.current = false; });
      else seek();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) film.pause();
      else if (intro.current && !paused && !document.hidden) void film.play().catch(() => { intro.current = false; });
      else seek();
    });
    observer.observe(film);
    film.addEventListener("loadeddata", loaded);
    film.addEventListener("timeupdate", time);
    film.addEventListener("seeked", seek);
    document.addEventListener("visibilitychange", visibility);
    if (paused) film.pause();
    else if (intro.current) void film.play().catch(() => { intro.current = false; });
    if (film.readyState >= 2) loaded();
    tick();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      film.pause();
      film.removeEventListener("loadeddata", loaded);
      film.removeEventListener("timeupdate", time);
      film.removeEventListener("seeked", seek);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [src, paused, reduced, saveData, progress, replay]);

  return (
    <div className="dt-film" data-ready={ready} data-failed={failed} data-film="v2-release">
      <img src={POSTER} alt="" className="dt-film-poster" />
      <video ref={video} src={src || undefined} poster={POSTER} muted playsInline preload={saveData ? "metadata" : "auto"}
        aria-label={label} onError={() => setFailed(true)} />
    </div>
  );
}
