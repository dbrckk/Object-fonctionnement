import test from "node:test";
import assert from "node:assert/strict";
import {closestProjectedPart} from "../src/part-picking.js";

const parts=[
 {x:80,y:100,visible:true},
 {x:180,y:115,visible:true},
 {x:270,y:145,visible:true}
];
test("nearest projected 3D component is deterministically selected",()=>{
 assert.equal(closestProjectedPart(parts,83,103),0);
 assert.equal(closestProjectedPart(parts,172,119),1);
 assert.equal(closestProjectedPart(parts,268,148),2);
 assert.equal(closestProjectedPart(parts,129,100),0);
 assert.equal(closestProjectedPart(parts,129,100,30),-1);
});
test("background, unprojected and malformed coordinates cannot select components",()=>{
 assert.equal(closestProjectedPart(parts,400,50),-1);
 assert.equal(closestProjectedPart(parts,NaN,100),-1);
 assert.equal(closestProjectedPart(parts,100,Infinity),-1);
 assert.equal(closestProjectedPart(null,50,50),-1);
 assert.equal(closestProjectedPart(parts,80,100,0),-1);
 assert.equal(closestProjectedPart(parts,80,100,Infinity),-1);
 assert.equal(closestProjectedPart([{x:80,y:100,visible:false},
  {x:NaN,y:100,visible:true},null],80,100),-1);
});
test("picking does not mutate model annotations",()=>{
 const original=JSON.stringify(parts);
 assert.equal(closestProjectedPart(parts,170,100),1);
 assert.equal(JSON.stringify(parts),original);
});
