import test from "node:test";
import assert from "node:assert/strict";
import {normalizeTours,readTours,saveTours,TOUR_PROGRESS_KEY} from "../src/learning-progress.js";
import {OBJECTS} from "../src/catalog.js";
const ids=OBJECTS.map(o=>o.id);
const memory=()=>({
 map:new Map(),
 getItem(k){return this.map.get(k)??null;},
 setItem(k,v){this.map.set(k,v);}
});
test("completed visits exclude duplicates and unknown model IDs",()=>{
 assert.deepEqual(normalizeTours(["kettle","kettle","__unknown__",3,"fan"],ids),["kettle","fan"]);
 assert.deepEqual(normalizeTours("kettle",ids),[]);
});
test("completed tour data persists offline and tolerates corrupt storage",()=>{
 const storage=memory();
 assert.deepEqual(readTours(storage,ids),[]);
 assert.deepEqual(saveTours(storage,["kettle","fan","kettle"],ids),["kettle","fan"]);
 assert.deepEqual(readTours(storage,ids),["kettle","fan"]);
 storage.setItem(TOUR_PROGRESS_KEY,"{broken");
 assert.deepEqual(readTours(storage,ids),[]);
});
test("privacy or storage restrictions do not break the tour",()=>{
 const denied={getItem(){throw Error("denied");},setItem(){throw Error("denied");}};
 assert.deepEqual(readTours(denied,ids),[]);
 assert.deepEqual(saveTours(denied,["lock"],ids),["lock"]);
});
