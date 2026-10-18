/* Size-only bridge for a sandboxed, same-application figure; no data or privileged actions. */
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
  new ResizeObserver(queue).observe(document.body);
 }
 window.addEventListener("load",queue);
 window.addEventListener("resize",queue);
 window.addEventListener("orientationchange",queue);
 // Delayed font/layout changes, even on older Android WebViews.
 setTimeout(queue,100);
 setTimeout(queue,650);
 queue();
})();
