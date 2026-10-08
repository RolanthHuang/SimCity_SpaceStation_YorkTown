import * as T from '../../YorktownPreview/three.module.js';
import {builder,radialArc,v,label} from './geometry.mjs';
export const RELAY_CENTER=v(100,102,-240);
export function relay(m){
 const root=new T.Group();root.name='Deep horizon mass transit relay';root.position.copy(RELAY_CENTER);root.rotation.y=-.12;const b=builder(m,root),r=71;
 const ring=(radius,tube,z,role)=>b.mesh(new T.TorusGeometry(radius,tube,10,144),role,v(0,0,z));
 ring(78,3.6,0,'hull');ring(63,2.5,1,'silver');ring(79.5,.22,5,'copper');ring(78.7,.32,-6,'steel');ring(68,.52,4.2,'blue');
 const coilGeometry=new T.TorusGeometry(1.58,.105,6,24);
 for(let k=0;k<48;k++){
  const a=k*Math.PI/24,c=Math.cos(a),s=Math.sin(a),rotation=new T.Euler(0,0,a-Math.PI/2);
  // Segmented cassette housings have depth and open gaps between the outer and inner rails.
  b.box(c*r,s*r,0,6.8,10.8,15,k%6===0?'hullShade':'hull',rotation);
  b.box(c*r,s*r,8,5.8,9.6,.65,'navy',rotation);
  b.box(c*r,s*r,8.5,4.9,8.7,.22,k%4===0?'copper':'steel',rotation);
  b.box(c*(r-1.8),s*(r-1.8),8.8,3.6,1.1,.16,'blue',rotation,false);
  if(k%4!==0){
   const direction=v(c,s,0),q=new T.Quaternion().setFromUnitVectors(v(0,0,1),direction),tangent=v(-s,c,0);
   for(const side of [-1,1]){
    const center=v(c*r,s*r,9.9).addScaledVector(tangent,side*1.62);
    b.cylinder(center.x,center.y,center.z,2.15,7.0,2.15,'navy',new T.Quaternion().setFromUnitVectors(v(0,1,0),direction));
    for(let j=0;j<4;j++){const p=center.clone().addScaledVector(direction,-3+j*2);const wire=b.mesh(coilGeometry,'copper',p);wire.quaternion.copy(q);}
    b.beam(center.clone().addScaledVector(direction,-4.1),center.clone().addScaledVector(direction,4.1),.075,'silver');
   }
  }
  b.beam(v(c*62,s*62,-4),v(c*80,s*80,4),.28,'silver');b.beam(v(c*62,s*62,4),v(c*80,s*80,-4),.22,'steel');
  const aa=a+.035;
  b.beam(v(c*80,s*80,-6),v(Math.cos(aa)*62,Math.sin(aa)*62,5),.11,'copper');
  for(let j=0;j<4;j++){const rr=65+j*3;b.box(c*rr,s*rr,9.1,4.8,.19,.36,'silver',rotation);}
  const inner=a+.014;
  b.box(Math.cos(inner)*61.8,Math.sin(inner)*61.8,2,4.3,2.5,6.8,'navy',rotation);
  b.box(Math.cos(inner)*60.5,Math.sin(inner)*60.5,2.2,3.5,.27,5.2,'blue',rotation,false);
 }
 // A real catwalk on the front rim, protected by two handrail tracks and posts.
 const walk=b.mesh(radialArc(84,3.6,Math.PI*.07,Math.PI*.93,8,160),'walkway');walk.material.side=T.DoubleSide;
 for(const rr of [82.3,85.7]){const p=[];for(let k=0;k<=96;k++){const a=Math.PI*.07+k/96*Math.PI*.86;p.push(v(Math.cos(a)*rr,Math.sin(a)*rr,9.25));}b.tube(p,.11,'silver',false,144);}
 for(let k=0;k<=84;k++){const a=Math.PI*.07+k/84*Math.PI*.86;for(const rr of [82.3,85.7])b.beam(v(Math.cos(a)*rr,Math.sin(a)*rr,8),v(Math.cos(a)*rr,Math.sin(a)*rr,9.2),.065,'steel');}
 for(const side of [-1,1]){
  b.box(side*48,-69,-2,18,12,22,'hullShade');b.box(side*48,-66,9.3,15,3,.3,'paneDark');
  for(let j=0;j<7;j++){b.box(side*48-6+j*2,-66,9.6,.085,3.3,.18,'silver');b.box(side*48-6+j*2,-69.4,9.4,1.8,.12,.11,'warmDim',null,false);}
  for(const y of [-67.7,-64.3])b.box(side*48,y,9.6,15.8,.10,.15,'silver');
  for(let j=0;j<4;j++){b.box(side*48-5+j*3,-62.4,-2,2.3,.6,8,'steel');for(let n=0;n<5;n++)b.box(side*48-5+j*3,-62,-5+n*1.3,2.4,.10,.12,'silver');}
  b.box(side*48,-60.6,-2,19,.35,23,'copper');
  b.beam(v(side*38,-65,-3),v(side*22,-96,-5),2.5,'hull');b.beam(v(side*57,-70,2),v(side*35,-96,1),1.9,'steel');
  for(let j=0;j<8;j++)b.box(side*(23+j*1.6),-92+j*3,-5,.28,4.6,4.7,'silver',new T.Euler(0,0,-side*.42));
 }
 b.box(0,-94,-1,79,8,21,'hull');b.box(0,-89.9,-1,75,.22,19.5,'walkway');
 for(const side of [-1,1]){b.box(side*26,-99,-4,12,8,17,'navy');for(let k=0;k<6;k++)b.box(side*26,-95+k*.7,5,10,.16,.25,'copper');}
 const sign=label('HORIZON RELAY','DEEP SPACE TRANSIT   ·   ARRAY 01',23,5);sign.position.set(0,-93.2,10.8);root.add(sign);
 b.finish();
 const field=new T.Mesh(new T.CircleGeometry(60,96),m.field);field.position.z=.5;field.visible=false;root.add(field);
 const shuttle=new T.Group();root.add(shuttle);const s=builder(m,shuttle);s.box(0,0,0,3,1.7,7,'hull');s.box(0,.8,1.5,2.8,.7,2.3,'paneDark');s.box(0,0,-3.65,2,.45,.1,'blue',null,false);s.finish();shuttle.visible=false;
 return {root,field,shuttle,center:RELAY_CENTER.clone()};
}
