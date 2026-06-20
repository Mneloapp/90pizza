"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, type MotionValue, useScroll, useTransform } from "framer-motion";
import {
  ArrowUpRight,
  Bike,
  Box,
  Clock3,
  Crosshair,
  Grid3X3,
  Layers3,
  MoveRight,
  PackageCheck,
  Ruler,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";

type Language = "ge" | "en";

const translations = {
  ge: {
    nav: {
      concept: "კუთხე",
      thirty: "30×30",
      slices: "9 ნაჭერი",
      delivery: "მიტანა",
      order: "შეკვეთა მალე",
      homeLabel: "90pizza მთავარი",
    },
    hero: {
      eyebrow: "geometry-driven pizza",
      title: "90pizza",
      slogan: "პიცა სწორი კუთხით",
      body:
        "არა რესტორნის გვერდი. ეს არის პროდუქტის გაშვება ოთხკუთხედი პიცისთვის: 90° კუთხე, 30×30 სმ ფორმატი და 9 თანაბარი ნაჭერი, შექმნილი სწრაფი მიტანისთვის.",
      primary: "დაიწყე ისტორია",
      secondary: "ნახე 90°",
      metricA: "90°",
      metricB: "30×30",
      metricC: "9",
    },
    visual: {
      alt: "90pizza ოთხკუთხედი პიცა",
      badgeTop: "scroll rotation",
      badgeBottom: "90° system",
      size: "30×30 სმ",
      slices: "9 თანაბარი ნაჭერი",
    },
    intro: {
      kicker: "ბრენდის სისტემა",
      title: "კუთხე გახდა პროდუქტი.",
      body:
        "90pizza აშენებულია ერთ მარტივ წესზე: კვადრატი უფრო ზუსტად ჯდება ყუთში, უკეთ იყოფა და მიტანამდე ინარჩუნებს ფორმას.",
      cards: [
        ["90°", "იდენტობა", "მკვეთრი კუთხე, რომელიც ქმნის სახელს, ლოგოს და მოძრაობას."],
        ["Square", "ფორმატი", "პიცა აღარ არის წრე. ის არის ზუსტი 30×30 სმ პროდუქტი."],
        ["Delivery", "არხი", "ყოველი დეტალი გათვლილია აპიდან კარამდე გზისთვის."],
      ],
    },
    thirty: {
      kicker: "30×30 სმ",
      title: "ზომა, რომელიც ახსოვს თვალს.",
      body:
        "კომპაქტური, გაზომვადი და ყუთზე მორგებული. 30×30 სმ ქმნის პროდუქტს, რომელიც კარგად ჩანს ეკრანზე და კარგად მოგზაურობს ქალაქში.",
      labels: ["ზუსტი კიდე", "თანაბარი დაფარვა", "ყუთზე მორგება"],
    },
    slices: {
      kicker: "9 თანაბარი ნაჭერი",
      title: "3×3 grid. არანაირი pizza math.",
      body:
        "ნაჭრები ჩნდება როგორც ინტერფეისი: თანაბარი, წაკითხვადი და გაზიარებისთვის მზად. ეს არის პიცა, რომელსაც აქვს სისტემა.",
      cells: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
    },
    delivery: {
      kicker: "delivery-first",
      title: "შექმნილია სწრაფი მიტანისთვის",
      body:
        "90pizza არ იწყება მაგიდით. ის იწყება ყუთით, კურიერის მოძრაობით და იმ მომენტით, როცა მომხმარებელი აპში ხედავს სრულყოფილ კვადრატს.",
      cards: [
        ["Box-fit", "30×30 ფორმატი ყუთში ზედმეტი მოძრაობის გარეშე ჯდება."],
        ["Heat route", "მოკლე გზა სამზარეულოდან კარამდე, ფორმის დაკარგვის გარეშე."],
        ["App-ready", "წითელი, შავი და კვადრატი მიტანის აპებში მყისიერად იკითხება."],
      ],
      partners: ["Wolt", "Glovo"],
      soon: "მალე",
    },
    story: {
      kicker: "10-second memory",
      title: "ნახავ წითელ წრეს, თეთრ კუთხეს და კვადრატულ პიცას. ბრენდი უკვე დაიმახსოვრე.",
      body:
        "ეს არის 90pizza-ს იდეა: ერთი გეომეტრიული სიგნალი, ერთი პროდუქტის ფორმა და ერთი მარტივი დაპირება: პიცა, რომელიც სწორად არის დაპროექტებული მიტანისთვის.",
    },
    footer: {
      line: "90° angle / square pizza / 30×30 cm / 9 slices",
      badge: "პიცა სწორი კუთხით",
    },
  },
  en: {
    nav: {
      concept: "Angle",
      thirty: "30x30",
      slices: "9 slices",
      delivery: "Delivery",
      order: "Order soon",
      homeLabel: "90pizza home",
    },
    hero: {
      eyebrow: "geometry-driven pizza",
      title: "90pizza",
      slogan: "Pizza at the right angle",
      body:
        "Not a restaurant website. A product launch for square pizza: a 90 degree angle, a 30x30 cm format, and 9 equal slices engineered for delivery.",
      primary: "Start the story",
      secondary: "See the 90",
      metricA: "90°",
      metricB: "30x30",
      metricC: "9",
    },
    visual: {
      alt: "90pizza square pizza",
      badgeTop: "scroll rotation",
      badgeBottom: "90° system",
      size: "30x30 cm",
      slices: "9 equal slices",
    },
    intro: {
      kicker: "Brand system",
      title: "The angle became the product.",
      body:
        "90pizza is built on one simple rule: a square fits the box with more precision, divides cleaner, and keeps its shape on the way to the door.",
      cards: [
        ["90°", "Identity", "The sharp angle that drives the name, logo, and motion language."],
        ["Square", "Format", "Pizza is no longer a circle. It is a precise 30x30 cm product."],
        ["Delivery", "Channel", "Every detail is designed for the path from app to doorstep."],
      ],
    },
    thirty: {
      kicker: "30x30 cm",
      title: "A size the eye remembers.",
      body:
        "Compact, measurable, and box-native. 30x30 cm creates a product that looks sharp on screen and travels cleanly through the city.",
      labels: ["Measured edge", "Even coverage", "Box-native fit"],
    },
    slices: {
      kicker: "9 equal slices",
      title: "3x3 grid. No pizza math.",
      body:
        "Slices appear like an interface: equal, readable, and ready to share. This is pizza with a system.",
      cells: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
    },
    delivery: {
      kicker: "delivery-first",
      title: "Engineered for fast delivery",
      body:
        "90pizza does not start with a table. It starts with the box, the courier route, and the moment a customer sees a perfect square in the app.",
      cards: [
        ["Box-fit", "The 30x30 format sits in the box without wasted movement."],
        ["Heat route", "A shorter path from oven to door without losing structure."],
        ["App-ready", "Red, black, and square read instantly inside delivery apps."],
      ],
      partners: ["Wolt", "Glovo"],
      soon: "Soon",
    },
    story: {
      kicker: "10-second memory",
      title: "You see the red circle, the white angle, and the square pizza. The brand is already remembered.",
      body:
        "That is the 90pizza idea: one geometric signal, one product shape, and one simple promise: pizza designed correctly for delivery.",
    },
    footer: {
      line: "90° angle / square pizza / 30x30 cm / 9 slices",
      badge: "Pizza at the right angle",
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
          className={`px-3 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
            lang === language ? "bg-pizzaRed text-white" : "text-white/50 hover:text-white"
          }`}
        >
          {language === "ge" ? "GE" : "EN"}
        </button>
      ))}
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-pizzaRed">
      <span className="h-px w-8 bg-pizzaRed" />
      {children}
    </p>
  );
}

function HeroProduct({
  copy,
  rotate,
  scale,
}: {
  copy: (typeof translations)["ge"]["visual"];
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
}) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[640px]">
      <motion.div
        className="absolute inset-[3%] border border-white/10 bg-white/[0.03]"
        style={{ rotate, scale }}
      />
      <motion.div
        className="absolute inset-[9%] border border-pizzaRed/40"
        style={{ rotate, scale }}
      />
      <motion.div
        className="absolute inset-[15%] overflow-hidden bg-pizzaBlack shadow-[0_40px_140px_rgba(224,16,16,0.32)]"
        style={{ rotate, scale }}
      >
        <Image
          src="/images/square-pizza-hero.png"
          alt={copy.alt}
          fill
          priority
          sizes="(max-width: 768px) 92vw, 640px"
          className="object-cover"
        />
        <div className="slice-grid absolute inset-0 opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/45 via-transparent to-white/20" />
      </motion.div>
      <motion.div
        className="absolute left-0 top-10 border border-white/10 bg-black/70 px-4 py-3 text-white backdrop-blur-xl"
        initial={{ opacity: 0, x: -18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/45">{copy.badgeTop}</p>
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
        className="absolute right-4 top-0 bg-pizzaRed px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white"
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.78, duration: 0.6 }}
      >
        {copy.badgeBottom}
      </motion.div>
    </div>
  );
}

export default function LandingPage() {
  const [lang, setLang] = useState<Language>("ge");
  const t = translations[lang];
  const heroRef = useRef<HTMLElement>(null);
  const slicesRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll();
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const { scrollYProgress: slicesProgress } = useScroll({
    target: slicesRef,
    offset: ["start end", "end center"],
  });
  const pizzaRotate = useTransform(heroProgress, [0, 1], [0, 90]);
  const pizzaScale = useTransform(heroProgress, [0, 1], [1, 0.82]);
  const heroTextY = useTransform(heroProgress, [0, 1], [0, -120]);
  const orbitRotate = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const gridOpacity = useTransform(slicesProgress, [0, 0.4, 1], [0.12, 1, 1]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white">
      <section ref={heroRef} className="relative min-h-[180vh] bg-[#050505]">
        <div className="sticky top-0 min-h-screen overflow-hidden">
          <div className="absolute inset-0 bg-geometry-field" />
          <motion.div
            className="absolute left-1/2 top-1/2 h-[86vmin] w-[86vmin] -translate-x-1/2 -translate-y-1/2 border border-pizzaRed/25"
            style={{ rotate: orbitRotate }}
          />
          <div className="absolute inset-x-0 top-0 z-20 border-b border-white/10 bg-black/40 backdrop-blur-xl">
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
                <span className="text-lg font-black tracking-tight">90pizza</span>
              </a>
              <div className="hidden items-center gap-7 text-xs font-black uppercase tracking-[0.18em] text-white/46 md:flex">
                <a href="#angle" className="transition hover:text-white">
                  {t.nav.concept}
                </a>
                <a href="#thirty" className="transition hover:text-white">
                  {t.nav.thirty}
                </a>
                <a href="#slices" className="transition hover:text-white">
                  {t.nav.slices}
                </a>
                <a href="#delivery" className="transition hover:text-white">
                  {t.nav.delivery}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <LanguageSwitcher lang={lang} setLang={setLang} />
                <a
                  href="#delivery"
                  className="hidden items-center gap-2 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-pizzaRed hover:text-white sm:inline-flex"
                >
                  {t.nav.order}
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </nav>
          </div>

          <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-5 pb-12 pt-28 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
            <motion.div style={{ y: heroTextY }} className="max-w-3xl">
              <motion.p
                className="mb-5 inline-flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-white/64 backdrop-blur-xl"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
              >
                <Sparkles className="h-4 w-4 text-pizzaRed" />
                {t.hero.eyebrow}
              </motion.p>
              <motion.h1
                className="text-[clamp(4.8rem,18vw,13rem)] font-black leading-[0.76] tracking-normal"
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
                {t.hero.slogan}
              </motion.p>
              <motion.p
                className="mt-6 max-w-xl text-base leading-8 text-white/62 sm:text-lg"
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
                  href="#angle"
                  className="inline-flex items-center justify-center gap-2 bg-pizzaRed px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-white shadow-redGlow transition hover:bg-white hover:text-black"
                >
                  {t.hero.primary}
                  <MoveRight className="h-4 w-4" />
                </a>
                <a
                  href="#thirty"
                  className="inline-flex items-center justify-center gap-2 border border-white/15 bg-white/5 px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-white backdrop-blur-xl transition hover:border-pizzaRed hover:text-pizzaRed"
                >
                  {t.hero.secondary}
                  <Crosshair className="h-4 w-4" />
                </a>
              </motion.div>
              <div className="mt-10 grid max-w-xl grid-cols-3 border-y border-white/10">
                {[t.hero.metricA, t.hero.metricB, t.hero.metricC].map((metric) => (
                  <div key={metric} className="py-5">
                    <p className="text-3xl font-black text-white sm:text-4xl">{metric}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <HeroProduct copy={t.visual} rotate={pizzaRotate} scale={pizzaScale} />
          </div>
        </div>
      </section>

      <section id="angle" className="relative bg-[#050505] px-5 py-24 sm:px-8 lg:py-36">
        <div className="absolute inset-0 bg-dark-grid opacity-70" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.6 }}
            >
              <Kicker>{t.intro.kicker}</Kicker>
              <h2 className="mt-5 max-w-2xl text-5xl font-black leading-none sm:text-7xl">
                {t.intro.title}
              </h2>
            </motion.div>
            <motion.p
              className="max-w-2xl text-lg leading-9 text-white/62"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ delay: 0.08, duration: 0.6 }}
            >
              {t.intro.body}
            </motion.p>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {t.intro.cards.map(([value, label, detail], index) => (
              <motion.article
                key={value}
                className="min-h-72 border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:border-pizzaRed/70 hover:bg-white/[0.06]"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ delay: index * 0.08, duration: 0.55 }}
              >
                <p className="text-6xl font-black text-pizzaRed">{value}</p>
                <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-white/45">
                  {label}
                </p>
                <p className="mt-4 text-sm font-semibold leading-7 text-white/62">{detail}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="thirty" className="relative overflow-hidden bg-white px-5 py-24 text-black sm:px-8 lg:py-36">
        <div className="absolute inset-0 bg-paper-grid opacity-80" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.78fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 34 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.62 }}
          >
            <Kicker>{t.thirty.kicker}</Kicker>
            <h2 className="mt-5 text-[clamp(5rem,22vw,18rem)] font-black leading-[0.78] tracking-normal text-black">
              30×30
            </h2>
            <p className="mt-8 max-w-2xl text-3xl font-black leading-tight sm:text-5xl">
              {t.thirty.title}
            </p>
            <p className="mt-6 max-w-xl text-base leading-8 text-black/62">{t.thirty.body}</p>
          </motion.div>
          <motion.div
            className="relative aspect-square border-[18px] border-black bg-pizzaRed p-5 shadow-[0_40px_120px_rgba(0,0,0,0.22)]"
            initial={{ opacity: 0, rotate: -8, scale: 0.88 }}
            whileInView={{ opacity: 1, rotate: 0, scale: 1 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="h-full w-full border border-white/55 bg-black/10" />
            <div className="absolute inset-x-5 top-1/2 h-px bg-white/80" />
            <div className="absolute inset-y-5 left-1/2 w-px bg-white/80" />
            <div className="absolute -bottom-4 -right-4 bg-black px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white">
              30 cm / 30 cm
            </div>
          </motion.div>
        </div>
        <div className="relative mx-auto mt-12 grid max-w-7xl gap-3 md:grid-cols-3">
          {t.thirty.labels.map((label, index) => (
            <motion.div
              key={label}
              className="border border-black/10 bg-black px-5 py-5 text-sm font-black uppercase tracking-[0.16em] text-white"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
            >
              {label}
            </motion.div>
          ))}
        </div>
      </section>

      <section ref={slicesRef} id="slices" className="relative bg-[#050505] px-5 py-24 sm:px-8 lg:py-36">
        <div className="absolute inset-0 bg-dark-grid opacity-70" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.75fr_1fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.6 }}
          >
            <Kicker>{t.slices.kicker}</Kicker>
            <h2 className="mt-5 max-w-2xl text-5xl font-black leading-none sm:text-7xl">
              {t.slices.title}
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-white/62">{t.slices.body}</p>
          </motion.div>
          <motion.div className="grid aspect-square grid-cols-3 gap-3" style={{ opacity: gridOpacity }}>
            {t.slices.cells.map((cell, index) => (
              <motion.div
                key={cell}
                className="relative overflow-hidden border border-white/10 bg-white/[0.04]"
                initial={{ opacity: 0, scale: 0.72, rotate: -6 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ delay: index * 0.055, duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(224,16,16,0.38),transparent_58%)]" />
                <span className="absolute bottom-3 left-4 text-4xl font-black text-white/80">
                  {cell}
                </span>
              </motion.div>
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
            {[PackageCheck, Timer, ShieldCheck].map((Icon, index) => (
              <motion.article
                key={t.delivery.cards[index][0]}
                className="group min-h-72 border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition hover:-translate-y-2 hover:border-pizzaRed"
                initial={{ opacity: 0, y: 34 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ delay: index * 0.08, duration: 0.55 }}
                whileHover={{ rotate: index === 1 ? -1.5 : 1.5 }}
              >
                <Icon className="h-8 w-8 text-pizzaRed" />
                <p className="mt-16 text-3xl font-black">{t.delivery.cards[index][0]}</p>
                <p className="mt-4 text-sm font-semibold leading-7 text-white/58">
                  {t.delivery.cards[index][1]}
                </p>
              </motion.article>
            ))}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {t.delivery.partners.map((partner, index) => (
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
                <p className="text-xs font-black uppercase tracking-[0.16em] text-black/45">
                  {t.delivery.soon}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-pizzaRed px-5 py-24 text-white sm:px-8 lg:py-36">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.16)_1px,transparent_1px)] bg-[size:90px_90px]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.7fr_1fr] lg:items-center">
          <div>
            <Kicker>{t.story.kicker}</Kicker>
            <p className="mt-6 max-w-sm text-base font-semibold leading-8 text-white/76">{t.story.body}</p>
          </div>
          <motion.h2
            className="text-5xl font-black leading-[0.94] sm:text-7xl lg:text-8xl"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.65 }}
          >
            {t.story.title}
          </motion.h2>
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
              <p className="mt-1 text-sm font-semibold text-white/50">{t.footer.badge}</p>
            </div>
          </div>
          <p className="max-w-md text-sm font-black uppercase tracking-[0.18em] text-white/44">
            {t.footer.line}
          </p>
          <div className="flex items-center gap-2 bg-white px-4 py-3 text-sm font-black text-black">
            <Box className="h-4 w-4 text-pizzaRed" />
            30×30 / 9
          </div>
        </div>
      </footer>
    </main>
  );
}
