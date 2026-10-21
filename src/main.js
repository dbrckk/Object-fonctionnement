import "./style.css";
import {Capacitor} from "@capacitor/core";
import {App} from "@capacitor/app";
import {OBJECTS,CATEGORIES,filterObjects} from "./catalog.js";
import {QUESTIONS,QUIZ_STORAGE_KEY,parseQuizProgress,progressCount} from "./quiz.js";
import {readTours,saveTours} from "./learning-progress.js";
import {buildGlossary,filterGlossary} from "./glossary.js";
import {getMechanismPath} from "./mechanism-paths.js";
import {hasMechanismDemo} from "./mechanism-demos.js";
import {GRAPHICS_KEY,readGraphicsMode,validGraphicsMode} from "./graphics-quality.js";
const root=document.getElementById("app");
let quizProgress={};
try{quizProgress=parseQuizProgress(localStorage.getItem(QUIZ_STORAGE_KEY));}catch{}
function saveQuizProgress(){try{localStorage.setItem(QUIZ_STORAGE_KEY,JSON.stringify(quizProgress));}catch{}}

const VIEW_KEY="object-fonctionnement:view:v1";
function initialView(){try{return localStorage.getItem(VIEW_KEY)!=="2d";}catch{return true;}}
let currentViewer=null,loadingViewer=0,lastFigureState=null,pendingPart=null;
let mechanismFlowActive=false,mechanismFlowIndex=0;
function unmountViewer(){
 loadingViewer++;
 mechanismFlowActive=false;mechanismFlowIndex=0;
 lastFigureState=null;
 if(currentViewer){currentViewer.dispose();currentViewer=null;}
}
function postViewMode(mode){
 const frame=document.querySelector("iframe.figure-frame");
 if(frame?.contentWindow)frame.contentWindow.postMessage({type:"object-figure:view-mode",mode},"*");
}
async function mountViewer(id){
 const token=++loadingViewer;
 const host=document.getElementById("three-mount");
 if(!host||!state.view3D){postViewMode("2d");return;}
 const fallback=()=>{
  if(token!==loadingViewer)return;
  state.view3D=false;
  try{localStorage.setItem(VIEW_KEY,"2d");}catch{}
  unmountViewer();
  host.replaceChildren();
  host.closest(".three-shell")?.setAttribute("hidden","");
  document.querySelector(".simulation")?.classList.remove("show-3d");
  const button=document.getElementById("view-mode");
  if(button){
   button.textContent="Vue 3D indisponible — illustration 2D";
   button.setAttribute("aria-pressed","false");
   button.disabled=true;
  }
  postViewMode("2d");
 };
 try{
  const {createObjectViewer}=await import("./three-viewer.js");
  if(token!==loadingViewer||state.selected!==id||!host.isConnected)return;
  const viewer=createObjectViewer(host,id);
  currentViewer=viewer;
  viewer.setQuality(state.graphicsQuality);
  if(id==="fan")viewer.setAirflow(state.airflowEnabled);
  host.addEventListener("object-3d-error",fallback,{once:true});
  if(pendingPart?.objectId===id){
   const found=viewer.focusPartById(pendingPart.partId);
   if(found){
    const annotations=document.getElementById("three-parts");
    if(annotations){annotations.setAttribute("aria-pressed","true");annotations.textContent="Masquer les repères";}
   }
   pendingPart=null;
  }
  if(lastFigureState)currentViewer.setState(lastFigureState);
  host.closest(".three-shell").hidden=false;
  const stage=document.querySelector(".simulation");
  stage?.classList.add("show-3d");
  const button=document.getElementById("view-mode");
  if(button){button.textContent="Voir l'illustration 2D";button.setAttribute("aria-pressed","true");}
  const iframe=document.querySelector("iframe.figure-frame");
  if(iframe?.contentWindow)postViewMode("3d");
 }catch(error){
  console.info("3D unavailable; ColorFigures fallback:",error.message);
  fallback();
 }
}
function toggleView(){
 state.view3D=!state.view3D;
 try{localStorage.setItem(VIEW_KEY,state.view3D?"3d":"2d");}catch{}
 if(!state.view3D){
  unmountViewer();
  document.querySelector(".three-shell")?.setAttribute("hidden","");
  document.querySelector(".simulation")?.classList.remove("show-3d");
  const button=document.getElementById("view-mode");
  if(button){button.textContent="Explorer en 3D";button.setAttribute("aria-pressed","false");}
  postViewMode("2d");
 }else{
  void mountViewer(state.selected);
 }
}
function changeGraphicsQuality(value){
 state.graphicsQuality=validGraphicsMode(value);
 try{localStorage.setItem(GRAPHICS_KEY,state.graphicsQuality);}catch{}
 currentViewer?.setQuality(state.graphicsQuality);
}
const KEY="object-fonctionnement:favorites:v1";
const SOUND_KEY="object-fonctionnement:sound:v1";
const VOLUME_KEY="object-fonctionnement:volume:v1";
const AIRFLOW_KEY="object-fonctionnement:fan-airflow:v1";
function initialAirflow(){
 try{return localStorage.getItem(AIRFLOW_KEY)==="on";}catch{return false;}
}
function setAirflowPreference(enabled){
 state.airflowEnabled=Boolean(enabled);
 try{localStorage.setItem(AIRFLOW_KEY,state.airflowEnabled?"on":"off");}catch{}
 currentViewer?.setAirflow(state.airflowEnabled);
 const button=document.getElementById("three-airflow");
 if(button){
  button.setAttribute("aria-pressed",String(state.airflowEnabled));
  button.textContent=state.airflowEnabled?"Masquer le flux d’air":"Visualiser le flux d’air";
 }
 const explanation=document.getElementById("fan-airflow-explanation");
 if(explanation)explanation.hidden=!state.airflowEnabled;
}

function initialVolume(){try{const raw=localStorage.getItem(VOLUME_KEY);return raw==null?75:Math.max(0,Math.min(100,parseInt(raw,10)||0));}catch{return 75;}}
function initialSound(){try{return localStorage.getItem(SOUND_KEY)!=="off";}catch{return true;}}
function postSoundSetting(){
 const frame=document.querySelector("iframe.figure-frame");
 if(frame?.contentWindow)frame.contentWindow.postMessage({type:"object-figure:sound-setting",enabled:state.soundEnabled,volume:state.volume/100},"*");
}
function setVolume(volume){
 state.volume=Math.min(100,Math.max(0,Number(volume)||0));
 try{localStorage.setItem(VOLUME_KEY,String(state.volume));}catch{}
 const text=document.getElementById("volume-number");
 if(text)text.textContent=String(state.volume)+" %";
 postSoundSetting();
}
function setSound(enabled){
 state.soundEnabled=Boolean(enabled);
 try{localStorage.setItem(SOUND_KEY,state.soundEnabled?"on":"off");}catch{}
 const button=document.getElementById("global-sound");
 if(button){button.setAttribute("aria-pressed",String(state.soundEnabled));button.textContent=state.soundEnabled?"♫ Son activé":"♪ Son coupé";}
 postSoundSetting();
}

function readFavorites(){try {const data=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(data)?data.filter(x=>typeof x==="string"):[];}catch{return [];}}
const allObjectIds=OBJECTS.map(o=>o.id);
const glossaryEntries=buildGlossary(OBJECTS);
function markTourFinished(id){
 if(!allObjectIds.includes(id)||state.completedTours.includes(id))return;
 state.completedTours=saveTours(localStorage,[...state.completedTours,id],allObjectIds);
 const indicator=document.getElementById("tour-status");
 if(indicator)indicator.textContent="Visite guidée terminée";
 const btn=document.getElementById("three-tour");
 if(btn)btn.textContent="Revoir les pièces";
}

const state={view3D:initialView(),graphicsQuality:readGraphicsMode(localStorage),airflowEnabled:initialAirflow(),query:"",category:"Tout",favoritesOnly:false,reviewOnly:false,glossaryOpen:false,glossaryQuery:"",favorites:readFavorites(),completedTours:readTours(localStorage,allObjectIds),selected:null,running:false,phase:0,soundEnabled:initialSound(),volume:initialVolume()};
let timeoutA;
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state.favorites));}catch{}}
function clearTimers(){clearTimeout(timeoutA);state.running=false;state.phase=0;}
function display(){unmountViewer();const selected=OBJECTS.find(o=>o.id===state.selected);if(selected){renderDetail(selected);return;}renderCatalog();}
function renderCatalog(){
 const results=filterObjects(OBJECTS,state).filter(o=>!state.reviewOnly||quizProgress[o.id]!==true);
 root.innerHTML='<header class="hero"><div class="brand">OBJET<span>·</span>FONCTIONNEMENT</div><p class="eyebrow">LE MONDE, EXPLIQUÉ</p><h1>Comment ça <em>marche ?</em></h1><p>Explore les objets du quotidien. Comprends leur mécanisme et apprends à les utiliser.</p><div class="hero-stat">'+OBJECTS.length+' objets à découvrir <span>•</span> 100 % hors ligne <span>•</span> '+state.completedTours.length+'/'+OBJECTS.length+' visites effectuées <span>•</span> '+progressCount(quizProgress)+'/'+OBJECTS.length+' connaissances validées</div></header><main><div class="search-bar"><span aria-hidden="true">⌕</span><input id="search" aria-label="Rechercher un objet" placeholder="Rechercher un objet..." autocomplete="off" value="'+escapeHtml(state.query)+'"></div><div class="filters" aria-label="Catégories">'+CATEGORIES.map(c=>'<button class="chip '+(state.category===c?'active':'')+'" data-category="'+escapeHtml(c)+'">'+escapeHtml(c)+'</button>').join("")+'</div><div class="glossary-toggle-row"><button id="glossary-toggle" class="text-button" aria-expanded="'+state.glossaryOpen+'" aria-controls="glossary-panel">'+(state.glossaryOpen?"Fermer le glossaire":"Glossaire des mécanismes ("+glossaryEntries.length+")")+'</button></div><section id="glossary-panel" class="glossary-panel" aria-label="Glossaire technique" '+(state.glossaryOpen?"":"hidden")+'><div class="glossary-intro"><h2>Comprendre les pièces</h2><p>27 composants expliqués, accessibles hors ligne. Sélectionne une pièce pour la retrouver en 3D.</p></div><label for="glossary-search">Rechercher un composant</label><input id="glossary-search" type="search" autocomplete="off" placeholder="Ex. moteur, thermostat, goupilles…" value="'+escapeHtml(state.glossaryQuery)+'"><div id="glossary-results" class="glossary-results"></div></section><div class="section-header"><h2>'+ (state.reviewOnly?"Objets à réviser":state.favoritesOnly?"Mes favoris":"Explorer les objets")+'</h2><div class="catalog-actions"><button id="review-filter" class="text-button" aria-pressed="'+state.reviewOnly+'">'+(state.reviewOnly?"✓ Voir tous les objets":"À réviser ("+(OBJECTS.length-progressCount(quizProgress))+")")+'</button><button id="fav-filter" class="text-button" aria-pressed="'+state.favoritesOnly+'">'+(state.favoritesOnly?"Voir tout":"☆ Favoris")+'</button></div></div><div class="object-grid">'+(results.length?results.map(o=>'<article class="object-card" style="--object:'+o.color+'"><button class="card-open" data-open="'+o.id+'" aria-label="Découvrir '+escapeHtml(o.name)+'"><div class="object-figure" aria-hidden="true"><img src="/previews/'+escapeHtml(o.figure)+'.webp" alt="" width="480" height="360" loading="lazy" decoding="async"></div><div class="card-category">'+escapeHtml(o.category)+'</div>'+(state.completedTours.includes(o.id)?'<span class="tour-completed-card">✓ Visite effectuée</span>':'')+'<h3>'+escapeHtml(o.name)+'</h3><p>'+escapeHtml(o.summary)+'</p><span class="discover">Découvrir <span aria-hidden="true">↗</span></span></button><button class="favorite" data-favorite="'+o.id+'" aria-label="'+(state.favorites.includes(o.id)?"Retirer des favoris":"Ajouter aux favoris")+'" aria-pressed="'+state.favorites.includes(o.id)+'">'+(state.favorites.includes(o.id)?"★":"☆")+'</button></article>').join(""):'<p class="empty">Aucun objet trouvé. Essaie une autre recherche.</p>')+'</div></main><footer>Explications pédagogiques — toujours suivre la notice du fabricant.</footer>';
 document.getElementById("search").addEventListener("input",e=>{const position=e.target.selectionStart;state.query=e.target.value;renderCatalog();const input=document.getElementById("search");input.focus();input.setSelectionRange(position,position);});
 document.querySelectorAll("[data-category]").forEach(el=>el.addEventListener("click",()=>{state.category=el.dataset.category;display();}));
 document.querySelectorAll("[data-open]").forEach(el=>el.addEventListener("click",()=>{state.selected=el.dataset.open;history.pushState({source:"object-fonctionnement",object:state.selected},"","#"+state.selected);display();window.scrollTo(0,0);}));
 document.querySelectorAll("[data-favorite]").forEach(el=>el.addEventListener("click",()=>toggleFavorite(el.dataset.favorite)));
 document.getElementById("fav-filter").addEventListener("click",()=>{state.favoritesOnly=!state.favoritesOnly;display();});
 document.getElementById("review-filter").addEventListener("click",()=>{state.reviewOnly=!state.reviewOnly;display();});
 document.getElementById("glossary-toggle").addEventListener("click",()=>{
  state.glossaryOpen=!state.glossaryOpen;
  const panel=document.getElementById("glossary-panel");
  panel.hidden=!state.glossaryOpen;
  document.getElementById("glossary-toggle").setAttribute("aria-expanded",String(state.glossaryOpen));
  document.getElementById("glossary-toggle").textContent=state.glossaryOpen?"Fermer le glossaire":"Glossaire des mécanismes ("+glossaryEntries.length+")";
  if(state.glossaryOpen)renderGlossaryResults();
 });
 const glossaryInput=document.getElementById("glossary-search");
 glossaryInput.addEventListener("input",event=>{
  state.glossaryQuery=event.target.value;
  renderGlossaryResults();
 });
 if(state.glossaryOpen)renderGlossaryResults();
}
function renderGlossaryResults(){
 const target=document.getElementById("glossary-results");
 if(!target)return;
 const matches=filterGlossary(glossaryEntries,state.glossaryQuery);
 target.innerHTML=matches.length?matches.map((part)=>
  '<article class="glossary-item"><div><h3>'+escapeHtml(part.label)+'</h3><span class="glossary-object">'+escapeHtml(part.objectName)+'</span><p>'+escapeHtml(part.detail)+'</p></div><button type="button" data-glossary-object="'+escapeHtml(part.objectId)+'" data-glossary-part="'+escapeHtml(part.partId)+'" aria-label="Voir '+escapeHtml(part.label)+' sur '+escapeHtml(part.objectName)+' en 3D">Voir en 3D ↗</button></article>'
 ).join(""):'<p class="empty">Aucun composant trouvé.</p>';
 target.querySelectorAll("[data-glossary-part]").forEach(button=>button.addEventListener("click",()=>{
  const objectId=button.dataset.glossaryObject;
  const partId=button.dataset.glossaryPart;
  if(!glossaryEntries.some(p=>p.objectId===objectId&&p.partId===partId))return;
  pendingPart={objectId,partId};
  state.selected=objectId;
  state.view3D=true;
  try{localStorage.setItem(VIEW_KEY,"3d");}catch{}
  history.pushState({source:"object-fonctionnement",object:objectId},"","#"+objectId);
  display();window.scrollTo(0,0);
 }));
}
function toggleFavorite(id){
 state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];
 persist();
 if(state.selected===id){
  // Updating a bookmark must never remount the iframe: doing so resets any in-progress simulation.
  const btn=document.getElementById("favorite-detail");
  if(btn){
   const active=state.favorites.includes(id);
   btn.textContent=active?"★ Retirer des favoris":"☆ Ajouter aux favoris";
   btn.setAttribute("aria-pressed",String(active));
  }
  return;
 }
 display();
}
function renderDetail(o){
 const flowSteps=getMechanismPath(o.id);
 root.innerHTML='<header class="detail-header"><button id="back" class="back">← Catalogue</button><button id="global-sound" class="audio-toggle" aria-label="Activer ou désactiver les bruitages" aria-pressed="'+state.soundEnabled+'">'+(state.soundEnabled?"♫ Son activé":"♪ Son coupé")+'</button><span class="brand small">OBJET<span>·</span>FONCTIONNEMENT</span></header><main class="detail"><p class="eyebrow">'+escapeHtml(o.category)+' / COMPRENDRE</p><h1>'+escapeHtml(o.name)+'</h1><p class="intro">'+escapeHtml(o.summary)+'</p><div class="audio-mix-row"><label for="global-volume">Volume des bruitages</label><input type="range" id="global-volume" min="0" max="100" step="5" value="'+state.volume+'" aria-label="Volume des bruitages"><output id="volume-number" for="global-volume">'+state.volume+' %</output></div><div class="simulation" style="--object:'+o.color+'">'+(o.figure ? '<div class="three-shell" hidden><div class="three-header"><span class="three-label">MODÈLE 3D INTERACTIF</span><div class="three-actions"><label class="graphics-label" for="graphics-quality">Qualité 3D</label><select id="graphics-quality" aria-label="Qualité graphique 3D"><option value="auto"'+(state.graphicsQuality==="auto"?" selected":"")+'>Automatique</option><option value="eco"'+(state.graphicsQuality==="eco"?" selected":"")+'>Économie</option><option value="high"'+(state.graphicsQuality==="high"?" selected":"")+'>Haute qualité</option></select><button id="three-flow" aria-pressed="false" aria-controls="mechanism-flow-panel">Comprendre le mécanisme</button><button id="three-tour" aria-label="Commencer la visite guidée des pièces">'+(state.completedTours.includes(o.id)?"Revoir les pièces":"Visite guidée")+'</button><button id="three-parts" aria-pressed="false">Identifier les pièces</button><button id="three-explore" aria-pressed="false">Voir les pièces internes</button>'+(o.id==="fan"?'<button id="three-airflow" aria-controls="fan-airflow-explanation" aria-pressed="'+state.airflowEnabled+'">'+(state.airflowEnabled?"Masquer le flux d’air":"Visualiser le flux d’air")+'</button>':"")+'<button id="three-reset" aria-label="Recentrer la caméra 3D">↺ Recentrer</button></div></div><div id="three-mount"></div><section id="mechanism-flow-panel" class="mechanism-flow-panel" aria-label="Parcours du mécanisme" hidden><p class="mechanism-flow-intro">Ordre de fonctionnement schématique : les flèches relient des fonctions, pas des conduits ou des câbles réels.</p><ol class="mechanism-flow-list">'+flowSteps.map((step,i)=>'<li><button type="button" data-flow-step="'+i+'" aria-pressed="'+(i===0)+'"><span class="flow-step-number">'+(i+1)+'</span><span><strong>'+escapeHtml(step.title)+'</strong><small>'+escapeHtml(step.partLabel)+'</small></span></button></li>').join("")+'</ol><p id="mechanism-flow-detail" class="mechanism-flow-detail" role="status" aria-live="polite"></p><div class="mechanism-demo-row"><button id="mechanism-demo" type="button" aria-describedby="mechanism-demo-hint">▶ Voir le mouvement</button><span id="mechanism-demo-hint">Aperçu illustratif du modèle 3D, sans modifier la simulation.</span></div><div id="mechanism-scrub-row" class="mechanism-scrub-row" hidden><label for="mechanism-scrub">Examiner image par image</label><input type="range" id="mechanism-scrub" min="0" max="100" step="1" value="0" aria-label="Position du mouvement illustratif, de 0 à 100 %" aria-describedby="mechanism-demo-hint"><output id="mechanism-scrub-value" for="mechanism-scrub">0 %</output><button type="button" id="mechanism-reset">Retour à la simulation</button></div><p id="mechanism-demo-status" role="status" aria-live="polite" class="mechanism-demo-status"></p><div class="mechanism-flow-nav"><span id="mechanism-flow-counter"></span><button id="mechanism-previous" type="button">← Précédent</button><button id="mechanism-next" type="button">Suivant →</button><button id="mechanism-exit" type="button">Fermer</button></div></section>'+(o.id==="fan"?'<p id="fan-airflow-explanation" class="fan-airflow-explanation"'+(state.airflowEnabled?"":" hidden")+'><strong>Trajet de l’air :</strong> les particules représentent la direction du courant créé par les pales. Active le moteur dans la simulation pour les voir. Illustration pédagogique, pas une mesure de débit.</p>':"")+'<p class="three-help">Glisser : rotation · Pincer : zoom · Identifier les pièces : explications</p><p id="tour-status" class="tour-status" role="status">'+(state.completedTours.includes(o.id)?"Visite guidée terminée":"3 pièces à découvrir")+'</p></div><button id="view-mode" class="view-switch" aria-pressed="false">Explorer en 3D</button><iframe class="figure-frame"  title="Démonstration interactive : '+escapeHtml(o.name)+'" src="/figures/'+o.figure+'.html" sandbox="allow-scripts" loading="eager" referrerpolicy="no-referrer"></iframe><p class="simulation-note">Manipule les commandes du modèle isométrique ci-dessus. Modèle isométrique interactif basé sur ColorFigures (licence MIT). Les commandes simulent le principe de fonctionnement.</p>' : '<div class="simulation-figure '+(state.running?'animated':'')+'" aria-hidden="true"><span>'+o.icon+'</span></div><div class="simulation-status" role="status" aria-live="polite">'+escapeHtml(o.states[state.phase])+'</div><button id="simulate" class="primary" '+(state.running?'disabled':'')+'>'+(state.running?'Simulation en cours…':'▶ '+escapeHtml(o.action))+'</button><p class="simulation-note">Animation pédagogique simplifiée, non représentative de toutes les pièces internes.</p>')+'</div><section class="information"><h2>Comment ça fonctionne ?</h2><p>'+escapeHtml(o.how)+'</p></section><section class="information"><h2>Mode d’utilisation</h2><ol class="steps">'+o.steps.map(s=>'<li>'+escapeHtml(s)+'</li>').join("")+'</ol></section><section class="safety"><strong>À savoir</strong><p>'+escapeHtml(o.safety)+'</p></section><section class="quiz-panel" aria-label="Vérification des connaissances"><div class="quiz-heading"><h2>As-tu compris le mécanisme ?</h2><span id="quiz-status">'+(quizProgress[o.id]?"✓ Connaissance validée":"Une question pour vérifier")+'</span></div><p>'+escapeHtml(QUESTIONS[o.id].q)+'</p><div id="quiz-choices" class="quiz-choices">'+QUESTIONS[o.id].options.map((choice,index)=>'<button data-answer="'+index+'" aria-label="Réponse '+(index+1)+' : '+escapeHtml(choice)+'">'+escapeHtml(choice)+'</button>').join("")+'</div><p id="quiz-feedback" role="status" aria-live="polite"></p></section><button id="favorite-detail" class="secondary" aria-pressed="'+state.favorites.includes(o.id)+'">'+(state.favorites.includes(o.id)?"★ Retirer des favoris":"☆ Ajouter aux favoris")+'</button></main><footer>Les indications peuvent varier selon le modèle. Consulte sa notice.</footer>';
 document.getElementById("back").addEventListener("click",returnToCatalog);
 document.getElementById("global-sound").addEventListener("click",()=>setSound(!state.soundEnabled));
 document.getElementById("global-volume").addEventListener("input",event=>setVolume(event.target.value));
 const frame=document.querySelector("iframe.figure-frame");
 if(frame)frame.addEventListener("load",()=>{postSoundSetting();postViewMode(currentViewer?"3d":"2d");});
 document.getElementById("view-mode").addEventListener("click",toggleView);
 function setDemoProgress(value){
  const bounded=Math.max(0,Math.min(100,Math.round(Number(value)||0)));
  document.getElementById("mechanism-scrub").value=String(bounded);
  document.getElementById("mechanism-scrub-value").value=bounded+" %";
 }
 function updateMechanismFlowUi(index=0){
  mechanismFlowIndex=index;
  const demoButton=document.getElementById("mechanism-demo");
  const supported=hasMechanismDemo(o.id,index);
  delete demoButton.dataset.playing;
  demoButton.disabled=!supported;
  demoButton.textContent=supported?"▶ Voir le mouvement":"Mouvement non modélisé";
  document.getElementById("mechanism-scrub-row").hidden=!supported;
  setDemoProgress(0);
  document.getElementById("mechanism-demo-hint").textContent=supported
   ?"Aperçu illustratif dans le modèle 3D ; la simulation reste inchangée."
   :"Cette étape n'a pas de mouvement 3D représenté fidèlement.";
  document.getElementById("mechanism-demo-status").textContent="";
  document.querySelectorAll("[data-flow-step]").forEach(button=>
   button.setAttribute("aria-pressed",String(Number(button.dataset.flowStep)===index)));
  document.getElementById("mechanism-flow-detail").textContent=flowSteps[index].explanation;
  document.getElementById("mechanism-flow-counter").textContent="Étape "+(index+1)+" / "+flowSteps.length;
  document.getElementById("mechanism-previous").disabled=index===0;
  document.getElementById("mechanism-next").textContent=index===flowSteps.length-1?"Terminer":"Suivant →";
 }
 function toggleMechanismFlow(enabled){
  const active=currentViewer?.setMechanismPath(Boolean(enabled))??false;
  mechanismFlowActive=active;
  const button=document.getElementById("three-flow");
  button.setAttribute("aria-pressed",String(active));
  button.textContent=active?"Masquer le parcours":"Comprendre le mécanisme";
  document.getElementById("mechanism-flow-panel").hidden=!active;
  if(!active){
   document.getElementById("mechanism-demo-status").textContent="";
   delete document.getElementById("mechanism-demo").dataset.playing;
   setDemoProgress(0);
  }
  if(active){
   // Only one instructional overlay at a time: the parts/tour markers
   // are hidden by the 3D viewer when the path is activated.
   const partButton=document.getElementById("three-parts");
   partButton.setAttribute("aria-pressed","false");
   partButton.textContent="Identifier les pièces";
   updateMechanismFlowUi(0);
  }
  return active;
 }
 function selectMechanismFlowStep(index){
  if(!mechanismFlowActive||!Number.isInteger(index)||index<0||index>=flowSteps.length)return false;
  if(!currentViewer?.setMechanismStep(index))return false;
  updateMechanismFlowUi(index);
  return true;
 }
 document.getElementById("mechanism-demo").addEventListener("click",()=>{
  const button=document.getElementById("mechanism-demo");
  if(!mechanismFlowActive||!button||button.disabled)return;
  const currentStep=mechanismFlowIndex;
  const status=document.getElementById("mechanism-demo-status");
  if(button.dataset.playing==="true"){
   if(currentViewer?.cancelMechanismStep()){
    delete button.dataset.playing;
    button.textContent="↻ Revoir le mouvement";
    setDemoProgress(0);
    status.textContent="Aperçu arrêté. La simulation normale a repris.";
   }
   return;
  }
  const startingPosition=Math.min(99,Number(document.getElementById("mechanism-scrub").value)||0);
  const started=currentViewer?.playMechanismStep(currentStep,()=>{
   if(!mechanismFlowActive||mechanismFlowIndex!==currentStep||!button.isConnected)return;
   delete button.dataset.playing;
   button.disabled=false;
   button.textContent="↻ Revoir le mouvement";
   setDemoProgress(0);
   status.textContent="Aperçu terminé. La simulation normale a repris.";
  },fraction=>{
   if(mechanismFlowActive&&mechanismFlowIndex===currentStep&&button.isConnected)
    setDemoProgress(fraction*100);
  },startingPosition/100);
  if(!started)return;
  button.dataset.playing="true";
  button.disabled=false;
  button.textContent="■ Arrêter le mouvement";
  status.textContent="Aperçu du fonctionnement en cours.";
 });
 document.getElementById("mechanism-scrub").addEventListener("input",event=>{
  if(!mechanismFlowActive||!hasMechanismDemo(o.id,mechanismFlowIndex))return;
  const percent=Math.max(0,Math.min(100,Number(event.target.value)||0));
  if(!currentViewer?.seekMechanismStep(mechanismFlowIndex,percent/100))return;
  setDemoProgress(percent);
  const button=document.getElementById("mechanism-demo");
  delete button.dataset.playing;
  button.textContent="▶ Reprendre depuis ici";
  document.getElementById("mechanism-demo-status").textContent=
   "Image figée à "+percent+" %. La simulation reste inchangée.";
 });
 document.getElementById("mechanism-reset").addEventListener("click",()=>{
  if(!mechanismFlowActive)return;
  currentViewer?.cancelMechanismStep();
  const button=document.getElementById("mechanism-demo");
  delete button.dataset.playing;
  button.textContent="▶ Voir le mouvement";
  setDemoProgress(0);
  document.getElementById("mechanism-demo-status").textContent=
   "Retour à la simulation normale.";
 });
 document.getElementById("three-flow").addEventListener("click",()=>toggleMechanismFlow(!mechanismFlowActive));
 document.querySelectorAll("[data-flow-step]").forEach(button=>
  button.addEventListener("click",()=>selectMechanismFlowStep(Number(button.dataset.flowStep))));
 document.getElementById("mechanism-previous").addEventListener("click",()=>
  selectMechanismFlowStep(mechanismFlowIndex-1));
 document.getElementById("mechanism-next").addEventListener("click",()=>{
  if(mechanismFlowIndex===flowSteps.length-1)toggleMechanismFlow(false);
  else selectMechanismFlowStep(mechanismFlowIndex+1);
 });
 document.getElementById("mechanism-exit").addEventListener("click",()=>toggleMechanismFlow(false));
 document.getElementById("three-tour").addEventListener("click",()=>{
  if(mechanismFlowActive)toggleMechanismFlow(false);
  if(!currentViewer)return;
  const started=currentViewer.startTour(()=>markTourFinished(o.id));
  if(started){
   const button=document.getElementById("three-parts");
   button.setAttribute("aria-pressed","true");
   button.textContent="Masquer les repères";
  }
 });
 document.getElementById("three-parts").addEventListener("click",event=>{
  if(!currentViewer)return;
  if(mechanismFlowActive)toggleMechanismFlow(false);
  const button=event.currentTarget;
  const visible=currentViewer.setAnnotations(button.getAttribute("aria-pressed")!=="true");
  button.setAttribute("aria-pressed",String(visible));
  button.textContent=visible?"Masquer les repères":"Identifier les pièces";
 });
 document.getElementById("graphics-quality").addEventListener("change",event=>changeGraphicsQuality(event.target.value));
 const airflowButton=document.getElementById("three-airflow");
 if(airflowButton)airflowButton.addEventListener("click",()=>setAirflowPreference(!state.airflowEnabled));
 document.getElementById("three-reset").addEventListener("click",()=>{
  if(mechanismFlowActive)toggleMechanismFlow(false);
  currentViewer?.resetCamera();
 });
 document.getElementById("three-explore").addEventListener("click",event=>{
  if(!currentViewer)return;
  const button=event.currentTarget;
  const next=button.getAttribute("aria-pressed")!=="true";
  const active=currentViewer.setXray(next);
  button.setAttribute("aria-pressed",String(active));
  button.textContent=active?"Extérieur normal":"Voir les pièces internes";
 });
 if(state.view3D)void mountViewer(o.id);

 document.querySelectorAll("[data-answer]").forEach(button=>button.addEventListener("click",()=>{
  const question=QUESTIONS[o.id];
  const correct=Number(button.dataset.answer)===question.answer;
  document.querySelectorAll("[data-answer]").forEach(option=>{
   option.setAttribute("aria-pressed",String(option===button));
   option.classList.toggle("quiz-correct",correct&&Number(option.dataset.answer)===question.answer);
   option.classList.toggle("quiz-wrong",!correct&&option===button);
   if(correct)option.disabled=true;
  });
  const feedback=document.getElementById("quiz-feedback");
  feedback.textContent=correct?"Bonne réponse. "+question.why:"Pas tout à fait. Relis l'explication, puis essaie une autre réponse.";
  if(correct){
   quizProgress[o.id]=true;saveQuizProgress();
   document.getElementById("quiz-status").textContent="✓ Connaissance validée";
  }
 }));
 document.getElementById("favorite-detail").addEventListener("click",()=>toggleFavorite(o.id));
 if(!o.figure)document.getElementById("simulate").addEventListener("click",()=>{if(state.running)return;state.running=true;state.phase=1;display();timeoutA=setTimeout(()=>{state.phase=2;state.running=false;display();},o.duration);});
}
function returnToCatalog(){
 if(!state.selected)return;
 if(history.state?.source==="object-fonctionnement"){
  history.back();
 }else{
  clearTimers();
  state.selected=null;
  history.replaceState(null,"",location.pathname+location.search);
  display();
 }
}
// Capacitor normally exits on Android Back if no native backButton handler is installed.
if(Capacitor.isNativePlatform()){
 void App.addListener("backButton",()=>{
  if(state.selected){returnToCatalog();}
  else {void App.minimizeApp();}
 }).catch(error=>console.error("Android back-button listener:",error));
}
// Messages are accepted only from the currently mounted, sandboxed figure.
window.addEventListener("message",event=>{
 const iframe=document.querySelector("iframe.figure-frame");
 if(!iframe||event.source!==iframe.contentWindow)return;
 if(event.data?.type==="object-figure:state"){
  if(event.data.value&&typeof event.data.value==="object"){
   lastFigureState=event.data.value;
   currentViewer?.setState(lastFigureState);
  }
  return;
 }
 if(event.data?.type==="object-figure:ready"){postViewMode(currentViewer?"3d":"2d");return;}
 if(event.data?.type==="object-figure:sound-ready"){postSoundSetting();return;}
 if(event.data?.type==="object-figure:sound-preference"){
  if(typeof event.data.enabled==="boolean")setSound(event.data.enabled);
  return;
 }
 if(event.data?.type!=="object-figure:resize")return;
 const height=Number(event.data.height);
 if(!Number.isFinite(height)||height<350||height>2400)return;
 const rounded=Math.ceil(height);
 if(iframe.dataset.measuredHeight!==String(rounded)){
  iframe.style.height=rounded+"px";
  iframe.dataset.measuredHeight=String(rounded);
 }
});
function syncRoute(){
 clearTimers();
 const key=decodeURIComponent(location.hash.slice(1));
 state.selected=OBJECTS.some(o=>o.id===key)?key:null;
 display();
}
window.addEventListener("popstate",syncRoute);
window.addEventListener("hashchange",syncRoute);
const hash=decodeURIComponent(location.hash.slice(1));if(OBJECTS.some(o=>o.id===hash))state.selected=hash;display();
