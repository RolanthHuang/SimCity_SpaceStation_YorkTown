import * as T from '../YorktownPreview/three.module.js';
import {builder,v,label} from './orbital-assets/geometry.mjs';
import {batchStaticArchitecture} from './static-batch.mjs';
import {DOCK_FRAME,DOCK_FLOORS,DOCK_START,DOCK_ROUTE,dockEdges,dockWorld,dockCamera,moveDock,dockAirborne,beginDockJump,stepDockAir} from './dock-walking.mjs';
import {GRAND_PORTS} from './grand-orbit.mjs';
import {xy,deckOf} from './catalog.mjs';
import {surface,nearestWalkable} from './habitat.mjs';
const $=id=>document.getElementById(id);
export function centralDock(m,{labels=true}={}){
 const root=new T.Group(),b=builder(m,root);root.name='Central platform cantilever dock';
 for(const f of DOCK_FLOORS){const w=f.x1-f.x0,d=f.z1-f.z0,x=(f.x0+f.x1)/2,z=(f.z0+f.z1)/2;b.box(x,-.13,z,w,.26,d,'plate');b.box(x,-.004,z,w-.12,.024,d-.12,'ivory');}
 // One underslung backbone carries the docking collar and the promenade.
 b.box(18,-1.6,0,31,1.3,2.4,'hullShade');b.box(18,-.8,0,31,.26,3.4,'plate');
 for(let x=4;x<33;x+=3){b.beam(v(x,-2.1,-1),v(x+3,-.9,-1),.09,'steel');b.beam(v(x,-2.1,1),v(x+3,-.9,1),.09,'steel');b.beam(v(x,-1.15,0),v(x,-.18,-7),.10,'steel');b.box(x,-.34,-7,1.1,.27,4,'hullShade');}
 b.cylinder(17,1.2,0,1.7,3.1,1.7,'steel');b.cylinder(17,2.85,0,3.4,.22,3.4,'plate');b.mesh(new T.TorusGeometry(1.5,.055,8,48),'cyan',v(17,3,0),new T.Euler(Math.PI/2,0,0));
 for(let x=5;x<35;x+=.9){b.box(x,.019,-7,.015,.012,3.5,'silver');b.box(x,.023,-8.82,.40,.025,.035,'cyan');}
 for(const [a,c]of dockEdges()){b.beam(v(a[0],.22,a[1]),v(c[0],.22,c[1]),.014,'steel');const n=Math.ceil(Math.hypot(c[0]-a[0],c[1]-a[1])/.55);for(let j=0;j<=n;j++)b.cylinder(a[0]+(c[0]-a[0])*j/n,.11,a[1]+(c[1]-a[1])*j/n,.024,.22,.024,'steel');}
 b.box(8,.01,-6.6,1.3,.03,1.3,'hullShade');b.box(8,.43,-6.0,1.4,.07,.20,'plate');for(const x of [7.36,8.64])b.box(x,.22,-6,.045,.44,.06,'steel');
 for(const x of [27,33]){b.box(x,.06,-11.5,.9,.12,.27,'steel');b.box(x,.13,-11.5,.9,.035,.27,'ivory');b.cylinder(x,.15,-3.65,.45,.3,.45,'silver');b.sphere(x,.34,-3.65,.46,.24,.46,'leaf');}
 b.finish();
 if(labels){const sign=label('HORIZON / DOCK 01','CENTRAL PROMENADE · LIFT RETURN',1.2,.30);sign.position.set(8,.30,-5.98);sign.rotation.y=Math.PI;root.add(sign);}
 batchStaticArchitecture(root);root.position.set(...DOCK_FRAME.position);root.rotation.y=DOCK_FRAME.yaw;return root;
}
export class DockWalk{
 constructor(view){this.kind='dock';this.type='dock';this.view=view;this.scene=view.scene;this.avatarScale=.165;this.position={...DOCK_START};this.air={height:0,velocity:0};this.clock=0;this.guide=null;
  $('structure-hud').hidden=false;$('room-guide').hidden=false;$('room-jump').hidden=false;$('room-jump').textContent='跳躍 · Space';$('room-jump').onclick=()=>this.jump();$('room-guide').onclick=()=>{this.guide=this.guide?null:{index:0};this.ui();view.cameraUpdate();};$('room-recover').onclick=()=>{Object.assign(this.position,DOCK_START);Object.assign(this.air,{height:0,velocity:0});this.guide=null;this.ui();view.cameraUpdate();};$('room-exit').onclick=()=>view.setMode('walk');this.ui();}
 update(){this.ui();}
 pending(){return dockAirborne(this.air);}
 jump(){if(!beginDockJump(this.air))return false;this.guide=null;this.ui();this.view.cameraUpdate();return true;}
 status(){return '中央漂浮台 · 旗艦觀景泊位'+(this.pending()?' · 跳躍中':'');}
 step(dt,k){const p=this.position;if((k.KeyW||k.KeyS||k.KeyA||k.KeyD)&&this.guide){this.guide=null;this.ui();}let dx=0,dz=0,speed=(k.ShiftLeft||k.ShiftRight)?.85:.48;
  if(this.guide){let t=DOCK_ROUTE[this.guide.index];if(Math.hypot(t.x-p.x,t.z-p.z)<.10)t=DOCK_ROUTE[++this.guide.index];if(!t){this.guide=null;p.yaw=Math.PI;p.pitch=.42;this.ui();}else{const d=Math.hypot(t.x-p.x,t.z-p.z);speed=Math.min(.95,d/Math.max(dt,.001));dx=(t.x-p.x)/d;dz=(t.z-p.z)/d;p.yaw=Math.atan2(dx,-dz);}}
  else{const f=(k.KeyW?1:0)-(k.KeyS?1:0),s=(k.KeyD?1:0)-(k.KeyA?1:0),n=Math.max(1,Math.hypot(f,s));dx=(Math.sin(p.yaw)*f+Math.cos(p.yaw)*s)/n;dz=(-Math.cos(p.yaw)*f+Math.sin(p.yaw)*s)/n;}
  moveDock(p,dx*speed*dt,dz*speed*dt);const landed=stepDockAir(this.air,dt);p.y=this.air.height;this.clock+=dt;if(landed||this.clock-(this.lastHUD||0)>.2){this.lastHUD=this.clock;this.ui();}}
 interact(){return Math.hypot(this.position.x-8,this.position.z+6.6)<1.1?{exit:true}:{text:'WASD 沿觀景甲板移動，Space 跳躍，方向鍵轉頭，V 切換人稱；入口升降接駁或「返回街道」可離開。'};}
 placeAvatar(rig,heading){rig.root.position.set(...dockWorld(this.position));rig.root.quaternion.setFromAxisAngle(v(0,1,0),DOCK_FRAME.yaw-heading);}
 camera(camera,third){const p=dockCamera(this.position,third);camera.up.set(0,1,0);camera.position.set(...p.eye);camera.lookAt(v(...p.aim));this.view.explorer?.rig.cameraClearance(camera.position.distanceTo(v(...dockWorld({...this.position,y:this.position.y+.245})))/this.avatarScale,true);return true;}
 ui(){$('structure-floor').textContent=this.status();$('structure-objective').textContent=this.view.state.orbital.grand.flagship.remaining?'旗艦停泊 · 有厚度的船殼、能源光圈與開放機庫':'旗艦已離港 · 泊位保留供下一次造訪';$('structure-progress').textContent='WASD 步行 · Space 跳躍 · 方向鍵轉頭 · V 人稱 · 護欄防墜';$('room-guide').textContent=this.guide?'停止導覽':'沿甲板走向觀景端';$('room-jump').disabled=this.pending();const b=$('room-interact');b.hidden=this.pending()||Math.hypot(this.position.x-8,this.position.z+6.6)>=1.1;b.textContent='E · 搭升降接駁返回街道';b.onclick=()=>this.view.explorer.interact();}
 dispose(){$('structure-hud').hidden=true;$('structure-puzzle').hidden=true;/* The shared city scene and its buffers remain owned by CityView. */}
}
export function dockStreet(view){const [x,y]=xy(GRAND_PORTS[0]),p=nearestWalkable(view.state.cells,x-27.5,y-26.5);return p?{kind:'dock',...p,deck:deckOf(GRAND_PORTS[0]),radius:1.2,priority:3,label:'E · 升降接駁至中央旗艦泊位'}:null;}
export function dockConnector(m,street){const root=new T.Group(),b=builder(m,root),a=v(...surface(street.u,street.v,.01)),end=v(...dockWorld({x:8,y:0,z:-6.6})),mid=a.clone().lerp(end,.5).add(v(0,5,0));
 b.cylinder(a.x,a.y+.16,a.z,.65,.32,.65,'plate');b.cylinder(a.x,a.y+.35,a.z,.55,.08,.55,'cyan');b.tube([a.clone().add(v(0,.35,0)),mid,end],.045,'steel',false,36);b.tube([a.clone().add(v(0,.37,0)),mid.clone().add(v(.06,0,0)),end.clone().add(v(.06,0,0))],.014,'cyan',false,36);b.finish();batchStaticArchitecture(root);return root;}
