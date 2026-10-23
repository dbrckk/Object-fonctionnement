import test from "node:test";
import assert from "node:assert/strict";
import {getObjectParts} from "../src/part-annotations.js";
import {INTERACTIVE_MODELS,PHYSICAL_PART_ACTIONS,partMechanismAction,
 physicalControlCommand,physicalActionLabel} from "../src/physical-actions.js";

test("eight models bind their real figure commands to authentic 3D parts",()=>{
 assert.equal(INTERACTIVE_MODELS.length,8);
 let count=0;
 for(const model of INTERACTIVE_MODELS){
  const partIds=getObjectParts(model).map(p=>p.id);
  assert.equal(partIds.length,3,model);
  for(const [id,action] of Object.entries(PHYSICAL_PART_ACTIONS[model])){
   assert.ok(partIds.includes(id),model+":"+id+" does not exist in 3D");
   assert.ok(["press","cycle"].includes(action.action));
   assert.ok(action.label.length>3&&action.label.length<70);
   assert.deepEqual(physicalControlCommand(model,id),{
    type:"object-figure:mechanism-command",action:action.action,label:action.label
   });
   count++;
  }
 }
 assert.equal(count,23);
 assert.equal(partMechanismAction("bicycle","gauge"),null);
 assert.equal(physicalControlCommand("vending","selection"),null);
 assert.equal(physicalControlCommand("__prototype__","switch"),null);
 assert.equal(physicalControlCommand("kettle","__proto__"),null);
});
test("carafe can brew before preparation and serve afterward",()=>{
 assert.equal(partMechanismAction("coffee","carafe",{coffee:0}).label,"Préparer le café");
 assert.equal(partMechanismAction("coffee","carafe",{coffee:.6,brewing:false}).label,"Servir");
 assert.equal(partMechanismAction("coffee","carafe",{coffee:.6,brewing:true}).label,"Préparer le café");
});
test("washing drum respects its true load, run, stop and unload phases",()=>{
 const action=state=>partMechanismAction("washing","drum",state).label;
 assert.equal(action({laundry:"basket",run:false}),"Load laundry");
 assert.equal(action({laundry:"drum",run:false}),"Start / pause");
 assert.equal(action({laundry:"drum",run:true}),"Start / pause");
 assert.equal(action({laundry:"drum",run:false,done:true}),"Open door, unload");
 assert.equal(action({laundry:"basket",run:true,paused:true}),"Start / pause");
 assert.equal(partMechanismAction("washing","drum",{laundry:"drum",doorT:1}),null);
 assert.equal(partMechanismAction("washing","drum",{laundry:"drum",door:.2}),null);
 assert.equal(partMechanismAction("washing","drum",{laundry:"drum",xfer:{dir:"in"}}),null);
 assert.equal(partMechanismAction("washing","program",{run:true}),null);
 assert.equal(partMechanismAction("washing","drawer",{run:true}),null);
});
test("all mapping calls are immutable and fail closed for unknown parts",()=>{
 const original=JSON.stringify(PHYSICAL_PART_ACTIONS);
 assert.equal(partMechanismAction("fan","missing"),null);
 assert.equal(physicalControlCommand("fan",null),null);
 assert.equal(partMechanismAction("coffee","filter",null).label,"Mettre le café moulu");
 assert.equal(JSON.stringify(PHYSICAL_PART_ACTIONS),original);
});

test("washing commands remain canonical while the user interface is French",()=>{
 assert.equal(physicalActionLabel(partMechanismAction("washing","drum")),"Charger le linge");
 assert.equal(physicalActionLabel(partMechanismAction("washing","program")),"Choisir le programme");
 assert.equal(physicalActionLabel(partMechanismAction("washing","drum",{laundry:"drum"})),"Démarrer / pause");
 assert.equal(physicalControlCommand("washing","program").label,"Choose program");
});
