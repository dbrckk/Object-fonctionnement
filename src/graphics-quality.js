export const GRAPHICS_KEY="object-fonctionnement:graphics:v1";
export const GRAPHICS_MODES=Object.freeze(["auto","eco","high"]);
export function validGraphicsMode(mode){
 return GRAPHICS_MODES.includes(mode)?mode:"auto";
}
export function readGraphicsMode(storage){
 try{return validGraphicsMode(storage?.getItem(GRAPHICS_KEY));}
 catch{return "auto";}
}
// Pixel ratio is intentionally capped; a 3x Android display must not
// multiply GPU fill-rate by nine for a didactic 3D model.
export function graphicsProfile(mode,{devicePixelRatio=1,width=390,reducedMotion=false}={}){
 const selected=validGraphicsMode(mode);
 const dpr=Math.max(1,Math.min(3,Number(devicePixelRatio)||1));
 const compact=width<600;
 if(selected==="eco")return {pixelRatio:1,shadowSize:256,frameMs:50};
 if(selected==="high")return {pixelRatio:Math.min(dpr,2),shadowSize:1024,frameMs:33};
 return {
  pixelRatio:Math.min(dpr,compact?1.2:1.5),
  shadowSize:compact?512:1024,
  frameMs:reducedMotion?50:33
 };
}
