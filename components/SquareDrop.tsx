"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
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
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Box,
  Check,
  Grid3X3,
  Menu,
  Minus,
  PackageOpen,
  Plus,
  ShoppingBag,
  X,
} from "lucide-react";
import {
  dropCopy,
  dropFlavors,
  type DropLanguage,
  type DropText,
} from "./drop-content";

const World = dynamic(() => import("./SquareWorld"), {
  ssr: false,
  loading: () => (
    <div className="world-loading">
      <Image
        src="/images/square-drop/pepperoni.webp"
        alt=""
        fill
        sizes="(max-width: 700px) 75vw, 550px"
        priority
      />
    </div>
  ),
});

function Enter({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Languages({
  lang,
  change,
  label,
}: {
  lang: DropLanguage;
  change: (lang: DropLanguage) => void;
  label: string;
}) {
  return (
    <div className="drop-languages" role="group" aria-label={label}>
      {(["ge", "en"] as const).map((value) => (
        <button
          key={value}
          onClick={() => change(value)}
          aria-pressed={lang === value}
          type="button"
        >
          {value === "ge" ? "GE" : "EN"}
        </button>
      ))}
    </div>
  );
}

function Nine({ t, reduced }: { t: DropText; reduced: boolean }) {
  const target = useRef<HTMLElement>(null);
  const [apart, setApart] = useState(false);
  const { scrollYProgress } = useScroll({
    target,
    offset: ["start end", "center center"],
  });
  const gap = useTransform(scrollYProgress, [0, 1], [27, 3]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-7, 0]);
  return (
    <section className="nine-section" id="geometry" ref={target}>
      <div className="nine-heading wrap">
        <Enter>
          <p className="section-label">
            <span />
            {t.sharing.eyebrow}
          </p>
          <h2>{t.sharing.title}</h2>
        </Enter>
        <Enter delay={0.1}>
          <p>{t.sharing.body}</p>
        </Enter>
      </div>
      <div className="nine-composition wrap">
        <span className="nine-number" aria-hidden="true">
          9
        </span>
        <motion.div
          className="nine-pizza"
          role="img"
          aria-label={t.sharing.photo}
          style={
            reduced
              ? { gap: apart ? 18 : 3, rotate: 0 }
              : { gap: apart ? 18 : gap, rotate: apart ? -4 : rotate }
          }
        >
          {Array.from({ length: 9 }, (_, index) => (
            <div
              key={index}
              className="nine-slice"
              style={{
                backgroundPosition: `${(index % 3) * 50}% ${Math.floor(index / 3) * 50}%`,
              }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
            </div>
          ))}
        </motion.div>
        <div className="nine-aside">
          <span className="tiny-square" />
          <p>30×30</p>
          <span>{t.sharing.unit}</span>
          <button
            type="button"
            className="round-control"
            aria-label={apart ? t.sharing.together : t.sharing.split}
            title={apart ? t.sharing.together : t.sharing.split}
            aria-pressed={apart}
            onClick={() => setApart(!apart)}
          >
            <Grid3X3 size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}

function Selection({
  t,
  selected,
  quantity,
  setQuantity,
  onClose,
  onChange,
}: {
  t: DropText;
  selected: number;
  quantity: number;
  setQuantity: (quantity: number) => void;
  onClose: () => void;
  onChange: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current!;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
    };
  }, []);
  return (
    <dialog
      className="selection-drawer"
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
      aria-labelledby="selection-title"
    >
      <div className="selection-inner">
        <div className="selection-top">
          <span>90pizza / YOUR SQUARE</span>
          <button
            className="round-control"
            type="button"
            aria-label={t.close}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <h2 id="selection-title">{t.basket.title}</h2>
        <div className="selection-picture">
          <Image
            src={dropFlavors[selected].texture}
            alt={t.tasting.items[selected].name}
            fill
            sizes="(max-width: 600px) 90vw, 420px"
          />
        </div>
        <div className="selection-name">
          <div>
            <p>{dropFlavors[selected].code}</p>
            <h3>{t.tasting.items[selected].name}</h3>
          </div>
          <Check size={23} />
        </div>
        <p className="selection-description">
          {t.tasting.items[selected].description}
        </p>
        <div className="selection-spec">
          <span>{t.basket.size}</span>
          <span>{t.basket.slices}</span>
        </div>
        <div className="selection-quantity">
          <span>{t.basket.quantity}</span>
          <div>
            <button
              type="button"
              aria-label={t.basket.less}
              disabled={quantity === 1}
              onClick={() => setQuantity(quantity - 1)}
            >
              <Minus size={17} />
            </button>
            <output aria-live="polite">{quantity}</output>
            <button
              type="button"
              aria-label={t.basket.more}
              disabled={quantity === 9}
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus size={17} />
            </button>
          </div>
        </div>
        <button className="selection-change" type="button" onClick={onChange}>
          {t.basket.change}
          <ArrowUpRight size={17} />
        </button>
        <div className="selection-launch">
          <span className="status-dot" />
          {t.basket.availability}
        </div>
        <p className="selection-disclaimer">{t.basket.note}</p>
      </div>
    </dialog>
  );
}

export default function SquareDrop() {
  const [lang, setLang] = useState<DropLanguage>("ge");
  const [active, setActive] = useState(0);
  const [opened, setOpened] = useState(true);
  const [separated, setSeparated] = useState(false);
  const [selection, setSelection] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [navOpen, setNavOpen] = useState(false);
  const reduced = Boolean(useReducedMotion());
  const t = dropCopy[lang];
  const product = dropFlavors[active];
  const flavor = t.tasting.items[active];
  useEffect(() => {
    document.documentElement.lang = lang === "ge" ? "ka" : "en";
  }, [lang]);
  const goFlavor = () => {
    setSelection(false);
    document
      .getElementById("flavors")
      ?.scrollIntoView({ behavior: reduced ? "instant" : "smooth" });
  };
  const choose = (index: number) => {
    setActive((index + dropFlavors.length) % dropFlavors.length);
  };
  const links = [
    { label: t.nav.flavors, href: "#flavors" },
    { label: t.nav.idea, href: "#geometry" },
    { label: t.nav.delivery, href: "#delivery" },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <a href="#flavors" className="drop-skip">
        {t.discover}
      </a>
      <header className="drop-header">
        <div className="drop-header-inner wrap">
          <a className="drop-logo" href="#top" aria-label={t.home}>
            <Image
              src="/images/90pizza-logo.png"
              alt=""
              width={42}
              height={42}
              priority
            />
            <span>90pizza</span>
          </a>
          <nav className="drop-nav" aria-label={t.openMenu}>
            {links.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="drop-header-actions">
            <Languages lang={lang} change={setLang} label={t.language} />
            <button
              className="header-bag"
              type="button"
              onClick={() => setSelection(true)}
              aria-label={t.order}
            >
              <ShoppingBag size={18} />
              <span>{String(quantity).padStart(2, "0")}</span>
            </button>
            <button
              className="mobile-toggle"
              type="button"
              aria-label={navOpen ? t.close : t.openMenu}
              aria-expanded={navOpen}
              aria-controls="drop-mobile-nav"
              onClick={() => setNavOpen(!navOpen)}
            >
              {navOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {navOpen && (
            <motion.nav
              id="drop-mobile-nav"
              className="drop-mobile-nav"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setNavOpen(false)}
                >
                  {link.label}
                  <ArrowUpRight size={19} />
                </a>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main>
        <section className="drop-hero" id="top">
          <div className="hero-topline wrap">
            <span>{t.hero.edition}</span>
            <span className="edition-mark">SQUARE DROP / 001</span>
          </div>
          <motion.h1
            className="poster-wordmark"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            90pizza<span aria-hidden="true">°</span>
          </motion.h1>
          <div className="hero-world">
            <World
              texture={dropFlavors[0].texture}
              mode="box"
              opened={opened}
              separated={false}
              label={t.hero.model}
              reducedMotion={reduced}
            />
          </div>
          <div className="hero-corner hero-corner-left">
            <span>30</span>
            <span>×30</span>
            <i />
          </div>
          <div className="hero-corner hero-corner-right">
            <span>09</span>
            <span>SLICES.</span>
            <i />
          </div>
          <div className="hero-bottomline wrap">
            <Enter className="hero-tagline">
              <h2>{t.hero.title}</h2>
              <p>{t.hero.description}</p>
            </Enter>
            <div className="hero-center-tools">
              <button
                className="round-control box-control"
                aria-pressed={opened}
                type="button"
                aria-label={opened ? t.hero.shut : t.hero.open}
                title={opened ? t.hero.shut : t.hero.open}
                onClick={() => setOpened(!opened)}
              >
                {opened ? <PackageOpen size={21} /> : <Box size={21} />}
              </button>
              <a
                href="#geometry"
                className="hero-scroll"
                aria-label={t.hero.scroll}
              >
                <ArrowDown size={17} />
              </a>
            </div>
            <a href="#flavors" className="drop-button drop-button-dark">
              {t.discover}
              <ArrowUpRight size={20} />
            </a>
          </div>
        </section>

        <section className="manifesto-section" aria-label={t.manifesto.eyebrow}>
          <div className="manifesto-top wrap">
            <Enter>
              <p className="section-label">
                <span />
                {t.manifesto.eyebrow}
              </p>
              <h2>{t.manifesto.title}</h2>
            </Enter>
            <Enter delay={0.1}>
              <p className="manifesto-description">{t.manifesto.body}</p>
            </Enter>
          </div>
          <div className="manifesto-numbers wrap">
            {["90°", "30×30", "9"].map((number, index) => (
              <Enter key={number} delay={index * 0.07}>
                <strong>{number}</strong>
                <span>{t.manifesto.words[index]}</span>
                <Plus size={16} />
              </Enter>
            ))}
          </div>
        </section>

        <section
          className="flavor-section"
          id="flavors"
          style={{ "--taste-accent": product.accent } as CSSProperties}
        >
          <div className="flavor-top wrap">
            <Enter>
              <p className="section-label">
                <span />
                {t.tasting.eyebrow}
              </p>
              <h2>{t.tasting.title}</h2>
            </Enter>
            <p>{t.tasting.small}</p>
          </div>
          <div className="flavor-layout wrap">
            <div
              className="flavor-picker"
              role="tablist"
              aria-label={t.nav.flavors}
            >
              {dropFlavors.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active === index}
                  aria-controls="flavor-panel"
                  id={`taste-tab-${index}`}
                  tabIndex={active === index ? 0 : -1}
                  onKeyDown={(event) => {
                    if (
                      [
                        "ArrowRight",
                        "ArrowDown",
                        "ArrowLeft",
                        "ArrowUp",
                      ].includes(event.key)
                    ) {
                      event.preventDefault();
                      const next =
                        (active +
                          (event.key === "ArrowRight" ||
                          event.key === "ArrowDown"
                            ? 1
                            : 3)) %
                        4;
                      choose(next);
                      document.getElementById(`taste-tab-${next}`)?.focus();
                    }
                  }}
                  onClick={() => choose(index)}
                >
                  <span>0{index + 1}</span>
                  <strong>{t.tasting.items[index].name}</strong>
                  <ArrowUpRight size={19} />
                </button>
              ))}
            </div>
            <div
              className="flavor-panel"
              id="flavor-panel"
              role="tabpanel"
              aria-labelledby={`taste-tab-${active}`}
            >
              <div className="flavor-code" aria-hidden="true">
                {product.code.split(" ")[0]}
              </div>
              <div className="flavor-world">
                <World
                  texture={product.texture}
                  mode="pizza"
                  opened={true}
                  separated={separated}
                  label={`${flavor.name}: ${t.tasting.image}`}
                  reducedMotion={reduced}
                />
              </div>
              <div className="flavor-stage-footer">
                <span>{product.code} / 30×30</span>
                <div>
                  <button
                    className="round-control"
                    aria-label={t.tasting.previous}
                    type="button"
                    onClick={() => choose(active - 1)}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <button
                    className="round-control"
                    aria-label={separated ? t.tasting.join : t.tasting.expand}
                    title={separated ? t.tasting.join : t.tasting.expand}
                    aria-pressed={separated}
                    type="button"
                    onClick={() => setSeparated(!separated)}
                  >
                    <Grid3X3 size={19} />
                  </button>
                  <button
                    className="round-control"
                    aria-label={t.tasting.next}
                    type="button"
                    onClick={() => choose(active + 1)}
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flavor-bottom wrap">
            <div className="flavor-index">
              0{active + 1}
              <span>/ 04</span>
            </div>
            <div className="flavor-info" aria-live="polite">
              <h3>{flavor.line}</h3>
              <p>{flavor.description}</p>
              <div className="ingredient-tags">
                {flavor.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="drop-button drop-button-red"
              onClick={() => setSelection(true)}
            >
              {t.tasting.select}
              <Plus size={20} />
            </button>
          </div>
        </section>

        <Nine t={t} reduced={reduced} />

        <section className="arrival-section" id="delivery">
          <div className="arrival-top wrap">
            <p className="section-label">
              <span />
              {t.delivery.eyebrow}
            </p>
            <span>90PIZZA / TO YOUR DOOR</span>
          </div>
          <Enter className="arrival-title wrap">
            <h2>{t.delivery.title}</h2>
            <p>{t.delivery.body}</p>
          </Enter>
          <div className="route-line wrap">
            {t.delivery.route.map((step, index) => (
              <div key={step}>
                <span>0{index + 1}</span>
                <strong>{step}</strong>
                {index < 2 ? <ArrowRight size={24} /> : <Check size={24} />}
              </div>
            ))}
          </div>
          <div className="arrival-bottom wrap">
            <div>
              <p>{t.delivery.status}</p>
              <div className="arrival-partners">
                <span>
                  Wolt<small>{t.soon}</small>
                </span>
                <span>
                  Glovo<small>{t.soon}</small>
                </span>
              </div>
              <small className="arrival-launch">{t.delivery.launch}</small>
            </div>
            <a href="#flavors" className="drop-button drop-button-paper">
              {t.delivery.cta}
              <ArrowUpRight size={20} />
            </a>
          </div>
        </section>
      </main>

      <footer className="drop-footer">
        <div className="footer-message wrap">
          <Image src="/images/90pizza-logo.png" alt="" width={48} height={48} />
          <p>{t.footer.message}</p>
          <a href="#top" className="round-control" aria-label={t.footer.top}>
            <ArrowUpRight size={23} />
          </a>
        </div>
        <a className="footer-monogram" href="#top" aria-label={t.home}>
          90pizza<span aria-hidden="true">°</span>
        </a>
        <div className="footer-meta wrap">
          <span>© 90pizza. {t.footer.copyright}</span>
          <span>{t.footer.social}</span>
          <Languages lang={lang} change={setLang} label={t.language} />
        </div>
      </footer>
      {selection && (
        <Selection
          t={t}
          selected={active}
          quantity={quantity}
          setQuantity={setQuantity}
          onClose={() => setSelection(false)}
          onChange={goFlavor}
        />
      )}
    </MotionConfig>
  );
}
