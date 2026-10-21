import test from "node:test";
import assert from "node:assert/strict";
import {washerHydraulicState} from "../src/washer-hydraulics.js";
import {mechanismDemoState} from "../src/mechanism-demos.js";

test("washer inlet and detergent only flow during fill with a dose",()=>{
 const filling={run:true,prog:0,tau:.7,paused:false,soapLvl:1};
 const stream=washerHydraulicState(filling);
 assert.equal(stream.phase,"fill");
 assert.equal(stream.intake,true);
 assert.equal(stream.detergent,true);
 assert.equal(stream.drain,false);
 const dry=washerHydraulicState({...filling,soapLvl:0});
 assert.equal(dry.intake,true);
 assert.equal(dry.detergent,false);
});
test("washer drainage follows actual phase and pauses with the machine",()=>{
 const drain=washerHydraulicState({run:true,prog:0,tau:6.5,paused:false});
 assert.equal(drain.phase,"drain");
 assert.equal(drain.drain,true);
 assert.equal(drain.intake,false);
 assert.equal(washerHydraulicState({run:true,prog:0,tau:6.5,paused:true}).drain,false);
 assert.equal(washerHydraulicState({run:true,prog:2,tau:1}).intake,false);
 assert.equal(washerHydraulicState({run:true,prog:0,tau:8.5}).drain,false);
 assert.equal(washerHydraulicState({run:false,prog:0,tau:0}).intake,false);
});
test("soap demonstration closes the drawer and flushes fluid without starting laundry",()=>{
 const original={run:false,prog:0,soapLvl:0,laundry:"basket"};
 const snapshot=JSON.stringify(original);
 const before=mechanismDemoState("washing",1,.20,original);
 const after=mechanismDemoState("washing",1,.65,original);
 assert.equal(washerHydraulicState(before).intake,false);
 assert.equal(washerHydraulicState(after).intake,true);
 assert.equal(washerHydraulicState(after).detergent,true);
 assert.ok(after.drawer<before.drawer);
 assert.equal(after.run,false);
 assert.equal(JSON.stringify(original),snapshot);
 const final=mechanismDemoState("washing",1,1,original);
 assert.equal(final.hydraulicDemo,1);
 assert.equal(washerHydraulicState({...final,hydraulicDemo:NaN}).intake,false);
});
