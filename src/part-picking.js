/* Pick the closest visible, projected technical anchor to an actual
 * raycast hit on the object's mesh. This pure function is separately tested.
 * Screen-space limits prevent unrelated body taps from opening a lesson.
 */
export function closestProjectedPart(points,x,y,maxDistance=74){
 if(!Array.isArray(points)||!Number.isFinite(x)||!Number.isFinite(y)||
    !Number.isFinite(maxDistance)||maxDistance<=0)return -1;
 let best=-1,nearest=maxDistance*maxDistance;
 for(let i=0;i<points.length;i++){
  const p=points[i];
  if(!p||p.visible!==true||!Number.isFinite(p.x)||
     !Number.isFinite(p.y))continue;
  const d=(p.x-x)**2+(p.y-y)**2;
  if(d<=nearest){
   if(d===nearest&&best>=0)continue;
   nearest=d;best=i;
  }
 }
 return best;
}
