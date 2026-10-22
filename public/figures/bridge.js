/* Sandboxed local figure bridge: bounded simulation state and responsive height; no privileged actions. */
(() => {
 "use strict";
 // One shared loader upgrades every object, including the original MIT demos.
 // Assets are bundled locally and load in standalone figure pages as well.
 const stylesheet=document.createElement("link");
 stylesheet.rel="stylesheet";
 stylesheet.href="./studio.css";
 document.head.appendChild(stylesheet);
 const sound=document.createElement("script");
 sound.src="./soundscape.js";
 document.body.appendChild(sound);
 if(window.parent===window)return;
 window.addEventListener("message",event=>{
  if(event.source!==window.parent)return;
  if(event.data?.type!=="object-figure:view-mode")return;
  document.documentElement.classList.toggle("three-active",event.data.mode==="3d");
  queue();
 });
 let previousState="";
 const emitState=()=>{
  if(!window.__st)return;
  const next={};
  for(const [key,value] of Object.entries(window.__st)){
   if(value==null||["string","number","boolean"].includes(typeof value))next[key]=value;
  }
  // The original vending simulation represents products with nested arrays
  // and its falling can / tray with small objects. Send only those known
  // fields, validating and bounding their size before the sandbox message.
  // We do not forward arbitrary nested state, DOM nodes, or user data.
  if(Array.isArray(window.__st.stock)){
   // Prices originate in the original machine; never trust an arbitrary
   // unbounded array crossing the sandbox boundary.
   next.prices=Array.isArray(window.__st.prices)
    ?window.__st.prices.slice(0,4).map(value=>
      typeof value==="number"&&Number.isFinite(value)&&value>0&&value<=5?value:null)
    :[];
   next.stock=window.__st.stock.slice(0,4).map(row=>
    Array.isArray(row)?row.slice(0,4).map(value=>
     Math.max(0,Math.min(3,Math.floor(Number(value)||0)))):[]
   );
   const raw=window.__st.drop;
   next.drop=raw&&Number.isInteger(raw.r)&&Number.isInteger(raw.c)
     ?{r:raw.r,c:raw.c,t:Math.max(0,Math.min(1,Number(raw.t)||0))}
     :null;
   const tray=window.__st.tray;
   next.tray=tray&&typeof tray==="object"
     ?{code:String(tray.code||"").slice(0,8)}:null;
  }
  const serialized=JSON.stringify(next);
  if(serialized!==previousState){
   previousState=serialized;
   window.parent.postMessage({type:"object-figure:state",value:next},"*");
  }
 };
 setInterval(emitState,120);
 window.parent.postMessage({type:"object-figure:ready"},"*");

 let last=0,scheduled=false;
 const report=()=>{
  scheduled=false;
  const body=document.body,html=document.documentElement;
  if(!body||!html)return;
  const padding=parseFloat(getComputedStyle(body).paddingBottom)||0;
  const bottom=[...body.children].reduce((m,element)=>{
    if(getComputedStyle(element).position==="fixed")return m;
    const box=element.getBoundingClientRect();
    return Math.max(m,box.bottom+window.scrollY);
  },0);
  const height=Math.ceil(Math.max(420,body.scrollHeight,html.scrollHeight,bottom+padding));
  if(!Number.isFinite(height)||height===last)return;
  last=height;
  window.parent.postMessage({type:"object-figure:resize",height},"*");
 };
 const queue=()=>{
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(report);
 };
 if(typeof ResizeObserver!=="undefined"){
  const observer=new ResizeObserver(queue);
  const observed=new WeakSet();
  const track=()=>{
   // The body is height:100%. Watching only it misses changes in
   // individual cards and CSS that load after mountFigure finishes.
   for(const element of [document.documentElement,document.body,...document.body.children]){
    if(!element||observed.has(element))continue;
    observed.add(element);
    observer.observe(element);
   }
  };
  track();
  new MutationObserver(()=>{track();queue();}).observe(document.body,{childList:true});
 }
 if(document.fonts?.ready)void document.fonts.ready.then(queue).catch(()=>{});
 window.addEventListener("load",queue);
 window.addEventListener("resize",queue);
 window.addEventListener("orientationchange",queue);
 // Delayed font/layout changes, even on older Android WebViews.
 setTimeout(queue,100);
 setTimeout(queue,650);
 queue();
})();
