import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const HOST=process.env.TEST_BASE_URL ?? 'http://127.0.0.1:4174';
const ids=['kettle','toaster','fan','lock','bicycle','coffee','flashlight','washer','vending'];
// Real pixel comparison rather than only checking 2D control state.
async function changedPixelRatio(before,after){
 const [a,b]=await Promise.all([
  sharp(before).ensureAlpha().raw().toBuffer({resolveWithObject:true}),
  sharp(after).ensureAlpha().raw().toBuffer({resolveWithObject:true})
 ]);
 assert.equal(a.info.width,b.info.width);
 assert.equal(a.info.height,b.info.height);
 let changed=0;
 for(let i=0;i<a.data.length;i+=4){
  const delta=Math.abs(a.data[i]-b.data[i])
   +Math.abs(a.data[i+1]-b.data[i+1])
   +Math.abs(a.data[i+2]-b.data[i+2]);
  if(delta>54)changed++;
 }
 return changed/(a.info.width*a.info.height);
}


async function waitReady(url,ms=15000){
 const start=Date.now();
 while(Date.now()-start<ms){
  try{const response=await fetch(url);if(response.ok)return;}catch{}
  await new Promise(resolve=>setTimeout(resolve,200));
 }
 throw Error('Vite not ready at '+url);
}
const server=process.env.TEST_BASE_URL?null:spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4174','--strictPort'],{
 cwd:root,stdio:'ignore',env:{...process.env,NODE_ENV:'test'}
});
let browser;
const errors=[];
try{
 await waitReady(HOST+'/');
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const id of ids){
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const runtime=[];
  page.on('pageerror',e=>runtime.push(e.message));
  page.on('requestfailed',r=>runtime.push(r.url()+' '+r.failure()?.errorText));
  await page.goto(HOST+'/figures/'+id+'.html',{waitUntil:'load'});
  await page.waitForSelector('#art path');
  const status=await page.evaluate(()=>document.documentElement.dataset.errors||'');
  assert.equal(status,'','figure '+id+' has recorded errors');
  assert.ok((await page.locator('#art path').count())>=25,id+' is not a 3D illustration');
  assert.ok((await page.locator('button.act').count())>=2,id+' has no interactive actions');
  const click=async label=>page.getByRole('button',{name:label,exact:true}).click();
  const state=()=>page.evaluate(()=>window.__st);
  // Functional interactions, not merely click coverage.
  switch(id){
   case 'kettle':
    await click("Remplir d'eau");assert.equal((await state()).water,.85);
    await click("Chauffer");assert.equal((await state()).heating,true);
    await page.waitForFunction(()=>window.__st.phase==='done',{timeout:14000});
    assert.equal((await state()).heating,false);
    await click('Verser');assert.ok((await state()).water<.85);break;
   case 'toaster':
    await click('Insérer le pain');assert.equal((await state()).bread,2);
    await click('Abaisser / griller');
    await page.waitForFunction(()=>window.__st.done,{timeout:14000});
    assert.equal((await state()).toasting,false);break;
   case 'fan':
    await click('Marche / arrêt');
    await page.waitForTimeout(300);
    assert.equal((await state()).speed,1);
    assert.ok((await state()).turn>0);
    await click('Marche / arrêt');assert.equal((await state()).speed,0);break;
   case 'lock':
    await click('Insérer la bonne clé');assert.equal((await state()).aligned,true);
    await click('Tourner la clé');assert.equal((await state()).locked,false);
    await page.waitForFunction(()=>!window.__st.turning,{timeout:4000});
    assert.equal((await state()).angle,90);
    await click('Tourner la clé');assert.equal((await state()).locked,true);
    await page.waitForFunction(()=>!window.__st.turning,{timeout:4000});
    assert.equal((await state()).angle,0);break;
   case 'bicycle':
    await click('Raccorder / retirer embout');assert.equal((await state()).connected,true);
    await click('Pomper');
    await page.waitForFunction(()=>!window.__st.pumping && window.__st.pumps===1,{timeout:7000});
    assert.ok((await state()).pressure>.7);break;
   case 'coffee':
    await click("Ajouter de l'eau");await click('Mettre le café moulu');
    await click('Préparer le café');
    await page.waitForFunction(()=>!window.__st.brewing && window.__st.coffee>0,{timeout:14000});
    await click('Servir');assert.equal((await state()).coffee,0);break;
   case 'flashlight':
    await click('Marche / arrêt');assert.equal((await state()).on,true);
    await click('Marche / arrêt');await click('Compartiment piles');
    assert.equal((await state()).open,true);break;
   case 'washer':
   case 'vending':
    await page.locator('button.act').first().click();break;
  }
  const clientError=await page.evaluate(()=>document.documentElement.dataset.errors||'');
  assert.equal(clientError,'',id+' runtime errors');
  assert.deepEqual(runtime,[],id+' JS and network errors');
  console.log('PASS '+id);
  await page.close();
 }
 const app=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const pageErrors=[];app.on('pageerror',e=>pageErrors.push(e.message));
 await app.goto(HOST+'/',{waitUntil:'load'});
 // Exercise established ColorFigures functionality without allocating dozens
 // of WebGL contexts during the 27 responsive viewport checks.
 await app.evaluate(()=>localStorage.setItem("object-fonctionnement:view:v1","2d"));
 await app.reload();
 assert.equal(await app.locator('article.object-card').count(),9);
 for(const img of await app.locator('.object-figure img').all()){
  await img.scrollIntoViewIfNeeded();
  await img.evaluate(el=>el.decode());
  assert.equal(await img.evaluate(el=>el.naturalWidth>0),true);
 }
 await app.getByRole('button',{name:'Découvrir Bouilloire électrique'}).click();
 await app.frameLocator('iframe.figure-frame').locator('button.act').first().waitFor();
 assert.equal(await app.locator('iframe.figure-frame').count(),1);
 assert.deepEqual(pageErrors,[]);
 // Bookmark toggles must not destroy the nested figure's progress/state.
 const nested=app.frameLocator('iframe.figure-frame');
 await nested.locator('button.act').first().click();
 const stateBefore=await nested.locator('body').evaluate(()=>{window.__st.__qaSentinel='retained';return window.__st.water;});
 const favorite=app.locator('#favorite-detail');
 await favorite.click();
 assert.equal(await favorite.getAttribute('aria-pressed'),'true');
 assert.equal(await nested.locator('body').evaluate(()=>window.__st.__qaSentinel),'retained');
 assert.equal(await nested.locator('body').evaluate(()=>window.__st.water),stateBefore);
 await app.waitForFunction(()=>!!document.querySelector('iframe.figure-frame')?.dataset.measuredHeight,{timeout:6000});
 const height=await app.locator('iframe.figure-frame').evaluate(el=>({measured:el.dataset.measuredHeight,actual:el.getBoundingClientRect().height}));
 assert.ok(height.actual>=420&&height.actual<=2400,'unexpected responsive iframe height '+JSON.stringify(height));
 console.log('PASS preserved simulation state on bookmarking and auto-resized iframe');
 // In-app back should pop the actual history entry (rather than append another one).
 await app.locator('#back').click();
 await app.waitForURL(HOST+'/');
 assert.equal(await app.locator('article.object-card').count(),9);
 await app.goForward();
 await app.waitForURL(HOST+'/#kettle');
 assert.equal(await app.locator('iframe.figure-frame').count(),1);
 // Deep-link opened without an in-app history entry must also be able to return safely.
 await app.goto(HOST+'/#fan');
 await app.locator('#back').click();
 await app.waitForURL(HOST+'/');
 assert.equal(await app.locator('article.object-card').count(),9);
 assert.deepEqual(pageErrors,[]);
 console.log('PASS browser history, deep links, and return navigation');
 for(const [id,label] of [['washing','Charger le linge'],['vending','Insérer 50 cts']]){
  await app.goto(HOST+'/#'+id,{waitUntil:'load'});
  const model=app.frameLocator('iframe.figure-frame');
  await model.getByRole('button',{name:label,exact:true}).waitFor();
  assert.equal(await app.locator('iframe.figure-frame').count(),1);
 }
 // Narrow-phone and tablet viewports should not introduce horizontal scrolling.
 for(const width of [320,390,768]){
  await app.setViewportSize({width,height:780});
  for(const id of ids){
   await app.goto(HOST+'/#'+(id==='washer'?'washing':id),{waitUntil:'load'});
   await app.waitForFunction(()=>!!document.querySelector('iframe.figure-frame')?.dataset.measuredHeight);
   // Cross-document style loads and fonts can change the internal height
   // AFTER the iframe's first resize. Wait for the final layout to settle.
   await app.waitForFunction(()=>{
    const frame=document.querySelector('iframe.figure-frame');
    if(!frame?.dataset.measuredHeight)return false;
    try{
      // Sandboxed frame uses an opaque origin; the child reports its
      // scrollHeight in a verified message, not through parent DOM access.
      const reported=Number(frame.dataset.measuredHeight);
      return reported>=420 && Math.abs(frame.getBoundingClientRect().height-reported)<=2;
    }catch{return false;}
   });
   const metrics=await app.locator('iframe.figure-frame').evaluate(f=>({width:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,frameHeight:f.getBoundingClientRect().height}));
   assert.ok(metrics.width<=metrics.viewport+1,'horizontal overflow: '+id+' at '+width);
   await app.frameLocator('iframe.figure-frame').locator('body').evaluate(b=>new Promise((resolve,reject)=>{
    const start=performance.now();
    const check=()=>{
      // Wait until both measurements are stable across two refreshes.
      const h=b.scrollHeight;
      if(h<=window.innerHeight+4)return requestAnimationFrame(()=>{
        if(b.scrollHeight<=window.innerHeight+4)resolve();
        else check();
      });
      if(performance.now()-start>4500)return reject(new Error('nested scroll persists at '+window.innerWidth+'px: '+h+'/'+window.innerHeight));
      requestAnimationFrame(check);
    };
    check();
   }));
  }
 }
 assert.deepEqual(pageErrors,[]);
 console.log('PASS French model controls and 320/390/768px responsive layout');
 // Audio must be local, opt-out capable and synchronized with the parent Android shell.
 await app.setViewportSize({width:390,height:844});
 await app.goto(HOST+'/#kettle',{waitUntil:'load'});
 const soundFrame=app.frameLocator('iframe.figure-frame');
 await soundFrame.locator('#figure-sound').waitFor();
 await app.waitForFunction(()=>document.querySelector('iframe.figure-frame')?.contentWindow!=null);
 await soundFrame.locator('button.act').first().click();
 const firstNotes=await soundFrame.locator('body').evaluate(()=>window.__soundDebug.notes);
 assert.ok(firstNotes>0,'first gesture did not trigger audio synthesis');
 await app.locator('#global-sound').click();
 await app.waitForFunction(()=>document.querySelector('#global-sound')?.getAttribute('aria-pressed')==='false');
 await soundFrame.locator('#figure-sound').waitFor();
 await soundFrame.locator('body').evaluate(()=>new Promise(resolve=>{
  const poll=()=>window.__soundDebug.enabled?setTimeout(poll,20):resolve();poll();
 }));
 const mutedNotes=await soundFrame.locator('body').evaluate(()=>window.__soundDebug.notes);
 await soundFrame.locator('button.act').first().click();
 assert.equal(await soundFrame.locator('body').evaluate(()=>window.__soundDebug.notes),mutedNotes);
 await soundFrame.locator('#figure-sound').click();
 await app.waitForFunction(()=>document.querySelector('#global-sound')?.getAttribute('aria-pressed')==='true');
 assert.equal(await app.evaluate(()=>localStorage.getItem('object-fonctionnement:sound:v1')),'on');
 const slider=app.locator("#global-volume");
 await slider.evaluate(el=>{el.value="25";el.dispatchEvent(new Event("input",{bubbles:true}));});
 await app.waitForFunction(()=>localStorage.getItem("object-fonctionnement:volume:v1")==="25");
 await soundFrame.locator("body").evaluate(()=>new Promise(resolve=>{
  const wait=()=>window.__soundDebug.volume===.25?resolve():setTimeout(wait,20);wait();
 }));
 await app.locator('#global-sound').click();
 await app.reload();
 await app.waitForFunction(()=>document.querySelector('#global-sound')?.getAttribute('aria-pressed')==='false');
 await soundFrame.locator('#figure-sound').waitFor();
 assert.equal(await soundFrame.locator('body').evaluate(()=>window.__soundDebug.enabled),false);
 assert.equal(await app.evaluate(()=>localStorage.getItem("object-fonctionnement:volume:v1")),"25");
 assert.deepEqual(pageErrors,[]);
 console.log('PASS procedural Web Audio, mute, iframe synchronization, persisted preferences');
 // Dedicated WebGL feature test with GPU fallback for environments without WebGL.
 const webgl=await app.evaluate(()=>{
  try{
   const canvas=document.createElement('canvas');
   return Boolean(canvas.getContext("webgl2")||canvas.getContext("webgl"));
  }catch{return false;}
 });
 if(webgl){
  await app.evaluate(()=>localStorage.setItem("object-fonctionnement:view:v1","3d"));
  await app.reload();
  for(const id of ids){
   const route=id==='washer'?'washing':id;
   await app.goto(HOST+'/#'+route,{waitUntil:'load'});
   await app.locator('.object-three-canvas').waitFor({timeout:12000});
   const info=await app.locator('.object-three-canvas').evaluate(el=>({
    width:el.width,height:el.height,visible:el.getBoundingClientRect().height>260
   }));
   assert.ok(info.width>=250&&info.height>=240&&info.visible,"3D stage not rendered for "+id);
   const widthMatches=await app.locator('.object-three-canvas').evaluate(el=>
     Math.abs(el.getBoundingClientRect().width-el.parentElement.getBoundingClientRect().width)<=2);
   assert.ok(widthMatches,"3D canvas does not fill available viewport: "+id);
   assert.equal(await app.getByRole('button',{name:"Voir l'illustration 2D"}).count(),1);
   // A separate causal explanation orders the three existing real anchors.
   // The SVG arrows are camera-projected, and interactions must not obscure
   // the 3D model or interfere with the interactive ColorFigures iframe.
   await app.getByRole('button',{name:"Comprendre le mécanisme"}).click();
   const flowPanel=app.locator('#mechanism-flow-panel');
   await flowPanel.waitFor({state:"visible"});
   assert.equal(await app.locator('#three-flow').getAttribute('aria-pressed'),"true");
   assert.equal(await flowPanel.locator('[data-flow-step]').count(),3);
   assert.equal(await app.locator('.mechanism-flow-node').count(),3);
   assert.equal(await app.locator('.mechanism-flow-link').count(),2);
   assert.equal(await app.locator('.mechanism-flow-overlay').getAttribute('data-active-step'),"1");
   assert.equal(await app.locator('.three-part-pin:visible').count(),0);
   const flowBounds=await app.evaluate(()=>{
    const canvas=document.querySelector('.object-three-canvas').getBoundingClientRect();
    const panel=document.querySelector('#mechanism-flow-panel').getBoundingClientRect();
    const buttons=[...document.querySelectorAll('#mechanism-flow-panel button')];
    return {canvasBottom:canvas.bottom,panelTop:panel.top,
      scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,
      heights:buttons.map(button=>button.getBoundingClientRect().height)};
   });
   assert.ok(flowBounds.panelTop>=flowBounds.canvasBottom-2,
     "mechanism panel covers the 3D scene: "+id);
   assert.ok(flowBounds.heights.every(height=>height>=44),
     "small mechanism touch target: "+id);
   assert.ok(flowBounds.scroll<=flowBounds.client+1,
     "mechanism panel causes horizontal overflow: "+id);
   await flowPanel.locator('[data-flow-step="1"]').click();
   assert.equal(await app.locator('.mechanism-flow-overlay').getAttribute('data-active-step'),"2");
   assert.equal(await flowPanel.locator('[data-flow-step="1"]').getAttribute('aria-pressed'),"true");
   assert.ok((await flowPanel.locator('#mechanism-flow-detail').innerText()).length>25);
   await flowPanel.getByRole('button',{name:"Suivant →"}).click();
   assert.equal(await app.locator('.mechanism-flow-overlay').getAttribute('data-active-step'),"3");
   await flowPanel.getByRole('button',{name:"Terminer"}).click();
   await flowPanel.waitFor({state:"hidden"});
   assert.equal(await app.locator('.mechanism-flow-overlay:visible').count(),0);
   assert.equal(await app.locator('#three-flow').getAttribute('aria-pressed'),"false");
   console.log("PASS 3-step causal mechanism overlay: "+id);
   if(id==="coffee"){
    // Entering the existing guided tour must cleanly close the separate
    // causal overlay; abandoning the tour must never record completion.
    await app.getByRole('button',{name:"Comprendre le mécanisme"}).click();
    await app.getByRole('button',{name:"Commencer la visite guidée des pièces"}).click();
    assert.equal(await app.locator("#mechanism-flow-panel:visible").count(),0);
    assert.equal(await app.locator(".mechanism-flow-overlay:visible").count(),0);
    assert.equal(await app.locator("#three-flow").getAttribute("aria-pressed"),"false");
    await app.locator('.three-tour-bar').getByRole('button',{name:"Quitter la visite"}).click();
    assert.equal(await app.locator("#three-parts").getAttribute("aria-pressed"),"true");
    await app.getByRole('button',{name:"Masquer les repères"}).click();
   }
   await app.getByRole('button',{name:"Voir les pièces internes"}).click();
   assert.equal(await app.locator("#three-explore").getAttribute("aria-pressed"),"true");
   await app.getByRole('button',{name:"Extérieur normal"}).click();
   assert.equal(await app.locator("#three-explore").getAttribute("aria-pressed"),"false");
   await app.getByRole('button',{name:"Identifier les pièces"}).click();
   assert.equal(await app.locator('#three-parts').getAttribute('aria-pressed'),"true");
   const hotspots=app.locator('.three-part-pin:visible');
   assert.ok(await hotspots.count()>=1,"missing anchored part markers: "+id);
   const markerCenters=await hotspots.evaluateAll(items=>items.map(b=>{
    const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};
   }));
   for(let a=0;a<markerCenters.length;a++)for(let b=a+1;b<markerCenters.length;b++){
    const A=markerCenters[a],B=markerCenters[b];
    assert.ok(Math.hypot(A.x-B.x,A.y-B.y)>=43,
      "overlapping 3D hotspots: "+id);
   }
   await hotspots.first().click();
   const popup=app.locator('.three-part-description');
   await popup.waitFor({state:"visible"});
   assert.ok((await popup.locator('strong').innerText()).length>=5);
   assert.ok((await popup.locator('p').innerText()).length>60);
   assert.equal(await app.locator('.three-part-pin[aria-pressed="true"]').count(),1);
   assert.ok((await app.locator('.three-parts').getAttribute('data-selected-part'))?.length>2,
     "selected 3D part has no visual locator: "+id);
   await popup.getByRole('button',{name:"Fermer l'explication de la pièce"}).click();
   await popup.waitFor({state:"hidden"});
   assert.equal(await app.locator('.three-parts').getAttribute('data-selected-part'),null,
     "3D part locator persists after closing the explanation: "+id);
   await app.getByRole('button',{name:"Masquer les repères"}).click();
   assert.equal(await app.locator('.three-part-pin:visible').count(),0);
   // A guided tour is completed only after explicitly finishing all 3 stages.
   await app.getByRole('button',{name:"Commencer la visite guidée des pièces"}).click();
   const tour=app.locator('.three-tour-bar');
   assert.equal(await tour.locator('.three-tour-counter').innerText(),"Étape 1 / 3");
   assert.equal(await tour.locator(".three-tour-progress").getAttribute("aria-valuenow"),"1");
   const tourBounds=await app.evaluate(()=>{
    const canvas=document.querySelector('.object-three-canvas').getBoundingClientRect();
    const info=document.querySelector('.three-part-description').getBoundingClientRect();
    const buttons=[...document.querySelectorAll('.three-tour-bar button')];
    return {canvasBottom:canvas.bottom,infoTop:info.top,heights:buttons.map(b=>b.getBoundingClientRect().height)};
   });
   assert.ok(tourBounds.infoTop>=tourBounds.canvasBottom-2,"guided instructions obscure object: "+id);
   assert.ok(tourBounds.heights.every(h=>h>=39),"small touch target in guided tour");
   if(id==='kettle'){
    await tour.getByRole('button',{name:'Quitter la visite'}).click();
    assert.equal(await app.evaluate(()=>localStorage.getItem("object-fonctionnement:tours:v1")),null);
    await app.getByRole('button',{name:"Commencer la visite guidée des pièces"}).click();
   }
   await tour.getByRole('button',{name:"Suivant →"}).click();
   assert.equal(await tour.locator('.three-tour-counter').innerText(),"Étape 2 / 3");
   assert.equal(await tour.locator(".three-tour-progress").getAttribute("aria-valuenow"),"2");
   await tour.getByRole('button',{name:"← Précédent"}).click();
   assert.equal(await tour.locator('.three-tour-counter').innerText(),"Étape 1 / 3");
   await tour.getByRole('button',{name:"Suivant →"}).click();
   await tour.getByRole('button',{name:"Suivant →"}).click();
   assert.equal(await tour.locator('.three-tour-counter').innerText(),"Étape 3 / 3");
   assert.equal(await tour.locator(".three-tour-progress").getAttribute("aria-valuenow"),"3");
   await tour.getByRole('button',{name:"Terminer la visite"}).click();
   assert.equal(await app.locator('#tour-status').innerText(),"Visite guidée terminée");
   const completedTours=await app.evaluate(()=>JSON.parse(localStorage.getItem("object-fonctionnement:tours:v1")));
   assert.ok(completedTours.includes(route),"completed visit not persisted: "+id);
   await app.getByRole('button',{name:"Masquer les repères"}).click();
   assert.equal(await app.frameLocator('iframe.figure-frame').locator('#fig').evaluate(el=>getComputedStyle(el).display),"none");
   // State-changing 2D command must still work while the SVG is hidden.
   if(id==='fan'){
    await app.frameLocator('iframe.figure-frame').getByRole('button',{name:'Marche / arrêt'}).click();
    assert.equal(await app.frameLocator('iframe.figure-frame').locator('body').evaluate(()=>window.__st.speed),1);
    const rotationStart=await app.frameLocator('iframe.figure-frame').locator('body').evaluate(()=>window.__st.turn);
    await app.waitForTimeout(400);
    const rotationEnd=await app.frameLocator('iframe.figure-frame').locator('body').evaluate(()=>window.__st.turn);
    assert.ok(rotationEnd>rotationStart+.1,"fan must rotate while powered");
    await app.frameLocator('iframe.figure-frame').getByRole('button',{name:'Oscillation'}).click();
    await app.waitForTimeout(300);
    assert.equal(await app.frameLocator('iframe.figure-frame').locator('body').evaluate(()=>window.__st.oscillate),true);
   }
   if(id==='kettle'){
    await app.getByRole('button',{name:"Voir l'illustration 2D"}).click();
    assert.equal(await app.locator('.object-three-canvas').count(),0);
    assert.notEqual(await app.frameLocator('iframe.figure-frame').locator('#fig').evaluate(el=>getComputedStyle(el).display),"none");
    await app.getByRole('button',{name:'Explorer en 3D'}).click();
    await app.locator('.object-three-canvas').waitFor();
    await app.getByRole('button',{name:'Recentrer la caméra 3D'}).click();
   }
   assert.deepEqual(pageErrors,[],"3D page JS errors: "+id);
   console.log("PASS Three.js PBR "+id);
  }
  for(const [id,actions] of [
   ['kettle',["Remplir d'eau"]],
   ['toaster',['Insérer le pain']],
   ['coffee',["Ajouter de l'eau"]]
  ]){
   await app.goto(HOST+'/#'+id,{waitUntil:'load'});
   const canvas=app.locator('.object-three-canvas');
   await canvas.waitFor();
   await app.waitForTimeout(300);
   const before=await canvas.screenshot();
   for(const action of actions)await app.frameLocator('iframe.figure-frame').getByRole('button',{name:action,exact:true}).click();
   await app.waitForTimeout(440);
   const after=await canvas.screenshot();
   const ratio=await changedPixelRatio(before,after);
   assert.ok(ratio>.0006,"3D state did not produce visible geometric/material change: "+id+" ratio="+ratio);
   console.log("PASS state-reactive 3D visual "+id+" changed "+(ratio*100).toFixed(2)+"% of pixels");
   if(id==='kettle'){
    await app.frameLocator('iframe.figure-frame').getByRole('button',{name:'Ouvrir / fermer couvercle'}).click();
    await canvas.scrollIntoViewIfNeeded();
    await app.waitForTimeout(950);
    const open=await canvas.screenshot();
    const lidChange=await changedPixelRatio(after,open);
    assert.ok(lidChange>.0006,"kettle hinged lid did not move visibly: "+lidChange);
    console.log("PASS spring-animated kettle lid changed "+(lidChange*100).toFixed(2)+"% of pixels");
   }
  }
   // Three previously under-animated models must now produce real state-linked pixels.
   await app.goto(HOST+'/#lock',{waitUntil:'load'});
   let canvas=app.locator('.object-three-canvas');
   await canvas.waitFor();
   await app.waitForTimeout(260);
   const lockBefore=await canvas.screenshot();
   const lockFigure=app.frameLocator('iframe.figure-frame');
   await lockFigure.getByRole('button',{name:'Insérer la bonne clé'}).click();
   await app.waitForTimeout(440);
   const lockInserted=await canvas.screenshot();
   const lockKeyDelta=await changedPixelRatio(lockBefore,lockInserted);
   assert.ok(lockKeyDelta>.0007,"lock key insertion not visible in 3D: "+lockKeyDelta);
   await lockFigure.getByRole('button',{name:'Tourner la clé'}).click();
   await lockFigure.locator('body').evaluate(()=>new Promise(resolve=>{
    const poll=()=>window.__st.turning?setTimeout(poll,25):resolve();poll();
   }));
   await app.waitForTimeout(350);
   const lockTurned=await canvas.screenshot();
   const lockTurnDelta=await changedPixelRatio(lockInserted,lockTurned);
   assert.ok(lockTurnDelta>.0007,"rotating lock plug and shackle not visible in 3D: "+lockTurnDelta);
   console.log('PASS 3D lock key and unlocking animate distinct geometry');

   await app.goto(HOST+'/#washing',{waitUntil:'load'});
   canvas=app.locator('.object-three-canvas');
   await canvas.waitFor();
   await app.waitForTimeout(280);
   const washBefore=await canvas.screenshot();
   await app.frameLocator('iframe.figure-frame').locator('body').evaluate(()=>{
    Object.assign(window.__st,{run:true,paused:false,prog:0,tau:3,laundry:"drum"});
   });
   await app.waitForTimeout(460);
   const washDuring=await canvas.screenshot();
   const washDelta=await changedPixelRatio(washBefore,washDuring);
   assert.ok(washDelta>.001,"washing drum, clothing and water not visible: "+washDelta);
   console.log('PASS 3D washer water and drum react to ColorFigures state');
   // A real gesture unlocks mobile Web Audio; stopping/pausing a motor must
   // release its low-level ambient oscillator instead of humming indefinitely.
   const washerFrame=app.frameLocator('iframe.figure-frame');
   await washerFrame.locator('#figure-sound').click();
   await washerFrame.locator('body').evaluate(()=>new Promise(resolve=>{
    const wait=()=>window.__soundDebug.enabled?resolve():setTimeout(wait,20);wait();
   }));
   await app.waitForTimeout(450);
   assert.equal(await washerFrame.locator('body').evaluate(()=>window.__soundDebug.ambient),true,
    "washer motor should emit ambient sound while washing");
   await washerFrame.locator('body').evaluate(()=>{window.__st.paused=true;});
   await app.waitForTimeout(440);
   assert.equal(await washerFrame.locator('body').evaluate(()=>window.__soundDebug.ambient),false,
    "washer ambient must stop during pause");
   console.log("PASS washing motor ambience respects playback/pause state");

   await app.goto(HOST+'/#vending',{waitUntil:'load'});
   canvas=app.locator('.object-three-canvas');
   await canvas.waitFor();
   await app.waitForTimeout(250);
   // Web Audio only starts after a real click. The vend/land/pickup events
   // must not rely on a 3D-only user gesture or continue while muted.
   const vendingSound=app.frameLocator('iframe.figure-frame');
   // The washer scenario may have already enabled sound globally.
   // Ensure an explicit OFF -> ON gesture instead of blindly toggling it OFF.
   const wasEnabled=await vendingSound.locator('body').evaluate(()=>
    window.__soundDebug.enabled);
   if(wasEnabled)await vendingSound.locator('#figure-sound').click();
   await vendingSound.locator('#figure-sound').click();
   await vendingSound.locator('body').evaluate(()=>new Promise((resolve,reject)=>{
    const deadline=Date.now()+2200;
    const poll=()=>{
     if(window.__soundDebug.enabled)return resolve();
     if(Date.now()>deadline)return reject(Error("vending sound did not enable"));
     setTimeout(poll,30);
    };poll();
   }));
   const vendBefore=await canvas.screenshot();
   await app.evaluate(()=>{
    window.__vendingMessages=[];
    window.addEventListener('message',event=>{
     const f=document.querySelector('iframe.figure-frame');
     if(event.source===f?.contentWindow&&event.data?.type==='object-figure:state')
      window.__vendingMessages.push(event.data.value);
    });
   });
   await app.frameLocator('iframe.figure-frame').locator('body').evaluate(()=>{
    const s=window.__st;
    s.credit=1.5;s.stock[1][2]=1;s.drop={r:1,c:2,t:.44};
   });
   await app.waitForFunction(()=>window.__vendingMessages?.some(s=>
    s.drop?.r===1&&s.drop?.c===2&&s.stock?.[1]?.[2]===1&&s.credit===1.5));
   await app.waitForTimeout(330);
   await vendingSound.locator('body').evaluate(()=>new Promise((resolve,reject)=>{
    const deadline=Date.now()+2500;
    const poll=()=>{
     if(window.__soundDebug.cues.coil>0)return resolve();
     if(Date.now()>deadline)return reject(Error("vending coil cue missing"));
     setTimeout(poll,40);
    };
    poll();
   }));
   const vendDrop=await canvas.screenshot();
   const vendDelta=await changedPixelRatio(vendBefore,vendDrop);
   assert.ok(vendDelta>.0009,"vending product drop not visible in 3D: "+vendDelta);
   await app.frameLocator('iframe.figure-frame').locator('body').evaluate(()=>{
    const s=window.__st;s.drop=null;s.tray={code:"B3"};s.flap=1;
   });
   await app.waitForFunction(()=>window.__vendingMessages?.some(s=>s.drop===null&&s.tray?.code==="B3"&&s.flap===1));
   await app.waitForTimeout(280);
   assert.ok(await vendingSound.locator('body').evaluate(()=>
    (window.__soundDebug.cues.landing||0)>0),"vending landing sound cue missing");
   const vendTray=await canvas.screenshot();
   const trayDelta=await changedPixelRatio(vendDrop,vendTray);
   assert.ok(trayDelta>.0008,"vending pickup flap and tray product not visible in 3D: "+trayDelta);
   // Different product families must visibly appear in the pickup bay:
   // the original ColorFigures rows C and D contain bottles and snack packs,
   // not generic cans. Verify real rendered pixels, not just state metadata.
   const vendFrame=app.frameLocator('iframe.figure-frame');
   await vendFrame.locator('body').evaluate(()=>{
    window.__st.tray={code:"C2",kind:"bottle",col:"#5cc0e8"};
   });
   await app.waitForFunction(()=>window.__vendingMessages?.at(-1)?.tray?.code==="C2");
   await app.waitForTimeout(280);
   const bottleInTray=await canvas.screenshot();
   const bottleDelta=await changedPixelRatio(vendTray,bottleInTray);
   assert.ok(bottleDelta>.00014,"selected bottle did not change tray geometry/colour: "+bottleDelta);
   await vendFrame.locator('body').evaluate(()=>{
    window.__st.tray={code:"D4",kind:"snack",col:"#8a5a3c"};
   });
   await app.waitForFunction(()=>window.__vendingMessages?.at(-1)?.tray?.code==="D4");
   await app.waitForTimeout(280);
   const snackInTray=await canvas.screenshot();
   const snackDelta=await changedPixelRatio(bottleInTray,snackInTray);
   assert.ok(snackDelta>.00014,"selected snack did not change tray geometry/colour: "+snackDelta);
   await vendFrame.locator('body').evaluate(()=>{window.__st.tray=null;});
   await app.waitForTimeout(290);
   assert.ok(await vendFrame.locator('body').evaluate(()=>
    (window.__soundDebug.cues.pickup||0)>0),"vending pickup cue missing");
   console.log("PASS vending start, landing and pickup have distinct gated audio cues");
   console.log("PASS selectable cans, bottles and snacks have matching 3D pickup models");
   console.log('PASS nested vending state transport, product drop, tray and 3D flap');

   await app.goto(HOST+'/',{waitUntil:'load'});
   assert.equal(await app.locator('.tour-completed-card').count(),9);
  assert.ok((await app.locator('.hero-stat').innerText()).includes('9 visites effectuées'));
  await app.reload();
  assert.equal(await app.locator('.tour-completed-card').count(),9);
  assert.ok((await app.locator('.hero-stat').innerText()).includes('9 visites effectuées'));
  for(const width of [320,768]){
   await app.setViewportSize({width,height:780});
   await app.goto(HOST+'/#kettle',{waitUntil:'load'});
   await app.locator(".object-three-canvas").waitFor();
   const view=await app.evaluate(()=>{
    const canvas=document.querySelector('.object-three-canvas');
    return {scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,
      canvas:canvas.getBoundingClientRect().width,host:canvas.parentElement.getBoundingClientRect().width};
   });
   assert.ok(view.scroll<=view.client+1,"3D layout overflow at "+width+"px");
   assert.ok(Math.abs(view.canvas-view.host)<=2,"3D canvas width mismatch at "+width+"px");
   await app.getByRole('button',{name:"Comprendre le mécanisme"}).click();
   assert.equal(await app.locator("#mechanism-flow-panel:visible").count(),1);
   const flowMetrics=await app.evaluate(()=>({
    width:document.documentElement.scrollWidth,
    client:document.documentElement.clientWidth,
    touch:[...document.querySelectorAll("#mechanism-flow-panel button")].map(x=>x.getBoundingClientRect().height)
   }));
   assert.ok(flowMetrics.width<=flowMetrics.client+1,
     "3D causal explanation overflows Android width "+width);
   assert.ok(flowMetrics.touch.every(h=>h>=44),
     "causal explanation has undersized touch target at "+width);
   await app.getByRole('button',{name:"Recentrer la caméra 3D"}).click();
   assert.equal(await app.locator("#mechanism-flow-panel:visible").count(),0);
  }
  console.log("PASS Android 320/768px causal mechanism layout and camera reset");
  await app.setViewportSize({width:390,height:844});
  await app.goto(HOST+'/#fan',{waitUntil:'load'});
  await app.locator(".object-three-canvas").waitFor();
  const qualityControl=app.locator("#graphics-quality");
  const canvasResolution=()=>app.locator(".object-three-canvas").evaluate(el=>({width:el.width,height:el.height}));
  await qualityControl.selectOption("eco");
  const eco=await canvasResolution();
  assert.equal(await app.evaluate(()=>localStorage.getItem("object-fonctionnement:graphics:v1")),"eco");
  await qualityControl.selectOption("high");
  const high=await canvasResolution();
  assert.ok(high.width>=eco.width&&high.height>=eco.height,"high quality reduces render resolution");
  await app.reload();
  await app.locator(".object-three-canvas").waitFor();
  assert.equal(await app.locator("#graphics-quality").inputValue(),"high");
  await app.locator("#graphics-quality").selectOption("auto");
  assert.equal(await app.evaluate(()=>localStorage.getItem("object-fonctionnement:graphics:v1")),"auto");
  console.log("PASS live graphics quality controls, pixel ratio and persistence");
  const airflowToggle=app.getByRole("button",{name:"Visualiser le flux d’air"});
  await airflowToggle.click();
  assert.equal(await app.locator("#three-airflow").getAttribute("aria-pressed"),"true");
  await app.locator("#fan-airflow-explanation").waitFor({state:"visible"});
  assert.equal(await app.evaluate(()=>localStorage.getItem("object-fonctionnement:fan-airflow:v1")),"on");
  // Inject constant motor state without animating the original 2D fan.
  // A screenshot delta here isolates the 3D flow overlay from the rotor motion.
  await app.frameLocator("iframe.figure-frame").locator("body").evaluate(()=>{
    Object.assign(window.__st,{speed:2,turn:0,oscillate:false});
  });
  await app.waitForTimeout(360);
  const flowEnabled=await app.locator(".object-three-canvas").screenshot();
  await app.getByRole("button",{name:"Masquer le flux d’air"}).click();
  await app.waitForTimeout(150);
  const flowDisabled=await app.locator(".object-three-canvas").screenshot();
  const airflowDelta=await changedPixelRatio(flowEnabled,flowDisabled);
  // Antialiased particles differ slightly across software and mobile GPUs.
  assert.ok(airflowDelta>.00012,"airflow should visibly change 3D pixels: "+airflowDelta);
  await app.getByRole("button",{name:"Visualiser le flux d’air"}).click();
  await app.reload();
  await app.locator(".object-three-canvas").waitFor();
  assert.equal(await app.locator("#three-airflow").getAttribute("aria-pressed"),"true");
  assert.equal(await app.locator("#fan-airflow-explanation").isVisible(),true);
  await app.setViewportSize({width:320,height:740});
  const narrow=await app.evaluate(()=>({
   full:document.documentElement.scrollWidth,
   viewport:document.documentElement.clientWidth
  }));
  assert.ok(narrow.full<=narrow.viewport+1,"airflow UI overflows small Android screens");
  await app.setViewportSize({width:390,height:844});
  await app.goto(HOST+"/#lock",{waitUntil:"load"});
  assert.equal(await app.locator("#three-airflow").count(),0,"airflow control is fan-only");
  console.log("PASS fan airflow 3D motion overlay, persistence and model-only control");
  // Count only top-frame RAF requests. The sandboxed ColorFigures iframe has
  // its own animation API, so this isolates the renderer's idle GPU scheduler.
  await app.addInitScript(()=>{
    const native=window.requestAnimationFrame;
    window.__threeFrameRequests=0;
    window.requestAnimationFrame=function(callback){
      window.__threeFrameRequests++;
      return native.call(window,callback);
    };
  });
  await app.goto(HOST+'/#lock',{waitUntil:'load'});
  // Same-document hash navigation does not trigger addInitScript.
  // Force a full page load so the RAF instrumentation is installed.
  await app.reload();
  await app.locator(".object-three-canvas").waitFor();
  await app.waitForTimeout(850);
  const idleBefore=await app.evaluate(()=>window.__threeFrameRequests);
  await app.waitForTimeout(650);
  const idleAfter=await app.evaluate(()=>window.__threeFrameRequests);
  assert.ok(idleAfter-idleBefore<=4,
    "stationary WebGL model unexpectedly schedules idle frames: "+(idleAfter-idleBefore));
  await app.getByRole("button",{name:"Voir les pièces internes"}).click();
  await app.waitForFunction(before=>window.__threeFrameRequests>before,idleAfter);
  console.log("PASS idle WebGL stops scheduling RAF and resumes on interaction");

  await app.goto(HOST+'/#kettle',{waitUntil:'load'});
  await app.locator(".object-three-canvas").waitFor();
  await app.locator(".object-three-canvas").dispatchEvent("webglcontextlost",{cancelable:true});
  await app.getByRole("button",{name:"Vue 3D indisponible — illustration 2D"}).waitFor({timeout:8000});
  assert.equal(await app.locator(".object-three-canvas").count(),0);
  assert.equal(await app.evaluate(()=>localStorage.getItem("object-fonctionnement:view:v1")),"2d");
  assert.notEqual(await app.frameLocator("iframe.figure-frame").locator("#fig").evaluate(el=>getComputedStyle(el).display),"none");
  console.log("PASS runtime WebGL loss degrades gracefully to intact 2D figure");
 }else{
  console.log("SKIP GPU-dependent WebGL test: no WebGL context on runner");
 }
 // Validate graceful fallback on Android/WebViews without usable WebGL.
 const noGpu=await browser.newPage({viewport:{width:390,height:844}});
 await noGpu.addInitScript(()=>{
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){
   if(type==="webgl"||type==="webgl2"||type==="experimental-webgl")return null;
   return original.call(this,type,...args);
  };
 });
 await noGpu.goto(HOST+'/#kettle',{waitUntil:'load'});
 await noGpu.getByRole("button",{name:"Vue 3D indisponible — illustration 2D"}).waitFor({timeout:14000});
 assert.equal(await noGpu.locator(".object-three-canvas").count(),0);
 await noGpu.frameLocator("iframe.figure-frame").locator("#fig").waitFor();
 assert.notEqual(await noGpu.frameLocator("iframe.figure-frame").locator("#fig").evaluate(el=>getComputedStyle(el).display),"none");
 await noGpu.close();
 console.log('PASS automatic 2D fallback when WebGL is unavailable');
 // Quiz operates within the live figure page without resetting its iframe.
 await app.goto(HOST+'/#kettle',{waitUntil:'load'});
 await app.locator('.quiz-panel').waitFor();
 await app.frameLocator('iframe.figure-frame').locator('body').evaluate(()=>{window.__st.__quizSentinel='held';});
 await app.getByRole('button',{name:'Réponse 2 : La poignée isolante'}).click();
 assert.match(await app.locator('#quiz-feedback').innerText(),/Pas tout à fait/);
 assert.equal(await app.evaluate(()=>localStorage.getItem('object-fonctionnement:quiz:v1')),null);
 await app.getByRole('button',{name:'Réponse 1 : La résistance électrique'}).click();
 assert.match(await app.locator('#quiz-feedback').innerText(),/Bonne réponse/);
 assert.match(await app.locator('#quiz-status').innerText(),/Connaissance validée/);
 assert.equal(await app.frameLocator('iframe.figure-frame').locator('body').evaluate(()=>window.__st.__quizSentinel),'held');
 assert.equal(await app.evaluate(()=>JSON.parse(localStorage.getItem('object-fonctionnement:quiz:v1')).kettle),true);
 await app.reload();
 assert.match(await app.locator('#quiz-status').innerText(),/Connaissance validée/);
 await app.getByRole('button',{name:'← Catalogue'}).click();
 await app.waitForURL(HOST+'/');
 const review=app.locator('#review-filter');
 assert.match(await review.innerText(),/À réviser \(8\)/);
 await review.click();
 assert.equal(await app.locator('article.object-card').count(),8);
 assert.equal(await app.locator('[data-open="kettle"]').count(),0);
 await app.getByRole('button',{name:/Voir tous les objets/}).click();
 assert.equal(await app.locator('article.object-card').count(),9);
 const glossary=app.locator("#glossary-toggle");
 await glossary.click();
 assert.equal(await app.locator(".glossary-item").count(),27);
 const glossaryInput=app.locator("#glossary-search");
 await glossaryInput.fill("goupilles");
 assert.equal(await app.locator(".glossary-item").count(),1);
 await app.getByRole("button",{name:/Voir Goupilles sur Serrure/}).click();
 await app.waitForURL(HOST+"/#lock");
 await app.locator(".object-three-canvas").waitFor();
 const part=app.locator(".three-part-description");
 await part.waitFor({state:"visible"});
 assert.match(await part.locator("strong").innerText(),/Goupilles/);
 await app.getByRole('button',{name:"← Catalogue"}).click();
 await app.waitForURL(HOST+"/");
 assert.equal(await app.locator("#glossary-search").inputValue(),"goupilles");
 console.log("PASS searchable offline glossary and direct 3D component focus");
 console.log('PASS offline review filter and quiz progress persistence');
 console.log('PASS offline interactive learning check, correction and persisted progress');
 console.log('PASS Android-size catalog + local WebP previews + embedded simulation');
 await app.close();
}finally{
 if(browser)await browser.close();
 if(server)server.kill('SIGTERM');
}
