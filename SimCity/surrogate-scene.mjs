import * as THREE from '../YorktownPreview/three.module.js';
import {PROFILES,routePosition} from './surrogate.mjs';
import {surface} from './habitat.mjs';
import {deltaX} from './catalog.mjs';
import {deckQuaternion} from './dawn-scene.mjs';
import {movePhysicalBody} from './body-collision.mjs';

// Static details are merged by material, while limbs and wheels remain articulated.
class ModelKit{
 constructor(){
  this.resources=[];this.buckets=new Map();this.groups=[];
  this.geometries={box:new THREE.BoxGeometry(1,1,1),sphere:new THREE.SphereGeometry(.5,12,8),capsule:new THREE.CapsuleGeometry(.5,1,4,10),cylinder:new THREE.CylinderGeometry(.5,.5,1,12)};
  this.resources.push(...Object.values(this.geometries));this.m={};
  const materials={ivory:[0xe1e1d6,.58,.28],titanium:[0x809397,.48,.6],dark:[0x263f48,.72,.2],gold:[0xb2a47b,.4,.65],skin:[0xc5a082,.9,0],glass:[0x466874,.22,.58],rubber:[0x273035,.92,0],blue:[0x5ca3bb,.46,.35]};
  for(const [key,[color,roughness,metalness]]of Object.entries(materials)){this.m[key]=new THREE.MeshStandardMaterial({color,roughness,metalness});this.resources.push(this.m[key]);}
  this.m.light=new THREE.MeshStandardMaterial({color:0xcbf7f4,emissive:0x4a8a95,emissiveIntensity:.8,roughness:.4});this.resources.push(this.m.light);
 }
 color(value){const m=new THREE.MeshStandardMaterial({color:value,roughness:.69,metalness:.22});this.resources.push(m);return m;}
 part(parent,shape,material,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){
  const object=new THREE.Object3D();object.position.set(x,y,z);object.rotation.set(rx,ry,rz);object.scale.set(sx,sy,sz);object.updateMatrix();
  const source=this.geometries[shape],g=(source.index?source.toNonIndexed():source.clone()).applyMatrix4(object.matrix);
  let byMaterial=this.buckets.get(parent);if(!byMaterial){byMaterial=new Map();this.buckets.set(parent,byMaterial);}const m=typeof material==='string'?this.m[material]:material;
  if(!byMaterial.has(m))byMaterial.set(m,[]);byMaterial.get(m).push(g);return object;
 }
 group(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
 finish(){for(const [parent,materials]of this.buckets)for(const [material,geos]of materials){
  const size=geos.reduce((n,g)=>n+g.attributes.position.count,0),g=new THREE.BufferGeometry();
  for(const attr of ['position','normal']){const values=new Float32Array(size*3);let offset=0;for(const source of geos){values.set(source.attributes[attr].array,offset);offset+=source.attributes[attr].array.length;}g.setAttribute(attr,new THREE.BufferAttribute(values,3));}
  const mesh=new THREE.Mesh(g,material);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);g.computeBoundingSphere();this.resources.push(g);geos.forEach(g=>g.dispose());
 }this.buckets.clear();}
 dispose(){this.resources.forEach(r=>r.dispose());}
}

export class SurrogateRig{
 constructor(profile='architect'){
  this.profile=profile;const p=PROFILES[profile],k=this.kit=new ModelKit(),coat=k.color(p.color),root=this.root=new THREE.Group();this.pose=k.group(root);this.root.visible=false;
  const body=k.group(this.pose,0,1.08,0),head=k.group(body,0,.54,0);this.body=body;this.head=head;
  k.part(body,'capsule','dark',0,.03,0,.27,.30,.21);k.part(body,'box',coat,0,.14,0,.42,.39,.25);k.part(body,'box','ivory',0,.26,-.131,.32,.16,.017);
  k.part(body,'box','gold',0,.02,-.139,.27,.034,.018);k.part(body,'box','dark',0,-.21,0,.36,.095,.25);k.part(body,'box','titanium',.13,-.21,-.145,.068,.067,.035);
  k.part(head,'sphere','skin',0,.055,0,.26,.32,.24);k.part(head,'sphere','dark',0,.15,.012,.275,.16,.245);k.part(head,'box','skin',0,.02,-.116,.045,.06,.026);
  k.part(head,'box','glass',0,.087,-.122,.226,.048,.021);k.part(head,'box','gold',.124,.068,0,.023,.06,.04);
  k.part(body,'cylinder','dark',0,.365,0,.115,.12,.115);
  this.arms=[];this.legs=[];
  for(const side of [-1,1]){
   const arm=k.group(body,side*.28,.28,0),forearm=k.group(arm,0,-.28,0);this.arms.push({upper:arm,lower:forearm,side});
   k.part(arm,'capsule',coat,0,-.13,0,.17,.18,.16);k.part(arm,'box','ivory',side*.065,-.015,0,.046,.1,.15);
   k.part(forearm,'capsule','dark',0,-.12,0,.115,.15,.12);k.part(forearm,'box','titanium',0,-.15,-.047,.13,.14,.06);k.part(forearm,'sphere','skin',0,-.27,0,.102,.13,.10);
   const leg=k.group(this.pose,side*.11,.87,0),shin=k.group(leg,0,-.36,0);this.legs.push({upper:leg,lower:shin,side});
   k.part(leg,'capsule','dark',0,-.18,0,.17,.21,.185);k.part(leg,'box',coat,side*.07,-.08,-.023,.048,.23,.14);
   k.part(shin,'capsule','dark',0,-.18,0,.123,.20,.13);k.part(shin,'box','titanium',0,-.014,-.071,.126,.10,.046);k.part(shin,'box','rubber',0,-.35,-.035,.148,.10,.24);k.part(shin,'box','ivory',0,-.327,-.124,.147,.047,.047);
  }
  if(profile==='courier'){k.part(body,'box','ivory',0,.2,.172,.3,.43,.16);k.part(body,'box',coat,0,.3,.257,.18,.16,.015);k.part(body,'cylinder','gold',-.22,.31,.13,.1,.16,.1,Math.PI/2);}
  if(profile==='pilot'){
   k.part(body,'box','titanium',0,.19,.2,.32,.43,.19);k.part(body,'box','ivory',0,.3,.305,.30,.19,.022);
   this.thrusters=[];for(const side of [-1,1]){k.part(body,'cylinder','dark',side*.235,.11,.18,.14,.34,.14);k.part(body,'cylinder','gold',side*.235,-.06,.18,.155,.07,.155);
    const mesh=new THREE.Mesh(new THREE.ConeGeometry(.055,.34,10),new THREE.MeshBasicMaterial({color:0x8ad7ed,transparent:true,opacity:.65,depthWrite:false}));mesh.position.set(side*.235,-.24,.18);mesh.rotation.z=Math.PI;body.add(mesh);mesh.visible=false;this.thrusters.push(mesh);k.resources.push(mesh.geometry,mesh.material);
   }
  }
  k.finish();this.root.scale.setScalar(.165);
 }
 animate(e,w){
  const t=e.phase,m=Math.min(1,e.moving/1.1),riding=!!e.mounted,scooter=e.mounted?.kind==='scooter',air=w.jump>.025,flight=this.profile==='pilot'&&air;
  this.pose.position.y=(riding?0:-.11)+(air?0:Math.sin(t*2)*.022*m);this.body.rotation.x=riding?.08:flight?.10:-.025*m;
  for(const leg of this.legs){leg.upper.rotation.x=scooter?-.05:riding?-1.1:air?.4:Math.sin(t+leg.side*Math.PI/2)*.62*m;leg.lower.rotation.x=scooter?.15:riding?1.18:air?.55:Math.max(0,-Math.sin(t+leg.side*Math.PI/2))*.7*m;}
  for(const arm of this.arms){arm.upper.rotation.x=riding?-1.05:flight?-.23:-Math.sin(t+arm.side*Math.PI/2)*.5*m;arm.upper.rotation.z=flight?arm.side*.3:arm.side*-.07;arm.lower.rotation.x=riding?-.35:-.22;}
  for(const flame of this.thrusters||[])flame.visible=flight&&e.energy>0;
 }
 place(u,v,h,heading){this.root.position.set(...surface(u,v,h));this.root.quaternion.copy(deckQuaternion(u,v)).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-heading));}
 cameraClearance(distance,interior){
  const opacity=Math.max(0,Math.min(1,(distance-(interior?.5:.10))/(interior?.55:.20)));
  for(const material of this.kit.resources.filter(r=>r.isMaterial&&r.type!=='MeshBasicMaterial')){
   const transparent=opacity<.999;if(material.transparent!==transparent){material.transparent=transparent;material.depthWrite=!transparent;material.needsUpdate=true;}material.opacity=opacity;
  }
 }
 dispose(){this.root.removeFromParent();this.kit.dispose();}
}

export class VehicleRig{
 constructor(vehicle){
  this.kind=vehicle.kind;this.tier=vehicle.tier;const k=this.kit=new ModelKit(),root=this.root=new THREE.Group();this.body=k.group(root);this.wheels=[];this.legs=[];
  const p=(shape,m,x,y,z,sx,sy,sz,...r)=>k.part(this.body,shape,m,x,y,z,sx,sy,sz,...r);
  if(this.kind==='scooter'){
   p('box','titanium',0,.36,0,.52,.12,1.65);p('box','dark',0,.425,.1,.4,.03,1.2);p('box','ivory',0,.42,-.72,.49,.16,.46);
   p('cylinder','titanium',0,.93,-.66,.09,1.1,.09,-.14);p('box','dark',0,1.45,-.77,.86,.064,.075);p('box','ivory',0,1.29,-.73,.31,.26,.13);p('box','light',0,1.28,-.808,.2,.063,.016);
   for(const z of [-.67,.69]){const wheel=k.group(root,0,.26,z);this.wheels.push(wheel);k.part(wheel,'cylinder','rubber',0,0,0,.48,.19,.48,0,0,Math.PI/2);k.part(wheel,'cylinder','gold',0,0,0,.31,.205,.31,0,0,Math.PI/2);}
   if(this.tier>=2){p('box','blue',0,.33,0,.55,.025,1.42);p('box','titanium',0,.65,.69,.45,.45,.21);}
   if(this.tier>=3){p('box','light',0,.44,-.62,.51,.035,.41);p('box','ivory',0,.38,.78,.62,.19,.27);}
   root.scale.setScalar(.19);
  }else{
   p('box','dark',0,1.03,0,.88,.34,1.43);p('box','ivory',0,1.22,0,1.04,.21,1.44);p('box','titanium',0,.94,-.79,.79,.38,.51);p('box','glass',0,1.05,-1.055,.56,.17,.04);p('box','gold',0,.82,-1.058,.49,.065,.065);
   p('box','dark',0,1.355,.10,.52,.045,.57);for(const side of [-1,1]){p('sphere','light',side*.28,.96,-1.081,.105,.085,.045);p('cylinder','gold',side*.56,1.12,.48,.28,.10,.28,0,0,Math.PI/2);}
   for(const side of [-1,1])for(const end of [-1,1]){const leg=k.group(root,side*.53,1.03,end*.55),lower=k.group(leg,0,-.47,.12);this.legs.push({upper:leg,lower,phase:(side===end?0:Math.PI)});
    k.part(leg,'box','titanium',side*.043,-.23,.09,.19,.54,.20,.25);k.part(leg,'cylinder','gold',0,0,0,.3,.12,.3,0,0,Math.PI/2);k.part(lower,'box','dark',0,-.25,-.06,.13,.48,.15,-.26);k.part(lower,'box','ivory',0,-.18,-.14,.18,.29,.066);k.part(lower,'box','rubber',0,-.47,-.04,.27,.09,.32);
   }
   if(this.tier>=2)for(const side of [-1,1]){p('box','ivory',side*.36,1.53,.45,.24,.34,.57);p('box','gold',side*.36,1.715,.45,.23,.037,.46);}
   if(this.tier>=3){for(const side of [-1,1])p('box','blue',side*.66,1.20,.38,.30,.35,.54);p('box','light',0,1.50,-.58,.58,.04,.08);}
   root.scale.setScalar(.25);
  }
  k.finish();this.root.userData.vehicle=vehicle.id;
 }
 animate(progress,moving){for(const wheel of this.wheels)wheel.rotation.x=progress*16;for(const leg of this.legs){leg.upper.rotation.x=Math.sin(progress*13+leg.phase)*.46*(moving?1:0);leg.lower.rotation.x=.18+Math.max(0,-Math.sin(progress*13+leg.phase))*.44*(moving?1:0);}this.body.position.y=this.kind==='hound'&&moving?Math.sin(progress*26)*.016:0;}
 place(v){this.root.position.set(...surface(v.u,v.v,.065));this.root.quaternion.copy(deckQuaternion(v.u,v.v)).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-v.heading));}
 dispose(){this.root.removeFromParent();this.kit.dispose();}
}

export class StreetVehicles{
 constructor(scene){this.root=new THREE.Group();scene.add(this.root);this.rigs=new Map();this.fleet=[];}
 update(fleet){this.fleet=fleet;const ids=new Set(fleet.map(v=>v.id));for(const [id,r]of this.rigs)if(!ids.has(id)){r.dispose();this.rigs.delete(id);}
  for(const v of fleet){let rig=this.rigs.get(v.id);if(rig&&rig.tier!==v.tier){rig.dispose();this.rigs.delete(v.id);rig=null;}if(!rig){rig=new VehicleRig(v);this.root.add(rig.root);this.rigs.set(v.id,rig);}rig.place(v);}
 }
 animate(dt,cells,walker,explorer,mode,isolate,deck){
  for(const v of this.fleet){const mounted=explorer.mounted?.id===v.id,near=mode==='walk'&&Math.hypot(deltaX(walker.u,v.u),walker.v-v.v)<.95;
   let moving=mounted?explorer.moving>.01:false;
   if(!mounted&&v.path&&!near&&dt>0){const next=routePosition(v.path,v.progress+dt*.45,.10),before={u:v.u,v:v.v};
    movePhysicalBody(cells,v,deltaX(v.u,next.u),next.v-v.v,this.fleet);
    moving=Math.hypot(deltaX(before.u,v.u),v.v-before.v)>.00001;
    if(Math.hypot(deltaX(v.u,next.u),v.v-next.v)<.06){v.progress+=dt*.45;v.heading=next.heading;}
   }
   const r=this.rigs.get(v.id);r.root.visible=!(isolate&&mode==='build'&&v.deck!==deck);r.place(v);r.animate(v.progress,moving);
  }
 }
}
