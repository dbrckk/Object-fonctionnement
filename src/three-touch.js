// Pointer guard shared by the 3D viewer and deterministic Node tests.
// A pinch, drag or long press must never trigger a vending transaction.
export function isIntentionalTap(start,end,{maxDistance=11,maxDuration=650}={}){
 if(!start||!end||start.pointerId!==end.pointerId)return false;
 if(start.isPrimary===false||end.isPrimary===false)return false;
 if(start.button!==0||end.button!==0)return false;
 const dx=Number(end.clientX)-Number(start.clientX);
 const dy=Number(end.clientY)-Number(start.clientY);
 const duration=Number(end.timeStamp)-Number(start.timeStamp);
 return [dx,dy,duration,maxDistance,maxDuration].every(Number.isFinite)
  &&duration>=0&&duration<=maxDuration&&dx*dx+dy*dy<=maxDistance*maxDistance;
}
