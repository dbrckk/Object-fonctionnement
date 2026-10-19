export const TOUR_PROGRESS_KEY="object-fonctionnement:tours:v1";

/** Store only completed visits; progress is never inferred from reading or merely opening a page. */
export function normalizeTours(value,validIds){
 const allowed=new Set(validIds);
 if(!Array.isArray(value))return [];
 return [...new Set(value.filter(id=>typeof id==="string"&&allowed.has(id)))];
}
export function readTours(storage,validIds){
 try{return normalizeTours(JSON.parse(storage.getItem(TOUR_PROGRESS_KEY)||"[]"),validIds);}
 catch{return [];}
}
export function saveTours(storage,completed,validIds){
 const normalized=normalizeTours(completed,validIds);
 try{storage.setItem(TOUR_PROGRESS_KEY,JSON.stringify(normalized));}catch{}
 return normalized;
}
