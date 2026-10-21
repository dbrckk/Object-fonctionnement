import {chromium} from 'playwright';
import sharp from 'sharp';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const url='http://127.0.0.1:4229';
const folder=path.join(root,'docs','previews');
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4229','--strictPort'],{cwd:root,stdio:'ignore'});
let browser;
try{
 let available=false;
 for(let i=0;i<80;i++){
  try{if((await fetch(url)).ok){available=true;break;}}catch{}
  await new Promise(r=>setTimeout(r,150));
 }
 if(!available)throw Error('Vite could not start');
 await mkdir(folder,{recursive:true});
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const id of ['kettle','toaster','coffee','fan','lock','washing','vending']){
  const page=await browser.newPage({viewport:{width:700,height:870},deviceScaleFactor:1.5});
  try{
   await page.goto(url+'/#'+id,{waitUntil:'load'});
   await page.locator('.object-three-canvas').waitFor({timeout:16000});
   const actions={
    kettle:["Remplir d'eau"],
    toaster:["Insérer le pain","Abaisser / griller"],
    coffee:["Ajouter de l'eau","Mettre le café moulu","Préparer le café"],
    lock:["Insérer la bonne clé","Tourner la clé"]
   };
   for(const action of actions[id]||[]){
    await page.frameLocator('iframe.figure-frame').getByRole('button',{name:action,exact:true}).click();
   }
   if(id==='washing'){
    await page.frameLocator('iframe.figure-frame').locator('body').evaluate(()=>{
     Object.assign(window.__st,{run:true,paused:true,prog:0,tau:3,laundry:"drum"});
    });
   }
   if(id==='vending'){
    await page.frameLocator('iframe.figure-frame').locator('body').evaluate(()=>{
     const s=window.__st;s.credit=1.5;s.stock[1][2]=2;s.drop={r:1,c:2,t:.54};
    });
   }
   await page.waitForTimeout(actions[id]||id==='washing'||id==='vending'?650:380);
   const buffer=await page.locator('.object-three-canvas').screenshot({animations:'disabled'});
   const webp=await sharp(buffer).resize({width:1000}).webp({quality:84,effort:6}).toBuffer();
   await writeFile(path.join(folder,id+'.webp'),webp);
   console.log(id,'preview',webp.length,'bytes');
  }finally{await page.close();}
 }
 const page=await browser.newPage({viewport:{width:700,height:870},deviceScaleFactor:1.5});
 try{
  await page.goto(url+'/#lock',{waitUntil:'load'});
  await page.locator('.object-three-canvas').waitFor({timeout:16000});
  await page.getByRole('button',{name:'Identifier les pièces'}).click();
  await page.locator('.three-part-pin:visible').first().click();
  await page.waitForTimeout(530);
  const buffer=await page.locator('#three-mount').screenshot({animations:'disabled'});
  const webp=await sharp(buffer).resize({width:1000}).webp({quality:84,effort:6}).toBuffer();
  await writeFile(path.join(folder,'lock-inspection.webp'),webp);
  console.log('lock-inspection','preview',webp.length,'bytes');
 }finally{await page.close();}
 // Keep one representative screenshot of the optional flowing-air lesson.
 // It is captured from the real Three.js model, not a synthetic mockup.
 const wind=await browser.newPage({viewport:{width:700,height:870},deviceScaleFactor:1.5});
 try{
  await wind.goto(url+'/#fan',{waitUntil:'load'});
  await wind.locator('.object-three-canvas').waitFor({timeout:16000});
  await wind.getByRole('button',{name:'Visualiser le flux d’air'}).click();
  await wind.frameLocator('iframe.figure-frame').getByRole('button',{name:'Marche / arrêt'}).click();
  await wind.waitForTimeout(580);
  const buffer=await wind.locator('.object-three-canvas').screenshot({animations:'disabled'});
  const webp=await sharp(buffer).resize({width:1000}).webp({quality:84,effort:6}).toBuffer();
  await writeFile(path.join(folder,'fan-airflow.webp'),webp);
  console.log('fan-airflow','preview',webp.length,'bytes');
 }finally{await wind.close();}
 const lesson=await browser.newPage({viewport:{width:700,height:940},deviceScaleFactor:1.5});
 try{
  await lesson.goto(url+'/#kettle',{waitUntil:'load'});
  await lesson.locator('.object-three-canvas').waitFor({timeout:16000});
  await lesson.getByRole('button',{name:'Commencer la visite guidée des pièces'}).click();
  await lesson.waitForTimeout(480);
  const buffer=await lesson.locator('#three-mount').screenshot({animations:'disabled'});
  const webp=await sharp(buffer).resize({width:1000}).webp({quality:84,effort:6}).toBuffer();
  await writeFile(path.join(folder,'kettle-guided-tour.webp'),webp);
  console.log('kettle-guided-tour','preview',webp.length,'bytes');
 }finally{await lesson.close();}
 // Demonstrate the three-step causal explanation with actual screenshots.
 for(const id of ['coffee','vending']){
  const page=await browser.newPage({viewport:{width:700,height:940},deviceScaleFactor:1.5});
  try{
   await page.goto(url+'/#'+id,{waitUntil:'load'});
   await page.locator('.object-three-canvas').waitFor({timeout:16000});
   await page.getByRole('button',{name:'Comprendre le mécanisme'}).click();
   await page.locator('.mechanism-flow-overlay[data-active-step="1"]').waitFor();
   // Camera movement must settle before the still is captured.
   await page.waitForTimeout(650);
   const buffer=await page.locator('.three-shell').screenshot({animations:'disabled'});
   const webp=await sharp(buffer).resize({width:1000}).webp({quality:84,effort:6}).toBuffer();
   await writeFile(path.join(folder,id+'-mechanism-flow.webp'),webp);
   console.log(id,'causal flow preview',webp.length,'bytes');
  }finally{await page.close();}
 }
}finally{
 if(browser)await browser.close();
 server.kill('SIGTERM');
}
