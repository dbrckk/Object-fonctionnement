// A schematic hot-water transit from reservoir through heater to filter.
// Never infer circulation when the original figure has stopped brewing.
const clamp=n=>Math.max(0,Math.min(1,Number.isFinite(n)?n:0));
export function coffeeFlowState(state={},time=0){
 const water=clamp(Number(state.water)||0);
 const active=state.brewing===true&&water>.015&&state.grounds===true;
 const phase=Number.isFinite(time)?((time*.53)%1+1)%1:0;
 const heat=active?1:clamp(Number(state.coffee)||0)*.12;
 return {active,water,phase,heat};
}
export function coffeeFlowParticle(phase,index,count=6){
 if(!Number.isInteger(index)||index<0||!Number.isInteger(count)||count<1)return null;
 return (((phase+index/count)%1)+1)%1;
}
