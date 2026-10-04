import * as T from '../YorktownPreview/three.module.js';
import {makeSailTower,makeShellHall} from './structure/landmarks.mjs';
import {makeGarden} from './structure/ring-scene.mjs';
import {createLabMaterials} from './structure/materials.mjs';
import {makeBuilder,v,tree} from './structure/geometry.mjs';
import {xy,deckOf,zoneOf} from './catalog.mjs';
import {placeOnDeck} from './dawn-scene.mjs';
import {LINE} from './continuum.mjs';
import {batchStaticArchitecture} from './static-batch.mjs';

// Legacy showcase models no longer override merged district branch buildings.
export function adoptedForm(){return null;}
export function lineAppearance(camera,halfLength,width=40){
 const outside=Math.abs(camera.x)>width+.2||Math.abs(camera.z)>halfLength+.2||camera.y>120;
 const side=outside&&Math.abs(camera.x)/(width+1)>Math.abs(camera.z)/(halfLength+1)*1.12;
 return {outside,side};
}
function makeLine(m,l,target){
 const root=new T.Group(),body=new T.Group(),rim=new T.Group(),walls=new T.Group();root.add(body,rim,walls);const b=makeBuilder(m,body),r=makeBuilder(m,rim),L=l.segments*40;
 // Open end faces reveal a real cross-section: six public streets, pods and lift cores.
 b.box(0,-1.2,0,80,2.4,L,'ivoryCool');b.box(0,.10,0,78,.18,L-.6,'stone');
 for(let f=0;f<6;f++){
  const y=f*20;b.box(0,y-.45,0,78,.90,L-.8,'floor');
  for(const x of [-26,26]){b.box(x,y+6.2,0,22,12.4,L-4,f%2?'ivoryWarm':'ivoryCool');b.box(x,y+6.4,0,22.2,9.3,L-4.1,'teal');for(let z=-L/2+5;z<L/2-3;z+=8){b.box(x,y+.15,z,22.8,.25,7.5,'champagne');for(let k=0;k<3;k++)b.box(x,y+2+k*3.0,z,23,.15,7.4,'ivory');b.box(x,y+6,z,.16,12,.22,'steel');}}
  b.box(0,y+.08,0,6,.12,L-5,'black');for(const x of [-3.15,3.15])b.box(x,y+.13,0,.08,.15,L-5,'champagne');
  for(let z=-L/2+10;z<L/2-6;z+=20){b.box(0,y+.16,z,1.9,.03,.3,'warmDim');for(const x of [-11,11]){b.box(x,y+.8,z,5,1.6,4,'ivoryWarm');tree(b,x,y+1.65,z,3.8,(f+Math.floor(z/20))%4);}}
  for(const z of [-L/2+5,L/2-5]){b.box(0,y-.05,z,78,.25,5,'ivory');for(const x of [-7,7]){b.box(x,y+1,z,1.2,2.1,1.0,'steel');b.box(x,y+1.5,z-.55,1.0,.65,.08,'screen');}}
 }
 for(let z=-L/2;z<=L/2;z+=10){for(const x of [-39,39])r.box(x,60,z,.28,120,.3,'champagne');r.box(0,119.7,z,78,.36,.5,'ivory');}
 for(const z of [-L/2,L/2]){
  for(const x of [-38.5,38.5])r.box(x,60,z,2.2,120,2.8,'ivory');r.box(0,119,z,78,2,2.8,'ivory');
  for(let f=0;f<6;f++){r.box(0,f*20+13.7,z,76,.25,.8,'champagne');for(const x of [-17,17])r.box(x,f*20+5.6,z,.32,11.2,.45,'steel');}
  r.box(0,5.6,z,14,11.2,.23,'clear');for(const x of [-7.2,7.2])r.box(x,5.6,z,.30,11.8,.7,'champagne');
 }
 for(const x of [-38.8,38.8])r.box(x,119.4,0,1.7,.45,L,'deepGlass');
 const panels=[];for(const side of [-1,1]){
  const mat=new T.ShaderMaterial({uniforms:{backdrop:{value:target.texture},tint:{value:new T.Vector3(.018,.038,.044)},side:{value:side}},vertexShader:'varying vec4 screenPosition; varying vec2 panelUV; void main(){panelUV=uv;screenPosition=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=screenPosition;}',fragmentShader:`uniform sampler2D backdrop;uniform vec3 tint;varying vec4 screenPosition;varying vec2 panelUV;void main(){vec2 uv=screenPosition.xy/screenPosition.w*.5+.5;vec3 c=texture2D(backdrop,uv).rgb;float seam=step(.989,fract(panelUV.x*80.))*step(.94,fract(panelUV.y*18.));c=mix(c,c*.95+tint,.40)+seam*.014;gl_FragColor=vec4(c,1.);\n#include <colorspace_fragment>\n}`,side:T.DoubleSide,toneMapped:false});
  // A flat screen projects the scene behind the long side. End faces are never sampled.
  const plane=new T.Mesh(new T.PlaneGeometry(L,120),mat);plane.rotation.y=side*Math.PI/2;plane.position.set(side*39.25,60,0);walls.add(plane);panels.push(plane);
 }
 b.finish();r.finish();root.scale.setScalar(1/LINE.metresPerTile);
 const train=new T.Group(),tb=makeBuilder(m,train);tb.box(0,1.1,0,3.4,2.2,11,'ivory');tb.box(0,1.25,0,3.47,.85,10.5,'deepGlass');tb.box(0,.34,0,3.6,.35,11.2,'champagne');tb.finish();body.add(train);train.position.z=-L/2+10;
 return {root,body,rim,walls,panels,train,length:L,localScale:1/LINE.metresPerTile};
}
export class ContinuumScene{
 constructor(view){this.view=view;this.assets=createLabMaterials(view.renderer,view.scene);this.m=this.assets.m;this.models=new Map();this.pickables=[];this.clock=0;this.backdropDirty=true;this.target=new T.WebGLRenderTarget(640,360,{depthBuffer:true});this.root=new T.Group();view.scene.add(this.root);}
 create(s,i,c){
  this.backdropDirty=true;
  const outer=new T.Group(),[x,y]=xy(i);let model,offsetX=((c.span||1)-1)/2,offsetY=offsetX;
  if(c.type==='sail'){model=makeSailTower(this.m);model.root.scale.setScalar(.12);outer.add(model.root);}
  else if(c.type==='shell'){model={root:makeShellHall(this.m)};model.root.scale.setScalar(.103);outer.add(model.root);}
  else if(c.type==='line'){const l=s.continuum.lines.find(l=>l.anchor===i);model=makeLine(this.m,l,this.target);const dims=l.axis==='x'?[l.segments*2,4]:[4,l.segments*2];offsetX=(dims[0]-1)/2;offsetY=(dims[1]-1)/2;model.root.rotation.y=l.axis==='x'?Math.PI/2:0;outer.add(model.root);}
  else if(c.type==='park'){const g=s.continuum.gardens[i];model={root:makeGarden(this.m,g)};model.root.scale.setScalar(g.span/32.7);outer.add(model.root);}
  if(c.type==='sail'||c.type==='shell')batchStaticArchitecture(model.root);
  placeOnDeck(outer,x+offsetX-27.5,y+offsetY-27.5,.065);outer.userData.tile=i;outer.traverse(o=>{if(o.isMesh){o.userData.tile=i;this.pickables.push(o);}});this.root.add(outer);return {...model,outer,signature:this.signature(s,i,c)};
 }
 signature(s,i,c){const garden=s.continuum?.gardens[i];return `${c.type}:${c.level}:${c.lineSegments}:${c.span}:${garden?.stage}:${Math.round((garden?.health||1)*5)}:${c.fire}`;}
 remove(model){
  this.backdropDirty=true;
  this.root.remove(model.outer);const owned=new Set(Object.values(this.m)),sharedTextures=new Set(),geometries=new Set(),materials=new Set(),textures=new Set();
  for(const m of owned)for(const value of Object.values(m))if(value?.isTexture)sharedTextures.add(value);
  model.outer.traverse(o=>{if(o.isMesh){if(o.isInstancedMesh)o.dispose();geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(!owned.has(m))materials.add(m);}});
  for(const m of model.root.userData.ownedMaterials||[])materials.add(m);
  for(const g of geometries)g.dispose();for(const m of materials){for(const value of Object.values(m))if(value?.isTexture&&!sharedTextures.has(value))textures.add(value);m.dispose();}
  // Garden health variants borrow the original leaf textures; only private label maps are released.
  for(const texture of textures)texture.dispose();
 }
 update(s,a){
  const wanted=new Set();for(let i=0;i<s.cells.length;i++){const c=s.cells[i];if(c.subplot||!c.level||c.fire)continue;if(!['sail','shell','line'].includes(c.type)&&!(c.type==='park'&&s.continuum?.gardens[i]))continue;wanted.add(i);let model=this.models.get(i),sig=this.signature(s,i,c);if(!model||model.signature!==sig){if(model)this.remove(model);model=this.create(s,i,c);this.models.set(i,model);}model.outer.visible=!(this.view.isolate&&this.view.mode==='build'&&deckOf(i)!==this.view.deck);model.online=c.enabled!==false&&a.operational[i]>.75;}
  for(const [i,m]of this.models)if(!wanted.has(i)){this.remove(m);this.models.delete(i);}
  this.pickables=[...this.models.values()].flatMap(m=>{const p=[];m.outer.traverse(o=>{if(o.isMesh)p.push(o);});return p;});
 }
 animate(dt){this.clock+=dt;for(const m of this.models.values())if(m.train&&m.online)m.train.position.z=Math.sin(this.clock*.15)*(m.length/2-12);}
 renderBackground(now=performance.now()){
  const lines=[...this.models.values()].filter(m=>m.walls&&m.outer.visible);if(!lines.length)return;
  this.root.updateMatrixWorld(true);let active=false;for(const m of lines){const local=m.root.worldToLocal(this.view.camera.position.clone()),appearance=lineAppearance(local,m.length/2);m.walls.visible=appearance.side;m.body.visible=!appearance.side;active||=appearance.side;}
  if(!active)return;
  const renderer=this.view.renderer,size=renderer.getSize(new T.Vector2()),w=Math.min(this.view.quality?.tier==='still'?1280:640,Math.round(size.x*renderer.getPixelRatio())),h=Math.max(1,Math.round(w*size.y/Math.max(1,size.x)));if(this.target.width!==w||this.target.height!==h){this.target.setSize(w,h);this.backdropDirty=true;}
  this.view.camera.updateMatrixWorld();const key=[...this.view.camera.matrixWorld.elements,...this.view.camera.projectionMatrix.elements].map(n=>n.toFixed(4)).join(',');
  const moved=key!==this.backdropKey;if(!this.backdropDirty&&!moved&&(!this.view.simulationSpeed||now-(this.backdropTime||0)<1000))return;
  if(!this.backdropDirty&&now-(this.backdropTime||0)<120)return;
  const visible=lines.map(m=>m.outer.visible),oldTarget=renderer.getRenderTarget(),oldAuto=renderer.shadowMap.autoUpdate,oldNeeds=renderer.shadowMap.needsUpdate;
  try{lines.forEach(m=>m.outer.visible=false);renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;renderer.setRenderTarget(this.target);renderer.render(this.view.scene,this.view.camera);this.backdropKey=key;this.backdropTime=now;this.backdropDirty=false;}finally{renderer.setRenderTarget(oldTarget);renderer.shadowMap.autoUpdate=oldAuto;renderer.shadowMap.needsUpdate=oldNeeds;lines.forEach((m,i)=>m.outer.visible=visible[i]);}
 }
}
