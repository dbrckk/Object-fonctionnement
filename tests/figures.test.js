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
