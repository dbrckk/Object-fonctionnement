// Deterministic airflow visualization for the didactic 3D fan.
// Positions are model-local units relative to the front cage. This visualizes
// direction and spread, not calibrated flow speed or turbulence.
export const AIRFLOW_PARTICLE_COUNT=64;
// Keep the rendering cost proportional to the user's mobile graphics setting.
export function airflowParticleBudget(mode){
 return mode==="eco"?24:mode==="high"?AIRFLOW_PARTICLE_COUNT:40;
}

const GOLDEN_ANGLE=2.399963229728653;
const fractional=n=>n-Math.floor(n);
export function airSpeed(value){
 const n=Number(value);
 return Number.isFinite(n)?Math.max(0,Math.min(3,n)):0;
}
export function airflowPoint(index,time,speed){
 const v=airSpeed(speed);
 const i=Math.max(0,Math.floor(Number(index)||0));
 const t=Number.isFinite(Number(time))?Math.max(0,Number(time)):0;
 const progress=fractional((i+.5)/AIRFLOW_PARTICLE_COUNT+t*(.09+.12*v));
 const angle=i*GOLDEN_ANGLE+progress*.65;
 const radialSeed=Math.sqrt(fractional((i+1)*.6180339887498948));
 const radius=(.15+.48*radialSeed)*(1+progress*.60);
 return {
  x:Math.cos(angle)*radius,
  y:Math.sin(angle)*radius,
  z:.64+progress*2.5,
  size:.6+(1-progress)*.75
 };
}
