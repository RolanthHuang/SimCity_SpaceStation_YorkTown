import * as T from '../YorktownPreview/three.module.js';
import {flagship} from './orbital-assets/flagship.mjs';
import {relay} from './orbital-assets/relay.mjs';
import {propulsionMaterials} from './orbital-assets/materials.mjs';
import {batchStaticArchitecture} from './static-batch.mjs';
import {builder,v} from './orbital-assets/geometry.mjs';
import {closedLoft,NACELLE_STATIONS,ENGINEERING_STATIONS} from './orbital-assets/ship-structure.mjs';
import {centralDock,DockWalk,dockStreet,dockConnector} from './central-dock.mjs';
import {DOCK_FRAME,dockWorld} from './dock-walking.mjs';
export const ORBIT_PLACEMENT={flagship:{position:dockWorld({x:24,y:8,z:0}),scale:.26,yaw:Math.PI/2+DOCK_FRAME.yaw},relay:{position:[24,32,-66],scale:.21,yaw:-.12}};
export function lowFlagship(m){
 const root=new T.Group(),b=builder(m,root);
 const saucer=b.mesh(new T.LatheGeometry([[0,-2],[20,-2],[33,-.4],[33,.4],[24,1.5],[8,4],[0,4]].map(p=>new T.Vector2(...p)),48),'plate',v(0,0,25));saucer.scale.z=1.16;
 b.mesh(closedLoft(ENGINEERING_STATIONS,16),'hullShade');
 for(const side of [-1,1]){b.mesh(closedLoft(NACELLE_STATIONS,16),'plate',v(side*31,13,-35));b.beam(v(side*7,-3,-34),v(side*31,13,-35),1,'steel');b.sphere(side*31,13,5,6,5,.6,'collectorCore');}
 b.finish();return root;
}
export function lowRelay(m){
 const root=new T.Group(),b=builder(m,root);b.mesh(new T.TorusGeometry(78,4,6,48),'plate');b.mesh(new T.TorusGeometry(63,2.5,6,48),'silver');
 for(let j=0;j<12;j++){const a=j*Math.PI/6;b.box(Math.cos(a)*71,Math.sin(a)*71,0,6.8,10.8,15,'steel',new T.Euler(0,0,a-Math.PI/2));}
 b.box(0,-94,-1,79,8,21,'plate');b.finish();return root;
}
export class GrandOrbitScene{
 constructor(view){this.view=view;this.root=new T.Group();this.root.name='Paid deep-space projects';view.dawn.root.add(this.root);this.models={};this.motion=null;this.visits=null;this.activations=null;}
 materials(){if(!this.assets)this.assets=propulsionMaterials(this.view.renderer,this.view.atelier.assets.m);return this.assets.m;}
 place(root,key){const p=ORBIT_PLACEMENT[key];root.position.set(...p.position);root.rotation.set(0,p.yaw,0);root.scale.setScalar(p.scale);this.root.add(root);}
 ensureLow(key){
  if(this.models[key])return this.models[key];const m=this.materials(),low=key==='flagship'?lowFlagship(m):lowRelay(m);batchStaticArchitecture(low);this.place(low,key);return this.models[key]={low,full:null};
 }
 ensureFull(key){
  const model=this.ensureLow(key);if(model.full)return model;
  const m=this.materials(),asset=key==='flagship'?flagship(m):relay(m);
  if(key==='flagship')asset.door.userData.dynamic=true;else{asset.field.userData.dynamic=true;asset.shuttle.userData.dynamic=true;}
  batchStaticArchitecture(asset.root);this.place(asset.root,key);model.full=asset.root;model.asset=asset;this.view.renderer.shadowMap.needsUpdate=true;
  // The source's unused preview LOD shares materials, but its private buffers
  // are released here. The live game uses the cheaper closed-hull model above.
  asset.lod?.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(o.isInstancedMesh)o.dispose();}});
  return model;
 }
 update(s,a,report){
  const g=s.orbital.grand;this.grand=g;this.report=report.grand;
  if(this.visits!==null&&g.flagship.visits!==this.visits&&g.flagship.remaining>0)this.motion={kind:'flagship',time:0,duration:16};
  if(this.activations!==null&&g.relay.activations!==this.activations&&g.relay.remaining>0)this.motion={kind:'relay',time:0,duration:13};
  this.visits=g.flagship.visits;this.activations=g.relay.activations;
  if(g.flagship.visits>0){
   if(!this.dock){this.dock=centralDock(this.materials());this.root.add(this.dock);}
   this.dock.visible=true;this.view.dawn.citadel.visible=true;
   const street=dockStreet(this.view),signature=street?`${street.u}:${street.v}`:'';
   if(signature!==this.streetSignature){if(this.connector){this.root.remove(this.connector);this.connector.traverse(o=>{if(o.isMesh)o.geometry.dispose();});this.connector=null;}
    if(street){this.connector=dockConnector(this.materials(),street);this.root.add(this.connector);}this.streetSignature=signature;}if(this.connector)this.connector.visible=true;
  }else{if(this.dock)this.dock.visible=false;if(this.connector)this.connector.visible=false;}
  if(this.motion&&(this.motion.kind==='flagship'&&!g.flagship.remaining||this.motion.kind==='relay'&&!g.relay.remaining))this.motion=null;
  for(const [key,on]of [['flagship',g.flagship.remaining>0],['relay',g.relay.built]]){
   if(on)this.ensureLow(key);const model=this.models[key];if(model){model.visible=on;model.low.visible=on;if(model.full)model.full.visible=false;}
  }
  this.animate(0);
 }
 pending(){return !!this.motion;}
 board(){
  const view=this.view;if(!this.grand?.flagship.visits)return false;
  const street=dockStreet(view);if(!street){view.cb.notice?.('船塢周邊沒有安全的步行接駁入口，請先恢復道路。');return false;}
  if(view.mode==='interior')view.setMode('walk');
  view.room?.dispose();Object.assign(view.walker,street,{jump:0,velocity:0});view.returnWalk={...view.walker};view.deck=0;view.room=new DockWalk(view);view.interiorTile=-1;
  view.isolate=false;view.station.visible=true;view.dawn.root.visible=true;view.setMode('interior');this.focused='flagship';view.explorer.state.heading=view.room.position.yaw;view.cb.notice?.('升降接駁抵達中央泊位。WASD 步行、方向鍵轉頭、V 切換人稱。');return true;
 }
 focus(key,part='whole'){
  const model=this.models[key];if(!model?.visible)return false;this.ensureFull(key);
  const ship=key==='flagship',target=ship?(part==='engine'?v(31,13,5):part==='bay'?v(0,-8,-63.5):v(0,0,4)):(part==='coil'?v(61,-29,11):v());
  model.full.updateMatrixWorld(true);const point=model.full.localToWorld(target);
  const camera=this.view;camera.setMode('overview');this.focused=key;camera.isolate=false;camera.station.visible=true;camera.dawn.root.visible=true;camera.target.copy(point);camera.distance=ship?(part==='engine'?6.5:part==='bay'?4.7:Math.max(30,34/(.89*camera.camera.aspect*.80))):(part==='coil'?9.4:64);camera.pitch=part==='bay'?.05:.20;camera.yaw=ship?(part==='bay'?Math.PI+ORBIT_PLACEMENT.flagship.yaw+.07:part==='whole'?ORBIT_PLACEMENT.flagship.yaw+.5:ORBIT_PLACEMENT.flagship.yaw+.52):.52;camera.sampleAim=0;camera.cameraUpdate();return true;
 }
 animate(dt){
  if(!this.grand)return;let motion=this.motion;if(motion){motion.time+=dt;this.shadowClock=(this.shadowClock||0)+dt;if(this.shadowClock>.5){this.shadowClock=0;this.view.renderer.shadowMap.needsUpdate=true;}if(motion.time>=motion.duration){this.motion=null;motion=null;}}
  for(const [key,model]of Object.entries(this.models)){
   if(!model.visible){model.low.visible=false;if(model.full)model.full.visible=false;continue;}
   const p=ORBIT_PLACEMENT[key],distance=this.view.camera.position.distanceTo(v(...p.position)),near=distance<(key==='flagship'?38:50),full=near||this.focused===key&&distance<110||motion?.kind===key;
   if(full)this.ensureFull(key);model.low.visible=!full;if(model.full)model.full.visible=full;
   const position=v(...p.position);
   if(key==='flagship'&&motion?.kind===key){const t=Math.min(1,motion.time/11),f=t*t*(3-2*t);position.add(v(-80,8,-30).multiplyScalar(1-f));}
   model.low.position.copy(position);if(model.full)model.full.position.copy(position);
   if(key==='flagship'&&model.asset){const open=motion?.kind===key?Math.min(1,Math.max(0,(motion.time-10)/3)):1;model.asset.door.visible=open<.99;model.asset.door.position.y=.3+open*5.5;}
   if(key==='relay'&&model.asset){const a=model.asset,active=this.report.online.relay,t=motion?.kind==='relay'?motion.time:0;a.field.visible=active;this.assets.m.field.uniforms.intensity.value=active?(motion?.kind==='relay'?Math.sin(Math.PI*t/13):.8):0;this.assets.m.field.uniforms.time.value=t;a.shuttle.visible=active&&motion?.kind==='relay'&&t>4&&t<11;if(a.shuttle.visible){a.shuttle.position.set(0,-8,170-(t-4)*48);a.shuttle.rotation.y=Math.PI;}}
  }
 }
}
