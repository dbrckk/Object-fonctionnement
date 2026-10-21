// One-way valve movement for the pump's explanatory 3D cutaway.
// Stroke progress rises as the handle moves DOWN (compression).
// The inlet check valve stays shut on the return/upstroke.
// Animation previews may supply valveOpen explicitly without mutating
// the authoritative simulation.
const clamp=n=>Math.max(0,Math.min(1,Number.isFinite(n)?n:0));
export function bicycleValveMotion(state={},previousStroke=null,descending=false){
 const stroke=clamp(Number(state.piston)||0);
 const preview=typeof state.valveOpen==="number"&&Number.isFinite(state.valveOpen);
 if(preview)return {stroke,descending:false,open:clamp(state.valveOpen)};
 const pumping=state.connected===true&&state.pumping===true;
 if(!pumping)descending=false;
 else if(Number.isFinite(previousStroke)){
  if(stroke>previousStroke+.002)descending=true;
  else if(stroke<previousStroke-.002)descending=false;
 }
 return {stroke,descending,open:pumping&&descending?1:0};
}
