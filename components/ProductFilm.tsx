"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import type { Copy } from "./appetite-content";

function useFilmPreferences() {
  const [preferences, setPreferences] = useState({ src: "", reduced: true });
  useEffect(() => {
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () =>
      setPreferences({
        src: matchMedia("(max-width: 760px)").matches
          ? "/media/first-bite-mobile.mp4"
          : "/media/first-bite-desktop.mp4",
        reduced: media.matches || Boolean(connection?.saveData),
      });
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return preferences;
}

export function HeroFilm({ copy }: { copy: Copy }) {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const inView = useInView(root, { amount: 0.15 });
  const { src, reduced } = useFilmPreferences();
  const userPaused = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const film = video.current;
    if (!film || !src) return;
    const update = () => {
      if (
        inView &&
        !document.hidden &&
        !reduced &&
        !userPaused.current &&
        !film.ended
      ) {
        void film.play().catch(() => setPlaying(false));
      } else film.pause();
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => {
      film.pause();
      document.removeEventListener("visibilitychange", update);
    };
  }, [inView, src, reduced]);

  function toggle() {
    const film = video.current;
    if (!film) return;
    if (!film.paused) {
      userPaused.current = true;
      film.pause();
    } else {
      userPaused.current = false;
      if (film.ended) film.currentTime = 0;
      void film.play().catch(() => setFailed(true));
    }
  }

  return (
    <div
      className="hero-film"
      ref={root}
      data-ready={ready}
      data-failed={failed}
    >
      {/* The poster stays behind the film, including on blocked autoplay or decode failure. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/media/first-bite-poster.webp"
        alt={copy.film}
        fetchPriority="high"
        className="film-poster"
      />
      <video
        ref={video}
        src={src || undefined}
        poster="/media/first-bite-poster.webp"
        muted={muted}
        playsInline
        preload="metadata"
        aria-label={copy.film}
        className={ready && !failed ? "film-ready" : ""}
        onLoadedData={() => setReady(true)}
        onError={() => setFailed(true)}
        onPlay={() => {
          setPlaying(true);
          setEnded(false);
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setEnded(true);
          setPlaying(false);
        }}
      />
      <div className="film-controls">
        <button
          type="button"
          className="film-button"
          onClick={toggle}
          disabled={failed}
          aria-label={ended ? copy.replay : playing ? copy.pause : copy.play}
          title={ended ? copy.replay : playing ? copy.pause : copy.play}
        >
          {ended ? (
            <RotateCcw size={17} />
          ) : playing ? (
            <Pause size={17} />
          ) : (
            <Play size={17} />
          )}
        </button>
        <button
          type="button"
          className="film-button"
          onClick={() => setMuted(!muted)}
          disabled={failed}
          aria-label={muted ? copy.unmute : copy.mute}
          title={muted ? copy.unmute : copy.mute}
        >
          {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>
      </div>
    </div>
  );
}

export function BiteFilm({ copy, reduced }: { copy: Copy; reduced: boolean }) {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const near = useInView(root, { margin: "400px 0px" });
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [manual, setManual] = useState<number | null>(null);
  const [value, setValue] = useState(0);
  const desired = useRef(0);
  const { scrollYProgress } = useScroll({
    target: root,
    offset: ["start start", "end end"],
  });

  function seek(progress: number) {
    const film = video.current;
    desired.current = Math.max(0, Math.min(1, progress));
    if (
      !film ||
      film.readyState < 1 ||
      film.seeking ||
      !Number.isFinite(film.duration)
    )
      return;
    const target = desired.current * Math.max(0, film.duration - 0.08);
    if (Math.abs(target - film.currentTime) > 0.035) film.currentTime = target;
  }

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (!reduced && manual === null) {
      seek(progress);
      setValue(Math.round(progress * 100));
    }
  });

  useEffect(() => {
    if (loaded && !reduced && manual === null) seek(scrollYProgress.get());
  }, [loaded, reduced, manual, scrollYProgress]);

  return (
    <section
      ref={root}
      className="bite-chapter"
      aria-labelledby="bite-title"
      data-reduced={reduced}
    >
      <div className="bite-sticky">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="film-poster"
          src="/media/first-bite-detail.webp"
          alt={copy.film}
          loading="lazy"
        />
        <video
          ref={video}
          src={
            near && (!reduced || manual !== null)
              ? "/media/first-bite-scrub.mp4"
              : undefined
          }
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          className={loaded && !failed ? "film-ready" : ""}
          onLoadedData={() => {
            setLoaded(true);
            seek(manual === null ? scrollYProgress.get() : manual / 100);
          }}
          onSeeked={() => seek(desired.current)}
          onError={() => setFailed(true)}
        />
        <div className="bite-copy">
          <span className="eyebrow">{copy.biteEyebrow}</span>
          <motion.h2 id="bite-title" initial={false} animate={{ opacity: 1 }}>
            {copy.biteTitle}
          </motion.h2>
          <p>{copy.biteNote}</p>
        </div>
        <div className="bite-bottom">
          <span aria-hidden="true">01 / 09</span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={value}
            aria-label={copy.biteControl}
            onChange={(event) => {
              const n = Number(event.target.value);
              setManual(n);
              setValue(n);
              seek(n / 100);
            }}
            onBlur={() => {
              if (!reduced) setManual(null);
            }}
          />
          <span aria-hidden="true">90pizza</span>
        </div>
      </div>
    </section>
  );
}
