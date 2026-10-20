import test from "node:test";
import assert from "node:assert/strict";
import {AIRFLOW_PARTICLE_COUNT,airSpeed,airflowPoint,airflowParticleBudget} from "../src/fan-airflow.js";

test("airflow speed is bounded to model fan levels",()=>{
 assert.equal(AIRFLOW_PARTICLE_COUNT,64);
 assert.equal(airflowParticleBudget("eco"),24);
 assert.equal(airflowParticleBudget("auto"),40);
 assert.equal(airflowParticleBudget("high"),64);
 assert.equal(airflowParticleBudget("unknown"),40);
 assert.equal(airSpeed(-9),0);
 assert.equal(airSpeed(0),0);
 assert.equal(airSpeed(2),2);
 assert.equal(airSpeed(9),3);
 assert.equal(airSpeed("oops"),0);
 assert.equal(airSpeed(Infinity),0);
});
test("instanced airflow stays in front of the fan and spreads with depth",()=>{
 const points=Array.from({length:AIRFLOW_PARTICLE_COUNT},(_,i)=>airflowPoint(i,4.25,2));
 assert.deepEqual(airflowPoint(12,4.25,2),points[12],"simulation must be deterministic");
 assert.ok(points.every(p=>Object.values(p).every(Number.isFinite)));
 assert.ok(points.every(p=>p.z>=.64&&p.z<3.14));
 assert.ok(points.every(p=>p.size>=.6&&p.size<=1.35));
 assert.ok(new Set(points.map(p=>Math.round(p.x*100)+","+Math.round(p.y*100))).size>50);
 const old=airflowPoint(4,0,1);
 const moved=airflowPoint(4,1,1);
 assert.ok(Math.abs(moved.z-old.z)>.02,"particles must advance with simulation time");
 const slow=airflowPoint(4,1,1);
 const fast=airflowPoint(4,1,3);
 assert.ok(Math.abs(fast.z-slow.z)>.04,"speed must affect transport");
});
