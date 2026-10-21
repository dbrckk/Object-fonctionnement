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

// Screen feedback and dispense animation are pure: the SVG controller owns
// transaction state, Three.js only presents it without inventing purchases.
const clamp01=n=>Math.max(0,Math.min(1,Number.isFinite(Number(n))?Number(n):0));
const ease=n=>{const t=clamp01(n);return t*t*(3-2*t);};

export function vendingDropPose(row,col,progress){
 const choice=vendingProduct(row,col);
 if(!choice)return null;
 const t=clamp01(progress),x=-.82+col*.38,startY=.94+row*.46+.16;
 if(t<=.2){
  const k=ease(t/.2);
  return {x,y:startY+.025*Math.sin(Math.PI*k),z:.17+.30*k,angle:-.25*k,stage:"release"};
 }
 if(t<=.82){
  const k=clamp01((t-.2)/.62);
  return {
   x:x+(-.27-x)*ease(k),
   y:startY+(.57-startY)*(k*k),
   z:.47+.38*ease(k),
   angle:-.25-2.2*ease(k),
   stage:"fall"
  };
 }
 const k=clamp01((t-.82)/.18);
 return {x:-.27,y:.57+.05*Math.sin(Math.PI*k)*(1-k),z:.85,
  angle:-2.45+.18*Math.sin(Math.PI*k),stage:"settle"};
}
export function vendingScreenState(state={}){
 const drop=state.drop;
 const active=drop&&vendingProduct(drop.row,drop.col);
 const tray=vendingProductFromTray(state.tray);
 if(active){
  const progress=Math.round(clamp01(drop.progress)*100);
  return {headline:"DISTRIBUTION",detail:active.code+"  "+progress+" %",
    accent:"#f8cb83",progress:clamp01(drop.progress),mode:"dispensing"};
 }
 if(tray)return {headline:"À RÉCUPÉRER",detail:tray.code,
  accent:"#9df2c8",progress:1,mode:"ready"};
 const credit=Number(state.credit);
 const safeCredit=Math.max(0,Math.min(999,Number.isFinite(credit)?credit:0));
 return {headline:"CRÉDIT DISPONIBLE",detail:safeCredit.toFixed(2)+" €",
  accent:"#a8f2d2",progress:0,mode:"idle"};
}
