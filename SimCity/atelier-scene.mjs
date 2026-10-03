import {adoptedForm} from './continuum-scene.mjs';
import * as T from '../YorktownPreview/three.module.js';
import {surface} from './habitat.mjs';
import {placeOnDeck} from './dawn-scene.mjs';
import {ATELIER_LOTS} from './atelier-plan.mjs';
import {makeAtelierMaterials} from './atelier-materials.mjs';
import {GATES} from './orbital.mjs';
import {xy} from './catalog.mjs';
import {foliageGeometry} from './evolution-materials.mjs';
import {zoneBuilding} from './architecture.mjs';
import {stageHeight} from './evolution.mjs';

const V=p=>new T.Vector3(...p);
function roundedShape(w,d,r){r=Math.min(r,w/2-.001,d/2-.001);const s=new T.Shape(),x=-w/2,y=-d/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+d-r);s.quadraticCurveTo(x+w,y+d,x+w-r,y+d);s.lineTo(x+r,y+d);s.quadraticCurveTo(x,y+d,x,y+d-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
function gateShape(ro,ri,cy=7.2){const s=new T.Shape();s.moveTo(-ro,0);s.lineTo(-ro,cy);s.absarc(0,cy,ro,Math.PI,0,true);s.lineTo(ro,0);s.lineTo(ri,0);s.lineTo(ri,cy);s.absarc(0,cy,ri,0,Math.PI,false);s.lineTo(-ri,0);s.closePath();return s;}
class Parts{
 constructor(materials){this.m=materials;this.cache=new Map();this.box=new T.BoxGeometry(1,1,1);this.cyl=new T.CylinderGeometry(1,1,1,32);this.leaf=foliageGeometry();this.sphere=new T.SphereGeometry(1,20,12);}
 geometry(key,fn){if(!this.cache.has(key))this.cache.set(key,fn());return this.cache.get(key);}
 mesh(g,geo,mat,p=[0,0,0],s=[1,1,1]){const mesh=new T.Mesh(geo,typeof mat==='string'?this.m[mat]:mat);mesh.position.set(...p);mesh.scale.set(...s);mesh.castShadow=!mesh.material.transparent;mesh.receiveShadow=!mesh.material.transparent;g.add(mesh);return mesh;}
 b(g,p,s,m='ivory'){return this.mesh(g,this.box,m,p,s);}
 c(g,p,s,m='titanium'){return this.mesh(g,this.cyl,m,p,s);}
 round(g,p,w,d,h,r=.2,m='ivory'){const geo=this.geometry(`slab${w},${d},${h},${r}`,()=>{const geo=new T.ExtrudeGeometry(roundedShape(w,d,r),{depth:h,bevelEnabled:false,curveSegments:8});geo.rotateX(-Math.PI/2);geo.translate(0,-h/2,0);return geo;});return this.mesh(g,geo,m,p);}
 beam(g,a,b,r=.025,m='gold'){const av=V(a),bv=V(b),d=bv.clone().sub(av);const mesh=this.c(g,av.add(bv).multiplyScalar(.5).toArray(),[r,d.length(),r],m);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return mesh;}
 tube(g,points,r=.03,m='gold'){const curve=new T.CatmullRomCurve3(points.map(V));return this.mesh(g,new T.TubeGeometry(curve,48,r,8,false),m);}
 torus(g,p,r,t=.025,m='gold'){const geo=this.geometry(`torus${r},${t}`,()=>new T.TorusGeometry(r,t,8,64));const mesh=this.mesh(g,geo,m,p);mesh.rotation.x=Math.PI/2;return mesh;}
 rail(g,y,w,d,r=.3){
  const shape=roundedShape(w,d,r),hole=new T.Path();hole.curves=roundedShape(w-.055,d-.055,Math.max(.02,r-.027)).curves;shape.holes.push(hole);
  const glass=this.geometry(`rail${w},${d},${r}`,()=>{const geo=new T.ExtrudeGeometry(shape,{depth:.16,bevelEnabled:false,curveSegments:8});geo.rotateX(-Math.PI/2);return geo;});this.mesh(g,glass,'clear',[0,y,0]);
  const line=roundedShape(w,d,r).getPoints(64).map(p=>new T.Vector3(p.x,0,-p.y));this.mesh(g,this.geometry(`railcap${w},${d},${r}`,()=>new T.TubeGeometry(new T.CatmullRomCurve3(line,true),96,.009,5,true)),'gold',[0,y+.17,0]);
  for(const z of [-d/2,d/2])for(let x=-w/2+r;x<=w/2-r+.01;x+=.48)this.b(g,[x,y+.09,z],[.012,.18,.012],'titanium');
 }
 tree(g,x,y,z,size=.7,seed=0){this.c(g,[x,y+size*.34,z],[size*.045,size*.65,size*.045],'bark');for(let j=0;j<32;j++){const a=j*2.4+seed,rad=size*(.10+(j%5)*.043);this.mesh(g,this.leaf,j%3?'leaf':'leaf2',[x+Math.cos(a)*rad,y+size*(.64+(j%7)*.046),z+Math.sin(a)*rad],[size*(.32+(j%3)*.025),size*.35,size*.32]);}for(let j=0;j<4;j++){const a=j*1.7+seed;this.beam(g,[x,y+size*.38,z],[x+Math.cos(a)*size*.22,y+size*.7,z+Math.sin(a)*size*.22],size*.019,'bark');}}
 planter(g,x,y,z,w=.75,d=.3){this.round(g,[x,y+.05,z],w,d,.1,.06,'porcelain');this.round(g,[x,y+.104,z],w-.04,d-.04,.009,.04,'soil');for(let k=0;k<5;k++)this.mesh(g,this.leaf,k%2?'leaf':'leaf2',[x+(k-2)*w/5,y+.18,z+Math.sin(k)*.035],[w*.3,.23,d*.85]);}
 label(g,text,p,w=.8){const cv=document.createElement('canvas');cv.width=1024;cv.height=192;const c=cv.getContext('2d');c.fillStyle='#344e56';c.font='500 65px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(text,512,96);const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;const mat=new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:T.DoubleSide,toneMapped:false});return this.mesh(g,new T.PlaneGeometry(w,w*192/1024),mat,p);}
 batch(g){
  for(const c of [...g.children])if(c.isGroup&&!c.userData.dynamic)this.batch(c);
  const sets=new Map();for(const child of g.children)if(child.isMesh&&!child.isInstancedMesh&&!child.userData.dynamic){const k=child.geometry.uuid+child.material.uuid;if(!sets.has(k))sets.set(k,[]);sets.get(k).push(child);}
  for(const meshes of sets.values())if(meshes.length>=3){const batch=new T.InstancedMesh(meshes[0].geometry,meshes[0].material,meshes.length);meshes.forEach((mesh,n)=>{mesh.updateMatrix();batch.setMatrixAt(n,mesh.matrix);g.remove(mesh);});batch.castShadow=meshes[0].castShadow;batch.receiveShadow=meshes[0].receiveShadow;batch.computeBoundingSphere();g.add(batch);}
 }
}

export class AtelierScene{
 constructor(view){
  this.view=view;this.clock=0;const assets=makeAtelierMaterials(view.renderer,view.scene);this.assets=assets;
  for(const name of ['ivory','titanium','gold','dark','glass']){const target=view.dawn.m[name],source=assets.m[name==='glass'?'window':name];target.color.copy(source.color);target.roughness=source.roughness;target.metalness=source.metalness;target.map=source.map;target.roughnessMap=source.roughnessMap;target.normalMap=source.normalMap;target.normalScale=source.normalScale;target.envMapIntensity=.65;target.needsUpdate=true;}
  this.p=new Parts(assets.m);this.root=new T.Group();view.scene.add(this.root);this.models=new Map();this.landmarks=new Map();this.pickables=[];this.dynamic=[];
  for(const def of ATELIER_LOTS){const group=new T.Group();group.userData.tile=def.anchor;placeOnDeck(group,def.x-27.5,def.y-27.5,.065);this.root.add(group);const body=new T.Group();body.name='mature';group.add(body);this[def.key](body);this.addEvolution(group,def);this.p.batch(group);group.traverse(m=>{if(m.isMesh){m.userData.tile=def.anchor;this.pickables.push(m);}});this.models.set(def.key,group);}
  this.streets();this.makeGate();this.p.batch(this.landscape);this.setupLight();this.addSky();this.addCloudPlanetDetail();
 }
 addEvolution(g,def){
  const p=this.p,stages=new Map();g.userData.stages=stages;
  for(let level=1;level<=4;level++){
   const sub=new T.Group();sub.name='stage'+level;g.add(sub);stages.set(level,sub);
   zoneBuilding({h:stageHeight({type:def.type,level}),zone:def.type,level,far:false,occupied:true,add:(x,z,y,w,h,d,color,shape='box',role='ivory')=>{const geometry=shape==='cylinder'?p.cyl:shape==='foliage'?p.leaf:p.box;const scale=shape==='cylinder'?.5:1;p.mesh(sub,geometry,role,[x*4,y*4,z*4],[w*4*scale,h*4,d*4*scale]);}});
  }
  for(let stage=6;stage<=8;stage++){
   const sub=new T.Group();sub.name='addition'+stage;g.add(sub);stages.set(stage,sub);
   if(def.key==='residence'){
    if(stage===6){for(const x of [-1.12,1.02])p.b(sub,[x,8.84,-.34],[.07,.78,.07],'titanium');p.round(sub,[0,9.25,-.3],3.22,2.45,.07,.32);p.rail(sub,9.29,3.1,2.33,.30);p.planter(sub,-.91,9.3,.42,.62,.29);p.tree(sub,-.91,9.35,.42,.56,2);p.round(sub,[.49,9.3,-.35],.94,.94,.03,.22,'dark');p.b(sub,[.49,9.33,-.35],[.42,.01,.04],'porcelain');}
    if(stage===7){p.round(sub,[-.55,10.14,-.48],1.3,1.28,1.58,.22,'window');for(let j=0;j<6;j++)p.round(sub,[-.55,9.4+j*.29,-.48],1.46,1.44,.038,.24);p.round(sub,[-.55,11.07,-.48],1.65,1.58,.06,.28);p.planter(sub,.3,9.4,.59,.6,.25);}
    if(stage===8){p.round(sub,[-.55,11.76,-.48],.83,.86,1.28,.16,'glass');p.round(sub,[-.55,12.44,-.48],1.42,1.38,.065,.24);for(const x of [-1.18,.08])p.tube(sub,[[x,8.34,-1.12],[x,10.2,-1.12],[x,12.28,-.94],[-.55,12.74,-.48]],.032,'titanium');p.tree(sub,-.18,11.11,.04,.4,3);}
   }else if(def.key==='commerce'){
    if(stage===6){p.round(sub,[0,9,-.34],3.1,1.9,.07,.23);p.round(sub,[0,9.16,-.34],2.88,1.63,.30,.19,'glass');p.round(sub,[0,9.34,-.34],3.13,1.93,.055,.22);p.planter(sub,.3,9.38,.35,.64,.25);}
    if(stage===7){p.round(sub,[.85,11.46,-.65],.86,1.19,2.1,.15,'window');for(let j=0;j<7;j++)p.round(sub,[.85,10.48+j*.3,-.65],.90,1.24,.023,.16,'titanium');p.round(sub,[.85,12.56,-.65],1.1,1.44,.06,.2);p.b(sub,[.85,13.0,-.65],[.02,.84,.02],'gold');}
    if(stage===8){p.round(sub,[-.15,13.27,-.44],2.62,1.92,.085,.5);p.round(sub,[-.15,13.65,-.44],1.4,1.22,.72,.22,'glass');p.round(sub,[-.15,14.06,-.44],1.95,1.68,.06,.45);for(const x of [-1.29,1.03])p.beam(sub,[x,10.2,-.44],[x,13.32,-.44],.045,'porcelain');p.b(sub,[-.15,14.6,-.44],[.016,1.02,.016],'gold');}
   }else{
    if(stage===6){p.round(sub,[-.34,4.18,-.24],2.7,2.68,.065,.28);p.round(sub,[-.34,4.57,-.24],2.19,2.09,.72,.18,'glass');p.round(sub,[-.34,4.98,-.24],2.67,2.62,.06,.25);for(const x of [-1.59,.91])p.b(sub,[x,3.37,-.24],[.055,1.6,.055],'titanium');}
    if(stage===7){for(const x of [-.94,.24]){p.round(sub,[x,5.86,-.26],.72,1.14,1.66,.14,'window');for(let j=0;j<6;j++)p.b(sub,[x,5.11+j*.29,-.26],[.79,.029,1.23],'titanium');}p.round(sub,[-.35,6.74,-.26],2.3,1.65,.08,.24);}
    if(stage===8){for(const x of [-1.33,1.34])p.b(sub,[x,4.64,-1.4],[.10,8.5,.10],'titanium');p.b(sub,[0,8.86,-1.4],[2.93,.14,.14],'gold');p.b(sub,[0,8.85,-.26],[.13,.14,2.4],'titanium');p.b(sub,[0,8.19,.85],[.015,1.3,.015],'gold');p.round(sub,[-.35,7.11,-.26],1.42,1.17,.65,.18,'glass');p.round(sub,[-.35,7.48,-.26],1.93,1.55,.07,.26);}
   }
  }
 }
 setupLight(){const v=this.view;v.scene.background.set(0x738991);v.scene.fog.color.set(0xc5cfca);v.scene.fog.density=.00035;v.renderer.toneMappingExposure=.91;v.renderer.shadowMap.enabled=true;v.renderer.shadowMap.type=T.PCFSoftShadowMap;v.renderer.shadowMap.autoUpdate=false;v.renderer.shadowMap.needsUpdate=true;
  v.scene.children.filter(x=>x.isAmbientLight).forEach(l=>l.intensity=.16);v.scene.children.filter(x=>x.isHemisphereLight).forEach(l=>{l.intensity=.95;l.color.set(0xc0e0ef);l.groundColor.set(0x939b80);});
  const lights=v.scene.children.filter(x=>x.isDirectionalLight),sun=lights[0];sun.intensity=2.65;sun.color.set(0xffe0ad);sun.position.set(-30,48,30);sun.target.position.set(0,1,1);v.scene.add(sun.target);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-32,right:32,top:30,bottom:-26,near:1,far:140});sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.00015;sun.shadow.normalBias=.018;sun.shadow.radius=2;lights[1].intensity=.72;v.floor.receiveShadow=true;v.mat.envMapIntensity=.55;
 }
 residence(g){const p=this.p;
  p.round(g,[0,.06,0],4.75,4.55,.12,.5,'stone');p.round(g,[0,.38,0],3.85,3.75,.6,.45,'window');
  p.round(g,[0,.78,0],4.6,4.4,.17,.6);p.round(g,[0,.91,0],4.35,4.1,.08,.6,'gold');
  for(let x=-1.55;x<=1.6;x+=.52){p.b(g,[x,.42,1.87],[.045,.64,.08]);p.b(g,[x,.45,1.91],[.36,.48,.012],'clear');p.b(g,[x,.22,1.73],[.24,.13,.10],'wood');}
  p.round(g,[0,.70,2.03],1.5,.85,.07,.25);p.label(g,'AURELIA · RESIDENCES',[0,.60,2.02],1.50);
  for(let j=0;j<18;j++){const y=1.02+j*.40,step=j<6?0:j<12?1:2,w=4.2-step*.56,d=3.72-step*.45,shift=step*.16;
   const floor=new T.Group();floor.position.set(-shift,y,-shift*.6);g.add(floor);
   p.round(floor,[0,.16,0],w-.72,d-.65,.32,.22,'glass');p.round(floor,[0,.035,0],w-.68,d-.61,.035,.22,'dark');p.round(floor,[0,0,0],w,d,.055,.38,'porcelain');p.round(floor,[0,-.052,0],w-.13,d-.13,.012,.34,'gold');
   for(const z of [-(d-.78)/2,(d-.78)/2])for(let x=-(w-.85)/2+.15;x<(w-.85)/2;x+=.4){p.b(floor,[x,.16,z],[.022,.32,.025],'titanium');if((j+Math.round(x*10))%3===0)p.b(floor,[x+.1,.18,z*.99],[.06,.19,.012],'warm');}
   if(j%2===0){p.rail(floor,.065,w-.08,d-.08,.56);p.planter(floor,-w*.27,.075,d*.38,.72,.24);p.planter(floor,w*.27,.075,-d*.37,.62,.25);}
   if(j===5||j===11){p.tree(floor,w*.32,.1,d*.27,.62,j);p.tree(floor,-w*.32,.1,-d*.27,.53,j+2);}
  }
  p.round(g,[-.32,8.32,-.2],3.0,2.65,.07,.3);p.b(g,[.8,8.42,-.85],[.44,.15,.4],'titanium');p.round(g,[-.32,8.54,-.2],1.82,1.55,.33,.42,'glass');p.round(g,[-.32,8.77,-.2],2.35,2.1,.11,.53,'porcelain');p.planter(g,.72,8.4,.7,.85,.35);
  for(let j=0;j<7;j++){p.b(g,[-1.1+j*.25,8.98,-.4],[.055,.045,1.6],'gold');}p.tree(g,-1.0,8.38,.6,.6,4);
  for(const x of [-1.94,1.94]){p.planter(g,x,.13,1.85,.44,.65);p.tree(g,x,.2,1.85,.7,3+x);}
 }
 commerce(g){const p=this.p;
  p.round(g,[0,.08,0],4.8,4.55,.16,.45,'stone');p.round(g,[0,.5,0],4.3,3.9,.77,.44,'window');p.round(g,[0,.99,0],4.7,4.25,.18,.6);
  for(let x=-1.8;x<1.9;x+=.36){p.b(g,[x,.48,1.97],[.026,.7,.04],'gold');p.b(g,[x,.85,1.96],[.24,.026,.024],'warm');}
  p.round(g,[0,1.45,-.5],3.8,2.8,.78,.45,'glass');p.round(g,[0,1.9,-.5],4.12,3.13,.13,.5);p.rail(g,1.05,4.5,4.05,.5);
  // Two offset blades create a recognisable commercial skyline rather than a single box.
  const towers=[{x:-.70,z:-.25,w:1.45,d:1.8,h:10.7},{x:.85,z:-.65,w:1.10,d:1.5,h:8.2}];
  for(const t of towers){p.round(g,[t.x,1.98+t.h/2,t.z],t.w,t.d,t.h,.23,'window');
   for(let j=0;j<t.h/.25;j++){const y=2.05+j*.25;p.round(g,[t.x,y,t.z],t.w+.045,t.d+.045,.021,.24,'titanium');if(j%4===0)p.b(g,[t.x,y+.13,t.z+t.d/2+.005],[t.w*.76,.024,.009],'warm');}
   for(let k=0;k<=6;k++){const x=t.x-t.w/2+k*t.w/6;for(const z of [t.z-t.d/2,t.z+t.d/2])p.b(g,[x,2+t.h/2,z],[.016,t.h,.028],'titanium');}
   for(const side of [-1,1]){p.tube(g,[[t.x+side*(t.w/2+.18),.7,1.55],[t.x+side*(t.w/2+.12),2.1,t.z+.8],[t.x+side*(t.w/2+.06),t.h+1.6,t.z+.55],[t.x+side*.12,t.h+2.3,t.z-.3]],.07,'porcelain');}
   p.round(g,[t.x,t.h+2.02,t.z],t.w+.2,t.d+.2,.12,.25);p.b(g,[t.x,t.h+2.35,t.z],[.027,.65,.027],'gold');
  }
  p.round(g,[.08,6.0,-.25],3.5,2.75,.17,.45);p.round(g,[.08,6.2,-.25],3.05,2.35,.35,.42,'glass');p.round(g,[.08,6.47,-.25],3.52,2.78,.1,.48);p.planter(g,-1.4,6.10,.48,.46,.8);p.planter(g,1.48,6.12,.40,.38,.7);
  p.round(g,[0,1.01,2.03],2.7,.95,.08,.35);p.label(g,'MERIDIAN · EXCHANGE',[0,.77,2.05],1.65);
  for(const x of [-1.65,1.65]){p.tree(g,x,1.12,1.30,.8,5+x);p.planter(g,x,1.10,1.3,.72,.7);}
 }
 industry(g){const p=this.p;
  p.round(g,[0,.08,0],4.8,4.55,.16,.35,'stone');p.round(g,[-.5,.23,.2],3.35,3.5,.16,.25,'dark');p.b(g,[-.5,.87,-1.49],[3.35,1.56,.16],'ivory');for(const x of [-2.10,1.10])p.b(g,[x,.87,.2],[.14,1.56,3.4],'ivory');p.round(g,[-.5,1.70,.2],3.55,3.65,.15,.33,'titanium');p.round(g,[-.5,1.83,.2],3.64,3.73,.07,.4,'porcelain');
  // Floor-to-ceiling process gallery; the production modules remain visible from the street.
  p.b(g,[-.5,.85,1.965],[3.02,1.16,.025],'clear');
  for(let j=0;j<8;j++){const x=-1.85+j*.39;p.b(g,[x,.85,2.0],[.035,1.21,.09],'titanium');p.b(g,[x,.27,2.02],[.24,.08,.04],'gold');}
  for(let j=0;j<3;j++){const x=-1.54+j*.92;p.c(g,[x,1,1.77],[.24,.60,.24],'titanium');p.torus(g,[x,1.22,1.77],.21,.02,'cyan');p.b(g,[x,1.48,1.95],[.55,.024,.022],'cyan');}
  for(let k=0;k<4;k++){p.b(g,[-1.7+k*.78,.45,.55],[.44,.30,.6],'titanium');p.b(g,[-1.7+k*.78,.74,.55],[.3,.27,.3],'gold');p.b(g,[-1.7+k*.78,.96,.55],[.16,.17,.16],'cyan');}p.b(g,[-.5,1.50,1.5],[2.9,.025,.04],'warm');
  for(const x of [1.34,1.94]){p.c(g,[x,1.73,-.65],[.26,3.1,.26],'titanium');for(const y of [.32,1.6,2.9])p.torus(g,[x,y,-.65],.28,.035,'gold');p.c(g,[x,3.29,-.65],[.32,.17,.32],'porcelain');p.b(g,[x,1.75,-.35],[.047,2.7,.014],'cyan');}
  p.c(g,[-.52,2.62,-.25],[.96,1.5,.96],'glass');p.c(g,[-.52,3.41,-.25],[1.14,.13,1.14],'porcelain');p.c(g,[-.52,1.96,-.25],[1.2,.14,1.2],'titanium');
  for(let j=0;j<16;j++){const a=j*Math.PI/8;p.b(g,[-.52+Math.cos(a),2.67,-.25+Math.sin(a)],[.045,1.35,.045],'porcelain');}
  const rotor=new T.Group();rotor.userData.dynamic=true;rotor.position.set(-.52,3.62,-.25);g.add(rotor);p.torus(rotor,[0,0,0],.77,.028,'gold');for(let k=0;k<3;k++){const blade=p.b(rotor,[0,0,0],[1.35,.04,.14],'titanium');blade.rotation.y=k*Math.PI/3;}this.dynamic.push({object:rotor,kind:'rotor'});
  p.c(g,[-.52,3.87,-.25],[.20,.35,.20],'cyan');
  for(let k=0;k<7;k++){p.b(g,[-1.8+k*.43,1.99,1.2],[.20,.08,.62],'dark');for(let j=0;j<4;j++)p.b(g,[-1.8+k*.43,2.045,.95+j*.16],[.21,.017,.035],'titanium');}
  for(const z of [-1.6,-1.3])p.tube(g,[[-1.8,2.1,z],[.1,2.1,z],[.7,2.3,z],[1.35,2.3,z],[1.35,1.1,z]],.045,'gold');
  p.round(g,[-.5,1.7,2.14],3.65,.50,.065,.12);p.label(g,'AURORA · FABRICATION',[-.5,1.5,2.025],2.0);
  for(const x of [-2.15,2.15])p.planter(g,x,.16,1.6,.35,.95);
  const robot=new T.Group();robot.userData.dynamic=true;robot.position.set(.1,.3,2.22);g.add(robot);p.b(robot,[0,.07,0],[.35,.14,.21],'titanium');p.b(robot,[0,.17,0],[.22,.07,.17],'porcelain');p.b(robot,[0,.19,.11],[.14,.018,.012],'cyan');this.dynamic.push({object:robot,kind:'carrier'});
 }
 streets(){const p=this.p;this.landscape=new T.Group();this.root.add(this.landscape);
  const local=(x,y,h=0)=>{const g=new T.Group();placeOnDeck(g,x-27.5,y-27.5,h);this.landscape.add(g);return g;};
  // Curvature is retained by using short surface-following modules rather than a flat slab.
  for(let x=18;x<=42;x++){for(const y of [31,32,37,38]){const g=local(x,y,.086);p.b(g,[0,0,0],[1.005,.04,1.005],'stone');}
   for(const y of [33,36.8]){const g=local(x,y,.09);p.b(g,[0,.03,0],[1.005,.10,.24],'porcelain');p.b(g,[0,.09,0],[1,.014,.026],'gold');}
   if(x%2===0){const g=local(x,31.4,.10);p.b(g,[0,.10,0],[.52,.055,.20],'wood');for(const dx of [-.19,.19])p.b(g,[dx,.05,0],[.025,.1,.17],'titanium');}
  }
  this.waterMaterial=new T.ShaderMaterial({transparent:true,uniforms:{time:{value:0}},vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 p;uniform float time;void main(){float a=sin(p.x*32.+p.z*18.+time*.7)*sin(p.x*17.-p.z*30.+time*.4);float b=pow(max(0.,a),9.);vec3 col=mix(vec3(.055,.29,.33),vec3(.23,.53,.55),a*.3+.5)+vec3(.75,.8,.7)*b*.22;gl_FragColor=vec4(col,.96);}'});
  for(let x=20;x<=40;x++){const g=local(x,35,.115);p.b(g,[0,0,0],[1.004,.02,2.66],this.waterMaterial);}
  for(const x of [26,36])for(let y=33;y<=37;y++){const g=local(x,y,.16);p.b(g,[0,0,0],[1.9,.08,1.04],'stone');for(const dx of [-.92,.92]){p.b(g,[dx,.13,0],[.022,.21,1.02],'clear');p.b(g,[dx,.25,0],[.025,.015,1.04],'gold');}}
  for(let x=19;x<=41;x+=2){const g=local(x,38,.14);p.planter(g,0,0,0,1.10,.74);p.tree(g,0,.11,0,.80,x);}
  for(const x of [19,26,33,40]){const g=local(x,32,.1);p.c(g,[0,.66,0],[.025,1.32,.025],'titanium');p.b(g,[0,1.33,0],[.38,.045,.12],'gold');p.b(g,[0,1.304,0],[.31,.012,.09],'warm');p.b(g,[0,.90,0],[.22,.35,.03],'dark');p.label(g,'Y',[0,.93,.02],.14);}
  // Street markings, recessed drainage and a planted threshold create a coherent human scale.
  for(let x=13;x<=42;x++){const g=local(x,30,.078);p.b(g,[0,0,.39],[1.01,.006,.018],'gold');p.b(g,[0,0,-.39],[1.01,.006,.018],'gold');if(x%2)p.b(g,[0,.001,0],[.30,.008,.012],'porcelain');}
  for(const x of [22,29,36]){const g=local(x,30,.084);for(let j=0;j<7;j++)p.b(g,[0,.005,-.32+j*.106],[.7,.008,.04],'porcelain');}
  // Intentionally open approach to the portal: no collider hidden in the entrance.
  for(let x=9;x<=16;x++)for(let y=27;y<=30;y++){const g=local(x,y,.078);p.b(g,[0,0,0],[1.01,.016,1.01],'stone');}
  for(const x of [8.2,16.6]){const g=local(x,28.2,.12);p.planter(g,0,0,0,.65,1.7);p.tree(g,0,.12,0,1.20,x);}
  this.canalLights=[];for(const x of [21,24,29,32,39]){const g=local(x,33.4,.11);p.b(g,[0,0,0],[.1,.025,.13],'warm');}
 }
 makeGate(){const p=this.p,g=new T.Group();
  const extrude=(ro,ri,depth,z,m,bevel=.03)=>{const geo=new T.ExtrudeGeometry(gateShape(ro,ri),{depth,bevelEnabled:bevel>0,bevelSegments:2,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:48});geo.translate(0,0,z-depth/2);return p.mesh(g,geo,m);};
  extrude(3.60,2.78,1.16,0,'titanium');extrude(3.55,2.87,.16,.64,'porcelain');extrude(3.55,2.87,.16,-.64,'porcelain');
  extrude(3.41,3.33,.05,.745,'gold',.008);extrude(3.04,2.96,.05,.75,'gold',.008);extrude(2.90,2.87,.04,.78,'warm',.004);
  extrude(3.31,3.08,.07,.712,'gold',.010);
  for(const x of [-3.2,3.2]){
   p.round(g,[x,.16,0],1.38,2.35,.32,.3,'stone');p.round(g,[x,.37,0],1.06,1.85,.20,.24,'titanium');
   for(let j=0;j<23;j++){const y=.62+j*.28;p.b(g,[x,y,.744],[.30,.22,.016],j%4?'titanium':'window');p.b(g,[x,y+.08,.76],[.23,.017,.016],'gold');if(j%3===0)p.b(g,[x,y,.772],[.19,.024,.016],'warm');}
   p.b(g,[x,.86,.92],[.46,.7,.10],'dark');p.label(g,'01',[x,.88,.98],.30);
  }
  for(let j=0;j<=28;j++){const a=j*Math.PI/28,mid=3.20,beam=p.b(g,[Math.cos(a)*mid,7.2+Math.sin(a)*mid,.745],[.42,.07,.04],'titanium');beam.rotation.z=a;
   if(j%2===0){const pane=p.b(g,[Math.cos(a)*mid,7.2+Math.sin(a)*mid,.776],[.26,.025,.01],'warm');pane.rotation.z=a;}}
  for(const z of [-.38,.38]){for(const side of [-1,1])for(let j=0;j<12;j++)p.b(g,[side*3.57,.6+j*.55,z],[.10,.22,.20],'gold');}
  const fieldShape=new T.Shape();fieldShape.moveTo(-2.78,.13);fieldShape.lineTo(2.78,.13);fieldShape.lineTo(2.78,7.2);fieldShape.absarc(0,7.2,2.78,0,Math.PI,false);fieldShape.lineTo(-2.78,.13);
  const mat=new T.ShaderMaterial({side:T.DoubleSide,transparent:true,depthWrite:false,uniforms:{time:{value:0},enabled:{value:1}},vertexShader:'varying vec2 p;void main(){p=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 p;uniform float time;uniform float enabled;void main(){float rim=pow(abs(p.x)/2.8,12.);float ripple=pow(.5+.5*sin(p.y*24.-time*1.2+sin(p.x*5.)),18.);float scan=exp(-pow((mod(p.y-time*.12,10.)-5.)*3.,2.));gl_FragColor=vec4(.65,.86,.83,(.024+rim*.20+ripple*.025+scan*.065)*enabled);}'});
  const field=p.mesh(g,new T.ShapeGeometry(fieldShape,48),mat,[0,0,0]);field.userData.dynamic=true;field.castShadow=false;field.receiveShadow=false;g.userData.field=field;
  p.b(g,[0,.09,0],[5.55,.023,.06],'cyan');p.label(g,'DAWN GATE  /  YORKTOWN',[0,10.93,.63],2.5);
  this.p.batch(g);this.gate=g;const [x,y]=xy(GATES[0]);placeOnDeck(g,x-27.5,y-27.5);this.originalGate=this.view.dawn.gates[0];this.originalGate.parent.remove(this.originalGate);this.view.dawn.root.add(g);this.view.dawn.gates[0]=g;
 }
 addSky(){
  const sky=new T.Mesh(new T.SphereGeometry(690,48,24),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 p;void main(){vec3 d=normalize(p);float y=d.y;vec3 c=mix(vec3(.56,.66,.69),vec3(.055,.14,.20),smoothstep(-.14,.85,y));float haze=pow(max(0.,dot(d,normalize(vec3(-.55,.35,-.8)))),14.);c+=haze*vec3(.27,.19,.09);float band=pow(max(0.,1.-abs(d.x*.6+d.y*.8-.15)),22.);float wisps=.5+.5*sin(d.x*22.+sin(d.z*19.)*3.);c+=band*wisps*vec3(.035,.038,.035);gl_FragColor=vec4(c,1.);}`}));sky.renderOrder=-10;this.view.scene.add(sky);
 }
 addCloudPlanetDetail(){
  // A procedural cloud layer adds scale without fetching a backdrop image.
  const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{sun:{value:new T.Vector3(-.7,.6,.5).normalize()}},vertexShader:'varying vec3 n;varying vec3 p;void main(){p=position;n=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 p;varying vec3 n;uniform vec3 sun;float h(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1)),f.x),f.y),f.z);}void main(){vec3 q=p*.07;float f=noise(q)*.52+noise(q*2.1)*.26+noise(q*4.3)*.14+noise(q*8.7)*.08;float a=smoothstep(.42,.69,f)*.80;float l=.65+.35*max(0.,dot(normalize(n),sun));gl_FragColor=vec4(mix(vec3(.75,.82,.85),vec3(1.,.90,.74),max(0.,dot(normalize(n),sun)))*l,a);}`});
  const mesh=new T.Mesh(new T.SphereGeometry(191,80,48),mat);mesh.position.set(80,-230,-330);this.view.dawn.root.add(mesh);
 }
 updateLandmarks(s,a){
  const types={aurelia:'residence',meridian:'commerce',aurora:'industry'},wanted=new Set();
  s.cells.forEach((c,i)=>{const form=adoptedForm(c),key=types[c.type]||form;if(!key||c.subplot||!c.level)return;wanted.add(i);let group=this.landmarks.get(i);if(form&&this.view.detailPlan?.get(i)!==2){if(group)group.visible=false;return;}
   if(!group||group.userData.type!==c.type||group.userData.signature!==`${c.type}:${c.branch}:${c.level}:${c.span}`){if(group){this.view.scene.remove(group);group.traverse(m=>{if(m.isInstancedMesh)m.dispose();});}
    group=new T.Group();const model=this.models.get(key).getObjectByName('mature').clone(true);model.visible=true;group.add(model);if(form){for(let stage=6;stage<=Math.min(8,c.level);stage++){const addon=this.models.get(key).getObjectByName('addition'+stage);if(addon){const clone=addon.clone(true);clone.visible=true;group.add(clone);}}group.scale.setScalar((c.span||1)/5);}group.userData.signature=`${c.type}:${c.branch}:${c.level}:${c.span}`;group.userData.type=c.type;group.userData.tile=i;const [x,y]=xy(i);placeOnDeck(group,x+((c.span||5)-1)/2-27.5,y+((c.span||5)-1)/2-27.5,.065);group.traverse(m=>{if(m.isMesh){m.userData.tile=i;this.pickables.push(m);}});this.view.scene.add(group);this.landmarks.set(i,group);
   }
   group.visible=(!form||this.view.detailPlan?.get(i)===2)&&!(this.view.isolate&&this.view.mode==='build'&&this.view.deck!==(Math.floor(i/536)>=60?1:0));group.userData.online=a.operational[i]>.5&&c.enabled!==false;
  });
  for(const [i,g] of this.landmarks)if(!wanted.has(i)){this.view.scene.remove(g);g.visible=false;g.traverse(m=>{if(m.isInstancedMesh)m.dispose();});this.landmarks.delete(i);}
  this.pickables=this.pickables.filter(m=>{let p=m;while(p?.parent)p=p.parent;return p===this.view.scene;});
 }
 update(s,a){this.updateLandmarks(s,a);this.state=s;this.analysis=a;this.root.visible=!!s.artSample&&!(this.view.isolate&&this.view.mode==='build'&&this.view.deck===1);for(const def of ATELIER_LOTS){const group=this.models.get(def.key),cell=s.cells[def.anchor];group.visible=!!s.artSample&&cell.type===def.type&&cell.level>0;const on=a.operational[def.anchor]>.5&&cell.enabled!==false&&!cell.fire;
   group.getObjectByName('mature').visible=cell.level>=5;for(const [stage,sub] of group.userData.stages)sub.visible=stage<5?cell.level===stage:cell.level>=stage;group.userData.online=on;group.traverse(mesh=>{if(mesh.isMesh){const material=mesh.userData.originalMaterial||mesh.material;mesh.userData.originalMaterial=material;if(material===this.p.m.warm||material===this.p.m.cyan)mesh.material=on?material:this.p.m.off;}});
  }
 }
 animate(dt){this.clock+=dt;for(const g of this.landmarks.values())if(g.visible&&g.userData.online)g.traverse(m=>{if(m.userData.dynamic&&m.children.length>3)m.rotation.y+=dt*.28;});if(!this.root.visible)return;const t=this.clock;this.waterMaterial.uniforms.time.value=t;const online=this.models.get('industry').userData.online;
  if(online)for(const d of this.dynamic){if(d.kind==='rotor')d.object.rotation.y+=dt*.28;if(d.kind==='carrier')d.object.position.x=Math.sin(t*.3)*1.1-.5;}
 }
}
