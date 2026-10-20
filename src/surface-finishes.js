// Deterministic procedural surface details. Pure functions are testable in Node,
// and the small grayscale maps can be generated offline in the Android WebView.
export const SURFACE_KINDS=Object.freeze(["brushed-metal","molded-plastic","rubber"]);
export const SURFACE_SIZE=128;

export function surfaceNoise(x,y,seed=1){
  let v=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(seed|0,1442695041))|0;
  v=Math.imul(v^(v>>>13),1274126177);
  return ((v^(v>>>16))>>>0)/4294967295;
}
const limit=v=>Math.max(0,Math.min(255,Math.round(v)));
export function surfaceLuminance(kind,x,y){
  const fine=surfaceNoise(x,y,97);
  if(kind==="brushed-metal"){
    const stripe=surfaceNoise(0,y,31);
    // Long parallel brushed strokes, with gentle micro-speckling.
    return limit(196+47*stripe+12*(fine-.5));
  }
  if(kind==="molded-plastic"){
    const coarse=surfaceNoise(Math.floor(x/4),Math.floor(y/4),19);
    return limit(213+21*(coarse-.5)+22*(fine-.5));
  }
  if(kind==="rubber"){
    const stipple=surfaceNoise(Math.floor(x/2),Math.floor(y/2),7);
    return limit(176+46*(stipple-.5)+27*(fine-.5));
  }
  throw new RangeError("Unknown surface finish: "+kind);
}
export function createSurfacePixels(kind,size=SURFACE_SIZE){
  if(!SURFACE_KINDS.includes(kind))throw new RangeError("Unknown surface finish: "+kind);
  if(!Number.isInteger(size)||size<2||size>512)throw new RangeError("Invalid surface dimension");
  const rgba=new Uint8ClampedArray(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const value=surfaceLuminance(kind,x,y);
    const offset=(y*size+x)*4;
    rgba[offset]=value;
    rgba[offset+1]=value;
    rgba[offset+2]=value;
    rgba[offset+3]=255;
  }
  return rgba;
}
