import {buildingDoors} from './continuum.mjs';
import * as THREE from '../YorktownPreview/three.module.js';
import {createExplorer,currentProfile,chooseProfile,beginAbility,moveExplorer,createFleet,proximity,safeDismount,VEHICLES} from './surrogate.mjs';
import {SurrogateRig,StreetVehicles} from './surrogate-scene.mjs';
import {xy,idx,wrapX,deltaX,deckOf,INTERIORS,SIZE} from './catalog.mjs';
import {surface,frame,tileAt,canWalk} from './habitat.mjs';
import {deckQuaternion} from './dawn-scene.mjs';
import {wrapAngle} from './camera-controls.mjs';
import {canPortal,GATES} from './orbital.mjs';
import {bodyClear,resolveBodyContacts} from './body-collision.mjs';
import {constrainDeckCamera,constrainRoomCamera,groundOrbitPitch} from './camera-ground.mjs';
import {dockStreet} from './central-dock.mjs';

const PREF='yorktown-surrogate-preferences-v1';
export class ExplorerController{
 constructor(view){
  this.view=view;let pref={};try{pref=JSON.parse(localStorage.getItem(PREF))||{};}catch{}
  this.state=createExplorer(pref);this.rig=new SurrogateRig(this.state.profile);view.scene.add(this.rig.root);this.vehicles=new StreetVehicles(view.scene);this.index=new Map();
  this.cameraRay=new THREE.Raycaster();this.proxy=new THREE.Mesh();this.collisionMaterial=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});this.proxy.material=this.collisionMaterial;this.instanceMatrix=new THREE.Matrix4();this.previousMode='';this.target=null;this.lastHUD=0;
 }
 persist(){try{localStorage.setItem(PREF,JSON.stringify({profile:this.state.profile,thirdPerson:this.state.thirdPerson}));}catch{}}
 togglePerspective(){this.state.thirdPerson=!this.state.thirdPerson;this.previousMode='';this.persist();this.view.cameraUpdate();this.hud(true);}
 selectProfile(id){if(!chooseProfile(this.state,id,this.view.walker))return;this.rig.dispose();this.rig=new SurrogateRig(id);this.view.scene.add(this.rig.root);this.persist();this.previousMode='';this.view.cameraUpdate();this.hud(true);}
 beginAbility(){return beginAbility(this.state,this.view.walker);}
 preferredStart(u,v,deck){
  const candidate=this.vehicles.fleet.filter(f=>f.parked&&f.deck===deck).sort((a,b)=>Math.hypot(deltaX(u,a.u),v-a.v)-Math.hypot(deltaX(u,b.u),v-b.v))[0];
  if(!candidate||Math.hypot(deltaX(u,candidate.u),v-candidate.v)>5)return null;
  for(const [du,dv]of [[-.46,0],[.46,0],[0,.46],[0,-.46]])if(canWalk(this.view.state.cells,candidate.u+du,candidate.v+dv)&&bodyClear({u:candidate.u+du,v:candidate.v+dv},this.vehicles.fleet))return {u:candidate.u+du,v:candidate.v+dv,yaw:candidate.heading,pitch:-.08};
  return null;
 }
 updateFleet(routes){
  const v=this.view,e=this.state,old=new Map(this.vehicles.fleet.map(v=>[v.id,v])),fleet=createFleet(v.state,v.analysis,routes);
  for(const next of fleet){const previous=old.get(next.id);if(previous&&canWalk(v.state.cells,previous.u,previous.v,VEHICLES[next.kind].radius)){Object.assign(next,{u:previous.u,v:previous.v,heading:previous.heading,progress:previous.progress,deck:previous.deck});if(!previous.path)next.path=null;next.parked=!next.path;}}
  if(e.mounted){const replacement=fleet.find(f=>f.id===e.mounted.id);if(replacement){e.mounted=replacement;Object.assign(replacement,{u:v.walker.u,v:v.walker.v,parked:true,path:null});}else{e.mounted=null;v.cb.notice?.('交通工具的停靠點已改建，已回到安全街道。');}}
  resolveBodyContacts(v.state.cells,fleet);this.vehicles.update(fleet);
 }
 rebuildCameraIndex(){this.index.clear();for(const mesh of this.view.buildings.children){if(mesh.material===this.view.cityMaterials.contact)continue;mesh.userData.tiles?.forEach((i,n)=>{if(!this.index.has(i))this.index.set(i,[]);this.index.get(i).push({mesh,n});});}}
 modeChanged(old,mode){
  if(old==='walk'&&mode!=='walk'&&this.state.mounted)this.dismount(true);
  this.previousMode='';this.target=null;this.state.moving=0;
  if(mode==='walk')this.state.heading=this.view.walker.yaw;
  this.hud(true);
 }
 walk(dt){moveExplorer(this.view.state.cells,this.view.walker,this.state,this.view.keys,dt,this.vehicles.fleet);if(this.view.tryPortal()&&this.state.mounted)this.state.mounted.deck=this.view.deck;}
 animate(dt,streetDt){
  const v=this.view,e=this.state,w=v.walker;
  this.vehicles.animate(streetDt,v.state?.cells||[],w,e,v.mode,v.isolate,v.deck);
  this.rig.root.visible=e.thirdPerson&&['walk','interior'].includes(v.mode);
  if(v.mode==='walk'){
   const mount=e.mounted,h=.065+w.jump+(mount?(mount.kind==='hound'?.19:.065):0);this.rig.root.scale.setScalar(.165);this.rig.place(w.u,w.v,h,e.heading);this.rig.animate(e,w);
  }else if(v.mode==='interior'&&v.room){
   if(this.rig.root.parent!==v.room.scene)v.room.scene.add(this.rig.root);
   const p=v.room.position;this.rig.root.scale.setScalar(v.room.avatarScale||1);if(v.room.placeAvatar)v.room.placeAvatar(this.rig,e.heading);else{this.rig.root.position.set(p.x,p.y+.01,p.z);this.rig.root.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0),-e.heading);}this.rig.animate(e,{jump:0});
  }
  if(v.mode!=='interior'&&this.rig.root.parent!==v.scene)v.scene.add(this.rig.root);
  this.hud();
 }
 camera(){
  const v=this.view,e=this.state,interior=v.mode==='interior';if(interior&&v.room?.camera)return v.room.camera(v.camera,e.thirdPerson);if(!e.thirdPerson||!['walk','interior'].includes(v.mode))return false;
  const w=interior?v.room.position:v.walker,f=interior?{up:[0,1,0],tangent:[1,0,0],side:[0,0,1]}:frame(w.u,w.v),up=new THREE.Vector3(...f.up);
  const forward=new THREE.Vector3(...f.tangent).multiplyScalar(Math.sin(w.yaw)).addScaledVector(new THREE.Vector3(...f.side),-Math.cos(w.yaw)),h=interior?1.16:.22+v.walker.jump+(e.mounted?(e.mounted.kind==='hound'?.19:.065):0);
  const focus=interior?new THREE.Vector3(w.x,w.y+h,w.z):new THREE.Vector3(...surface(w.u,w.v,h));
  const distance=interior?Math.min(2.3,e.distance*1.8):e.distance,offset=interior?.40:.21,orbitPitch=groundOrbitPitch(w.pitch,distance,h,offset,interior?.32:.20),desired=focus.clone().addScaledVector(forward,-distance*Math.cos(orbitPitch)).addScaledVector(up,offset-Math.sin(orbitPitch)*distance);
  const keepAboveGround=point=>new THREE.Vector3(...(interior?constrainRoomCamera(focus.toArray(),point.toArray(),w.y):constrainDeckCamera(focus.toArray(),point.toArray(),v.deck)));
  const safe=keepAboveGround(this.avoidCamera(focus,desired,interior));
  if(this.previousMode===v.mode)v.camera.position.lerp(safe,.23);else v.camera.position.copy(safe);
  // Recheck after interpolation: the previous frame may lie beneath the new
  // local floor while walking a curve or ascending a staircase.
  v.camera.position.copy(keepAboveGround(this.avoidCamera(focus,v.camera.position,interior)));this.rig.cameraClearance(v.camera.position.distanceTo(focus),interior);v.camera.up.copy(up);v.camera.lookAt(focus);this.previousMode=v.mode;return true;
 }
 avoidCamera(focus,desired,interior){
  const v=this.view,vector=desired.clone().sub(focus),distance=vector.length();if(distance<.001)return desired;this.cameraRay.set(focus,vector.normalize());this.cameraRay.far=distance;
  let stop=distance;v.scene.updateMatrixWorld(true);
  if(interior){v.room.scene.updateMatrixWorld(true);for(const hit of this.cameraRay.intersectObjects(v.room.scene.children.filter(o=>o.isMesh),false))stop=Math.min(stop,hit.distance-(interior?.15:.055));}
  else{
   const i=tileAt(v.walker.u,v.walker.v),[x,y]=xy(i),range=Math.ceil(this.state.distance+1),anchors=new Set();
   for(let dv=-range;dv<=range;dv++)for(let du=-range;du<=range;du++){const j=idx(wrapX(x+du),y+dv);if(deckOf(j)!==deckOf(i))continue;anchors.add(j);const c=v.state?.cells[j];if(c?.plot!==null&&c?.plot!==undefined)anchors.add(c.plot);}
   for(const anchor of anchors)for(const {mesh,n}of this.index.get(anchor)||[]){mesh.getMatrixAt(n,this.instanceMatrix);this.proxy.geometry=mesh.geometry;this.proxy.matrixWorld.multiplyMatrices(mesh.matrixWorld,this.instanceMatrix);for(const hit of this.cameraRay.intersectObject(this.proxy,false))stop=Math.min(stop,hit.distance-.055);}
   for(const hit of this.cameraRay.intersectObjects([...v.atelier.pickables,...v.continuum.pickables].filter(o=>o.visible),false))stop=Math.min(stop,hit.distance-.055);
  }
  return focus.clone().addScaledVector(vector,Math.max(interior?.28:.12,stop));
 }
 nearby(){
  const v=this.view,w=v.walker,e=this.state;if(v.mode==='interior')return {kind:'room',label:'E · 探索／返回街道'};if(v.mode!=='walk')return null;
  if(e.mounted)return {kind:'dismount',label:`E · 下車 · ${VEHICLES[e.mounted.kind].name}`,disabled:!safeDismount(v.state.cells,w,e.mounted,this.vehicles.fleet)};
  const targets=[];
  if(v.state.orbital.grand?.flagship.visits){const dock=dockStreet(v);if(dock)targets.push(dock);}
  for(const vehicle of this.vehicles.fleet)targets.push({kind:'ride',vehicle,u:vehicle.u,v:vehicle.v,deck:vehicle.deck,radius:.63,priority:2,label:`E · 搭乘 ${VEHICLES[vehicle.kind].name} · 第 ${vehicle.tier} 階`});
  v.people.forEach((person,id)=>{if(person.u===undefined)return;targets.push({kind:'talk',person:{id,tile:tileAt(person.u,person.v)},u:person.u,v:person.v,deck:deckOf(tileAt(person.u,person.v)),radius:.52,label:'E · 對話 · 城市居民'});});
  for(const i of v.valid){const c=v.state.cells[i];if(!INTERIORS[c.type]||!c.level||c.fire||c.subplot||c.plot!==null&&c.plot!==i)continue;for(const door of buildingDoors(v.state,i))targets.push({kind:'enter',tile:i,...door,deck:deckOf(i),radius:1.0,priority:1,label:'E · 進入 · '+INTERIORS[c.type]});}
  if(canPortal(v.state,v.analysis))for(const i of GATES){const [x,y]=xy(i);targets.push({kind:'portal',u:x-27.5,v:y-27.5,deck:deckOf(i),radius:1.4,priority:1,label:'E · 穿越 · 晨曦之門'});}
  return proximity(w,targets);
 }
 interact(){
  const v=this.view;if(v.mode==='interior'){const r=v.room.interact();if(r.exit)v.setMode('walk');else if(r.text)v.cb.notice?.(r.text);return;}
  const target=this.nearby();if(!target){v.cb.notice?.('走近行人、交通工具、居住塔入口或啟用的傳送門，再按 E。');return;}
  if(target.kind==='dismount'){this.dismount();return;}
  if(target.kind==='ride'){
   const vehicle=target.vehicle;if(!canWalk(v.state.cells,vehicle.u,vehicle.v,VEHICLES[vehicle.kind].radius)){v.cb.notice?.('停靠處被建築阻擋，請換一個停靠點。');return;}
   vehicle.path=null;vehicle.parked=true;this.state.mounted=vehicle;Object.assign(v.walker,{u:vehicle.u,v:vehicle.v,jump:0,velocity:0});this.state.heading=vehicle.heading;
   v.cb.notice?.(`已搭乘${VEHICLES[vehicle.kind].name}。WASD 移動，方向鍵轉動鏡頭，E 下車。`);this.hud(true);return;
  }
  if(target.kind==='talk')v.cb.talk?.(target.person);
  if(target.kind==='enter')v.enterInterior(target.tile);
  if(target.kind==='dock')v.grandOrbit.board();
  if(target.kind==='portal')v.tryPortal(true);
 }
 dismount(force=false){
  const v=this.view,e=this.state,vehicle=e.mounted;if(!vehicle)return true;const safe=safeDismount(v.state.cells,v.walker,vehicle,this.vehicles.fleet);
  if(!safe&&!force){v.cb.notice?.('此處沒有安全下車位置，請往空曠道路移動一小段。');return false;}
  if(safe)Object.assign(v.walker,safe,{jump:0,velocity:0});e.mounted=null;e.moving=0;this.hud(true);return true;
 }
 hud(force=false){
  const v=this.view,e=this.state,now=performance.now();if(!force&&now-this.lastHUD<120)return;this.lastHUD=now;
  const active=['walk','interior'].includes(v.mode),bar=document.getElementById('surrogate-bar');if(bar)bar.hidden=!active;
  const p=currentProfile(e),button=document.getElementById('perspective-toggle');if(button){button.textContent=e.thirdPerson?'第三人稱':'第一人稱';button.setAttribute('aria-pressed',String(e.thirdPerson));}
  const char=document.getElementById('surrogate-character');if(char)char.textContent=`${p.name} · ${p.role}`;
  const status=document.getElementById('surrogate-status');if(status){status.textContent=e.mounted?`${VEHICLES[e.mounted.kind].name} · 第 ${e.mounted.tier} 階`:v.mode==='interior'?(v.room.kind==='dock'?'泊位步行':'室內步行'):p.id==='pilot'?`飛行電量 ${Math.round(e.energy*100)}%${e.cooldown>0?' · 降落中':e.flightExhausted?' · 鬆開空白再飛':''}`:p.ability;status.dataset.ability=p.id;}
  const ability=document.querySelector('[data-walk-key="Space"]');if(ability){ability.disabled=v.mode==='walk'&&(p.id==='architect'||!!e.mounted);ability.setAttribute('aria-label',p.id==='pilot'?'按住短程飛行':'強化跳躍');}
  const target=active?this.nearby():null;this.target=target;const interact=document.getElementById('interaction-button');if(interact){interact.hidden=!active||!target||v.mode==='interior'&&!!v.room?.ui;interact.disabled=!!target?.disabled;interact.textContent=target?.label||'';}
 }
}
