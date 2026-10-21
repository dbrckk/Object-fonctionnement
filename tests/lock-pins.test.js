import test from "node:test";
import assert from "node:assert/strict";
import {LOCK_SHEAR_Y,LOCK_PIN_BIAS,lockPinTarget,lockPinsAreAligned} from "../src/lock-pins.js";
test("five pins align exactly at the common shear line for the correct key",()=>{
 const pins=LOCK_PIN_BIAS.map((_,i)=>lockPinTarget(i,true));
 assert.equal(pins.length,5);
 assert.equal(lockPinsAreAligned(pins.map(p=>p.junctionY)),true);
 for(const p of pins){
  assert.equal(p.junctionY,LOCK_SHEAR_Y);
  assert.ok(p.lowerY<p.junctionY&&p.upperY>p.junctionY);
  assert.ok(p.springLength>0);
 }
});
test("misaligned key produces distinct interfaces and calibrated springs",()=>{
 const pins=LOCK_PIN_BIAS.map((_,i)=>lockPinTarget(i,false));
 assert.equal(lockPinsAreAligned(pins.map(p=>p.junctionY)),false);
 assert.equal(new Set(pins.map(p=>p.junctionY)).size,5);
 assert.ok(pins.every(p=>p.springLength>0));
 assert.equal(lockPinTarget(-1,true),null);
 assert.equal(lockPinTarget(5,true),null);
 assert.equal(lockPinTarget(.5,false),null);
 assert.equal(lockPinsAreAligned([LOCK_SHEAR_Y]),false);
});
