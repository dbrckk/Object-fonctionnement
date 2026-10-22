// Educational convection/bubble indicator, constrained to the external
// water gauge. This is a schematic visualization, not a temperature sensor.
// Every point is a pure function so scrubbing a lesson is reproducible.
export const KETTLE_BUBBLE_COUNT=22;
const clamp=n=>Math.max(0,Math.min(1,Number.isFinite(n)?n:0));
export function kettleBubbleStrength(state={}){
 const water=clamp(Number(state.water)||0);
 const hot=clamp(Number(state.hot)||0);
 // Heating and sufficient liquid are both necessary for visible bubbles.
 if(state.heating!==true||water<.09||hot<.38)return 0;
 return clamp((hot-.38)/.52)*clamp((water-.09)/.13);
}
export function kettleBubblePoint(index,time,water,strength){
 if(!Number.isInteger(index)||index<0||index>=KETTLE_BUBBLE_COUNT)return null;
 const level=clamp(water),heat=clamp(strength);
 if(level<=0||heat<=0)return null;
 const clock=Number.isFinite(time)?time:0;
 const seed=(index*.61803398875)%1;
 const progress=(seed+clock*(.21+.17*heat)*(1+(index%5)*.09))%1;
 const channel=(index%3)-1;
 const drift=Math.sin(progress*Math.PI*2+index*1.7)*(.011+.009*heat);
 const x=.10+channel*.064+drift;
 const y=.655+Math.max(.017,.75*level-.028)*progress;
 const z=.785+.004*(index%3);
 const radius=(.009+.010*(index%4)/3)*(0.45+0.55*heat);
 return {x,y,z,radius,progress};
}
