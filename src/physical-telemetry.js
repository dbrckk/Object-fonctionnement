// Offline, read-only telemetry from the *original* ColorFigures controllers.
// This module neither simulates devices nor invents state when a sensor is absent.
const safe = value => typeof value==="number"&&Number.isFinite(value)?value:null;
const percent = value => {const n=safe(value);return n===null?"—":Math.round(Math.max(0,Math.min(1,n))*100)+" %";};
const level = (value,digits=1) => {const n=safe(value);return n===null?"—":n.toFixed(digits).replace(".",",");};
const stateText=(s,key,yes,no)=>typeof s[key]==="boolean"?(s[key]?yes:no):"—";
const item=(id,label,value)=>({id,label,value});
const telemetry = {
 kettle:s=>[
  item("water","Eau",percent(s.water)),
  item("heater","Chauffage",stateText(s,"heating","En cours","Arrêté")),
  item("temperature","Progression chauffe",percent(s.hot))],
 toaster:s=>[
  item("bread","Pain",safe(s.bread)===null?"—":s.bread>0?"Inséré":"Absent"),
  item("heater","Grillage",stateText(s,"toasting","En cours","Arrêté")),
  item("level","Brunissage",safe(s.level)===null?"—":String(s.level)+" / 5")],
 fan:s=>[
  item("motor","Moteur",safe(s.speed)===null?"—":s.speed===0?"Arrêté":"Vitesse "+Math.round(s.speed)),
  item("oscillation","Oscillation",stateText(s,"oscillate","Active","Arrêtée")),
  item("rotation","Hélice",safe(s.speed)===null?"—":s.speed>0?"En rotation":"Immobile")],
 lock:s=>[
  item("key","Clé",stateText(s,"key","Insérée","Retirée")),
  item("pins","Goupilles",stateText(s,"aligned","Alignées","Non alignées")),
  item("lock","Serrure",stateText(s,"locked","Verrouillée","Déverrouillée"))],
 bicycle:s=>[
  item("valve","Embout",stateText(s,"connected","Raccordé","Déconnecté")),
  item("pressure","Pression",safe(s.pressure)===null?"—":level(s.pressure)+" bar"),
  item("pumps","Coups de pompe",safe(s.pumps)===null?"—":String(Math.max(0,Math.floor(s.pumps))))],
 coffee:s=>[
  item("water","Réservoir",percent(s.water)),
  item("filter","Café moulu",stateText(s,"grounds","Présent","Absent")),
  item("carafe","Verseuse",percent(s.coffee))],
 flashlight:s=>[
  item("circuit","Interrupteur",stateText(s,"on","Allumé","Éteint")),
  item("brightness","Intensité",safe(s.brightness)===null?"—":String(s.brightness)+" / 2"),
  item("battery","Batterie",percent(s.battery))],
 washing:s=>[
  item("laundry","Tambour",s.laundry==="basket"?"Vide":s.laundry==="drum"?"Chargé":"—"),
  item("program","Programme",safe(s.prog)===null?"—":String(Math.floor(s.prog)+1)),
  item("cycle","Cycle",s.run===true?(s.paused===true?"En pause":"En cours")
   :s.done===true?"Terminé":s.run===false?"À l’arrêt":"—")],
};
export const LIVE_TELEMETRY_MODELS=Object.freeze(Object.keys(telemetry));
export function physicalReadouts(model,state){
 if(typeof model!=="string"||!Object.hasOwn(telemetry,model))return [];
 if(!state||typeof state!=="object"||Array.isArray(state))return telemetry[model]({});
 return telemetry[model](state);
}

// The fields that *prove* whether an original controller has acted. Do not
// interpret unrelated 60fps visual animation as evidence of a successful click.
const PROOF_FIELDS=Object.freeze({
 kettle:{"Chauffer":["heating","phase","hot"],"Remplir d'eau":["water"],"Verser":["water"]},
 toaster:{"Abaisser / griller":["toasting","done","hot"],"Insérer le pain":["bread"],
  "Régler le brunissage":["level"]},
 fan:{"Marche / arrêt":["speed"],"Vitesse":["speed"],"Oscillation":["oscillate"]},
 lock:{"Insérer la bonne clé":["key","aligned"],"Tourner la clé":["locked","turning"],
  "Retirer la clé":["key","aligned"]},
 bicycle:{"Pomper":["pumping","pumps","pressure"],"Raccorder / retirer embout":["connected"]},
 coffee:{"Ajouter de l'eau":["water"],"Mettre le café moulu":["grounds"],
  "Préparer le café":["brewing","progress","coffee"],"Servir":["coffee"]},
 flashlight:{"Compartiment piles":["open"],"Marche / arrêt":["on","glow"],
  "Intensité":["brightness"]},
 washing:{"Load laundry":["xfer","laundry","doorT"],"Add soap":["soap","soapAnim","soapLvl"],
  "Choose program":["prog"],"Start / pause":["run","paused"],
  "Open door, unload":["doorT","xfer","laundry"]}
});
export function physicalCommandConfirmed(model,command,before,after){
 if(!command||typeof command.label!=="string"||
    typeof model!=="string"||!Object.hasOwn(PROOF_FIELDS,model)||
    !Object.hasOwn(PROOF_FIELDS[model],command.label)||
    !before||!after||typeof before!=="object"||typeof after!=="object")return false;
 return PROOF_FIELDS[model][command.label].some(key=>
   Object.hasOwn(before,key)&&Object.hasOwn(after,key)&&
   JSON.stringify(before[key])!==JSON.stringify(after[key]));
}
