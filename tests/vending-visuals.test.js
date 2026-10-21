import test from "node:test";
import assert from "node:assert/strict";
import {VENDING_PRODUCT_ROWS,vendingProduct,vendingProductFromTray,feederRotation} from "../src/vending-visuals.js";

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
