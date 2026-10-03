import * as THREE from '../YorktownPreview/three.module.js';
import {surface,frame} from './habitat.mjs';
import {xy} from './catalog.mjs';
import {GATES,PROJECTS,orbitalReport} from './orbital.mjs';

// All geometry is local and reusable; no downloaded textures or cinematic video backdrop.
const V=a=>new THREE.Vector3(...a);
export function deckQuaternion(u,v){const f=frame(u,v);return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(f.tangent),V(f.up),V(f.side)));}
export function placeOnDeck(object,u,v,h=0){object.position.set(...surface(u,v,h));object.quaternion.copy(deckQuaternion(u,v));}
export class DawnScene{
 constructor(scene){
  this.scene=scene;this.root=new THREE.Group();scene.add(this.root);this.clock=0;
  this.m={ivory:new THREE.MeshStandardMaterial({color:0xeee9d9,roughness:.42,metalness:.32}),titanium:new THREE.MeshStandardMaterial({color:0xb5c6cb,roughness:.32,metalness:.65}),gold:new THREE.MeshStandardMaterial({color:0xc4a16a,roughness:.32,metalness:.65}),dark:new THREE.MeshStandardMaterial({color:0x243c50,roughness:.4,metalness:.45}),glass:new THREE.MeshStandardMaterial({color:0x75bdcf,roughness:.18,metalness:.6}),cyan:new THREE.MeshBasicMaterial({color:0x8ddbe0}),warm:new THREE.MeshBasicMaterial({color:0xf0d5a4}),leaf:new THREE.MeshStandardMaterial({color:0x739a79,roughness:.95})};
  this.box=new THREE.BoxGeometry(1,1,1);this.cylinder=new THREE.CylinderGeometry(1,1,1,32);this.sphere=new THREE.SphereGeometry(1,18,12);
  this.createBackdrop();this.createHarbour();
  this.gates=GATES.map(i=>{const [x,y]=xy(i),group=this.makeGate();placeOnDeck(group,x-27.5,y-27.5);this.root.add(group);return group;});
  this.lift=this.makeLift();placeOnDeck(this.lift,7,30,0);this.root.add(this.lift);
  this.citadel=this.makeCitadel();this.citadel.position.set(15,33,-7);this.citadel.rotation.y=-.35;this.root.add(this.citadel);
  this.visitor=this.makeShip(1);this.root.add(this.visitor);
  this.freighters=Array.from({length:2},(_,n)=>{const ship=this.makeShip(.12);ship.userData.deck=n;this.root.add(ship);return ship;});
  this.blueprints=[];for(const [name,obj]of [['arch',this.gates[0]],['lift',this.lift],['citadel',this.citadel]]){const pad=new THREE.Mesh(new THREE.TorusGeometry(name==='arch'?2:5,.04,5,60),new THREE.MeshBasicMaterial({color:0x89a9b8,transparent:true,opacity:.35}));pad.position.copy(obj.position);pad.quaternion.copy(obj.quaternion);pad.rotateX(Math.PI/2);this.root.add(pad);this.blueprints.push({name,pad});}
  this.batchStaticParts(this.root);
 }
 batchStaticParts(group){
  for(const child of [...group.children])if(child.isGroup)this.batchStaticParts(child);
  const sets=new Map();for(const child of group.children)if(child.isMesh&&!child.isInstancedMesh){const key=child.geometry.uuid+child.material.uuid;if(!sets.has(key))sets.set(key,[]);sets.get(key).push(child);}
  for(const meshes of sets.values())if(meshes.length>2){const batch=new THREE.InstancedMesh(meshes[0].geometry,meshes[0].material,meshes.length);meshes.forEach((mesh,n)=>{mesh.updateMatrix();batch.setMatrixAt(n,mesh.matrix);group.remove(mesh);});batch.computeBoundingSphere();group.add(batch);}
 }
 setGlow(group,on){group.traverse(mesh=>{if(mesh.isMesh&&(mesh.material===this.m.cyan||mesh.material===this.m.warm))mesh.visible=on;});}
 mesh(parent,geometry,material,pos,scale=[1,1,1]){const m=new THREE.Mesh(geometry,this.m[material]||material);m.position.set(...pos);m.scale.set(...scale);parent.add(m);return m;}
 boxAt(g,p,s,m='ivory'){return this.mesh(g,this.box,m,p,s);}
 cyl(g,p,s,m='ivory'){return this.mesh(g,this.cylinder,m,p,s);}
 ball(g,p,s,m='glass'){return this.mesh(g,this.sphere,m,p,s);}
 tube(g,points,r=.1,m='ivory'){return this.mesh(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(V)),48,r,8,false),m,[0,0,0]);}
 ring(g,r,t,p,m='gold',rotate=true){const mesh=this.mesh(g,new THREE.TorusGeometry(r,t,8,80),m,p);if(rotate)mesh.rotation.x=Math.PI/2;return mesh;}
 createBackdrop(){
  // A large lit planet with bands and a soft outer atmosphere supplies depth behind the station.
  const planet=new THREE.Group();planet.position.set(80,-230,-330);this.root.add(planet);
  const material=new THREE.ShaderMaterial({uniforms:{light:{value:new THREE.Vector3(-.65,.75,.5).normalize()}},vertexShader:`varying vec3 n;varying vec3 p;void main(){n=normalize(mat3(modelMatrix)*normal);p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 n;varying vec3 p;uniform vec3 light;void main(){float bands=sin(p.y*.16+sin(p.x*.027)*5.+sin(p.z*.045)*2.);float clouds=smoothstep(.15,.92,bands);vec3 c=mix(vec3(.18,.36,.44),vec3(.79,.85,.81),clouds*.85);float sun=max(dot(normalize(n),light),0.);gl_FragColor=vec4(c*(.5+sun*.8),1.);}`});
  this.mesh(planet,new THREE.SphereGeometry(190,80,48),material,[0,0,0]);
  const atmosphere=new THREE.ShaderMaterial({transparent:true,side:THREE.BackSide,depthWrite:false,vertexShader:`varying vec3 normalV;varying vec3 eye;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);normalV=normalize(normalMatrix*normal);eye=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,fragmentShader:`varying vec3 normalV;varying vec3 eye;void main(){float rim=pow(1.-abs(dot(normalize(normalV),normalize(eye))),3.);gl_FragColor=vec4(.42,.72,.9,rim*.24);}`});
  this.mesh(planet,new THREE.SphereGeometry(194,64,40),atmosphere,[0,0,0]);
  const sunMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:`varying vec2 uvV;void main(){uvV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 uvV;void main(){float d=length(uvV-.5)*2.;float a=pow(max(0.,1.-d),4.)*.65;gl_FragColor=vec4(1.,.76,.46,a);}`});
  const glow=this.mesh(this.root,new THREE.PlaneGeometry(240,240),sunMat,[-260,180,-440]);glow.lookAt(0,0,0);
 }
 createHarbour(){
  // Fixed empty docking fingers reserve airspace without consuming city lots.
  for(const n of [0,1]){
   const g=new THREE.Group();placeOnDeck(g,-13.5,n?31:-22);this.root.add(g);
   this.boxAt(g,[0,-.4,-2],[7,.7,10],'titanium');this.boxAt(g,[0,.04,-2],[6.7,.08,9.7]);
   for(const x of [-2.9,2.9]){this.boxAt(g,[x,.3,-2],[.1,.65,10],'gold');this.boxAt(g,[x,.65,-2],[.14,.05,10],'cyan');}
   for(let i=0;i<6;i++){this.boxAt(g,[0,.1,-6+i*1.5],[4,.025,.045],'gold');}
   this.boxAt(g,[0,.1,4.5],[2,.18,3],'titanium');
  }
  // More generous lower-city waterfront; small terraces, trees and repeated arcades.
  for(let x=5;x<45;x+=2){const g=new THREE.Group();placeOnDeck(g,x-27.5,-20.3);this.root.add(g);this.boxAt(g,[0,-.22,0],[1.95,.38,1.9],'ivory');this.boxAt(g,[0,.04,0],[1.6,.05,1.5],'glass');this.boxAt(g,[0,.19,-.8],[1.9,.055,.06],'gold');if(x%4===1){this.cyl(g,[0,.45,.4],[.06,.85,.06],'titanium');this.ball(g,[0,.96,.4],[.35,.46,.32],'leaf');}}
 }
 makeGate(){const g=new THREE.Group();
  const path=[];for(let j=0;j<=40;j++){const t=Math.PI-j/40*Math.PI;path.push([Math.cos(t)*3.2,7.2+Math.sin(t)*3.2,0]);}
  this.tube(g,[[-3.2,0,0],[-3.2,4,0],...path,[3.2,4,0],[3.2,0,0]],.34,'ivory');
  this.tube(g,[[-3.2,.1,.27],[-3.2,4,.27],...path.map(p=>[p[0],p[1],.27]),[3.2,4,.27],[3.2,.1,.27]],.07,'gold');
  for(const x of [-3.2,3.2]){this.boxAt(g,[x,.4,0],[1.2,.8,1.7],'titanium');for(let y=.9;y<7.1;y+=.5)this.boxAt(g,[x,y,.34],[.46,.065,.09],'gold');}
  this.boxAt(g,[0,.065,0],[5.7,.03,.14],'cyan');
  const field=this.mesh(g,new THREE.PlaneGeometry(5.65,6.8),new THREE.ShaderMaterial({side:THREE.DoubleSide,transparent:true,depthWrite:false,uniforms:{time:{value:0},enabled:{value:1}},vertexShader:`varying vec2 p;void main(){p=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 p;uniform float time;uniform float enabled;void main(){float edge=pow(abs(p.x-.5)*2.,6.);float wave=sin(p.y*90.-time*3.+sin(p.x*14.))*.5+.5;gl_FragColor=vec4(.5,.91,1.,(.06+edge*.35+wave*.045)*enabled);}`}),[0,3.5,0]);g.userData.field=field;return g;
 }
 makeLift(){const g=new THREE.Group();
  this.cyl(g,[0,.4,0],[4,.8,4],'titanium');this.cyl(g,[0,1,0],[3.6,.6,3.6]);this.cyl(g,[0,2.3,0],[2.2,2,2.2],'glass');this.ring(g,2.4,.11,[0,3.4,0]);
  for(const x of [-1.25,1.25]){this.boxAt(g,[x,12,0],[.4,24,.7]);this.boxAt(g,[x-.22,12,.43],[.055,23,.055],'cyan');}
  for(let y=3;y<23;y+=2)this.boxAt(g,[0,y,0],[2.5,.14,.35],'titanium');
  for(let y=3.7;y<23;y+=.48)for(const x of [-1.25,1.25]){this.boxAt(g,[x,y,.366],[.3,.025,.018],'titanium');if(Math.round(y*10)%3===0)this.boxAt(g,[x,y,-.366],[.28,.18,.022],'dark');}
  for(let j=0;j<20;j++){const a=j*Math.PI/10;this.boxAt(g,[Math.cos(a)*3.65,.95,Math.sin(a)*3.65],[.07,.7,.07],'titanium');}
  this.cyl(g,[0,24,0],[5.3,.6,3.4],'titanium');this.cyl(g,[0,24.5,0],[4.9,.5,3.15]);this.boxAt(g,[6,24.3,0],[8,.3,2]);
  for(let j=0;j<22;j++){const a=j*Math.PI/11;this.boxAt(g,[Math.cos(a)*4.4,24.95,Math.sin(a)*2.8],[.035,.32,.035],'titanium');}const cabin=new THREE.Group();this.boxAt(cabin,[0,0,0],[2.1,1.8,1.9],'glass');this.boxAt(cabin,[0,1,0],[2.3,.14,2.1]);this.boxAt(cabin,[0,-1,0],[2.3,.14,2.1],'gold');g.add(cabin);g.userData.cabin=cabin;return g;
 }
 makeCitadel(){const g=new THREE.Group();
  this.cyl(g,[0,0,0],[7.5,.7,4.5],'titanium');this.cyl(g,[0,.45,0],[7.2,.2,4.2]);this.cyl(g,[0,-.8,0],[4.8,1.2,2.9],'dark');
  for(let j=0;j<12;j++){const t=j/12*Math.PI*2,x=Math.cos(t)*5,z=Math.sin(t)*2.7,h=1.7+(j%4)*.6;this.boxAt(g,[x,h/2+.55,z],[.8,h,.65]);for(let y=.8;y<h;y+=.35)this.boxAt(g,[x,y+.5,z+.34],[.65,.035,.015],'warm');this.ball(g,[x*.7,.9,z*.7],[.25,.4,.25],'leaf');}
  for(const x of [-2,0,2]){const h=x===0?9:5.4;this.boxAt(g,[x,h/2+.5,0],[1.1,h,1.25],'glass');for(const dx of [-.65,.65])this.boxAt(g,[x+dx,h/2+.5,0],[.12,h,1.4]);this.boxAt(g,[x,h+.5,0],[1.5,.2,1.5],'gold');}
  for(const x of [-2,0,2]){const h=x===0?9:5.4;for(let y=.8;y<h;y+=.23)this.boxAt(g,[x,y,0],[1.18,.023,1.33],'titanium');for(const dx of [-.44,-.22,0,.22,.44])this.boxAt(g,[x+dx,h/2+.5,.64],[.016,h,.025],'titanium');}
  for(let j=0;j<36;j++){const a=j*Math.PI/18;this.boxAt(g,[Math.cos(a)*6.85,.65,Math.sin(a)*3.92],[.034,.30,.034],'gold');}
  this.ring(g,4.2,.17,[0,3.5,0],'ivory');this.ring(g,4.05,.04,[0,3.5,0],'cyan');
  for(const x of [-5.7,5.7]){this.cyl(g,[x,-1.1,0],[.6,1.5,.6],'titanium');this.cyl(g,[x,-1.9,0],[.5,.08,.5],'cyan');}
  return g;
 }
 makeShip(scale){const g=new THREE.Group();g.scale.setScalar(scale);
  const hull=this.mesh(g,new THREE.CapsuleGeometry(2.25,21,10,24),'ivory',[0,0,0]);hull.rotation.z=Math.PI/2;hull.scale.z=.68;
  this.boxAt(g,[0,1.7,0],[16,.9,2.1],'titanium');this.boxAt(g,[-2,2.6,0],[5,1.2,1.5],'glass');this.boxAt(g,[-3,3.4,0],[4,.16,1.8]);
  for(let x=-10;x<10;x+=1.3){for(const z of [-1.53,1.53]){this.boxAt(g,[x,.6,z],[.66,.09,.045],'warm');this.boxAt(g,[x,-.4,z],[.66,.055,.045],'cyan');}const rib=this.ring(g,2.25,.035,[x,0,0],'gold',false);rib.rotation.y=Math.PI/2;rib.scale.y=.75;}
  for(const z of [-2.7,2.7]){this.boxAt(g,[5,0,z/2],[8,.4,3],'titanium');const pod=this.cyl(g,[6.5,0,z],[.9,9,.9],'titanium');pod.rotation.z=Math.PI/2;const rim=this.ring(g,.83,.14,[11,0,z],'gold',false);rim.rotation.y=Math.PI/2;const engine=this.cyl(g,[11.1,0,z],[.68,.08,.68],'cyan');engine.rotation.z=Math.PI/2;}
  for(let x=-7;x<=7;x+=2)this.boxAt(g,[x,-1.5,0],[.4,.7,1.8],'dark');
  // Layered hull plating, recessed equipment and bridge glazing imply a much larger vessel.
  for(let k=0;k<27;k++){const x=-8.9+k*.66;for(const side of [-1,1]){
   this.boxAt(g,[x,.02,side*1.59],[.56,.60,.038],k%5===0?'dark':'titanium');
   this.boxAt(g,[x,-.31,side*1.62],[.57,.033,.06],'gold');
   for(const y of [.89,1.08,1.27])this.boxAt(g,[x,y,side*1.40],[.31,.045,.025],k%4?'glass':'warm');
  }this.boxAt(g,[x,1.99,0],[.56,.035,1.60],'ivory');if(k%3===0){this.boxAt(g,[x,2.07,.49],[.29,.12,.33],'dark');this.boxAt(g,[x,2.07,-.49],[.29,.12,.33],'dark');}}
  for(const side of [-1,1]){this.boxAt(g,[-2,2.71,side*.766],[4.75,.13,.025],'dark');for(let k=0;k<12;k++)this.boxAt(g,[-4.2+k*.38,2.80,side*.79],[.022,.41,.026],'titanium');for(let k=0;k<18;k++)this.boxAt(g,[2.6+k*.44,.64,side*2.7],[.22,.065,1.28],'titanium');}
  const front=this.ball(g,[-11,0,0],[2.2,1.7,1.3],'glass');this.boxAt(g,[-5,3.2,0],[.05,3,.05],'gold');return g;
 }
 update(s,a){this.state=s;this.report=orbitalReport(s,a);for(const gate of this.gates){gate.visible=s.orbital.projects.arch.built;gate.userData.field.material.uniforms.enabled.value=this.report.online.arch?1:0;}
  this.lift.visible=s.orbital.projects.lift.built;this.citadel.visible=s.orbital.projects.citadel.built;this.visitor.visible=this.report.visitorPresent;this.setGlow(this.lift,this.report.online.lift);this.setGlow(this.citadel,this.report.online.citadel);
  for(const {name,pad}of this.blueprints)pad.visible=!s.orbital.projects[name].built;
 }
 animate(dt){this.clock+=dt;if(!this.state)return;const t=this.clock;
  for(const g of this.gates)g.userData.field.material.uniforms.time.value=t;
  this.lift.userData.cabin.position.y=this.report.online.lift?3+(Math.sin(t*.2)*.5+.5)*19:3;
  this.citadel.position.y=33+Math.sin(t*.3)*.15;
  if(this.state.artSample)this.visitor.position.set(-23+Math.sin(t*.08)*.18,26,-30);else this.visitor.position.set(-13+Math.sin(t*.08)*.18,12,-32);this.visitor.rotation.set(.08,Math.PI*.07,-.06);
  this.freighters.forEach((ship,n)=>{const active=this.state.orbital.orders.find(o=>o.deck===n&&o.status==='shipping');ship.visible=!!active;const f=(t*.07+n*.5)%1;const p=surface(-13+f*18,n?29:-24,1+f*11);ship.position.set(...p);ship.quaternion.copy(deckQuaternion(-13,n?29:-24));});
 }
}
