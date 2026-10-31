const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const compiled = ts.transpileModule(
  fs.readFileSync(
    path.join(__dirname, "../components/detour/scene-math.ts"),
    "utf8",
  ),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
const scope = { exports: {} };
vm.runInNewContext(compiled, scope);
const { assemblyAt, chapterFor, chapterTargets } = scope.exports;
const near = (actual, expected) =>
  assert(Math.abs(actual - expected) < 0.00001);

near(assemblyAt(0, 0).formation, 0);
near(assemblyAt(0, 2.05).formation, 0);
near(assemblyAt(0, 4.65).formation, 1);
near(assemblyAt(0.12, 6).form, 0);
near(assemblyAt(0.28, 6).form, 1);
near(assemblyAt(0.4, 6).topping, 0.43);
near(assemblyAt(0.49, 6).topping, 0.75);
near(assemblyAt(0.58, 6).topping, 1);
near(assemblyAt(0.58, 6).bake, 0);
near(assemblyAt(0.68, 6).bake, 1);
near(assemblyAt(0.65, 6).handoff, 0);
near(assemblyAt(0.71, 6).handoff, 1);
near(assemblyAt(0.8, 6).split, 0);
near(assemblyAt(0.89, 6).split, 1);
chapterTargets.forEach((p, index) => assert.equal(chapterFor(p), index));

// Scrubbing across chapter boundaries must not cut the camera or product state.
for (const p of [0.12, 0.28, 0.4, 0.49, 0.58, 0.65, 0.68, 0.71, 0.72, 0.8]) {
  const before = assemblyAt(p - 0.000001, 6);
  const after = assemblyAt(p + 0.000001, 6);
  for (const key of Object.keys(before))
    assert(Math.abs(before[key] - after[key]) < 0.001, `${key} jumps at ${p}`);
}
for (let i = 0; i <= 1000; i++) {
  const state = assemblyAt(i / 1000, 6);
  for (const [key, value] of Object.entries(state)) {
    assert(Number.isFinite(value), `${key} is not finite`);
    if (key !== "time")
      assert(value >= 0 && value <= 1, `${key} is out of range`);
  }
}
console.log(
  "Assembly timeline: ingredient order, seven chapters and continuity passed.",
);
