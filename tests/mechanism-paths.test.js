import test from "node:test";
import assert from "node:assert/strict";
import {getMechanismPath,validateMechanismPaths,MECHANISM_PATHS} from "../src/mechanism-paths.js";
import {OBJECTS} from "../src/catalog.js";
import {getObjectParts} from "../src/part-annotations.js";

test("all nine mechanisms have exactly three causal steps with real 3D anchors",()=>{
 const ids=OBJECTS.map(obj=>obj.id);
 assert.equal(ids.length,9);
 assert.deepEqual(Object.keys(MECHANISM_PATHS).sort(),ids.slice().sort());
 assert.equal(validateMechanismPaths(ids),true);
 for(const id of ids){
  const steps=getMechanismPath(id);
  assert.equal(steps.length,3,id);
  const knownParts=getObjectParts(id);
  assert.equal(new Set(steps.map(step=>step.partId)).size,3,id);
  for(const [index,step] of steps.entries()){
   assert.equal(step.index,index);
   assert.ok(step.title.length>=5&&step.explanation.length>25);
   assert.deepEqual(step.position,knownParts.find(part=>part.id===step.partId)?.position);
  }
 }
});
test("meaningful causal order is different from glossary order where required",()=>{
 assert.deepEqual(getMechanismPath("fan").map(x=>x.partId),["motor","blades","oscillation"]);
 assert.deepEqual(getMechanismPath("toaster").map(x=>x.partId),["dial","element","carriage"]);
 assert.deepEqual(getMechanismPath("coffee").map(x=>x.partId),["reservoir","filter","carafe"]);
 assert.deepEqual(getMechanismPath("washing").map(x=>x.partId),["program","drawer","drum"]);
 assert.deepEqual(getMechanismPath("vending").map(x=>x.partId),["selection","storage","pickup"]);
 assert.deepEqual(getMechanismPath("nonexistent"),[]);
});
test("returned anchors cannot mutate the source catalogue",()=>{
 const first=getMechanismPath("kettle");
 first[0].position[0]=123;
 assert.notEqual(getMechanismPath("kettle")[0].position[0],123);
});
