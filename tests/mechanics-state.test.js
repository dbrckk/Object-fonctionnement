import test from "node:test";
import assert from "node:assert/strict";
import {WASH_PROGRAMS,washerMechanics,lockMechanics,vendingMechanics} from "../src/mechanics-state.js";

test("washer 3D phases follow the original ColorFigures programme timings",()=>{
 assert.equal(WASH_PROGRAMS.length,3);
 const idle=washerMechanics({prog:0,run:false,tau:0});
 assert.equal(idle.phase,"idle");
 assert.equal(idle.water,0);
 const fill=washerMechanics({prog:0,run:true,tau:.6,laundry:"drum"});
 assert.equal(fill.phase,"fill");assert.ok(fill.water>0&&fill.water<1);
 assert.equal(fill.hasLaundry,true);
 const wash=washerMechanics({prog:0,run:true,tau:3});
 assert.equal(wash.phase,"wash");assert.equal(wash.water,1);
 assert.notEqual(wash.speed,0);
 const drain=washerMechanics({prog:0,run:true,tau:6.4});
 assert.equal(drain.phase,"drain");assert.ok(drain.water>0&&drain.water<1);
 const spin=washerMechanics({prog:0,run:true,tau:8.6});
 assert.equal(spin.phase,"spin");assert.equal(spin.water,0);assert.ok(spin.speed>3);
 const dry=washerMechanics({prog:2,run:true,tau:1});
 assert.equal(dry.phase,"spin");assert.equal(dry.water,0);
 const paused=washerMechanics({prog:0,run:true,paused:true,tau:3});
 assert.equal(paused.speed,0);assert.equal(paused.water,1);
 assert.equal(washerMechanics({prog:99,run:true,tau:10}).progress,1);
});

test("lock 3D plug follows key, shear-line, and unlock states",()=>{
 assert.deepEqual(lockMechanics({}),{inserted:false,aligned:false,unlocked:false,angle:0,turning:false});
 const inserted=lockMechanics({key:true,aligned:true,locked:true,angle:0});
 assert.equal(inserted.aligned,true);
 assert.equal(inserted.unlocked,false);
 const opened=lockMechanics({key:true,aligned:true,locked:false,angle:90});
 assert.equal(opened.unlocked,true);
 assert.ok(Math.abs(opened.angle-Math.PI/2)<1e-6);
 assert.equal(lockMechanics({key:false,aligned:true}).aligned,false);
 assert.ok(Number.isFinite(lockMechanics({angle:"not-a-number"}).angle));
});

test("vending transport normalizes a single falling product and pickup flap",()=>{
 const state={stock:[[3,2,1,0],[3,3,3,3]],drop:{r:1,c:2,t:.35},
   tray:null,flap:.8,credit:1.5,returned:.5};
 const m=vendingMechanics(state);
 assert.deepEqual(m.drop,{row:1,col:2,progress:.35});
 assert.equal(m.trayVisible,false);
 assert.equal(m.flap,.8);
 assert.equal(m.credit,1.5);
 assert.equal(m.returned,.5);
 assert.equal(m.stock[0][3],0);
 assert.equal(vendingMechanics({drop:{r:-2,c:9,t:7}}).drop,null);
 assert.equal(vendingMechanics({drop:{r:0,c:0,t:7}}).drop.progress,1);
 assert.equal(vendingMechanics({tray:{code:"A2"}}).trayVisible,true);
});
