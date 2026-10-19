import test from "node:test";
import assert from "node:assert/strict";
import {QUESTIONS,parseQuizProgress,progressCount} from "../src/quiz.js";
import {OBJECTS} from "../src/catalog.js";

test("each object has a grounded one-question learning check",()=>{
 assert.equal(Object.keys(QUESTIONS).length,OBJECTS.length);
 for(const object of OBJECTS){
  const q=QUESTIONS[object.id];
  assert.ok(q,object.id+" missing quiz");
  assert.equal(q.options.length,3);
  assert.equal(new Set(q.options).size,3);
  assert.ok(q.answer>=0&&q.answer<3);
  assert.ok(q.why.length>35);
 }
});
test("progress is offline, validated and resilient to corruption",()=>{
 assert.deepEqual(parseQuizProgress("bad json"),{});
 assert.deepEqual(parseQuizProgress('{"kettle":true,"unknown":true,"fan":false}'),{kettle:true});
 assert.equal(progressCount({kettle:true,coffee:true,unknown:true}),2);
});
