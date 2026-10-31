"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Menu,
  Pause,
  Play,
  RotateCw,
  RotateCcw,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { chapterFor, chapterTargets, clamp } from "./scene-math";
import { copy, flavors, type Language } from "./content";
import "./detour.css";

const Scene = dynamic(() => import("./DetourScene"), {
  ssr: false,
  loading: () => <div className="dt-scene-loading" aria-hidden="true" />,
});

function LanguageSwitch({
  language,
  onChange,
}: {
  language: Language;
  onChange: (language: Language) => void;
}) {
  return (
    <div
      className="dt-language"
      role="group"
      aria-label={copy[language].language}
    >
      {(["ge", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          aria-pressed={language === l}
          lang={l === "ge" ? "ka" : "en"}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default function DetourExperience() {
  const [language, setLanguage] = useState<Language>("ge");
  const progress = useRef(0);
  const progressLine = useRef<HTMLDivElement>(null);
  const [chapter, setChapter] = useState(0);
  const [turns, setTurns] = useState(0);
  const [replay, setReplay] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dataSaver, setDataSaver] = useState<boolean | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const story = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const chooseButton = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  const t = copy[language];
  const flavor = flavors[selected];
  const fallbackSrc =
    chapter < 5 ? "/images/detour/dough.webp" : "/images/detour/hero.webp";

  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = language === "ge" ? "ka" : "en";
    return () => {
      document.documentElement.lang = previous;
    };
  }, [language]);

  useEffect(() => {
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    setDataSaver(Boolean(connection?.saveData));
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!story.current) return;
      const rect = story.current.getBoundingClientRect();
      const distance = story.current.offsetHeight - window.innerHeight;
      progress.current = clamp(-rect.top / Math.max(distance, 1));
      if (progressLine.current)
        progressLine.current.style.transform = `scaleX(${progress.current})`;
      setChapter(chapterFor(progress.current));
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll);
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
    };
  }, []);

  useEffect(() => {
    if (!dialogOpen || !dialog.current) return;
    const el = dialog.current;
    el.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      el.close();
      document.body.style.overflow = overflow;
      requestAnimationFrame(() =>
        chooseButton.current?.focus({ preventScroll: true }),
      );
    };
  }, [dialogOpen]);

  useEffect(() => {
    if (!navOpen) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNavOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [navOpen]);

  const goToChapter = (index: number) => {
    if (!story.current) return;
    const top = window.scrollY + story.current.getBoundingClientRect().top;
    window.scrollTo({
      top:
        top +
        (story.current.offsetHeight - window.innerHeight) *
          chapterTargets[index],
      behavior: reduced ? "instant" : "smooth",
    });
  };

  return (
    <div className="dt-root" data-language={language}>
      <a className="dt-skip" href="#flavors">
        {t.skip}
      </a>
      <header className="dt-header">
        <a className="dt-brand" href="#top" aria-label="90pizza">
          <img src="/images/90pizza-logo.png" width="36" height="36" alt="" />
          <span>90pizza</span>
        </a>
        <nav className="dt-desktop-nav" aria-label={t.nav}>
          <a href="#top">{t.story}</a>
          <a href="#flavors">{t.menu}</a>
          <a href="#delivery">
            {t.delivery}
            <ArrowUpRight size={15} />
          </a>
        </nav>
        <div className="dt-header-actions">
          <LanguageSwitch language={language} onChange={setLanguage} />
          <button
            ref={menuButton}
            className="dt-menu-toggle dt-icon"
            aria-label={navOpen ? t.close : t.openNav}
            aria-expanded={navOpen}
            aria-controls="detour-mobile-nav"
            onClick={() => setNavOpen(!navOpen)}
          >
            {navOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
        {navOpen && (
          <nav
            id="detour-mobile-nav"
            className="dt-mobile-nav"
            aria-label={t.nav}
          >
            {[
              ["#top", t.story],
              ["#flavors", t.menu],
              ["#delivery", t.delivery],
            ].map(([href, name]) => (
              <a key={href} href={href} onClick={() => setNavOpen(false)}>
                {name}
                <ArrowUpRight size={18} />
              </a>
            ))}
          </nav>
        )}
      </header>

      <main id="top">
        <section ref={story} className="dt-story" aria-label={t.story}>
          <div className="dt-stage" data-chapter={chapter}>
            {dataSaver === null ? (
              <div className="dt-scene-loading" aria-hidden="true" />
            ) : dataSaver ? (
              <img
                className="dt-loading-scene"
                src={fallbackSrc}
                width="1500"
                height="1000"
                alt={t.scene}
              />
            ) : (
              <Scene
                progress={progress}
                turns={turns}
                replay={replay}
                paused={paused}
                reduced={Boolean(reduced)}
                fallbackSrc={fallbackSrc}
                label={t.scene}
              />
            )}
            <div className="dt-stage-top">
              <span className="dt-kicker">
                <span className="dt-tiny-angle" />
                {t.slogan}
              </span>
              <span className="dt-edition">TBILISI / 90°</span>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={chapter}
                className={`dt-story-copy ${chapter === 0 ? "dt-hero-copy" : ""}`}
                initial={{ opacity: 0, y: reduced ? 0 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduced ? 0 : -10 }}
                transition={{ duration: reduced ? 0 : 0.3 }}
              >
                {chapter === 0 ? (
                  <>
                    <h1>
                      90pizza<span aria-hidden="true">°</span>
                    </h1>
                    <p className="dt-hero-line">{t.hero}</p>
                  </>
                ) : (
                  <>
                    <span className="dt-chapter-label">
                      0{chapter + 1} / {t.chapters[chapter].label}
                    </span>
                    <h2>{t.chapters[chapter].title}</h2>
                    <p>{t.chapters[chapter].text}</p>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
            <div className="dt-stage-actions">
              {chapter === 0 ? (
                <button className="dt-primary" onClick={() => goToChapter(1)}>
                  {t.begin}
                  <ArrowDown size={20} />
                </button>
              ) : (
                <a href="#flavors" className="dt-primary">
                  {t.explore}
                  <ArrowUpRight size={20} />
                </a>
              )}
              {dataSaver === false && (
                <div className="dt-scene-tools">
                  <button
                    className="dt-icon"
                    title={chapter === 0 ? t.replay : t.rotate}
                    aria-label={chapter === 0 ? t.replay : t.rotate}
                    onClick={() => {
                      if (chapter === 0) {
                        goToChapter(0);
                        setPaused(false);
                        setReplay((n) => n + 1);
                      } else setTurns((n) => n + 1);
                    }}
                  >
                    {chapter === 0 ? (
                      <RotateCcw size={19} />
                    ) : (
                      <RotateCw size={19} />
                    )}
                  </button>
                  <button
                    className="dt-icon"
                    title={paused ? t.play : t.pause}
                    aria-label={paused ? t.play : t.pause}
                    aria-pressed={paused}
                    onClick={() => setPaused(!paused)}
                  >
                    {paused ? <Play size={18} /> : <Pause size={18} />}
                  </button>
                </div>
              )}
            </div>
            <div className="dt-story-rail">
              <div
                ref={progressLine}
                className="dt-story-track"
                style={{ transform: `scaleX(${progress.current})` }}
              />
              <span className="dt-follow">
                {t.scroll}
                <ArrowDown size={16} />
              </span>
              <nav aria-label={t.story}>
                {t.chapters.map((c, i) => (
                  <button
                    key={i}
                    aria-current={chapter === i ? "step" : undefined}
                    aria-label={c.label}
                    onClick={() => goToChapter(i)}
                  >
                    <span>0{i + 1}</span>
                    <span className="dt-rail-name">{c.label}</span>
                  </button>
                ))}
              </nav>
              <span className="dt-rail-end">{t.chapters[chapter].detail}</span>
            </div>
          </div>
        </section>

        <section
          className="dt-flavors"
          id="flavors"
          aria-labelledby="dt-flavors-title"
        >
          <div className="dt-section-heading">
            <span className="dt-kicker">{t.flavorEyebrow}</span>
            <h2 id="dt-flavors-title">{t.flavorTitle}</h2>
            <p>{t.flavorText}</p>
            <ArrowDownRight
              className="dt-heading-arrow"
              strokeWidth={1}
              aria-hidden="true"
            />
          </div>
          <div className="dt-flavor-layout">
            <div className="dt-flavor-visual">
              <div
                className="dt-flavor-photo"
                style={
                  { "--flavor-color": flavor.color } as React.CSSProperties
                }
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.img
                    key={flavor.id}
                    src={`/images/detour/${flavor.id}.webp`}
                    alt={`${flavor[language].name}, ${t.format}`}
                    width="1200"
                    height="1200"
                    loading="lazy"
                    initial={{
                      opacity: 0,
                      rotate: reduced ? 0 : -4,
                      scale: 0.96,
                    }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: reduced ? 0 : 4, scale: 0.96 }}
                    transition={{ duration: reduced ? 0 : 0.25 }}
                  />
                </AnimatePresence>
                <span className="dt-photo-number" aria-hidden="true">
                  0{selected + 1}
                </span>
              </div>
              <div className="dt-photo-caption">
                <span>{t.format}</span>
                <div>
                  <button
                    className="dt-icon"
                    aria-label={t.previous}
                    onClick={() => setSelected((selected + 5) % 6)}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    className="dt-icon"
                    aria-label={t.next}
                    onClick={() => setSelected((selected + 1) % 6)}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
            <div className="dt-flavor-list">
              <div role="group" aria-label={t.menu}>
                {flavors.map((f, i) => (
                  <button
                    className="dt-flavor-row"
                    key={f.id}
                    aria-pressed={selected === i}
                    onClick={() => setSelected(i)}
                  >
                    <span className="dt-flavor-index">0{i + 1}</span>
                    <span>
                      <strong>{f[language].name}</strong>
                      <small>{f[language].mood}</small>
                    </span>
                    {selected === i ? (
                      <ArrowUpRight size={24} />
                    ) : (
                      <span className="dt-flavor-dot" />
                    )}
                  </button>
                ))}
              </div>
              <div className="dt-flavor-detail" aria-live="polite">
                <span className="dt-kicker">{t.ingredients}</span>
                <p>{flavor[language].ingredients}</p>
              </div>
              <button
                ref={chooseButton}
                className="dt-primary dt-choose"
                onClick={() => setDialogOpen(true)}
              >
                {t.choose}
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </section>

        <section
          className="dt-delivery"
          id="delivery"
          aria-labelledby="dt-delivery-title"
        >
          <div className="dt-delivery-route" aria-hidden="true">
            <span />
            <ArrowDownRight strokeWidth={0.7} />
          </div>
          <div className="dt-delivery-content">
            <span className="dt-kicker">{t.deliveryEyebrow}</span>
            <h2 id="dt-delivery-title">{t.deliveryTitle}</h2>
            <p>{t.deliveryText}</p>
            <div className="dt-partners">
              <div>
                <strong>Wolt</strong>
                <span>{t.soon}</span>
              </div>
              <div>
                <strong>Glovo</strong>
                <span>{t.soon}</span>
              </div>
            </div>
            <small>{t.deliveryNote}</small>
          </div>
        </section>
      </main>

      <footer className="dt-footer">
        <div className="dt-footer-top">
          <span>{t.footer}</span>
          <a href="#top" className="dt-icon" title={t.top} aria-label={t.top}>
            <ArrowUp size={24} />
          </a>
        </div>
        <div className="dt-footer-wordmark" aria-hidden="true">
          90pizza<span>°</span>
        </div>
        <div className="dt-footer-bottom">
          <span>© {new Date().getFullYear()} 90pizza</span>
          <a href="https://90pizza.ge">
            90pizza.ge
            <ArrowUpRight size={14} />
          </a>
          <a href="https://90pizza.co">
            90pizza.co
            <ArrowUpRight size={14} />
          </a>
          <LanguageSwitch language={language} onChange={setLanguage} />
        </div>
        <p className="dt-prototype">{t.prototype}</p>
      </footer>

      <dialog
        ref={dialog}
        className="dt-dialog"
        aria-labelledby="dt-dialog-title"
        onCancel={(event) => {
          event.preventDefault();
          setDialogOpen(false);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLButtonElement>(
              "button:not([disabled])",
            ),
          );
          if (!controls.length) return;
          event.preventDefault();
          const index = controls.indexOf(
            document.activeElement as HTMLButtonElement,
          );
          controls[
            (index + (event.shiftKey ? -1 : 1) + controls.length) %
              controls.length
          ].focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const rect = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom
            )
              setDialogOpen(false);
          }
        }}
      >
        <button
          className="dt-icon dt-dialog-close"
          aria-label={t.close}
          onClick={() => setDialogOpen(false)}
          autoFocus
        >
          <X size={22} />
        </button>
        <img
          src={`/images/detour/${flavor.id}.webp`}
          width="180"
          height="180"
          alt={flavor[language].name}
        />
        <span className="dt-kicker">
          <Check size={15} />
          {t.chosen}
        </span>
        <h2 id="dt-dialog-title">{flavor[language].name}</h2>
        <p className="dt-dialog-lead">{t.soonTitle}</p>
        <p>{t.soonText}</p>
        <small>{t.allergens}</small>
        <button className="dt-primary" onClick={() => setDialogOpen(false)}>
          {t.back}
          <ArrowRight size={18} />
        </button>
      </dialog>
    </div>
  );
}
