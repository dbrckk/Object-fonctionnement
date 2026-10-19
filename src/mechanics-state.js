// Visual-state adapters for ColorFigures' existing educational simulations.
// Keep physical phases deterministic so changes in the SVG and the WebGL
// presentation can be validated separately. All values are normalized.
export const WASH_PROGRAMS=Object.freeze([
 {name:"cotton",duration:10,fill:1.4,wash:6,drain:7},
 {name:"quick",duration:7,fill:1,wash:3.6,drain:4.4},
 {name:"spin",duration:4,fill:0,wash:0,drain:0}
]);

const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number.isFinite(Number(n))?Number(n):0));
const smooth=(a,b,t)=>{const x=clamp((t-a)/(b-a||1),0,1);return x*x*(3-2*x);};
export function washerMechanics(s={}){
 const program=WASH_PROGRAMS[Math.floor(clamp(s.prog,0,WASH_PROGRAMS.length-1))];
 const time=clamp(s.tau,0,program.duration);
 const running=Boolean(s.run);
 const paused=Boolean(s.paused);
 const phase=!running?"idle":time<program.fill?"fill":time<program.wash?"wash":time<program.drain?"drain":"spin";
 let water=0,speed=0;
 if(running){
  if(program.fill>0){
   if(time<program.fill)water=smooth(0,program.fill,time);
   else if(time<program.wash)water=1;
   else if(time<program.drain)water=1-smooth(program.wash,program.drain,time);
  }
  if(!paused){
   if(phase==="fill")speed=.7;
   else if(phase==="wash")speed=2.6*(Math.sin((time-program.fill)*Math.PI/1.5)>=0?1:-1);
   else if(phase==="drain")speed=1.2;
   else speed=(1.5+19*smooth(program.drain,program.drain+1.2,time))*(1-smooth(program.duration-.7,program.duration,time));
  }
 }
 return {phase,water,speed,progress:time/program.duration,door:clamp(s.door,0,1),
  drawer:clamp(s.drawer,0,1),hasLaundry:s.laundry==="drum"||Boolean(s.xfer),
  paused,finished:Boolean(s.done)};
}
export function lockMechanics(s={}){
 return {inserted:Boolean(s.key),aligned:Boolean(s.key&&s.aligned),
  unlocked:s.locked===false,angle:clamp(s.angle,-120,120)*Math.PI/180,
  turning:Boolean(s.turning)};
}
export function vendingMechanics(s={}){
 const raw=s.drop;
 const hasDrop=raw&&typeof raw==="object"
   &&Number.isInteger(raw.r)&&Number.isInteger(raw.c)
   &&raw.r>=0&&raw.r<4&&raw.c>=0&&raw.c<4;
 const drop=hasDrop?{row:raw.r,col:raw.c,progress:clamp(raw.t,0,1)}:null;
 return {drop,trayVisible:Boolean(s.tray),flap:clamp(s.flap,0,1),
  returned:Math.max(0,Number(s.returned)||0),
  credit:Math.max(0,Number(s.credit)||0),
  stock:Array.isArray(s.stock)?s.stock:null};
}
