/* Lightweight French presentation layer for the two MIT ColorFigures demos.
   Leaves the original drawings, events, and underlying simulations untouched. */
(()=>{
 "use strict";
 const isWasher=/washing machine/i.test(document.title);
 const isVending=/vending machine/i.test(document.title);
 if(!isWasher&&!isVending)return;
 const map=isWasher?new Map([
  ["Load laundry","Charger le linge"],
  ["Add soap","Ajouter la lessive"],
  ["Choose program","Choisir le programme"],
  ["Start / pause","Démarrer / pause"],
  ["Open door, unload","Ouvrir et décharger"],
  ["Close door","Fermer le hublot"],
  ["COTTON","Coton"],
  ["QUICK","Rapide"],
  ["SPIN","Essorage"]
 ]):new Map([
  ["Insert 50c","Insérer 50 cts"],
  ["Choose a drink","Choisir un produit"],
  ["Open pickup door","Ouvrir le bac"],
  ["Take your drink","Prendre le produit"],
  ["Return change","Rendre la monnaie"],
  ["Take coins","Récupérer les pièces"]
 ]);
 const title=isWasher?"Lave-linge":"Distributeur automatique";
 const subtitle=isWasher?
 "Charge le tambour, choisis un programme et démarre un cycle.":
 "Insère des pièces, sélectionne un produit et récupère-le.";
 const idea=isWasher?
 "L'arrivée d'eau, la rotation du tambour et la vidange se succèdent. L'essorage élimine une partie de l'eau des textiles.":
 "Le monnayeur vérifie le crédit, le mécanisme libère le produit sélectionné, puis celui-ci tombe dans le bac.";
 document.title=title+" — Object Fonctionnement";
 const heading=document.querySelector('header h1');
 if(heading)heading.textContent=title;
 const hint=document.querySelector('header span');
 if(hint)hint.textContent=subtitle;
 const note=document.querySelector('.idea');
 if(note){const prefix=note.querySelector('strong');if(prefix)prefix.textContent='À retenir';note.lastChild.textContent=idea;}
 const wobble=document.querySelector('label[for="wb"]');
 if(wobble)wobble.textContent="Effet dessin à la main";
 const col=document.getElementById('pals')?.previousElementSibling;
 if(col)col.textContent="Couleur";
 const labels=document.querySelector('#lblctl label');
 if(labels)labels.textContent="Repères";
 const head=document.querySelector('#btns .cap');
 if(head)head.textContent="Manipuler";
 const translate=()=>{
  for(const element of document.querySelectorAll('button.act,button.chip')){
   const node=element.firstChild;
   if(!node||node.nodeType!==Node.TEXT_NODE)continue;
   const val=node.nodeValue.trim();
   if(map.has(val))node.nodeValue=map.get(val);
  }
 };
 translate();
 const buttons=document.querySelector('#btns');
 if(buttons)new MutationObserver(translate).observe(buttons,{childList:true,subtree:true});
})();
