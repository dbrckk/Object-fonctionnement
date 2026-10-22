import test from "node:test";
import assert from "node:assert/strict";
import {vendingControlCommand,vendingControlView,VENDING_SLOT_CODES,vendingSlotView} from "../src/vending-controls.js";

test("3D vending sends only whitelisted commands into the original controller",()=>{
 assert.deepEqual(vendingControlCommand("key","A"),
  {type:"object-figure:vending-command",action:"key",key:"A"});
 assert.deepEqual(vendingControlCommand("key","4"),
  {type:"object-figure:vending-command",action:"key",key:"4"});
 assert.deepEqual(vendingControlCommand("coin"),
  {type:"object-figure:vending-command",action:"coin"});
 for(const bad of [undefined,"9","Z","B3","","constructor"]){
  assert.equal(vendingControlCommand("key",bad),null);
 }
 for(const bad of ["setState","stock","__proto__","purchase",null,"eval"]){
  assert.equal(vendingControlCommand(bad,"A"),null);
 }
});
test("3D controls render authoritative credit, stock and pickup state",()=>{
 const snapshot={credit:1.5,returned:.5,sel:"B",drop:null,tray:null,flap:0};
 const before=JSON.stringify(snapshot);
 const view=vendingControlView(snapshot);
 assert.equal(view.creditText,"1,50 €");
 assert.equal(view.returnedText,"0,50 €");
 assert.equal(view.selection,"B");
 assert.equal(view.coinDisabled,false);
 assert.equal(view.flapDisabled,true);
 assert.equal(view.keysDisabled,false);
 assert.equal(view.collectDisabled,true);
 assert.equal(JSON.stringify(snapshot),before);
 const drop=vendingControlView({...snapshot,drop:{r:1,c:2,t:.4}});
 assert.equal(drop.keysDisabled,true);
 assert.equal(drop.dropActive,true);
 const ready=vendingControlView({...snapshot,tray:{code:"B3"}});
 assert.equal(ready.flapDisabled,false);
 assert.equal(ready.collectDisabled,true);
 assert.equal(vendingControlView({...snapshot,tray:{code:"B3"},flap:1}).collectDisabled,false);
});
test("3D vending handles invalid values without displaying impossible credit",()=>{
 const view=vendingControlView({credit:Infinity,returned:-1,sel:"Z",flap:20,
  drop:{r:99,c:99,t:5},tray:{code:"Z9"}});
 assert.equal(view.creditText,"0,00 €");
 assert.equal(view.returnedText,"0,00 €");
 assert.equal(view.selection,"—");
 assert.equal(view.tray,null);
 assert.equal(view.keysDisabled,false);
 assert.equal(vendingControlView({credit:5}).coinDisabled,true);
 assert.equal(vendingControlView({msg:"INSERT|$0.50"}).status,
  "Crédit insuffisant pour cet article.");
});

test("direct product selectors whitelist exactly the original 16 codes",()=>{
 assert.equal(VENDING_SLOT_CODES.length,16);
 assert.equal(new Set(VENDING_SLOT_CODES).size,16);
 assert.equal(VENDING_SLOT_CODES[0],"A1");
 assert.equal(VENDING_SLOT_CODES[15],"D4");
 assert.deepEqual(vendingControlCommand("select","B3"),
  {type:"object-figure:vending-command",action:"select",code:"B3"});
 for(const invalid of ["A0","E1","B5","B03","B3 ","b3",undefined,null,{},7]){
  assert.equal(vendingControlCommand("select",invalid),null);
 }
});
test("product tiles use authentic prices and stock without mutating input",()=>{
 const snapshot={prices:[1.5,1.5,2,1],credit:1.5,
  stock:[[3,3,3,3],[3,3,2,3],[3,3,3,3],[0,3,3,3]]};
 const before=JSON.stringify(snapshot);
 const slots=vendingSlotView(snapshot);
 assert.equal(slots.length,16);
 const byCode=code=>slots.find(slot=>slot.code===code);
 assert.equal(byCode("B3").priceText,"1,50 €");
 assert.equal(byCode("B3").stock,2);
 assert.equal(byCode("B3").disabled,false);
 assert.equal(byCode("C2").priceText,"2,00 €");
 assert.equal(byCode("C2").disabled,true);
 assert.equal(byCode("C2").note,"Ajouter 0,50 €");
 assert.equal(byCode("D1").note,"Épuisé");
 assert.equal(byCode("D1").disabled,true);
 assert.equal(byCode("A1").disabled,false);
 assert.equal(JSON.stringify(snapshot),before);
 assert.equal(vendingSlotView({...snapshot,drop:{r:1,c:2}})[6].disabled,true);
 assert.equal(vendingSlotView({...snapshot,tray:{code:"B3"}})[6].disabled,true);
});
test("product tiles fail closed on missing or malformed controller snapshots",()=>{
 assert.ok(vendingSlotView().every(slot=>slot.disabled));
 assert.ok(vendingSlotView({prices:[Infinity,-1,100,1],stock:[[1,1,1,1]]})
   .every(slot=>slot.disabled));
 assert.ok(vendingSlotView({prices:[1,1,1,1],stock:[[99,"3",NaN,-1]]})
   .every(slot=>slot.disabled));
 assert.equal(vendingSlotView({prices:[1.5,1.5,2,1],credit:5,
  stock:Array.from({length:4},()=>[3,3,3,3])})[0].missing,0);
});
