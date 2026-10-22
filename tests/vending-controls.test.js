import test from "node:test";
import assert from "node:assert/strict";
import {vendingControlCommand,vendingControlView} from "../src/vending-controls.js";

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
