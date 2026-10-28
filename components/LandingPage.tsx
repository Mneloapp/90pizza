"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Bike,
  Box,
  Flame,
  Grid3X3,
  Leaf,
  Menu,
  Plus,
  Ruler,
  X,
} from "lucide-react";
import {
  pizzas,
  translations,
  type LandingCopy,
  type Language,
  type PizzaCategory,
} from "./landing-content";

const PizzaScene = dynamic(() => import("./PizzaScene"), {
  ssr: false,
  loading: () => (
    <div className="pizza-scene">
      <div className="scene-fallback">
        <Image
          src={pizzas[0].texture}
          alt=""
          fill
          priority
          sizes="(max-width: 760px) 90vw, 650px"
        />
      </div>
    </div>
  ),
});

function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function LanguageSwitcher({
  lang,
  onChange,
  label,
}: {
  lang: Language;
  onChange: (lang: Language) => void;
  label: string;
}) {
  return (
    <div className="language-switch" role="group" aria-label={label}>
      {(["ge", "en"] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={lang === value}
          onClick={() => onChange(value)}
        >
          {value === "ge" ? "GE" : "EN"}
        </button>
      ))}
    </div>
  );
}

function SliceStory({ t }: { t: LandingCopy }) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });
  const gap = useTransform(scrollYProgress, [0, 1], [25, 5]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-8, 0]);
  return (
    <section className="concept-section" id="story">
      <div className="section-inner concept-layout">
        <div className="concept-art" id="cut" ref={ref}>
          <div className="dimension-label dimension-top">
            <span />
            {t.concept.edge}
            <span />
          </div>
          <motion.div
            className="slice-photo-grid"
            style={reducedMotion ? undefined : { gap, rotate }}
            role="img"
            aria-label={t.concept.image}
          >
            {Array.from({ length: 9 }, (_, index) => (
              <div
                key={index}
                className="photo-slice"
                style={{
                  backgroundPosition: `${(index % 3) * 50}% ${Math.floor(index / 3) * 50}%`,
                }}
              />
            ))}
          </motion.div>
          <div className="concept-caption">
            <Grid3X3 size={16} />
            <span>{t.concept.note}</span>
            <span>3 × 3</span>
          </div>
        </div>
        <Reveal className="concept-copy">
          <p className="eyebrow">
            <span />
            {t.concept.eyebrow}
          </p>
          <h2>{t.concept.title}</h2>
          <p className="section-description">{t.concept.body}</p>
          <div className="concept-facts">
            <div>
              <strong>{t.concept.angle}</strong>
              <span>{t.concept.angleLabel}</span>
            </div>
            <div>
              <strong>30×30</strong>
              <span>{t.concept.sizeLabel}</span>
            </div>
            <div>
              <strong>9</strong>
              <span>{t.concept.slicesLabel}</span>
            </div>
          </div>
          <a className="text-link" href="#menu">
            {t.menuCta}
            <ArrowUpRight size={20} />
          </a>
        </Reveal>
      </div>
    </section>
  );
}

function ProductDialog({
  selected,
  onClose,
  t,
}: {
  selected: number | null;
  onClose: () => void;
  t: LandingCopy;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || selected === null) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [selected]);
  if (selected === null) return null;
  const pizza = pizzas[selected];
  const copy = t.menu.items[selected];
  const showDelivery = () => {
    onClose();
    document.getElementById("delivery")?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <dialog
      ref={ref}
      className="product-dialog"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-labelledby="pizza-dialog-title"
    >
      <div className="dialog-content">
        <button
          className="icon-button dialog-close"
          type="button"
          onClick={onClose}
          aria-label={t.close}
        >
          <X size={22} />
        </button>
        <div className="dialog-photo">
          <Image
            src={pizza.image}
            alt={copy.name}
            fill
            sizes="(max-width: 760px) 90vw, 460px"
          />
        </div>
        <div className="dialog-copy">
          <span className="pizza-tag">{copy.tag}</span>
          <h2 id="pizza-dialog-title">{copy.name}</h2>
          <p className="latin-name">{copy.latin}</p>
          <p className="dialog-ingredients">{copy.detail}</p>
          <div className="dialog-format">
            <Ruler size={18} />
            30×30 <span />
            <Grid3X3 size={18} />
            {t.nav.slices}
          </div>
          <p className="launch-note">{t.delivery.availability}</p>
          <button
            className="button button-red"
            type="button"
            onClick={showDelivery}
          >
            {t.deliveryCta}
            <ArrowUpRight size={18} />
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default function LandingPage() {
  const [lang, setLang] = useState<Language>("ge");
  const [activePizza, setActivePizza] = useState(0);
  const [separated, setSeparated] = useState(false);
  const [category, setCategory] = useState<PizzaCategory>("all");
  const [selected, setSelected] = useState<number | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const reducedMotion = useReducedMotion();
  const t = translations[lang];
  useEffect(() => {
    document.documentElement.lang = lang === "ge" ? "ka" : "en";
  }, [lang]);
  const nav = [
    { label: t.nav.concept, href: "#story" },
    { label: t.nav.slices, href: "#cut" },
    { label: t.nav.menu, href: "#menu" },
    { label: t.nav.delivery, href: "#delivery" },
  ];
  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#menu">
        {t.menuCta}
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#top" aria-label={t.home}>
            <Image
              src="/images/90pizza-logo.png"
              width={40}
              height={40}
              alt=""
              priority
            />
            <span>
              90pizza<span className="brand-dot">.</span>
            </span>
          </a>
          <nav className="desktop-nav" aria-label={t.openMenu}>
            {nav.map((link) => (
              <a href={link.href} key={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <LanguageSwitcher
              lang={lang}
              onChange={setLang}
              label={t.language}
            />
            <a href="#delivery" className="header-order">
              {t.order}
              <ArrowUpRight size={16} />
            </a>
            <button
              className="icon-button mobile-menu-button"
              type="button"
              aria-expanded={mobileMenu}
              aria-controls="mobile-navigation"
              onClick={() => setMobileMenu(!mobileMenu)}
              aria-label={mobileMenu ? t.close : t.openMenu}
            >
              {mobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobileMenu && (
            <motion.nav
              id="mobile-navigation"
              className="mobile-nav"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              {nav.map((link) => (
                <a
                  href={link.href}
                  key={link.href}
                  onClick={() => setMobileMenu(false)}
                >
                  {link.label}
                  <ArrowUpRight size={18} />
                </a>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main>
        <section className="hero" id="top">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-angle" aria-hidden="true">
            90<span>°</span>
          </div>
          <div className="hero-stage">
            <PizzaScene
              src={pizzas[activePizza].texture}
              alt={t.menu.items[activePizza].name}
              separated={separated}
              reducedMotion={Boolean(reducedMotion)}
            />
          </div>
          <div className="hero-inner section-inner">
            <div className="hero-copy">
              <motion.p
                className="eyebrow hero-eyebrow"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span />
                {t.hero.eyebrow}
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.9,
                  delay: 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                90pizza<span>.</span>
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h2 className="hero-slogan">{t.hero.slogan}</h2>
                <p className="hero-description">{t.hero.body}</p>
                <div className="hero-ctas">
                  <a href="#menu" className="button button-red">
                    {t.menuCta}
                    <ArrowUpRight size={20} />
                  </a>
                  <a href="#story" className="hero-story-link">
                    <ArrowDown size={18} />
                    30×30 / 9
                  </a>
                </div>
              </motion.div>
            </div>
            <div className="hero-product-caption">
              <span className="caption-index">0{activePizza + 1} / 06</span>
              <span>{t.menu.items[activePizza].latin}</span>
              <span className="small-angle" />
            </div>
            <div className="hero-bottom">
              <div className="hero-specs">
                {["90°", "30×30", "9"].map((value, index) => (
                  <div key={value}>
                    <strong>{value}</strong>
                    <span>{t.hero.stats[index]}</span>
                  </div>
                ))}
              </div>
              <div className="hero-flavors">
                <span className="flavor-label">{t.hero.select}</span>
                <div
                  className="flavor-choices"
                  role="group"
                  aria-label={t.hero.select}
                >
                  {pizzas.slice(0, 3).map((pizza, index) => (
                    <button
                      key={pizza.id}
                      type="button"
                      aria-pressed={activePizza === index}
                      onClick={() => setActivePizza(index)}
                      aria-label={t.menu.items[index].name}
                      title={t.menu.items[index].name}
                    >
                      <Image src={pizza.image} alt="" width={46} height={46} />
                    </button>
                  ))}
                  <button
                    type="button"
                    className="split-button"
                    aria-pressed={separated}
                    onClick={() => setSeparated(!separated)}
                    aria-label={separated ? t.hero.join : t.hero.split}
                    title={separated ? t.hero.join : t.hero.split}
                  >
                    <Grid3X3 size={22} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="brand-ribbon" aria-label={t.strip}>
          <div className="ribbon-track" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i}>
                {t.strip}
                <Plus size={24} />
                30×30
                <Plus size={24} />
              </span>
            ))}
          </div>
        </div>

        <SliceStory t={t} />

        <section className="menu-section" id="menu">
          <div className="section-inner">
            <Reveal className="menu-heading">
              <div>
                <p className="eyebrow">
                  <span />
                  {t.menu.eyebrow}
                </p>
                <h2>{t.menu.title}</h2>
              </div>
              <p className="section-description">{t.menu.body}</p>
            </Reveal>
            <div className="menu-toolbar">
              <div
                className="menu-filters"
                role="group"
                aria-label={t.nav.menu}
              >
                {(["all", "meat", "vegetarian"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    aria-pressed={category === filter}
                    onClick={() => setCategory(filter)}
                  >
                    {filter === "meat" ? (
                      <Flame size={15} />
                    ) : filter === "vegetarian" ? (
                      <Leaf size={15} />
                    ) : (
                      <Grid3X3 size={15} />
                    )}
                    {t.menu[filter]}
                  </button>
                ))}
              </div>
              <span className="format-note">{t.menu.format}</span>
            </div>
            <div className="pizza-menu-grid">
              {pizzas.map((pizza, index) =>
                category === "all" || pizza.category === category ? (
                  <Reveal key={pizza.id}>
                    <article className="pizza-card">
                      <button
                        className="pizza-photo-button"
                        type="button"
                        onClick={() => setSelected(index)}
                        aria-label={`${t.menu.details}: ${t.menu.items[index].name}`}
                      >
                        <Image
                          src={pizza.image}
                          alt={t.menu.items[index].name}
                          fill
                          sizes="(max-width: 600px) 90vw, (max-width: 1000px) 46vw, 30vw"
                        />
                        <span className="pizza-tag">
                          {t.menu.items[index].tag}
                        </span>
                        <span className="pizza-photo-action">
                          <ArrowUpRight size={25} />
                        </span>
                      </button>
                      <div className="pizza-card-heading">
                        <span className="menu-index">0{index + 1}</span>
                        <div>
                          <h3>{t.menu.items[index].name}</h3>
                          <p className="latin-name">
                            {t.menu.items[index].latin}
                          </p>
                        </div>
                      </div>
                      <p className="pizza-ingredients">
                        {t.menu.items[index].detail}
                      </p>
                      <button
                        className="pizza-choose"
                        type="button"
                        onClick={() => setSelected(index)}
                      >
                        {t.menu.choose}
                        <Plus size={18} />
                      </button>
                    </article>
                  </Reveal>
                ) : null,
              )}
            </div>
          </div>
        </section>

        <section className="delivery-section" id="delivery">
          <div className="section-inner">
            <Reveal className="delivery-heading">
              <p className="eyebrow">
                <span />
                {t.delivery.eyebrow}
              </p>
              <h2>{t.delivery.title}</h2>
              <p>{t.delivery.body}</p>
            </Reveal>
            <div className="delivery-layout">
              <Reveal className="delivery-visual">
                <div className="delivery-box-shadow" />
                <div className="delivery-box">
                  <div className="box-lid">
                    <Image
                      src="/images/90pizza-logo.png"
                      alt=""
                      width={74}
                      height={74}
                    />
                    <strong>90pizza.</strong>
                    <span>30×30 / 9</span>
                  </div>
                  <div className="box-edge">PIZZA AT THE RIGHT ANGLE</div>
                </div>
                <span className="box-caption">
                  {t.delivery.statement}
                  <ArrowUpRight size={18} />
                </span>
              </Reveal>
              <div className="delivery-details">
                <Reveal className="delivery-reason">
                  <Box size={25} />
                  <div>
                    <h3>{t.delivery.box}</h3>
                    <p>{t.delivery.boxBody}</p>
                  </div>
                </Reveal>
                <Reveal className="delivery-reason">
                  <Grid3X3 size={25} />
                  <div>
                    <h3>{t.delivery.share}</h3>
                    <p>{t.delivery.shareBody}</p>
                  </div>
                </Reveal>
                <Reveal className="delivery-partners">
                  <p>{t.delivery.availability}</p>
                  <div>
                    {["Wolt", "Glovo"].map((partner) => (
                      <div
                        className={`partner partner-${partner.toLowerCase()}`}
                        key={partner}
                        aria-label={`${partner}: ${t.soon}`}
                      >
                        <Bike size={24} />
                        <strong>{partner}</strong>
                        <span>{t.soon}</span>
                      </div>
                    ))}
                  </div>
                  <small>{t.delivery.partnerNote}</small>
                </Reveal>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="section-inner footer-top">
          <a className="footer-wordmark" href="#top">
            90pizza<span>.</span>
          </a>
          <div>
            <p>{t.footer.slogan}</p>
            <span>90pizza.ge / 90pizza.co</span>
          </div>
          <a
            href="#top"
            className="icon-button back-top"
            aria-label={t.footer.back}
          >
            <ArrowUp size={23} />
          </a>
        </div>
        <div className="section-inner footer-bottom">
          <span>© 90pizza. {t.footer.copyright}</span>
          <span>{t.footer.social}</span>
          <LanguageSwitcher lang={lang} onChange={setLang} label={t.language} />
        </div>
      </footer>
      <ProductDialog
        selected={selected}
        onClose={() => setSelected(null)}
        t={t}
      />
    </MotionConfig>
  );
}
