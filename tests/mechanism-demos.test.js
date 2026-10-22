import test from "node:test";
import assert from "node:assert/strict";
import {OBJECTS} from "../src/catalog.js";
import {MECHANISM_DEMO_DURATION_MS,hasMechanismDemo,mechanismDemoState,supportedMechanismDemoCount} from "../src/mechanism-demos.js";

test("every 3D object has a demonstrable physical step without inventing missing mechanisms",()=>{
 assert.equal(MECHANISM_DEMO_DURATION_MS,2100);
 assert.equal(supportedMechanismDemoCount(),26);
 for(const object of OBJECTS){
  assert.ok([0,1,2].some(i=>hasMechanismDemo(object.id,i)),object.id);
 }
 assert.equal(hasMechanismDemo("kettle",2),false);
 assert.equal(hasMechanismDemo("bicycle",1),true);
 assert.equal(hasMechanismDemo("flashlight",0),true);
 assert.equal(hasMechanismDemo("vending",0),true);
 assert.equal(hasMechanismDemo("not-an-object",1),false);
 assert.equal(hasMechanismDemo("fan",3),false);
 assert.equal(hasMechanismDemo("fan",1.5),false);
});
test("educational previews do not modify live ColorFigures state",()=>{
 const original={water:.23,hot:.05,run:false,grounded:"kept",stock:[[1]],drop:null};
 const snapshot=JSON.stringify(original);
 for(const object of OBJECTS){
  for(let i=0;i<3;i++){
   const preview=mechanismDemoState(object.id,i,.57,original);
   if(!hasMechanismDemo(object.id,i)){
    assert.equal(preview,null);
    continue;
   }
   assert.notEqual(preview,original);
   assert.equal(preview.grounded,"kept");
   assert.equal(JSON.stringify(original),snapshot);
  }
 }
});
test("mechanical demonstration states track the selected causal stage",()=>{
 const toast=mechanismDemoState("toaster",2,.95);
 assert.equal(toast.done,true);
 assert.ok(toast.eject>.7);
 assert.equal(mechanismDemoState("toaster",1,.6).toasting,true);
 const fanStart=mechanismDemoState("fan",0,.1).turn;
 const fanEnd=mechanismDemoState("fan",0,.9).turn;
 assert.ok(fanEnd>fanStart);
 assert.equal(mechanismDemoState("lock",0,.6).aligned,true);
 assert.equal(mechanismDemoState("lock",2,.95).locked,false);
 assert.ok(mechanismDemoState("coffee",2,1).coffee>mechanismDemoState("coffee",2,0).coffee);
 assert.ok(mechanismDemoState("bicycle",2,1).pressure>mechanismDemoState("bicycle",2,0).pressure);
 const bicycleValveStart=mechanismDemoState("bicycle",1,0);
 const bicycleValveMiddle=mechanismDemoState("bicycle",1,.55);
 const bicycleValveEnd=mechanismDemoState("bicycle",1,1);
 assert.equal(bicycleValveStart.valveOpen,0);
 assert.ok(bicycleValveMiddle.valveOpen>.95);
 assert.equal(bicycleValveEnd.valveOpen,0);
 assert.equal(bicycleValveMiddle.connected,true);

 assert.equal(mechanismDemoState("washing",2,.4).run,true);
 assert.ok(mechanismDemoState("vending",1,.5).drop.t===.5);
 const selection=mechanismDemoState("vending",0,.68,{stock:[[3]],credit:1.5});
 assert.equal(selection.keypadDemo,.68);
 assert.equal(selection.drop,null);
 assert.equal(selection.tray,null);
 assert.equal(selection.credit,1.5);
 assert.equal(mechanismDemoState("vending",0,0).keypadDemo,0);
 assert.equal(mechanismDemoState("flashlight",2,.9).on,true);
 const battery=mechanismDemoState("flashlight",0,.65,{battery:1});
 assert.equal(battery.on,false);
 assert.equal(battery.open,true);
 assert.equal(battery.batteryPulse,.65);
 assert.equal(mechanismDemoState("flashlight",1,0).on,false);
 assert.equal(mechanismDemoState("flashlight",1,.8).on,true);
 // Finite visual values and bounded animation despite invalid input.
 assert.equal(mechanismDemoState("vending",1,Infinity).drop.t,0);
 assert.equal(mechanismDemoState("vending",1,-2).drop.t,0);
 assert.equal(mechanismDemoState("vending",1,5).drop.t,1);
 assert.equal(mechanismDemoState("fan",1,.25,null).speed,3);
});
