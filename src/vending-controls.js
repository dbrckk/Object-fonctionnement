// Mobile control adapter for the original sandboxed vending simulation.
// View state is derived from authoritative ColorFigures messages. No action
// mutates stock, credit or a transaction from this module.
import {VENDING_KEY_LABELS} from "./vending-visuals.js";
const clampMoney=value=>{
 const x=Number(value);
 return Number.isFinite(x)?Math.max(0,Math.min(999,x)):0;
};
const money=value=>clampMoney(value).toFixed(2).replace(".",",")+" €";
export const VENDING_COMMANDS=Object.freeze(["coin","refund","takeCoins","flap","collect"]);
export function vendingControlCommand(action,key){
 if(action==="key"){
  if(!VENDING_KEY_LABELS.includes(key))return null;
  return {type:"object-figure:vending-command",action:"key",key};
 }
 return VENDING_COMMANDS.includes(action)
  ?{type:"object-figure:vending-command",action}:null;
}
export function vendingControlView(state={}){
 const s=state&&typeof state==="object"?state:{};
 const credit=clampMoney(s.credit),returned=clampMoney(s.returned);
 const selection=/^[A-D]$/.test(s.sel||"")?s.sel:"";
 const drop=s.drop&&Number.isInteger(s.drop.r)&&Number.isInteger(s.drop.c)
  &&s.drop.r>=0&&s.drop.r<4&&s.drop.c>=0&&s.drop.c<4?s.drop:null;
 const tray=typeof s.tray?.code==="string"&&/^[A-D][1-4]$/.test(s.tray.code)
  ?s.tray.code:null;
 const flap=Number.isFinite(Number(s.flap))?Math.max(0,Math.min(1,Number(s.flap))):0;
 let status;
 if(drop)status="Distribution du produit en cours…";
 else if(tray)status=flap>.96
  ?'Produit '+tray+' prêt : appuie sur « Récupérer ».'
  :'Produit '+tray+' prêt : ouvre la trappe.';
 else if(selection)status="Ligne "+selection+" sélectionnée : choisis un chiffre de 1 à 4.";
 else status="Insère des pièces, puis choisis une lettre A–D et un chiffre 1–4.";
 if(!drop&&!tray&&typeof s.msg==="string"){
  const message=s.msg.split("|",1)[0];
  if(message==="SOLD")status="Ce produit est épuisé.";
  else if(message==="INSERT")status="Crédit insuffisant pour cet article.";
  else if(message==="TAKE")status="Récupère d’abord le produit dans le bac.";
  else if(message==="PICK")status="Choisis d’abord une lettre A–D.";
 }
 return {
  creditText:money(credit),returnedText:money(returned),
  selection:selection||"—",tray,dropActive:Boolean(drop),
  status,
  coinDisabled:credit>=5,
  refundDisabled:credit<=0,
  takeCoinsDisabled:returned<=0,
  flapDisabled:!tray,
  collectDisabled:!tray||flap<.96,
  keysDisabled:Boolean(drop||tray)
 };
}
