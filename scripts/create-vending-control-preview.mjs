import {chromium} from 'playwright';
import sharp from 'sharp';
import {spawn} from 'node:child_process';
import {writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const host='http://127.0.0.1:4251';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4251','--strictPort'],{cwd:root,stdio:'ignore'});
let browser;
try{
 let available=false;
 for(let i=0;i<70;i++){
  try{if((await fetch(host)).ok){available=true;break;}}catch{}
  await new Promise(r=>setTimeout(r,180));
 }
 if(!available)throw Error('Vite unavailable');
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
 await page.goto(host+'/#vending',{waitUntil:'load'});
 await page.locator('.object-three-canvas').waitFor({timeout:16000});
 const panel=page.locator('#vending3d-controls');
 await panel.locator('#vending3d-fields').evaluate(el=>new Promise((resolve,reject)=>{
   const deadline=Date.now()+4500;
   const poll=()=>{if(!el.disabled)return resolve();if(Date.now()>deadline)return reject(Error('controller not ready'));setTimeout(poll,40);};poll();
 }));
 const coin=panel.locator('[data-vending-command="coin"]');
 await coin.click();await coin.click();await coin.click();
 await page.waitForFunction(()=>document.getElementById("vending3d-credit")?.textContent.includes("1,50 €"));
 await panel.getByRole('button',{name:'Touche B'}).click();
 await page.waitForFunction(()=>document.getElementById("vending3d-selected")?.textContent.includes("B"));
 await page.waitForTimeout(160);
 const bytes=await page.locator('.three-shell').screenshot({animations:'disabled'});
 const image=await sharp(bytes).resize({width:780}).webp({quality:87,effort:6}).toBuffer();
 await mkdir(root+'/docs/previews',{recursive:true});
 await writeFile(root+'/docs/previews/vending-3d-controls.webp',image);
 console.log('Real Android-screen screenshot saved',image.length,'bytes');
 await page.close();
}finally{
 if(browser)await browser.close();
 server.kill('SIGTERM');
}
