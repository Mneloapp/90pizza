"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowUpRight,
  Bike,
  Box,
  CheckCircle2,
  Clock3,
  Flame,
  Grid3X3,
  MapPin,
  MoveRight,
  PackageCheck,
  Ruler,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

const menuItems = [
  {
    name: "Ninety Margherita",
    detail: "San Marzano tomato, fior di latte, basil oil, sea salt",
    accent: "Classic",
    price: "24 GEL",
    offset: "object-[52%_48%]",
  },
  {
    name: "Pepperoni Grid",
    detail: "Cupped pepperoni, mozzarella, chili honey, oregano",
    accent: "Signature",
    price: "29 GEL",
    offset: "object-[42%_48%]",
  },
  {
    name: "Kraft Mushroom",
    detail: "Roasted mushrooms, smoked scamorza, thyme, garlic cream",
    accent: "Earthy",
    price: "27 GEL",
    offset: "object-[64%_42%]",
  },
  {
    name: "Red Corner",
    detail: "Nduja, stracciatella, red onion, oregano, hot oil",
    accent: "Spicy",
    price: "31 GEL",
    offset: "object-[38%_62%]",
  },
  {
    name: "White Square",
    detail: "Ricotta cream, garlic, mozzarella, lemon zest, parsley",
    accent: "Creamy",
    price: "26 GEL",
    offset: "object-[58%_66%]",
  },
  {
    name: "Delivery Deluxe",
    detail: "Prosciutto cotto, olives, peppers, aged cheese, red sauce",
    accent: "Loaded",
    price: "32 GEL",
    offset: "object-[50%_54%]",
  },
];

const galleryTiles = [
  { title: "Crisp corner pull", className: "md:row-span-2", image: "object-[40%_52%]" },
  { title: "Nine equal bites", className: "", image: "object-[56%_46%]" },
  { title: "Kraft box reveal", className: "", image: "object-[68%_40%]" },
  { title: "Red delivery seal", className: "", image: "object-[38%_68%]" },
  { title: "30 cm edge", className: "", image: "object-[64%_66%]" },
  { title: "Hot slice stack", className: "md:row-span-2", image: "object-[48%_50%]" },
];

const statCards = [
  {
    value: "30x30",
    label: "centimeter square",
    detail: "A box-friendly footprint with edge-to-edge topping coverage.",
    icon: Ruler,
  },
  {
    value: "9",
    label: "equal slices",
    detail: "A precise 3x3 grid, so every person gets a proper corner.",
    icon: Grid3X3,
  },
  {
    value: "90",
    label: "degree corners",
    detail: "The geometry behind the name, the box, and the brand system.",
    icon: CheckCircle2,
  },
];

const deliveryPartners = [
  {
    name: "Wolt",
    detail: "Launch channel for fast city delivery.",
    eta: "Coming soon",
  },
  {
    name: "Glovo",
    detail: "Built for easy reorder and late-night drops.",
    eta: "Coming soon",
  },
];

const storyPoints = [
  "Square format for cleaner packaging",
  "Nine-slice grid for fair sharing",
  "Bold red system made for delivery apps",
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

function SectionKicker({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p
      className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] ${
        light ? "text-white/70" : "text-pizzaRed"
      }`}
    >
      <span className={`h-2 w-2 ${light ? "bg-white" : "bg-pizzaRed"}`} />
      {children}
    </p>
  );
}

function SquarePizzaVisual() {
  return (
    <motion.div
      className="relative mx-auto aspect-square w-full max-w-[330px] sm:max-w-[470px] lg:max-w-[590px]"
      initial={{ opacity: 0, rotate: -4, scale: 0.9 }}
      animate={{ opacity: 1, rotate: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="absolute inset-8 bg-kraft shadow-premium"
        animate={{ rotate: [2, -1.2, 2] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-3 top-7 hidden bg-pizzaBlack px-4 py-3 text-white shadow-premium sm:block"
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.55, duration: 0.55 }}
      >
        <p className="text-xs font-black uppercase text-white/48">hot hold</p>
        <p className="text-lg font-black">Box-fit</p>
      </motion.div>
      <motion.div
        className="pizza-mask absolute inset-0 overflow-hidden bg-pizzaBlack shadow-redGlow"
        animate={{ y: [0, -12, 0], rotate: [0, 0.8, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src="/images/square-pizza-hero.png"
          alt="Square 90pizza cut into nine equal slices"
          fill
          priority
          sizes="(max-width: 768px) 92vw, 590px"
          className="object-cover"
        />
        <motion.div
          className="slice-grid absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.16, 0.55, 0.24] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-pizzaBlack/25 via-transparent to-white/25" />
      </motion.div>
      <motion.div
        className="absolute -bottom-4 -left-1 bg-white px-4 py-3 shadow-premium sm:-left-6 sm:px-5 sm:py-4"
        initial={{ opacity: 0, x: -18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.45, duration: 0.55 }}
      >
        <p className="text-sm font-black text-pizzaBlack sm:text-base">30x30 cm</p>
        <p className="text-xs font-semibold text-pizzaBlack/55">9 equal slices</p>
      </motion.div>
      <motion.div
        className="absolute -bottom-9 right-4 flex items-center gap-2 bg-pizzaRed px-4 py-3 text-white shadow-redGlow sm:right-12"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.55 }}
      >
        <Flame className="h-4 w-4" />
        <span className="text-xs font-black uppercase">Arrives hot</span>
      </motion.div>
    </motion.div>
  );
}

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.45], [0, 130]);
  const heroRotate = useTransform(scrollYProgress, [0, 0.45], [0, 8]);

  return (
    <main className="min-h-screen overflow-hidden bg-white text-pizzaBlack">
      <section className="relative min-h-screen bg-softGray">
        <div className="absolute inset-0 bg-paper-grid" />
        <motion.div
          className="absolute right-[-22vw] top-[-20vw] hidden h-[48vw] w-[48vw] border-[44px] border-pizzaRed/10 md:block"
          style={{ y: heroY, rotate: heroRotate }}
        />
        <div className="absolute bottom-0 left-0 hidden h-28 w-full bg-white lg:block" />

        <nav className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8 sm:py-6">
          <a href="#" className="flex items-center gap-3" aria-label="90pizza home">
            <span className="flex h-11 w-11 items-center justify-center bg-pizzaRed text-lg font-black text-white shadow-redGlow">
              90
            </span>
            <span className="text-xl font-black">pizza</span>
          </a>
          <div className="hidden items-center gap-7 text-sm font-black uppercase tracking-[0.14em] text-pizzaBlack/55 md:flex">
            <a href="#concept" className="transition hover:text-pizzaRed">
              Concept
            </a>
            <a href="#menu" className="transition hover:text-pizzaRed">
              Menu
            </a>
            <a href="#delivery" className="transition hover:text-pizzaRed">
              Delivery
            </a>
          </div>
          <a
            href="#delivery"
            className="group inline-flex items-center gap-2 bg-pizzaBlack px-4 py-3 text-sm font-bold text-white transition hover:bg-pizzaRed"
          >
            Order soon
            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </nav>

        <div className="relative z-10 mx-auto grid min-h-[calc(100vh-84px)] w-full max-w-7xl items-center gap-14 px-5 pb-16 pt-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:pb-28">
          <motion.div
            className="max-w-3xl"
            initial="hidden"
            animate="show"
            transition={{ staggerChildren: 0.1 }}
          >
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.52 }}
              className="mb-6 inline-flex items-center gap-2 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-pizzaRed shadow-sm"
            >
              <Sparkles className="h-4 w-4" />
              Delivery-first square pizza
            </motion.p>
            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[760px] text-6xl font-black leading-[0.88] sm:text-7xl lg:text-8xl"
            >
              90pizza
            </motion.h1>
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.62 }}
              className="mt-5 text-3xl font-black leading-tight text-pizzaRed sm:text-4xl"
            >
              Pizza at the right angle
            </motion.p>
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.62 }}
              className="mt-6 max-w-xl text-base leading-7 text-pizzaBlack/68 sm:text-lg sm:leading-8"
            >
              A premium 30x30 cm square pizza engineered for clean sharing, crisp
              corners, and delivery boxes that open exactly like the photo.
            </motion.p>
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.58 }}
              className="mt-8 grid gap-3 sm:flex"
            >
              <a
                href="#menu"
                className="inline-flex items-center justify-center gap-2 bg-pizzaRed px-5 py-4 text-sm font-black uppercase tracking-[0.08em] text-white shadow-redGlow transition hover:-translate-y-0.5 hover:bg-pizzaBlack sm:px-6"
              >
                View menu
                <MoveRight className="h-4 w-4" />
              </a>
              <a
                href="#concept"
                className="inline-flex items-center justify-center gap-2 border-2 border-pizzaBlack bg-white/40 px-5 py-4 text-sm font-black uppercase tracking-[0.08em] backdrop-blur transition hover:-translate-y-0.5 hover:border-pizzaRed hover:text-pizzaRed sm:px-6"
              >
                See the square
                <Grid3X3 className="h-4 w-4" />
              </a>
            </motion.div>
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.58 }}
              className="mt-8 grid max-w-lg grid-cols-3 border-y border-pizzaBlack/10 py-4"
            >
              {["30x30 cm", "9 slices", "Wolt + Glovo"].map((item) => (
                <p key={item} className="text-xs font-black uppercase tracking-[0.1em] text-pizzaBlack/50">
                  {item}
                </p>
              ))}
            </motion.div>
          </motion.div>

          <SquarePizzaVisual />
        </div>
      </section>

      <section id="concept" className="bg-white px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.76fr_1.24fr] lg:items-end">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
          >
            <SectionKicker>The concept</SectionKicker>
            <h2 className="mt-4 max-w-xl text-4xl font-black leading-tight sm:text-5xl">
              One square. Nine fair slices. Zero pizza math.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-8 text-pizzaBlack/64">
              The product system starts with geometry: a square bake, a clean 3x3
              cut, and a delivery box that protects the crust instead of fighting it.
            </p>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-3">
            {statCards.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.value}
                  className="group border border-pizzaBlack/10 bg-softGray p-6 transition hover:-translate-y-1 hover:border-pizzaRed hover:bg-white hover:shadow-premium"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ delay: index * 0.08, duration: 0.5 }}
                >
                  <span className="mb-8 flex h-11 w-11 items-center justify-center bg-white text-pizzaRed shadow-sm transition group-hover:bg-pizzaRed group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="text-4xl font-black text-pizzaRed">{item.value}</p>
                  <p className="mt-2 text-sm font-black uppercase tracking-[0.12em] text-pizzaBlack">
                    {item.label}
                  </p>
                  <p className="mt-4 text-sm font-semibold leading-6 text-pizzaBlack/62">
                    {item.detail}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="menu" className="relative bg-pizzaBlack px-5 py-20 text-white sm:px-8 lg:py-28">
        <div className="absolute inset-0 bg-dark-grid" />
        <div className="relative mx-auto max-w-7xl">
          <motion.div
            className="flex flex-col justify-between gap-6 md:flex-row md:items-end"
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
          >
            <div>
              <SectionKicker light>Menu showcase</SectionKicker>
              <h2 className="mt-4 max-w-2xl text-4xl font-black leading-tight sm:text-5xl">
                Six square signatures for the first drop.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-white/62">
              High-contrast toppings, crisp edges, and slices that hold their shape
              from kitchen rail to apartment door.
            </p>
          </motion.div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {menuItems.map((item, index) => (
              <motion.article
                key={item.name}
                className="group border border-white/10 bg-white p-4 text-pizzaBlack transition hover:-translate-y-1 hover:border-pizzaRed hover:shadow-redGlow sm:p-5"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.05, duration: 0.45 }}
              >
                <div className="relative mb-5 aspect-[1.08] overflow-hidden bg-kraft">
                  <Image
                    src="/images/square-pizza-hero.png"
                    alt=""
                    fill
                    sizes="(max-width: 768px) 92vw, (max-width: 1280px) 45vw, 30vw"
                    className={`object-cover transition duration-700 group-hover:scale-110 ${item.offset}`}
                  />
                  <div className="slice-grid absolute inset-0 opacity-40" />
                  <div className="absolute inset-0 bg-gradient-to-t from-pizzaBlack/50 via-transparent to-transparent" />
                  <span className="absolute left-3 top-3 bg-pizzaRed px-3 py-2 text-xs font-black uppercase text-white">
                    {item.accent}
                  </span>
                  <span className="absolute bottom-3 right-3 bg-white px-3 py-2 text-xs font-black uppercase text-pizzaBlack">
                    {item.price}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black">{item.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-pizzaBlack/62">{item.detail}</p>
                  </div>
                  <Star className="mt-1 h-5 w-5 shrink-0 fill-pizzaRed text-pizzaRed" />
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="delivery" className="bg-softGray px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
          >
            <SectionKicker>Delivery first</SectionKicker>
            <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              Designed to travel square.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-pizzaBlack/68">
              90pizza is made for delivery from the first sketch: a tighter box,
              stronger heat retention, and a 3x3 grid that stays neat on the move.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["Box locked", PackageCheck],
                ["Fast handoff", Clock3],
                ["City ready", MapPin],
              ].map(([label, Icon]) => {
                const DeliveryIcon = Icon as typeof PackageCheck;

                return (
                  <div key={label as string} className="flex items-center gap-3 bg-white p-4 shadow-sm">
                    <DeliveryIcon className="h-5 w-5 text-pizzaRed" />
                    <span className="text-sm font-black">{label as string}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2">
            {deliveryPartners.map((partner, index) => (
              <motion.a
                href="#"
                key={partner.name}
                className="group flex min-h-72 flex-col justify-between overflow-hidden bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-premium"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center bg-pizzaRed text-white">
                    <Bike className="h-6 w-6" />
                  </span>
                  <span className="bg-softGray px-3 py-2 text-xs font-black uppercase text-pizzaBlack/55">
                    Partner
                  </span>
                </div>
                <div>
                  <p className="text-4xl font-black">{partner.name}</p>
                  <p className="mt-3 max-w-xs text-sm font-semibold leading-6 text-pizzaBlack/58">
                    {partner.detail}
                  </p>
                  <p className="mt-6 flex items-center gap-2 text-sm font-black uppercase tracking-[0.1em] text-pizzaRed">
                    {partner.eta}
                    <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </p>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      <section className="grain bg-kraft px-5 py-20 text-white sm:px-8 lg:py-28">
        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
          >
            <SectionKicker light>Brand story</SectionKicker>
            <h2 className="mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
              A pizza brand built around the most satisfying angle in the box.
            </h2>
          </motion.div>
          <motion.div
            className="space-y-6 text-base leading-8 text-white/84"
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.08, duration: 0.55 }}
          >
            <p>
              90pizza starts with a simple product decision. Make the pizza square,
              cut it into nine, and every order becomes cleaner, more shareable, and
              easier to deliver beautifully.
            </p>
            <div className="grid gap-3">
              {storyPoints.map((point) => (
                <div key={point} className="flex items-center gap-3 border border-white/16 bg-white/8 p-4">
                  <ShieldCheck className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-black uppercase tracking-[0.08em]">{point}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <motion.div
            className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end"
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
          >
            <div>
              <SectionKicker>Gallery</SectionKicker>
              <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
                Square by sight.
              </h2>
            </div>
            <div className="flex gap-3">
              {[PackageCheck, Clock3, MapPin].map((Icon, index) => (
                <span
                  key={index}
                  className="flex h-12 w-12 items-center justify-center border border-pizzaBlack/10 bg-softGray"
                >
                  <Icon className="h-5 w-5 text-pizzaRed" />
                </span>
              ))}
            </div>
          </motion.div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {galleryTiles.map((tile, index) => (
              <motion.div
                key={tile.title}
                className={`relative min-h-48 overflow-hidden bg-softGray md:min-h-64 ${tile.className}`}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.05, duration: 0.45 }}
              >
                <Image
                  src="/images/square-pizza-hero.png"
                  alt=""
                  fill
                  sizes="(max-width: 768px) 48vw, 31vw"
                  className={`object-cover transition duration-700 hover:scale-110 ${tile.image}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-pizzaBlack/82 via-pizzaBlack/14 to-transparent" />
                <p className="absolute bottom-4 left-4 right-4 text-sm font-black uppercase tracking-[0.1em] text-white">
                  {tile.title}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-pizzaBlack px-5 py-10 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-3xl font-black">90pizza</p>
            <p className="mt-2 text-sm font-semibold text-white/55">
              Pizza at the right angle
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-bold text-white/65">
            <a href="#concept" className="hover:text-white">
              Concept
            </a>
            <a href="#menu" className="hover:text-white">
              Menu
            </a>
            <a href="#delivery" className="hover:text-white">
              Delivery
            </a>
          </div>
          <div className="flex w-fit items-center gap-2 bg-white px-4 py-3 text-sm font-black text-pizzaBlack">
            <Box className="h-4 w-4 text-pizzaRed" />
            30x30 / 9 slices
          </div>
        </div>
      </footer>
    </main>
  );
}
