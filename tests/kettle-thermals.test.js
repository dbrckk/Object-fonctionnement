import test from "node:test";
import assert from "node:assert/strict";
import {KETTLE_BUBBLE_COUNT,kettleBubbleStrength,kettleBubblePoint} from "../src/kettle-thermals.js";

test("kettle bubbles require water, heating and sufficient heat",()=>{
 assert.equal(KETTLE_BUBBLE_COUNT,30);
 for(const input of [
  {water:0,hot:1,heating:true},
  {water:.05,hot:1,heating:true},
  {water:.8,hot:.2,heating:true},
  {water:.8,hot:1,heating:false},
  {water:.8,hot:1},
  {water:NaN,hot:1,heating:true},
 ]){
  assert.equal(kettleBubbleStrength(input),0);
 }
 assert.ok(kettleBubbleStrength({water:.7,hot:.8,heating:true})>.5);
 assert.ok(kettleBubbleStrength({water:.7,hot:1,heating:true})<=1);
});
test("thermal particle positions stay inside the displayed water column",()=>{
 const water=.55,strength=.91,time=7.32;
 const points=Array.from({length:KETTLE_BUBBLE_COUNT},(_,i)=>
  kettleBubblePoint(i,time,water,strength));
 assert.ok(points.every(p=>p&&Object.values(p).every(Number.isFinite)));
 for(const point of points){
  assert.ok(point.x>=-.02&&point.x<=.22);
  assert.ok(point.y>=.655&&point.y<=.655+.75*water);
  assert.ok(point.z>.77&&point.z<.81);
  assert.ok(point.radius>0&&point.radius<=.028);
 }
 assert.deepEqual(points,Array.from({length:KETTLE_BUBBLE_COUNT},(_,i)=>
  kettleBubblePoint(i,time,water,strength)));
});
test("thermals reject invalid particles and inactive water",()=>{
 assert.equal(kettleBubblePoint(-1,1,.7,1),null);
 assert.equal(kettleBubblePoint(KETTLE_BUBBLE_COUNT,1,.7,1),null);
 assert.equal(kettleBubblePoint(1,1,0,1),null);
 assert.equal(kettleBubblePoint(1,1,.7,0),null);
 assert.equal(kettleBubblePoint(.5,1,.7,1),null);
 const point=kettleBubblePoint(2,Number.NaN,5,20);
 assert.ok(point.y>=.655&&point.y<=1.405);
});
