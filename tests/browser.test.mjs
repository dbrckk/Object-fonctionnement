import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const HOST=process.env.TEST_BASE_URL ?? 'http://127.0.0.1:4174';
const ids=['kettle','toaster','fan','lock','bicycle','coffee','flashlight','washer','vending'];

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
    await click('Tourner la clé');assert.equal((await state()).locked,true);break;
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
 console.log('PASS Android-size catalog + local WebP previews + embedded simulation');
 await app.close();
}finally{
 if(browser)await browser.close();
 if(server)server.kill('SIGTERM');
}
