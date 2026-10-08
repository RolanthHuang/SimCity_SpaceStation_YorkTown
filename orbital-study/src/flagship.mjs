import * as T from '../lib/three.module.js';
import {builder,surface,v,label} from './geometry.mjs';
export const SHIP_DOCK=v(-33,58,-65);
function ring(b,r,y,z,role='silver',tube=.13){const q=b.mesh(new T.TorusGeometry(r,tube,6,112),role,v(0,y,z),new T.Euler(Math.PI/2,0,0));q.scale.z=1.16;return q;}
export function flagship(m){
 const root=new T.Group();root.name='Horizon layered flagship';const b=builder(m,root);
 const profile=[[0,-2.2],[10,-2.1],[23,-1.8],[31,-.7],[33,.05],[32.7,.70],[29.5,1.50],[24,2.3],[15,3.3],[7,4.1],[0,4.25]].map(p=>new T.Vector2(...p));
 const saucer=b.mesh(new T.LatheGeometry(profile,128),'hull',v(0,0,25));saucer.scale.z=1.16;
 for(const [r,y,role]of [[32.8,.08,'navy'],[32.1,.90,'silver'],[29.4,1.53,'copper'],[23.6,2.35,'silver'],[15,3.35,'hullShade'],[30.6,-.87,'steel']])ring(b,r,y,25,role,r===32.8?.22:.10);
 // Real recessed rim windows and local access bays sit below the plated upper decks.
 for(let i=0;i<176;i++){
  const a=i*Math.PI*2/176,rx=32.94,rz=rx*1.16,rot=new T.Euler(0,-a,0);
  const x=Math.cos(a)*rx,z=25+Math.sin(a)*rz;
  b.box(x,-.04,z,.12,.30,.63,'navy',rot);
  if(i%7!==0)b.box(x+Math.cos(a)*.08,-.04,z+Math.sin(a)*.08,.075,.14,.42,i%5===0?'warmDim':'paneDark',rot,false);
  if(i%11===0){b.box(x*.96,1.15,25+(z-25)*.96,.4,.28,1.2,'hullShade',rot);b.box(x*.96,1.33,25+(z-25)*.96,.43,.06,1.24,'silver',rot);}
 }
 for(let i=0;i<48;i++){
  const a=i*Math.PI/24;
  b.beam(v(Math.cos(a)*24,2.4,25+Math.sin(a)*27.9),v(Math.cos(a)*30,1.35,25+Math.sin(a)*34.8),.04,'steel');
 }
 b.cylinder(0,4.75,25,11.5,1.35,12.5,'hullShade');b.cylinder(0,5.55,25,9.2,.35,10.2,'silver');b.sphere(0,6.3,24,8.2,2.5,8.5,'hull');
 for(let i=0;i<40;i++){const a=i*Math.PI/20;b.box(Math.cos(a)*5.55,4.83,25+Math.sin(a)*6,.08,.52,.42,'paneDark',new T.Euler(0,-a,0));}
 const reg=label('YSS HORIZON','NX–2263   ·   YORKTOWN DEEP SPACE',16,4);reg.position.set(0,3.55,44);reg.rotation.x=-Math.PI/2;root.add(reg);
 // A shaped engineering hull has a continuous curved silhouette rather than a box stack.
 const engPoint=(u,w)=>{const a=-u*Math.PI*2,z=-59+w*77,t=Math.pow(Math.sin(Math.PI*w),.43),rx=2.6+8.8*t,ry=2.8+5.9*t;return v(Math.cos(a)*rx,-8+Math.sin(a)*ry,z);};
 b.mesh(surface(engPoint,96,44),'hull');
 for(let j=1;j<11;j++){const w=j/12,points=[];for(let k=0;k<=64;k++)points.push(engPoint(k/64,w));b.tube(points,.065,'steel',true,64);}
 for(const side of [-1,1]){
  const spine=[v(side*5,-4,-27),v(side*11,-.5,-21),v(side*14,2,-4),v(side*10,2.8,17),v(side*6,1.7,30)];b.tube(spine,1.12,'hullShade',false,64);
  const trim=spine.map(p=>p.clone().add(v(0,.8,side*.15)));b.tube(trim,.14,'silver',false,64);
  for(let j=0;j<14;j++){const z=-34+j*3.25;b.box(side*10.55,-5.1,z,.09,.3,1.65,'paneDark');b.box(side*10.64,-5.1,z,.04,.13,1.18,j%4?'warmDim':'blue',null,false);}
  // Swept pylons expose paired load-bearing members and secondary braces.
  const a=v(side*7,-3,-34),c=v(side*20,8,-49),d=v(side*30,13,-36);
  b.tube([a,v(side*14,2,-39),c,d],1.14,'hull',false,48);
  b.tube([v(side*8,-5,-21),v(side*17,1,-19),v(side*25,11,-25),d],.85,'hullShade',false,48);
  b.beam(v(side*13,1,-33),v(side*25,10,-31),.26,'steel');b.beam(v(side*18,6,-39),v(side*23,8,-29),.22,'copper');
  const nacelle=new T.Group();root.add(nacelle);nacelle.position.set(side*31,13,-35);const n=builder(m,nacelle);
  const point=(u,w)=>{const t=Math.pow(Math.sin(Math.PI*w),.24),a=-u*Math.PI*2;return v(Math.cos(a)*(2+2.8*t),Math.sin(a)*(1.8+2.3*t),-40+w*77);};
  n.mesh(surface(point,72,40),'hull');
  for(let k=0;k<34;k++){
   const z=-34+k*2.05;n.box(side*4.47,.85,z,.13,1.12,1.55,'navy');n.box(side*4.55,.9,z,.065,.58,1.3,k%8===0?'silver':'blue',null,false);
   n.box(-side*4.40,-.1,z,.12,.42,1.4,'steel');n.box(0,4.03,z,3.3,.10,1.74,k%5?'hullShade':'steel');
  }
  for(let k=0;k<11;k++){const points=[];for(let j=0;j<=56;j++)points.push(point(j/56,(k+1)/12));n.tube(points,.075,'silver',true,56);}
  n.cylinder(0,.1,37.9,8.7,.9,8.7,'silver',new T.Euler(Math.PI/2,0,0));
  n.cylinder(0,.1,38.58,7.3,.25,7.3,'navy',new T.Euler(Math.PI/2,0,0));
  const rim=n.mesh(new T.TorusGeometry(3.84,.29,10,80),'steel',v(0,.1,38.8));rim.scale.y=.86;
  // The visible orange comes from recessed energy coils, not an opaque orange cap.
  for(let k=0;k<6;k++){
   const rr=3.4-k*.32,z=39.12+k*.51,coil=n.mesh(new T.TorusGeometry(rr,.085,8,80),'collectorRing',v(0,.1,z));coil.scale.y=.86;
   const separator=n.mesh(new T.TorusGeometry(rr+.14,.09,6,80),'navy',v(0,.1,z-.10));separator.scale.y=.86;
  }
  const core=n.mesh(new T.CircleGeometry(1.68,64),'collectorCore',v(0,.1,42.1));core.scale.y=.86;
  for(let j=0;j<12;j++){const a=j*Math.PI/6;n.beam(v(Math.cos(a)*3.38,.1+Math.sin(a)*2.9,39.22),v(Math.cos(a)*1.70,.1+Math.sin(a)*1.46,42.22),.06,'steel');}
  const glass=n.mesh(new T.SphereGeometry(1,48,24,0,Math.PI*2,0,Math.PI/2),'collectorGlass',v(0,.1,38.93),new T.Euler(Math.PI/2,0,0),false);glass.scale.set(3.9,4.85,3.35);glass.userData.dynamic=true;
  for(let j=0;j<8;j++){const a=j*Math.PI/4,p=[];for(let k=0;k<=12;k++){const t=k/12*Math.PI/2;p.push(v(Math.cos(a)*3.92*Math.cos(t),.1+Math.sin(a)*3.38*Math.cos(t),38.93+4.87*Math.sin(t)));}n.tube(p,.029,'silver',false,28);}
  n.box(0,-.2,-40.5,4.8,2.8,.7,'navy');n.box(0,-.2,-41,3.5,1.65,.15,'blue',null,false);
  n.finish();
 }
 // Forward deflector with concentric lenses, cage ribs and a warm reflective rim.
 const deflector=new T.Group();deflector.position.set(0,-8,16.7);root.add(deflector);const d=builder(m,deflector);
 d.sphere(0,0,-.55,15,11,4.7,'navy');d.sphere(0,0,2.15,12,8,.7,'blue');
 for(const r of [5.1,4.1,2.8]){const mesh=d.mesh(new T.TorusGeometry(r,.15,8,80),r===5.1?'copper':'silver',v(0,0,2.56));mesh.scale.y=.73;}
 for(let i=0;i<16;i++){const a=i*Math.PI/8;d.beam(v(Math.cos(a)*5.9,Math.sin(a)*4.2,2.5),v(Math.cos(a)*3.0,Math.sin(a)*2.1,2.66),.035,'steel');}d.finish();
 // Open shuttle bay: actual depth, walls, ceiling frames, door, and two small craft.
 const bay=new T.Group();bay.position.set(0,-8,-58);root.add(bay);const h=builder(m,bay);
 h.box(0,-2.6,-1,11.2,.4,10,'steel');h.box(0,3.4,-1,12,.7,10,'silver');h.box(-5.4,.3,-1,.6,5.9,10,'hullShade');h.box(5.4,.3,-1,.6,5.9,10,'hullShade');h.box(0,.3,2.6,10,5.9,.4,'navy');
 for(let j=0;j<3;j++){h.box(-3.2+j*3.2,.3,2.35,2.5,4.6,.25,'steel');h.box(-3.2+j*3.2,1.6,2.18,1.7,.6,.08,'blue',null,false);h.box(-3.2+j*3.2,-.8,2.13,1.9,.15,.08,'copper');}
 for(let z=-5;z<4;z+=1.5){h.box(0,3,z,10.5,.22,.25,'silver');h.box(0,2.83,z,5,.05,.2,'warmDim',null,false);for(const side of [-1,1])h.box(side*5.05,.3,z,.12,5.5,.19,'steel');}
 for(const x of [-3.8,3.8])h.box(x,-2.35,-1,.10,.025,8,'copper');
 for(let j=0;j<7;j++)h.box(0,-2.32,-4.5+j*1.1,2.5,.025,.06,'warmDim',null,false);
 for(const x of [-2.9,2.9]){h.sphere(x,-1.8,-.2,2.0,1.2,4.0,'hull');h.box(x,-1.15,-.5,1.6,.28,1.4,'paneDark');h.box(x,-1.8,1.67,1.05,.4,.09,'blue',null,false);h.box(x,-2.2,-.2,3.0,.10,1.2,'silver');}
 h.finish();const door=new T.Mesh(new T.BoxGeometry(10.5,5.3,.32),m.hullShade);door.position.set(0,5.8,-5.8);door.castShadow=true;door.visible=false;bay.add(door);
 b.cylinder(0,-2.55,25,9,.7,10.2,'hullShade');b.cylinder(0,-3.03,25,5.6,.5,6.3,'navy');b.cylinder(0,-3.33,25,4.7,.15,5.4,'blue',null,false);
 for(let i=0;i<12;i++){const a=i*Math.PI/6;b.box(Math.cos(a)*20,-1.98,25+Math.sin(a)*23.4,2.1,.18,3.0,i%4?'hullShade':'steel',new T.Euler(0,-a,0));}
 b.box(0,-13.6,-25,3,.7,13,'navy');for(let z=-28;z<-20;z+=.8)b.box(0,-14.02,z,2.5,.04,.24,'silver');
 for(const side of [-1,1])b.box(side*8,2.1,30,.45,.25,6,'redLight',null,false);
 b.finish();root.position.copy(SHIP_DOCK);root.rotation.y=-.28;
 const lod=new T.Group();const q=builder(m,lod);q.sphere(0,0,25,66,5.4,75,'hull');q.sphere(0,-8,-20,21,16,80,'hullShade');for(const side of [-1,1]){q.box(side*31,13,-33,8,7,80,'hull');q.beam(v(side*7,-3,-34),v(side*31,13,-35),1.1,'steel');}q.finish();lod.position.copy(root.position);lod.rotation.copy(root.rotation);lod.visible=false;
 return {root,lod,door,base:SHIP_DOCK.clone(),bounds:new T.Box3().setFromObject(root)};
}
