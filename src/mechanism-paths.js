/* A causal learning sequence, deliberately distinct from the unordered
 * component glossary. These are schematic explanations, NOT actual service
 * diagrams or electrical/hydraulic routing.
 */
import {getObjectParts} from "./part-annotations.js";

export const MECHANISM_PATHS=Object.freeze({
 kettle:[
  ["heater","Chauffer","L’électricité alimente la résistance, qui produit de la chaleur."],
  ["tank","Transmettre","La cuve transfère la chaleur à l’eau jusqu’à l’ébullition."],
  ["spout","Verser","L’eau chaude sort par le bec quand on incline la bouilloire."]
 ],
 toaster:[
  ["dial","Choisir","Le réglage détermine la durée du brunissage."],
  ["element","Griller","Les résistances rayonnent de la chaleur vers le pain."],
  ["carriage","Éjecter","À la fin du cycle, le ressort relève le chariot."]
 ],
 fan:[
  ["motor","Entraîner","Le moteur transforme l’énergie électrique en rotation."],
  ["blades","Déplacer l’air","La forme inclinée des pales provoque un flux d’air."],
  ["oscillation","Répartir","Le mécanisme d’oscillation oriente le flux successivement."]
 ],
 lock:[
  ["pins","Aligner","Les tailles des dents de la bonne clé placent les goupilles à la ligne de césure."],
  ["cylinder","Tourner","Le barillet peut tourner une fois les goupilles alignées."],
  ["shackle","Ouvrir","Le verrou libère l’anse, qui remonte hors du corps."]
 ],
 bicycle:[
  ["piston","Comprimer","La poignée actionne le piston et comprime l’air."],
  ["check","Retenir","Un clapet laisse sortir l’air comprimé mais empêche son retour."],
  ["gauge","Contrôler","Le manomètre permet de surveiller la pression obtenue."]
 ],
 coffee:[
  ["reservoir","Faire circuler","L’eau du réservoir est chauffée puis dirigée vers le filtre."],
  ["filter","Extraire","L’eau traverse le café moulu et en extrait des substances solubles."],
  ["carafe","Recueillir","La boisson filtrée s’écoule dans la verseuse."]
 ],
 flashlight:[
  ["cells","Alimenter","Deux piles en série fournissent une tension ; sans circuit fermé, la LED ne reçoit pas de courant."],
  ["switch","Fermer le circuit","L’interrupteur permet au courant de circuler."],
  ["led","Éclairer","La LED produit la lumière, concentrée par le réflecteur."]
 ],
 washing:[
  ["program","Commander","Le programmateur enchaîne remplissage, lavage et essorage."],
  ["drawer","Ajouter la lessive","L’eau entraîne la lessive du tiroir vers la cuve."],
  ["drum","Brasser","Le tambour retourne les textiles, puis accélère pour essorer."]
 ],
 vending:[
  ["selection","Commander","Le clavier identifie la référence et déclenche la commande."],
  ["storage","Libérer","La spirale du compartiment choisi avance et libère un produit."],
  ["pickup","Récupérer","Le produit tombe dans le bac derrière la trappe."]
 ]
});
export function getMechanismPath(objectId){
 const parts=getObjectParts(objectId);
 const byId=new Map(parts.map(part=>[part.id,part]));
 const rows=MECHANISM_PATHS[objectId]||[];
 return rows.map(([partId,title,explanation],index)=>{
  const part=byId.get(partId);
  if(!part)throw new Error("Unknown mechanism anchor: "+objectId+"/"+partId);
  return {
   index,partId,title,explanation,
   partLabel:part.label,
   position:[...part.position]
  };
 });
}
export function validateMechanismPaths(objectIds){
 for(const objectId of objectIds){
  const steps=getMechanismPath(objectId);
  if(steps.length!==3||new Set(steps.map(step=>step.partId)).size!==3)
   return false;
  if(steps.some(step=>!step.title||!step.explanation||step.position.length!==3||
   step.position.some(value=>!Number.isFinite(value))))return false;
 }
 return true;
}
