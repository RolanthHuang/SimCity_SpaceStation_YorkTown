import * as T from '../YorktownPreview/three.module.js';
import {makeInteriorScene} from './structure/interior-scene.mjs';
import {makeInteriorPlan,STOREY,FLOOR_NAMES,INTERIOR_TARGETS,currentTarget,interactQuest} from './structure/interior-plan.mjs';
import {createExplorer,stepExplorer,guideRoute,JUMP_ASSIST_SECONDS,JUMP_ASSIST_SPEED} from './structure/explorer.mjs';
import {makeBuilder,v,tree} from './structure/geometry.mjs';
import {placard} from './structure/materials.mjs';
import {questFor,buildingDoors} from './continuum.mjs';
import {nearestWalkable} from './habitat.mjs';
import {lineFloorPatches,moveLineWalker} from './line-walking.mjs';

const $=id=>document.getElementById(id);
function roomScene(view){const scene=new T.Scene();scene.background=new T.Color(0xa7bdc1);scene.environment=view.scene.environment;scene.add(new T.HemisphereLight(0xc9e2ed,0x9b9d81,1.5));const sun=new T.DirectionalLight(0xffddb2,2.4);sun.position.set(-75,150,95);scene.add(sun);return scene;}
function disposeRoot(root,m){const geos=new Set(),mats=new Set(),shared=new Set(Object.values(m));root.traverse(o=>{if(o.isMesh){geos.add(o.geometry);if(o.isInstancedMesh)o.dispose();if(!shared.has(o.material))mats.add(o.material);}});geos.forEach(g=>g.dispose());mats.forEach(m=>{m.map?.dispose();m.dispose();});}
export class SailInterior{
 constructor(view,i){this.view=view;this.type='sail';this.i=i;this.m=view.continuum.m;this.scene=roomScene(view);this.plan=makeInteriorPlan();this.position=createExplorer();this.quest=questFor(view.state,i);this.inside=makeInteriorScene(this.m,this.plan);this.scene.add(this.inside.root);this.guide=null;this.clock=0;this.jumpRequested=false;this.jumpAssist=0;this.guided=0;this.online=true;
  const hud=$('structure-hud');hud.hidden=false;$('room-jump').hidden=false;$('room-jump').textContent='跳躍';$('room-guide').hidden=false;$('room-guide').onclick=()=>this.toggleGuide();$('room-jump').onclick=()=>this.jump(true);$('room-recover').onclick=()=>{Object.assign(this.position,this.position.checkpoint,{vy:0,grounded:true});this.guide=null;this.ui();};$('room-exit').onclick=()=>view.setMode('walk');this.ui();}
 update(c,a,i){this.online=c.enabled!==false&&a.operational[i]>.5;this.ui();}
 status(){return `${Math.max(1,Math.min(6,Math.round(this.position.y/STOREY)+1))}F · 星帆巡航塔` ;}
 jump(assist=false){if(!this.position.grounded)return;this.jumpRequested=true;this.guide=null;if(assist)this.jumpAssist=JUMP_ASSIST_SECONDS;}
 target(){const p=this.position;for(const t of Object.values(INTERIOR_TARGETS))if(Math.abs(p.y-t.floor*STOREY)<.65&&Math.hypot(p.x-t.x,p.z-t.z)<2.25)return t;if(p.y<.35&&Math.hypot(p.x,p.z-11)<2.1)return {id:'exit',name:'返回城市街道'};return null;}
 toggleGuide(){if(this.guide){this.guide=null;this.ui();return;}this.guide=guideRoute(this.plan,this.position,currentTarget(this.quest),this.quest);this.guided=0;this.stuck=0;if(!this.guide)this.view.cb.notice?.('請回到樓層平台再啟動導覽。');this.ui();}
 step(dt,k){
  this.clock+=dt;const p=this.position,manual=k.KeyW||k.KeyS||k.KeyA||k.KeyD;if(manual)this.guide=null;let x=0,z=0,speed=k.ShiftLeft||k.ShiftRight?6.5:3.8;
  if(this.guide){let w=this.guide[this.guided];while(w&&Math.hypot(w.x-p.x,w.z-p.z)<.15&&Math.abs(w.y-p.y)<.60){this.guided++;w=this.guide[this.guided];}if(!w){this.guide=null;const t=currentTarget(this.quest);p.yaw=t.id==='treasure'?-Math.PI/2:t.id==='archive'?0:Math.PI;this.view.cb.notice?.(t.id==='treasure'?'前方 1.8 公尺斷橋需親自跳躍，按「跳躍」或 W＋Space。':`已到 ${t.name}，按 E 探索。`);}else{const d=Math.hypot(w.x-p.x,w.z-p.z);x=d?(w.x-p.x)/d:0;z=d?(w.z-p.z)/d:0;speed=Math.min(5.8,d/Math.max(dt,.001));p.yaw=Math.atan2(x,-z);}}
  else{const f=(k.KeyW?1:0)-(k.KeyS?1:0),side=(k.KeyD?1:0)-(k.KeyA?1:0),n=Math.max(1,Math.hypot(f,side));x=(Math.sin(p.yaw)*f+Math.cos(p.yaw)*side)/n;z=(-Math.cos(p.yaw)*f+Math.sin(p.yaw)*side)/n;if(this.jumpAssist>0){x=Math.sin(p.yaw);z=-Math.cos(p.yaw);speed=JUMP_ASSIST_SPEED;this.jumpAssist=Math.max(0,this.jumpAssist-dt);}}
  const previous={x:p.x,z:p.z},next=stepExplorer(this.plan,p,{x,z,speed,jump:this.jumpRequested},dt,this.quest);this.jumpRequested=false;Object.assign(p,next);const moved=Math.hypot(p.x-previous.x,p.z-previous.z);if(this.guide&&moved<.002){this.stuck=(this.stuck||0)+dt;if(this.stuck>2){this.guide=null;this.view.cb.notice?.('導覽停在障礙前；可手動繞行或回到安全點。');}}else this.stuck=0;if(next.recovered){this.guide=null;this.view.cb.notice?.('已回到最近的安全平台，秘庫進度保留。');}if(this.clock-(this.hudTime||0)>.15){this.hudTime=this.clock;this.ui();}
 }
 interact(){const t=this.target();if(!t)return {text:'靠近檔案、配流閥、星環或秘庫，畫面會顯示互動提示。'};if(t.id==='exit')return {exit:true};if(!this.online)return {text:'建築供應不足，彩蛋設備暫停。請先恢復水電與維生。'};this.showPuzzle(t.id);return {text:''};}
 mutate(id,value){this.quest=interactQuest(this.quest,id,value);this.view.state.continuum.quests[this.i]=this.quest;this.view.cb.save?.();this.ui();}
 showPuzzle(id){this.guide=null;this.view.keys={};const q=this.quest;this.dialogId=id;const panel=$('structure-puzzle');panel.hidden=false;
  if(id==='archive'){this.mutate('archive');$('structure-puzzle-title').textContent='航跡檔案 · 2F';$('structure-puzzle-body').innerHTML='<p>配流順序：<b>冷卻 → 儲能 → 推進</b>。</p><p>星圖刻度：<b>青 2、金 4、紫 1</b>。</p><p>3F 熱能工坊 → 5F 星圖迴廊 → 6F 棱光秘庫。</p>';}
  if(id==='power'){$('structure-puzzle-title').textContent='熱能配流 · 3F';$('structure-puzzle-body').innerHTML=q.power?'<p>中庭連橋已恢復供電。</p>':!q.archive?'<p>先到二樓讀取檔案。</p>':`<p>依照檔案順序連接三個閥門。錯誤會安全重設。</p><div class="room-choices"><button data-room-valve="cool">冷卻</button><button data-room-valve="store">儲能</button><button data-room-valve="drive">推進</button></div><p>已接通 ${q.route.length} / 3 · ${q.message}</p>`;panel.querySelectorAll('[data-room-valve]').forEach(b=>b.onclick=()=>{this.mutate('valve',b.dataset.roomValve);this.showPuzzle(id);});}
  if(id==='stars'){$('structure-puzzle-title').textContent='星圖校準 · 5F';$('structure-puzzle-body').innerHTML=q.stars?'<p>六樓秘庫已解鎖。</p>':!q.power?'<p>先完成熱能配流。</p>':`<div class="room-choices">${['青','金','紫'].map((name,i)=>`<button data-room-ring="${i}">${name}環 ${q.rings[i]}</button>`).join('')}</div><p>檔案提示：青 2、金 4、紫 1。</p><button id="room-align" class="primary">確認航線</button>`;panel.querySelectorAll('[data-room-ring]').forEach(b=>b.onclick=()=>{this.mutate('ring',+b.dataset.roomRing);this.showPuzzle(id);});$('room-align')?.addEventListener('click',()=>{this.mutate('align');this.showPuzzle(id);});}
  if(id==='treasure'){this.mutate('treasure');$('structure-puzzle-title').textContent=this.quest.complete?'晨光航行者':'棱光秘庫';$('structure-puzzle-body').innerHTML=this.quest.complete?'<p>六層秘庫探索完成！你的紀念章和關卡進度已記入這座城市的存檔。</p>':'<p>請先校準星圖。</p>';}
  $('room-close-puzzle').onclick=()=>{panel.hidden=true;this.view.keys={};};this.ui();}
 ui(){const p=this.position,f=Math.max(0,Math.min(5,Math.round(p.y/STOREY))),q=this.quest,t=this.target();$('structure-floor').textContent=`${f+1}F · ${FLOOR_NAMES[f]}`;$('structure-objective').textContent=q.complete?'晨光航行者 · 已完成':`${currentTarget(q).name} · ${q.message}`;$('room-guide').textContent=this.guide?'停止導覽':'跟隨導覽';$('structure-progress').textContent=`${q.archive?'●':'○'} 航跡　${q.power?'●':'○'} 配流　${q.stars?'●':'○'} 星圖　${q.complete?'●':'○'} 秘庫`;const interact=$('room-interact');interact.hidden=!t;interact.textContent=t?`E · ${t.name}`:'';interact.onclick=()=>this.view.explorer.interact();for(const [id,mesh]of Object.entries(this.inside.gates))mesh.visible=!q[id];this.inside.rings.forEach((r,i)=>r.rotation.z=q.rings[i]*Math.PI/3);this.inside.valves.forEach((r,i)=>r.rotation.z=q.power||q.route.length>i?Math.PI/2:0);this.inside.crystal.material.emissiveIntensity=q.complete?.7:.17;}
 camera(camera,third){const p=this.position,head=v(p.x,p.y+1.48,p.z),forward=v(Math.sin(p.yaw)*Math.cos(p.pitch),Math.sin(p.pitch),-Math.cos(p.yaw)*Math.cos(p.pitch));let eye=head.clone();if(third){const desired=head.clone().add(v(-Math.sin(p.yaw)*5.3,1.0-p.pitch*2.6,Math.cos(p.yaw)*5.3));let amount=1;for(let n=1;n<=40;n++){const pt=head.clone().lerp(desired,n/40),blocked=this.plan.walls.some(w=>(!w.condition||!this.quest[w.condition])&&pt.y>w.y&&pt.y<w.y+w.h+.05&&Math.abs(pt.x-w.x)<w.w/2+.15&&Math.abs(pt.z-w.z)<w.d/2+.15)||this.plan.surfaces.some(s=>!s.ramp&&pt.x>=s.x0&&pt.x<=s.x1&&pt.z>=s.z0&&pt.z<=s.z1&&Math.abs(pt.y-s.y)<.22);if(blocked){amount=Math.max(.09,(n-1)/40);break;}}eye.lerp(desired,amount);eye.y=Math.max(p.y+1.03,eye.y);}camera.up.set(0,1,0);camera.position.copy(eye);camera.lookAt(head.clone().addScaledVector(forward,third?3:15));return true;}
 dispose(){$('structure-hud').hidden=true;$('structure-puzzle').hidden=true;disposeRoot(this.inside.root,this.m);}
}

export class LineInterior{
 constructor(view,i,doorIndex=1){
  this.view=view;this.i=i;this.type='line';this.m=view.continuum.m;
  this.length=view.state.continuum.lines.find(l=>l.anchor===i).segments*40;
  this.position={x:0,y:0,z:(doorIndex===0?-1:1)*(this.length/2-4),yaw:doorIndex===0?Math.PI:0,pitch:.06};
  this.scene=roomScene(view);this.root=new T.Group();this.scene.add(this.root);
  this.level=0;this.online=true;this.clock=0;this.travel=null;this.guide=null;
  const b=makeBuilder(this.m,this.root),L=this.length,stations=[-L/2+12,L/2-12];
  for(let f=0;f<6;f++){
   const y=f*20;
   // Actual shaft openings let the lift pass through every deck.
   for(const p of lineFloorPatches(L))b.box(p.x,y-.3,p.z,p.w,.6,p.d,'floor');
   for(const x of [-34,34]){
    b.box(x,y+5,0,12,10,L-.5,'ivoryCool');b.box(x,y+5,0,12.15,8,L-.7,'deepGlass');
    for(let z=-L/2+5;z<L/2;z+=8)b.box(x,y+5,z,12.3,10,.16,'champagne');
   }
   for(const x of [-3.2,3.2])b.box(x,y+.03,0,.075,.06,L,'champagne');
   for(let z=-L/2+12;z<L/2-9;z+=40){
    for(const x of [-18,18]){b.box(x,y+.65,z,5,1.3,4,'ivoryWarm');tree(b,x,y+1.35,z,3.6,f%4);b.box(x,y+4.2,z,7,.24,6,'ivory');}
    b.box(0,y+.012,z,6,.02,4,'black');
   }
   for(const z of stations){
    const sign=placard(`${f+1}F · ${['入口街道','生活花園','創研工坊','教育文化','空中社區','觀景長廊'][f]}`,'LINE / PUBLIC STREET',5,1.7);
    sign.position.set(16,y+2.5,z+2);this.root.add(sign);
   }
  }
  for(const x of [-39.8,39.8]){
   b.box(x,60,0,.3,120,L,'clear');
   for(let z=-L/2;z<=L/2;z+=10)b.box(x,60,z,.22,120,.22,'champagne');
  }
  for(const z of stations)for(const x of [6,14])b.box(x,60,z,.18,120,6,'champagne');
  b.finish();this.lifts=stations.map(z=>{
   const lift=new T.Group(),lb=makeBuilder(this.m,lift);
   lb.box(10,.08,0,7.8,.16,5.8,'stone');lb.box(10,3.4,0,7.8,.16,5.8,'ivory');
   for(const x of [6.2,13.8])lb.box(x,1.7,0,.15,3.3,5.8,'clear');
   lb.box(10,1.7,-2.8,7.8,3.3,.12,'clear');lb.finish();lift.position.z=z;this.root.add(lift);return lift;
  });
  const train=new T.Group(),tb=makeBuilder(this.m,train);
  tb.box(0,.06,0,3.8,.12,10.2,'champagne');
  for(const x of [-1.65,1.65]){tb.box(x,.65,0,.18,1.3,10,'ivory');tb.box(x,1.65,0,.10,.7,9.7,'clear');}
  for(const z of [-4.8,4.8])tb.box(0,1.0,z,3.5,2,.15,'clear');
  tb.box(0,2.3,0,3.6,.16,10,'clear');tb.finish();this.root.add(train);this.train=train;train.position.z=L/2-12;
  $('structure-hud').hidden=false;$('room-guide').hidden=false;$('room-jump').hidden=false;
  $('room-guide').onclick=()=>this.guideTo('train');$('room-jump').textContent='前往升降梯';$('room-jump').onclick=()=>this.guideTo('lift');
  $('room-recover').onclick=()=>{this.travel=null;this.guide=null;Object.assign(this.position,{x:0,y:this.level*20,z:L/2-4});this.ui();};
  $('room-exit').onclick=()=>{this.exitReturn();view.setMode('walk');};this.ui();
 }
 update(c,a,i){this.online=c.enabled!==false&&a.operational[i]>.5;this.ui();}
 status(){return `${this.level+1}F · 天際長廊 ${this.length} 公尺`;}
 guideTo(kind){if(this.travel)return;const p=this.position;this.guide={x:kind==='lift'?10:0,z:p.z<0?-this.length/2+12:this.length/2-12};this.ui();}
 exitReturn(){const door=buildingDoors(this.view.state,this.i)[this.position.z<0?0:1],safe=nearestWalkable(this.view.state.cells,door.u,door.v);if(safe)this.view.returnWalk={...this.view.walker,...safe,jump:0,velocity:0};}
 step(dt,k){
  this.clock+=dt;const p=this.position;
  if(this.travel){
   const trip=this.travel;trip.elapsed+=dt;const t=Math.min(1,trip.elapsed/trip.duration),e=t*t*(3-2*t);
   p.x=trip.from.x+(trip.to.x-trip.from.x)*e;p.y=trip.from.y+(trip.to.y-trip.from.y)*e;p.z=trip.from.z+(trip.to.z-trip.from.z)*e;
   if(trip.kind==='train')this.train.position.set(0,p.y,p.z);
   else this.lifts[trip.lift].position.y=p.y;
   if(t===1){this.travel=null;this.level=Math.round(p.y/20);if(trip.kind==='train')p.x=4.3;}
  }else{
   const f=(k.KeyW?1:0)-(k.KeyS?1:0),side=(k.KeyD?1:0)-(k.KeyA?1:0);if(f||side)this.guide=null;
   let x=Math.sin(p.yaw)*f+Math.cos(p.yaw)*side,z=-Math.cos(p.yaw)*f+Math.sin(p.yaw)*side,speed=k.ShiftLeft||k.ShiftRight?7:3.8;
   if(this.guide){const dx=this.guide.x-p.x,dz=this.guide.z-p.z,d=Math.hypot(dx,dz);if(d<.12){this.guide=null;this.view.cb.notice?.('已到公共月台，按 E 操作。');}else{x=dx/d;z=dz/d;speed=Math.min(5.4,d/dt);p.yaw=Math.atan2(x,-z);}}
   Object.assign(p,moveLineWalker(p,{x,z,speed},this.length,dt));
   // An unoccupied lift automatically answers a call at the current storey.
   this.lifts.forEach(l=>l.position.y=this.level*20);
  }
  if(this.clock-(this.hudTime||0)>.15){this.hudTime=this.clock;this.ui();}
 }
 target(){
  const p=this.position;if(Math.abs(p.z)>this.length/2-6&&this.level===0)return {id:'exit',name:'穿過端部出口 · 返回城市'};
  const station=Math.abs(Math.abs(p.z)-(this.length/2-12))<5;
  if(station&&p.x>5&&p.x<16)return {id:'lift',name:'搭乘公共升降梯'};
  if(station&&Math.abs(p.x)<5)return {id:'train',name:'搭乘中央穿梭列車'};
  return null;
 }
 interact(){
  const t=this.target();if(!t)return {text:'沿中央街道步行；兩端月台搭乘列車，右側平台搭乘升降梯。'};
  if(t.id==='exit'){this.exitReturn();return {exit:true};}if(!this.online)return {text:'長廊供應不足，升降梯與列車暫停。'};this.guide=null;
  if(t.id==='train'){
   const p=this.position;p.yaw=p.z>0?0:Math.PI;this.travel={kind:'train',from:{...p},to:{x:0,y:p.y,z:p.z>0?-this.length/2+12:this.length/2-12},elapsed:0,duration:this.length/28};
   return {text:'中央列車出發，抵達對端後可下車探索。'};
  }
  const panel=$('structure-puzzle');panel.hidden=false;$('structure-puzzle-title').textContent='公共升降梯';
  $('structure-puzzle-body').innerHTML=`<div class="room-choices">${Array.from({length:6},(_,i)=>`<button data-line-floor="${i}" ${i===this.level?'disabled':''}>${i+1}F</button>`).join('')}</div>`;
  panel.querySelectorAll('[data-line-floor]').forEach(b=>b.onclick=()=>{
   const p=this.position;this.travel={kind:'lift',lift:p.z<0?0:1,from:{x:10,y:p.y,z:p.z<0?-this.length/2+12:this.length/2-12},to:{x:10,y:+b.dataset.lineFloor*20,z:p.z<0?-this.length/2+12:this.length/2-12},elapsed:0,duration:2+Math.abs(+b.dataset.lineFloor-this.level)*.45};panel.hidden=true;
  });$('room-close-puzzle').onclick=()=>panel.hidden=true;return {text:''};
 }
 ui(){
  $('structure-floor').textContent=`${this.level+1}F · 天際長廊`;
  $('structure-objective').textContent=this.travel?this.travel.kind==='train'?'中央列車行進中':'升降梯行進中':'WASD 步行 · 兩端月台搭乘列車 · 右側平台升降梯';
  $('structure-progress').textContent=`${this.length}m × 80m × 120m · ${this.online?'供應正常':'供應不足'}`;
  $('room-guide').textContent='前往中央月台';$('room-guide').disabled=!!this.travel;$('room-jump').disabled=!!this.travel;
  const t=this.target(),button=$('room-interact');button.hidden=!t||!!this.travel;button.textContent=t?`E · ${t.name}`:'';button.onclick=()=>this.view.explorer.interact();
 }
 camera(camera,third){
  const p=this.position,arm=this.travel?.kind==='lift'?1.8:4.3,head=v(p.x,p.y+1.55,p.z),forward=v(Math.sin(p.yaw)*Math.cos(p.pitch),Math.sin(p.pitch),-Math.cos(p.yaw)*Math.cos(p.pitch)),eye=third?head.clone().add(v(-Math.sin(p.yaw)*arm,.8,Math.cos(p.yaw)*arm)):head;
  eye.y=Math.max(p.y+1.1,eye.y);eye.x=Math.max(-27,Math.min(27,eye.x));eye.z=Math.max(-this.length/2+.25,Math.min(this.length/2-.25,eye.z));camera.up.set(0,1,0);camera.position.copy(eye);camera.lookAt(head.clone().addScaledVector(forward,5));return true;
 }
 dispose(){$('structure-hud').hidden=true;$('structure-puzzle').hidden=true;$('room-jump').hidden=false;$('room-jump').disabled=false;$('room-guide').disabled=false;disposeRoot(this.root,this.m);}
}
