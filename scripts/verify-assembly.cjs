const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const source = ts.transpileModule(
  fs.readFileSync(
    path.join(__dirname, "../components/detour/scene-math.ts"),
    "utf8",
  ),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
const scope = { exports: {} };
vm.runInNewContext(source, scope);
const { assemblyAt, chapterFor, chapterTargets } = scope.exports;
const near = (a, b) => assert(Math.abs(a - b) < 0.00001);
near(assemblyAt(0, 0).formation, 0);
near(assemblyAt(0, 4.65).formation, 1);
assert(assemblyAt(0, 2).water > 0.9);
assert(assemblyAt(0, 3).hands > 0.9);
near(assemblyAt(0.14, 6).form, 0);
near(assemblyAt(0.34, 6).form, 1);
near(assemblyAt(0.43, 6).topping, 0.43);
near(assemblyAt(0.53, 6).topping, 0.75);
near(assemblyAt(0.61, 6).topping, 1);
near(assemblyAt(0.68, 6).oven, 1);
near(assemblyAt(0.78, 6).oven, 0);
near(assemblyAt(0.72, 6).bake, 1);
near(assemblyAt(0.725, 6).handoff, 1);
assert(assemblyAt(0.86, 6).lift > 0.9);
near(assemblyAt(0.86, 6).release, 0);
near(assemblyAt(0.89, 6).release, 1);
near(assemblyAt(0.925, 6).lift, 0);
near(assemblyAt(0.95, 6).box, 1);
near(assemblyAt(0.997, 6).lid, 1);
chapterTargets.forEach((p, i) => assert.equal(chapterFor(p), i));
for (const p of [
  0, 0.14, 0.34, 0.43, 0.53, 0.61, 0.645, 0.69, 0.72, 0.725, 0.75, 0.78, 0.815,
  0.87, 0.89, 0.91, 0.915, 0.95, 0.96, 0.997, 1,
]) {
  const a = assemblyAt(p - 0.000001, 6),
    b = assemblyAt(p + 0.000001, 6);
  for (const k of Object.keys(a))
    assert(Math.abs(a[k] - b[k]) < 0.001, `${k} jumps at ${p}`);
}
for (let i = 0; i <= 1000; i++)
  for (const [k, v] of Object.entries(assemblyAt(i / 1000, 6))) {
    assert(Number.isFinite(v));
    if (k !== "time") assert(v >= 0 && v <= 1, `${k} out of range`);
  }
console.log(
  "Approved story: six chapters, water/hands, oven, one lift, release and lid closure passed.",
);
