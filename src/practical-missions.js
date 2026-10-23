// Eight hands-on learning missions, observed exclusively from original figure states.
// No imitation of physical mechanisms and no privileged control of the iframe.
export const MISSION_STORAGE_KEY="object-fonctionnement:practical-missions:v1";

const stage=(label,hint,partId,predicate)=>Object.freeze({label,hint,partId,predicate});
export const PRACTICAL_MISSIONS=Object.freeze({
 kettle:Object.freeze({title:"Préparer une chauffe",
  steps:Object.freeze([
   stage("Remplir la cuve","Touche le réservoir pour ajouter de l'eau.","tank",s=>s.water>=.8),
   stage("Démarrer la chauffe","Touche la résistance, puis regarde la chauffe commencer.","heater",s=>s.heating===true)
  ])}),
 toaster:Object.freeze({title:"Faire griller du pain",
  steps:Object.freeze([
   stage("Placer le pain","Touche le chariot pour insérer les tranches.","carriage",s=>s.bread>0),
   stage("Régler le brunissage","Fais glisser le réglage jusqu'au niveau 3 ou plus.","dial",s=>s.level>=3),
   stage("Lancer le grillage","Touche les résistances pour démarrer le cycle.","element",s=>s.toasting===true)
  ])}),
 fan:Object.freeze({title:"Régler un ventilateur",
  steps:Object.freeze([
   stage("Démarrer le moteur","Touche les pales pour mettre le ventilateur en marche.","blades",s=>s.speed>=1),
   stage("Augmenter la vitesse","Passe à la vitesse 2 ou 3 avec le moteur.","motor",s=>s.speed>=2),
   stage("Activer l'oscillation","Touche le mécanisme d'oscillation pour répartir l'air.","oscillation",s=>s.oscillate===true)
  ])}),
 lock:Object.freeze({title:"Ouvrir un cadenas",
  steps:Object.freeze([
   stage("Insérer la clé","Touche les goupilles pour insérer la bonne clé.","pins",s=>s.key===true&&s.aligned===true),
   stage("Déverrouiller","Tourne le barillet pour libérer le verrou.","cylinder",s=>s.locked===false)
  ])}),
 bicycle:Object.freeze({title:"Gonfler un pneu",
  steps:Object.freeze([
   stage("Raccorder l'embout","Touche le clapet pour relier la pompe au pneu.","check",s=>s.connected===true),
   stage("Pomper une fois","Fais descendre le piston. La pression doit augmenter.","piston",s=>s.pumps>=1&&s.pressure>.7)
  ])}),
 coffee:Object.freeze({title:"Préparer une cafetière",
  steps:Object.freeze([
   stage("Ajouter l'eau","Remplis le réservoir.","reservoir",s=>s.water>.5),
   stage("Ajouter le café moulu","Place le café moulu dans le filtre.","filter",s=>s.grounds===true),
   stage("Lancer la préparation","Touche la verseuse pour lancer l'extraction.","carafe",s=>s.brewing===true)
  ])}),
 flashlight:Object.freeze({title:"Régler une lampe de poche",
  steps:Object.freeze([
   stage("Allumer la lampe","Actionne l'interrupteur.","switch",s=>s.on===true),
   stage("Passer en intensité forte","Glisse sur la LED ou utilise le réglage.","led",s=>s.brightness===2)
  ])}),
 washing:Object.freeze({title:"Démarrer une lessive",
  steps:Object.freeze([
   stage("Charger le tambour","Charge le linge et termine le transfert.","drum",s=>s.laundry==="drum"&&!s.xfer),
   stage("Choisir un programme","Choisis le programme 2 ou 3.","program",s=>s.prog>=1),
   stage("Démarrer le cycle","Attends la fermeture du hublot, puis démarre.","drum",s=>s.run===true&&!s.paused)
  ])})
});
export const PRACTICAL_MISSION_IDS=Object.freeze(Object.keys(PRACTICAL_MISSIONS));
export function missionFor(id){
 return typeof id==="string"&&Object.hasOwn(PRACTICAL_MISSIONS,id)
  ?PRACTICAL_MISSIONS[id]:null;
}
export function missionStepMet(id,index,state){
 const mission=missionFor(id);
 if(!mission||!Number.isInteger(index)||index<0||index>=mission.steps.length||
   !state||typeof state!=="object"||Array.isArray(state))return false;
 try{return mission.steps[index].predicate(state)===true;}catch{return false;}
}
// Observe already satisfied prerequisites as well as new commands; progress
// is never granted based solely on a tap/command request or a visual frame.
export function advanceMission(id,index,state){
 const mission=missionFor(id);
 if(!mission)return {index:0,advanced:0,completed:false};
 const start=Number.isInteger(index)?Math.max(0,Math.min(mission.steps.length,index)):0;
 let next=start;
 while(next<mission.steps.length&&missionStepMet(id,next,state))next++;
 return {index:next,advanced:next-start,completed:next===mission.steps.length};
}
export function normalizeMissionCompletions(raw){
 if(!Array.isArray(raw))return [];
 const seen=new Set();
 return raw.filter(id=>{
  if(typeof id!=="string"||!missionFor(id)||seen.has(id))return false;
  seen.add(id);return true;
 });
}
export function readMissionCompletions(storage){
 try{return normalizeMissionCompletions(JSON.parse(storage.getItem(MISSION_STORAGE_KEY)||"[]"));}catch{return [];}
}
export function saveMissionCompletions(storage,ids){
 const value=normalizeMissionCompletions(ids);
 try{storage.setItem(MISSION_STORAGE_KEY,JSON.stringify(value));}catch{}
 return value;
}
