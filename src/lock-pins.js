// The lower/upper pin junction lies precisely on the shear line when
// the correct inserted key aligns the five pin stacks.
// These are schematic cutaway dimensions, not lock picking tolerances.
export const LOCK_SHEAR_Y=1.27;
export const LOCK_PIN_BIAS=Object.freeze([-.075,.045,-.035,.065,-.055]);
const LOWER_CENTER=LOCK_SHEAR_Y-.095;
const UPPER_CENTER=LOCK_SHEAR_Y+.060;
const SPRING_BASE=LOCK_SHEAR_Y+.120;
const SPRING_ROOF=1.58;
export function lockPinTarget(index,aligned){
 if(!Number.isInteger(index)||index<0||index>=LOCK_PIN_BIAS.length)return null;
 const offset=aligned?0:LOCK_PIN_BIAS[index];
 return {
  offset,
  lowerY:LOWER_CENTER+offset,
  upperY:UPPER_CENTER+offset,
  junctionY:LOCK_SHEAR_Y+offset,
  springBottom:SPRING_BASE+offset,
  springLength:SPRING_ROOF-(SPRING_BASE+offset)
 };
}
export function lockPinsAreAligned(junctions,tolerance=.006){
 return Array.isArray(junctions)&&junctions.length===LOCK_PIN_BIAS.length
  &&junctions.every(y=>Number.isFinite(y)&&Math.abs(y-LOCK_SHEAR_Y)<=tolerance);
}
