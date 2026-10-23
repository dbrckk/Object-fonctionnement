// Deliberate interaction mode: 3D gestures become requests to the
// existing sandboxed figure buttons, never mutations of parent-side state.
// Labels match the buttons owned by the original ColorFigures controller.
const PRESS=(label)=>Object.freeze({label,action:"press"});
const CYCLE=(label)=>Object.freeze({label,action:"cycle"});
export const PHYSICAL_PART_ACTIONS=Object.freeze({
 kettle:Object.freeze({
  heater:PRESS("Chauffer"),tank:PRESS("Remplir d'eau"),spout:PRESS("Verser")
 }),
 toaster:Object.freeze({
  element:PRESS("Abaisser / griller"),carriage:PRESS("Insérer le pain"),
  dial:CYCLE("Régler le brunissage")
 }),
 fan:Object.freeze({
  blades:PRESS("Marche / arrêt"),motor:CYCLE("Vitesse"),
  oscillation:PRESS("Oscillation")
 }),
 lock:Object.freeze({
  pins:PRESS("Insérer la bonne clé"),cylinder:PRESS("Tourner la clé"),
  shackle:PRESS("Retirer la clé")
 }),
 bicycle:Object.freeze({
  piston:PRESS("Pomper"),check:PRESS("Raccorder / retirer embout")
  // The pressure gauge measures pressure; tapping it must not reset it.
 }),
 coffee:Object.freeze({
  reservoir:PRESS("Ajouter de l'eau"),filter:PRESS("Mettre le café moulu"),
  carafe:PRESS("Préparer le café")
 }),
 flashlight:Object.freeze({
  cells:PRESS("Compartiment piles"),switch:PRESS("Marche / arrêt"),
  led:CYCLE("Intensité")
 }),
 washing:Object.freeze({
  drum:PRESS("Load laundry"),drawer:PRESS("Add soap"),
  program:CYCLE("Choose program")
 })
});
export const INTERACTIVE_MODELS=Object.freeze(Object.keys(PHYSICAL_PART_ACTIONS));
const FRENCH_CONTROLLER_LABELS=Object.freeze({
 "Load laundry":"Charger le linge",
 "Add soap":"Ajouter la lessive",
 "Choose program":"Choisir le programme",
 "Start / pause":"Démarrer / pause",
 "Open door, unload":"Ouvrir et décharger"
});
export function physicalActionLabel(action){
 return FRENCH_CONTROLLER_LABELS[action?.label]||action?.label||"";
}
/**
 * Derive the action from the selected part and the live sandbox snapshot.
 * No component changes the controller's simulation state in this module.
 */
export function partMechanismAction(objectId,partId,figureState={}){
 if(typeof objectId!=="string"||!Object.hasOwn(PHYSICAL_PART_ACTIONS,objectId))return null;
 const byPart=PHYSICAL_PART_ACTIONS[objectId];
 if(typeof partId!=="string"||!Object.hasOwn(byPart,partId))return null;
 const baseline=byPart[partId];
 const s=figureState&&typeof figureState==="object"?figureState:{};
 if(objectId==="coffee"&&partId==="carafe"&&
    typeof s.coffee==="number"&&s.coffee>0&&!s.brewing)
  return PRESS("Servir");
 if(objectId==="washing"&&partId==="drum"){
  if(s.run||s.paused)return PRESS("Start / pause");
  if(s.done&&s.laundry==="drum")return PRESS("Open door, unload");
  if(s.laundry==="drum")return PRESS("Start / pause");
 }
 return baseline;
}
export function physicalControlCommand(model,partId,state){
 if(!INTERACTIVE_MODELS.includes(model)||typeof partId!=="string")return null;
 const action=partMechanismAction(model,partId,state);
 return action?{type:"object-figure:mechanism-command",
  action:action.action,label:action.label}:null;
}
