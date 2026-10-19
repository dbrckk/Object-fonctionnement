export const QUESTIONS={
 kettle:{q:"Quel composant chauffe l'eau ?",options:["La résistance électrique","La poignée isolante","Le bec verseur"],answer:0,why:"La résistance convertit l'énergie électrique en chaleur et transmet cette chaleur à l'eau."},
 toaster:{q:"Pourquoi les tranches remontent-elles ?",options:["La vapeur les pousse","Un mécanisme libère le chariot à ressort","L'air froid les soulève"],answer:1,why:"À la fin du cycle, le système libère le chariot maintenu en position basse et un ressort le remonte."},
 washing:{q:"Quel mécanisme évacue l'eau du lave-linge ?",options:["La courroie","Le thermostat","La pompe de vidange"],answer:2,why:"La pompe évacue l'eau ; le moteur entraîne le tambour pour le lavage et l'essorage."},
 fan:{q:"Que fait directement un ventilateur ?",options:["Il met l'air en mouvement","Il refroidit systématiquement l'air de la pièce","Il extrait l'humidité de l'air"],answer:0,why:"Les pales déplacent l'air. Le courant d'air facilite notamment l'évaporation sur la peau."},
 lock:{q:"Pourquoi la bonne clé permet-elle de tourner le barillet ?",options:["Elle aimante le cylindre","Elle aligne les goupilles à la ligne de césure","Elle chauffe les ressorts"],answer:1,why:"Le profil adapté de la clé place les goupilles de sorte que le barillet peut tourner."},
 bicycle:{q:"Quel est le rôle du clapet antiretour ?",options:["Mesurer la vitesse de gonflage","Refroidir la pompe","Empêcher l'air comprimé de revenir"],answer:2,why:"Un clapet permet à l'air de progresser vers le pneu sans refluer pendant le mouvement du piston."},
 coffee:{q:"À quoi sert le filtre ?",options:["Il chauffe l'eau","Il retient le marc de café","Il règle la pression électrique"],answer:1,why:"Le filtre laisse passer la boisson mais retient une grande partie des particules de café moulu."},
 vending:{q:"Qu'est-ce qui déclenche la libération d'un produit ?",options:["Un moteur commandé après validation de la sélection","Le poids de toutes les marchandises","Le refroidissement du distributeur"],answer:0,why:"Le contrôleur vérifie le crédit et la sélection, puis active le mécanisme motorisé de distribution."},
 flashlight:{q:"Que fait l'interrupteur d'une lampe ?",options:["Il recharge directement les piles","Il produit la lumière","Il ouvre ou ferme le circuit électrique"],answer:2,why:"L'interrupteur permet ou interrompt le passage du courant vers la LED."}
};
export const QUIZ_STORAGE_KEY="object-fonctionnement:quiz:v1";
export function parseQuizProgress(raw){
 try{
  const obj=JSON.parse(raw||"{}");
  if(!obj||typeof obj!=="object"||Array.isArray(obj))return {};
  return Object.fromEntries(Object.keys(QUESTIONS).filter(id=>obj[id]===true).map(id=>[id,true]));
 }catch{return {};}
}
export function progressCount(progress){
 return Object.keys(QUESTIONS).filter(id=>progress[id]===true).length;
}
