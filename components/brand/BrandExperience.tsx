"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import {
  ArrowDown,
  ArrowDownRight,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  CornerDownRight,
  Grid3X3,
  Menu,
  Plus,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { copy, dimensionList, languagePaths, openingDate, pizzaDimensions, pizzas, type Filter, type Language } from "./content";
import "./brand.css";

const selectionKey = "90pizza:favorite:v1";

function LanguageSwitch({ language }: { language: Language }) {
  return (
    <div className="bp-language" role="group" aria-label={copy[language].language}>
      {(["ge", "en"] as const).map((value) => (
        <a key={value} href={languagePaths[value]} aria-current={language === value ? "page" : undefined} hrefLang={value === "ge" ? "ka" : "en"} lang={value === "ge" ? "ka" : "en"}>
          {value === "ge" ? "GE" : "EN"}
        </a>
      ))}
    </div>
  );
}

export default function BrandExperience({ language }: { language: Language }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [navOpen, setNavOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [split, setSplit] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const nineStage = useRef<HTMLDivElement>(null);
  const autoSplitPlayed = useRef(false);
  const manualSlices = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const navButton = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  const dx = useMotionValue(0);
  const dy = useMotionValue(0);
  const heroX = useSpring(dx, { stiffness: 70, damping: 24 });
  const heroY = useSpring(dy, { stiffness: 70, damping: 24 });
  const t = copy[language];
  const visiblePizzas = pizzas.filter((pizza) => filter === "all" || pizza.category === filter);
  const detail = pizzas.find((pizza) => pizza.id === detailId);
  const picked = pizzas.find((pizza) => pizza.id === pickedId);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(selectionKey);
      if (pizzas.some((pizza) => pizza.id === saved)) setPickedId(saved);
    } catch { /* Browsing without storage still supports a session favorite. */ }
  }, []);

  useEffect(() => {
    const elements = root.current?.querySelectorAll<HTMLElement>(".bp-reveal");
    if (!elements) return;
    const skip = reduced || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (skip || !("IntersectionObserver" in window)) {
      elements.forEach((element) => { element.dataset.revealState = "shown"; });
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).dataset.revealState = "shown";
        observer.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: "0px 0px -24px 0px" });
    // Only prepare offscreen content; the initial HTML and deep links stay visible.
    elements.forEach((element) => {
      if (element.dataset.revealState === "shown") return;
      if (element.getBoundingClientRect().top < window.innerHeight - 24) {
        element.dataset.revealState = "shown";
      } else {
        element.dataset.revealState = "pending";
        observer.observe(element);
      }
    });
    return () => observer.disconnect();
  }, [filter, reduced]);

  useEffect(() => {
    const element = nineStage.current;
    if (!element || autoSplitPlayed.current || manualSlices.current || reduced ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (manualSlices.current) { observer.disconnect(); return; }
      if (!entry.isIntersecting) return;
      autoSplitPlayed.current = true;
      setSplit(true);
      observer.disconnect();
    }, { threshold: .4 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [reduced]);

  useEffect(() => {
    if (!detailId || !dialog.current) return;
    const element = dialog.current;
    element.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = previous;
      opener.current?.focus({ preventScroll: true });
    };
  }, [detailId]);

  useEffect(() => {
    if (!navOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setNavOpen(false); navButton.current?.focus(); }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [navOpen]);

  function openPizza(id: string, element: HTMLButtonElement) {
    opener.current = element;
    setDetailId(id);
  }

  function choosePizza(id: string) {
    setPickedId(id);
    try { localStorage.setItem(selectionKey, id); } catch { /* Storage is optional. */ }
    setDetailId(null);
  }

  function chooseSliceMode(value: boolean) {
    manualSlices.current = true;
    setSplit(value);
  }

  return (
    <div ref={root} className="bp-root" data-language={language}>
      <a className="bp-skip" href="#menu">{t.skip}</a>
      <header className="bp-header">
        <a className="bp-brand" href="#home" aria-label="90pizza">
          <img src="/images/brand/logo.webp" alt="" width={34} height={34} />
          <span>90pizza</span>
        </a>
        <nav className="bp-desktop-nav" aria-label={t.navigation}>
          <a href="#menu">{t.menu}</a>
          <a href="#square">{t.format}</a>
          <a href="#delivery">{t.delivery}<ArrowUpRight size={15} /></a>
        </nav>
        <div className="bp-header-tools">
          <LanguageSwitch language={language} />
          <a className="bp-header-cta" href="#menu">{t.viewMenu}<ArrowUpRight size={17} /></a>
          <button className="bp-nav-toggle bp-icon" ref={navButton} title={navOpen ? t.closeNav : t.openNav} aria-label={navOpen ? t.closeNav : t.openNav} aria-expanded={navOpen} aria-controls="bp-mobile-nav" onClick={() => setNavOpen(!navOpen)}>
            {navOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
        {navOpen && (
          <nav id="bp-mobile-nav" className="bp-mobile-nav" aria-label={t.navigation}>
            {[["#menu", t.menu], ["#square", t.format], ["#delivery", t.delivery]].map(([href, title]) => (
              <a href={href} key={href} onClick={() => setNavOpen(false)}>{title}<ArrowUpRight size={21} /></a>
            ))}
          </nav>
        )}
      </header>

      <main>
        <section className="bp-hero" id="home" aria-label="90pizza" onPointerMove={(event) => {
          if (reduced || event.pointerType !== "mouse") return;
          const bounds = event.currentTarget.getBoundingClientRect();
          dx.set((event.clientX - bounds.left - bounds.width / 2) * .008);
          dy.set((event.clientY - bounds.top - bounds.height / 2) * .008);
        }} onPointerLeave={() => { dx.set(0); dy.set(0); }}>
          <motion.div className="bp-hero-image" style={{ x: reduced ? 0 : heroX, y: reduced ? 0 : heroY }}>
            <picture>
              <source media="(max-width: 700px)" srcSet="/images/brand/hero-mobile.webp" />
              <source media="(max-width: 1000px) and (max-aspect-ratio: 4/5)" srcSet="/images/brand/hero-mobile.webp" />
              <img src="/images/brand/hero-desktop-v2.webp" alt={t.heroAlt} width={1536} height={1024} fetchPriority="high" />
            </picture>
          </motion.div>
          <div className="bp-hero-content bp-container">
            <div className="bp-hero-topline">
              <span>{t.squarePizza}</span>
              <a className="bp-hero-opening" href="#delivery"><CalendarDays size={16} aria-hidden="true" /><span>{t.openingLabel}:</span> <time dateTime={openingDate}>{t.openingDateLabel}</time></a>
            </div>
            <motion.div className="bp-hero-copy" initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }}>
              <h1>90pizza</h1>
              <p className="bp-hero-slogan">{t.heroSlogan}</p>
              <p className="bp-hero-description">{t.heroText}</p>
            </motion.div>
            <a className="bp-action bp-hero-action" href="#menu">{t.chooseFlavor}<ArrowUpRight size={24} /></a>
            <a className="bp-hero-down bp-icon" href="#menu" title={t.viewMenu} aria-label={t.viewMenu}><ArrowDown size={23} /></a>
          </div>
        </section>

        <div className="bp-spec-strip">
          <span><CornerDownRight size={19} /><strong>90°</strong><span>{t.squarePizza}</span></span>
          <a className="bp-size-overview" href="#square"><strong>{pizzaDimensions.join(" / ")}</strong><span>{t.centimeters}</span></a>
          <span className="bp-slice-spec"><Grid3X3 size={18} /><span>{t.nineSlices}</span></span>
          <span className="bp-share-spec"><ArrowUpRight size={18} />{t.madeToShare}</span>
        </div>

        <section id="menu" className="bp-menu bp-section">
          <div className="bp-container">
            <div className="bp-menu-heading bp-reveal">
              <div><span className="bp-eyebrow">01 / {t.menuEyebrow}</span><h2>{t.menuTitle}</h2></div>
              <p>{t.menuText}</p>
            </div>
            <div className="bp-menu-toolbar">
              <div className="bp-filters" role="group" aria-label={t.menu}>
                {(["all", "meat", "vegetarian"] as const).map((value) => (
                  <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{t.filters[value]}<span>{value === "all" ? "06" : value === "meat" ? "02" : "04"}</span></button>
                ))}
              </div>
              <span className="bp-menu-format">{dimensionList} {t.centimeters}</span>
            </div>
            <div className="bp-pizza-grid" aria-live="polite">
              <AnimatePresence mode="popLayout" initial={false}>
                {visiblePizzas.map((pizza) => (
                  <motion.article key={pizza.id} className="bp-pizza" layout={!reduced} initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .24 }}>
                    <div className="bp-pizza-reveal bp-reveal">
                    <button className="bp-pizza-photo" onClick={(event) => openPizza(pizza.id, event.currentTarget)} aria-label={`${pizza[language].name}: ${t.details}`}>
                      <img src={pizza.image} alt={`${t.pizzaAlt} ${pizza[language].name}`} width={720} height={720} loading="lazy" decoding="async" />
                      <span className="bp-pizza-number">{pizza.number}</span>
                      {pickedId === pizza.id && <span className="bp-picked"><Check size={15} />{t.chosen}</span>}
                      <span className="bp-photo-open"><Plus size={23} /></span>
                    </button>
                    <div className="bp-pizza-title"><h3>{pizza[language].name}</h3><span className="bp-flavor-dot" style={{ background: pizza.color }} aria-hidden="true" /></div>
                    <p className="bp-pizza-mood">{pizza[language].mood}</p>
                    <p className="bp-ingredients">{pizza[language].ingredients}</p>
                    <button className="bp-text-action" onClick={(event) => openPizza(pizza.id, event.currentTarget)}>{t.details}<ArrowUpRight size={17} /></button>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>

        <section id="square" className="bp-square bp-section">
          <div className="bp-container bp-square-layout">
            <div className="bp-square-copy bp-reveal">
              <span className="bp-eyebrow">02 / {t.formatEyebrow}</span>
              <h2>{t.formatTitle}</h2>
              <p>{t.formatText}</p>
              <ul className="bp-format-sizes" aria-label={t.sizes}>
                {pizzaDimensions.map((size) => <li key={size}><strong>{size}</strong> <span>{t.centimeters}</span></li>)}
              </ul>
              <a className="bp-text-action" href="#menu">{t.chooseFlavor}<ArrowUpRight size={18} /></a>
            </div>
            <div className="bp-square-visual">
              <div className="bp-square-top"><span>{t.flavorLabel}</span><Grid3X3 size={19} /></div>
              <div ref={nineStage} className="bp-nine-stage" role="img" aria-label={t.formatAlt} data-split={split}>
                <div className="bp-nine-grid">
                  {Array.from({ length: 9 }, (_, index) => {
                    const x = index % 3, y = Math.floor(index / 3);
                    return <motion.div key={index} className="bp-slice" aria-hidden="true" style={{ backgroundPosition: `${x * 50}% ${y * 50}%` }} initial={false} animate={{ x: split ? (x - 1) * 13 : 0, y: split ? (y - 1) * 13 : 0, rotate: split ? (x - y) * .65 : 0 }} transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 110, damping: 17, delay: index * .018 }} />;
                  })}
                </div>
              </div>
              <div className="bp-square-bottom">
                <div className="bp-segmented" role="group" aria-label={t.format}>
                  <button aria-pressed={!split} onClick={() => chooseSliceMode(false)}>{t.whole}</button>
                  <button aria-pressed={split} onClick={() => chooseSliceMode(true)}><Grid3X3 size={15} />{t.slices}</button>
                </div>
                <span>3 × 3 = 9</span>
              </div>
              <p className="bp-square-caption">{t.formatFooter}</p>
            </div>
          </div>
        </section>

        <section className="bp-bite">
          <div className="bp-bite-image"><img src="/images/brand/pepperoni.webp" width={720} height={720} alt={t.biteAlt} loading="lazy" /></div>
          <div className="bp-bite-copy bp-reveal">
            <span className="bp-eyebrow">90° / {t.biteEyebrow}</span>
            <h2>{t.biteTitle}</h2>
            <p>{t.biteText}</p>
            <a className="bp-action bp-action-white" href="#menu">{t.chooseFlavor}<ArrowUpRight size={22} /></a>
          </div>
        </section>

        <section id="delivery" className="bp-delivery bp-section">
          <div className="bp-container bp-delivery-layout">
            <div className="bp-delivery-copy bp-reveal">
              <span className="bp-eyebrow">03 / {t.deliveryEyebrow}</span>
              <h2>{t.deliveryTitle}</h2>
              <p>{t.deliveryText}</p>
              <a className="bp-text-action" href="#menu">{picked ? t.change : t.deliveryAction}<ArrowUpRight size={19} /></a>
            </div>
            <div className="bp-delivery-options bp-reveal">
              {picked && <div className="bp-delivery-pick"><img src={picked.image} width={72} height={72} alt="" loading="lazy" /><div><span>{t.deliveryChoice}</span><strong>{picked[language].name}</strong></div><Check size={22} /></div>}
              <div className="bp-delivery-partner"><strong>Wolt</strong><span>{t.comingSoon}<Clock3 size={18} /></span></div>
              <div className="bp-delivery-partner"><strong>Glovo</strong><span>{t.comingSoon}<Clock3 size={18} /></span></div>
              <p className="bp-delivery-note">{t.deliveryNote}</p>
            </div>
          </div>
        </section>

        <section className="bp-faq bp-section">
          <div className="bp-container bp-faq-layout">
            <h2>{t.faq}<ArrowDownRight size={38} strokeWidth={1.4} /></h2>
            <div>{t.questions.map((item) => <details key={item.q}><summary>{item.q}<Plus size={21} /></summary><p>{item.a}</p></details>)}</div>
          </div>
        </section>
      </main>

      <footer className="bp-footer">
        <div className="bp-container">
          <div className="bp-footer-top"><p>{t.footerLine}</p><a className="bp-icon" href="#home" title={t.backToTop} aria-label={t.backToTop}><ArrowUp size={25} /></a></div>
          <div className="bp-footer-wordmark" aria-label="90pizza">90pizza<CornerDownRight strokeWidth={1.3} /></div>
          <div className="bp-footer-bottom"><a href={languagePaths[language]}>90pizza.ge</a><LanguageSwitch language={language} /></div>
          <p className="bp-prototype">{t.prototype}</p>
        </div>
      </footer>

      <div className="bp-mobile-dock">
        <span>{picked ? t.selected : t.threeSizes}<strong>{picked ? picked[language].name : t.nineSlices}</strong></span>
        <a href={picked ? "#delivery" : "#menu"}>{picked ? t.delivery : t.mobileAction}<ArrowUpRight size={20} /></a>
      </div>
      <div className="bp-selection-status" role="status" aria-live="polite">{picked ? `${picked[language].name}: ${t.selectedNotice}` : ""}</div>

      <dialog ref={dialog} className="bp-dialog" onCancel={() => setDetailId(null)} onClose={() => setDetailId(null)} aria-labelledby="bp-dialog-title" onClick={(event) => { if (event.target === event.currentTarget) setDetailId(null); }}>
        {detail && <div className="bp-dialog-inner">
          <img className="bp-dialog-image" src={detail.image} width={720} height={720} alt={`${t.pizzaAlt} ${detail[language].name}`} />
          <div className="bp-dialog-copy">
            <div className="bp-dialog-topline"><span>90pizza / {detail.number}</span><button className="bp-icon" title={t.close} aria-label={t.close} onClick={() => setDetailId(null)} autoFocus><X size={22} /></button></div>
            <span className="bp-eyebrow">{detail[language].mood}</span>
            <h2 id="bp-dialog-title">{detail[language].name}</h2>
            <p>{detail[language].ingredients}</p>
            <div className="bp-dialog-specs"><strong>{dimensionList} {t.centimeters}</strong><span>{t.nineSlices}</span></div>
            <button className="bp-action bp-action-red" onClick={() => choosePizza(detail.id)}>{pickedId === detail.id ? t.chosen : t.choose}{pickedId === detail.id ? <Check size={21} /> : <ArrowRight size={21} />}</button>
            <small>{t.orderNote}</small>
          </div>
        </div>}
      </dialog>
    </div>
  );
}
