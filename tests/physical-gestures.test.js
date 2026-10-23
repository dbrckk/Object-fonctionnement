import test from "node:test";
import assert from "node:assert/strict";
import {physicalGestureType,mechanicalGestureCommand,dragInstruction}
 from "../src/physical-gestures.js";

const start={pointerId:4,isPrimary:true,button:0,clientX:142,clientY:165,timeStamp:100};
const end=(dx,dy,dt=340)=>({...start,clientX:start.clientX+dx,
 clientY:start.clientY+dy,timeStamp:start.timeStamp+dt});

test("real pump plunger requires an intentional downward compression stroke",()=>{
 const cmd=mechanicalGestureCommand("bicycle","piston",start,end(7,80),{connected:true});
 assert.deepEqual(cmd,{type:"object-figure:mechanism-command",action:"press",label:"Pomper"});
 assert.equal(mechanicalGestureCommand("bicycle","piston",start,end(5,-83),{connected:true}),null);
 assert.equal(mechanicalGestureCommand("bicycle","piston",start,end(4,39),{connected:true}),null);
 assert.equal(mechanicalGestureCommand("bicycle","piston",start,end(51,70),{connected:true}),null);
 assert.equal(mechanicalGestureCommand("bicycle","piston",start,end(3,80),{pumping:true}),null);
 assert.match(dragInstruction("bicycle","piston",{}),/vers le bas/);
});
test("left and right strokes select real Figure choices in both directions",()=>{
 for(const [model,part,label] of [
  ["fan","motor","Vitesse"],
  ["toaster","dial","Régler le brunissage"],
  ["flashlight","led","Intensité"],
  ["washing","program","Choose program"]
 ]){
  assert.deepEqual(mechanicalGestureCommand(model,part,start,end(67,10)),
   {type:"object-figure:mechanism-command",action:"step",label,direction:1},model);
  assert.deepEqual(mechanicalGestureCommand(model,part,start,end(-61,8)),
   {type:"object-figure:mechanism-command",action:"step",label,direction:-1},model);
  if(model==="washing")assert.equal(physicalGestureType(model,part,{run:true}),null);
 }
});
test("gestures reject unintended touches, wrong axes and delayed drags",()=>{
 const validEnd=end(82,7);
 for(const candidate of [
  null,{...validEnd,pointerId:5},{...validEnd,button:1},
  {...validEnd,isPrimary:false},{...validEnd,timeStamp:2401},
  {...validEnd,clientX:Infinity},{...validEnd,clientY:NaN},
  {...validEnd,timeStamp:30},
  end(30,5),end(58,55),end(2,90)
 ]){
  assert.equal(mechanicalGestureCommand("fan","motor",start,candidate),null);
 }
 assert.equal(mechanicalGestureCommand("fan","motor",{...start,isPrimary:false},validEnd),null);
 assert.equal(mechanicalGestureCommand("fan","motor",{...start,pointerId:6},validEnd),null);
 assert.equal(mechanicalGestureCommand("kettle","tank",start,validEnd),null);
 assert.equal(mechanicalGestureCommand("__proto__","motor",start,validEnd),null);
 assert.equal(physicalGestureType("bicycle","gauge"),null);
 assert.equal(dragInstruction("vending","selection"),null);
});
test("the live controller state and pointer data are never mutated",()=>{
 const state={connected:true,pressure:1.2,pumps:2};
 const before=JSON.stringify(state),snapshot=JSON.stringify(start);
 mechanicalGestureCommand("bicycle","piston",start,end(0,78),state);
 assert.equal(JSON.stringify(state),before);
 assert.equal(JSON.stringify(start),snapshot);
});
