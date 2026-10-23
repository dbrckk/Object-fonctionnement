// Generate *real* app screenshots (Chromium renders the actual installed
// assets) and a feature graphic composed from the project's own 3D models.
// Output is a CI artifact, not invented or retouched screenshots.
import {chromium} from "playwright";
import sharp from "sharp";
import {spawn} from "node:child_process";
import {mkdir,readFile} from "node:fs/promises";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const output=resolve(root,"store-assets");
await mkdir(output,{recursive:true});
const source=await readFile(resolve(root,"resources/app-icon.svg"));
await sharp(source).resize(512,512).png().toFile(resolve(output,"app-icon-512.png"));
const escape=x=>String(x).replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
const bannerSvg=`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500">
 <defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#102639"/>
 <stop offset="1" stop-color="#0f6070"/></linearGradient></defs>
 <rect width="1024" height="500" fill="url(#g)"/>
 <circle cx="880" cy="70" r="220" fill="#ffffff" opacity=".04"/>
 <circle cx="1020" cy="390" r="270" fill="#b4f5e0" opacity=".07"/>
 <text x="52" y="105" font-family="sans-serif" font-size="22" font-weight="bold" letter-spacing="3" fill="#7ee8d4">LE MONDE EXPLIQUÉ</text>
 <text x="48" y="177" font-family="sans-serif" font-size="53" font-weight="bold" fill="#ffffff">Comment ça marche ?</text>
 <text x="52" y="226" font-family="sans-serif" font-size="24" fill="#c1e8e6">Explorez les objets du quotidien en 3D</text>
 <text x="52" y="263" font-family="sans-serif" font-size="20" fill="#9ccecb">9 objets · Visites · Simulations · Défis</text>
 <rect x="50" y="310" width="390" height="53" rx="15" fill="#e2f4e4"/>
 <text x="72" y="345" font-family="sans-serif" font-size="21" font-weight="bold" fill="#1e4e52">OBJECT FONCTIONNEMENT</text>
 </svg>`;
const previewNames=["kettle","fan","lock"];
const previews=[];
for(const name of previewNames){
 const path=resolve(root,"docs/previews/"+escape(name)+".webp");
 const input=await readFile(path);
 previews.push(await sharp(input).resize(245,188,{fit:"contain",background:"#ffffff00"}).png().toBuffer());
}
await sharp(Buffer.from(bannerSvg)).composite(previews.map((input,i)=>({
 input,left:465+(i%2)*252,top:i===2?268:74
}))).flatten({background:"#102639"}).removeAlpha().png().toFile(resolve(output,"feature-graphic-1024x500.png"));

const HOST="http://127.0.0.1:4179";
const server=spawn(process.execPath,["node_modules/vite/bin/vite.js","--host","127.0.0.1",
 "--port","4179","--strictPort"],{cwd:root,stdio:"ignore"});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let browser;
try{
 let ready=false;
 for(let i=0;i<85;i++){
  try{const response=await fetch(HOST+"/");if(response.ok){ready=true;break;}}catch{}
  await sleep(200);
 }
 if(!ready)throw Error("Vite failed to start for real Play Store screenshots");
 browser=await chromium.launch({headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
 const page=await browser.newPage({viewport:{width:540,height:960},
  deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const shots=[
  {file:"01-catalogue.png",route:"/"},
  {file:"02-bouilloire-3d.png",route:"/#kettle",mode:"model"},
  {file:"03-ventilateur-3d.png",route:"/#fan",mode:"model"},
  {file:"04-defis-pratiques.png",route:"/#washing",mode:"challenge"}
 ];
 for(const shot of shots){
  await page.goto(HOST+shot.route,{waitUntil:"load"});
  if(shot.mode){
   await page.locator(".object-three-canvas").waitFor({timeout:16000});
   await page.locator(".three-shell").scrollIntoViewIfNeeded();
   if(shot.mode==="challenge"){
    await page.locator("#three-operate").click();
    await page.locator("#mission-start").click();
    await page.locator("#practical-mission").scrollIntoViewIfNeeded();
   }
   await sleep(850);
  }else await sleep(500);
  await page.screenshot({path:resolve(output,shot.file),animations:"disabled"});
  const meta=await sharp(resolve(output,shot.file)).metadata();
  if(meta.width!==1080||meta.height!==1920)
   throw Error("Screenshot wrong resolution: "+shot.file);
  console.log("Real Android-equivalent screen: "+shot.file);
 }
}finally{
 await browser?.close();
 server.kill("SIGTERM");
}
console.log("Play Store pack: 512x512 icon, 1024x500 feature, four 1080x1920 real screenshots.");
