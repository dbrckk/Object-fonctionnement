// Pure visualization state for the flashlight's electrical circuit.
// Charge markers are schematic; batteries store energy, not a circulating
// luminous liquid. An open switch must never show moving charge.
const clamp01=value=>{
 const n=Number(value);
 return Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;
};
export function flashlightCircuitState(state={}){
 const powered=Boolean(state.on)&&!Boolean(state.open);
 const phase=clamp01(state.circuitPhase);
 const preview=Number.isFinite(state.batteryPulse);
 const pulse=preview?.25+.75*Math.sin(Math.PI*2*clamp01(state.batteryPulse))**2
  :powered?.9:.16;
 return {powered,phase,pulse,energyPreview:preview,compartmentOpen:Boolean(state.open)};
}
export function flashlightChargePoint(index,phase,count=8){
 if(!Number.isInteger(index)||index<0||!Number.isInteger(count)||count<1||index>=count)return null;
 // A closed electrical path is shown only with an energized LED.
 // Fractional offsets deliberately never depend on wall-clock time.
 const t=(clamp01(phase)+index/count)%1;
 return {progress:t,size:.70+.30*Math.sin(Math.PI*t)};
}
