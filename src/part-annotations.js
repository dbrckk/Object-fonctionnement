/* Interactive didactic annotations: anchor positions are actual procedural model units.
   Kept independent of WebGL for validation, internationalization and offline tests.
   Models are schematics, not service manuals. */
export const OBJECT_PARTS = Object.freeze({
 kettle:[
  {id:"heater",label:"Résistance électrique",position:[0,.42,.48],detail:"La résistance convertit l'énergie électrique en chaleur. Le thermostat interrompt l'alimentation lorsque l'eau atteint l'ébullition."},
  {id:"tank",label:"Réservoir d'eau",position:[0,1.15,.55],detail:"La cuve métallique transmet la chaleur à l'eau. Respecte les repères de remplissage pour éviter les débordements."},
  {id:"spout",label:"Bec verseur",position:[-.94,1.66,0],detail:"Le bec canalise l'eau lors du versement. Attention à la vapeur et aux surfaces très chaudes."}
 ],
 toaster:[
  {id:"element",label:"Éléments chauffants",position:[0,1.32,.49],detail:"La résistance transforme l'électricité en chaleur rayonnante, qui grille les surfaces du pain."},
  {id:"carriage",label:"Chariot à ressort",position:[.34,1.59,.09],detail:"Le chariot maintient les tranches abaissées. Quand le cycle se termine, un ressort les remonte."},
  {id:"dial",label:"Réglage du brunissage",position:[.72,.64,.55],detail:"Le réglage influe sur la durée du cycle. Un brunissage plus poussé ne signifie pas forcément une température plus élevée."}
 ],
 fan:[
  {id:"blades",label:"Hélice",position:[0,2.3,.4],detail:"Les pales mettent l'air en mouvement. Leur angle produit une différence de pression et un courant d'air."},
  {id:"motor",label:"Moteur",position:[0,1.95,-.3],detail:"Un moteur électrique entraîne l'hélice. La vitesse modifie le débit d'air et le bruit produit."},
  {id:"oscillation",label:"Oscillation",position:[0,1.63,0],detail:"Un entraînement mécanique fait pivoter la tête du ventilateur pour répartir le flux d'air."}
 ],
 lock:[
  {id:"pins",label:"Goupilles",position:[0,1.1,.5],detail:"La bonne clé soulève les goupilles à la ligne de césure. Le cylindre peut alors tourner."},
  {id:"cylinder",label:"Barillet",position:[0,.91,.49],detail:"Le barillet transmet la rotation de la clé au mécanisme de verrouillage."},
  {id:"shackle",label:"Anse du cadenas",position:[0,2.23,.02],detail:"Lorsque le verrou se libère, l'anse du cadenas peut sortir du boîtier."}
 ],
 bicycle:[
  {id:"piston",label:"Piston",position:[-.65,1.4,.21],detail:"Le mouvement alternatif du piston réduit le volume de la chambre et comprime l'air."},
  {id:"check",label:"Clapet antiretour",position:[-.57,.44,.52],detail:"Le clapet laisse passer l'air vers le pneu et empêche son retour pendant la remontée du piston."},
  {id:"gauge",label:"Manomètre",position:[-.48,.94,.51],detail:"Le manomètre indique la pression. Respecte les valeurs préconisées sur le pneu."}
 ],
 coffee:[
  {id:"reservoir",label:"Réservoir",position:[-.97,1.4,.24],detail:"L'eau froide est stockée puis chauffée et dirigée vers le filtre."},
  {id:"filter",label:"Filtre",position:[.42,1.84,.26],detail:"L'eau chaude traverse le café moulu. Les composés solubles sont extraits dans la boisson."},
  {id:"carafe",label:"Verseuse",position:[.49,.72,.87],detail:"La verseuse collecte le café filtré. La plaque peut rester chaude après la préparation."}
 ],
 flashlight:[
  {id:"cells",label:"Piles et contacts",position:[-.35,.75,.19],detail:"Les deux piles sont en série, du contact positif à la borne négative suivante. Leur énergie chimique est disponible même interrupteur ouvert, mais le courant ne circule que si le circuit est fermé."},
  {id:"switch",label:"Interrupteur",position:[-.12,1.02,.08],detail:"L'interrupteur ferme ou ouvre le circuit d'alimentation de la LED."},
  {id:"led",label:"LED et réflecteur",position:[1.39,.73,0],detail:"La LED émet la lumière et l'optique concentre le faisceau vers l'avant."}
 ],
 washing:[
  {id:"drum",label:"Tambour",position:[0,1.35,.87],detail:"Le tambour retourne les textiles dans l'eau lessivielle. Il accélère à l'essorage pour évacuer l'eau."},
  {id:"drawer",label:"Bac à lessive",position:[-.7,2.36,.9],detail:"L'eau entraîne la lessive du tiroir vers la cuve pendant les phases de lavage."},
  {id:"program",label:"Programmateur",position:[-.47,2.35,.85],detail:"Le programme coordonne arrivée d'eau, chauffage, brassage, rinçage et essorage."}
 ],
 vending:[
  {id:"selection",label:"Sélection",position:[.83,1.8,.83],detail:"Le clavier identifie le produit demandé et transmet l'ordre au contrôleur."},
  {id:"storage",label:"Stockage et spirales",position:[-.3,1.8,.73],detail:"Les rayonnages conservent les produits. Un mécanisme motorisé libère l'article choisi."},
  {id:"pickup",label:"Trappe de récupération",position:[-.25,.48,.87],detail:"Le produit tombe dans le compartiment accessible à l'utilisateur après la distribution."}
 ]
});
export function getObjectParts(id){
 return OBJECT_PARTS[id]||[];
}
