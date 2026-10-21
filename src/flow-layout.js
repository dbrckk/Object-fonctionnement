// Projected instructional arrows must remain readable on small screens.
// A short segment cannot carry an arrowhead: hide it rather than rendering
// backward curves through numbered nodes.
export function flowLinkGeometry(a,b,edgePadding=21){
 if(!a||!b)return null;
 const dx=b.x-a.x,dy=b.y-a.y;
 const length=Math.hypot(dx,dy);
 if(!Number.isFinite(length)||length<edgePadding*2+14)return null;
 const ux=dx/length,uy=dy/length;
 const start={x:a.x+ux*edgePadding,y:a.y+uy*edgePadding};
 const finish={x:b.x-ux*(edgePadding+3),y:b.y-uy*(edgePadding+3)};
 const curvature=Math.min(12,Math.max(0,(length-2*edgePadding)*.13));
 const mid={x:(start.x+finish.x)/2-uy*curvature,
            y:(start.y+finish.y)/2+ux*curvature};
 return {start,mid,finish};
}
export function viewportFlowPoint(projected,width,height){
 if(!projected||width<=0||height<=0)return null;
 const {x,y,z}=projected;
 if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(z))return null;
 if(z< -1||z>1||Math.abs(x)>1.08||Math.abs(y)>1.08)return null;
 // Keep step discs and labels inside canvas when viewed on small Android phones.
 return {x:Math.max(19,Math.min(width-19,(x*.5+.5)*width)),
         y:Math.max(19,Math.min(height-19,(-y*.5+.5)*height))};
}
