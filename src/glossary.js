import {getObjectParts} from "./part-annotations.js";
import {normalizeSearch} from "./catalog.js";

export function buildGlossary(objects){
 return objects.flatMap(object=>getObjectParts(object.id).map(part=>({
  objectId:object.id,partId:part.id,objectName:object.name,category:object.category,
  label:part.label,detail:part.detail
 }))).sort((a,b)=>a.label.localeCompare(b.label,"fr"));
}
export function filterGlossary(entries,query=""){
 const terms=normalizeSearch(query).split(/\s+/).filter(Boolean);
 if(!terms.length)return entries;
 return entries.filter(entry=>{
  const haystack=normalizeSearch([entry.label,entry.detail,entry.objectName,entry.category].join(" "));
  return terms.every(term=>haystack.includes(term));
 });
}
