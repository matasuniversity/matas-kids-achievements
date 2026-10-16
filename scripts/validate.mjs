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
  assert.ok(["stone","end","adventure","husbandry","nether","copper","blueprint"].includes(t.background));
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
  if(n.parentId !== null) { const p = d.nodes.find(p=>p.id===n.parentId); assert.ok(p && p.treeId===n.treeId); }
  const visiting = new Set(), visited = new Set();
  function visit(node) {
    assert.ok(!visiting.has(node.id), "Dependency cycle"); if(visited.has(node.id))return;
    visiting.add(node.id);
    const parents=node.prerequisites ?? (node.parentId ? [node.parentId] : []);
    assert.ok(Array.isArray(parents) && new Set(parents).size===parents.length);
    for(const key of parents) { const parent=d.nodes.find(p=>p.id===key);assert.ok(parent && parent.treeId===node.treeId);visit(parent); }
    const cross=node.crossSectionPrerequisites ?? [];assert.ok(Array.isArray(cross) && new Set(cross).size===cross.length);
    for(const key of cross) { const parent=d.nodes.find(p=>p.id===key);assert.ok(parent && parent.treeId!==node.treeId);visit(parent); }
    visiting.delete(node.id);visited.add(node.id);
  }
  visit(n);
}
console.log(`PASS: ${d.trees.length} trees, ${d.nodes.length} nodes`);
