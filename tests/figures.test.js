import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { OBJECTS } from "../src/catalog.js";
const root=new URL("../",import.meta.url).pathname;
test("each object has an interactive figure",()=>{
  assert.equal(OBJECTS.length,9);
  for(const o of OBJECTS){
    assert.equal(o.figure,o.id==="washing"?"washer":o.id,"figure mapping: "+o.id);
    const path=join(root,"public","figures",o.figure+".html");
    assert.ok(existsSync(path),"missing "+path);
    const doc=readFileSync(path,"utf8");
    assert.match(doc,/<script[\s>]/,o.id);
    assert.match(doc,/<html\b/i);
  }
});
test("new scenes load only local scripts and attach unique figure",()=>{
  const original=new Set(["washer","vending"]);
  const scripts=readFileSync(join(root,"public","figures","objects.js"),"utf8");
  for(const o of OBJECTS.filter(o=>!original.has(o.figure))){
    const html=readFileSync(join(root,"public","figures",o.id+".html"),"utf8");
    assert.ok(html.includes('startObjectFigure("'+o.id+'")'));
    assert.match(html,/<script src="\.\/core.js"><\/script>/);
    assert.match(html,/<script src="\.\/objects.js"><\/script>/);
    assert.ok(scripts.includes("    "+o.id+"(){"),o.id+" lacks 3D scene");
  }
});
test("offline engine and MIT attribution bundled",()=>{
  assert.ok(readFileSync(join(root,"public","figures","core.js"),"utf8").includes("mountFigure"));
  const license=readFileSync(join(root,"COLORFIGURES-LICENSE"),"utf8");
  assert.match(license,/MIT License/);
  assert.match(license,/Copyright \(c\) 2026 April Zhu/);
  assert.match(license,/Tolga Cohce/);
});
test("embedded HTML demos include engine instead of network requests",()=>{
  for(const id of ["washer","vending"]){
    const html=readFileSync(join(root,"public","figures",id+".html"),"utf8");
    assert.match(html,/function mountFigure\(/);
    assert.doesNotMatch(html,/<script src="https?:\/\//);
  }
});

test("all cards have safe static isometric previews",()=>{
 for(const o of OBJECTS){
   const path=join(root,"public","previews",o.figure+".webp");
   assert.ok(existsSync(path),"missing image: "+path);
   const webp=readFileSync(path);
   assert.equal(webp.toString("ascii",0,4),"RIFF");
   assert.equal(webp.toString("ascii",8,12),"WEBP");
   assert.ok(webp.byteLength>2500);
   assert.ok(webp.length<100000,"preview too large: "+o.id);
 }
 const css=readFileSync(join(root,"src","style.css"),"utf8");
 assert.match(css,/\.object-figure img/);
 const script=readFileSync(join(root,"src","main.js"),"utf8");
 assert.ok(script.includes('/previews/'));
});

test("licensed visual and local audio engines are included in every figure",()=>{
 const rootDir=join(root,"public","figures");
 const audio=readFileSync(join(rootDir,"soundscape.js"),"utf8");
 const css=readFileSync(join(rootDir,"studio.css"),"utf8");
 assert.match(audio,/AudioContext/);
 assert.match(audio,/createOscillator/);
 assert.match(audio,/createBufferSource/);
 assert.match(css,/of-steam/);
 assert.match(css,/prefers-reduced-motion/);
 const bridge=readFileSync(join(rootDir,"bridge.js"),"utf8");
 assert.match(bridge,/soundscape\.js/);
 assert.match(bridge,/studio\.css/);
 for(const o of OBJECTS){
  const html=readFileSync(join(rootDir,o.figure+".html"),"utf8");
  assert.match(html,/bridge\.js/);
 }
});

test("original Android launcher artwork and browser icon",()=>{
 const source=readFileSync(join(root,"resources","app-icon.svg"),"utf8");
 assert.match(source,/<svg/);
 assert.match(source,/<linearGradient/);
 const png=readFileSync(join(root,"public","app-icon.png"));
 assert.equal(png.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
 assert.ok(png.byteLength>5000);
 const iconScript=readFileSync(join(root,"scripts","generate-android-icons.mjs"),"utf8");
 assert.match(iconScript,/mipmap-/);
 assert.match(iconScript,/ic_launcher_foreground/);
});

test("nine offline 3D PBR models and Third Party MIT attribution",()=>{
 const js=readFileSync(join(root,"src","three-viewer.js"),"utf8");
 for(const id of ["kettle","toaster","fan","lock","bicycle","coffee","flashlight","washing","vending"]){
  assert.ok(js.includes(id+":"),"missing 3D builder for "+id);
 }
 assert.match(js,/OrbitControls/);
 assert.match(js,/forceContextLoss/);
 assert.match(js,/setXray/);
 const license=readFileSync(join(root,"licenses","THREE-LICENSE"),"utf8");
 assert.match(license,/MIT License/);
 assert.match(license,/three\.js/i);
 const app=readFileSync(join(root,"src","main.js"),"utf8");
 assert.match(app,/VIEW_KEY/);
 assert.match(app,/volume:v1/);
});


test("fan PBR geometry has pivoted, curved blades and a stationary guard",()=>{
 const source=readFileSync(join(root,"src","three-viewer.js"),"utf8");
 const fan=source.slice(source.indexOf("function makeFan(root){"),source.indexOf("function makeLock(root){"));
 assert.match(fan,/for\(let i=0;i<5;i\+\+\)/);
 assert.match(fan,/ExtrudeGeometry/);
 assert.match(fan,/spoke\.rotation\.z=i\*Math\.PI\*2\/5/);
 assert.match(fan,/rotor\.rotation\.z=\-\(Number\(s\.turn\)\|\|0\)/);
 assert.match(fan,/pivot\.rotation\.y=s\.oscillate/);
 assert.ok(fan.indexOf("ring(pivot")>fan.indexOf("const rotor=group"),"guard must be attached to pivot, not rotor");
});

test("3D mechanisms consume absolute time, not just frame delta",()=>{
 const source=readFileSync(join(root,"src","three-viewer.js"),"utf8");
 assert.equal((source.match(/update\(s,time\)\{/g)||[]).length,0);
 assert.equal((source.match(/update\(s,dt,time\)\{/g)||[]).length,4);
 assert.match(source,/machine\.update\(state,dt,time\)/);
 assert.match(source,/needsAnimation:\(\)=>Math\.abs\(lidAngle/);
 assert.match(source,/1-Math\.exp\(-9\*Math\.min/);
});
