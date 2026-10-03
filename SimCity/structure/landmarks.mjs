import * as T from '../../YorktownPreview/three.module.js';
import {v,makeBuilder,surfaceGeometry,shellPoint,curvePoints,tree,railing} from './geometry.mjs';
import {placard} from './materials.mjs';
export const TOWER_POSITION=v(-27,0,-6),SHELL_POSITION=v(24,0,-4),GARDEN_POSITION=v(22,0,43);
export function sailEdge(t){return {x:15+7*Math.sin(Math.PI*t)-13*t,y:2+67*t};}
export function makeSailTower(m){
 const root=new T.Group(),shellGroup=new T.Group(),structure=new T.Group();root.add(shellGroup,structure);const b=makeBuilder(m,structure),s=makeBuilder(m,shellGroup);
 b.box(0,-.28,0,33,.56,28,'ivoryCool');b.box(0,.13,0,31,.26,26,'stone');
 // Two occupied wings sit behind a large open atrium, rather than a solid sail slab.
 for(const side of [-1,1]){
  const wing=new T.Shape();wing.moveTo(side*5,0);wing.lineTo(side*14,0);wing.lineTo(side*12,54);wing.quadraticCurveTo(side*8,63,side*3.9,60);wing.lineTo(side*5,0);
  const g=new T.ExtrudeGeometry(wing,{depth:20,bevelEnabled:false,curveSegments:28});const body=s.mesh(g,side<0?'ivoryCool':'ivoryWarm',v(0,0,-10));body.castShadow=true;
  // Six generous public storeys match the explorer; smaller private floors sit above.
  for(let f=0;f<18;f++){
   const isPublic=f<6,y=isPublic?2.12+f*4.5:28.3+(f-6)*2.25,paneHeight=isPublic?3.42:1.56,bottom=y-paneHeight/2-.13,w=8.6-y*.024,xc=side*(9.4-y*.0206);
   for(const z of [-10.18,10.18]){
    s.box(xc,y,z,w,paneHeight,.18,f%5===0?'violet':'deepGlass');s.box(xc,bottom,z+.012,w+.16,.15,.38,'ivory');
    for(let k=0;k<8;k++)s.box(xc-w/2+k*w/7,y,z+.14,.046,paneHeight+.06,.095,k%3===0?'champagne':'steel');
    for(let k=0;k<4;k++)s.box(xc-w*.42+k*w*.25,y,z+.18,w*.17,.045,.25,'titanium');
   }
   // Side elevations carry balconies, alternating brise-soleil and recessed glazing.
   const x=side*(14-y*.033);s.box(x,y,0,.20,paneHeight,19.8,'teal');for(let z=-9;z<=9;z+=1.2)s.box(x+side*.15,y,z,.26,paneHeight+.10,.055,'steel');
   if(f%3===0&&f<21){s.box(x+side*.85,bottom,0,1.7,.18,20,'ivory');for(let z=-9;z<=9;z+=1.5)s.cylinder(x+side*1.55,bottom+.53,z,.04,.94,.04,'champagne');s.beam(v(x+side*1.55,bottom+.99,-9.7),v(x+side*1.55,bottom+.99,9.7),.035,'champagne');}
  }
 }
 // Curved exterior ribs, tension diagonals and visible joints have actual geometry.
 for(const side of [-1,1])for(const z of [-14.4,14.4]){
  const pts=curvePoints(t=>{const e=sailEdge(t);return v(side*e.x,e.y,z);},64);b.tube(pts,.32,'ivory');b.tube(pts.map(p=>v(p.x+side*.47,p.y,p.z)),.065,'champagne');
  for(let n=0;n<8;n++){const a=pts[Math.floor(n/8*64)],c=pts[Math.floor((n+1)/8*64)];b.beam(a,v(side*2.2,c.y,c.z),.14,'steel');b.sphere(a.x,a.y,a.z,.95,.55,.70,'titanium');}
 }
 for(const z of [-14.6,14.6]){for(const x of [-3.9,3.9])b.beam(v(x,1,z),v(0,72,z),.13,'steel');b.beam(v(-2,68,z),v(2,68,z),.28,'ivory');}
 for(let n=0;n<=12;n++){
  const y=2+n*5;const edge=sailEdge((y-2)/67).x;
  const pts=curvePoints(t=>v(-edge+2*edge*t,y+1.5*Math.sin(Math.PI*t),12.2+1.3*Math.sin(Math.PI*t)),24);b.tube(pts,.095,'titanium');
  // Glazed fins are separated by real mullions, allowing the atrium to read through.
  for(let k=0;k<11;k++)b.beam(v(-edge+2*edge*k/10,y,12.2),v(-edge+2*edge*k/10,y+4.6,12.2),.033,'champagne');
 }
 // Transparent atrium skin differs from the solid inhabited wings.
 const veil=surfaceGeometry((u,t)=>{const e=sailEdge(t);return v((u*2-1)*e.x,e.y,12.15+1.35*Math.sin(Math.PI*u));},40,48);s.mesh(veil,'clear');
 b.cylinder(0,39,13.5,16,.65,11,'ivory');b.cylinder(0,39.38,13.5,15.3,.10,10.3,'deepGlass');
 for(let k=0;k<52;k++){const a=k*Math.PI*2/52;b.cylinder(Math.cos(a)*7.5,39.88,13.5+Math.sin(a)*5.1,.045,1.0,.045,'champagne');}
 b.tube(curvePoints(t=>v(Math.cos(t*Math.PI*2)*7.5,40.36,13.5+Math.sin(t*Math.PI*2)*5.1),80),.055,'champagne',true);
 b.beam(v(0,39,11),v(0,35,6),.26,'steel');
 // Podium, entry doors, engraved seams and sheltered trees tie the tower to the street.
 for(let i=0;i<4;i++)b.box(0,.12+i*.12,14.2+i*.58,7.8,.18,.85,'stone');
 for(const x of [-2.2,2.2]){b.box(x,1.6,12.3,1.7,3.15,.12,'teal');b.box(x,1.6,12.4,.055,3.3,.08,'champagne');b.box(x,1.55,12.48,.04,.8,.08,'gold');}
 b.box(0,3.4,13.3,7.4,.20,3.6,'ivory');b.box(0,3.25,14.2,6.8,.035,.09,'warmDim');
 for(const x of [-11,11]){b.box(x,.65,14.1,5.2,1.05,2.1,'ivoryWarm');b.box(x,1.19,14.1,4.8,.10,1.75,'soil');tree(b,x,1.25,14.1,3.1,x<0?0:1);}
 for(let k=0;k<9;k++){const z=-9+k*2.2;b.box(-16.2,.06,z,.24,.035,1.4,'copper');}
 const sign=placard('星帆巡航塔','STARSAIL / PUBLIC ATRIUM',4.7,2);sign.position.set(-7,2.8,12.5);root.add(sign);
 b.finish();s.finish();return {root,skin:shellGroup,structure};
}
export function makeShellHall(m){
 const root=new T.Group(),b=makeBuilder(m,root);b.box(0,-.35,0,36,.7,39,'ivoryCool');
 for(let k=0;k<5;k++)b.box(0,k*.19,18+k*.6,27+2*k,.24,3.2,'stone');
 b.box(0,.35,0,31,.65,34,'ivoryWarm');b.box(0,1.6,0,30,2.5,30,'dark');
 for(const side of [-1,1])for(let j=0;j<3;j++){
  const w=6.4-j*.8,h=18.5-j*3.0,l=19-j*1.5,z=-8+j*8.7,x=side*7.3;
  const shell=new T.Group();shell.position.set(x,3.0,z);shell.rotation.y=side*.10;
  const sh=makeBuilder(m,shell),g=surfaceGeometry((u,t)=>shellPoint(u,t,w,h,l),58,30);sh.mesh(g,'shell');
  const inside=g.clone();inside.translate(0,-.19,0);sh.mesh(inside,'shellInside');
  for(let k=0;k<11;k++){
   const vv=k/10;const pts=curvePoints(u=>{const p=shellPoint(u,vv,w,h,l);p.y-=.25;return p;},58);sh.tube(pts,.10,'ivoryWarm');
  }
  for(const vv of [0,1])sh.tube(curvePoints(u=>shellPoint(u,vv,w,h,l),64),.16,'champagne');
  sh.tube(curvePoints(t=>shellPoint(.68,t,w,h,l),40),.09,'ivory');
  // Ceramic roof joints lie on the curved surface, rather than painted box outlines.
  for(let k=1;k<18;k++){
   const u=k/18;sh.tube(curvePoints(t=>{const p=shellPoint(u,t,w,h,l);p.y+=.025;return p;},28),.023,'ivoryCool');
  }
  for(const vv of [0,1])for(const u of [.10,.84]){const p=shellPoint(u,vv,w,h,l);sh.beam(v(p.x,0,p.z),p,.18,'ivory');sh.sphere(p.x,p.y,p.z,.52,.4,.52,'gold');}
  sh.finish();root.add(shell);
 }
 // Curved curtain walls and individual columns beneath the overlapping roof petals.
 for(let j=0;j<44;j++){const a=-Math.PI*.92+j*Math.PI*1.84/43;const x=15*Math.sin(a),z=16*Math.cos(a);b.box(x,3.7,z,.95,5.8,.13,j%6===0?'violet':'teal',-a);b.cylinder(x,3.6,z,.12,6,.12,'steel');}
 for(let i=0;i<10;i++){const x=-12+i*2.7;b.box(x,3.2,16.35,2.25,4.9,.10,'deepGlass');b.box(x,3.2,16.46,.05,5,.12,'champagne');}
 b.box(0,5.65,17.3,25,.19,3.1,'ivory');
 b.box(-20,.15,1.8,3.9,.23,27,'water');b.box(-22.4,.65,1.8,.65,1.25,27,'ivory');
 for(let k=0;k<7;k++){tree(b,-18.4,0,-10+k*4.2,3.2+(k%2)*.6,k%3);b.box(19.2,.6,-9+k*4.2,2.7,1.1,2.8,'stone');b.box(19.2,1.19,-9+k*4.2,2.4,.06,2.5,'soil');tree(b,19.2,1.25,-9+k*4.2,2.7,k%4);}
 for(let k=0;k<5;k++){b.box(-11+k*5.4,.68,22.6,3.6,.21,.76,'wood');b.box(-11+k*5.4,.37,22.6,2.9,.43,.50,'steel');}
 const sign=placard('潮汐殼館','TIDAL FORUM / CULTURE',4.8,1.4);sign.position.set(0,3.5,16.7);root.add(sign);b.finish();return root;
}
