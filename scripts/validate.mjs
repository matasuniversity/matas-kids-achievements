import fs from "node:fs";
import assert from "node:assert/strict";
const d = JSON.parse(
  fs.readFileSync(new URL("../achievements.json", import.meta.url), "utf8"),
);
const text = (x) => typeof x === "string" && x.trim().length > 0;
const id = (x) => text(x) && /^matas:[a-z0-9/_-]+$/.test(x);
const image = (x) => {
  assert.match(x, /^[\w./-]+\.(png|jpe?g|webp|svg)$/i);
  assert.ok(!x.split("/").some((p) => !p || p === "." || p === ".."));
  assert.ok(fs.existsSync(new URL("../" + x, import.meta.url)));
};
assert.equal(d.schemaVersion, 1);
assert.ok(Array.isArray(d.trees) && d.trees.length <= 26);
assert.ok(Array.isArray(d.nodes) && d.nodes.length <= 1000);
assert.equal(new Set(d.trees.map((t) => t.id)).size, d.trees.length);
assert.equal(new Set(d.nodes.map((n) => n.id)).size, d.nodes.length);
for (const t of d.trees) {
  assert.ok(id(t.id) && text(t.name));
  image(t.icon);
}
const positions = new Set();
for (const n of d.nodes) {
  assert.ok(id(n.id) && text(n.name) && text(n.condition));
  assert.equal(typeof n.reward, "string");
  assert.ok(Array.isArray(n.skills) && n.skills.every(text));
  assert.ok(d.trees.some((t) => t.id === n.treeId));
  image(n.icon);
  assert.ok(["task", "goal", "challenge"].includes(n.frame));
  assert.ok(
    Number.isFinite(n.x) &&
      Number.isFinite(n.y) &&
      Math.abs(n.x) <= 100 &&
      Math.abs(n.y) <= 100,
  );
  const pos = JSON.stringify([n.treeId, n.x, n.y]);
  assert.ok(!positions.has(pos));
  positions.add(pos);
  const visited = new Set([n.id]);
  let p = n;
  while (p.parentId !== null) {
    const parent = d.nodes.find((v) => v.id === p.parentId);
    assert.ok(parent && parent.treeId === n.treeId && !visited.has(parent.id));
    visited.add(parent.id);
    p = parent;
  }
}
console.log(`PASS: ${d.trees.length} trees, ${d.nodes.length} nodes`);
