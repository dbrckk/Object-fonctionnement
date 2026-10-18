/* Build static card previews from the real interactive ColorFigures scenes.
   Run: npm run generate:previews (starts Vite automatically on port 4176). */
import { chromium } from 'playwright';
import sharp from 'sharp';
import { spawn } from 'node:child_process';
import { mkdir,writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base='http://127.0.0.1:4176';
const ids=['kettle','toaster','fan','lock','bicycle','coffee','flashlight','washer','vending'];
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4176','--strictPort'],{cwd:root,stdio:'ignore'});
let browser;
try{
 let ready=false;
 for(let i=0;i<80;i++){
  try{if((await fetch(base+'/')).ok){ready=true;break;}}catch{}
  await new Promise(r=>setTimeout(r,200));
 }
 if(!ready)throw Error('Could not start Vite preview generator');
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 await mkdir(path.join(root,'public','previews'),{recursive:true});
 for(const id of ids){
  const page=await browser.newPage({viewport:{width:720,height:540}});
  try{
   await page.goto(base+'/figures/'+id+'.html',{waitUntil:'load'});
   await page.waitForSelector('#art path');
   const svg=await page.evaluate(()=>{
    document.querySelectorAll('#art .tag').forEach(el=>el.remove());
    const original=document.querySelector('svg#fig');
    const box=document.querySelector('#art').getBBox();
    const clone=original.cloneNode(true);
    clone.querySelectorAll('script,foreignObject,style,defs').forEach(el=>el.remove());
    clone.querySelector('#art')?.removeAttribute('filter');
    clone.querySelectorAll('[data-act]').forEach(el=>el.removeAttribute('data-act'));
    const width=Math.max(box.width*1.12,box.height*1.45,20),height=width*.75;
    clone.setAttribute('viewBox',[box.x+box.width/2-width/2,box.y+box.height/2-height/2,width,height].map(v=>v.toFixed(2)).join(' '));
    clone.setAttribute('xmlns','http://www.w3.org/2000/svg');
    clone.setAttribute('width','480');
    clone.setAttribute('height','360');
    return new XMLSerializer().serializeToString(clone);
   });
   const output=await sharp(Buffer.from(svg),{density:160}).resize({width:480,height:360,fit:'contain',background:'#f2eee4'}).flatten({background:'#f2eee4'}).webp({quality:85,effort:6}).toBuffer();
   await writeFile(path.join(root,'public','previews',id+'.webp'),output);
   console.log(id,output.byteLength,'bytes');
  }finally{await page.close();}
 }
}finally{if(browser)await browser.close();server.kill('SIGTERM');}
