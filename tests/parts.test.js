import test from "node:test";
import assert from "node:assert/strict";
import {OBJECT_PARTS,getObjectParts} from "../src/part-annotations.js";
import {OBJECTS} from "../src/catalog.js";

test("all nine models expose three uniquely anchored technical components",()=>{
 assert.equal(Object.keys(OBJECT_PARTS).length,OBJECTS.length);
 for(const object of OBJECTS){
  const id=object.id;
  const parts=getObjectParts(id);
  assert.equal(parts.length,3,id+": expected exactly 3 components");
  assert.equal(new Set(parts.map(p=>p.id)).size,parts.length);
  for(const part of parts){
   assert.ok(part.label.length>=5 && part.label.length<=50);
   assert.ok(part.detail.length>=60,id+"/"+part.id+": explanation too brief");
   assert.equal(part.position.length,3);
   for(const coord of part.position)assert.ok(Number.isFinite(coord) && Math.abs(coord)<5);
   assert.ok(!part.detail.includes("<"),"descriptions must be plain text");
  }
 }
 assert.deepEqual(getObjectParts("__unknown__"),[]);
});
