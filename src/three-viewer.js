/* Offline product-quality 3D object viewer.
 * Three.js / MIT, procedural geometry only; no texture downloads or model licenses.
 * Models are intentionally didactic, not geometrically exact appliance reproductions.
 */
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {getObjectParts} from "./part-annotations.js";

const M={
  enamel: {color:0xeef2f0,metalness:.22,roughness:.27},
  ivory:{color:0xfff4e3,metalness:.08,roughness:.42},
  steel:{color:0xaebac4,metalness:.82,roughness:.28},
  stainless:{color:0xd8e2e5,metalness:.78,roughness:.23},
  charcoal:{color:0x273443,metalness:.24,roughness:.42},
  dark:{color:0x172333,metalness:.48,roughness:.34},
  glass:{color:0xbfeaf0,metalness:.1,roughness:.12,transparent:true,opacity:.34,depthWrite:false},
  amber:{color:0xde9a57,metalness:.12,roughness:.52},
  rubber:{color:0x28333a,metalness:0,roughness:.85},
  turquoise:{color:0x55b7c9,metalness:.34,roughness:.33},
  warm:{color:0xf4a16f,metalness:.23,roughness:.38},
  coffee:{color:0x68412d,metalness:0,roughness:.62},
  bread:{color:0xeec18e,metalness:0,roughness:.89},
  leaf:{color:0x6cb9a2,metalness:.14,roughness:.48}
};
const material=(p)=>new THREE.MeshStandardMaterial(p);
const mats=Object.fromEntries(Object.entries(M).map(([key,value])=>[key,material(value)]));
const glow=new THREE.MeshStandardMaterial({color:0xffdfa0,roughness:.21,emissive:0xffb95e,emissiveIntensity:.72});
const steamMaterial=new THREE.MeshBasicMaterial({color:0xa7dce5,transparent:true,opacity:.29,depthWrite:false});
const frosted=new THREE.MeshPhysicalMaterial({color:0xd1f0f4,metalness:0,roughness:.2,transmission:.48,thickness:.15,transparent:true,opacity:.64,side:THREE.DoubleSide,depthWrite:false});
const liquid=new THREE.MeshStandardMaterial({color:0x58bdde,metalness:.05,roughness:.3,transparent:true,opacity:.65,depthWrite:false});
const alertMat=new THREE.MeshStandardMaterial({color:0xf9a878,emissive:0xe85f36,emissiveIntensity:.22});
const brassy=material({color:0xe2bb72,metalness:.77,roughness:.23});
const blue=material({color:0x7fbcd1,metalness:.3,roughness:.35});
const white=material({color:0xffffff,metalness:.08,roughness:.4});
const tint=material({color:0xf1a580,metalness:.23,roughness:.4});
// Offline equirectangular softbox environment for true PBR metal reflections.
function studioEnvironment(){
 const c=document.createElement("canvas");
 c.width=512;c.height=256;
 const g=c.getContext("2d");
 const vertical=g.createLinearGradient(0,0,0,256);
 vertical.addColorStop(0,"#c1d9e3");
 vertical.addColorStop(.32,"#f1efe8");
 vertical.addColorStop(.68,"#dce7e6");
 vertical.addColorStop(1,"#9baeb5");
 g.fillStyle=vertical;g.fillRect(0,0,512,256);
 const softbox=(x,y,w,h,color)=>{
   g.shadowColor=color;g.shadowBlur=28;
   g.fillStyle=color;g.fillRect(x,y,w,h);
   g.shadowBlur=0;
 };
 softbox(55,24,130,77,"#ffffff");
 softbox(278,19,70,103,"#fff2db");
 softbox(425,38,56,65,"#e5f6ff");
 const t=new THREE.CanvasTexture(c);
 t.mapping=THREE.EquirectangularReflectionMapping;
 t.colorSpace=THREE.SRGBColorSpace;
 return t;
}
const edgeMaterial=new THREE.LineBasicMaterial({color:0x24374a,transparent:true,opacity:.16});
const truncate=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));

function cylinder(parent,r1,r2,h,mat,x=0,y=0,z=0,n=40){
 const object=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,n),mat);
 object.position.set(x,y,z);parent.add(object);object.castShadow=true;object.receiveShadow=true;return object;
}
function block(parent,w,h,d,mat,x=0,y=0,z=0,r=.06){
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
 mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
 if(r>0){
  const line=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry,23),edgeMaterial);
  line.position.copy(mesh.position);parent.add(line);
 }
 return mesh;
}
function sphere(parent,r,mat,x=0,y=0,z=0){
 const o=new THREE.Mesh(new THREE.SphereGeometry(r,24,16),mat);
 o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;
}
function ring(parent,r,t,mat,x=0,y=0,z=0,rotX=0,rotY=0){
 const o=new THREE.Mesh(new THREE.TorusGeometry(r,t,12,72),mat);
 o.position.set(x,y,z);o.rotation.set(rotX,rotY,0);o.castShadow=true;parent.add(o);return o;
}
function rod(parent,a,b,r,mat){
 const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),v=new THREE.Vector3().subVectors(B,A);
 const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,v.length(),12),mat);
 mesh.position.copy(A).add(B).multiplyScalar(.5);
 mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());
 mesh.castShadow=true;parent.add(mesh);return mesh;
}
function hose(parent,points,r,mat){
 const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
 const mesh=new THREE.Mesh(new THREE.TubeGeometry(path,45,r,9,false),mat);
 parent.add(mesh);mesh.castShadow=true;return mesh;
}
function group(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
function labelPanel(parent,w,h,x,y,z){return block(parent,w,h,.025,mats.dark,x,y,z,0);}
function badge(parent,title,x,y,z,width=.68,height=.18,tone="#f0e3d1",ink="#334d5c"){
 const canvas=document.createElement("canvas");
 canvas.width=512;canvas.height=128;
 const context=canvas.getContext("2d");
 context.clearRect(0,0,512,128);
 context.fillStyle=tone;context.fillRect(0,0,512,128);
 context.strokeStyle="#ffffffaa";context.lineWidth=5;context.strokeRect(8,8,496,112);
 context.fillStyle=ink;
 context.textAlign="center";context.textBaseline="middle";
 context.font="bold 48px system-ui, sans-serif";
 context.fillText(title,256,66,480);
 const texture=new THREE.CanvasTexture(canvas);
 texture.colorSpace=THREE.SRGBColorSpace;
 texture.anisotropy=2;
 const material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,transparent:true});
 const plane=new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);
 plane.position.set(x,y,z);parent.add(plane);
 plane.userData.isDecal=true;
 return plane;
}
function gauge(parent,x,y,z,r=.2){
 const g=group(parent,x,y,z);
 cylinder(g,r,r,.06,mats.stainless,0,0,0).rotation.x=Math.PI/2;
 cylinder(g,r*.83,r*.83,.068,mats.ivory,0,0,.02).rotation.x=Math.PI/2;
 for(let i=0;i<10;i++){
  const a=-Math.PI*.78+i*(Math.PI*1.58/9);
  rod(g,[Math.cos(a)*r*.58,Math.sin(a)*r*.58,.07],[Math.cos(a)*r*.72,Math.sin(a)*r*.72,.07],.008,mats.dark);
 }
 const needle=group(g,0,0,.09);
 rod(needle,[0,0,0],[0,r*.6,0],.016,alertMat);
 sphere(g,.025,mats.dark,0,0,.1);
 return needle;
}
function marker(parent,x,y,z,mat=mats.charcoal,r=.035){return sphere(parent,r,mat,x,y,z);}
function led(parent,x,y,z,color=glow){return sphere(parent,.055,color,x,y,z);}
function plate(parent,w,d,y=0){
 block(parent,w,.09,d,mats.ivory,0,y,0);
 cylinder(parent,.06,.06,.06,mats.rubber,-w*.39,y-.07,d*.34);
 cylinder(parent,.06,.06,.06,mats.rubber,w*.39,y-.07,d*.34);
}
function makeKettle(root){
 plate(root,2.6,2.1,.12);
 const base=cylinder(root,.67,.73,.13,mats.dark,0,.24,0);
 const shell=cylinder(root,.56,.64,1.3,mats.stainless,0,1.0,0);
 cylinder(root,.64,.64,.14,mats.dark,0,.4,0);
 cylinder(root,.55,.55,.045,mats.steel,0,1.68,0);
 // The lid pivots around the back: the knob follows the lid rather
 // than teleporting vertically when the user opens the vessel.
 const lidHinge=group(root,0,1.7,-.39);
 cylinder(lidHinge,.44,.44,.08,mats.charcoal,0,.05,.39);
 cylinder(lidHinge,.12,.1,.1,mats.stainless,0,.12,.39);
 rod(root,[-.18,1.7,-.41],[.18,1.7,-.41],.04,mats.steel);
 hose(root,[[.47,1.47,-.08],[.82,1.58,-.05],[1.05,1.44,0],[1.08,.72,0],[.78,.6,0]],.065,mats.rubber);
 rod(root,[-.47,1.42,0],[-.93,1.66,0],.15,mats.steel);
 const nozzle=cylinder(root,.185,.13,.09,mats.stainless,-.98,1.67,0);
 nozzle.rotation.z=-Math.PI*.34;
 // Exterior calibrated sight glass stays visible even though the body
 // is opaque. Its level is driven by the actual ColorFigures water state.
 block(root,.37,.91,.045,mats.dark,.1,1.05,.662);
 block(root,.31,.85,.055,frosted,.1,1.05,.696);
 const visibleWater=block(root,.25,.79,.06,liquid,.1,.86,.745);
 for(let i=0;i<5;i++){
  const y=.78+i*.135;
  rod(root,[.22,y,.66],[.29,y,.66],.008,mats.stainless);
 }
 badge(root,"H2O",.10,1.46,.68,.18,.095,"#273c4a","#e6f5fb");
 // An orange heating-ring and LED expose the hidden heating resistor.
 const heaterMaterial=material({color:0xda693d,emissive:0xfa672b,emissiveIntensity:.07,metalness:.18,roughness:.35});
 const heater=ring(root,.59,.023,heaterMaterial,0,.42,0,Math.PI/2);
 const ledMat=material({color:0xfbb673,emissive:0xff5b21,emissiveIntensity:.07});
 led(root,.23,.48,.54,ledMat);
 const steam=group(root,-.96,1.7,0);
 const puffs=[];
 for(let i=0;i<8;i++)puffs.push(sphere(steam,.073+(i%4)*.012,steamMaterial,0,i*.17,0));
 let lidAngle=0,lidTarget=0;
 return {
  shells:[shell],
  needsAnimation:()=>Math.abs(lidAngle-(lidTarget||0))>.007,
  update(s,dt,time){
  const water=truncate(s.water,0,1);
  const height=.75*water;
  visibleWater.scale.y=Math.max(.005,height/.79);
  visibleWater.position.y=.655+height/2;
  const hot=truncate(s.hot,0,1);
  heaterMaterial.emissiveIntensity=s.heating?.35+hot*1.25:.035;
  ledMat.emissiveIntensity=s.heating?1.35:.06;
  const vapor=truncate((s.heating?hot*.92:0)+Number(s.steam||0),0,1);
  for(let i=0;i<puffs.length;i++){
   const puff=puffs[i],a=(time*.28+i/puffs.length)%1;
   puff.position.set(Math.sin(i*2.7+time*.8)*.10,a*.85,Math.cos(i*1.7+time*.7)*.08);
   puff.scale.setScalar(vapor*(.45+.95*a)+.0001);
  }
  // Frame-rate-independent easing; keeps rendering until the lid arrives.
  lidTarget=s.lid?-.74:0;
  const alpha=1-Math.exp(-9*Math.min(Math.max(dt,0),.05));
  lidAngle+=(lidTarget-lidAngle)*alpha;
  if(Math.abs(lidAngle-lidTarget)<.006)lidAngle=lidTarget;
  lidHinge.rotation.x=lidAngle;
 }};
}
function makeToaster(root){
 plate(root,2.6,2.1,.12);
 const body=block(root,1.65,1.35,.98,mats.warm,0,.86,0);
 block(root,1.54,.08,.9,mats.stainless,0,1.54,0);
 const slotMat=material({color:0x191e24,roughness:.88});
 const heatMat=material({color:0x773d2c,emissive:0xff6328,emissiveIntensity:.06,metalness:.28,roughness:.52});
 const breads=[];
 for(const x of [-.37,.37]){
  block(root,.42,.012,.78,slotMat,x,1.588,0);
  // Recessed glass-front heating chamber reveals glowing coils behind
  // a protective wire guard.
  block(root,.56,.82,.027,mats.dark,x,.99,.51);
  for(let i=0;i<6;i++){
   const xx=x-.21+i*.084;
   rod(root,[xx,.67,.545],[xx,1.33,.545],.021,heatMat);
  }
  for(let i=0;i<3;i++){
   const yy=.73+i*.24;
   rod(root,[x-.24,yy,.565],[x+.24,yy,.565],.008,mats.steel);
  }
  const crust=material({color:0xdba56c,roughness:.8});
  const crumb=material({color:0xf4d8a5,roughness:.88});
  const shape=new THREE.Shape();
  shape.moveTo(-.20,-.27);
  shape.lineTo(-.20,.13);
  shape.bezierCurveTo(-.24,.40,.20,.41,.20,.13);
  shape.lineTo(.20,-.27);shape.closePath();
  const slice=group(root,x,1.57,0);
  const outline=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.10,bevelEnabled:true,bevelThickness:.028,bevelSize:.025,bevelSegments:2,curveSegments:9}),crust);
  outline.scale.set(1.09,1.1,1.01);outline.castShadow=true;slice.add(outline);
  const center=new THREE.Mesh(new THREE.ShapeGeometry(shape,12),crumb);
  center.position.z=.137;slice.add(center);
  breads.push({slice,crumb,crust});
 }
 const lever=group(root,.87,1.1,.45);
 cylinder(lever,.085,.085,.31,mats.stainless,0,0,0).rotation.z=Math.PI/2;
 block(lever,.31,.14,.21,mats.dark,.17,0,0);
 const dial=cylinder(root,.18,.18,.11,mats.dark,.7,.64,.51);
 dial.rotation.x=Math.PI/2;
 badge(root,"TOAST  01–05",0,.91,.515,.92,.18,"#272f3a","#ffe6b6");
 const power=led(root,-.7,.47,.53,heatMat);
 return {shells:[body],update(s){
  const hot=truncate(s.hot,0,1);
  const lift=s.toasting?-.27:s.done?.12+(truncate(s.eject,0,1)*.28):s.bread?-.09:-.4;
  breads.forEach(({slice,crumb,crust})=>{
   slice.visible=!!s.bread;
   slice.position.y=1.59+lift;
   const shade=Math.pow(hot,.75);
   crumb.color.set(0xf4d8a5).lerp(new THREE.Color(0xb57a48),shade*.85);
   crust.color.set(0xdba56c).lerp(new THREE.Color(0x8f5234),shade*.75);
  });
  lever.position.y=s.toasting?.67:1.1;
  heatMat.emissiveIntensity=s.toasting?.38+hot*1.1:Math.max(.04,hot*.1);
  power.scale.setScalar(s.toasting?1.18:.7);
  dial.rotation.z=(truncate(s.level||2,1,5)-3)*-.23;
 }};
}
function makeFan(root){
 plate(root,2.5,2.2,.12);
 cylinder(root,.65,.75,.13,mats.dark,0,.25,0);
 cylinder(root,.13,.13,1.58,mats.steel,0,1.04,0);
 const pivot=group(root,0,1.95,0);
 const motor=cylinder(pivot,.36,.36,.55,mats.stainless,0,0,-.28);
 motor.rotation.x=Math.PI/2;
 const rotor=group(pivot,0,0,.24);
 cylinder(rotor,.14,.14,.17,mats.charcoal,0,0,.03).rotation.x=Math.PI/2;
 // All blades have their own pivot at the real shaft centre.
 // The face of each blade has a gentle twist for a pitched airflow profile.
 for(let i=0;i<5;i++){
  const spoke=group(rotor);
  spoke.rotation.z=i*Math.PI*2/5;
  const blade=group(spoke,0,.45,0);
  const shape=new THREE.Shape();
  shape.moveTo(-.10,-.38);
  shape.bezierCurveTo(-.28,-.12,-.36,.31,-.10,.53);
  shape.bezierCurveTo(.15,.71,.30,.41,.29,.17);
  shape.bezierCurveTo(.16,-.12,.13,-.35,-.10,-.38);
  const geo=new THREE.ExtrudeGeometry(shape,{
   depth:.075,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:2,curveSegments:12
  });
  const surface=new THREE.Mesh(geo,mats.turquoise);
  surface.rotation.y=.24;
  surface.castShadow=true;surface.receiveShadow=true;blade.add(surface);
 }
 const hub=cylinder(rotor,.17,.17,.16,mats.stainless,0,0,.12);
 hub.rotation.x=Math.PI/2;
 sphere(rotor,.085,mats.dark,0,0,.22);
 // Front and rear safety grilles stay fixed while the five pitched blades rotate.
 // Separate front/rear cages create real parallax in the orbitable 3D scene.
 for(const depth of [-.02,.49]){
  ring(pivot,1.02,.025,mats.steel,0,0,depth);
  ring(pivot,.72,.012,mats.steel,0,0,depth);
  ring(pivot,.37,.009,mats.steel,0,0,depth);
  for(let i=0;i<24;i++){
   const a=i*Math.PI/12;
   rod(pivot,[0,0,depth],[Math.cos(a)*1.02,Math.sin(a)*1.02,depth],.006,mats.steel);
  }
 }
 // Four longitudinal guards join both cages, preserving the visible depth.
 for(let i=0;i<4;i++){
  const a=(i+.5)*Math.PI/2;
  const x=Math.cos(a)*1.02,y=Math.sin(a)*1.02;
  rod(pivot,[x,y,-.02],[x,y,.49],.012,mats.stainless);
 }
 // Speed indicators and the actual tactile selector on the pedestal.
 const selector=cylinder(root,.12,.12,.08,mats.charcoal,.0,.36,.54);
 selector.rotation.x=Math.PI/2;
 const pointer=block(root,.022,.11,.014,mats.ivory,0,.39,.6);
 const speedLeds=[-.26,0,.26].map((x)=>sphere(root,.044,mats.dark,x,.19,.53));
 badge(root,"FAN  /  01–03",0,.24,.42,.52,.11);
 // State is supplied by the existing ColorFigures simulation.
 return {shells:[motor],update(s){
  const speed=truncate(s.speed,0,3);
  rotor.rotation.z=-(Number(s.turn)||0);
  pivot.rotation.y=s.oscillate?Math.sin(Number(s.angle)||0)*.32:0;
  speedLeds.forEach((led,i)=>{
   led.scale.setScalar(i<speed?1.28:.72);
   led.material=i<speed?glow:mats.dark;
  });
  pointer.rotation.z=(speed-1.5)*-.22;
 }};
}
function makeLock(root){
 plate(root,2.4,2,.12);
 const body=block(root,1.4,1.25,.52,mats.steel,0,.92,0);
 const shackle=group(root,0,1.47,0);
 hose(shackle,[[-.43,0,0],[-.43,.49,0],[-.28,.77,0],[0,.87,0],[.28,.77,0],[.43,.49,0],[.43,0,0]],.12,mats.stainless);
 const dial=cylinder(root,.32,.32,.14,mats.dark,0,.9,.34);dial.rotation.x=Math.PI/2;
 const face=cylinder(root,.25,.25,.155,mats.stainless,0,.9,.41);face.rotation.x=Math.PI/2;
 badge(root,"LOCK  ·  05",0,.48,.283,.79,.12);
 const key=group(root,0,.93,.66);
 const shaft=rod(key,[0,0,0],[0,0,.48],.04,brassy);
 ring(key,.135,.036,brassy,0,0,.55);
 for(let i=0;i<3;i++)block(key,.11,.06,.06,brassy,.06,.0,.2+i*.075);
 // semi-transparent cutaway reveals individual pin stacks.
 const cut=group(root,0,1.08,.46);
 const pins=[];
 for(let i=0;i<5;i++){
  const p=cylinder(cut,.046,.046,.25,mats.amber,-.46+i*.23,0,.0);pins.push(p);
 }
 return {shells:[body],update(s){
  key.visible=!!s.key;
  key.rotation.z=Number(s.angle||0)*Math.PI/180;
  shackle.position.y=s.locked?1.47:1.73;
  pins.forEach((p,i)=>p.position.y=s.aligned?.01:.05*Math.sin(i*2));
 }};
}
function makeBicycle(root){
 plate(root,3.1,2.4,.12);
 const wheel=group(root,.65,.81,-.38);
 ring(wheel,.72,.1,mats.rubber,0,0,0,0,0);
 ring(wheel,.57,.025,mats.stainless);
 for(let i=0;i<12;i++){
  const a=i*Math.PI/6;
  rod(wheel,[0,0,0],[Math.sin(a)*.57,Math.cos(a)*.57,0],.009,mats.steel);
 }
 cylinder(wheel,.1,.1,.08,mats.dark).rotation.x=Math.PI/2;
 const stem=cylinder(root,.13,.13,1.58,mats.stainless,-.65,1.04,.2);
 cylinder(root,.19,.22,.15,mats.dark,-.65,.31,.2);
 const handle=group(root,-.65,1.93,.2);
 rod(handle,[-.42,0,0],[.42,0,0],.085,mats.rubber);
 cylinder(handle,.065,.065,.15,mats.stainless,0,-.25,0);
 hose(root,[[-.54,.39,.2],[-.14,.22,.52],[.55,.38,.3],[.79,.56,-.2]],.032,mats.rubber);
 badge(root,"AIR  /  PISTON",-.65,.67,.36,.48,.12);
 const needle=gauge(root,-.48,.94,.44,.17);
 return {shells:[stem],update(s){
  handle.position.y=1.93-.36*truncate(s.piston,0,1);
  needle.rotation.z=(truncate(s.pressure,0,5)-2.5)*.37;
 }};
}
function makeCoffee(root){
 plate(root,2.8,2.2,.12);
 const body=block(root,1.2,1.95,.95,mats.stainless,-.44,1.27,-.12);
 block(root,1.6,.21,1.18,mats.dark,0,2.31,-.09);
 block(root,.96,.12,.81,mats.dark,.42,1.41,.35);
 // A translucent water reservoir with moving water level.
 // Place the water sight glass on the *outside* of the opaque chassis.
 // Otherwise the water disappears behind the body at typical camera angles.
 block(root,.41,1.17,.11,mats.dark,-.82,1.37,.435);
 block(root,.35,1.10,.12,frosted,-.82,1.37,.505);
 const waterColumn=block(root,.28,.90,.11,liquid,-.82,1.03,.582);
 badge(root,"H2O",-.82,1.96,.596,.2,.12);
 // Exposed filter funnel, removable brown grounds and pouring nozzle.
 const filter=cylinder(root,.36,.12,.39,mats.dark,.42,1.79,.19);
 const grounds=cylinder(root,.27,.25,.06,mats.coffee,.42,1.98,.19);
 cylinder(root,.10,.10,.14,mats.steel,.42,1.49,.26);
 const shower=group(root,.4,2.18,.19);
 const showerDrops=Array.from({length:3},(_,i)=>sphere(shower,.023,liquid,(i-1)*.08,0,0));
 // Transparent jug with its liquid level moving up during extraction.
 const jug=group(root,.49,.7,.47);
 cylinder(jug,.39,.32,.81,frosted,0,0,0);
 cylinder(jug,.34,.34,.05,mats.steel,0,.44,0);
 hose(jug,[[.32,.16,0],[.65,.19,0],[.66,-.28,0],[.34,-.28,0]],.055,mats.rubber);
 const coffee=cylinder(jug,.32,.32,.25,mats.coffee,0,-.23,0);
 const drip=group(root,.43,1.36,.43);
 const drops=Array.from({length:6},()=>sphere(drip,.027,liquid,0,0,0));
 const hotMat=material({color:0xf6a36a,emissive:0xff6a24,emissiveIntensity:.08});
 led(root,.06,1.59,.49,hotMat);
 const steam=group(root,.48,1.17,.48);
 const puffs=Array.from({length:6},(_,i)=>sphere(steam,.06+(i%3)*.012,steamMaterial,0,0,0));
 badge(root,"BREW  /  FILTER",-.47,1.99,.39,.9,.16,"#304456","#fdf5e5");
 return {shells:[body],update(s,dt,time){
  const volume=truncate(s.coffee,0,1),water=truncate(s.water,0,1);
  const coffeeHeight=.56*volume;
  coffee.scale.y=Math.max(.006,coffeeHeight/.25);
  coffee.position.y=-.38+coffeeHeight/2;
  const waterHeight=.80*water;
  waterColumn.scale.y=Math.max(.006,waterHeight/.90);
  waterColumn.position.y=.84+waterHeight/2;
  grounds.visible=!!s.grounds;
  const brewing=!!s.brewing;
  drops.forEach((p,i)=>{
   const k=(time*1.7+i/drops.length)%1;
   p.visible=brewing;
   p.position.y=-k*.48;
   p.scale.setScalar(.75+.32*Math.sin(k*Math.PI));
  });
  showerDrops.forEach((p,i)=>{
   const k=(time*1.4+i/showerDrops.length)%1;
   p.visible=brewing;
   p.position.y=-k*.17;
  });
  puffs.forEach((p,i)=>{
   const k=(time*.34+i/puffs.length)%1;
   p.position.set(Math.sin(time*.5+i)*.055,k*.38,Math.cos(i*2)*.055);
   p.scale.setScalar((brewing||volume>.1)?(.35+.65*k):.0001);
  });
  hotMat.emissiveIntensity=brewing?1.3:.08;
 }};
}
function makeFlashlight(root){
 plate(root,3.2,2.1,.12);
 const shell=group(root,0,.7,0);
 const shaft=cylinder(shell,.27,.29,1.94,mats.charcoal,0,0,0);
 shaft.rotation.z=Math.PI/2;
 const back=cylinder(shell,.32,.32,.24,mats.dark,-1,0,0);back.rotation.z=Math.PI/2;
 const hood=cylinder(shell,.46,.25,.49,mats.steel,1.1,0,0);hood.rotation.z=Math.PI/2;
 const lens=cylinder(shell,.35,.35,.07,frosted,1.34,0,0);lens.rotation.z=Math.PI/2;
 const bulb=sphere(shell,.13,glow,1.41,0,0);
 for(let i=0;i<9;i++){
  const tread=ring(shell,.27,.014,mats.rubber,-.68+i*.11,0,0,0,Math.PI/2);
 }
 const switcher=block(shell,.33,.1,.21,mats.turquoise,-.12,.31,0);
 badge(shell,"LED",.12,.38,.04,.31,.14,"#f1ddab","#243e50");
 const light=new THREE.SpotLight(0xffefb4,0,8,.32,.5,1);
 light.position.set(1.45,.77,0);light.target.position.set(3,.5,0);
 root.add(light,light.target);
 const beam=group(root,1.65,.74,0);
 const cone=new THREE.Mesh(new THREE.ConeGeometry(.87,2.9,40,1,true),new THREE.MeshBasicMaterial({color:0xffe6a5,transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide}));
 cone.rotation.z=-Math.PI/2;cone.position.x=1.42;beam.add(cone);
 return {shells:[shaft],update(s){
  const v=s.on?Math.max(.02,Number(s.glow)||.6):0;
  light.intensity=v*(s.brightness===2?11:5);
  beam.visible=v>.01;cone.material.opacity=v*(s.brightness===2?.15:.09);
  glow.emissiveIntensity=.35+v*1.7;
  switcher.position.y=s.on?.37:.31;
 }};
}
function makeWashing(root){
 plate(root,3,2.6,.12);
 const body=block(root,2.0,2.38,1.57,mats.enamel,0,1.36,0);
 block(root,2.0,.38,1.57,mats.stainless,0,2.31,.0);
 const door=group(root,0,1.35,.88);
 ring(door,.65,.11,mats.dark);
 ring(door,.49,.035,mats.stainless);
 const glass=sphere(door,.46,frosted,0,0,-.02);glass.scale.z=.18;
 const drum=group(door,0,0,-.12);
 ring(drum,.38,.035,mats.stainless);
 for(let i=0;i<10;i++) {
  const a=i*Math.PI/5;
  sphere(drum,.027,mats.dark,.31*Math.cos(a),.31*Math.sin(a),.06);
 }
 const water=block(root,1.18,.23,.06,liquid,0,1.02,.79);
 const dial=cylinder(root,.2,.2,.13,mats.dark,-.47,2.35,.81);dial.rotation.x=Math.PI/2;
 labelPanel(root,.65,.13,.45,2.35,.82);
 badge(root,"WASH  ·  ECO",.37,2.36,.838,.65,.12,"#29394b","#fff4db");
 for(let i=0;i<3;i++)led(root,.25+i*.2,2.36,.84,i===0?glow:mats.steel);
 const drawer=block(root,.46,.12,.32,mats.stainless,-.7,2.36,.7);
 return {shells:[body],update(s,dt,time){
  const active=!!s.run;
  drum.rotation.z=active?time*1.9:0;
  const waterLevel=active?.22:0;
  water.scale.y=Math.max(.02,waterLevel);
  door.rotation.y=Number(s.door||0)*-.65;
  drawer.position.z=.7+Math.max(0,Number(s.drawer)||0)*.18;
 }};
}
function makeVending(root){
 plate(root,3.1,2.6,.12);
 const body=block(root,2.22,2.75,1.35,mats.turquoise,0,1.56,0);
 const face=block(root,1.65,2.05,.025,mats.dark,-.25,1.75,.7);
 const vendingGlass=new THREE.MeshPhysicalMaterial({color:0xe5f8fa,roughness:.08,metalness:0,transparent:true,opacity:.16,depthWrite:false,side:THREE.DoubleSide});
 const glass=block(root,1.57,1.93,.026,vendingGlass,-.25,1.75,.73);
 badge(root,"SNACK  STATION",0,2.73,.68,1.44,.22,"#273b4d","#f5dcad");
 for(let shelf=0;shelf<3;shelf++){
  const y=1.13+shelf*.59;
  block(root,1.48,.08,1.0,mats.stainless,-.27,y,.06);
  for(let item=0;item<4;item++){
   const mat=[mats.amber,mats.warm,mats.leaf,mats.ivory][(shelf+item)%4];
   const x=-.85+item*.36;
   const can=cylinder(root,.13,.13,.28,mat,x,y+.19,.13);
   ring(root,.13,.008,mats.steel,x,y+.33,.13,Math.PI/2);
  }
 }
 block(root,.43,1.18,.08,mats.dark,.83,1.7,.73);
 for(let j=0;j<10;j++) {
  const x=.7+(j%3)*.12,y=2.05-Math.floor(j/3)*.13;
  sphere(root,.037,mats.stainless,x,y,.81);
 }
 block(root,.51,.25,.045,mats.charcoal,.76,.94,.75);
 block(root,1.4,.34,.08,mats.dark,-.19,.46,.71);
 badge(root,"01  02  03  04",-.28,2.37,.77,1.33,.12);
 const slot=group(root,0,.47,.81);
 const hatch=block(slot,1.1,.19,.06,mats.steel,-.26,.0,0);
 return {shells:[body],update(s,dt,time){
  const busy=!!s.drop||!!s.run;
  hatch.rotation.x=busy?-.4*Math.sin(time*7):0;
 }};
}
const builders={kettle:makeKettle,toaster:makeToaster,fan:makeFan,lock:makeLock,bicycle:makeBicycle,
  coffee:makeCoffee,flashlight:makeFlashlight,washing:makeWashing,vending:makeVending};

export function createObjectViewer(container,id){
  if(!container||!Object.hasOwn(builders,id))throw Error("Unknown 3D object: "+id);
  let renderer;
  try{
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:"low-power"});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.25));
    renderer.setSize(container.clientWidth||320,340);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.32;
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  }catch(e){renderer?.dispose();throw new Error("WebGL unavailable: "+e.message);}
  renderer.domElement.className="object-three-canvas";
  renderer.domElement.setAttribute("aria-label","Objet 3D manipulable au toucher");
  renderer.domElement.setAttribute("role","img");
  container.append(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xf2f0e9);
  const environment=studioEnvironment();
  scene.environment=environment;
  scene.fog=new THREE.FogExp2(0xf2f0e9,.027);
  const camera=new THREE.PerspectiveCamera(34,1,.1,90);
  camera.position.set(5,4.1,7.5);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.1;
  controls.minPolarAngle=.18;controls.maxPolarAngle=Math.PI*.57;
  controls.minDistance=4.4;controls.maxDistance=12;
  controls.target.set(0,1.05,0);controls.update();
  scene.add(new THREE.HemisphereLight(0xc9eaff,0x755d49,2.3));
  const sun=new THREE.DirectionalLight(0xfff1df,3.3);
  sun.position.set(-3,7,4);sun.castShadow=true;
  sun.shadow.mapSize.set(window.innerWidth<520?512:1024,window.innerWidth<520?512:1024);
  sun.shadow.camera.left=-7;sun.shadow.camera.right=7;sun.shadow.camera.top=7;sun.shadow.camera.bottom=-7;
  sun.shadow.normalBias=.025;
  sun.shadow.blurSamples=6;scene.add(sun);
  const fill=new THREE.DirectionalLight(0xc3e4ff,1.15);fill.position.set(3,3,-5);scene.add(fill);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.18}));
  floor.rotation.x=-Math.PI/2;floor.position.y=.03;floor.receiveShadow=true;scene.add(floor);
  const root=group(scene,0,0,0);
  const machine=builders[id](root);
  const annotations=getObjectParts(id);
  const markerLayer=document.createElement("div");
  markerLayer.className="three-parts";
  markerLayer.hidden=true;
  markerLayer.setAttribute("aria-label","Points d'intérêt du modèle 3D");
  const ns="http://www.w3.org/2000/svg";
  const leaders=document.createElementNS(ns,"svg");
  leaders.setAttribute("class","three-part-leaders");
  leaders.setAttribute("aria-hidden","true");
  markerLayer.append(leaders);
  const points=annotations.map((part,index)=>{
    const button=document.createElement("button");
    button.type="button";button.className="three-part-pin";
    button.textContent=String(index+1);
    button.title=part.label;
    button.setAttribute("aria-label","Examiner : "+part.label);
    button.setAttribute("aria-pressed","false");
    markerLayer.append(button);
    const leader=document.createElementNS(ns,"line");
    leader.setAttribute("class","three-part-leader");
    leaders.append(leader);
    return {part,button,leader,world:new THREE.Vector3(...part.position)};
  });
  const description=document.createElement("div");
  description.className="three-part-description";
  description.hidden=true;
  description.setAttribute("role","status");
  description.setAttribute("aria-live","polite");
  const label=document.createElement("strong"),text=document.createElement("p");
  const close=document.createElement("button");
  close.type="button";close.textContent="Fermer";
  close.setAttribute("aria-label","Fermer l'explication de la pièce");
  const tourBar=document.createElement("div");
  tourBar.className="three-tour-bar";
  tourBar.hidden=true;
  const progress=document.createElement("span");
  progress.className="three-tour-counter";
  progress.setAttribute("aria-live","polite");
  const previous=document.createElement("button");
  previous.type="button";previous.textContent="← Précédent";
  const next=document.createElement("button");
  next.type="button";next.textContent="Suivant →";
  const quit=document.createElement("button");
  quit.type="button";quit.textContent="Quitter la visite";
  quit.className="three-tour-quit";
  tourBar.append(progress,previous,next,quit);
  description.append(label,text,tourBar,close);
  markerLayer.append(description);
  container.append(markerLayer);
  let showParts=false,cameraMove=null,tourStep=-1,tourFinished=null;
  const projected=new THREE.Vector3();
  const cameraTarget=new THREE.Vector3();
  function updatePartPositions(){
    if(!showParts)return;
    const width=renderer.domElement.clientWidth,height=renderer.domElement.clientHeight;
    if(width===0||height===0)return;
    leaders.setAttribute("viewBox","0 0 "+width+" "+height);
    const occupied=[];
    const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
    for(const point of points){
      projected.copy(point.world).project(camera);
      const visible=projected.z>=-1&&projected.z<=1
        &&Math.abs(projected.x)<1.12&&Math.abs(projected.y)<1.12;
      point.button.hidden=!visible;
      point.leader.style.display=visible?"":"none";
      if(!visible)continue;
      const anchorX=clamp((projected.x*.5+.5)*width,18,width-18);
      const anchorY=clamp((-projected.y*.5+.5)*height,18,height-18);
      // Spread close markers around the exact 3D anchor. Never let a marker
      // overlap another button on a narrow Android screen.
      const offsets=[[0,0],[53,-36],[-53,-36],[53,36],[-53,36],[0,-56],[0,56],[64,0],[-64,0],[67,-50],[-67,50]];
      let placed=null,bestScore=-Infinity;
      for(const [dx,dy] of offsets){
        const x=clamp(anchorX+dx,23,width-23),y=clamp(anchorY+dy,23,height-23);
        const nearest=occupied.length?Math.min(...occupied.map(p=>Math.hypot(x-p.x,y-p.y))):Infinity;
        const score=Math.min(nearest,65)-Math.hypot(dx,dy)*.12;
        if(nearest>=46 && score>bestScore){placed={x,y};bestScore=score;}
      }
      if(!placed){
        // Fallback is deterministic even if the camera is nearly edge-on.
        placed={x:anchorX,y:anchorY};
      }
      occupied.push(placed);
      point.button.style.left=placed.x.toFixed(1)+"px";
      point.button.style.top=placed.y.toFixed(1)+"px";
      point.leader.setAttribute("x1",anchorX.toFixed(1));
      point.leader.setAttribute("y1",anchorY.toFixed(1));
      point.leader.setAttribute("x2",placed.x.toFixed(1));
      point.leader.setAttribute("y2",placed.y.toFixed(1));
      point.leader.style.opacity=Math.hypot(placed.x-anchorX,placed.y-anchorY)<9?"0":"1";
    }
  }
  function focusPart(index){
    if(disposed||!showParts)return;
    const selected=points[index];
    if(!selected)return;
    for(const point of points)point.button.setAttribute("aria-pressed",String(point===selected));
    label.textContent=selected.part.label;
    text.textContent=selected.part.detail;
    description.hidden=false;
    if(tourStep>=0){
      tourStep=index;
      progress.textContent="Étape "+(index+1)+" / "+points.length;
      previous.disabled=index===0;
      next.textContent=index===points.length-1?"Terminer la visite":"Suivant →";
      close.hidden=true;
      tourBar.hidden=false;
    }
    const startTarget=controls.target.clone(),startCamera=camera.position.clone();
    const delta=camera.position.clone().sub(controls.target).multiplyScalar(.82);
    const finishTarget=selected.world.clone();
    const finishCamera=finishTarget.clone().add(delta);
    if(prefersReduce){
      camera.position.copy(finishCamera);
      controls.target.copy(finishTarget);
      controls.update();
      cameraMove=null;
    }else{
      cameraMove={start:performance.now(),startTarget,startCamera,finishTarget,finishCamera};
    }
    dirty=true;
  }
  function endTour(completed=false){
    if(tourStep<0)return;
    const done=tourFinished;
    description.classList.remove("tour-active");
    markerLayer.append(description);
    tourStep=-1;tourFinished=null;
    tourBar.hidden=true;close.hidden=false;
    description.hidden=true;
    for(const point of points)point.button.setAttribute("aria-pressed","false");
    cameraMove=null;
    if(completed&&typeof done==="function")done();
  }
  function tourNext(){
    if(tourStep<0)return;
    if(tourStep===points.length-1)endTour(true);
    else focusPart(tourStep+1);
  }
  points.forEach((point,i)=>point.button.addEventListener("click",()=>focusPart(i)));
  previous.addEventListener("click",()=>{if(tourStep>0)focusPart(tourStep-1);});
  next.addEventListener("click",tourNext);
  quit.addEventListener("click",()=>endTour(false));
  function dismissDescription(){
    if(tourStep>=0){endTour(false);return;}
    const selected=points.find(p=>p.button.getAttribute("aria-pressed")==="true");
    description.hidden=true;
    for(const point of points)point.button.setAttribute("aria-pressed","false");
    selected?.button.focus();
  }
  close.addEventListener("click",dismissDescription);
  description.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&!description.hidden){
      event.preventDefault();
      dismissDescription();
    }
  });
  const technical=(machine.shells||[]).map(mesh=>{
    const normal=mesh.material;
    const cut=normal.clone();
    cut.transparent=true;cut.opacity=.18;cut.depthWrite=false;
    cut.side=THREE.DoubleSide;cut.roughness=.35;
    return {mesh,normal,cut};
  });
  let xray=false;
  const clock=new THREE.Clock();
  let state={},active=true,disposed=false,frame=0,dirty=true,last=0;
  controls.addEventListener("change",()=>{dirty=true;});
  const prefersReduce=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  function resize(){
    if(disposed)return;
    const width=Math.max(200,container.clientWidth||320);
    const height=Math.round(Math.max(265,Math.min(460,width*.82)));
    renderer.setSize(width,height,true);
    camera.aspect=width/height;camera.updateProjectionMatrix();dirty=true;
    updatePartPositions();
  }
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  const visibleObserver=new IntersectionObserver(entries=>{
    active=entries[0]?.isIntersecting??true;
    if(active)dirty=true;
  },{threshold:0.01});visibleObserver.observe(container);
  const onVisibility=()=>{active=!document.hidden;dirty=true;};
  document.addEventListener("visibilitychange",onVisibility);
  renderer.domElement.addEventListener("webglcontextlost",event=>{
    event.preventDefault();
    if(disposed)return; // intentional forceContextLoss() during cleanup
    active=false;
    container.dispatchEvent(new CustomEvent("object-3d-error"));
  });
  function tick(timestamp){
    if(disposed)return;
    frame=requestAnimationFrame(tick);
    if(!active||!renderer.domElement.isConnected)return;
    const running=Boolean(machine.needsAnimation?.()||state.run||state.speed||state.heating||state.brewing||state.toasting||state.pumping||state.oscillate||(Number(state.steam)>0));
    if(cameraMove){
      const elapsed=Math.min(1,(timestamp-cameraMove.start)/440);
      const eased=1-(1-elapsed)**3;
      camera.position.lerpVectors(cameraMove.startCamera,cameraMove.finishCamera,eased);
      controls.target.lerpVectors(cameraMove.startTarget,cameraMove.finishTarget,eased);
      if(elapsed>=1)cameraMove=null;
      dirty=true;
    }
    if(!running&&!dirty)return; // static model: let the GPU sleep
    const period=running?33:66; // active ~30 fps, changing/camera ~15 fps
    if(timestamp-last<period&&!dirty)return;
    last=timestamp;
    const dt=Math.min(.05,clock.getDelta()),time=timestamp/1000;
    machine.update(state,dt,time);
    controls.update();
    renderer.render(scene,camera);
    updatePartPositions();
    dirty=false;
  }
  frame=requestAnimationFrame(tick);
  return {
    setState(next){if(disposed)return;state={...next};dirty=true;},
    setXray(value){
      if(disposed)return false;
      xray=Boolean(value);
      for(const {mesh,normal,cut} of technical)mesh.material=xray?cut:normal;
      dirty=true;
      return xray;
    },
    startTour(onFinish){
      if(disposed||points.length===0)return false;
      showParts=true;
      markerLayer.hidden=false;
      tourStep=0;
      tourFinished=onFinish;
      // Guided lessons use the normal document flow, keeping the 3D object
      // fully visible. Manual inspection still has its contextual overlay.
      description.classList.add("tour-active");
      container.append(description);
      focusPart(0);
      dirty=true;
      return true;
    },
    focusPartById(partId){
      const index=points.findIndex(point=>point.part.id===partId);
      if(index<0||disposed)return false;
      showParts=true;markerLayer.hidden=false;
      focusPart(index);dirty=true;
      return true;
    },
    setAnnotations(visible){
      if(disposed)return false;
      if(!visible)endTour(false);
      showParts=Boolean(visible);
      markerLayer.hidden=!showParts;
      if(!showParts){description.hidden=true;cameraMove=null;}
      else updatePartPositions();
      dirty=true;
      return showParts;
    },
    resetCamera(){
      if(tourStep>=0)endTour(false);
      cameraMove=null;
      camera.position.set(5,4.1,7.5);controls.target.set(0,1.05,0);controls.update();dirty=true;
      description.hidden=true;
      for(const point of points)point.button.setAttribute("aria-pressed","false");
    },
    dispose(){
      if(disposed)return;
      endTour(false);
      disposed=true;cancelAnimationFrame(frame);
      observer.disconnect();visibleObserver.disconnect();document.removeEventListener("visibilitychange",onVisibility);
      controls.dispose();
      const shared=new Set([...Object.values(mats),glow,steamMaterial,frosted,liquid,alertMat,brassy,blue,white,tint,edgeMaterial]);
      const unique=new Set();
      scene.traverse(o=>{
        if(o.geometry)o.geometry.dispose();
        if(o.material)for(const mat of (Array.isArray(o.material)?o.material:[o.material])){
          if(!shared.has(mat))unique.add(mat);
        }
      });
      // Restore original shell materials and include materials that were
      // swapped out for the transient technical-view cutaway.
      for(const {mesh,normal,cut} of technical){
        mesh.material=normal;
        unique.add(cut);
      }
      for(const mat of unique){mat.map?.dispose();mat.dispose();}
      markerLayer.remove();
      // Shared material instances live for the module lifetime; disposing them
      // here would affect the next object opened from the same module.
      environment.dispose();
      renderer.dispose();
      renderer.forceContextLoss(); // explicitly release scarce mobile WebGL contexts
      renderer.domElement.remove();
    }
  };
}
