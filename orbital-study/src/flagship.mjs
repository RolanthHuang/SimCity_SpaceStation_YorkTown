import * as T from '../lib/three.module.js';
import {builder,v,label} from './geometry.mjs';
import {closedLoft,hullPoint,solidPatch,structuralPlate,NACELLE_STATIONS,ENGINEERING_STATIONS} from './ship-structure.mjs';
export const SHIP_DOCK=v(-33,58,-65);
const tau=Math.PI*2;
const SAUCER_PROFILE=[[0,-2.6],[6,-2.6],[6,-2.2],[17,-2.2],[17,-1.7],[26,-1.7],[26,-1.2],[31.8,-1.2],[33,-.60],[33,.18],[32.6,.60],[30.8,.65],[30.3,1.05],[25,1.05],[24.6,1.60],[17,2.45],[16.7,2.85],[8,3.65],[7.6,4.15],[0,4.15]];
function ring(b,r,y,z,role='silver',tube=.13){const q=b.mesh(new T.TorusGeometry(r,tube,6,112),role,v(0,y,z),new T.Euler(Math.PI/2,0,0));q.scale.y=1.16;return q;}
function plateHull(b,stations,angles,z0,z1,role='plate',lift=.18,nu=3,nv=2){
 const [a0,a1]=angles;
 b.mesh(solidPatch((u,w)=>hullPoint(stations,a0+(a1-a0)*u,z0+(z1-z0)*w,lift),u=>v(Math.cos(a0+(a1-a0)*u),Math.sin(a0+(a1-a0)*u),0),nu,nv,lift+.045),role);
}
function collar(b,profile,role='steel',segments=64){
 return b.mesh(new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),segments),role,null,new T.Euler(Math.PI/2,0,0));
}
function nacelle(m,side,root){
 const group=new T.Group();group.position.set(side*31,13,-35);root.add(group);const n=builder(m,group);
 const structuralHull=closedLoft(NACELLE_STATIONS,48).toNonIndexed();structuralHull.computeVertexNormals();n.mesh(structuralHull,'hullShade');
 for(let j=0;j<12;j++){const a=j*tau/12+.025;plateHull(n,NACELLE_STATIONS,[a,a+tau/12-.05],-43,-38.8,j%3?'steel':'plateShade',.10,2,2);}
 // Separate longitudinal armor with straight runs and actual seam thickness.
 for(let j=0;j<8;j++)for(let k=0;k<8;k++){
  const a=j*tau/8+.032,z0=-37+k*8.8,z1=Math.min(34.7,z0+8.35);
  plateHull(n,NACELLE_STATIONS,[a,a+tau/8-.064],z0,z1,(j+k)%7===0?'plateShade':'plate',.17,3,2);
 }
 for(const z of [-33,-14,14,27]){
  const pts=[];for(let k=0;k<=64;k++)pts.push(hullPoint(NACELLE_STATIONS,k*tau/64,z,.25));n.tube(pts,.058,'steel',true,64);
 }
 // Embedded warp channels: dark well, luminous slits, raised protecting rails.
 for(const s of [-1,1]){
  for(let k=0;k<29;k++){
   const z=-30+k*2.07,p=hullPoint(NACELLE_STATIONS,s>0?0:Math.PI,z,.26);
   n.box(p.x,.02,z,.12,.87,1.86,'navy');n.box(p.x+s*.085,.04,z,.055,.28,1.58,'blue',null,false);
   n.box(p.x+s*.14,.63,z,.20,.18,1.94,'silver');n.box(p.x+s*.14,-.58,z,.20,.16,1.94,'steel');
  }
 }
 for(let k=0;k<14;k++){
  const z=-29+k*4.45,y=hullPoint(NACELLE_STATIONS,Math.PI/2,z,.28).y;
  n.box(0,y,z,1.8,.14,2.55,'navy');for(let j=0;j<4;j++)n.box(0,y+.10,z-.8+j*.53,1.66,.13,.14,'silver');
 }
 // An aft taper encloses the machinery. The outlet follows the round hull;
 // no rectangular stopper is glued onto an open tube.
 collar(n,[[0,-45.18],[.62,-45.18],[.94,-44.98],[1.12,-44.5],[.99,-44.2],[0,-44.2]],'steel',48);
 const aft=n.mesh(new T.CircleGeometry(.62,32),'blue',v(0,0,-45.20),new T.Euler(0,Math.PI,0),false);aft.scale.y=.82;
 for(const s of [-1,1]){
  const fin=[v(s*2.2,.15,-40),v(s*4.2,.15,-35),v(s*4.9,.15,-42),v(s*1.1,.15,-46.4)];
  n.mesh(structuralPlate(fin,v(0,.16,0)),'plateShade');
 }
 // Closed collector housing, recessed opaque bulkhead, fixed field supports, core and
 // shallow optical cover. Nothing behind the face is see-through to space.
 const collectorHousing=collar(n,[[0,35.6],[3.84,35.6],[4.25,36.8],[4.25,38.6],[4.25,40.8],[3.97,41.25],[3.72,41.25],[3.58,40.65],[3.58,39.45],[0,39.45]],'steel',80);collectorHousing.scale.z=.89;
 for(let j=0;j<16;j++){const a=j*tau/16+.035,da=tau/16-.07;const panel=solidPatch((u,w)=>v(Math.cos(a+da*u)*4.33,Math.sin(a+da*u)*4.33*.89,36.9+w*3.73),u=>v(Math.cos(a+da*u),Math.sin(a+da*u),0),2,1,.12);n.mesh(panel,j%4?'steel':'silver');}
 const flange=n.mesh(new T.TorusGeometry(4.24,.055,8,80),'silver',v(0,0,40.4));flange.scale.y=.88;
 const backing=n.mesh(new T.CircleGeometry(3.61,80),'navy',v(0,0,39.48));backing.scale.y=.89;
 // Fictional magnetic collector: fixed radial supports and insulator seats,
 // without fan blades or a turbine suggesting atmospheric propulsion.
 for(let j=0;j<12;j++){
  const a=j*tau/12,p0=v(Math.cos(a)*1.28,Math.sin(a)*1.14,39.72),p1=v(Math.cos(a)*3.40,Math.sin(a)*3.03,39.73);
  n.beam(p0,p1,.095,'steel');
  for(const r of [1.52,2.45,3.20]){const p=v(Math.cos(a)*r,Math.sin(a)*r*.89,39.79);n.cylinder(p.x,p.y,p.z,.25,.18,.25,'plateWarm',new T.Euler(Math.PI/2,0,0));}
 }
 for(const [r,z]of [[3.12,39.88],[2.63,40.03],[2.12,40.18],[1.55,40.32]]){
  const coil=n.mesh(new T.TorusGeometry(r,.105,8,80),'collectorRing',v(0,0,z));coil.scale.y=.89;
 }
 const core=n.mesh(new T.CylinderGeometry(1.22,1.30,.40,64),'collectorCore',v(0,0,40.12),new T.Euler(Math.PI/2,0,0));core.scale.z=.89;const coreSeat=n.mesh(new T.TorusGeometry(1.31,.13,8,64),'silver',v(0,0,40.30));coreSeat.scale.y=.89;
for(let j=0;j<32;j++){const a=j*tau/32;for(const r of [2.0,3.34])n.cylinder(Math.cos(a)*r,Math.sin(a)*r*.89,40.20,.085,.12,.085,'silver',new T.Euler(Math.PI/2,0,0));}
 // The optic is an enclosed, shallow lens, not a balloon-shaped hemisphere.
 const glass=n.mesh(new T.SphereGeometry(1,48,20),'collectorGlass',v(0,0,40.94),null,false);glass.scale.set(3.47,3.09,.30);glass.userData.dynamic=true;
 for(let j=0;j<8;j++){
  const a=j*tau/8,p=v(Math.cos(a)*4.00,Math.sin(a)*3.55,40.75);
  n.cylinder(p.x,p.y,p.z,.18,.12,.18,'navy',new T.Euler(Math.PI/2,0,0));
  n.beam(v(Math.cos(a)*3.62,Math.sin(a)*3.22,41.25),v(Math.cos(a)*3.05,Math.sin(a)*2.71,41.28),.105,'silver');
 }
 // Broad integrated pylon saddle, shaped fairing and fasteners.
 n.mesh(closedLoft([[-13,1.85,.9,-3.1],[-9,2.5,1.5,-3.0],[1,2.1,1.6,-3.0],[6,.7,.7,-3.0]],24),'plateShade');
 for(const z of [-8,-3,2])for(const s of [-1,1])n.cylinder(s*1.8,-4.25,z,.18,.15,.18,'silver');
 n.finish();return group;
}
export function flagship(m,{labels=true}={}){
 const root=new T.Group();root.name='Horizon structural flagship';const b=builder(m,root);
 const saucer=b.mesh(new T.LatheGeometry(SAUCER_PROFILE.map(p=>new T.Vector2(...p)),160),'hullShade',v(0,0,25));saucer.scale.z=1.16;
 // Machined stepped deck, bevelled rim and independent thick armor panels.
 for(const [r,y,role,t]of [[32.91,-.12,'steel',.14],[32.5,.65,'silver',.09],[30.4,1.05,'navy',.08],[24.65,1.63,'steel',.08],[16.8,2.86,'navy',.075]])ring(b,r,y,25,role,t);
 for(const [r0,r1,y0,y1,count]of [[8.3,16.45,3.70,2.96,32],[17.2,24.2,2.50,1.72,48],[25.25,29.95,1.25,1.25,64]])for(let j=0;j<count;j++){
  const a=j*tau/count+.006,span=tau/count-.012;
  const plate=solidPatch((u,w)=>{const r=r0+(r1-r0)*w;return v(Math.cos(a+span*u)*r,y0+(y1-y0)*w,25+Math.sin(a+span*u)*r*1.16);},()=>v(0,1,0),3,2,.18);
  b.mesh(plate,j%11===0?'plateShade':j%4===0?'plateWarm':'plate');
 }
 for(let i=0;i<176;i++){
  const a=i*tau/176,x=Math.cos(a)*33.02,z=25+Math.sin(a)*38.30,rot=new T.Euler(0,-a,0);
  b.box(x,-.27,z,.18,.42,.61,'navy',rot);
  if(i%7)b.box(x+Math.cos(a)*.10,-.25,z+Math.sin(a)*.10,.06,.13,.38,i%5?'paneDark':'warmDim',rot,false);
 }
 // Radial service trenches with sunk dark trays and metallic grilles.
 for(let j=0;j<24;j++){
  const a=j*tau/24;for(let k=0;k<4;k++){
   const r=25.8+k*.86,x=Math.cos(a)*r,z=25+Math.sin(a)*r*1.16,rot=new T.Euler(0,-a,0);
   b.box(x,1.27,z,.45,.15,1.18,'navy',rot);b.box(x,1.39,z,.13,.12,1.1,'silver',rot);
  }
 }
 b.cylinder(0,4.65,25,11.5,.96,12.5,'plateShade');b.cylinder(0,5.24,25,10.4,.22,11.4,'silver');
 b.mesh(closedLoft([[21,2.7,.85,5.6],[22.0,4.15,1.1,5.6],[26.8,3.9,1.1,5.6],[28,2.55,.45,5.6]],24),'plate');
 for(let i=0;i<40;i++){const a=i*tau/40;b.box(Math.cos(a)*5.59,4.65,25+Math.sin(a)*6.08,.09,.36,.39,'paneDark',new T.Euler(0,-a,0));}
 if(labels){const reg=label('YSS HORIZON','NX–2263   ·   YORKTOWN DEEP SPACE',12,3);reg.position.set(0,3.72,38);reg.rotation.x=-Math.PI/2;root.add(reg);}
 // Engineering section: flat longitudinal stations, distinct keel, layered
 // shells and window galleries instead of a single stretched ellipsoid.
 b.mesh(closedLoft(ENGINEERING_STATIONS,64),'hullShade');
 for(let j=0;j<12;j++)for(let k=0;k<8;k++){
  const a=j*tau/12+.022,z0=-53+k*8.6,z1=Math.min(17,z0+8.15);
  if((j===0||j===5||j===6||j===11)&&k>1&&k<7)continue;
  plateHull(b,ENGINEERING_STATIONS,[a,a+tau/12-.044],z0,z1,(j+k)%6?'plate':'plateWarm',.24,3,2);
 }
 for(const z of [-45,-29,-9,7]){const ps=[];for(let k=0;k<=64;k++)ps.push(hullPoint(ENGINEERING_STATIONS,k*tau/64,z,.28));b.tube(ps,.085,'steel',true,64);}
 for(const side of [-1,1]){
  // Recessed gallery with a surrounding armor frame follows hull width.
  for(let k=0;k<19;k++){
   const z=-37+k*2.45,p=hullPoint(ENGINEERING_STATIONS,side>0?.12:Math.PI-.12,z,.23),y=p.y;
   b.box(p.x,y,z,.16,.85,2.18,'navy');b.box(p.x+side*.10,y,z,.05,.25,1.59,k%4?'warmDim':'paneDark',null,false);
   b.box(p.x+side*.17,y+.60,z,.33,.25,2.27,'plate');b.box(p.x+side*.14,y-.6,z,.27,.25,2.27,'steel');
  }
  // Swept solid pylons are load-bearing wings, not inflatable round tubes.
  const pts=[v(side*7,-3,-34),v(side*13,0,-46),v(side*29,11.8,-41),v(side*31,12.6,-31),v(side*25,9,-29),v(side*14,1,-28)];
  b.mesh(structuralPlate(side>0?pts:[...pts].reverse(),v(side*.70,0,0)),'plateShade');
  const web=[v(side*10,-1,-33),v(side*15,1,-41),v(side*28,11,-37),v(side*27,10,-33),v(side*15,2,-31)];
  b.mesh(structuralPlate(side>0?web:[...web].reverse(),v(side*.80,0,0)),'plate');
  for(let k=0;k<7;k++){const t=k/7;b.beam(v(side*(14+13*t),1+9*t,-39),v(side*(14+13*t),1.7+9*t,-33.4),.09,'steel');}
  nacelle(m,side,root);
 }
 for(const side of [-1,1])for(let k=0;k<4;k++){
  const z0=-39+k*10.5,z1=z0+8.6,a=side>0?-1.03:Math.PI+.56;
  plateHull(b,ENGINEERING_STATIONS,[a,a+.47],z0,z1,'navy',.31,3,2);
  for(let j=0;j<4;j++){
   const z=z0+1.15+j*1.85,p=hullPoint(ENGINEERING_STATIONS,a+.24,z,.55);
   b.cylinder(p.x,p.y,z,.74,.28,.74,'silver',new T.Euler(0,0,side*Math.PI/2));
   b.beam(hullPoint(ENGINEERING_STATIONS,a+.1,z,.63),hullPoint(ENGINEERING_STATIONS,a+.35,z,.63),.085,'copper');
  }
  for(const u of [.045,.425]){const points=[];for(let j=0;j<=8;j++)points.push(hullPoint(ENGINEERING_STATIONS,a+u,z0+(z1-z0)*j/8,.68));b.tube(points,.095,'silver',false,24);}
 }
 // A wide stepped neck embeds into both hulls; twin shoulder plates preserve
 // the familiar silhouette while giving the joint real lateral thickness.
 for(const side of [-1,1]){
  const pts=[v(side*2,-4,-23),v(side*2,1,12),v(side*2,1.6,29),v(side*2,-2,23),v(side*2,-8,-16)];
  b.mesh(structuralPlate(side<0?pts:[...pts].reverse(),v(2.1,0,0)),'plateShade');
  for(let k=0;k<5;k++)b.box(side*4.18,-1.4,-12+k*6.6,.15,.75,2.85,'navy');
 }
 b.box(0,-14.65,-25,4.9,1.0,23,'steel');b.box(0,-15.20,-25,3.4,.18,20,'navy');
 for(let k=0;k<20;k++)b.box(0,-15.33,-34.5+k,2.9,.12,.3,'silver');
 // Deflector is seated within an annular armored socket.
 const deflector=new T.Group();deflector.position.set(0,-8,16.7);root.add(deflector);const d=builder(m,deflector);
 collar(d,[[0,-1],[6.7,-1],[7.25,.5],[6.4,2.3],[5.85,2.5],[5.60,1.65],[0,1.65]],'steel',80);
 const lens=d.mesh(new T.SphereGeometry(1,48,20),'blue',v(0,0,1.82));lens.scale.set(5.55,3.8,.38);
 for(const r of [5.1,4.1,2.8]){const q=d.mesh(new T.TorusGeometry(r,.12,8,80),r===5.1?'copper':'silver',v(0,0,2.28));q.scale.y=.73;}
 for(let i=0;i<16;i++){const a=i*tau/16;d.beam(v(Math.cos(a)*5.4,Math.sin(a)*3.9,2.3),v(Math.cos(a)*3,Math.sin(a)*2.1,2.3),.043,'steel');}d.finish();
 // Shuttle bay is set into a tapered, armored housing with a proper doorway.
 const bayShell=new T.Shape();bayShell.absellipse(0,0,7.0,4.85,0,tau,false,0);const hole=new T.Path();hole.moveTo(-5.18,-2.38);hole.lineTo(-5.18,2.78);hole.lineTo(5.18,2.78);hole.lineTo(5.18,-2.38);hole.closePath();bayShell.holes.push(hole);b.mesh(new T.ExtrudeGeometry(bayShell,{depth:8.6,bevelEnabled:true,bevelThickness:.25,bevelSize:.16,bevelSegments:2,curveSegments:48}),'plateShade',v(0,-8,-65.8));
 // Hide the aft cap where a real bay opening is cut out: its housing is an
 // annular wall, so the hangar can be entered visually without hollow hulls.
 const bay=new T.Group();bay.position.set(0,-8,-60);root.add(bay);const h=builder(m,bay);
 h.box(0,-2.65,-1,11.2,.55,10,'steel');h.box(0,3.15,-1,12,.75,10,'plate');h.box(-5.4,.1,-1,.8,5.9,10,'plateShade');h.box(5.4,.1,-1,.8,5.9,10,'plateShade');h.box(0,.1,2.6,10,5.9,.5,'navy');
 for(let j=0;j<3;j++){h.box(-3.2+j*3.2,.1,2.28,2.5,4.6,.25,'steel');h.box(-3.2+j*3.2,1.45,2.12,1.7,.6,.08,'blue',null,false);}
 for(let z=-5;z<4;z+=1.5){h.box(0,2.72,z,10.5,.22,.25,'silver');h.box(0,2.58,z,5,.05,.2,'warmDim',null,false);for(const s of [-1,1])h.box(s*4.94,.1,z,.13,5.5,.19,'steel');}
 // Raised service galleries, railings, overhead gantry, cable runs and stores.
 for(const s of [-1,1]){
  h.box(s*4.45,.45,-.7,.88,.18,8.3,'silver');h.box(s*4.06,1.24,-.7,.075,.075,8.1,'copper');
  for(let z=-4.3;z<3;z+=1.4){h.box(s*4.06,.83,z,.075,.82,.075,'steel');h.box(s*5.0,1.55,z,.28,.7,.9,'navy');h.box(s*4.84,1.6,z,.1,.28,.68,'blue',null,false);}
  for(const z of [-2.8,1.1]){h.box(s*4.55,-1.59,z,.62,1.12,.78,'plateWarm');h.box(s*4.21,-1.57,z,.06,.46,.55,'steel');}
  h.tube([v(s*4.75,2.10,-5),v(s*4.75,2.10,1.7),v(s*4.25,1.60,2.2)],.10,'copper',false,24);
 }
 h.box(0,2.45,-.7,9.4,.35,.5,'steel');h.box(0,1.90,-.7,.48,.82,.45,'copper');h.beam(v(0,1.55,-.7),v(0,.6,-.7),.06,'steel');h.box(0,.58,-.7,.7,.12,.3,'silver');
 for(let j=0;j<6;j++){const x=-4.1+j*1.65;h.box(x,-2.34,-1,1.30,.06,7.8,'groundDark');for(let k=0;k<3;k++)h.box(x,-2.29,-3+k*2.4,1.12,.025,.09,'silver');}
 for(const side of [-1,1]){h.box(side*3.25,.1,2.06,2.2,3.9,.10,'navy');for(let j=0;j<9;j++)h.box(side*3.25,-1.5+j*.39,1.98,1.88,.11,.13,'steel');}
 for(const x of [-4.4,4.4]){h.cylinder(x,1.16,-3.3,.12,.50,.12,'navy');h.sphere(x,1.50,-3.3,.16,.20,.16,'plateWarm');h.beam(v(x-.04,.9,-3.3),v(x-.13,.55,-3.3),.038,'navy');h.beam(v(x+.04,.9,-3.3),v(x+.12,.55,-3.3),.038,'navy');}
 for(const x of [-3.8,3.8])h.box(x,-2.35,-1,.1,.025,8,'copper');
 for(let j=0;j<7;j++)h.box(0,-2.32,-4.5+j*1.1,2.5,.025,.06,'warmDim',null,false);
 for(const x of [-2.9,2.9]){const shuttleBody=closedLoft([[-2.1,.38,.24,-1.7],[-1.4,.96,.48,-1.7],[.9,.85,.45,-1.7],[1.8,.5,.3,-1.7]],8).toNonIndexed();shuttleBody.computeVertexNormals();h.mesh(shuttleBody,'plate',v(x,0,0));h.box(x,-1.12,-.5,1.4,.2,1.2,'paneDark');h.box(x,-1.7,1.84,.85,.3,.08,'blue',null,false);h.box(x,-2.17,-.2,2.6,.1,1.2,'silver');}
 h.finish();const door=new T.Mesh(new T.BoxGeometry(10.5,5.3,.32),m.plateShade);door.position.set(0,5.8,-5.8);door.castShadow=true;door.visible=false;bay.add(door);
 b.cylinder(0,-2.85,25,9,.5,10.2,'plateShade');b.cylinder(0,-3.21,25,5.6,.24,6.3,'navy');b.cylinder(0,-3.39,25,4.7,.12,5.4,'blue',null,false);
 for(let i=0;i<24;i++){const a=i*tau/24,r=20;b.box(Math.cos(a)*r,-1.91,25+Math.sin(a)*r*1.16,1.3,.26,2.5,i%4?'plateShade':'steel',new T.Euler(0,-a,0));}
 for(const side of [-1,1])b.box(side*8,2.1,30,.45,.25,6,'redLight',null,false);
 b.finish();root.position.copy(SHIP_DOCK);root.rotation.y=-.28;
 const lod=new T.Group();const q=builder(m,lod);q.mesh(new T.LatheGeometry(SAUCER_PROFILE.map(p=>new T.Vector2(...p)),48),'plateShade',v(0,0,25)).scale.z=1.16;q.mesh(closedLoft(ENGINEERING_STATIONS,20),'hullShade');
 for(const side of [-1,1]){q.mesh(closedLoft(NACELLE_STATIONS,20),'plate',v(side*31,13,-35));q.mesh(structuralPlate([v(side*7,-3,-34),v(side*13,0,-46),v(side*30,12,-40),v(side*31,12,-31),v(side*14,1,-28)],v(.65,0,0)),'steel');}
 q.finish();lod.position.copy(root.position);lod.rotation.copy(root.rotation);lod.visible=false;
 return {root,lod,door,base:SHIP_DOCK.clone(),bounds:new T.Box3().setFromObject(root)};
}
