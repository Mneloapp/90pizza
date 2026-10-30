"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Menu,
  Minus,
  Plus,
  ShoppingBag,
  X,
} from "lucide-react";
import { flavors, type Language } from "./appetite-content";
import { experienceCopy, type ExperienceCopy } from "./experience-content";
import MakingWorld from "./MakingWorld";
import "./pizza-experience.css";
import "./pizza-making.css";

type Selection = { index: number; quantity: number } | null;

function FlavorDetails({
  index,
  language,
  copy,
  selection,
  onClose,
  onChange,
  onSelect,
}: {
  index: number;
  language: Language;
  copy: ExperienceCopy;
  selection: Selection;
  onClose: () => void;
  onChange: (value: number) => void;
  onSelect: (value: Selection) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [quantity, setQuantity] = useState(
    selection?.index === index ? selection.quantity : 1,
  );
  const flavor = flavors[index];
  const chosen = selection?.index === index && selection.quantity === quantity;
  useEffect(() => {
    const node = dialog.current;
    const active = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    node?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      node?.close();
      document.body.style.overflow = overflow;
      active?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="xp-dialog"
      aria-labelledby="xp-flavor-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
    >
      <button
        className="xp-icon xp-dialog-close"
        aria-label={copy.close}
        title={copy.close}
        onClick={onClose}
      >
        <X />
      </button>
      <div className="xp-dialog-image">
        <Image
          src={flavor.image}
          alt={flavor[language].name}
          fill
          sizes="(max-width: 700px) 90vw, 450px"
        />
      </div>
      <div className="xp-dialog-copy">
        <span className="xp-kicker">90pizza / 0{index + 1}</span>
        <h2 id="xp-flavor-title">{flavor[language].name}</h2>
        <p>{flavor[language].ingredients}</p>
        <div className="xp-dialog-spec">
          <span>30×30 {language === "ge" ? "სმ" : "cm"}</span>
          <span>09 / {copy.slices}</span>
        </div>
        <small>{copy.allergens}</small>
        <div className="xp-dialog-actions">
          <div className="xp-quantity" role="group" aria-label={copy.quantity}>
            <button
              className="xp-icon"
              aria-label={copy.decrease}
              title={copy.decrease}
              disabled={quantity === 1}
              onClick={() => setQuantity(quantity - 1)}
            >
              <Minus size={17} />
            </button>
            <output aria-live="polite">{quantity}</output>
            <button
              className="xp-icon"
              aria-label={copy.increase}
              title={copy.increase}
              disabled={quantity === 9}
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus size={17} />
            </button>
          </div>
          <button
            className="xp-button xp-button-red"
            onClick={() => onSelect({ index, quantity })}
          >
            {chosen ? copy.selected : copy.select}
            {chosen ? <Check size={19} /> : <ArrowRight size={19} />}
          </button>
        </div>
        <p className="xp-availability" role="status">
          {copy.availability}
        </p>
        <div className="xp-dialog-bottom">
          <span>0{index + 1} / 06</span>
          <div>
            <button
              className="xp-icon"
              aria-label={copy.previous}
              title={copy.previous}
              onClick={() => onChange((index + 5) % 6)}
            >
              <ChevronLeft />
            </button>
            <button
              className="xp-icon"
              aria-label={copy.next}
              title={copy.next}
              onClick={() => onChange((index + 1) % 6)}
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

export default function PizzaExperience() {
  const [language, setLanguage] = useState<Language>("ge");
  const [navOpen, setNavOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "meat" | "vegetarian">("all");
  const [detail, setDetail] = useState<number | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [saveData, setSaveData] = useState(false);
  const reduced = Boolean(useReducedMotion()) || saveData;
  useEffect(() => {
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    setSaveData(Boolean(connection?.saveData));
  }, []);
  const copy = experienceCopy[language];
  useEffect(() => {
    document.documentElement.lang = language === "ge" ? "ka" : "en";
  }, [language]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  const reveal = {
    initial: reduced ? (false as const) : { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.12 },
    transition: { duration: 0.55 },
  };
  const nav = [
    { href: "#geometry", label: copy.idea },
    { href: "#menu", label: copy.menu },
    { href: "#delivery", label: copy.delivery },
  ];
  return (
    <div className="pizza-experience" data-language={language}>
      <a className="skip-link" href="#menu">
        {copy.skip}
      </a>
      <header className="xp-header">
        <a href="#top" className="xp-brand" aria-label="90pizza">
          <Image
            src="/images/90pizza-logo.png"
            alt=""
            width={34}
            height={34}
            priority
          />
          <span>90pizza</span>
        </a>
        <nav className="xp-desktop-nav" aria-label={copy.navigation}>
          {nav.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="xp-header-tools">
          <div className="xp-language" role="group" aria-label={copy.language}>
            {(["ge", "en"] as const).map((value) => (
              <button
                key={value}
                aria-pressed={language === value}
                lang={value === "ge" ? "ka" : "en"}
                onClick={() => {
                  setLanguage(value);
                  setNavOpen(false);
                }}
              >
                {value.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            className="xp-icon xp-bag"
            aria-label={copy.choice}
            title={copy.choice}
            onClick={() => setDetail(selection?.index ?? 0)}
          >
            <ShoppingBag size={19} />
            {selection && <span>{selection.quantity}</span>}
          </button>
          <button
            className="xp-icon xp-nav-toggle"
            aria-label={navOpen ? copy.close : copy.openNav}
            aria-expanded={navOpen}
            aria-controls="xp-mobile-nav"
            onClick={() => setNavOpen(!navOpen)}
          >
            {navOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        <nav
          id="xp-mobile-nav"
          className="xp-mobile-nav"
          hidden={!navOpen}
          aria-label={copy.navigation}
        >
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setNavOpen(false)}
            >
              {item.label}
              <ArrowUpRight size={22} />
            </a>
          ))}
        </nav>
      </header>
      <main>
        <MakingWorld copy={copy} reduced={reduced} />
        <div className="xp-specs">
          <div>
            <b>90°</b>
            <span>{copy.angle}</span>
          </div>
          <div>
            <b>30×30</b>
            <span>{copy.centimeters}</span>
          </div>
          <div>
            <b>09</b>
            <span>{copy.slices}</span>
          </div>
        </div>
        <section id="menu" className="xp-menu" aria-labelledby="xp-menu-title">
          <motion.div className="xp-menu-heading" {...reveal}>
            <span className="xp-kicker">06 / {copy.menu}</span>
            <h2 id="xp-menu-title">{copy.menuTitle}</h2>
            <div>
              <p>{copy.menuNote}</p>
              <span>30×30 / 09</span>
            </div>
          </motion.div>
          <div className="xp-filters" role="group" aria-label={copy.menu}>
            {(["all", "meat", "vegetarian"] as const).map((value) => (
              <button
                key={value}
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {value === "vegetarian" && <Leaf size={16} />}
                {copy[value]}
              </button>
            ))}
          </div>
          <div className="xp-menu-grid">
            {flavors
              .filter(
                (flavor) =>
                  filter === "all" ||
                  (filter === "meat" ? flavor.meat : !flavor.meat),
              )
              .map((flavor) => (
                <motion.article
                  key={flavor.id}
                  className="xp-flavor"
                  {...reveal}
                >
                  <button
                    className="xp-flavor-photo"
                    onClick={() => setDetail(flavors.indexOf(flavor))}
                    aria-label={`${copy.explore}: ${flavor[language].name}`}
                  >
                    <Image
                      src={flavor.image}
                      alt={flavor[language].name}
                      fill
                      sizes="(max-width: 600px) 90vw, (max-width: 1000px) 44vw, 30vw"
                    />
                    <span className="xp-flavor-index">
                      0{flavors.indexOf(flavor) + 1}
                    </span>
                    <span className="xp-flavor-arrow">
                      <ArrowUpRight size={26} />
                    </span>
                  </button>
                  <div className="xp-flavor-heading">
                    <h3>
                      <button
                        onClick={() => setDetail(flavors.indexOf(flavor))}
                      >
                        {flavor[language].name}
                      </button>
                    </h3>
                    <span>30×30</span>
                  </div>
                  <p>{flavor[language].ingredients}</p>
                </motion.article>
              ))}
          </div>
        </section>
        <section
          id="delivery"
          className="xp-delivery"
          aria-labelledby="xp-delivery-title"
        >
          <motion.div {...reveal}>
            <span className="xp-kicker">07 / {copy.delivery}</span>
            <h2 id="xp-delivery-title">{copy.deliveryTitle}</h2>
            <p>{copy.deliveryNote}</p>
          </motion.div>
          <div className="xp-route" aria-hidden="true">
            <span>
              01<small>{copy.oven}</small>
            </span>
            <ArrowRight />
            <span>
              02<small>{copy.box}</small>
            </span>
            <ArrowRight />
            <span>
              03<small>{copy.you}</small>
            </span>
          </div>
          <div className="xp-partners">
            {["Wolt", "Glovo"].map((partner) => (
              <div key={partner}>
                <strong>{partner}</strong>
                <span>
                  {copy.soon}
                  <ArrowUpRight size={22} />
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="xp-footer">
        <div className="xp-footer-top">
          <p>{copy.footer}</p>
          <a
            href="#top"
            className="xp-icon"
            aria-label={copy.top}
            title={copy.top}
          >
            <ArrowUp size={25} />
          </a>
        </div>
        <div className="xp-footer-wordmark" aria-hidden="true">
          90pizza
        </div>
        <div className="xp-footer-links">
          <a href="https://90pizza.ge">90pizza.ge</a>
          <a href="https://90pizza.co">90pizza.co</a>
          <span>{copy.social}</span>
          <div className="xp-language" role="group" aria-label={copy.language}>
            {(["ge", "en"] as const).map((value) => (
              <button
                key={value}
                aria-pressed={language === value}
                onClick={() => setLanguage(value)}
              >
                {value.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <p className="xp-prototype">{copy.concept}</p>
      </footer>
      {detail !== null && (
        <FlavorDetails
          key={detail}
          index={detail}
          language={language}
          copy={copy}
          selection={selection}
          onClose={() => setDetail(null)}
          onChange={setDetail}
          onSelect={setSelection}
        />
      )}
    </div>
  );
}
