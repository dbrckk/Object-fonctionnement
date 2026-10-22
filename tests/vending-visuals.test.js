import test from "node:test";
import assert from "node:assert/strict";
import {VENDING_PRODUCT_ROWS,vendingProduct,vendingProductFromTray,feederRotation,vendingDropPose,vendingScreenState,VENDING_KEY_LABELS,vendingKeypadVisual} from "../src/vending-visuals.js";

test("all 16 selections match the original ColorFigures product rows and colors",()=>{
 assert.deepEqual(VENDING_PRODUCT_ROWS.map(x=>x.kind),["can","can","bottle","snack"]);
 assert.equal(VENDING_PRODUCT_ROWS.length,4);
 const codes=new Set();
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  const item=vendingProduct(row,col);
  assert.ok(item);
  assert.equal(item.kind,VENDING_PRODUCT_ROWS[row].kind);
  assert.equal(item.color,VENDING_PRODUCT_ROWS[row].colors[col]);
  assert.equal(item.code,"ABCD"[row]+(col+1));
  assert.deepEqual(vendingProductFromTray({code:item.code}),item);
  codes.add(item.code);
 }
 assert.equal(codes.size,16);
 assert.equal(vendingProduct(2,1).kind,"bottle");
 assert.equal(vendingProduct(3,3).kind,"snack");
 assert.equal(vendingProductFromTray({code:"B3"}).color,0xece6d6);
});
test("invalid tray codes and slot indices never show made-up products",()=>{
 for(const pair of [[-1,1],[1,4],[1.2,1],[0,NaN],[undefined,3]]){
  assert.equal(vendingProduct(...pair),null);
 }
 for(const item of [null,undefined,{},{code:"Z9"},{code:"A0"},{code:"A1x"},{code:23}]){
  assert.equal(vendingProductFromTray(item),null);
 }
});
test("feeder spiral turns exactly once and clamps impossible progress",()=>{
 assert.equal(feederRotation(0),0);
 assert.equal(feederRotation(-1),0);
 assert.equal(feederRotation(1),Math.PI*2);
 assert.equal(feederRotation(4),Math.PI*2);
 assert.equal(feederRotation(Number.NaN),0);
 assert.equal(feederRotation(.5),Math.PI);
});

test("dispense trajectory has continuous release, gravity fall, and final settle",()=>{
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  const start=vendingDropPose(row,col,0);
  assert.equal(start.stage,"release");
  assert.equal(start.x,-.82+col*.38);
  const release=vendingDropPose(row,col,.2);
  const falling=vendingDropPose(row,col,.200001);
  assert.ok(Math.hypot(release.x-falling.x,release.y-falling.y,release.z-falling.z)<.00001);
  const endFall=vendingDropPose(row,col,.82);
  const settle=vendingDropPose(row,col,.820001);
  assert.ok(Math.hypot(endFall.x-settle.x,endFall.y-settle.y,endFall.z-settle.z)<.00001);
  const finish=vendingDropPose(row,col,1);
  assert.equal(finish.stage,"settle");
  assert.ok(Math.abs(finish.x+.27)<1e-9);
  assert.ok(Math.abs(finish.y-.57)<1e-9);
  assert.ok(Math.abs(finish.z-.85)<1e-9);
  assert.ok(vendingDropPose(row,col,.5).y<start.y);
 }
 assert.equal(vendingDropPose(4,0,.4),null);
 assert.deepEqual(vendingDropPose(0,0,Infinity),vendingDropPose(0,0,0));
 assert.deepEqual(vendingDropPose(0,0,-5),vendingDropPose(0,0,0));
});
test("transaction display prioritizes selected product and pickup over credit",()=>{
 const idle=vendingScreenState({credit:1.5});
 assert.deepEqual({headline:idle.headline,detail:idle.detail,mode:idle.mode},
  {headline:"CRÉDIT DISPONIBLE",detail:"1.50 €",mode:"idle"});
 const drop=vendingScreenState({credit:1.5,drop:{row:2,col:1,progress:.42}});
 assert.equal(drop.headline,"DISTRIBUTION");
 assert.match(drop.detail,/C2/);
 assert.match(drop.detail,/42 %/);
 assert.equal(drop.mode,"dispensing");
 assert.equal(drop.progress,.42);
 const tray=vendingScreenState({credit:1.5,tray:{code:"D4"}});
 assert.equal(tray.mode,"ready");
 assert.equal(tray.detail,"D4");
 assert.equal(vendingScreenState({credit:1.5,tray:{code:"Z9"}}).mode,"idle");
 assert.equal(vendingScreenState({credit:Infinity}).detail,"0.00 €");
});

test("eight physical keypad keys mirror the vending controller's A-D and 1-4",()=>{
 assert.deepEqual(VENDING_KEY_LABELS,["A","1","B","2","C","3","D","4"]);
 assert.deepEqual(vendingKeypadVisual({sel:"B",press:"B"}),
  {pressed:"B",selection:"B",preview:false});
 assert.deepEqual(vendingKeypadVisual({sel:"B",press:"3"}),
  {pressed:"3",selection:"B",preview:false});
 assert.equal(vendingKeypadVisual({press:"9",sel:"Z"}).pressed,null);
 assert.equal(vendingKeypadVisual({press:"9",sel:"Z"}).selection,"");
});
test("selection preview presses B then 3 without changing transaction data",()=>{
 const before={stock:[[3]],credit:2,sel:"A",press:"A",drop:null,keypadDemo:.2};
 const snapshot=JSON.stringify(before);
 const first=vendingKeypadVisual(before);
 assert.equal(first.pressed,"B");
 assert.equal(first.preview,true);
 assert.equal(vendingKeypadVisual({...before,keypadDemo:.45}).selection,"B");
 const digit=vendingKeypadVisual({...before,keypadDemo:.68});
 assert.equal(digit.pressed,"3");
 assert.equal(digit.selection,"B3");
 assert.equal(vendingKeypadVisual({...before,keypadDemo:1}).pressed,null);
 assert.equal(JSON.stringify(before),snapshot);
 const preview=vendingScreenState({credit:0,keypad:digit});
 assert.equal(preview.mode,"preview");
 assert.equal(preview.detail,"B3");
 assert.equal(preview.headline,"SAISIE (DÉMO)");
});
test("real selection screen keeps drop and pickup transactions authoritative",()=>{
 const keypad=vendingKeypadVisual({sel:"C",press:null});
 assert.equal(vendingScreenState({credit:1,keypad}).mode,"selection");
 assert.equal(vendingScreenState({credit:1,keypad}).detail,"C_");
 assert.equal(vendingScreenState({drop:{row:1,col:2,progress:.35},keypad}).mode,
  "dispensing");
 assert.equal(vendingScreenState({tray:{code:"B3"},keypad}).mode,"ready");
});
