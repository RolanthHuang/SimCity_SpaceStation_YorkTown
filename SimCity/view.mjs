import {branchVisualHeight,branchDetailCost} from './branch-visuals.mjs';
import {industrialVisualKey} from './industrial-architecture.mjs';
import {residentialShapes} from './residential-shapes.mjs';
import {industrialShapes} from './industrial-shapes.mjs';
import {commercialShapes} from './commercial-shapes.mjs';
import {ContinuumScene,adoptedForm} from './continuum-scene.mjs';
import {RenderBudget,ViewQuality,renderPixelRatio} from './render-budget.mjs';
import {buildingDetailPlan,renderChunk,distantBuilding} from './render-plan.mjs';
import {DEMO_BLUEPRINT} from './continuum-plan.mjs';
import {SailInterior,LineInterior} from './continuum-interior.mjs';
import {lineDrag,lineAt,lineDimensions,buildingDoors} from './continuum.mjs';
import {ExplorerController} from './explorer-controller.mjs';
import {MaglevScene} from './maglev-scene.mjs';
import {previewStation,streetCell} from './maglev.mjs';
import {plotAnchor,plotMembers,square,LANDMARK_TYPES} from './plots.mjs';
import {turnInput,wrapAngle} from './camera-controls.mjs';
import * as THREE from '../YorktownPreview/three.module.js';
import {SIZE,HEIGHT,CELL_COUNT,deckOf,district,TYPES,isFacility,DECK,wrapX,deltaX,neighbors,INTERIORS,terrain,xy,idx,isRoad,isTransport,zoneOf,residential} from './catalog.mjs';

import {surface,frame,deckAt,clampV,localPoint,tileAt,canWalk,nearestWalkable,moveWalker,solid,roadRoute} from './habitat.mjs';
import {createStation} from './station.mjs';
import {InteriorRoom} from './interior.mjs';

import {DawnScene,deckQuaternion} from './dawn-scene.mjs';
import {AtelierScene} from './atelier-scene.mjs';
import {ATELIER_LOTS,lotAt} from './atelier-plan.mjs';
import {zoneBuilding,serviceBuilding,complexBuilding,utilityComplex} from './architecture.mjs';
import {architecturalShapes} from './architecture-shapes.mjs';
import {stageHeight} from './evolution.mjs';
import {foliageGeometry} from './evolution-materials.mjs';
import {GATES,canPortal} from './orbital.mjs';

export class CityView{
 constructor(host,callbacks){
  this.cb=callbacks;this.host=host;this.mode='build';this.deck=0;this.isolate=false;this.portalCooldown=0;this.flyer={u:-8,v:-10,h:8,yaw:Math.PI/2,pitch:-.2};this.interiorTile=-1;this.keys={};this.walker={u:-9.5,v:-12.5,jump:0,velocity:0,yaw:Math.PI/2,pitch:-.08};this.signatures=new Map();this.growth=new Map();this.growing=[];this.people=[];this.streetClock=0;this.simulationSpeed=0;this.lastFrame=performance.now();this.pitch=.58;this.yaw=-.28;this.distance=43;this.target=new THREE.Vector3(-8,0,-9);this.pointers=new Map();this.tool='inspect';this.overlay='normal';this.preview=[];
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x405765);this.scene.fog=new THREE.FogExp2(0x9eb2b8,.00045);
  this.camera=new THREE.PerspectiveCamera(48,1,.025,1400);
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});this.renderer.setPixelRatio(1);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.03;
  this.renderer.domElement.setAttribute('aria-label','Yorktown 城市地圖；選擇工具後點選或拖曳建造');host.append(this.renderer.domElement);
  this.scene.add(new THREE.AmbientLight(0xe3e7df,.62));this.scene.add(new THREE.HemisphereLight(0xcde8f3,0x869298,1.7));const sun=new THREE.DirectionalLight(0xffe4bd,2.45);sun.position.set(-80,120,60);this.scene.add(sun);
  const rim=new THREE.DirectionalLight(0xa0cced,1.35);rim.position.set(30,20,-30);this.scene.add(rim);
  this.world=new THREE.Group();this.scene.add(this.world);this.buildings=new THREE.Group();this.scene.add(this.buildings);
  this.box=new THREE.BoxGeometry(1,1,1);this.mat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.48,metalness:.24});
  this.valid=Array.from({length:CELL_COUNT},(_,i)=>i).filter(terrain);this.floor=new THREE.InstancedMesh(this.box,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.86,metalness:.12}),this.valid.length);this.floor.userData.ground=true;this.world.add(this.floor);
  this.dummy=new THREE.Object3D();this.shapes={...architecturalShapes(),...commercialShapes(),...residentialShapes(),...industrialShapes(),box:this.box,cylinder:new THREE.CylinderGeometry(.5,.5,1,24)};this.color=new THREE.Color();
  this.valid.forEach((i,n)=>{const [x,y]=xy(i);this.matrix(this.floor,n,x,-.37,y,1.005,.86,1.005);this.floor.setColorAt(n,this.color.setHex(0x263f51));});
  this.floor.instanceMatrix.needsUpdate=true;this.floorStyles=new Uint32Array(this.valid.length).fill(0xffffffff);this.floorIsolation='all';
  this.station=createStation(this.scene);
  this.maglev=new MaglevScene(this);this.addRails();this.dawn=new DawnScene(this.scene);this.atelier=new AtelierScene(this);this.continuum=new ContinuumScene(this);
  this.cityMaterials={};for(const role of ['ivory','stone','titanium','gold','dark','window','glass','pane','leaf','red','wood','bark','charcoal']){const mat=this.atelier.assets.m[role].clone();mat.color.set(0xffffff);this.cityMaterials[role]=mat;}
  this.cityMaterials.contact=this.atelier.assets.m.contact;
  this.shapes.foliage=foliageGeometry();this.shapes.plane=new THREE.PlaneGeometry(1,1);this.shapes.plane.rotateX(-Math.PI/2);
  this.sharedMaterials=new Set([this.mat,...Object.values(this.cityMaterials)]);
  const stars=[];for(let i=0;i<1400;i++){const a=i*2.399963,b=Math.acos(1-2*(i+.5)/1400),r=550+Math.sin(i*7)*30;stars.push(Math.cos(a)*Math.sin(b)*r,Math.cos(b)*r,Math.sin(a)*Math.sin(b)*r);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));this.scene.add(new THREE.Points(g,new THREE.PointsMaterial({color:0xc4dff5,size:.3,transparent:true,opacity:.7})));
  this.highlight=new THREE.InstancedMesh(this.box,new THREE.MeshBasicMaterial({color:0xc9fff2,transparent:true,opacity:.4,depthWrite:false}),CELL_COUNT);this.highlight.count=0;this.scene.add(this.highlight);
  this.selection=new THREE.Mesh(new THREE.BoxGeometry(1.04,.04,1.04),new THREE.MeshBasicMaterial({color:0xe0fff7,wireframe:true}));this.selection.visible=false;this.scene.add(this.selection);
  this.ray=new THREE.Raycaster();this.plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);this.hit=new THREE.Vector3();
  this.ships=[];for(let i=0;i<7;i++){const ship=new THREE.Mesh(new THREE.ConeGeometry(.16,.6,4),new THREE.MeshStandardMaterial({color:0xbfe9ff,emissive:0x245f89}));ship.rotation.z=Math.PI/2;this.scene.add(ship);this.ships.push(ship);}
  this.chunkModels=new Map();this.tilePositions=new Map(this.valid.map(i=>{const [x,y]=xy(i);return [i,new THREE.Vector3(...surface(x-27.5,y-27.5))];}));
  this.quality=new ViewQuality({change:()=>this.applyResolution(),settle:()=>{if(this.state&&this.lodDirty&&this.mode!=='interior')this.update(this.state,this.analysis,this.overlay);this.budget?.invalidate();}});
  this.explorer=new ExplorerController(this);this.setupPeople();this.bind();this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);this.resize();
  this.budget=new RenderBudget({draw:(now,dt)=>this.animate(now,dt),activity:()=>this.renderActivity()});
  this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();this.budget.setEnabled(false);this.quality.setEnabled(false);this.cb.recover?.();this.cb.notice?.('畫面資源暫時中斷；城市已暫停。恢復後可繼續或匯出存檔。',true);});
  this.renderer.domElement.addEventListener('webglcontextrestored',()=>{this.renderer.shadowMap.needsUpdate=true;this.continuum.backdropDirty=true;this.quality.setEnabled(true);this.budget.setEnabled(true);});
 }
 matrix(mesh,n,x,h,y,sx,sy,sz){const u=x-27.5;this.dummy.position.set(...surface(u,y-27.5,h));this.dummy.scale.set(sx,sy,sz);this.dummy.quaternion.copy(deckQuaternion(u,y-27.5));this.dummy.updateMatrix();mesh.setMatrixAt(n,this.dummy.matrix);}
 cameraUpdate(){
  this.budget?.invalidate();
  try{
  if(this.mode==='interior'&&this.room?.camera&&this.room.camera(this.camera,this.explorer.state.thirdPerson))return;
  if(this.explorer?.camera())return;
  if(this.mode==='walk'){
   const w=this.walker,f=frame(w.u,w.v),eye=new THREE.Vector3(...surface(w.u,w.v,(this.state?.artSample ? .40 : .28)+w.jump));
   const forward=new THREE.Vector3(...f.tangent).multiplyScalar(Math.sin(w.yaw)).addScaledVector(new THREE.Vector3(...f.side),-Math.cos(w.yaw));
   this.camera.up.set(...f.up);forward.multiplyScalar(Math.cos(w.pitch)).addScaledVector(this.camera.up,Math.sin(w.pitch));this.camera.position.copy(eye);this.camera.lookAt(eye.clone().add(forward));
  }else if(this.mode==='interior'){
   const p=this.room.position;this.camera.up.set(0,1,0);this.camera.position.set(p.x,p.y+1.65,p.z);this.camera.lookAt(p.x+Math.sin(p.yaw)*Math.cos(p.pitch),p.y+1.65+Math.sin(p.pitch),p.z-Math.cos(p.yaw)*Math.cos(p.pitch));
  }else if(this.mode==='fly'){
   const w=this.flyer,f=frame(w.u,w.v),eye=new THREE.Vector3(...surface(w.u,w.v,w.h));this.camera.up.set(...f.up);
   const forward=new THREE.Vector3(...f.tangent).multiplyScalar(Math.sin(w.yaw)).addScaledVector(new THREE.Vector3(...f.side),-Math.cos(w.yaw));forward.multiplyScalar(Math.cos(w.pitch)).addScaledVector(this.camera.up,Math.sin(w.pitch));this.camera.position.copy(eye);this.camera.lookAt(eye.clone().add(forward));
  }else if(this.mode==='build'){
   const [u,v]=localPoint(this.target.x,this.target.y,this.target.z,this.deck),angle=u/DECK.radius;
   this.target.set(...surface(u,v));const f=frame(u,v),up=new THREE.Vector3(...f.up),tangent=new THREE.Vector3(...f.tangent);
   this.camera.up.copy(up);this.camera.position.copy(this.target).addScaledVector(up,this.distance*Math.sin(this.pitch)).addScaledVector(tangent,Math.sin(this.yaw)*this.distance*Math.cos(this.pitch));this.camera.position.addScaledVector(new THREE.Vector3(...f.side),Math.cos(this.yaw)*this.distance*Math.cos(this.pitch));this.camera.lookAt(this.target.clone().addScaledVector(up,this.sampleAim||0));
  }else{this.camera.up.set(0,1,0);this.camera.position.set(this.target.x+Math.sin(this.yaw)*this.distance*Math.cos(this.pitch),this.target.y+this.distance*Math.sin(this.pitch),this.target.z+Math.cos(this.yaw)*this.distance*Math.cos(this.pitch));this.camera.lookAt(this.target);}
  }finally{this.noteCameraChange();}
 }
 noteCameraChange(){
  if(!this.previousEye||this.previousEye.distanceToSquared(this.camera.position)>1e-9||Math.abs(this.previousOrientation.dot(this.camera.quaternion))<1-1e-9){
   this.previousEye=this.camera.position.clone();this.previousOrientation=this.camera.quaternion.clone();this.lodDirty=true;this.quality?.motion();
  }
 }
 applyResolution(){
  const w=Math.max(1,this.host.clientWidth),h=Math.max(1,this.host.clientHeight),ratio=renderPixelRatio(w,h,devicePixelRatio,this.quality?.tier||'still');
  if(this.renderWidth!==w||this.renderHeight!==h||Math.abs(this.renderer.getPixelRatio()-ratio)>.001){this.renderer.setPixelRatio(ratio);this.renderer.setSize(w,h,false);this.renderWidth=w;this.renderHeight=h;this.continuum.backdropDirty=true;}
  this.budget?.invalidate();
 }
 resize(){this.applyResolution();this.camera.aspect=this.renderWidth/this.renderHeight;this.camera.updateProjectionMatrix();this.lodDirty=true;this.quality?.motion();this.cameraUpdate();}
 detailItems(s){
  this.camera.updateMatrixWorld();const frustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse)),forward=this.camera.getWorldDirection(new THREE.Vector3()),focal=(this.host?.clientHeight||720)/(2*Math.tan(this.camera.fov*Math.PI/360));
  return this.valid.filter(i=>{const c=s.cells[i];return c.level&&!c.subplot&&plotAnchor(s,i)===i&&(zoneOf(c.type)||isFacility(c.type));}).map(i=>{
   const c=s.cells[i],span=c.span||1,[x,y]=xy(i),form=adoptedForm(c),h=form?({residence:10,commerce:13,industry:7}[form])*span/5:branchVisualHeight(c);
   const center=new THREE.Vector3(...surface(x+(span-1)/2-27.5,y+(span-1)/2-27.5,h/2)),delta=center.clone().sub(this.camera.position),radius=Math.hypot(span*.78,h*.53),depth=delta.dot(forward);
   return {i,detailCost:branchDetailCost(c),hero:!!form,distance:delta.length(),pixels:Math.max(h,span)*focal/Math.max(1,depth),visible:frustum.intersectsSphere(new THREE.Sphere(center,radius))&&!(this.isolate&&this.mode==='build'&&deckOf(i)!==this.deck)};
  });
 }
 pickTrack(clientX,clientY){
  if(this.mode==='interior')return null;const r=this.renderer.domElement.getBoundingClientRect();this.ray.setFromCamera(new THREE.Vector2((clientX-r.left)/r.width*2-1,1-(clientY-r.top)/r.height*2),this.camera);const hits=this.ray.intersectObjects([this.floor,...this.buildings.children,...this.maglev.group.children],true).filter(h=>{let o=h.object;while(o){if(!o.visible)return false;o=o.parent;}return true;});return hits[0]?.object.userData.maglev||null;
 }
 pick(clientX,clientY){
  if(this.mode==='interior')return -1;
  const r=this.renderer.domElement.getBoundingClientRect();this.ray.setFromCamera(new THREE.Vector2((clientX-r.left)/r.width*2-1,1-(clientY-r.top)/r.height*2),this.camera);
  const candidates=[this.floor,...this.buildings.children,...this.continuum.pickables.filter(m=>{let p=m;while(p){if(!p.visible)return false;p=p.parent;}return true;}),...this.atelier.pickables.filter(m=>{let p=m;while(p){if(!p.visible)return false;p=p.parent;}return true;})];
  const resolve=hit=>hit.object===this.floor?this.valid[hit.instanceId]:hit.object.userData.tile??hit.object.userData.tiles?.[hit.instanceId];
  const hits=this.ray.intersectObjects(candidates,false).filter(hit=>{const i=resolve(hit);return i!==undefined&&(!this.isolate||this.mode!=='build'||deckOf(i)===this.deck);});if(!hits.length)return -1;
  const hit=hits[0];if(this.mode==='walk'&&hit.distance>15)return -1;const tile=resolve(hit),sample=this.state?.artSample?(lotAt(tile)?.anchor??tile):tile;return this.tool==='inspect'&&this.state?plotAnchor(this.state,sample):sample;
 }
 setTool(tool){if(['overview','fly','interior'].includes(this.mode)&&tool!=='inspect')this.setMode('build');this.tool=tool;this.renderer.domElement.style.cursor=tool==='inspect'?'grab':'crosshair';this.preview=[];this.setPreview([]);}
 showSelection(i){this.budget?.invalidate();this.selection.visible=i>=0;if(i>=0){i=this.state?plotAnchor(this.state,i):i;const span=this.state?.cells[i]?.span||1,l=this.state&&lineAt(this.state,i),dims=l?lineDimensions(l):{w:span,h:span},[x,y]=xy(i),u=x+(dims.w-1)/2-27.5,v=y+(dims.h-1)/2-27.5;this.selection.scale.set(dims.w,1,dims.h);this.selection.position.set(...surface(u,v,.07));this.selection.quaternion.copy(deckQuaternion(u,v));}}
 focus(i){if(this.state?.artSample){const p=ATELIER_LOTS.find(p=>p.anchor===i);if(p){this.sampleShot(p.key);return;}}this.sampleAim=0;i=this.state?plotAnchor(this.state,i):i;const span=this.state?.cells[i]?.span||1,l=this.state&&lineAt(this.state,i),dims=l?lineDimensions(l):{w:span,h:span};const [sx,sy]=xy(i),x=sx+(dims.w-1)/2,y=sy+(dims.h-1)/2;this.setMode('build');this.deck=deckOf(i);this.target.set(...surface(x-27.5,y-27.5));this.distance=Math.max(12,l?Math.max(dims.w,dims.h)*3.3:span*5);this.sampleAim=l?2.6:span>1?span*.65:0;this.cameraUpdate();if(this.state)this.update(this.state,this.analysis,this.overlay);}
 home(){if(this.state?.continuum?.lines.length&&this.state.cells.some(c=>c.type==='sail')){const composed=this.state.cells[DEMO_BLUEPRINT.landmarks.sail]?.type==='sail',shot=composed?DEMO_BLUEPRINT.camera:{x:72,y:29,distance:46,pitch:.56,yaw:-.35,aim:2.2};this.setMode('build');this.deck=0;this.target.set(...surface(shot.x-27.5,shot.y-27.5));this.distance=shot.distance;this.pitch=shot.pitch;this.yaw=shot.yaw;this.sampleAim=shot.aim;this.cameraUpdate();this.update(this.state,this.analysis,this.overlay);return;}if(this.state?.artSample||this.state?.cells[idx(20,25)]?.span>1){this.sampleShot('ensemble');return;}this.setMode('build');this.deck=0;this.target.set(...surface(-8, -10));this.distance=43;this.pitch=.58;this.yaw=-.28;this.sampleAim=0;this.cameraUpdate();if(this.state)this.update(this.state,this.analysis,this.overlay);}
 sampleShot(name='ensemble'){
  const shots={harbor:{x:23,y:20,d:66,p:.36,yaw:.52,aim:12},ensemble:{x:26,y:28,d:31,p:.40,yaw:.58,aim:2.7},residence:{x:22,y:27,d:13,p:.40,yaw:.55,aim:3.4},commerce:{x:29,y:27,d:25,p:.40,yaw:.53,aim:7},industry:{x:36,y:27,d:10,p:.49,yaw:.52,aim:1.5},gate:{x:12,y:25,d:18,p:.40,yaw:.26,aim:4}};
  if(name==='walk'){this.sampleShot('ensemble');this.setMode('walk');Object.assign(this.walker,{u:28-27.5,v:32-27.5,jump:0,velocity:0,yaw:-.45,pitch:.26});this.cameraUpdate();return;}
  if(name==='gatewalk'){this.visitGate(0);return;}
  const shot=shots[name]||shots.ensemble;this.setMode('build');this.deck=0;this.target.set(...surface(shot.x-27.5,shot.y-27.5));this.sampleAim=shot.aim;this.distance=shot.d;this.pitch=shot.p;this.yaw=shot.yaw;this.cameraUpdate();if(this.state)this.update(this.state,this.analysis,this.overlay);
 }
 overview(){this.setMode('overview');this.target.set(0,DECK.radius,0);this.distance=330;this.pitch=.35;this.yaw=-.6;this.cameraUpdate();}
 zoom(delta){if(this.mode==='interior')return;if(this.mode==='fly'){this.flyer.h=Math.max(1,Math.min(65,this.flyer.h*delta));this.cameraUpdate();return;}if(this.mode==='walk'){this.explorer.state.distance=Math.max(.55,Math.min(3,this.explorer.state.distance*delta));this.cameraUpdate();return;}this.distance=Math.max(3,Math.min(this.mode==='overview'?450:90,this.distance*delta));this.cameraUpdate();}
 rotate(direction=1){const p=this.mode==='interior'?this.room.position:this.mode==='fly'?this.flyer:this.mode==='walk'?this.walker:this;p.yaw=wrapAngle(p.yaw+direction*Math.PI/6);this.cameraUpdate();}
 line(a,b){if(a<0||b<0||deckOf(a)!==deckOf(b)||['overview','fly','interior'].includes(this.mode))return [];if(this.mode==='walk')return [b];if(this.tool==='line')return lineDrag(a,b).cells.filter(terrain);const [x,y]=xy(a),[bx,v]=xy(b),u=x+deltaX(x,bx),list=[];if(TYPES[this.tool]?.group==='zone'||this.tool==='bulldoze'||this.tool==='assist'){for(let j=Math.min(y,v);j<=Math.max(y,v);j++)for(let i=Math.min(x,u);i<=Math.max(x,u);i++)if(terrain(idx(wrapX(i),j)))list.push(idx(wrapX(i),j));}
  else if(['road','avenue','rail','wire','pipe','eraseWire','erasePipe'].includes(this.tool)){for(let i=Math.min(x,u);i<=Math.max(x,u);i++)if(terrain(idx(wrapX(i),y)))list.push(idx(wrapX(i),y));for(let j=Math.min(y,v);j<=Math.max(y,v);j++)if(terrain(idx(wrapX(u),j)))list.push(idx(wrapX(u),j));}
  else list.push(b);const result=[...new Set(list)];return this.tool==='bulldoze'&&this.state?[...new Set(result.flatMap(i=>plotMembers(this.state,i)))]:LANDMARK_TYPES.includes(this.tool)?square(b,5).filter(terrain):result;}
 setPreview(indices){if(!indices.length&&this.planningPreview){this.showPlan(this.planningPreview);return;}if(this.highlight.count||indices.length)this.budget?.invalidate();this.highlight.count=indices.length;indices.forEach((i,n)=>{const [x,y]=xy(i);this.matrix(this.highlight,n,x,.07,y,.98,.02,.98);this.highlight.setColorAt(n,new THREE.Color(0xc9fff2));});this.highlight.instanceMatrix.needsUpdate=true;if(this.highlight.instanceColor)this.highlight.instanceColor.needsUpdate=true;this.cb.preview?.(indices);}
 showPlan(plan){this.budget?.invalidate();this.planningPreview=plan;if(!plan){this.highlight.count=0;return;}this.highlight.count=plan.changes.length;plan.changes.forEach((c,n)=>{const [x,y]=xy(c.i);this.matrix(this.highlight,n,x,.12,y,.96,.08,.96);this.highlight.setColorAt(n,new THREE.Color(TYPES[c.type]?.color||0xceddce));});this.highlight.instanceMatrix.needsUpdate=true;this.highlight.instanceColor.needsUpdate=true;}
 bind(){const el=this.renderer.domElement;
  document.addEventListener('keydown',e=>{
   this.budget?.invalidate();
   if(document.querySelector('dialog[open]')||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
   if(e.code==='KeyE'){e.preventDefault();if(e.repeat)return;if(['walk','interior'].includes(this.mode))this.explorer.interact();else if(['build','overview'].includes(this.mode))this.keys.KeyE=true;return;}
   if(e.code==='KeyV'&&['walk','interior'].includes(this.mode)){e.preventDefault();if(!e.repeat)this.explorer.togglePerspective();return;}
   if(e.code==='KeyT'&&['walk','interior'].includes(this.mode)){e.preventDefault();if(!e.repeat)this.cb.characters?.();return;}
   if(e.code==='Space'&&this.mode==='interior'&&this.room?.jump&&!e.repeat)this.room.jump();
   if(e.code==='KeyM'&&this.mode==='interior'){this.cb.manage?.(this.interiorTile);return;}
   if(e.code==='KeyG'){e.preventDefault();this.setMode(this.mode==='fly'?'build':'fly');return;}
   if(e.code==='KeyF'){e.preventDefault();this.setMode(this.mode==='walk'?'build':'walk');return;}
   if(['build','overview','walk','fly','interior'].includes(this.mode)&&['KeyQ','KeyC','KeyW','KeyA','KeyS','KeyD','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','ShiftLeft','ShiftRight'].includes(e.code)){
    e.preventDefault();if(this.mode==='walk'&&e.code==='Space'&&!e.repeat)this.explorer.beginAbility();this.keys[e.code]=true;
    if(!e.repeat){if(this.mode==='walk')this.walk(1/60);else if(this.mode==='fly')this.fly(1/60);else if(this.mode==='interior')this.walkInterior(1/60);else this.turnBuild(1/60);}
   }
  });
  document.addEventListener('keyup',e=>delete this.keys[e.code]);addEventListener('blur',()=>{this.keys={};this.pointers.clear();this.start=null;});document.addEventListener('visibilitychange',()=>{this.keys={};this.lastFrame=performance.now();});
 el.addEventListener('contextmenu',e=>e.preventDefault());
  el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture(e.pointerId);this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(this.pointers.size>1){this.gesture=true;this.setPreview([]);return;}this.gesture=false;this.start={x:e.clientX,y:e.clientY,i:this.pick(e.clientX,e.clientY),lastX:e.clientX,lastY:e.clientY,button:e.button};this.moved=false;if(this.tool!=='inspect'&&e.button===0)this.setPreview(this.line(this.start.i,this.start.i));});
  el.addEventListener('pointermove',e=>{
   const point=this.pointers.get(e.pointerId);if(!point){const i=this.pick(e.clientX,e.clientY);this.cb.hover?.(i);if(this.tool!=='inspect')this.setPreview(i<0?[]:this.line(i,i));return;}
   const old={...point};point.x=e.clientX;point.y=e.clientY;
   if(this.pointers.size===2){const other=[...this.pointers.entries()].find(([id])=>id!==e.pointerId)[1],before=Math.hypot(old.x-other.x,old.y-other.y),after=Math.hypot(point.x-other.x,point.y-other.y);if(after>10)this.zoom(before/after);this.pan((point.x-old.x)*.5,(point.y-old.y)*.5);return;}
   if(this.gesture||!this.start)return;
   const dx=e.clientX-this.start.lastX,dy=e.clientY-this.start.lastY;this.start.lastX=e.clientX;this.start.lastY=e.clientY;
   if(Math.hypot(e.clientX-this.start.x,e.clientY-this.start.y)>5)this.moved=true;
   if(this.tool==='inspect'||this.start.button!==0){if(this.mode==='build'&&this.start.button===2)this.orbit(dx,dy);else this.pan(dx,dy);}else this.setPreview(this.line(this.start.i,this.pick(e.clientX,e.clientY)));
  });
  el.addEventListener('pointerup',e=>{this.pointers.delete(e.pointerId);if(!this.gesture&&this.start){const i=this.pick(e.clientX,e.clientY);const link=!this.moved&&['inspect','bulldoze'].includes(this.tool)?this.pickTrack(e.clientX,e.clientY):null;if(link)this.cb.track?.(link,this.tool==='bulldoze');else if(this.tool==='inspect'&&!this.moved&&i>=0)this.cb.select(i);else if(this.tool!=='inspect'&&this.start.button===0)this.cb.build(this.line(this.start.i,i));}if(!this.pointers.size){this.start=null;this.gesture=false;}this.setPreview([]);});
  el.addEventListener('pointercancel',e=>{this.pointers.delete(e.pointerId);this.start=null;this.gesture=true;this.setPreview([]);});
  el.addEventListener('pointerleave',()=>{if(!this.pointers.size)this.setPreview([]);});
  el.addEventListener('wheel',e=>{e.preventDefault();this.zoom(Math.exp(e.deltaY*.001));},{passive:false});
 }
 pan(dx,dy){if(['walk','fly','interior'].includes(this.mode)){const p=this.mode==='walk'?this.walker:this.mode==='fly'?this.flyer:this.room.position;p.yaw=wrapAngle(p.yaw+dx*.004);p.pitch=Math.max(-1.3,Math.min(1.3,p.pitch-dy*.004));this.cameraUpdate();return;}if(this.mode==='overview'){this.yaw=wrapAngle(this.yaw-dx*.004);this.pitch=Math.max(-.3,Math.min(1.4,this.pitch+dy*.003));this.cameraUpdate();return;}const k=this.distance*.0009,[u,v]=localPoint(this.target.x,this.target.y,this.target.z,this.deck);this.target.set(...surface(u-dx*Math.cos(this.yaw)*k-dy*Math.sin(this.yaw)*k/Math.sin(this.pitch),clampV(v+dx*Math.sin(this.yaw)*k-dy*Math.cos(this.yaw)*k/Math.sin(this.pitch),this.deck)));this.cameraUpdate();}

 orbit(dx,dy){this.yaw=wrapAngle(this.yaw-dx*.006);this.pitch=Math.max(.18,Math.min(1.48,this.pitch+dy*.005));this.cameraUpdate();}
 toggleIsolation(){this.isolate=!this.isolate;this.update(this.state,this.analysis,this.overlay);return this.isolate;}
 update(s,a,overlay='normal'){
  this.budget?.invalidate();this.lodDirty=false;this.lodTime=performance.now();this.overlay=overlay;this.state=s;this.analysis=a;
  this.detailPlan=buildingDetailPlan(this.detailItems(s),this.mode,this.detailPlan);
  this.atelier.updateShadowFocus?.(this.mode==='build'?this.target:this.camera.position);
  const desired=new Map(),prefix=`${overlay}:${overlay==='normal'?'':s.month}:${this.isolate&&this.mode==='build'?this.deck:'all'}:${s.artSample}`;
  for(const i of this.valid){const c=s.cells[i],key=renderChunk(i);if(!desired.has(key))desired.set(key,[]);if(c.type||c.wire||c.pipe)desired.get(key).push(`${i},${c.type},${c.level},${c.plot},${c.span},${c.branch},${c.vacant},${c.fire},${c.enabled},${c.upgrade},${c.roadBase},${c.wire},${c.pipe},${c.pop>0||a.filled[i]>0},${this.detailPlan.get(i)||0},${industrialVisualKey(c,i%SIZE,Math.floor(i/SIZE))}`);}
  const changed=new Set();for(const [key,parts]of desired){const signature=prefix+'|'+parts.join(';'),old=this.chunkModels.get(key);if(old?.signature===signature)continue;changed.add(key);for(const child of old?.meshes||[]){this.buildings.remove(child);child.dispose();if(!this.sharedMaterials.has(child.material))child.material.dispose();}this.chunkModels.set(key,{signature,meshes:[]});}
  this.growing=this.growing.filter(g=>g.mesh.parent===this.buildings);
  this.dawn.update(s,a);this.atelier.update(s,a);this.continuum.update(s,a);this.maglev.update(s,a);document.body.classList.toggle('atelier-city',!!s.artSample);this.secondaryRails.visible=!(this.isolate&&this.mode==='build'&&this.deck===0);this.station.visible=!(this.isolate&&this.mode==='build');this.dawn.root.visible=this.station.visible;const first=this.signatures.size===0,now=performance.now();for(const i of this.valid){const c=s.cells[i],signature=`${c.type}:${c.level}:${c.plot}:${c.span}:${c.branch}:${c.vacant}`;if(!first&&this.signatures.get(i)!==signature&&solid(c)&&this.detailPlan.get(i)===2)this.growth.set(i,now);if(!solid(c))this.growth.delete(i);this.signatures.set(i,signature);}if(this.mode==='walk')this.ensureWalkable();this.updatePeople();if(this.mode==='interior'){const c=s.cells[this.interiorTile];if(!c||c.type!==this.room.type||c.fire||!c.level)this.setMode('walk');else this.room.update(c,a,this.interiorTile,s.month);}
  const pieces=[],lights=[],lines=[];let tile=-1;const add=(x,y,h,sx,sy,sz,color,shape='box',role='ivory')=>pieces.push({x,y,h,sx,sy,sz,color,tile,shape,role});
  const floorIsolation=this.isolate&&this.mode==='build'?this.deck:'all',floorMatrices=this.floorIsolation!==floorIsolation;this.floorIsolation=floorIsolation;this.floorStyles??=new Uint32Array(this.valid.length).fill(0xffffffff);let floorColours=false;
  this.valid.forEach((i,n)=>{
   tile=i;const c=s.cells[i],def=TYPES[c.type],[x,y]=xy(i);let color=(x+y)%2?0xc8d1cc:0xc2cbc7;if(y===8||y===43||y===60||y===83)color=0xb8c4bd;if(x%67===0)color=0xbec9c4;
   const hidden=this.isolate&&this.mode==='build'&&deckOf(i)!==this.deck;if(floorMatrices)this.matrix(this.floor,n,x,-.37,y,hidden?0:1.005,hidden?0:.86,hidden?0:1.005);if(hidden)return;
   if(c.type)color=isTransport(c.type)?0x65777c:zoneOf(c.type)?(zoneOf(c.type)==='R'?0xb8c9b2:zoneOf(c.type)==='C'?0xb4c9cf:0xd3c8ad):0xdadbd0;
   if(overlay!=='normal'){
    let v=0;
    if(overlay==='power'){v=a.power.coverage[i];color=v>.9?0x4dddc0:v>0?0xc79140:0x402f41;}
    if(overlay==='water'){v=a.water.coverage[i];color=v>.9?0x59bde9:v>0?0xbdab59:0x402f41;}
    if(overlay==='oxygen'||overlay==='cooling'){v=a.space[overlay][i];color=v>.95?(overlay==='oxygen'?0x58d8a9:0x79c8e9):v>0?0xd6a756:0x553345;}
    if(overlay==='traffic'){v=a.traffic[i]/Math.max(1,a.roadCapacity[i]);color=streetCell(c)||c.type==='rail'?v>1?0xec6f61:v>.65?0xe5b361:0x6bd2b6:0x243845;}
    if(overlay==='pollution'){v=a.pollution[i]/100;this.color.setHSL(.46*(1-Math.min(1,v)),.45,.28);color=this.color.getHex();}
    if(overlay==='value'){v=a.landValue[i]/100;this.color.setHSL(.50,.40,.15+v*.4);color=this.color.getHex();}
    if(['fire','police','school','hospital'].includes(overlay)){v=a.services[overlay][i]/100;color=v>.5?0x5dd5b0:v>.15?0xc4b263:0x553c47;}
   }
   if(this.floorStyles[n]!==color){this.floorStyles[n]=color;this.floor.setColorAt(n,this.color.setHex(color));floorColours=true;}
   if(!changed.has(renderChunk(i)))return;
   if(c.plot!==null&&c.plot!==undefined&&c.plot!==i){
    if(overlay==='power'&&c.wire||overlay==='water'&&c.pipe)lines.push({tile:i,x,y,h:.13,sx:.85,sy:.03,sz:.85,color:overlay==='power'?0xffd580:0x94ddff});return;
   }
   if(isRoad(c.type)){
    const horiz=isRoad(s.cells[idx(wrapX(x-1),y)]?.type)||isRoad(s.cells[idx(wrapX(x+1),y)]?.type);
    const vert=(y>0&&isRoad(s.cells[i-SIZE]?.type))||(y<HEIGHT-1&&isRoad(s.cells[i+SIZE]?.type));
    if(horiz||!vert)add(x,y,.079,.55,.015,.025,0xc2c7b2);if(vert)add(x,y,.08,.025,.015,.55,0xc2c7b2);
   }else if(c.type==='rail'){const horiz=s.cells[idx(wrapX(x-1),y)]?.type==='rail'||s.cells[idx(wrapX(x+1),y)]?.type==='rail';for(const offset of [-.15,.15])add(x+(horiz?0:offset),y+(horiz?offset:0),.11,horiz?.9:.045,.07,horiz?.045:.9,0xb8d4df);}
   else if(['sail','shell','line'].includes(c.type)){}
   else if(c.type==='park'&&s.continuum?.gardens[i]){}
   else if(c.type==='park'){
    for(let j=0;j<3;j++){const u=x+(j-1)*.25,v=y+Math.sin(i+j)*.14;add(u,v,.24,.025,.31,.025,0x79705c,'cylinder','dark');add(u,v,.48,.35,.43,.35,[0x749764,0x97a473,0x668c70][(i+j)%3],'foliage','leaf');add(u,v,.073,.48,1,.48,0xffffff,'plane','contact');}
   }else if(false&&c.type==='solar'){
    add(x,y,.28,.82,.16,.74,0x617e94,'box','window');for(let j=-1;j<=1;j++)add(x+j*.24,y,.37,.012,.015,.65,0x8ecdf3);
   }else if(c.type==='rubble'){
    for(let j=0;j<3;j++)add(x+(j-1)*.23,y+Math.sin(i+j)*.16,.16,.22,.2,.3,0x655c64);
   }else if(c.type&&c.level&&!(s.artSample&&ATELIER_LOTS.some(p=>p.anchor===i))){
    const span=c.span||1,cx=x+(span-1)/2,cy=y+(span-1)/2,zone=zoneOf(c.type),detail=this.detailPlan.get(i)||0,far=detail<2;
    add(cx,cy,.071,span+.23,1,span+.23,0xffffff,'plane','contact');
    if(LANDMARK_TYPES.includes(c.type)||adoptedForm(c)&&detail===2){}
    else if(zone&&c.type!=='arcology'&&detail===0&&!c.fire)distantBuilding({x:cx,y:cy,c,add});
    else if(zone&&c.type!=='arcology'&&!c.fire){complexBuilding({x:cx,y:cy,c,far,occupied:c.enabled!==false&&!c.vacant&&plotMembers(s,i).some(j=>s.cells[j].pop>0||a.filled[j]>0),add,light:p=>lights.push({...p,tile:i})});}
    else if(isFacility(c.type))utilityComplex({x:cx,y:cy,c,far,add});
    else serviceBuilding({x:cx,y:cy,type:c.type,upgrade:c.upgrade||0,far,add});
    if(c.vacant)add(cx,cy+span*.43,.25,span*.20,.14,.027,0x928879,'box','dark');

   }
   if(overlay==='power'&&c.wire||overlay==='water'&&c.pipe){lines.push({tile:i,x,y,h:.13,sx:.95,sy:.025,sz:.04,color:overlay==='power'?0xffd580:0x94ddff});lines.push({tile:i,x,y,h:.13,sx:.04,sy:.025,sz:.95,color:overlay==='power'?0xffd580:0x94ddff});}
   if(c.fire)lights.push({tile:i,x,y,h:1.3,sx:.3,sy:.6,sz:.3,color:0xff763b});
  });
  if(floorColours)this.floor.instanceColor.needsUpdate=true;if(floorMatrices)this.floor.instanceMatrix.needsUpdate=true;
  const batches=new Map();for(const p of pieces){const chunk=renderChunk(p.tile),key=chunk+':'+p.shape+':'+p.role;if(!batches.has(key))batches.set(key,{chunk,list:[],material:this.cityMaterials[p.role]||this.mat,geometry:this.shapes[p.shape]||this.box});batches.get(key).list.push(p);}
  const sets=[...batches.values()];for(const chunk of changed){for(const [list,material]of [[lights.filter(p=>renderChunk(p.tile)===chunk),new THREE.MeshBasicMaterial({color:0xffffff})],[lines.filter(p=>renderChunk(p.tile)===chunk),new THREE.MeshBasicMaterial({color:0xffffff,depthTest:false,transparent:true,opacity:.9})]])sets.push({chunk,list,material});}
  for(const {chunk,list,material,geometry} of sets){
   if(!list.length){if(!this.sharedMaterials.has(material))material.dispose();continue;}const mesh=new THREE.InstancedMesh(geometry||this.box,material,list.length);
   list.forEach((p,n)=>{this.matrix(mesh,n,p.x,p.h,p.y,p.sx,p.sy,p.sz);mesh.setColorAt(n,this.color.setHex(p.color));});mesh.userData.tiles=list.map(p=>p.tile??idx(Math.round(p.x),Math.round(p.y)));list.forEach((p,n)=>{const start=this.growth.get(p.tile);if(start!==undefined&&now-start<2400&&p.role!=='contact')this.growing.push({mesh,n,p,start});});mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();mesh.castShadow=!material.isMeshBasicMaterial&&list.some(p=>this.detailPlan.get(p.tile)===2);mesh.receiveShadow=!material.isMeshBasicMaterial;this.buildings.add(mesh);this.chunkModels.get(chunk).meshes.push(mesh);
  }
  if(changed.size){this.renderer.shadowMap.needsUpdate=true;this.continuum.backdropDirty=true;this.explorer.rebuildCameraIndex();this.geometryBuilds=(this.geometryBuilds||0)+changed.size;}
 }
 addRails(){
  const rail=new THREE.InstancedMesh(this.box,new THREE.MeshStandardMaterial({color:0x9bd5dc,metalness:.5,roughness:.4}),SIZE*3);let n=0;
  for(let x=0;x<SIZE;x++)for(const y of [7.5,43.5]){this.matrix(rail,n++,x,.17,y,1.02,.045,.04);if(x%2===0)this.matrix(rail,n++,x,.11,y,.035,.22,.035);}
  rail.count=n;this.world.add(rail);
  const secondary=new THREE.InstancedMesh(this.box,new THREE.MeshStandardMaterial({color:0xc5b38d,metalness:.4,roughness:.5}),256);let k=0;
  for(let x=8;x<48;x++)for(const y of [59.5,83.5]){this.matrix(secondary,k++,x,.24,y,1.02,.055,.05);this.matrix(secondary,k++,x,-.65,y,1.02,1.1,.18);}
  for(let y=60;y<84;y++)for(const x of [7.5,47.5])this.matrix(secondary,k++,x,.24,y,.05,.055,1.02);
  secondary.count=k;secondary.computeBoundingSphere();this.world.add(secondary);this.secondaryRails=secondary;

 }
 tryPortal(manual=false){
  if(this.mode!=='walk'||performance.now()<this.portalCooldown)return false;
  const w=this.walker;const source=GATES.findIndex(i=>{const [x,y]=xy(i);return deckOf(i)===deckAt(w.v)&&Math.abs(deltaX(w.u,x-27.5))<2.6&&Math.abs(w.v-(y-27.5))<(manual?1.6:.2);});
  if(source<0)return false;
  if(!canPortal(this.state,this.analysis)){if(manual)this.cb.notice?.('晨曦之門尚未啟用。請確認巨構、兩端船塢的水電與傳送門腳下道路。');return manual;}
  const [x,y]=xy(GATES[1-source]),safe=nearestWalkable(this.state.cells,x-27.5,y-26.65);if(!safe){this.cb.notice?.('目的地沒有可站立空間。');return true;}
  this.deck=1-source;Object.assign(w,safe,{jump:0,velocity:0,yaw:0,pitch:0});this.target.set(...surface(w.u,w.v));this.portalCooldown=performance.now()+2500;this.state.orbital.travel++;
  const fade=document.getElementById('portal-flash');if(fade){fade.classList.remove('flash');void fade.offsetWidth;fade.classList.add('flash');}
  this.cb.notice?.(`已穿越晨曦之門，抵達${this.deck?'星港折臂':'曙光花園'}。`);this.cb.transit?.();this.cameraUpdate();return true;
 }
 visitGate(n=0){this.focus(GATES[n]);this.setMode('walk');const [x,y]=xy(GATES[n]),safe=nearestWalkable(this.state.cells,x-27.5,y-26.1);if(safe)Object.assign(this.walker,safe,{yaw:0,pitch:.1});this.cameraUpdate();}
 enterNearby(){
  if(this.mode!=='walk')return;if(this.tryPortal(true))return;
  let best=-1,d=1.8;for(const i of this.valid){const c=this.state.cells[i];if(deckOf(i)!==deckAt(this.walker.v)||!INTERIORS[c.type]||!c.level||c.fire)continue;const [x,y]=xy(i),distance=Math.hypot(deltaX(this.walker.u,x-27.5),this.walker.v-y+27.5);if(distance<d){best=i;d=distance;}}
  if(best>=0)this.enterInterior(best);else this.cb.notice?.('星帆巡航塔、天際長廊及居住塔有公共內部。靠近入口按 E，或在建築資訊中參訪。');
 }
 enterInterior(i){
  const c=this.state?.cells[i];if(!c||!c.level||c.fire||!INTERIORS[c.type])return false;
  const [x,y]=xy(i),doors=buildingDoors(this.state,i),door=doors.reduce((best,p)=>!best||Math.hypot(deltaX(this.walker.u,p.u),this.walker.v-p.v)<Math.hypot(deltaX(this.walker.u,best.u),this.walker.v-best.v)?p:best,null);if(this.mode==='walk'&&(deckOf(i)!==deckAt(this.walker.v)||!door||Math.hypot(deltaX(this.walker.u,door.u),this.walker.v-door.v)>1.8)){this.cb.notice?.('步行時請先靠近入口；也可切回建造視角安排參訪。');return false;}
  const safe=nearestWalkable(this.state.cells,door?.u??x-27.5,door?.v??y-26.8);if(!safe)return false;
  this.room?.dispose();this.room=c.type==='sail'?new SailInterior(this,i):c.type==='line'?new LineInterior(this,i,doors.indexOf(door)):new InteriorRoom(c.type);this.interiorTile=i;this.deck=deckOf(i);Object.assign(this.walker,safe,{jump:0,velocity:0});this.returnWalk={...this.walker};this.room.update(c,this.analysis,i,this.state.month);this.setMode('interior');return true;
 }

 setMode(mode){
  if(mode===this.mode)return;
  const oldMode=this.mode;if(oldMode==='interior'&&mode!=='interior'){this.room.dispose();this.room=null;this.target.set(...surface(this.walker.u,this.walker.v));}
  if(mode==='fly'){const [u,v]=localPoint(this.target.x,this.target.y,this.target.z,this.deck);Object.assign(this.flyer,{u:oldMode==='walk'?this.walker.u:u,v:oldMode==='walk'?this.walker.v:v,h:8});}
  if(oldMode==='fly')this.target.set(...surface(this.flyer.u,this.flyer.v));
  if(mode==='walk'){
   if(oldMode==='interior'&&this.returnWalk)this.target.set(...surface(this.returnWalk.u,this.returnWalk.v));
   if(!this.state)return;
   const [u,v]=localPoint(this.target.x,this.target.y,this.target.z,this.deck);let best=null,distance=Infinity;
   for(const i of this.valid){if(deckOf(i)!==this.deck||!isRoad(this.state.cells[i].type))continue;const [x,y]=xy(i),d=deltaX(u,x-27.5)**2+(y-27.5-v)**2;if(d<distance&&canWalk(this.state.cells,x-27.5,y-27.5)){distance=d;best={u:x-27.5,v:y-27.5};}}
   best=best||nearestWalkable(this.state.cells,u,v);if(!best){this.cb.notice?.('甲板上沒有可站立的空間，請先拆除一格建築。');return;}
   if(this.mode!=='overview'&&canWalk(this.state.cells,u,v))best={u,v};
   if(!this.visitedWalk&&['build','overview'].includes(oldMode))best=this.explorer.preferredStart(u,v,this.deck)||best;
   Object.assign(this.walker,best,{jump:0,velocity:0});this.visitedWalk=true;
  }else if(mode==='build'){
   if(['walk','interior'].includes(this.mode)){this.target.set(...surface(this.walker.u,this.walker.v));this.distance=16;}
   else if(this.mode==='overview'){this.deck=0;this.target.set(...surface(-8,-10));this.distance=37;}
   this.pitch=.84;
  }
  this.mode=mode;this.explorer.modeChanged(oldMode,mode);this.keys={};this.pointers.clear();this.start=null;this.setPreview([]);this.camera.fov=['walk','fly','interior'].includes(mode)?74:48;this.camera.updateProjectionMatrix();
  document.body.dataset.view=mode;document.querySelectorAll('[data-view-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.viewMode===mode);b.setAttribute('aria-pressed',String(b.dataset.viewMode===mode));});
  const hint=document.getElementById('view-hint');if(hint)hint.textContent=mode==='interior'?`${INTERIORS[this.state.cells[this.interiorTile].type]} · WASD 移動 · 方向鍵轉向 · E 探索／入口退出`:mode==='fly'?'WASD 飛行 · 空白上升 / C 下降 · Shift 加速 · G 返回建造':mode==='walk'?'WASD 移動 · 方向鍵／拖曳轉頭 · Space 角色能力 · E 互動 · V 人稱 · F 建造':mode==='overview'?'全站觀察 · 拖曳旋轉 · 點「建造」返回開放街區':'方向鍵轉向 · 左拖平移 · 右拖旋轉 · F 步行 / G 飛行';
  const exit=document.getElementById('interior-exit');if(exit)exit.hidden=mode!=='interior'||!!this.room?.ui;const manage=document.getElementById('interior-manage');if(manage)manage.hidden=mode!=='interior';
  this.cb.mode?.(mode);this.cameraUpdate();if(this.state)this.update(this.state,this.analysis,this.overlay);
 }
 ensureWalkable(){
  if(canWalk(this.state.cells,this.walker.u,this.walker.v))return;
  const safe=nearestWalkable(this.state.cells,this.walker.u,this.walker.v);
  if(safe){Object.assign(this.walker,safe,{jump:0,velocity:0});this.cb.notice?.('附近建築已開發，已將你移到最近的安全位置。');}
  else{this.setMode('build');this.cb.notice?.('街區沒有可站立空間，已返回建造視角。');}
 }
 permitsBuild(indices,tool){
  if(['interior','fly','overview'].includes(this.mode))return false;
  if(this.mode!=='walk'||!indices.includes(tileAt(this.walker.u,this.walker.v)))return true;
  return ['road','avenue','rail','wire','pipe','eraseWire','erasePipe','bulldoze','park'].includes(tool);
 }
 turnBuild(dt){if(!Object.keys(this.keys).length)return;turnInput(this,this.keys,dt,{orbit:true});this.cameraUpdate();}
 walk(dt){
  if(!this.state)return;turnInput(this.walker,this.keys,dt);this.explorer.walk(dt);this.cameraUpdate();
 }
 fly(dt){
  const w=this.flyer,k=this.keys;turnInput(w,k,dt);
  const forward=(k.KeyW?1:0)-(k.KeyS?1:0),side=(k.KeyD?1:0)-(k.KeyA?1:0),speed=(k.ShiftLeft||k.ShiftRight?25:9)*dt/Math.max(1,Math.hypot(forward,side));
  w.u=wrapX(w.u+28+(Math.sin(w.yaw)*forward+Math.cos(w.yaw)*side)*speed)-28;w.v=clampV(w.v+(-Math.cos(w.yaw)*forward+Math.sin(w.yaw)*side)*speed,this.deck);if(this.deck)w.u=Math.max(-19,Math.min(19,w.u));
  w.h=Math.max(1,Math.min(65,w.h+((k.Space?1:0)-(k.KeyC||k.KeyQ?1:0))*speed));this.cameraUpdate();
 }
 walkInterior(dt){
  const p=this.room.position,k=this.keys,e=this.explorer.state,before={x:p.x,z:p.z};turnInput(p,k,dt);if(this.room.step){this.room.step(dt,k);const distance=Math.hypot(p.x-before.x,p.z-before.z);e.moving=distance/Math.max(dt,.001)*.3;e.phase+=distance*3.6;if(distance>.0001)e.heading=Math.atan2(p.x-before.x,-(p.z-before.z));this.cameraUpdate();return;}const f=(k.KeyW?1:0)-(k.KeyS?1:0),side=(k.KeyD?1:0)-(k.KeyA?1:0),speed=2.3*dt/Math.max(1,Math.hypot(f,side));this.room.move((Math.sin(p.yaw)*f+Math.cos(p.yaw)*side)*speed,(-Math.cos(p.yaw)*f+Math.sin(p.yaw)*side)*speed);
  const distance=Math.hypot(p.x-before.x,p.z-before.z);e.moving=distance/Math.max(dt,.001)*.3;e.phase+=distance*3.6;if(distance>.0001){const heading=Math.atan2(p.x-before.x,-(p.z-before.z));e.heading=wrapAngle(e.heading+wrapAngle(heading-e.heading)*Math.min(1,dt*14));}this.cameraUpdate();
 }
 setupPeople(){
  this.pedBodies=new THREE.InstancedMesh(new THREE.CapsuleGeometry(.35,.6,3,8),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.85}),64);
  this.pedHeads=new THREE.InstancedMesh(new THREE.SphereGeometry(.5,10,8),new THREE.MeshStandardMaterial({color:0xd7b995,roughness:.85}),64);
  this.pedLegs=new THREE.InstancedMesh(this.box,new THREE.MeshStandardMaterial({color:0x344853}),128);
  this.pedArms=new THREE.InstancedMesh(this.box,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.85}),128);
  for(const mesh of [this.pedBodies,this.pedHeads,this.pedLegs,this.pedArms]){mesh.frustumCulled=false;mesh.count=0;this.scene.add(mesh);}
 }
 updatePeople(){
  const s=this.state,a=this.analysis,homes=this.valid.filter(i=>s.cells[i].pop>0&&a.employed[i]>0&&a.access[i].length),jobs=this.valid.filter(i=>a.filled[i]>0&&a.access[i].length),routes=[];
  const network=this.valid.filter(i=>isTransport(s.cells[i].type)||s.cells[i].type==='station').map(i=>i+':'+s.cells[i].type).join(','),signature=network+'|'+homes.map(i=>i+':'+a.access[i][0]).join(',')+'|'+jobs.map(i=>i+':'+a.access[i][0]).join(',')+'|'+Math.min(64,Math.ceil(a.stats.employed/3))+'|'+s.artSample;if(signature===this.peopleSignature)return;this.peopleSignature=signature;
  if(s.artSample){const origin=ATELIER_LOTS[0].anchor;for(const d of ATELIER_LOTS.slice(1))if(s.cells[origin].pop>0&&a.filled[d.anchor]>0){const route=roadRoute(s.cells,a.access[origin][0],a.access[d.anchor][0]);if(route.length>1)for(let j=0;j<2;j++)routes.push(route);}}
  const sampledHomes=Math.min(24,homes.length);
  for(let h=0;h<sampledHomes&&routes.length<24;h++){
   const source=homes[Math.floor(h*homes.length/sampledHomes)];for(let j=0;j<Math.min(jobs.length,12);j++){
    const target=jobs[(h+j)%jobs.length];if(deckOf(source)!==deckOf(target))continue;const path=roadRoute(s.cells,a.access[source][0],a.access[target][0]);if(path.length<2)continue;
    routes.push(path);break;
   }
  }
  const count=routes.length?Math.min(s.artSample?36:64,Math.ceil(a.stats.employed/3)):0;
  this.people=Array.from({length:count},(_,i)=>{const path=routes[i%routes.length];return {path,offset:((i*.61803398875)%1)*(path.length-1)*2};});
  this.pedBodies.count=count;this.pedHeads.count=count;this.pedLegs.count=count*2;this.pedArms.count=count*2;for(let n=0;n<count;n++){const color=new THREE.Color([0x697a83,0xd2c3ac,0x405c68,0xb2b8ad,0x8e7164,0x33434c][n%6]);this.pedBodies.setColorAt(n,color);this.pedArms.setColorAt(n*2,color);this.pedArms.setColorAt(n*2+1,color);}if(count){this.pedBodies.instanceColor.needsUpdate=true;this.pedArms.instanceColor.needsUpdate=true;}
  this.explorer.updateFleet(routes);
  const el=document.getElementById('street-count');if(el)el.textContent=`街道行人 ${count} · 代表性通勤人流`;
 }
 animatePeople(){
  this.people.forEach((person,i)=>{
   if(this.mode==='walk'&&person.u!==undefined&&this.walker.jump<.2&&Math.hypot(deltaX(this.walker.u,person.u),this.walker.v-person.v)<.62)person.offset-=(this.streetDelta||0)*.3;
   const path=person.path,length=path.length-1,progress=((this.streetClock*.3+person.offset)%(length*2)+length*2)%(length*2),reverse=progress>length,t=reverse?length*2-progress:progress,j=Math.min(length-1,Math.floor(t)),f=t-j;
   const [x,y]=xy(path[j]),[rawU,v]=xy(path[j+1]),u=x+deltaX(x,rawU),lane=i%2?.25:-.25;
   const px=x+(u-x)*f+(v-y)*lane,py=y+(v-y)*f-(u-x)*lane,bob=Math.sin(this.streetClock*9+i)*.006;
   person.u=px-27.5;person.v=py-27.5;
   if(this.isolate&&this.mode==='build'&&deckOf(path[j])!==this.deck){for(const [mesh,n]of [[this.pedBodies,i],[this.pedHeads,i],[this.pedLegs,i*2],[this.pedLegs,i*2+1],[this.pedArms,i*2],[this.pedArms,i*2+1]])this.matrix(mesh,n,px,0,py,0,0,0);return;}
   this.matrix(this.pedBodies,i,px,.155+bob,py,.065,.105,.05);this.matrix(this.pedHeads,i,px,.225+bob,py,.049,.049,.049);
   for(let k=0;k<2;k++){this.matrix(this.pedLegs,i*2+k,px+(k?-.014:.014),.087,py+Math.sin(this.streetClock*9+i+k*Math.PI)*.018,.018,.085,.020);this.matrix(this.pedArms,i*2+k,px+(k?-.032:.032),.150+bob,py-Math.sin(this.streetClock*9+i+k*Math.PI)*.016,.013,.083,.017);}
  });
  for(const mesh of [this.pedBodies,this.pedHeads,this.pedLegs,this.pedArms])mesh.instanceMatrix.needsUpdate=true;
 }
 renderActivity(){
  if(document.querySelector('dialog[open]')||document.getElementById('structure-puzzle')?.hidden===false)return 0;
  if(Object.keys(this.keys).length||this.pointers.size||this.walker.velocity||this.walker.jump>.01||this.explorer.state.cooldown>0)return 30;
  if(this.growing.length)return 20;
  if(this.simulationSpeed>0)return ['walk','fly','interior'].includes(this.mode)?12:8;
  return ['walk','fly','interior'].includes(this.mode)?12:0;
 }
 animate(now,dt){
  const blocked=!!document.querySelector('dialog[open]')||document.getElementById('structure-puzzle')?.hidden===false;if(blocked)this.keys={};
  if(['build','overview'].includes(this.mode)&&!blocked)this.turnBuild(dt);if(this.mode==='walk'&&!blocked)this.walk(dt);if(this.mode==='fly'&&!blocked)this.fly(dt);if(this.mode==='interior'&&!blocked)this.walkInterior(dt);
  this.streetDelta=blocked?0:this.simulationSpeed>0?dt*Math.min(2,this.simulationSpeed):this.mode==='walk'?dt*.65:0;this.streetClock+=this.streetDelta;
  this.animatePeople();this.explorer.animate(blocked?0:dt,this.streetDelta);if(blocked)this.explorer.state.moving=0;this.dawn.animate(this.streetDelta);this.atelier.animate(this.streetDelta);this.maglev.animate(this.streetDelta);this.continuum.animate(this.streetDelta);
  const touched=new Set();this.growing=this.growing.filter(g=>{const f=Math.min(1,Math.max(.02,(now-g.start)/2400));this.matrix(g.mesh,g.n,g.p.x,.08+(g.p.h-.08)*f,g.p.y,g.p.sx,g.p.sy*f,g.p.sz);touched.add(g.mesh);return f<1;});for(const m of touched)m.instanceMatrix.needsUpdate=true;
  for(const [i,start] of this.growth)if(now-start>=2400)this.growth.delete(i);
  const t=now*.00006;for(let i=0;i<this.ships.length;i++){const a=t+i*Math.PI*2/7,r=55;this.ships[i].position.set(Math.sin(a)*r,18+Math.sin(a*3+i)*6,Math.cos(a)*r);this.ships[i].rotation.y=a;}
  if(this.state&&this.mode!=='interior'&&this.lodDirty&&now-(this.lodTime||0)>1300)this.update(this.state,this.analysis,this.overlay);
  const location=document.getElementById('location-status');if(location&&now-(this.locationTime||0)>150){this.locationTime=now;const p=this.mode==='walk'?this.walker:this.mode==='fly'?this.flyer:null;const facing=this.mode==='interior'?this.room.position:this.mode==='walk'?this.walker:this.mode==='fly'?this.flyer:this,heading=Math.round((facing.yaw*180/Math.PI+360)%360);const compass=document.getElementById('camera-heading');if(compass)compass.textContent=heading+'°';location.textContent=this.mode==='interior'?this.room.status():p?`${district(tileAt(p.u,clampV(p.v,this.deck)))} · ${this.mode==='fly'?'高度 '+p.h.toFixed(1):(this.explorer.state.mounted?'搭乘':this.walker.jump>.03?'離地 '+this.walker.jump.toFixed(1):'步行')} · ${p.u.toFixed(1)}, ${p.v.toFixed(1)}`:'';}
  if(touched.size&&now-(this.shadowTime||0)>250){this.shadowTime=now;this.renderer.shadowMap.needsUpdate=true;}
  if(this.mode!=='interior')this.continuum.renderBackground(now);
  this.renderer.render(this.mode==='interior'?this.room.scene:this.scene,this.camera);
  const d=this.renderer.domElement.dataset;d.frames=String(this.drawCount=(this.drawCount||0)+1);d.drawCalls=String(this.renderer.info.render.calls);d.triangles=String(this.renderer.info.render.triangles);d.geometryBuilds=String(this.geometryBuilds||0);d.geometries=String(this.renderer.info.memory.geometries);d.textures=String(this.renderer.info.memory.textures);d.pixelRatio=String(this.renderer.getPixelRatio());d.quality=this.quality.tier;d.renderPixels=String(this.renderer.domElement.width*this.renderer.domElement.height);d.fullDetail=String([...this.detailPlan?.values()||[]].filter(n=>n===2).length);d.antialias=String(this.renderer.getContext().getContextAttributes().antialias);
 }
}
