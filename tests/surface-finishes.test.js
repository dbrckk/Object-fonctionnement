import test from "node:test";
import assert from "node:assert/strict";
import {surfaceNoise,surfaceLuminance,createSurfacePixels,SURFACE_KINDS,SURFACE_SIZE} from "../src/surface-finishes.js";

test("procedural finish is deterministic and normalized",()=>{
 assert.equal(SURFACE_SIZE,128);
 assert.deepEqual(SURFACE_KINDS,["brushed-metal","molded-plastic","rubber"]);
 for(const kind of SURFACE_KINDS){
  const pixels=createSurfacePixels(kind,32);
  assert.equal(pixels.length,32*32*4);
  assert.deepEqual(pixels,createSurfacePixels(kind,32));
  const samples=new Set();
  for(let i=0;i<pixels.length;i+=4){
   samples.add(pixels[i]);
   assert.equal(pixels[i],pixels[i+1]);
   assert.equal(pixels[i],pixels[i+2]);
   assert.equal(pixels[i+3],255);
  }
  assert.ok(samples.size>8,kind+" needs visible material variation");
 }
 assert.ok(surfaceNoise(3,4,5)>=0&&surfaceNoise(3,4,5)<=1);
 assert.notEqual(surfaceLuminance("brushed-metal",22,12),surfaceLuminance("rubber",22,12));
});
test("finish generator rejects unexpected kinds and excessive allocations",()=>{
 assert.throws(()=>createSurfacePixels("unsupported"),RangeError);
 assert.throws(()=>createSurfacePixels("rubber",2000),RangeError);
 assert.throws(()=>createSurfacePixels("rubber",1),RangeError);
 assert.throws(()=>surfaceLuminance("mystery",0,0),RangeError);
});
