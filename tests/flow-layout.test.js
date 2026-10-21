import test from "node:test";
import assert from "node:assert/strict";
import {flowLinkGeometry,viewportFlowPoint} from "../src/flow-layout.js";
test("flow nodes stay inside narrow mobile viewer",()=>{
 assert.deepEqual(viewportFlowPoint({x:0,y:0,z:0},320,265),{x:160,y:132.5});
 assert.deepEqual(viewportFlowPoint({x:1.08,y:-1.08,z:0},320,265),{x:301,y:246});
 assert.equal(viewportFlowPoint({x:1.5,y:0,z:0},320,265),null);
 assert.equal(viewportFlowPoint({x:0,y:0,z:2},320,265),null);
 assert.equal(viewportFlowPoint({x:Infinity,y:0,z:0},320,265),null);
});
test("short or invalid links do not cross through step discs",()=>{
 assert.equal(flowLinkGeometry(null,{x:0,y:0}),null);
 assert.equal(flowLinkGeometry({x:0,y:0},{x:30,y:0}),null);
 assert.equal(flowLinkGeometry({x:0,y:0},{x:55,y:0}),null);
 const straight=flowLinkGeometry({x:0,y:0},{x:100,y:0});
 assert.ok(straight);
 assert.ok(straight.start.x>=20&&straight.finish.x<=80);
 assert.ok(straight.finish.x>straight.start.x);
 const diagonal=flowLinkGeometry({x:20,y:20},{x:120,y:120});
 assert.ok(diagonal);
 assert.ok(Number.isFinite(diagonal.mid.x)&&Number.isFinite(diagonal.mid.y));
});
