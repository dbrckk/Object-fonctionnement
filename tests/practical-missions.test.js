import test from "node:test";
import assert from "node:assert/strict";
import {getObjectParts} from "../src/part-annotations.js";
import {MISSION_STORAGE_KEY,PRACTICAL_MISSION_IDS,missionFor,
 missionStepMet,advanceMission,normalizeMissionCompletions,
 readMissionCompletions,saveMissionCompletions} from "../src/practical-missions.js";
import {PHYSICAL_PART_ACTIONS} from "../src/physical-actions.js";

test("each of eight missions has real controllable steps and unique labels",()=>{
 assert.equal(PRACTICAL_MISSION_IDS.length,8);
 for(const id of PRACTICAL_MISSION_IDS){
  const mission=missionFor(id);
  assert.ok(mission.title.length>8);
  assert.ok(mission.steps.length>=2&&mission.steps.length<=3);
  const partIds=getObjectParts(id).map(part=>part.id);
  for(const step of mission.steps){
   assert.ok(partIds.includes(step.partId),id+" "+step.partId);
   assert.ok(Object.hasOwn(PHYSICAL_PART_ACTIONS[id],step.partId),
    id+" step does not have a physical controller");
   assert.ok(step.label.length>5&&step.hint.length>10);
   assert.equal(typeof step.predicate,"function");
  }
 }
 assert.equal(missionFor("vending"),null);
 assert.equal(missionFor("__proto__"),null);
});

test("fan mission advances only from observed source state in exact order",()=>{
 assert.deepEqual(advanceMission("fan",0,{speed:0,oscillate:false}),
  {index:0,advanced:0,completed:false});
 assert.deepEqual(advanceMission("fan",0,{speed:1,oscillate:false}),
  {index:1,advanced:1,completed:false});
 assert.deepEqual(advanceMission("fan",1,{speed:2,oscillate:false}),
  {index:2,advanced:1,completed:false});
 assert.deepEqual(advanceMission("fan",2,{speed:2,oscillate:true}),
  {index:3,advanced:1,completed:true});
 assert.deepEqual(advanceMission("fan",0,{speed:2,oscillate:true}),
  {index:3,advanced:3,completed:true});
 assert.deepEqual(advanceMission("fan",2,{speed:0,oscillate:true}),
  {index:3,advanced:1,completed:true});
});
test("all other models require their actual original controller states",()=>{
 const models=[
  ["kettle",[{water:.85,heating:false},{water:.85,heating:true}]],
  ["toaster",[{bread:2,level:2},{bread:2,level:3},{bread:2,level:3,toasting:true}]],
  ["lock",[{key:true,aligned:true,locked:true},{key:true,aligned:true,locked:false}]],
  ["bicycle",[{connected:true,pumps:0,pressure:.7},
   {connected:true,pumps:1,pressure:1.1}]],
  ["coffee",[{water:1,grounds:false},{water:1,grounds:true},
   {water:1,grounds:true,brewing:true}]],
  ["flashlight",[{on:true,brightness:1},{on:true,brightness:2}]],
  ["washing",[{laundry:"drum",xfer:null,prog:0,run:false},
   {laundry:"drum",xfer:null,prog:1,run:false},
   {laundry:"drum",xfer:null,prog:1,run:true,paused:false}]]
 ];
 for(const [id,snapshots] of models){
  for(let i=0;i<snapshots.length;i++){
   const result=advanceMission(id,i,snapshots[i]);
   assert.equal(result.index,i+1,id+" step "+i);
  }
  assert.equal(advanceMission(id,0,{}).completed,false,id);
 }
 assert.equal(missionStepMet("bicycle",1,{pumps:2,pressure:.7}),false);
 assert.equal(missionStepMet("washing",0,{laundry:"drum",xfer:{dir:"in"}}),false);
 assert.equal(missionStepMet("washing",2,{run:true,paused:true}),false);
});
test("invalid and partial external state cannot complete missions",()=>{
 for(const id of PRACTICAL_MISSION_IDS){
  assert.equal(advanceMission(id,-14,null).completed,false,id);
  assert.equal(advanceMission(id,0,[]).completed,false,id);
  assert.equal(advanceMission(id,0,{__proto__:1}).completed,false,id);
 }
 assert.equal(missionStepMet("fan",0,{speed:0}),false);
 assert.equal(missionStepMet("fan",0,null),false);
 assert.equal(missionStepMet("fan",100,{speed:3}),false);
 assert.deepEqual(advanceMission("__proto__",0,{speed:3}),
  {index:0,advanced:0,completed:false});
});
test("offline mission achievements are normalized, deduplicated, stored and restored",()=>{
 const storage=new Map();
 const adapter={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)};
 assert.deepEqual(readMissionCompletions(adapter),[]);
 const saved=saveMissionCompletions(adapter,
  ["fan","fan","vending","kettle","__proto__",null,4,"bicycle"]);
 assert.deepEqual(saved,["fan","kettle","bicycle"]);
 assert.deepEqual(JSON.parse(storage.get(MISSION_STORAGE_KEY)),saved);
 assert.deepEqual(readMissionCompletions(adapter),saved);
 assert.deepEqual(normalizeMissionCompletions("fan"),[]);
 storage.set(MISSION_STORAGE_KEY,"{broken");
 assert.deepEqual(readMissionCompletions(adapter),[]);
 assert.deepEqual(readMissionCompletions({getItem:()=>{throw Error("storage denied");}}),[]);
});
