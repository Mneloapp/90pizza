"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, type MotionValue, useScroll, useTransform } from "framer-motion";
import {
  ArrowUpRight,
  Bike,
  Box,
  Crosshair,
  Grid3X3,
  MoveRight,
  PackageCheck,
  Ruler,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";

type Language = "ge" | "en";

type HeroVisualCopy = {
  alt: string;
  rotation: string;
  size: string;
  slices: string;
};

const menuPhotoPaths = [
  "/images/menu-margherita-real.png",
  "/images/menu-pepperoni-real.png",
  "/images/menu-four-cheese-real.png",
  "/images/menu-mushroom-real.png",
  "/images/menu-spicy-real.png",
  "/images/menu-veggie-real.png",
];

const storyIcons = [Crosshair, Ruler, Grid3X3];
const deliveryIcons = [PackageCheck, Timer, ShieldCheck];

const translations = {
  ge: {
    nav: {
      angle: "90°",
      format: "30×30",
      slices: "9 ნაჭერი",
      menu: "მენიუ",
      delivery: "მიტანა",
      homeLabel: "90pizza მთავარი",
    },
    hero: {
      eyebrow: "geometry-driven delivery pizza",
      title: "90pizza",
      headline: "პიცა სწორი კუთხით",
      body:
        "თანამედროვე მიტანის ბრენდი, რომელიც პიცას უყურებს როგორც პროდუქტს: ზუსტი კუთხე, ოთხკუთხედი ფორმატი, 30×30 სმ და 9 თანაბარი ნაჭერი.",
      menuCta: "მენიუს ნახვა",
      woltCta: "მალე Wolt-ზე",
      metrics: ["90° კუთხე", "30×30 სმ", "9 თანაბარი"],
    },
    visual: {
      alt: "90pizza ოთხკუთხედი პიცა 9 ნაჭრად",
      rotation: "30×30 hero cut",
      size: "30×30 სმ",
      slices: "9 თანაბარი ნაჭერი",
    },
    storytelling: {
      kicker: "სქროლზე გაშლილი კონცეფცია",
      intro: "სამი რიცხვი ქმნის მთლიან ბრენდს.",
      blocks: [
        {
          value: "90°",
          label: "სწორი კუთხე, სწორი გემო",
          detail: "ბრენდის მთავარი ნიშანი არის კუთხე: მკაფიო, დასამახსოვრებელი და მოძრაობაში ცოცხალი.",
        },
        {
          value: "30×30",
          label: "ოთხკუთხედი ფორმატი მიტანისთვის",
          detail: "ზომა, რომელიც ჯდება ყუთში, იკითხება ეკრანზე და გზაში ინარჩუნებს ფორმას.",
        },
        {
          value: "9 ნაჭერი",
          label: "თანაბარი ნაჭრები ყველასთვის",
          detail: "3×3 სისტემა პიცას აქცევს გასაზიარებელ ინტერფეისად.",
        },
      ],
    },
    cut: {
      kicker: "9 ნაჭერი",
      title: "გეომეტრია, რომელსაც დააგემოვნებ",
    },
    delivery: {
      kicker: "delivery-first culture",
      title: "შექმნილია სწრაფი მიტანისთვის",
      body:
        "90pizza იწყება არა მაგიდით, არამედ მარშრუტით: ყუთი, სითბო, აპში ხილვადობა და სწრაფი handoff.",
      cards: [
        ["Box precision", "30×30 ფორმატი ყუთში ზედმეტი მოძრაობის გარეშე ჯდება."],
        ["Fast handoff", "მოკლე გზა სამზარეულოდან კარამდე, სუფთა ფორმით."],
        ["App signal", "წითელი წრე, თეთრი კუთხე და კვადრატი მყისიერად იკითხება."],
      ],
      partners: [
        ["Wolt", "მალე"],
        ["Glovo", "მალე"],
      ],
    },
    menu: {
      kicker: "menu system",
      title: "ექვსი კვადრატი. ერთი ზუსტი ფორმატი.",
      body: "მენიუ რჩება პროდუქტის ნაწილად: ყოველი პიცა არის 30×30, დაჭრილი 9 თანაბარ ნაჭრად.",
      items: [
        ["ნაინთი მარგარიტა", "Ninety Margherita", "სან მარცანო, ფიორ დი ლატე, ბაზილიკის ზეთი", "24 ₾"],
        ["პეპერონი გრიდი", "Pepperoni Grid", "პეპერონი, მოცარელა, ჩილის თაფლი", "29 ₾"],
        ["ოთხი ყველი", "Four Cheese", "მოცარელა, გორგონზოლა, რიკოტა, პარმეზანი", "28 ₾"],
        ["მაშრუმ სქუერი", "Mushroom Square", "შემწვარი სოკო, სკამორცა, ნივრის კრემი", "27 ₾"],
        ["სპაისი ქორნერი", "Spicy Corner", "ნდუჯა, ჩილი, წითელი წიწაკა, ცხარე ზეთი", "31 ₾"],
        ["ვეგი გრიდი", "Veggie Grid", "ფერადი ბოსტნეული, მოცარელა, მწვანე ზეთი", "26 ₾"],
      ],
    },
    footer: {
      slogan: "პიცა სწორი კუთხით",
      instagram: "Instagram",
      language: "GE / EN",
    },
  },
  en: {
    nav: {
      angle: "90°",
      format: "30x30",
      slices: "9 slices",
      menu: "Menu",
      delivery: "Delivery",
      homeLabel: "90pizza home",
    },
    hero: {
      eyebrow: "geometry-driven delivery pizza",
      title: "90pizza",
      headline: "Pizza at the right angle",
      body:
        "A modern delivery brand that treats pizza like a product: a precise angle, a square format, 30x30 cm, and 9 equal slices.",
      menuCta: "View menu",
      woltCta: "Soon on Wolt",
      metrics: ["90° angle", "30x30 cm", "9 equal"],
    },
    visual: {
      alt: "90pizza square pizza cut into 9 slices",
      rotation: "30x30 hero cut",
      size: "30x30 cm",
      slices: "9 equal slices",
    },
    storytelling: {
      kicker: "scroll storytelling",
      intro: "Three numbers build the whole brand.",
      blocks: [
        {
          value: "90°",
          label: "The right angle. The right taste.",
          detail: "The core brand signal is an angle: sharp, memorable, and alive in motion.",
        },
        {
          value: "30x30",
          label: "A square format made for delivery",
          detail: "A size that fits the box, reads on screen, and keeps its structure in motion.",
        },
        {
          value: "9 slices",
          label: "Equal slices for everyone",
          detail: "The 3x3 system turns pizza into a shareable interface.",
        },
      ],
    },
    cut: {
      kicker: "9 slices",
      title: "Geometry you can taste",
    },
    delivery: {
      kicker: "delivery-first culture",
      title: "Built for fast delivery",
      body:
        "90pizza starts with the route, not the table: box, heat, app visibility, and a fast handoff.",
      cards: [
        ["Box precision", "The 30x30 format sits in the box without wasted movement."],
        ["Fast handoff", "A short path from kitchen to door while keeping its structure."],
        ["App signal", "The red circle, white angle, and square read instantly."],
      ],
      partners: [
        ["Wolt", "Soon"],
        ["Glovo", "Soon"],
      ],
    },
    menu: {
      kicker: "menu system",
      title: "Six squares. One precise format.",
      body: "The menu stays part of the product system: every pizza is 30x30, cut into 9 equal slices.",
      items: [
        ["Ninety Margherita", "ნაინთი მარგარიტა", "San Marzano, fior di latte, basil oil", "24 GEL"],
        ["Pepperoni Grid", "პეპერონი გრიდი", "Pepperoni, mozzarella, chili honey", "29 GEL"],
        ["Four Cheese", "ოთხი ყველი", "Mozzarella, gorgonzola, ricotta, parmesan", "28 GEL"],
        ["Mushroom Square", "მაშრუმ სქუერი", "Roasted mushrooms, scamorza, garlic cream", "27 GEL"],
        ["Spicy Corner", "სპაისი ქორნერი", "Nduja, chili, red pepper, hot oil", "31 GEL"],
        ["Veggie Grid", "ვეგი გრიდი", "Colorful vegetables, mozzarella, green oil", "26 GEL"],
      ],
    },
    footer: {
      slogan: "Pizza at the right angle",
      instagram: "Instagram",
      language: "GE / EN",
    },
  },
};

function LanguageSwitcher({
  lang,
  setLang,
}: {
  lang: Language;
  setLang: (language: Language) => void;
}) {
  return (
    <div className="flex border border-white/10 bg-white/5 p-1 backdrop-blur-xl" aria-label="Language switcher">
      {(["ge", "en"] as const).map((language) => (
        <button
          key={language}
          type="button"
          onClick={() => setLang(language)}
          aria-pressed={lang === language}
          className={`px-3 py-2 text-xs font-black uppercase transition ${
            lang === language ? "bg-pizzaRed text-white" : "text-white/50 hover:text-white"
          }`}
        >
          {language === "ge" ? "GE" : "EN"}
        </button>
      ))}
    </div>
  );
}

function Kicker({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`inline-flex items-center gap-3 text-xs font-black uppercase ${light ? "text-white/62" : "text-pizzaRed"}`}>
      <span className={`h-px w-9 ${light ? "bg-white/40" : "bg-pizzaRed"}`} />
      {children}
    </p>
  );
}

function HeroPizza({
  copy,
  scale,
}: {
  copy: HeroVisualCopy;
  scale: MotionValue<number>;
}) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[620px]">
      <motion.div
        className="absolute inset-[4%] border border-white/10 bg-white/[0.025]"
        style={{ scale }}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-[10%] border border-pizzaRed/35"
        style={{ scale }}
        animate={{ rotate: [0, 1.6, 0, -1.2, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-[14%] overflow-hidden bg-[#d99a48] p-[5%] shadow-[0_42px_150px_rgba(224,16,16,0.28)]"
        style={{ scale }}
        animate={{ y: [0, -10, 0], rotate: [0, 1.2, 0] }}
        transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative h-full w-full overflow-hidden bg-[#b21d16]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,0.34),transparent_10%),radial-gradient(circle_at_68%_32%,rgba(255,255,255,0.28),transparent_11%),radial-gradient(circle_at_46%_66%,rgba(255,255,255,0.32),transparent_12%),radial-gradient(circle_at_72%_70%,rgba(83,133,45,0.9),transparent_7%),radial-gradient(circle_at_24%_62%,rgba(83,133,45,0.88),transparent_7%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,220,122,0.5),transparent_42%),linear-gradient(45deg,transparent_58%,rgba(255,255,255,0.22))]" />
          <div className="slice-grid absolute inset-0 opacity-38" />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/20" />
        </div>
      </motion.div>
      <motion.div
        className="absolute left-0 top-10 border border-white/10 bg-black/72 px-4 py-3 text-white backdrop-blur-xl"
        initial={{ opacity: 0, x: -18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <p className="text-xs font-black uppercase text-white/45">{copy.rotation}</p>
        <p className="mt-1 text-2xl font-black text-pizzaRed">90°</p>
      </motion.div>
      <motion.div
        className="absolute bottom-8 right-0 border border-white/10 bg-white px-4 py-3 text-pizzaBlack shadow-redGlow"
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.64, duration: 0.6 }}
      >
        <p className="text-sm font-black">{copy.size}</p>
        <p className="text-xs font-bold text-pizzaBlack/55">{copy.slices}</p>
      </motion.div>
      <motion.div
        className="absolute -right-2 top-0 h-20 w-20 border-r-4 border-t-4 border-pizzaRed"
        animate={{ rotate: [0, 90, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

export default function LandingPage() {
  const [lang, setLang] = useState<Language>("ge");
  const t = translations[lang];
  const heroRef = useRef<HTMLElement>(null);
  const cutRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll();
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const { scrollYProgress: cutProgress } = useScroll({
    target: cutRef,
    offset: ["start end", "end center"],
  });
  const pizzaScale = useTransform(heroProgress, [0, 1], [1, 0.84]);
  const heroTextY = useTransform(heroProgress, [0, 1], [0, -110]);
  const orbitRotate = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const cutCellOpacity = useTransform(cutProgress, [0, 0.35, 1], [0.18, 0.72, 1]);

  return (
    <main className="min-h-screen overflow-hidden bg-pizzaBlack text-white">
      <section ref={heroRef} className="relative min-h-screen bg-pizzaBlack">
        <div className="relative min-h-screen overflow-hidden">
          <div className="absolute inset-0 bg-geometry-field" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_24%,rgba(224,16,16,0.28),transparent_32%)]" />
          <motion.div
            className="absolute left-1/2 top-1/2 h-[78vmin] w-[78vmin] -translate-x-1/2 -translate-y-1/2 border border-pizzaRed/22"
            style={{ rotate: orbitRotate }}
          />
          <motion.div
            className="absolute bottom-[10%] left-[7%] h-24 w-24 border-b-4 border-l-4 border-white/12"
            style={{ rotate: orbitRotate }}
          />

          <div className="absolute inset-x-0 top-0 z-20 border-b border-white/10 bg-black/44 backdrop-blur-xl">
            <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
              <a href="#" className="flex items-center gap-3" aria-label={t.nav.homeLabel}>
                <Image
                  src="/images/90pizza-logo.png"
                  alt=""
                  width={44}
                  height={44}
                  priority
                  className="h-11 w-11 rounded-full object-cover"
                />
                <span className="text-lg font-black">90pizza</span>
              </a>
              <div className="hidden items-center gap-7 text-xs font-black uppercase text-white/48 md:flex">
                <a href="#story" className="transition hover:text-white">{t.nav.angle}</a>
                <a href="#story" className="transition hover:text-white">{t.nav.format}</a>
                <a href="#cut" className="transition hover:text-white">{t.nav.slices}</a>
                <a href="#menu" className="transition hover:text-white">{t.nav.menu}</a>
                <a href="#delivery" className="transition hover:text-white">{t.nav.delivery}</a>
              </div>
              <LanguageSwitcher lang={lang} setLang={setLang} />
            </nav>
          </div>

          <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-5 pb-12 pt-28 sm:px-8 lg:grid-cols-[0.92fr_1.08fr]">
            <motion.div style={{ y: heroTextY }} className="max-w-3xl">
              <motion.p
                className="mb-5 inline-flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-2 text-xs font-black uppercase text-white/64 backdrop-blur-xl"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
              >
                <Sparkles className="h-4 w-4 text-pizzaRed" />
                {t.hero.eyebrow}
              </motion.p>
              <motion.h1
                className="text-7xl font-black leading-[0.78] sm:text-8xl lg:text-9xl"
                initial={{ opacity: 0, y: 34 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
              >
                {t.hero.title}
              </motion.h1>
              <motion.p
                className="mt-6 max-w-2xl text-3xl font-black leading-tight text-pizzaRed sm:text-5xl"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16, duration: 0.62 }}
              >
                {t.hero.headline}
              </motion.p>
              <motion.p
                className="mt-6 max-w-xl text-base leading-8 text-white/64 sm:text-lg"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24, duration: 0.62 }}
              >
                {t.hero.body}
              </motion.p>
              <motion.div
                className="mt-8 grid gap-3 sm:flex"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.58 }}
              >
                <a
                  href="#menu"
                  className="inline-flex items-center justify-center gap-2 bg-pizzaRed px-5 py-4 text-sm font-black uppercase text-white shadow-redGlow transition hover:bg-white hover:text-black"
                >
                  {t.hero.menuCta}
                  <MoveRight className="h-4 w-4" />
                </a>
                <a
                  href="#delivery"
                  className="inline-flex items-center justify-center gap-2 border border-white/15 bg-white/5 px-5 py-4 text-sm font-black uppercase text-white backdrop-blur-xl transition hover:border-pizzaRed hover:text-pizzaRed"
                >
                  {t.hero.woltCta}
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </motion.div>
              <div className="mt-10 grid max-w-xl grid-cols-3 border-y border-white/10">
                {t.hero.metrics.map((metric) => (
                  <div key={metric} className="py-5">
                    <p className="text-sm font-black uppercase text-white/58 sm:text-base">{metric}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <HeroPizza copy={t.visual} scale={pizzaScale} />
          </div>
        </div>
      </section>

      <section id="story" className="relative bg-pizzaBlack px-5 py-24 sm:px-8 lg:py-36">
        <div className="absolute inset-0 bg-dark-grid opacity-70" />
        <div className="relative mx-auto max-w-7xl">
          <Kicker>{t.storytelling.kicker}</Kicker>
          <h2 className="mt-5 max-w-4xl text-5xl font-black leading-none sm:text-7xl">
            {t.storytelling.intro}
          </h2>
          <div className="mt-14 grid gap-5">
            {t.storytelling.blocks.map((block, index) => {
              const Icon = storyIcons[index];

              return (
                <motion.article
                  key={block.value}
                  className="group relative overflow-hidden border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl md:grid md:grid-cols-[0.46fr_0.54fr] md:p-8"
                  initial={{ opacity: 0, y: 36 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-120px" }}
                  transition={{ delay: index * 0.08, duration: 0.58 }}
                >
                  <div className="absolute right-6 top-6 h-16 w-16 border-r-4 border-t-4 border-pizzaRed/60 transition group-hover:rotate-90" />
                  <div>
                    <Icon className="h-7 w-7 text-pizzaRed" />
                    <p className="mt-10 text-7xl font-black leading-none text-pizzaRed sm:text-8xl">
                      {block.value}
                    </p>
                  </div>
                  <div className="mt-8 md:mt-0 md:self-end">
                    <h3 className="text-3xl font-black leading-tight sm:text-5xl">{block.label}</h3>
                    <p className="mt-5 max-w-xl text-base leading-8 text-white/62">{block.detail}</p>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section ref={cutRef} id="cut" className="relative bg-white px-5 py-24 text-black sm:px-8 lg:py-36">
        <div className="absolute inset-0 bg-paper-grid opacity-90" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.78fr_1fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.6 }}
          >
            <Kicker>{t.cut.kicker}</Kicker>
            <h2 className="mt-5 max-w-2xl text-5xl font-black leading-none sm:text-7xl">
              {t.cut.title}
            </h2>
          </motion.div>

          <motion.div
            className="relative aspect-square bg-pizzaBlack p-4 shadow-[0_42px_120px_rgba(17,17,17,0.22)]"
            style={{ opacity: cutCellOpacity }}
          >
            <div className="relative h-full w-full overflow-hidden bg-kraft">
              <Image
                src="/images/pepperoni-square-uncut.png"
                alt=""
                fill
                sizes="(max-width: 768px) 92vw, 620px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/10" />
            </div>
            {[1, 2].map((line) => (
              <motion.div
                key={`v-${line}`}
                className="absolute bottom-4 top-4 w-[5px] -translate-x-1/2 bg-white shadow-[0_0_18px_rgba(255,255,255,0.6)]"
                style={{ left: `calc(1rem + (100% - 2rem) * ${line / 3})` }}
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ delay: line * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              />
            ))}
            {[1, 2].map((line) => (
              <motion.div
                key={`h-${line}`}
                className="absolute left-4 right-4 h-[5px] -translate-y-1/2 bg-white shadow-[0_0_18px_rgba(255,255,255,0.6)]"
                style={{ top: `calc(1rem + (100% - 2rem) * ${line / 3})` }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ delay: line * 0.08 + 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              />
            ))}
          </motion.div>
        </div>
      </section>

      <section id="delivery" className="relative overflow-hidden bg-[#0a0a0a] px-5 py-24 sm:px-8 lg:py-36">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(224,16,16,0.24),transparent_34%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-end">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.6 }}
            >
              <Kicker>{t.delivery.kicker}</Kicker>
              <h2 className="mt-5 max-w-3xl text-5xl font-black leading-none sm:text-7xl">
                {t.delivery.title}
              </h2>
            </motion.div>
            <motion.p
              className="max-w-2xl text-lg leading-9 text-white/62"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ delay: 0.08, duration: 0.6 }}
            >
              {t.delivery.body}
            </motion.p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {t.delivery.cards.map((card, index) => {
              const Icon = deliveryIcons[index];

              return (
                <motion.article
                  key={card[0]}
                  className="group min-h-72 border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition hover:-translate-y-2 hover:border-pizzaRed"
                  initial={{ opacity: 0, y: 34 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-120px" }}
                  transition={{ delay: index * 0.08, duration: 0.55 }}
                  whileHover={{ rotate: index === 1 ? -1.5 : 1.5 }}
                >
                  <Icon className="h-8 w-8 text-pizzaRed" />
                  <p className="mt-16 text-3xl font-black">{card[0]}</p>
                  <p className="mt-4 text-sm font-semibold leading-7 text-white/58">{card[1]}</p>
                </motion.article>
              );
            })}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {t.delivery.partners.map(([partner, soon], index) => (
              <motion.div
                key={partner}
                className="flex items-center justify-between border border-white/10 bg-white px-5 py-5 text-black"
                initial={{ opacity: 0, x: index === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ delay: index * 0.08, duration: 0.55 }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center bg-pizzaRed text-white">
                    <Bike className="h-5 w-5" />
                  </span>
                  <p className="text-3xl font-black">{partner}</p>
                </div>
                <p className="text-xs font-black uppercase text-black/45">{soon}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="menu" className="relative bg-pizzaBlack px-5 py-24 text-white sm:px-8 lg:py-36">
        <div className="absolute inset-0 bg-dark-grid opacity-70" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <Kicker>{t.menu.kicker}</Kicker>
              <h2 className="mt-5 max-w-3xl text-5xl font-black leading-none sm:text-7xl">
                {t.menu.title}
              </h2>
            </div>
            <p className="max-w-2xl text-lg leading-9 text-white/62">{t.menu.body}</p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {t.menu.items.map(([name, translation, detail, price], index) => (
              <motion.article
                key={name}
                className="group border border-white/10 bg-white p-4 text-pizzaBlack transition hover:-translate-y-2 hover:border-pizzaRed hover:shadow-redGlow"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.045, duration: 0.5 }}
              >
                <div className="relative aspect-square overflow-hidden bg-kraft">
                  <Image
                    src={menuPhotoPaths[index]}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 92vw, (max-width: 1280px) 45vw, 30vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                  <div className="absolute left-3 top-3 h-12 w-12 border-l-4 border-t-4 border-pizzaRed" />
                </div>
                <div className="p-2 pt-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-3xl font-black leading-tight">{name}</h3>
                      <p className="mt-1 text-sm font-black text-pizzaRed">{translation}</p>
                    </div>
                    <p className="shrink-0 bg-softGray px-3 py-2 text-sm font-black text-pizzaBlack">
                      {price}
                    </p>
                  </div>
                  <p className="mt-4 text-sm font-semibold leading-6 text-pizzaBlack/62">{detail}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#050505] px-5 py-10 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/images/90pizza-logo.png"
              alt=""
              width={46}
              height={46}
              className="h-11 w-11 rounded-full object-cover"
            />
            <div>
              <p className="text-2xl font-black">90pizza</p>
              <p className="mt-1 text-sm font-semibold text-white/50">{t.footer.slogan}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-black text-white/52">
            <a href="#" className="hover:text-white">90pizza.ge</a>
            <a href="#" className="hover:text-white">90pizza.co</a>
            <a href="#" className="hover:text-white">{t.footer.instagram}</a>
            <span>{t.footer.language}</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-3 text-sm font-black text-black">
            <Box className="h-4 w-4 text-pizzaRed" />
            30×30 / 9
          </div>
        </div>
      </footer>
    </main>
  );
}
