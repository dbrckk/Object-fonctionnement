// Directional gestures for mechanisms that have a meaningful physical axis.
// Only a short list can consume a drag; all other touches remain orbit gestures.
// This is pure, deterministic and has no dependency on DOM or WebGL.
import {partMechanismAction} from "./physical-actions.js";

const DRAG_TYPES=Object.freeze({
 bicycle:Object.freeze({
  piston:Object.freeze({axis:"y",kind:"press",direction:1,hint:"Glisser le piston vers le bas pour pomper"})
 }),
 toaster:Object.freeze({
  dial:Object.freeze({axis:"x",kind:"step",hint:"Glisser horizontalement pour régler le brunissage"})
 }),
 fan:Object.freeze({
  motor:Object.freeze({axis:"x",kind:"step",hint:"Glisser horizontalement pour régler la vitesse"})
 }),
 flashlight:Object.freeze({
  led:Object.freeze({axis:"x",kind:"step",hint:"Glisser horizontalement pour régler l'intensité"})
 }),
 washing:Object.freeze({
  program:Object.freeze({axis:"x",kind:"step",hint:"Glisser horizontalement pour choisir le programme"})
 })
});

export function physicalGestureType(model,partId,state={}){
 if(typeof model!=="string"||!Object.hasOwn(DRAG_TYPES,model))return null;
 const family=DRAG_TYPES[model];
 if(typeof partId!=="string"||!Object.hasOwn(family,partId))return null;
 if(!partMechanismAction(model,partId,state))return null;
 if(model==="bicycle"&&state?.pumping)return null;
 return family[partId];
}

export function mechanicalGestureCommand(model,partId,start,end,state={}){
 const kind=physicalGestureType(model,partId,state);
 if(!kind||!start||!end)return null;
 if(start.pointerId!==end.pointerId||start.isPrimary===false||end.isPrimary===false||
    start.button!==0||end.button!==0)return null;
 const dx=Number(end.clientX)-Number(start.clientX),
       dy=Number(end.clientY)-Number(start.clientY),
       elapsed=Number(end.timeStamp)-Number(start.timeStamp);
 if(![dx,dy,elapsed].every(Number.isFinite)||elapsed<0||elapsed>2200)return null;
 const primary=kind.axis==="x"?dx:dy,
       offAxis=kind.axis==="x"?dy:dx;
 // Require an intentional full stroke, not a tap, slight wobble or orbit.
 if(Math.abs(primary)<48||Math.abs(offAxis)>Math.max(28,Math.abs(primary)*.55))return null;
 const direction=Math.sign(primary);
 if(kind.direction!==undefined&&direction!==kind.direction)return null;
 const action=partMechanismAction(model,partId,state);
 if(!action)return null;
 return {type:"object-figure:mechanism-command",
  action:kind.kind==="step"?"step":"press",
  label:action.label,...(kind.kind==="step"?{direction}:{})};
}

export function dragInstruction(model,partId,state){
 return physicalGestureType(model,partId,state)?.hint||null;
}
