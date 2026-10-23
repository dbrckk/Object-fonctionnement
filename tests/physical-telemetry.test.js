import test from "node:test";
import assert from "node:assert/strict";
import {LIVE_TELEMETRY_MODELS,physicalReadouts,physicalCommandConfirmed}
 from "../src/physical-telemetry.js";

const actual={
 kettle:{water:.55,hot:.4,heating:true,phase:"heating"},
 toaster:{bread:2,hot:.22,toasting:true,level:4},
 fan:{speed:2,oscillate:true,turn:3.5},
 lock:{key:true,aligned:true,locked:false},
 bicycle:{connected:true,pressure:1.6,pumps:3,pumping:false},
 coffee:{water:.3,grounds:true,coffee:.7,brewing:true},
 flashlight:{on:true,brightness:2,battery:.9,open:false},
 washing:{laundry:"drum",prog:1,run:true,paused:false,done:false,door:0}
};
test("all eight source-owned simulations have three finite honest readouts",()=>{
 assert.equal(LIVE_TELEMETRY_MODELS.length,8);
 for(const model of LIVE_TELEMETRY_MODELS){
  const rows=physicalReadouts(model,actual[model]);
  assert.equal(rows.length,3,model);
  assert.equal(new Set(rows.map(row=>row.id)).size,3,model);
  for(const row of rows){
   assert.ok(row.label.length>2,model);
   assert.ok(typeof row.value==="string"&&row.value.length>0,model);
   assert.ok(!/NaN|undefined|Infinity/.test(row.value),model+" "+row.value);
  }
 }
 assert.deepEqual(physicalReadouts("__proto__",actual.kettle),[]);
 assert.deepEqual(physicalReadouts(null,actual.kettle),[]);
});
test("telemetry displays only real controller state with safe fallbacks",()=>{
 assert.equal(physicalReadouts("bicycle",{connected:true,pressure:1.2,pumps:2})[1].value,"1,2 bar");
 assert.equal(physicalReadouts("fan",{speed:0,oscillate:false})[0].value,"Arrêté");
 assert.equal(physicalReadouts("kettle",{water:.85})[0].value,"85 %");
 assert.equal(physicalReadouts("coffee",{coffee:1.5})[2].value,"100 %");
 assert.equal(physicalReadouts("washing",{laundry:"basket",run:false})[0].value,"Vide");
 assert.equal(physicalReadouts("washing",{run:true,paused:true})[2].value,"En pause");
 assert.equal(physicalReadouts("flashlight",{brightness:NaN,battery:Infinity})[1].value,"—");
 assert.equal(physicalReadouts("kettle",null)[0].value,"—");
 assert.equal(physicalReadouts("kettle",[])[0].value,"—");
});
test("commands confirm only model-specific observed controller transitions",()=>{
 const tests=[
  ["kettle","Remplir d'eau",{water:.25},{water:.85}],
  ["kettle","Chauffer",{heating:false},{heating:true}],
  ["toaster","Régler le brunissage",{level:2},{level:3}],
  ["fan","Vitesse",{speed:1,turn:0},{speed:2,turn:7}],
  ["fan","Oscillation",{oscillate:false},{oscillate:true}],
  ["lock","Tourner la clé",{locked:true},{locked:false}],
  ["bicycle","Pomper",{pumps:0,pressure:.7},{pumps:1,pressure:1}],
  ["coffee","Préparer le café",{brewing:false},{brewing:true}],
  ["flashlight","Marche / arrêt",{on:false},{on:true}],
  ["washing","Choose program",{prog:0},{prog:1}],
  ["washing","Start / pause",{run:false},{run:true}]
 ];
 for(const [model,label,before,after] of tests){
  assert.equal(physicalCommandConfirmed(model,{label},before,after),true,model+" "+label);
  assert.equal(physicalCommandConfirmed(model,{label},after,after),false,model+" repeat");
 }
});
test("unrelated animation, malformed data and unknown actions never confirm a command",()=>{
 assert.equal(physicalCommandConfirmed("fan",{label:"Vitesse"},
  {speed:2,turn:1},{speed:2,turn:50}),false);
 assert.equal(physicalCommandConfirmed("kettle",{label:"Remplir d'eau"},
  {water:.55,hot:0},{water:.55,hot:.85}),false);
 assert.equal(physicalCommandConfirmed("fan",{label:"__proto__"},{speed:1},{speed:2}),false);
 assert.equal(physicalCommandConfirmed("__proto__",{label:"Vitesse"},{speed:1},{speed:2}),false);
 assert.equal(physicalCommandConfirmed("fan",null,{speed:1},{speed:2}),false);
 assert.equal(physicalCommandConfirmed("fan",{label:"Vitesse"},null,{speed:2}),false);
 assert.equal(physicalCommandConfirmed("fan",{label:"Vitesse"},{},{speed:2}),false);
});
test("readouts and proof functions never mutate their source snapshots",()=>{
 const before=structuredClone(actual);
 for(const model of LIVE_TELEMETRY_MODELS){
  physicalReadouts(model,actual[model]);
  physicalCommandConfirmed(model,{label:"Pomper"},actual[model],{...actual[model]});
 }
 assert.deepEqual(actual,before);
});

test("passive progress cannot confirm a rejected repeated heating, brewing or pumping request",()=>{
 assert.equal(physicalCommandConfirmed("kettle",{label:"Chauffer"},
  {heating:true,phase:"heating",hot:.3},
  {heating:true,phase:"heating",hot:.6}),false);
 assert.equal(physicalCommandConfirmed("toaster",{label:"Abaisser / griller"},
  {toasting:true,done:false,hot:.2},
  {toasting:true,done:false,hot:.7}),false);
 assert.equal(physicalCommandConfirmed("coffee",{label:"Préparer le café"},
  {brewing:true,progress:.2,coffee:.2},
  {brewing:true,progress:.5,coffee:.5}),false);
 assert.equal(physicalCommandConfirmed("bicycle",{label:"Pomper"},
  {pumping:true,pumps:0,pressure:.7},
  {pumping:true,pumps:1,pressure:1}),false);
});
