"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion, useScroll } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  Grid2X2,
  Leaf,
  Menu,
  Minus,
  Plus,
  ShoppingBag,
  X,
} from "lucide-react";
import { BiteFilm, HeroFilm } from "./ProductFilm";
import {
  flavors,
  translations,
  type Copy,
  type Language,
} from "./appetite-content";

const DeliveryBox = dynamic(() => import("./DeliveryBox"), { ssr: false });
type Selection = { id: string; quantity: number } | null;

function LanguageSwitch({
  language,
  onChange,
}: {
  language: Language;
  onChange: (language: Language) => void;
}) {
  return (
    <div className="language-switch" role="group" aria-label="Language / ენა">
      {(["ge", "en"] as const).map((value) => (
        <button
          type="button"
          key={value}
          onClick={() => onChange(value)}
          aria-pressed={language === value}
          lang={value === "ge" ? "ka" : "en"}
        >
          {value.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function FlavorDialog({
  index,
  onChange,
  onClose,
  language,
  copy,
  selection,
  onSelect,
}: {
  index: number | null;
  onChange: (index: number) => void;
  onClose: () => void;
  language: Language;
  copy: Copy;
  selection: Selection;
  onSelect: (value: Selection) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [quantity, setQuantity] = useState(1);
  const flavor = index === null ? null : flavors[index];
  useEffect(() => {
    const node = dialog.current;
    if (!node || index === null) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    if (!node.open) node.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      node.close();
      document.body.style.overflow = overflow;
      previous?.focus({ preventScroll: true });
    };
  }, [index === null]);
  useEffect(() => {
    if (flavor)
      setQuantity(selection?.id === flavor.id ? selection.quantity : 1);
  }, [flavor, selection]);
  const chosen =
    flavor && selection?.id === flavor.id && selection.quantity === quantity;

  return (
    <dialog
      ref={dialog}
      className="flavor-dialog"
      aria-labelledby="flavor-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={() => {
        if (!dialog.current?.open) onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose();
      }}
    >
      {flavor && (
        <div className="flavor-dialog-inner">
          <div className="flavor-dialog-photo">
            <Image
              src={flavor.image}
              alt={flavor[language].name}
              fill
              sizes="(max-width: 760px) 92vw, 500px"
            />
            <span className="flavor-number">0{(index ?? 0) + 1} / 06</span>
          </div>
          <div className="flavor-dialog-copy">
            <div className="dialog-topline">
              <span className="eyebrow">90pizza / {copy.menu}</span>
              <button
                type="button"
                className="icon-button"
                onClick={onClose}
                aria-label={copy.close}
                title={copy.close}
              >
                <X size={23} />
              </button>
            </div>
            <p className="flavor-note">{flavor[language].note}</p>
            <h2 id="flavor-title">{flavor[language].name}</h2>
            <p className="flavor-ingredients">{flavor[language].ingredients}</p>
            <div className="flavor-specs">
              <span>30×30 {copy.formatUnit}</span>
              <span>9 {copy.slices}</span>
            </div>
            <p className="allergens">{copy.allergens}</p>
            <div className="flavor-action-row">
              <div className="quantity" role="group" aria-label={copy.quantity}>
                <button
                  type="button"
                  onClick={() => setQuantity((n) => Math.max(1, n - 1))}
                  disabled={quantity === 1}
                  aria-label={copy.decrease}
                  title={copy.decrease}
                >
                  <Minus size={17} />
                </button>
                <output aria-live="polite">{quantity}</output>
                <button
                  type="button"
                  onClick={() => setQuantity((n) => Math.min(9, n + 1))}
                  disabled={quantity === 9}
                  aria-label={copy.increase}
                  title={copy.increase}
                >
                  <Plus size={17} />
                </button>
              </div>
              <button
                type="button"
                className="action-button red"
                onClick={() => onSelect({ id: flavor.id, quantity })}
              >
                {chosen ? copy.selected : copy.select}
                {chosen ? <Check size={19} /> : <ArrowRight size={19} />}
              </button>
            </div>
            <p className="availability" role="status">
              {chosen ? copy.selectedNote : copy.availability}
            </p>
            <div className="dialog-bottomline">
              <a href="#delivery" onClick={onClose}>
                {copy.delivery}
                <ArrowUpRight size={17} />
              </a>
              <div className="dialog-arrows">
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => onChange(((index ?? 0) + 5) % 6)}
                  aria-label={copy.previous}
                  title={copy.previous}
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => onChange(((index ?? 0) + 1) % 6)}
                  aria-label={copy.next}
                  title={copy.next}
                >
                  <ChevronRight size={22} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}

function Delivery({ copy, reduced }: { copy: Copy; reduced: boolean }) {
  const root = useRef<HTMLElement>(null);
  const near = useInView(root, { margin: "400px 0px", once: true });
  const { scrollYProgress } = useScroll({
    target: root,
    offset: ["start end", "end start"],
  });
  return (
    <section
      id="delivery"
      className="delivery-section"
      ref={root}
      aria-labelledby="delivery-title"
    >
      <div className="delivery-layout wrap">
        <div className="delivery-visual">
          {near && (
            <DeliveryBox
              progress={scrollYProgress}
              reduced={reduced}
              label={copy.deliveryBox}
              rotateLabel={copy.boxRotate}
            />
          )}
          <span className="delivery-format">90° / 30×30 / 09</span>
        </div>
        <div className="delivery-copy">
          <span className="eyebrow">{copy.deliveryEyebrow}</span>
          <h2 id="delivery-title">{copy.deliveryTitle}</h2>
          <p>{copy.deliveryDescription}</p>
          <div className="delivery-partners">
            <div>
              <strong>Wolt</strong>
              <span>
                {copy.soon}
                <ArrowUpRight size={17} />
              </span>
            </div>
            <div>
              <strong>Glovo</strong>
              <span>
                {copy.soon}
                <ArrowUpRight size={17} />
              </span>
            </div>
          </div>
          <a className="text-link" href="#menu">
            {copy.backMenu}
            <ArrowRight size={19} />
          </a>
        </div>
      </div>
    </section>
  );
}

export default function AppetitePage() {
  const [language, setLanguage] = useState<Language>("ge");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "meat" | "vegetarian">("all");
  const [detail, setDetail] = useState<number | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const reduced = Boolean(useReducedMotion());
  const copy = translations[language];
  const nav = [
    { href: "#format", label: copy.format },
    { href: "#bite", label: `9 ${copy.slices}` },
    { href: "#menu", label: copy.menu },
    { href: "#delivery", label: copy.delivery },
  ];
  const visibleFlavors = flavors.filter(
    (flavor) =>
      filter === "all" || (filter === "meat" ? flavor.meat : !flavor.meat),
  );

  useEffect(() => {
    document.documentElement.lang = language === "ge" ? "ka" : "en";
  }, [language]);
  useEffect(() => {
    function close(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  function changeLanguage(value: Language) {
    setLanguage(value);
    setMobileOpen(false);
  }
  const reveal = {
    initial: reduced ? (false as const) : { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.12 },
    transition: { duration: 0.6 },
  };

  return (
    <div className="appetite-page" data-language={language}>
      <a className="skip-link" href="#menu">
        {copy.skip}
      </a>
      <header className="site-header">
        <div className="header-inner wrap">
          <a className="brand" href="#top" aria-label="90pizza">
            <Image
              src="/images/90pizza-logo.png"
              alt=""
              width={35}
              height={35}
              priority
            />
            <span>90pizza</span>
          </a>
          <nav className="desktop-navigation" aria-label={copy.navigation}>
            {nav.map((item) => (
              <a href={item.href} key={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="header-tools">
            <LanguageSwitch language={language} onChange={changeLanguage} />
            <button
              type="button"
              className="icon-button choice-button"
              onClick={() =>
                setDetail(
                  selection
                    ? flavors.findIndex((f) => f.id === selection.id)
                    : 0,
                )
              }
              aria-label={`${copy.choice}${selection ? ` (${selection.quantity})` : ""}`}
              title={copy.choice}
            >
              <ShoppingBag size={20} />
              {selection && (
                <span className="choice-count">{selection.quantity}</span>
              )}
            </button>
            <button
              type="button"
              className="icon-button mobile-menu-button"
              aria-controls="mobile-navigation"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? copy.menuClose : copy.menuOpen}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={23} /> : <Menu size={23} />}
            </button>
          </div>
        </div>
        <nav
          className="mobile-navigation"
          id="mobile-navigation"
          hidden={!mobileOpen}
          aria-label={copy.navigation}
        >
          {nav.map((item) => (
            <a
              href={item.href}
              key={item.href}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
              <ArrowUpRight size={20} />
            </a>
          ))}
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-picture">
            <HeroFilm copy={copy} />
            <div className="hero-wordmark wrap">
              <motion.h1
                id="hero-title"
                initial={reduced ? false : { opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                90pizza
              </motion.h1>
              <span className="hero-edition">30×30 / 09</span>
            </div>
            <a
              className="hero-discover"
              href="#format"
              aria-label={copy.format}
              title={copy.format}
            >
              <ArrowDown size={22} />
            </a>
          </div>
          <div className="hero-caption">
            <div className="wrap hero-caption-inner">
              <div>
                <h2>{copy.slogan}</h2>
                <p>{copy.heroNote}</p>
              </div>
              <a
                className="action-button red"
                href="#menu"
                aria-label={copy.viewMenu}
                title={copy.viewMenu}
              >
                <span className="desktop-action-label">{copy.viewMenu}</span>
                <span className="mobile-action-label">{copy.menu}</span>
                <ArrowUpRight size={23} />
              </a>
            </div>
          </div>
        </section>

        <div className="spec-strip" aria-label="90pizza">
          <span>
            <strong>90°</strong>
            {copy.angle}
          </span>
          <span>
            <strong>30×30</strong>
            {copy.square}
          </span>
          <span>
            <strong>09</strong>
            {copy.slices}
          </span>
        </div>

        <section
          className="format-section"
          id="format"
          aria-labelledby="format-title"
        >
          <div className="wrap">
            <motion.div className="format-intro" {...reveal}>
              <span className="eyebrow">{copy.formatEyebrow}</span>
              <h2 id="format-title">{copy.formatTitle}</h2>
              <p>{copy.formatDescription}</p>
            </motion.div>
            <div className="format-dimensions">
              <motion.div className="dimension-number" {...reveal}>
                30<span>×</span>30<small>{copy.formatUnit}</small>
              </motion.div>
              <div className="format-bottom">
                <p>{copy.formatNote}</p>
                <motion.div className="nine-grid" aria-hidden="true">
                  {Array.from({ length: 9 }, (_, index) => (
                    <motion.span
                      key={index}
                      initial={reduced ? false : { scale: 0.35, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.055, duration: 0.35 }}
                    />
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        <div id="bite">
          <BiteFilm copy={copy} reduced={reduced} />
        </div>

        <section
          className="menu-section"
          id="menu"
          aria-labelledby="menu-title"
        >
          <div className="wrap">
            <motion.div className="menu-heading" {...reveal}>
              <span className="eyebrow">{copy.menu} / 06</span>
              <h2 id="menu-title">{copy.menuTitle}</h2>
              <p>{copy.menuDescription}</p>
            </motion.div>
            <div className="menu-toolbar">
              <div
                className="flavor-filters"
                role="group"
                aria-label={copy.menu}
              >
                {(["all", "meat", "vegetarian"] as const).map((value) => (
                  <button
                    type="button"
                    key={value}
                    aria-pressed={filter === value}
                    onClick={() => setFilter(value)}
                  >
                    {value === "vegetarian" && <Leaf size={15} />}
                    {copy[value]}
                  </button>
                ))}
              </div>
              <span className="menu-format">
                <Grid2X2 size={15} />
                30×30 / 09
              </span>
            </div>
            <div className="flavor-grid">
              {visibleFlavors.map((flavor) => (
                <motion.article
                  key={flavor.id}
                  className="flavor-item"
                  {...reveal}
                >
                  <button
                    type="button"
                    className="flavor-photo"
                    onClick={() => setDetail(flavors.indexOf(flavor))}
                    aria-label={`${copy.explore}: ${flavor[language].name}`}
                  >
                    <Image
                      src={flavor.image}
                      alt={flavor[language].name}
                      fill
                      sizes="(max-width: 600px) 92vw, (max-width: 1000px) 45vw, 30vw"
                    />
                    <span className="photo-index" aria-hidden="true">
                      0{flavors.indexOf(flavor) + 1}
                    </span>
                    <span className="photo-arrow" aria-hidden="true">
                      <ArrowUpRight size={24} />
                    </span>
                  </button>
                  <div className="flavor-title-row">
                    <h3>
                      <button
                        type="button"
                        onClick={() => setDetail(flavors.indexOf(flavor))}
                      >
                        {flavor[language].name}
                      </button>
                    </h3>
                    {flavor.spicy ? (
                      <Flame size={19} aria-label={copy.spicy} />
                    ) : !flavor.meat ? (
                      <Leaf size={18} aria-label={copy.vegetarian} />
                    ) : null}
                  </div>
                  <p>{flavor[language].ingredients}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <Delivery copy={copy} reduced={reduced} />
      </main>

      <footer className="site-footer">
        <div className="wrap">
          <div className="footer-top">
            <p>{copy.footerLine}</p>
            <a
              className="icon-button"
              href="#top"
              aria-label={copy.top}
              title={copy.top}
            >
              <ArrowUp size={22} />
            </a>
          </div>
          <div className="footer-wordmark" aria-hidden="true">
            90pizza
          </div>
          <div className="footer-bottom">
            <div className="footer-domains">
              <span>90pizza.ge</span>
              <span>90pizza.co</span>
            </div>
            <span>{copy.social}</span>
            <LanguageSwitch language={language} onChange={changeLanguage} />
          </div>
          <p className="concept-note">{copy.concept}</p>
        </div>
      </footer>
      <FlavorDialog
        index={detail}
        onChange={setDetail}
        onClose={() => setDetail(null)}
        language={language}
        copy={copy}
        selection={selection}
        onSelect={setSelection}
      />
    </div>
  );
}
