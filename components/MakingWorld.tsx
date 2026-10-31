"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Hand,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import type { ExperienceCopy } from "./experience-content";
import type { StageState } from "./PizzaStage";
import { storyAt, storyIds, storyStops, storyTarget } from "./pizza-story";

const PizzaStage = dynamic(() => import("./PizzaStage"), { ssr: false });

export default function MakingWorld({
  copy,
  reduced,
}: {
  copy: ExperienceCopy;
  reduced: boolean;
}) {
  const root = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: root,
    offset: ["start start", "end end"],
  });
  const [chapter, setChapter] = useState(0);
  const colorStops = [0.12, 0.19, 0.3, 0.34, 0.49, 0.54, 0.82, 0.87];
  const backgroundColor = useTransform(scrollYProgress, colorStops, [
    "#111111",
    "#eeedeb",
    "#eeedeb",
    "#c21411",
    "#c21411",
    "#111111",
    "#111111",
    "#e01010",
  ]);
  // Crossfading black and white text makes it disappear at a mid-gray background.
  const color = useTransform(backgroundColor, (background) => {
    const channels = background.startsWith("#")
      ? [1, 3, 5].map((i) => parseInt(background.slice(i, i + 2), 16))
      : (background.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    const linear = channels.map((value) => {
      const channel = value / 255;
      return channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
    });
    const luminance =
      linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    return luminance > 0.183 ? "#050505" : "#ffffff";
  });
  const currentChapter = useRef(0);
  const [ready, setReady] = useState(false);
  const [introReady, setIntroReady] = useState(false);
  const [state, setState] = useState<StageState>({
    open: true,
    lift: false,
    spread: false,
    turn: 0,
    pour: 0,
  });
  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const next = storyAt(progress).index;
    if (next !== currentChapter.current) {
      currentChapter.current = next;
      setChapter(next);
      setState((value) => ({
        ...value,
        open: true,
        lift: false,
        spread: false,
        turn: 0,
      }));
    }
  });
  const lift = useCallback(() => {
    if (currentChapter.current !== 4) return;
    setState((value) => ({ ...value, lift: !value.lift }));
  }, []);
  function go(index: number) {
    const node = root.current;
    if (!node) return;
    const span = node.offsetHeight - window.innerHeight;
    const y =
      node.getBoundingClientRect().top +
      window.scrollY +
      storyTarget(index) * span;
    window.scrollTo({ top: y, behavior: reduced ? "instant" : "smooth" });
  }
  const step = chapter ? copy.making.stages[chapter - 1] : null;
  return (
    <section
      ref={root}
      className="xp-world xp-journey"
      id="top"
      aria-labelledby="xp-title"
    >
      <motion.div
        className="xp-world-sticky"
        style={{ backgroundColor, color }}
        data-chapter={storyIds[chapter]}
        data-intro-ready={introReady || reduced}
        data-scene-ready={ready}
      >
        <div className="xp-wordmark" aria-hidden={chapter !== 0}>
          <h1 id="xp-title">90pizza</h1>
        </div>
        <div className="xp-recipe-mark" aria-hidden="true">
          {chapter === 1 ? "30×30" : chapter === 4 ? "09" : `0${chapter}`}
        </div>
        <PizzaStage
          state={state}
          progress={scrollYProgress}
          reduced={reduced}
          label={copy.making.chapters}
          fallbackDough={chapter < 3}
          onReady={setReady}
          onIntroReady={setIntroReady}
          onInteract={lift}
        />
        <div
          className="xp-opening"
          inert={chapter !== 0 || (!introReady && !reduced)}
          aria-hidden={chapter !== 0 || (!introReady && !reduced)}
        >
          <div>
            <span className="xp-kicker">{copy.making.eyebrow}</span>
            <h2>{copy.making.title}</h2>
            <p>{copy.making.note}</p>
          </div>
          <button className="xp-button xp-button-red" onClick={() => go(1)}>
            {copy.making.begin}
            <ArrowDown size={21} />
          </button>
        </div>
        {step && (
          <motion.div
            key={chapter}
            className="xp-chapter-copy"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <span className="xp-kicker">
              0{chapter} / {step.label}
            </span>
            <h2>{step.title}</h2>
            <p>{step.note}</p>
            <span className="xp-process-detail">{step.detail}</span>
            {chapter === 4 && (
              <button
                className="xp-button xp-button-red"
                onClick={lift}
                disabled={!ready}
              >
                {state.lift ? copy.returnSlice : copy.takeSlice}
                <ArrowUpRight size={18} />
              </button>
            )}
            {chapter === 5 && (
              <a className="xp-button xp-button-white" href="#menu">
                {copy.choose}
                <ArrowUpRight size={19} />
              </a>
            )}
          </motion.div>
        )}
        <div
          className="xp-scene-controls"
          role="group"
          aria-label={copy.making.chapters}
        >
          {chapter === 0 && (
            <button
              className="xp-icon"
              disabled={!ready || reduced}
              onClick={() =>
                setState((value) => ({ ...value, pour: value.pour + 1 }))
              }
              aria-label={copy.making.replay}
              title={copy.making.replay}
            >
              <RotateCcw size={19} />
            </button>
          )}
          {chapter === 4 && (
            <button
              className="xp-icon"
              disabled={!ready}
              onClick={lift}
              aria-pressed={state.lift}
              aria-label={state.lift ? copy.lower : copy.lift}
              title={state.lift ? copy.lower : copy.lift}
            >
              <Hand size={19} />
            </button>
          )}
          {chapter !== 0 && chapter !== 3 && (
            <button
              className="xp-icon"
              disabled={!ready}
              onClick={() =>
                setState((value) => ({ ...value, turn: value.turn + 1 }))
              }
              aria-label={copy.rotate}
              title={copy.rotate}
            >
              <RotateCw size={19} />
            </button>
          )}
        </div>
        <div className="xp-making-bottom">
          <nav className="xp-chapters" aria-label={copy.making.chapters}>
            {copy.making.stages.map((item, index) => (
              <button
                key={index}
                type="button"
                aria-label={`${index + 1}. ${item.label}`}
                onClick={() => go(index + 1)}
                aria-current={chapter === index + 1 ? "step" : undefined}
              >
                <span>0{index + 1}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <button
            className="xp-next-step xp-icon"
            onClick={() =>
              chapter < 5
                ? go(chapter + 1)
                : document.getElementById("menu")?.scrollIntoView({
                    behavior: reduced ? "instant" : "smooth",
                  })
            }
            aria-label={chapter < 5 ? copy.making.next : copy.menu}
            title={chapter < 5 ? copy.making.next : copy.menu}
          >
            <ArrowRight size={22} />
          </button>
        </div>
        <motion.div
          className="xp-progress"
          style={{ scaleX: scrollYProgress }}
          aria-hidden="true"
        />
      </motion.div>
      <span
        id="geometry"
        className="xp-making-anchor"
        style={{ top: `${storyStops[1] * 100 + 5}%` }}
        aria-hidden="true"
      />
    </section>
  );
}
