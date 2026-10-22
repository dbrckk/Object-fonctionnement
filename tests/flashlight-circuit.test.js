import test from "node:test";
import assert from "node:assert/strict";
import {flashlightCircuitState,flashlightChargePoint} from "../src/flashlight-circuit.js";

test("an open compartment or open switch never illuminates the electrical loop",()=>{
 assert.equal(flashlightCircuitState({on:false,open:false}).powered,false);
 assert.equal(flashlightCircuitState({on:true,open:true}).powered,false);
 assert.equal(flashlightCircuitState({on:true,open:false}).powered,true);
 assert.equal(flashlightCircuitState({on:false,open:true,batteryPulse:.3}).energyPreview,true);
 assert.equal(flashlightCircuitState({on:false,open:true,batteryPulse:.3}).powered,false);
});

test("battery contact pulse and charge positions are deterministic and bounded",()=>{
 assert.equal(flashlightCircuitState({batteryPulse:0}).pulse,.25);
 assert.ok(flashlightCircuitState({batteryPulse:.25}).pulse>.9);
 assert.equal(flashlightCircuitState({batteryPulse:1}).pulse,.25);
 const state=flashlightCircuitState({on:true,circuitPhase:.4});
 assert.equal(state.phase,.4);
 assert.equal(flashlightCircuitState({on:true,circuitPhase:Infinity}).phase,0);
 for(let i=0;i<8;i++){
  const p=flashlightChargePoint(i,.4);
  assert.ok(p.progress>=0&&p.progress<1);
  assert.ok(p.size>=.7&&p.size<=1);
  assert.deepEqual(p,flashlightChargePoint(i,.4));
 }
 assert.equal(flashlightChargePoint(8,.5),null);
 assert.equal(flashlightChargePoint(-1,.5),null);
 assert.equal(flashlightChargePoint(0,.5,0),null);
});

test("progress never mutates the source battery state",()=>{
 const original={on:true,open:false,circuitPhase:.71,batteryPulse:.1};
 const snapshot=JSON.stringify(original);
 const rendering=flashlightCircuitState(original);
 assert.equal(rendering.powered,true);
 assert.equal(rendering.phase,.71);
 assert.equal(JSON.stringify(original),snapshot);
});
