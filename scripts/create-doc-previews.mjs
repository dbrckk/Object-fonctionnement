import {chromium} from 'playwright';
import sharp from 'sharp';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const url='http://127.0.0.1:4222';
const folder=path.join(root,'docs','previews');
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4222','--strictPort'],{cwd:root,stdio:'ignore'});
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
 for(const id of ['kettle','fan','vending']){
  const page=await browser.newPage({viewport:{width:700,height:870},deviceScaleFactor:1.5});
  try{
   await page.goto(url+'/#'+id,{waitUntil:'load'});
   await page.locator('.object-three-canvas').waitFor({timeout:16000});
   await page.waitForTimeout(380);
   const buffer=await page.locator('.object-three-canvas').screenshot({animations:'disabled'});
   const webp=await sharp(buffer).resize({width:1000}).webp({quality:84,effort:6}).toBuffer();
   await writeFile(path.join(folder,id+'.webp'),webp);
   console.log(id,'preview',webp.length,'bytes');
  }finally{await page.close();}
 }
}finally{
 if(browser)await browser.close();
 server.kill('SIGTERM');
}
