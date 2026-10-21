// Offline visual catalogue mirroring the selectable products in ColorFigures.
// The source keeps 4 rows (A-D), four columns (1-4), and three items per slot.
// Product shape and colour must agree with the actual vend / tray state.
export const VENDING_PRODUCT_ROWS=Object.freeze([
  Object.freeze({kind:"can",colors:Object.freeze([0xe2473a,0x2f6fd6,0xf2c230,0x38a565])}),
  Object.freeze({kind:"can",colors:Object.freeze([0x8c4bd1,0xf08a2b,0xece6d6,0x33302c])}),
  Object.freeze({kind:"bottle",colors:Object.freeze([0xf07b2a,0x5cc0e8,0xd94f86,0x9ccc3c])}),
  Object.freeze({kind:"snack",colors:Object.freeze([0xf2c230,0xe2473a,0x3e86d9,0x8a5a3c])})
]);
export function vendingProduct(row,col){
  if(!Number.isInteger(row)||!Number.isInteger(col)||row<0||row>3||col<0||col>3)return null;
  const spec=VENDING_PRODUCT_ROWS[row];
  return {kind:spec.kind,color:spec.colors[col],row,col,code:String.fromCharCode(65+row)+(col+1)};
}
export function vendingProductFromTray(tray){
  const code=tray?.code;
  if(typeof code!=="string"||!/^[A-D][1-4]$/.test(code))return null;
  return vendingProduct(code.charCodeAt(0)-65,Number(code[1])-1);
}
// One complete turn extrudes the front-most product from its spiral feeder.
// Progress is clamped so corrupt or delayed frames do not spin indefinitely.
export function feederRotation(progress){
  const t=Number(progress);
  return Math.PI*2*Math.max(0,Math.min(1,Number.isFinite(t)?t:0));
}
