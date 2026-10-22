import test from 'node:test';
import assert from 'node:assert/strict';
import {coffeeFlowState,coffeeFlowParticle} from '../src/coffee-flow.js';

test('hot water flows only when brewing with grounds and reservoir water',()=>{
 assert.equal(coffeeFlowState({brewing:true,water:.8,grounds:true},2).active,true);
 for(const state of [
  {brewing:false,water:.8,grounds:true},
  {brewing:true,water:0,grounds:true},
  {brewing:true,water:.8,grounds:false},
  {brewing:true,water:-2,grounds:true}
 ])assert.equal(coffeeFlowState(state,2).active,false);
});
test('flow phases remain bounded and staggered',()=>{
 for(const t of [-100,0,1,1e5]){
  const state=coffeeFlowState({brewing:true,water:1,grounds:true},t);
  assert.ok(state.phase>=0&&state.phase<1);
  for(let i=0;i<6;i++){
   const particle=coffeeFlowParticle(state.phase,i);
   assert.ok(particle>=0&&particle<1);
  }
 }
 assert.equal(coffeeFlowParticle(.2,-1),null);
 assert.equal(coffeeFlowParticle(.2,0,0),null);
});
test('idle heater fades rather than reporting active heating',()=>{
 assert.equal(coffeeFlowState({brewing:false,coffee:0}).heat,0);
 assert.ok(coffeeFlowState({brewing:false,coffee:.5}).heat<.1);
 assert.equal(coffeeFlowState({brewing:true,water:.6,grounds:true}).heat,1);
});
