import "./style.css";
import {Capacitor} from "@capacitor/core";
import {App} from "@capacitor/app";
import {OBJECTS,CATEGORIES,filterObjects} from "./catalog.js";
const root=document.getElementById("app");
const KEY="object-fonctionnement:favorites:v1";
const SOUND_KEY="object-fonctionnement:sound:v1";
function initialSound(){try{return localStorage.getItem(SOUND_KEY)!=="off";}catch{return true;}}
function postSoundSetting(){
 const frame=document.querySelector("iframe.figure-frame");
 if(frame?.contentWindow)frame.contentWindow.postMessage({type:"object-figure:sound-setting",enabled:state.soundEnabled},"*");
}
function setSound(enabled){
 state.soundEnabled=Boolean(enabled);
 try{localStorage.setItem(SOUND_KEY,state.soundEnabled?"on":"off");}catch{}
 const button=document.getElementById("global-sound");
 if(button){button.setAttribute("aria-pressed",String(state.soundEnabled));button.textContent=state.soundEnabled?"♫ Son activé":"♪ Son coupé";}
 postSoundSetting();
}

function readFavorites(){try {const data=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(data)?data.filter(x=>typeof x==="string"):[];}catch{return [];}}
const state={query:"",category:"Tout",favoritesOnly:false,favorites:readFavorites(),selected:null,running:false,phase:0,soundEnabled:initialSound()};
let timeoutA;
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state.favorites));}catch{}}
function clearTimers(){clearTimeout(timeoutA);state.running=false;state.phase=0;}
function display(){const selected=OBJECTS.find(o=>o.id===state.selected);if(selected){renderDetail(selected);return;}renderCatalog();}
function renderCatalog(){
 const results=filterObjects(OBJECTS,state);
 root.innerHTML='<header class="hero"><div class="brand">OBJET<span>·</span>FONCTIONNEMENT</div><p class="eyebrow">LE MONDE, EXPLIQUÉ</p><h1>Comment ça <em>marche ?</em></h1><p>Explore les objets du quotidien. Comprends leur mécanisme et apprends à les utiliser.</p><div class="hero-stat">'+OBJECTS.length+' objets à découvrir <span>•</span> 100 % hors ligne</div></header><main><div class="search-bar"><span aria-hidden="true">⌕</span><input id="search" aria-label="Rechercher un objet" placeholder="Rechercher un objet..." autocomplete="off" value="'+escapeHtml(state.query)+'"></div><div class="filters" aria-label="Catégories">'+CATEGORIES.map(c=>'<button class="chip '+(state.category===c?'active':'')+'" data-category="'+escapeHtml(c)+'">'+escapeHtml(c)+'</button>').join("")+'</div><div class="section-header"><h2>'+ (state.favoritesOnly?"Mes favoris":"Explorer les objets")+'</h2><button id="fav-filter" class="text-button" aria-pressed="'+state.favoritesOnly+'">'+(state.favoritesOnly?"Voir tout":"☆ Favoris")+'</button></div><div class="object-grid">'+(results.length?results.map(o=>'<article class="object-card" style="--object:'+o.color+'"><button class="card-open" data-open="'+o.id+'" aria-label="Découvrir '+escapeHtml(o.name)+'"><div class="object-figure" aria-hidden="true"><img src="/previews/'+escapeHtml(o.figure)+'.webp" alt="" width="480" height="360" loading="lazy" decoding="async"></div><div class="card-category">'+escapeHtml(o.category)+'</div><h3>'+escapeHtml(o.name)+'</h3><p>'+escapeHtml(o.summary)+'</p><span class="discover">Découvrir <span aria-hidden="true">↗</span></span></button><button class="favorite" data-favorite="'+o.id+'" aria-label="'+(state.favorites.includes(o.id)?"Retirer des favoris":"Ajouter aux favoris")+'" aria-pressed="'+state.favorites.includes(o.id)+'">'+(state.favorites.includes(o.id)?"★":"☆")+'</button></article>').join(""):'<p class="empty">Aucun objet trouvé. Essaie une autre recherche.</p>')+'</div></main><footer>Explications pédagogiques — toujours suivre la notice du fabricant.</footer>';
 document.getElementById("search").addEventListener("input",e=>{const position=e.target.selectionStart;state.query=e.target.value;renderCatalog();const input=document.getElementById("search");input.focus();input.setSelectionRange(position,position);});
 document.querySelectorAll("[data-category]").forEach(el=>el.addEventListener("click",()=>{state.category=el.dataset.category;display();}));
 document.querySelectorAll("[data-open]").forEach(el=>el.addEventListener("click",()=>{state.selected=el.dataset.open;history.pushState({source:"object-fonctionnement",object:state.selected},"","#"+state.selected);display();window.scrollTo(0,0);}));
 document.querySelectorAll("[data-favorite]").forEach(el=>el.addEventListener("click",()=>toggleFavorite(el.dataset.favorite)));
 document.getElementById("fav-filter").addEventListener("click",()=>{state.favoritesOnly=!state.favoritesOnly;display();});
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
 root.innerHTML='<header class="detail-header"><button id="back" class="back">← Catalogue</button><button id="global-sound" class="audio-toggle" aria-label="Activer ou désactiver les bruitages" aria-pressed="'+state.soundEnabled+'">'+(state.soundEnabled?"♫ Son activé":"♪ Son coupé")+'</button><span class="brand small">OBJET<span>·</span>FONCTIONNEMENT</span></header><main class="detail"><p class="eyebrow">'+escapeHtml(o.category)+' / COMPRENDRE</p><h1>'+escapeHtml(o.name)+'</h1><p class="intro">'+escapeHtml(o.summary)+'</p><div class="simulation" style="--object:'+o.color+'">'+(o.figure ? '<iframe class="figure-frame" title="Démonstration interactive : '+escapeHtml(o.name)+'" src="/figures/'+o.figure+'.html" sandbox="allow-scripts" loading="eager" referrerpolicy="no-referrer"></iframe><p class="simulation-note">Manipule les commandes du modèle isométrique ci-dessus. Modèle isométrique interactif basé sur ColorFigures (licence MIT). Les commandes simulent le principe de fonctionnement.</p>' : '<div class="simulation-figure '+(state.running?'animated':'')+'" aria-hidden="true"><span>'+o.icon+'</span></div><div class="simulation-status" role="status" aria-live="polite">'+escapeHtml(o.states[state.phase])+'</div><button id="simulate" class="primary" '+(state.running?'disabled':'')+'>'+(state.running?'Simulation en cours…':'▶ '+escapeHtml(o.action))+'</button><p class="simulation-note">Animation pédagogique simplifiée, non représentative de toutes les pièces internes.</p>')+'</div><section class="information"><h2>Comment ça fonctionne ?</h2><p>'+escapeHtml(o.how)+'</p></section><section class="information"><h2>Mode d’utilisation</h2><ol class="steps">'+o.steps.map(s=>'<li>'+escapeHtml(s)+'</li>').join("")+'</ol></section><section class="safety"><strong>À savoir</strong><p>'+escapeHtml(o.safety)+'</p></section><button id="favorite-detail" class="secondary" aria-pressed="'+state.favorites.includes(o.id)+'">'+(state.favorites.includes(o.id)?"★ Retirer des favoris":"☆ Ajouter aux favoris")+'</button></main><footer>Les indications peuvent varier selon le modèle. Consulte sa notice.</footer>';
 document.getElementById("back").addEventListener("click",returnToCatalog);
 document.getElementById("global-sound").addEventListener("click",()=>setSound(!state.soundEnabled));
 const frame=document.querySelector("iframe.figure-frame");
 if(frame)frame.addEventListener("load",postSoundSetting);

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
window.addEventListener("popstate",()=>{clearTimers();const key=decodeURIComponent(location.hash.slice(1));state.selected=OBJECTS.some(o=>o.id===key)?key:null;display();});
const hash=decodeURIComponent(location.hash.slice(1));if(OBJECTS.some(o=>o.id===hash))state.selected=hash;display();
