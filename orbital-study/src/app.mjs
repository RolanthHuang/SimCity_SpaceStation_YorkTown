import * as T from '../lib/three.module.js';
import {materials} from './materials.mjs';
import {flagship,SHIP_DOCK} from './flagship.mjs';
import {relay,RELAY_CENTER} from './relay.mjs';
import {harbour,distantCity,sky} from './harbour.mjs';
import {v} from './geometry.mjs';
import {RenderBudget,ViewQuality,renderPixelRatio} from './render-budget.mjs';
import {batchStaticArchitecture} from './static-batch.mjs';
const $=id=>document.getElementById(id);
try{start();}catch(e){$('failure').hidden=false;$('failure-message').textContent=e.message;console.error(e);}
function start(){
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
 renderer.setPixelRatio(renderPixelRatio(innerWidth,innerHeight,devicePixelRatio));renderer.setSize(innerWidth,innerHeight);
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.03;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 const canvas=renderer.domElement;$('host').append(canvas);canvas.tabIndex=0;canvas.setAttribute('aria-label','可旋轉、步行與近看的旗艦及遠航巨構實際三維樣板');
 const scene=new T.Scene();scene.background=new T.Color(0x536e83);scene.fog=new T.FogExp2(0x859fac,.00014);
 const camera=new T.PerspectiveCamera(48,innerWidth/innerHeight,.35,3900);
 const assets=materials(renderer,scene),m=assets.m;sky(scene);
 scene.add(new T.HemisphereLight(0xcce9ff,0x8c9790,.95));scene.add(new T.AmbientLight(0xd3dcd0,.13));
 const sun=new T.DirectionalLight(0xffd29a,3.1);sun.position.set(-180,250,210);sun.target.position.set(0,18,-50);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-185,right:185,top:180,bottom:-165,near:5,far:850});sun.shadow.normalBias=.17;sun.shadow.bias=-.00005;scene.add(sun,sun.target);
 const fill=new T.DirectionalLight(0xb6d9f0,.8);fill.position.set(190,90,-110);scene.add(fill);
 const ship=flagship(m),gate=relay(m),port=harbour(m);
 ship.door.userData.dynamic=true;gate.field.userData.dynamic=true;gate.shuttle.userData.dynamic=true;
 for(const root of [ship.root,ship.lod,gate.root,port.root])batchStaticArchitecture(root);
 scene.add(ship.root,ship.lod,gate.root,port.root,distantCity(m));scene.updateMatrixWorld(true);
 let mode='fly',object='ship',detail=false,drag=null,event=null,clock=0,shadowTime=0,frames=0,lastHud=0;
 const keys=new Set(),orbit={target:v(0,49,-77),distance:320,yaw:.42,pitch:.24},desired={target:orbit.target.clone(),distance:320,yaw:.42,pitch:.24};
 const walker={x:16,z:44,yaw:-.38,pitch:.41};
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),smooth=x=>x*x*(3-2*x);
 const shipPoint=p=>ship.root.localToWorld(p.clone()),relayPoint=p=>gate.root.localToWorld(p.clone());
 function notice(text){$('status').textContent=text;}
 function caption(){
  $('eyebrow').textContent=object==='ship'?'HORIZON / NX–2263':'MASS TRANSIT / DEEP HORIZON';
  $('title').textContent=object==='ship'?'一座城市，迎接遠航。':'向更遠的世界，開一道門。';
  $('description').textContent=object==='ship'?'階梯甲板與獨立厚裝甲、封閉引擎與凹入集能核心。近看承重翼板、設備槽及帶維修走道的穿梭艇機庫。':'厚重外環包覆線圈與交叉桁架；環側設有維修步道和控制艙。充能時，穿梭艇會實際穿越環心。';
  $('detail').textContent=detail==='engine'||detail==='coil'?'返回取景':object==='ship'?'近看引擎':'近看線圈';$('hull-detail').hidden=$('bay-detail').hidden=object!=='ship';$('hull-detail').textContent=detail==='hull'?'返回取景':'船殼細節';$('bay-detail').textContent=detail==='bay'?'返回取景':'近看機庫';
  $('hint').textContent=mode==='street'?'WASD 步行 · 拖曳看四周 · 方向鍵轉頭':mode==='fly'?'拖曳旋轉 · 滾輪縮放 · WASD 平移 · Q / E 升降':'拖曳旋轉 · 滾輪縮放 · 方向鍵轉向 · 右拖平移';
  document.body.dataset.view=mode;
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===mode)));
  document.querySelectorAll('[data-object]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.object===object)));
 }
 function focus(reset=false){
  if(mode==='street'){
   walker.x=object==='ship'?16:64;walker.z=object==='ship'?44:19;walker.yaw=object==='ship'?-.38:.14;walker.pitch=object==='ship'?.41:.37;
  }else{
   let p;
   if(detail==='engine')p={target:shipPoint(v(31,13,5.0)),distance:25,yaw:.48,pitch:.13};
   else if(detail==='hull')p={target:shipPoint(v(10,-1,22)),distance:66,yaw:1.02,pitch:.35};
   else if(detail==='bay')p={target:shipPoint(v(0,-8.0,-63.5)),distance:18,yaw:Math.PI-.28+.07,pitch:.05};
   else if(detail)p={target:relayPoint(v(61,-29,11)),distance:44,yaw:.48,pitch:.09};
   else if(mode==='overview')p=object==='ship'?{target:v(0,49,-77),distance:320,yaw:.42,pitch:.24}:{target:v(68,85,-207),distance:335,yaw:.40,pitch:.13};
   else p=object==='ship'?{target:shipPoint(v(0,0,4)),distance:155,yaw:.66,pitch:.20}:{target:RELAY_CENTER.clone(),distance:235,yaw:.48,pitch:.13};
   desired.target.copy(p.target);Object.assign(desired,{distance:p.distance,yaw:p.yaw,pitch:p.pitch});
   if(reset){orbit.target.copy(desired.target);Object.assign(orbit,{distance:desired.distance,yaw:desired.yaw,pitch:desired.pitch});}
  }
  camera.fov=mode==='street'?60:48;camera.updateProjectionMatrix();caption();quality.motion();budget.invalidate();
 }
 document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{mode=b.dataset.view;detail=false;keys.clear();drag=null;focus(true);canvas.focus();});
 document.querySelectorAll('[data-object]').forEach(b=>b.onclick=()=>{object=b.dataset.object;detail=false;keys.clear();focus();});
 function focusDetail(kind){detail=detail===kind?false:kind;if(mode==='street')mode='fly';focus();}
 $('detail').onclick=()=>focusDetail(object==='ship'?'engine':'coil');$('hull-detail').onclick=()=>focusDetail('hull');$('bay-detail').onclick=()=>focusDetail('bay');
 $('reset').onclick=()=>{detail=false;keys.clear();drag=null;focus(true);canvas.focus();};
 function endEvent(){event=null;ship.root.position.copy(SHIP_DOCK);ship.lod.position.copy(SHIP_DOCK);ship.door.position.y=5.8;ship.door.visible=false;gate.field.visible=false;gate.shuttle.visible=false;m.field.uniforms.intensity.value=0;$('arrival').classList.remove('active');$('charge').classList.remove('active');$('arrival').textContent='播放訪港';$('charge').textContent='中繼充能';renderer.shadowMap.needsUpdate=true;quality.motion();budget.invalidate();}
 function play(kind){if(event?.kind===kind){endEvent();return;}endEvent();event={kind,time:0,duration:kind==='arrival'?16:13};$(kind==='arrival'?'arrival':'charge').classList.add('active');$(kind==='arrival'?'arrival':'charge').textContent='停止演出';budget.invalidate();}
 $('arrival').onclick=()=>play('arrival');$('charge').onclick=()=>play('charge');
 const navKeys=['arrowleft','arrowright','arrowup','arrowdown','w','a','s','d','q','e'];
 addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(!navKeys.includes(key)||e.target.matches('input,textarea,select'))return;e.preventDefault();
  if(!e.repeat){const turn=key==='arrowleft'?.04:key==='arrowright'?-.04:0,pitch=key==='arrowup'?.025:key==='arrowdown'?-.025:0;if(mode==='street'){walker.yaw+=turn;walker.pitch=clamp(walker.pitch+pitch,-.65,1.15);}else{desired.yaw+=turn;desired.pitch=clamp(desired.pitch+pitch,-.12,1.15);}}
  keys.add(key);quality.motion();budget.invalidate();});
 addEventListener('keyup',e=>{keys.delete(e.key.toLowerCase());quality.motion();budget.invalidate();});
 addEventListener('blur',()=>{keys.clear();drag=null;});
 canvas.oncontextmenu=e=>e.preventDefault();
 canvas.onpointerdown=e=>{canvas.focus();canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,pan:e.button===2};quality.motion();budget.invalidate();};
 canvas.onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;
  if(mode==='street'){walker.yaw-=dx*.004;walker.pitch=clamp(walker.pitch-dy*.003,-.65,1.15);}
  else if(drag.pan){const scale=desired.distance*.0012;desired.target.x-=dx*scale*Math.cos(desired.yaw);desired.target.z+=dx*scale*Math.sin(desired.yaw);desired.target.y+=dy*scale;}
  else{desired.yaw-=dx*.004;desired.pitch=clamp(desired.pitch+dy*.003,-.12,1.15);}
  quality.motion();budget.invalidate();};
 canvas.onpointerup=canvas.onpointercancel=()=>{drag=null;quality.motion();budget.invalidate();};
 canvas.onwheel=e=>{e.preventDefault();if(mode==='street')return;desired.distance=clamp(desired.distance*Math.exp(e.deltaY*.001),detail?14:62,900);quality.motion();budget.invalidate();};
 function cameraPending(){return mode!=='street'&&(Math.abs(desired.distance-orbit.distance)>.005||Math.abs(desired.yaw-orbit.yaw)>.00002||Math.abs(desired.pitch-orbit.pitch)>.00002||desired.target.distanceTo(orbit.target)>.005);}
 function moveCamera(dt){
  const horizontal=(keys.has('arrowleft')?1:0)-(keys.has('arrowright')?1:0),vertical=(keys.has('arrowup')?1:0)-(keys.has('arrowdown')?1:0);
  if(mode==='street'){
   walker.yaw+=horizontal*dt*.9;walker.pitch=clamp(walker.pitch+vertical*dt*.65,-.65,1.15);
   const f=(keys.has('w')?1:0)-(keys.has('s')?1:0),side=(keys.has('d')?1:0)-(keys.has('a')?1:0),norm=Math.max(1,Math.hypot(f,side));
   let x=clamp(walker.x+(Math.sin(walker.yaw)*f+Math.cos(walker.yaw)*side)*dt*6/norm,-57,57),z=clamp(walker.z+(-Math.cos(walker.yaw)*f+Math.sin(walker.yaw)*side)*dt*6/norm,7,109);
   // Sliding along planter margins instead of walking through the gardens.
   const blocked=(xx,zz)=>Array.from({length:7},(_,k)=>({x:k%2?-27:43,z:20+k*13})).some(p=>Math.abs(xx-p.x)<7.6&&Math.abs(zz-p.z)<4.7);
   if(!blocked(x,walker.z))walker.x=x;if(!blocked(walker.x,z))walker.z=z;
   camera.position.set(walker.x,1.75,walker.z);camera.lookAt(camera.position.clone().add(v(Math.sin(walker.yaw)*Math.cos(walker.pitch),Math.sin(walker.pitch),-Math.cos(walker.yaw)*Math.cos(walker.pitch))));
  }else{
   desired.yaw+=horizontal*dt*.85;desired.pitch=clamp(desired.pitch+vertical*dt*.6,-.12,1.15);
   if(mode==='fly'){
    const f=(keys.has('w')?1:0)-(keys.has('s')?1:0),side=(keys.has('d')?1:0)-(keys.has('a')?1:0),rise=(keys.has('e')?1:0)-(keys.has('q')?1:0);
    desired.target.x+=(-Math.sin(desired.yaw)*f+Math.cos(desired.yaw)*side)*dt*26;desired.target.z+=(-Math.cos(desired.yaw)*f-Math.sin(desired.yaw)*side)*dt*26;desired.target.y=clamp(desired.target.y+rise*dt*20,3,230);
   }
   const a=1-Math.exp(-dt*12);orbit.yaw+=(desired.yaw-orbit.yaw)*a;orbit.pitch+=(desired.pitch-orbit.pitch)*a;orbit.distance+=(desired.distance-orbit.distance)*a;orbit.target.lerp(desired.target,a);
   const c=Math.cos(orbit.pitch);camera.position.set(orbit.target.x+Math.sin(orbit.yaw)*orbit.distance*c,Math.max(2.0,orbit.target.y+Math.sin(orbit.pitch)*orbit.distance),orbit.target.z+Math.cos(orbit.yaw)*orbit.distance*c);camera.lookAt(orbit.target);
  }
 }
 function animateEvent(dt){
  if(!event)return;event.time+=dt;const t=event.time;
  if(event.kind==='arrival'){
   const f=smooth(clamp(t/11,0,1));ship.root.position.copy(v(-300,84,-220).lerp(SHIP_DOCK,f));ship.lod.position.copy(ship.root.position);
   const opening=smooth(clamp((t-10)/3,0,1));ship.door.position.y=.3+opening*5.5;ship.door.visible=opening<.99;
  }else{
   const f=Math.sin(Math.PI*clamp(t/event.duration,0,1));gate.field.visible=true;m.field.uniforms.intensity.value=Math.pow(f,.8);m.field.uniforms.time.value=t;
   gate.shuttle.visible=t>4&&t<11;gate.shuttle.position.set(0,-8,170-(t-4)*48);gate.shuttle.rotation.y=Math.PI;
  }
  if(clock-shadowTime>.5&&event.kind==='arrival'){renderer.shadowMap.needsUpdate=true;shadowTime=clock;}
  notice(event.kind==='arrival'?`旗艦進港 · ${Math.round(t)} / ${event.duration} 秒`:`中繼充能 · ${Math.round(t)} / ${event.duration} 秒`);
  if(t>=event.duration)endEvent();
 }
 function resize(){renderer.setPixelRatio(renderPixelRatio(innerWidth,innerHeight,devicePixelRatio,quality.tier));renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();budget.invalidate();}
 const quality=new ViewQuality({change:tier=>{renderer.setPixelRatio(renderPixelRatio(innerWidth,innerHeight,devicePixelRatio,tier));renderer.setSize(innerWidth,innerHeight);budget.invalidate();},settle:()=>budget.invalidate()});
 const budget=new RenderBudget({activity:()=>document.hidden||$('capture').open?0:keys.size||drag||cameraPending()?30:event?24:0,draw:(now,dt)=>{
  clock+=dt;moveCamera(dt);animateEvent(dt);
  const distant=camera.position.distanceTo(ship.root.position)>550;ship.root.visible=!distant;ship.lod.visible=distant;
  renderer.render(scene,camera);frames++;
  document.body.dataset.renderFrames=String(frames);document.body.dataset.drawCalls=String(renderer.info.render.calls);document.body.dataset.triangles=String(renderer.info.render.triangles);document.body.dataset.geometries=String(renderer.info.memory.geometries);document.body.dataset.textures=String(renderer.info.memory.textures);document.body.dataset.pixelRatio=String(renderer.getPixelRatio());document.body.dataset.settled=String(!cameraPending()&&!keys.size&&!drag&&!event);
  if(!event&&(!cameraPending()&&!keys.size&&!drag))notice('停泊靜止 · 畫面完成後停止重繪');
  if(now-lastHud>200){document.body.dataset.cameraPosition=camera.position.toArray().map(x=>x.toFixed(2)).join(',');lastHud=now;}
 }});
 addEventListener('resize',resize);
 $('photo').onclick=()=>{
  keys.clear();drag=null;const ratio=renderer.getPixelRatio(),w=innerWidth,h=innerHeight,aspect=camera.aspect;
  renderer.setPixelRatio(1);renderer.setSize(1920,1200,false);camera.aspect=1.6;camera.updateProjectionMatrix();renderer.render(scene,camera);
  const png=canvas.toDataURL('image/png');$('capture-image').src=png;$('download').href=png;$('download').download=`Yorktown-${object}-${mode}${detail?'-detail':''}.png`;$('capture').showModal();
  renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);camera.aspect=aspect;camera.updateProjectionMatrix();budget.invalidate();
 };
 $('capture').onclose=()=>{$('capture-image').removeAttribute('src');$('download').removeAttribute('href');canvas.focus();budget.invalidate();};
 $('close-capture').onclick=()=>{$('capture').close();};
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();budget.setEnabled(false);notice('三維繪圖暫停。重新整理可恢復樣板。');});
 canvas.addEventListener('webglcontextrestored',()=>{renderer.shadowMap.needsUpdate=true;budget.setEnabled(true);});
 document.body.dataset.ready='true';focus(true);
}
