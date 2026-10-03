import * as T from '../../YorktownPreview/three.module.js';
import {v,makeBuilder,curvePoints,tree} from './geometry.mjs';
import {STOREY,FLOOR_NAMES} from './interior-plan.mjs';
import {placard} from './materials.mjs';
export function makeInteriorScene(m,plan){
 const root=new T.Group(),b=makeBuilder(m,root),gates={},rings=[],valves=[];
 for(const s of plan.surfaces){
  if(s.ramp){const n=30;for(let k=0;k<n;k++){const z=-8+(k+.5)*16/n,t=s.direction===1?1-(k+.5)/n:(k+.5)/n;b.box((s.x0+s.x1)/2,s.y+t*STOREY-.10,z,s.x1-s.x0,.20,16/n+.015,'ivoryWarm');b.box((s.x0+s.x1)/2,s.y+t*STOREY+.012,z-.16,2.8,.025,.035,'champagne');}
   for(const x of [10.55,13.72]){const pts=curvePoints(t=>v(x,s.y+t*STOREY+1.05,s.direction===1?8-t*16:-8+t*16),30);b.tube(pts,.043,'champagne');for(let k=0;k<=8;k++){const t=k/8,z=s.direction===1?8-16*t:-8+16*t;b.cylinder(x,s.y+t*STOREY+.55,z,.042,1.08,.042,'steel');}}
  }else{
   b.box((s.x0+s.x1)/2,s.y-.13,(s.z0+s.z1)/2,s.x1-s.x0,.26,s.z1-s.z0,s.id==='treasure-island'?'ivoryWarm':'floor');
   if(s.level>0){b.box((s.x0+s.x1)/2,s.y-.25,(s.z0+s.z1)/2,s.x1-s.x0,.035,s.z1-s.z0,'champagne');}
  }
 }
 for(const w of plan.walls){
  if(w.id==='furniture')continue;
  if(w.condition){const mesh=new T.Mesh(new T.BoxGeometry(w.w,w.h,w.d),m.screen);mesh.position.set(w.x,w.y+w.h/2,w.z);root.add(mesh);gates[w.condition]=mesh;continue;}
  if(w.id==='balustrade'||w.id==='stair-rail'){
   const alongX=w.w>w.d;b.box(w.x,w.y+.54,w.z,w.w,.035,w.d,'champagne');b.box(w.x,w.y+1.05,w.z,w.w+.04,.07,w.d+.04,'titanium');
   const n=Math.ceil(Math.max(w.w,w.d)/1.45);for(let k=0;k<=n;k++)b.cylinder(w.x+(alongX?(k/n-.5)*w.w:0),w.y+.54,w.z+(!alongX?(k/n-.5)*w.d:0),.052,1.04,.052,'steel');
   const pane=new T.Mesh(new T.BoxGeometry(Math.max(.035,w.w-.08),.88,Math.max(.035,w.d-.08)),m.clear);pane.position.set(w.x,w.y+.55,w.z);root.add(pane);
  }else if(w.id==='outside'){
   b.box(w.x,w.y+.43,w.z,w.w,.86,w.d,'ivoryWarm');b.box(w.x,w.y+3.68,w.z,w.w,.43,w.d,'ivory');
   const pane=new T.Mesh(new T.BoxGeometry(w.w,2.6,w.d*.44),m.clear);pane.position.set(w.x,w.y+2.2,w.z);root.add(pane);
   const alongX=w.w>w.d,n=Math.max(1,Math.ceil(Math.max(w.w,w.d)/1.8));for(let k=0;k<=n;k++)b.box(w.x+(alongX?(k/n-.5)*w.w:0),w.y+2.24,w.z+(!alongX?(k/n-.5)*w.d:0),alongX?.065:.16,3.65,alongX?.16:.065,'steel');
  }else if(w.id==='pool'){
   b.box(w.x,.26,w.z,w.w,.52,w.d,'ivoryWarm');b.box(w.x,.55,w.z,w.w-.28,.055,w.d-.28,'water');
  }else{
   b.box(w.x,w.y+w.h/2,w.z,w.w,w.h,w.d,w.level===2?'ivoryCool':w.level===4?'ivoryWarm':'ivory');
   b.box(w.x,w.y+.12,w.z,w.w+.08,.12,w.d+.08,'copper');b.box(w.x,w.y+3.45,w.z,w.w+.055,.07,w.d+.055,'champagne');
  }
 }
 // The atrium remains vertically open across all six levels.
 for(const x of [-4.6,4.6])for(const z of [-5.6,5.6]){
  const pts=curvePoints(t=>v(x+Math.sin(t*Math.PI)*.55,1+t*26,z+Math.sin(t*Math.PI)*.35),50);b.tube(pts,.16,'ivoryCool');b.tube(pts.map(p=>v(p.x+.20,p.y,p.z)),.035,'gold');
  for(let f=1;f<6;f++)b.beam(v(x,f*STOREY-.6,z),v(x*1.3,f*STOREY+2,z*1.4),.10,'steel');
 }
 for(let f=0;f<6;f++){
  const y=f*STOREY;
  // Different rooms have their own furniture, displays and service details.
  for(const z of [-9,9])b.box(0,y+.018,z,9.6,.025,.055,'copper');
  for(const x of [-6.5,6.5])for(const z of [-9.8,9.8]){b.cylinder(x,y+1.2,z,.10,2.4,.10,'champagne');b.sphere(x,y+2.45,z,.50,.32,.5,'warmDim');}
  const floorSign=placard(`${f+1}F / ${FLOOR_NAMES[f]}`,'PUBLIC ROUTE',3.0,1.2);floorSign.position.set(5.3,y+2.45,10.9);root.add(floorSign);
  b.box(-6.7,y+3.65,0,.18,.10,21,'warmDim');b.box(6.7,y+3.65,0,.18,.10,21,'cyanDim');
  // Room portals, soffits, stair stringers and service detail belong to the space.
  if(f>0){
   for(const z of [-6,0,6]){
    for(const x of [-12.1,-9.9]){b.box(x,y+1.42,z,.095,2.84,.24,'champagne');b.box(x,y+.26,z,.17,.50,.33,'ivoryWarm');}
    const arch=curvePoints(t=>v(-12.08+2.16*t,y+2.75+.45*Math.sin(Math.PI*t),z),24);b.tube(arch,.055,f===3?'copper':'titanium');
   }
   for(const x of [-6.45,6.15])for(const z of [-9,-4.5,0,4.5,9]){b.box(x,y+4.12,z,2.35,.20,.17,'steel');b.box(x,y+4.26,z,2.6,.055,.26,'copper');}
   const roomSign=placard(FLOOR_NAMES[f],['ARRIVAL','ARCHIVE','THERMAL','BIOSPHERE','OBSERVATORY','VAULT'][f],1.8,.70);roomSign.position.set(-7.84,y+2.25,-2.9);roomSign.rotation.y=Math.PI/2;root.add(roomSign);
   for(const z of [-3.2,2.9]){b.box(-7.84,y+.4,z,.09,.23,1.0,'steel');for(let k=0;k<8;k++)b.box(-7.77,y+.32+k*.025,z,.025,.008,.90,'champagne');}
  }
  if(f<5){const direction=f%2?-1:1;for(const x of [10.65,13.64])b.beam(v(x,y-.15,direction===1?8:-8),v(x,y+STOREY-.15,direction===1?-8:8),.09,'steel');}
  if(f===0){
   for(const x of [-10,10])for(const z of [-7,5]){b.cylinder(x,.44,z,2.8,.65,2.8,'ivoryWarm');tree(b,x,.8,z,3.3,x<0?2:0);}
   for(let k=0;k<5;k++){const x=-3+k*1.5;b.cylinder(x,.9,-7.8,.65,1.8,.65,'titanium');b.sphere(x,2.1,-7.8,.6,.9,.6,k%2?'violet':'teal');}
   b.box(-8,.65,9.5,4.3,1.3,1.6,'ivory');b.box(-8,1.38,9.5,4.3,.10,1.6,'wood');b.box(-8,1.7,9.5,1.7,.55,.15,'screen');
  }else if(f===1){
   for(const z of [-9,-3,3,9])for(const x of [-12.9,-8.5]){
    b.box(x,y+1.45,z,.62,2.9,3.0,'wood');for(let shelf=0;shelf<5;shelf++){b.box(x,y+.4+shelf*.49,z,.82,.055,2.9,'champagne');for(let k=0;k<9;k++)b.box(x-.05,y+.60+shelf*.49,z-1.25+k*.29,.70,.34,.18,['copper','teal','violet','ivoryWarm'][k%4]);}
   }
   for(const z of [-8,0,8]){b.box(7.2,y+.86,z,2.6,.13,1.6,'wood');b.cylinder(7.2,y+.38,z,.20,.75,.20,'steel');b.sphere(7.2,y+1.26,z,.7,.7,.7,'teal');}
   const sign=placard('冷卻 → 儲能 → 推進','ARCHIVE / FOUNDING ROUTE',2.8,1.4);sign.position.set(-11,y+2.0,-10.9);root.add(sign);
  }else if(f===2){
   for(let k=0;k<3;k++){
    const x=-12.8+k*1.75,role=['teal','champagne','violet'][k];b.cylinder(x,y+1.65,9.7,.65,3.3,.65,'steel');b.cylinder(x,y+1.65,9.7,.80,.38,.80,role);b.beam(v(x,y+.5,8.9),v(x,y+2.5,8.9),.08,'steel');
    const valve=new T.Mesh(new T.TorusGeometry(.23,.04,8,22),m[role]);valve.position.set(x,y+1.8,8.63);root.add(valve);valves.push(valve);
   }
   for(const z of [-8,-2,4]){b.cylinder(-12.9,y+1.3,z,1.35,2.6,1.35,'steel');for(let j=0;j<4;j++)b.cylinder(-12.9,y+.4+j*.55,z,1.50,.07,1.50,'copper');b.box(-8.5,y+1.15,z,.7,2.3,2.0,'ivoryCool');}
   for(let k=0;k<6;k++){const pts=[v(-13.35,y+3.5,-10),v(-13.35,y+3.5,8),v(-12.8+k*.27,y+3.5,9.7),v(-12.8+k*.27,y+1.4,9.7)];b.tube(pts,.04,k%2?'copper':'steel');}
   b.box(-11,y+.65,8,3.6,1.3,.55,'ivory');b.box(-11,y+1.30,8,3.1,.07,.44,'screen');
   for(let k=0;k<3;k++){b.cylinder(7.4,y+.85,-8+k*7,2.5,1.7,2.5,'ivoryCool');b.cylinder(7.4,y+1.72,-8+k*7,2.2,.10,2.2,'copper');b.box(7.4,y+2.22,-8+k*7,1.4,.9,1.2,'deepGlass');}
  }else if(f===3){
   for(const x of [-12.9,-8.9])for(const z of [-9,-3,3,9]){b.box(x,y+.5,z,1.3,1,2.0,'terracotta');b.box(x,y+1.04,z,1.14,.08,1.86,'soil');tree(b,x,y+1.1,z,2.2+(z%2)*.1,Math.abs(Math.round(z))%4);}
   for(const z of [-9,-1,7]){b.box(7.3,y+.5,z,2.3,1,2.7,'ivory');b.box(7.3,y+1.02,z,2.1,.06,2.5,'soil');tree(b,7.3,y+1.08,z,2.9,2);}
   for(const z of [-1.06,1.06]){b.beam(v(-5,y+1.05,z),v(5,y+1.05,z),.043,'champagne');for(let x=-5;x<=5;x+=1.2)b.cylinder(x,y+.55,z,.05,1.05,.05,'steel');}
  }else if(f===4){
   b.cylinder(-11,y+.36,9.4,3.2,.6,3.2,'steel');b.cylinder(-11,y+.72,9.4,3.0,.12,3.0,'ivoryWarm');
   for(let k=0;k<3;k++){const ring=new T.Mesh(new T.TorusGeometry(1.32+k*.21,.047,10,72),m[['teal','gold','violet'][k]]);ring.position.set(-11,y+2.1,9.4);ring.rotation.set(k*.8,.3+k*.6,0);root.add(ring);rings.push(ring);}
   b.sphere(-11,y+2.1,9.4,.7,.7,.7,'cyanDim');for(let k=0;k<16;k++){const a=k*2.399;b.sphere(-11+Math.cos(a)*1.1,y+1.9+Math.sin(k)*.7,9.4+Math.sin(a)*1.1,.06,.06,.06,'warmDim');}
   for(const z of [-8,-1,6]){b.box(-12.8,y+1.1,z,.6,2.2,2.3,'screen');b.box(-12.4,y+1.1,z,.15,2.35,2.5,'champagne');}
   for(const z of [-8,0,8]){b.box(7.6,y+.6,z,2.8,1.2,1.8,'ivoryWarm');b.box(7.6,y+1.28,z,2.8,.12,1.8,'wood');}
  }else{
   for(const x of [-12.7,-9])for(const z of [-9,-3,3,9]){b.box(x,y+.65,z,1.0,1.3,1.1,'ivoryWarm');b.sphere(x,y+1.8,z,.8,1.3,.8,'violet');}
   // A small vault on the island, reached by a deliberate jump over the final gap.
   for(const z of [-1.7,1.7]){
    const pts=curvePoints(t=>v(-2.5+5*t,y+2.7*Math.sin(Math.PI*t),z),48);b.tube(pts,.14,'ivory');b.tube(pts.map(p=>v(p.x,p.y+.14,p.z)),.035,'gold');
   }
   for(const x of [-2.2,2.2])b.beam(v(x,y+1.0,-1.7),v(x,y+1.0,1.7),.055,'champagne');
   b.cylinder(0,y+.30,0,1.9,.5,1.9,'ivoryWarm');b.cylinder(0,y+.58,0,1.6,.08,1.6,'champagne');
   for(let k=0;k<4;k++)b.box(5.45,y+.019,-.75+k*.50,.55,.025,.075,'gold',.65);
  }
 }
 const crystal=new T.Mesh(new T.OctahedronGeometry(.6,0),new T.MeshPhysicalMaterial({color:0x9fc3ce,metalness:.25,roughness:.08,transparent:true,opacity:.86,clearcoat:1,emissive:0x337699,emissiveIntensity:.17}));crystal.position.set(0,STOREY*5+1.25,0);root.add(crystal);
 // Light sources are sparse and spatially distinct; sunlight stays fixed outside.
 for(let f=0;f<6;f++){const light=new T.PointLight(f%2?0xf6dac0:0xc1e2ef,1.6,26,1.5);light.position.set(0,f*STOREY+3.1,0);root.add(light);}
 b.finish();return {root,gates,rings,valves,crystal};
}
export function makeSurrogate(m){
 const root=new T.Group(),body=new T.Group(),limbs=[];root.add(body);
 const suit=new T.MeshStandardMaterial({color:0x678b94,roughness:.73}),dark=m.black,light=m.ivoryCool;
 const add=(g,mat,x,y,z,parent=body)=>{const mesh=new T.Mesh(g,mat);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;};
 add(new T.CylinderGeometry(.18,.14,.62,12),suit,0,1.09,0);add(new T.SphereGeometry(.17,16,12),light,0,1.55,0);add(new T.SphereGeometry(.156,16,10,0,Math.PI*2,Math.PI*.30,Math.PI*.38),m.deepGlass,0,1.56,-.015).rotation.x=Math.PI/2;
 add(new T.BoxGeometry(.29,.12,.14),m.champagne,0,1.04,-.15);add(new T.BoxGeometry(.25,.40,.12),dark,0,1.11,.19);add(new T.BoxGeometry(.035,.14,.025),m.warmDim,-.08,1.20,-.185);
 for(const side of [-1,1]){
  const arm=new T.Group();arm.position.set(side*.24,1.31,0);body.add(arm);add(new T.CylinderGeometry(.065,.057,.50,10),suit,0,-.25,0,arm);add(new T.SphereGeometry(.075,10,8),dark,0,-.51,0,arm);limbs.push(arm);
  const leg=new T.Group();leg.position.set(side*.105,.80,0);body.add(leg);add(new T.CylinderGeometry(.075,.057,.64,10),dark,0,-.32,0,leg);add(new T.BoxGeometry(.14,.17,.27),light,0,-.71,-.05,leg);add(new T.BoxGeometry(.08,.15,.04),suit,0,-.37,-.055,leg);limbs.push(leg);
 }
 return {root,animate(time,speed){for(let k=0;k<limbs.length;k++)limbs[k].rotation.x=Math.sin(time*9+(k%2)*Math.PI)*Math.min(.55,speed*.1);body.position.y=Math.abs(Math.sin(time*18))*.018*Math.min(speed,1);}};
}
