"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowUpRight,
  Bike,
  Box,
  Clock3,
  Grid3X3,
  MapPin,
  MoveRight,
  PackageCheck,
  Sparkles,
} from "lucide-react";

const menuItems = [
  {
    name: "Ninety Margherita",
    detail: "San Marzano, fior di latte, basil oil",
    accent: "Classic",
  },
  {
    name: "Pepperoni Grid",
    detail: "Cupped pepperoni, mozzarella, chili honey",
    accent: "Signature",
  },
  {
    name: "Kraft Mushroom",
    detail: "Roasted mushrooms, smoked scamorza, thyme",
    accent: "Earthy",
  },
  {
    name: "Red Corner",
    detail: "Nduja, stracciatella, red onion, oregano",
    accent: "Spicy",
  },
  {
    name: "White Square",
    detail: "Ricotta cream, garlic, mozzarella, lemon zest",
    accent: "Creamy",
  },
  {
    name: "Delivery Deluxe",
    detail: "Prosciutto cotto, olives, peppers, aged cheese",
    accent: "Loaded",
  },
];

const galleryTiles = [
  "Crisp corner pull",
  "Nine equal bites",
  "Kraft box reveal",
  "Red delivery seal",
  "30 cm edge",
  "Hot slice stack",
];

const statCards = [
  { value: "30x30", label: "centimeters of square pizza" },
  { value: "9", label: "equal slices in every box" },
  { value: "90", label: "degrees in every corner" },
];

function SquarePizzaVisual() {
  return (
    <motion.div
      className="relative mx-auto aspect-square w-full max-w-[300px] sm:max-w-[420px] md:max-w-[560px]"
      initial={{ opacity: 0, rotate: -3, scale: 0.92 }}
      animate={{ opacity: 1, rotate: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="absolute inset-5 bg-kraft shadow-premium"
        animate={{ rotate: [0, 1.2, 0, -1, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pizza-mask absolute inset-0 overflow-hidden bg-pizzaBlack shadow-redGlow"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src="/images/square-pizza-hero.png"
          alt="Square 90pizza cut into nine equal slices"
          fill
          priority
          sizes="(max-width: 768px) 92vw, 560px"
          className="object-cover"
        />
        <motion.div
          className="slice-grid absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.18, 0.5, 0.22] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/20" />
      </motion.div>
      <motion.div
        className="absolute -bottom-4 -left-3 bg-white px-4 py-3 shadow-premium"
        initial={{ opacity: 0, x: -18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.45, duration: 0.55 }}
      >
        <p className="text-sm font-black text-pizzaBlack">30x30 cm</p>
        <p className="text-xs font-semibold text-pizzaBlack/55">9 equal slices</p>
      </motion.div>
    </motion.div>
  );
}

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.45], [0, 120]);

  return (
    <main className="min-h-screen overflow-hidden bg-white text-pizzaBlack">
      <section className="relative min-h-[88vh] bg-softGray">
        <div className="absolute inset-0 bg-paper-grain" />
        <motion.div
          className="absolute right-[-18vw] top-[-18vw] hidden h-[44vw] w-[44vw] border-[42px] border-pizzaRed/10 md:block"
          style={{ y: heroY }}
        />
        <nav className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
          <a href="#" className="flex items-center gap-3" aria-label="90pizza home">
            <span className="flex h-10 w-10 items-center justify-center bg-pizzaRed text-lg font-black text-white">
              90
            </span>
            <span className="text-xl font-black">pizza</span>
          </a>
          <a
            href="#delivery"
            className="group inline-flex items-center gap-2 bg-pizzaBlack px-4 py-3 text-sm font-bold text-white transition hover:bg-pizzaRed"
          >
            Delivery
            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </nav>

        <div className="relative z-10 mx-auto grid min-h-[calc(88vh-76px)] w-full max-w-7xl items-center gap-8 px-5 pb-8 pt-4 sm:px-8 sm:pb-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="max-w-2xl">
            <motion.p
              className="mb-5 inline-flex items-center gap-2 bg-white px-3 py-2 text-xs font-black uppercase text-pizzaRed shadow-sm"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles className="h-4 w-4" />
              Delivery-first square pizza
            </motion.p>
            <motion.h1
              className="text-5xl font-black leading-[0.95] sm:text-6xl lg:text-7xl"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.65 }}
            >
              90pizza
            </motion.h1>
            <motion.p
              className="mt-5 text-2xl font-black text-pizzaRed sm:text-3xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Pizza at the right angle
            </motion.p>
            <motion.p
              className="mt-5 max-w-xl text-base leading-7 text-pizzaBlack/70 sm:mt-6 sm:text-lg sm:leading-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              A 30x30 cm square pizza built for clean sharing, better corners, and
              delivery boxes that arrive looking exactly right.
            </motion.p>
            <motion.div
              className="mt-7 flex gap-3 sm:mt-8"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.55 }}
            >
              <a
                href="#menu"
                className="inline-flex flex-1 items-center justify-center gap-2 bg-pizzaRed px-4 py-4 text-sm font-black uppercase text-white shadow-redGlow transition hover:bg-pizzaBlack sm:flex-none sm:px-6"
              >
                View menu
                <MoveRight className="h-4 w-4" />
              </a>
              <a
                href="#concept"
                className="inline-flex flex-1 items-center justify-center gap-2 border-2 border-pizzaBlack px-4 py-4 text-sm font-black uppercase transition hover:border-pizzaRed hover:text-pizzaRed sm:flex-none sm:px-6"
              >
                The square
                <Grid3X3 className="h-4 w-4" />
              </a>
            </motion.div>
          </div>
          <SquarePizzaVisual />
        </div>
      </section>

      <section id="concept" className="bg-white px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-black uppercase text-pizzaRed">The concept</p>
            <h2 className="mt-3 max-w-lg text-4xl font-black leading-tight sm:text-5xl">
              One square. Nine fair slices. Zero pizza math.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {statCards.map((item, index) => (
              <motion.div
                key={item.value}
                className="border border-pizzaBlack/10 bg-softGray p-6"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
              >
                <p className="text-4xl font-black text-pizzaRed">{item.value}</p>
                <p className="mt-4 text-sm font-semibold leading-6 text-pizzaBlack/65">
                  {item.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="menu" className="bg-pizzaBlack px-5 py-20 text-white sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase text-pizzaRed">Menu preview</p>
              <h2 className="mt-3 max-w-2xl text-4xl font-black leading-tight sm:text-5xl">
                Six squares for the first drop.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-white/60">
              Built around crisp edges, balanced toppings, and slices that keep their
              shape from kitchen to doorstep.
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {menuItems.map((item, index) => (
              <motion.article
                key={item.name}
                className="group border border-white/10 bg-white p-5 text-pizzaBlack transition hover:-translate-y-1 hover:border-pizzaRed"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.06, duration: 0.45 }}
              >
                <div className="relative mb-5 aspect-square overflow-hidden bg-kraft">
                  <Image
                    src="/images/square-pizza-hero.png"
                    alt=""
                    fill
                    sizes="(max-width: 768px) 92vw, (max-width: 1280px) 45vw, 30vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="slice-grid absolute inset-0 opacity-50" />
                  <span className="absolute left-3 top-3 bg-pizzaRed px-3 py-2 text-xs font-black uppercase text-white">
                    {item.accent}
                  </span>
                </div>
                <h3 className="text-xl font-black">{item.name}</h3>
                <p className="mt-2 text-sm leading-6 text-pizzaBlack/62">{item.detail}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="delivery" className="bg-softGray px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-black uppercase text-pizzaRed">Delivery</p>
            <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
              Designed to travel square.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-pizzaBlack/68">
              90pizza is delivery-first: a tighter footprint, stronger box fit, and
              clean 3x3 slicing for easy sharing at home, work, or late night.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {["Wolt", "Glovo"].map((partner) => (
              <motion.a
                href="#"
                key={partner}
                className="group flex min-h-56 flex-col justify-between bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-premium"
                whileHover={{ scale: 1.01 }}
              >
                <span className="flex h-12 w-12 items-center justify-center bg-pizzaRed text-white">
                  <Bike className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-3xl font-black">{partner}</p>
                  <p className="mt-2 flex items-center gap-2 text-sm font-bold text-pizzaBlack/55">
                    Coming soon
                    <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </p>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      <section className="grain bg-kraft px-5 py-20 text-white sm:px-8 lg:py-28">
        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-sm font-black uppercase">Brand story</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
              A pizza brand built around the most satisfying angle in the box.
            </h2>
          </div>
          <div className="space-y-6 text-base leading-8 text-white/82">
            <p>
              90pizza starts with a simple shape decision. Make the pizza square,
              cut it into nine, and every order becomes cleaner, more shareable, and
              easier to deliver.
            </p>
            <p>
              The brand language follows the food: bold red, black edges, kraft
              packaging, and a grid that makes every slice feel intentional.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase text-pizzaRed">Gallery</p>
              <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
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
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {galleryTiles.map((tile, index) => (
              <motion.div
                key={tile}
                className={`relative min-h-44 overflow-hidden bg-softGray md:min-h-64 ${
                  index === 0 || index === 5 ? "md:row-span-2" : ""
                }`}
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
                  className={`object-cover ${index % 2 === 0 ? "scale-110" : "scale-125"}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-pizzaBlack/80 via-pizzaBlack/10 to-transparent" />
                <p className="absolute bottom-4 left-4 right-4 text-sm font-black uppercase text-white">
                  {tile}
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
          <div className="flex flex-wrap gap-3 text-sm font-bold text-white/65">
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
          <div className="flex items-center gap-2 bg-white px-4 py-3 text-sm font-black text-pizzaBlack">
            <Box className="h-4 w-4 text-pizzaRed" />
            30x30 / 9 slices
          </div>
        </div>
      </footer>
    </main>
  );
}
