/* Read-only hydraulic presentation of the original ColorFigures wash cycle.
 * No pump, reservoir, detergent or drain state is ever sent to the iframe.
 * Water and detergent flow only in physically relevant phases.
 */
import {washerMechanics} from "./mechanics-state.js";
const clamp=n=>Math.max(0,Math.min(1,Number.isFinite(Number(n))?Number(n):0));
export function washerHydraulicState(state={}){
 const mechanism=washerMechanics(state);
 const active=Boolean(state.run)&&!mechanism.paused;
 const instructional=clamp(state.hydraulicDemo);
 const intake=(active&&mechanism.phase==="fill")||instructional>.36;
 const drain=active&&mechanism.phase==="drain"&&mechanism.water>.005;
 const soap=clamp(state.soapLvl);
 // Detergent is flushed in the fill step only if added to the drawer.
 return {phase:mechanism.phase,
   paused:mechanism.paused,
   intake,detergent:intake&&(soap>.05||instructional>.02),
   drain,progress:mechanism.progress,water:mechanism.water};
}
