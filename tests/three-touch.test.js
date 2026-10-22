import test from "node:test";
import assert from "node:assert/strict";
import {isIntentionalTap} from "../src/three-touch.js";
const start={pointerId:8,button:0,isPrimary:true,clientX:122,clientY:210,timeStamp:100};

test("3D taps accept mouse and primary single-touch gestures",()=>{
 assert.equal(isIntentionalTap(start,{...start,clientX:125,timeStamp:210}),true);
 assert.equal(isIntentionalTap(start,{...start,clientY:221,timeStamp:600}),true);
 assert.equal(isIntentionalTap({...start,pointerId:9},
  {...start,pointerId:9,clientX:122,timeStamp:140}),true);
});
test("3D purchasing ignores drags, long presses and other pointers",()=>{
 for(const end of [
  {...start,clientX:134,timeStamp:180},
  {...start,clientY:225,timeStamp:180},
  {...start,timeStamp:751},
  {...start,timeStamp:99},
  {...start,pointerId:9},
  {...start,button:1},
  {...start,isPrimary:false},
  {...start,clientX:Infinity},
  {...start,clientY:NaN}
 ]){
  assert.equal(isIntentionalTap(start,end),false);
 }
 assert.equal(isIntentionalTap(null,start),false);
 assert.equal(isIntentionalTap(start,null),false);
 assert.equal(isIntentionalTap({...start,isPrimary:false},start),false);
});
