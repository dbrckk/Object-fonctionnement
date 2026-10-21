import test from "node:test";
import assert from "node:assert/strict";
import {bicycleValveMotion} from "../src/check-valve.js";

test("one-way valve stays shut without hose connection or active stroke",()=>{
 assert.equal(bicycleValveMotion({connected:false,pumping:true,piston:.3},.7,true).open,0);
 assert.equal(bicycleValveMotion({connected:true,pumping:false,piston:.3},.7,true).open,0);
 assert.equal(bicycleValveMotion({connected:true,pumping:true,piston:.25},.3,false).open,0);
});
test("downstroke opens the valve and return stroke closes it",()=>{
 const down=bicycleValveMotion({connected:true,pumping:true,piston:.66},.4,false);
 assert.equal(down.descending,true);
 assert.equal(down.open,1);
 const held=bicycleValveMotion({connected:true,pumping:true,piston:.66},.66,down.descending);
 assert.equal(held.open,1);
 const rising=bicycleValveMotion({connected:true,pumping:true,piston:.4},.66,held.descending);
 assert.equal(rising.open,0);
 assert.equal(rising.descending,false);
});
test("illustrative valve can be scrubbed without changing the source state",()=>{
 const original={connected:false,pumping:false,piston:.8,valveOpen:.75};
 const before=JSON.stringify(original);
 assert.equal(bicycleValveMotion(original,.8,false).open,.75);
 assert.equal(bicycleValveMotion({...original,valveOpen:4}).open,1);
 assert.equal(bicycleValveMotion({...original,valveOpen:-1}).open,0);
 assert.equal(JSON.stringify(original),before);
});
