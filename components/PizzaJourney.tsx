"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  MotionConfig,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Grid3X3,
  Minus,
  Plus,
  RotateCcw,
  ShoppingBag,
  X,
} from "lucide-react";
import { dropCopy, dropFlavors, type DropLanguage } from "./drop-content";
import { journeyCopy } from "./journey-content";

const World = dynamic(() => import("./JourneyWorld"), { ssr: false });

function Flavors({
  language,
  selected,
  onSelect,
}: {
  language: DropLanguage;
  selected: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div
      className="journey-flavors"
      role="radiogroup"
      aria-label={dropCopy[language].nav.flavors}
    >
      {dropFlavors.map((flavor, index) => (
        <button
          type="button"
          role="radio"
          aria-checked={selected === index}
          tabIndex={selected === index ? 0 : -1}
          key={flavor.id}
          onClick={() => onSelect(index)}
          onKeyDown={(event) => {
            if (
              ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(
                event.key,
              )
            ) {
              event.preventDefault();
              const next =
                (selected +
                  (event.key === "ArrowRight" || event.key === "ArrowDown"
                    ? 1
                    : 3)) %
                4;
              onSelect(next);
              (
                event.currentTarget.parentElement?.children[next] as HTMLElement
              )?.focus();
            }
          }}
        >
          <span className="flavor-thumb">
            <Image src={flavor.texture} alt="" fill sizes="56px" />
            {selected === index && <Check size={13} />}
          </span>
          <span>{dropCopy[language].tasting.items[index].name}</span>
        </button>
      ))}
    </div>
  );
}

function Selection({
  language,
  selected,
  quantity,
  changeQuantity,
  select,
  close,
}: {
  language: DropLanguage;
  selected: number;
  quantity: number;
  changeQuantity: (n: number) => void;
  select: (n: number) => void;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const t = dropCopy[language];
  useEffect(() => {
    const node = dialog.current!;
    const previous = document.body.style.overflow;
    node.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      node.close();
      document.body.style.overflow = previous;
    };
  }, []);
  return (
    <dialog
      className="journey-selection"
      ref={dialog}
      onClose={() => {
        if (!dialog.current?.open) close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      aria-labelledby="selection-heading"
    >
      <div className="drawer-top">
        <span>90pizza / 30×30</span>
        <button
          className="journey-icon"
          type="button"
          aria-label={t.close}
          onClick={close}
        >
          <X size={20} />
        </button>
      </div>
      <h2 id="selection-heading">{t.basket.title}</h2>
      <div className="drawer-photo">
        <Image
          src={dropFlavors[selected].texture}
          alt={t.tasting.items[selected].name}
          fill
          sizes="(max-width:600px) 90vw, 430px"
        />
      </div>
      <h3>{t.tasting.items[selected].name}</h3>
      <p className="drawer-description">
        {t.tasting.items[selected].description}
      </p>
      <Flavors language={language} selected={selected} onSelect={select} />
      <div className="drawer-spec">
        <span>{t.basket.size}</span>
        <span>{t.basket.slices}</span>
      </div>
      <div className="drawer-quantity">
        <span>{t.basket.quantity}</span>
        <div>
          <button
            type="button"
            className="journey-icon"
            disabled={quantity === 1}
            aria-label={t.basket.less}
            onClick={() => changeQuantity(quantity - 1)}
          >
            <Minus size={16} />
          </button>
          <output aria-live="polite">{quantity}</output>
          <button
            type="button"
            className="journey-icon"
            disabled={quantity === 9}
            aria-label={t.basket.more}
            onClick={() => changeQuantity(quantity + 1)}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      <div className="drawer-launch">
        <span />
        <strong>{journeyCopy[language].launch}</strong>
      </div>
      <p className="drawer-note">{t.basket.note}</p>
    </dialog>
  );
}

export default function PizzaJourney() {
  const journey = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(0);
  const [phase, setPhase] = useState(0);
  const [language, setLanguage] = useState<DropLanguage>("ge");
  const [selected, setSelected] = useState(0);
  const [split, setSplit] = useState(false);
  const [pull, setPull] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const reduced = Boolean(useReducedMotion());
  const { scrollYProgress } = useScroll({
    target: journey,
    offset: ["start start", "end end"],
  });
  const t = journeyCopy[language];
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = Math.max(0, Math.min(4, Math.round(value * 4)));
    if (next !== phaseRef.current) {
      phaseRef.current = next;
      setPhase(next);
    }
  });
  useEffect(() => {
    document.documentElement.lang = language === "ge" ? "ka" : "en";
  }, [language]);
  const jump = (index: number) =>
    document.getElementById("moment-" + index)?.scrollIntoView({
      block: "start",
      behavior: reduced ? "instant" : "smooth",
    });

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="journey-page"
        data-chapter={phase}
        data-light={phase === 4}
      >
        <a className="journey-skip" href="#moment-3">
          {t.skip}
        </a>
        <header className="journey-header">
          <a href="#moment-0" className="journey-logo" aria-label={t.home}>
            <Image
              src="/images/90pizza-logo.png"
              alt=""
              width={40}
              height={40}
              priority
            />
            <span>90pizza</span>
          </a>
          <nav className="journey-top-nav" aria-label={t.select}>
            <button type="button" onClick={() => jump(3)}>
              {t.select}
              <ArrowUpRight size={16} />
            </button>
          </nav>
          <div className="journey-header-actions">
            <div
              className="journey-languages"
              role="group"
              aria-label={t.language}
            >
              {(["ge", "en"] as const).map((lang) => (
                <button
                  type="button"
                  key={lang}
                  aria-pressed={lang === language}
                  onClick={() => setLanguage(lang)}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="journey-icon journey-bag"
              aria-label={t.order}
              onClick={() => setDrawer(true)}
            >
              <ShoppingBag size={19} />
              <span>{quantity}</span>
            </button>
          </div>
        </header>

        <main>
          <div className="journey-film" ref={journey}>
            <div className="journey-world-shell">
              <World
                progress={scrollYProgress}
                texture={dropFlavors[selected].texture}
                split={split}
                pull={pull}
                reduced={reduced}
                label={t.scene}
              />
            </div>
            <div className="journey-rail">
              {t.chapters.map((chapter, index) => (
                <section
                  className={"journey-chapter chapter-" + index}
                  id={"moment-" + index}
                  key={index}
                  aria-labelledby={"chapter-title-" + index}
                >
                  {index === 0 && (
                    <motion.h1
                      className="journey-wordmark"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1 }}
                    >
                      90pizza<span>°</span>
                    </motion.h1>
                  )}
                  {index === 2 && (
                    <span className="journey-measure" aria-hidden="true">
                      30×30
                    </span>
                  )}
                  {index === 3 && (
                    <span className="journey-nine" aria-hidden="true">
                      09
                    </span>
                  )}
                  <motion.div
                    className="chapter-copy"
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ amount: 0.15, once: false }}
                    transition={{ duration: 0.6 }}
                  >
                    <p className="chapter-eyebrow">
                      <span />0{index + 1} / {chapter.label}
                    </p>
                    <h2 id={"chapter-title-" + index}>{chapter.title}</h2>
                    <p className="chapter-body">{chapter.body}</p>
                    <p className="chapter-detail">{chapter.detail}</p>
                    {index === 0 && (
                      <div className="chapter-actions">
                        <button
                          type="button"
                          className="journey-cta"
                          onClick={() => jump(1)}
                        >
                          {t.enter}
                          <ArrowDown size={18} />
                        </button>
                        <button
                          type="button"
                          className="journey-text-link"
                          onClick={() => jump(3)}
                        >
                          {t.select}
                          <ArrowUpRight size={16} />
                        </button>
                      </div>
                    )}
                    {index === 3 && (
                      <>
                        <Flavors
                          language={language}
                          selected={selected}
                          onSelect={setSelected}
                        />
                        <div className="chapter-actions">
                          <button
                            type="button"
                            className="journey-cta"
                            onClick={() => setDrawer(true)}
                          >
                            {dropCopy[language].tasting.select}
                            <Plus size={18} />
                          </button>
                          <button
                            type="button"
                            className="journey-icon"
                            aria-label={
                              split ? t.chapters[3].join : t.chapters[3].split
                            }
                            title={
                              split ? t.chapters[3].join : t.chapters[3].split
                            }
                            aria-pressed={split}
                            onClick={() => setSplit(!split)}
                          >
                            <Grid3X3 size={20} />
                          </button>
                          <button
                            type="button"
                            className="journey-icon"
                            aria-pressed={pull}
                            aria-label={pull ? t.returnSlice : t.pullCheese}
                            title={pull ? t.returnSlice : t.pullCheese}
                            onClick={() => setPull(!pull)}
                          >
                            <ArrowUpRight size={20} />
                          </button>
                        </div>
                      </>
                    )}
                    {index === 4 && (
                      <>
                        <button
                          type="button"
                          className="journey-cta final-cta"
                          onClick={() => setDrawer(true)}
                        >
                          {t.select}
                          <ArrowUpRight size={20} />
                        </button>
                        <p className="chapter-availability">{t.launch}</p>
                      </>
                    )}
                  </motion.div>
                  {index > 0 && index < 3 && (
                    <button
                      className="journey-next journey-icon"
                      type="button"
                      aria-label={t.next}
                      title={t.next}
                      onClick={() => jump(index + 1)}
                    >
                      <ArrowDown size={20} />
                    </button>
                  )}
                </section>
              ))}
            </div>
          </div>
        </main>

        <nav className="journey-timeline" aria-label={t.scene}>
          <div className="timeline-label">
            <span>0{phase + 1}</span>
            <p aria-live="polite">{t.chapters[phase].label}</p>
            <span>/ 05</span>
          </div>
          <div className="timeline-stops">
            {t.chapters.map((chapter, index) => (
              <button
                type="button"
                aria-label={chapter.label}
                title={chapter.label}
                aria-current={phase === index ? "step" : undefined}
                key={chapter.label}
                onClick={() => jump(index)}
              >
                <span />
                <small>0{index + 1}</small>
              </button>
            ))}
          </div>
          <div className="timeline-arrows">
            <button
              className="journey-icon"
              type="button"
              aria-label={t.previous}
              disabled={phase === 0}
              onClick={() => jump(phase - 1)}
            >
              <ArrowLeft size={16} />
            </button>
            <button
              className="journey-icon"
              type="button"
              aria-label={phase === 4 ? t.back : t.next}
              onClick={() => jump(phase === 4 ? 0 : phase + 1)}
            >
              {phase === 4 ? <RotateCcw size={16} /> : <ArrowRight size={16} />}
            </button>
          </div>
          <div className="timeline-track">
            <motion.span style={{ scaleX: scrollYProgress }} />
          </div>
        </nav>
        <footer className="journey-footer">
          <span>{t.footer}</span>
          <span>30×30 / 9 / 90°</span>
          <button type="button" onClick={() => jump(0)}>
            {t.back}
            <RotateCcw size={14} />
          </button>
        </footer>
        {drawer && (
          <Selection
            language={language}
            selected={selected}
            quantity={quantity}
            changeQuantity={setQuantity}
            select={setSelected}
            close={() => setDrawer(false)}
          />
        )}
      </div>
    </MotionConfig>
  );
}
