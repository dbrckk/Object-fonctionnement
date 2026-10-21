/* Short, opt-in visual previews for the causal explanations.
 * A preview changes ONLY the Three.js representation. The sandboxed
 * ColorFigures simulation, its controls, user progress and saved state
 * are never modified. Unsupported physical operations stay unavailable.
 */
export const MECHANISM_DEMO_DURATION_MS=2100;
const clamp=t=>Math.max(0,Math.min(1,Number.isFinite(t)?t:0));
const wave=t=>Math.sin(Math.PI*2*t);
const smooth=t=>{const x=clamp(t);return x*x*(3-2*x);};
const DEMOS=Object.freeze({
 kettle:[
  t=>({water:.74,hot:.30+.6*smooth(t),heating:true,steam:.03}),
  t=>({water:.75,hot:.35+.65*smooth(t),heating:true,steam:.12+.55*smooth(t)}),
  null // Pouring requires tilting a real vessel; this model cannot do that.
 ],
 toaster:[
  t=>({bread:true,level:1+Math.min(4,Math.floor(t*5)),hot:0,toasting:false,done:false,eject:0}),
  t=>({bread:true,level:3,toasting:true,hot:.18+.75*smooth(t),done:false,eject:0}),
  t=>({bread:true,toasting:false,hot:.8,done:t>=.35,eject:smooth((t-.35)/.65)})
 ],
 fan:[
  t=>({speed:2,turn:t*Math.PI*13,oscillate:false,angle:0}),
  t=>({speed:3,turn:t*Math.PI*16,oscillate:false,angle:0}),
  t=>({speed:2,turn:t*Math.PI*13,oscillate:true,angle:wave(t)*1.3})
 ],
 lock:[
  t=>({key:true,aligned:t>.35,locked:true,turning:false,angle:0}),
  t=>({key:true,aligned:true,locked:true,turning:true,angle:90*smooth(t)}),
  t=>({key:true,aligned:true,locked:t<.18,turning:false,angle:90})
 ],
 bicycle:[
  t=>({piston:(1-Math.cos(t*Math.PI*6))/2,pressure:1.1+1.2*smooth(t)}),
  t=>({connected:true,pumping:true,piston:.25+.58*smooth(t),pressure:1.4+.3*smooth(t),
    valveOpen:smooth((t-.10)/.28)*(1-smooth((t-.76)/.22)),valveFlow:t}),
  t=>({piston:0,pressure:1+3.2*smooth(t)})
 ],
 coffee:[
  t=>({water:.82,grounds:true,coffee:.04+.15*smooth(t),brewing:true}),
  t=>({water:.72,grounds:true,coffee:.15+.25*smooth(t),brewing:true}),
  t=>({water:.40,grounds:true,coffee:.22+.60*smooth(t),brewing:true})
 ],
 flashlight:[
  null, // Batteries don't physically move during normal operation.
  t=>({on:t>.23,glow:t>.23?.72:0,brightness:1}),
  t=>({on:true,glow:.32+.68*smooth(t),brightness:2})
 ],
 washing:[
  t=>({run:false,prog:Math.min(2,Math.floor(t*3)),drawer:0,door:0,paused:false}),
  t=>({run:false,prog:0,drawer:smooth(t),door:0,paused:false}),
  t=>({run:true,paused:false,prog:0,tau:2.7+t*1.5,laundry:"drum",drawer:0,door:0})
 ],
 vending:[
  null, // Physical keypad pressing is not connected to a mechanical animation.
  t=>({credit:1.5,drop:{r:1,c:2,t:clamp(t)},tray:null,flap:0}),
  t=>({credit:0,drop:null,tray:{code:"B3",kind:"can"},flap:smooth(t)})
 ]
});

export function hasMechanismDemo(objectId,stepIndex){
 return Number.isInteger(stepIndex)&&stepIndex>=0&&stepIndex<3
   &&typeof DEMOS[objectId]?.[stepIndex]==="function";
}
export function mechanismDemoState(objectId,stepIndex,progress,baseState={}){
 if(!hasMechanismDemo(objectId,stepIndex))return null;
 // Never edit the frame state that arrived from ColorFigures.
 // Override only the fields needed for the instructional model.
 const base=baseState&&typeof baseState==="object"?baseState:{};
 return {...base,...DEMOS[objectId][stepIndex](clamp(progress))};
}
export function supportedMechanismDemoCount(){
 return Object.values(DEMOS).reduce((sum,steps)=>
  sum+steps.filter(fn=>typeof fn==="function").length,0);
}
