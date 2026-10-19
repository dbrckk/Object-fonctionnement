import test from "node:test";
import assert from "node:assert/strict";
import {OBJECTS} from "../src/catalog.js";
import {buildGlossary,filterGlossary} from "../src/glossary.js";

test("offline glossary indexes the 27 actual model components",()=>{
 const entries=buildGlossary(OBJECTS);
 assert.equal(entries.length,27);
 assert.equal(new Set(entries.map(e=>e.objectId+":"+e.partId)).size,27);
 for(const e of entries){
  assert.ok(e.label.length>=5&&e.detail.length>55);
  assert.ok(OBJECTS.some(o=>o.id===e.objectId));
 }
 assert.equal(entries[0].label.localeCompare(entries[1].label,"fr")<=0,true);
});
test("accent-free multi-term component search covers object and function",()=>{
 const entries=buildGlossary(OBJECTS);
 assert.deepEqual(filterGlossary(entries,"GOUPILLES").map(e=>e.objectId),["lock"]);
 assert.deepEqual(filterGlossary(entries,"resistance electrique").map(e=>e.objectId),["kettle"]);
 assert.deepEqual(filterGlossary(entries,"moteur ventilateur").map(e=>e.partId),["motor"]);
 assert.equal(filterGlossary(entries,"uncomposantimpossible").length,0);
 assert.equal(filterGlossary(entries," ").length,27);
});
