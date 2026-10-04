import * as T from '../YorktownPreview/three.module.js';

// Authored unit geometry, shared by all plots and built once per renderer.
function merge(parts){
 const flat=parts.map(g=>g.index?g.toNonIndexed():g),out=new T.BufferGeometry();
 for(const [key,size]of [['position',3],['normal',3],['uv',2]]){const data=new Float32Array(flat.reduce((n,g)=>n+g.attributes[key].array.length,0));let at=0;for(const g of flat){data.set(g.attributes[key].array,at);at+=g.attributes[key].array.length;}out.setAttribute(key,new T.BufferAttribute(data,size));}
 for(const g of new Set([...parts,...flat]))g.dispose();return out;
}
function taper(points,r0,r1,steps=24,sides=12){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),pos=[],uv=[],index=[];
 for(let k=0;k<=steps;k++){const t=k/steps,p=curve.getPoint(t),up=curve.getTangent(t).normalize(),across=new T.Vector3(0,0,1).cross(up).normalize(),side=up.clone().cross(across),r=r0*(1-t)+r1*t;
  for(let j=0;j<=sides;j++){const a=j*Math.PI*2/sides,v=p.clone().addScaledVector(across,Math.cos(a)*r*(1+.08*Math.sin(j*3+k*.3))).addScaledVector(side,Math.sin(a)*r);pos.push(...v.toArray());uv.push(j/sides,t*4);}
 }
 for(let k=0;k<steps;k++)for(let j=0;j<sides;j++){const a=k*(sides+1)+j,b=a+sides+1;index.push(a,a+1,b,b,a+1,b+1);}
 // Close each structural member; open tube ends otherwise look like cut paper.
 for(const end of [0,steps]){const center=pos.length/3,p=curve.getPoint(end/steps);pos.push(...p.toArray());uv.push(.5,.5);for(let j=0;j<sides;j++){const a=end*(sides+1)+j;end===0?index.push(center,a+1,a):index.push(center,a,a+1);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();return g;
}
function timberTrunk(){const parts=[taper([[0,-.5,0],[.028,-.10,.018],[-.019,.20,0],[0,.49,0]],.155,.054,28,16)];for(let k=0;k<5;k++){const a=k*Math.PI*2/5;parts.push(taper([[0,-.25,0],[Math.cos(a)*.16,-.46,Math.sin(a)*.16],[Math.cos(a)*.23,-.495,Math.sin(a)*.23]],.056,.012,9,16));}return merge(parts);}
function trunk(low=false){
 const n=low?7:28,s=low?6:16,parts=[taper([[0,-.5,0],[.028,-.10,.018],[-.019,.20,0],[0,.49,0]],.155,.054,n,s)];
 for(const side of [-1,1])parts.push(taper([[0,.08,0],[side*.11,.21,-.01],[side*.25,.35,.009],[side*.32,.46,0]],.081,.036,n,s));
 for(let k=0;k<5;k++){const a=k*Math.PI*2/5;parts.push(taper([[0,-.25,0],[Math.cos(a)*.16,-.46,Math.sin(a)*.16],[Math.cos(a)*.23,-.495,Math.sin(a)*.23]],.056,.012,low?3:9,s));}
 return merge(parts);
}
const stemCurve=()=>new T.CatmullRomCurve3([[0,-.5,0],[.028,-.10,.018],[-.019,.20,0],[0,.49,0]].map(p=>new T.Vector3(...p)));
function stemSkin(){
 const curve=stemCurve(),pos=[],uv=[],index=[],rows=28,cols=14;
 for(let k=0;k<=rows;k++)for(let j=0;j<=cols;j++){const t=.06+k/rows*.72,p=curve.getPoint(t),a=Math.PI*(.13+j/cols*.74),r=.155*(1-t)+.054*t+.015;pos.push(p.x+Math.cos(a)*r,p.y,p.z+Math.sin(a)*r);uv.push(j/cols*1.6,k/rows*1.8);}
 for(let k=0;k<rows;k++)for(let j=0;j<cols;j++){const a=k*(cols+1)+j,b=a+cols+1;index.push(a,a+1,b,b,a+1,b+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();return g;
}
function stemFrame(){
 const parts=[],curve=stemCurve(),point=(t,a)=>{const p=curve.getPoint(t),r=.155*(1-t)+.054*t+.018;return new T.Vector3(p.x+Math.cos(a)*r,p.y,p.z+Math.sin(a)*r);};
 for(let k=0;k<21;k++){const t=.06+k*.72/20;parts.push(new T.TubeGeometry(new T.CatmullRomCurve3(Array.from({length:15},(_,j)=>point(t,Math.PI*(.13+j/14*.74)))),14,.0016,4));}
 for(const a of [.13,.37,.63,.87])parts.push(new T.TubeGeometry(new T.CatmullRomCurve3(Array.from({length:29},(_,j)=>point(.06+j*.72/28,a*Math.PI))),28,.003,4));
 return merge(parts);
}
function woodBraces(stage){
 const parts=[],n=3+stage;
 for(let k=0;k<n;k++){const a=k*2.399,y=-.45+.20+k*.63/(n-1),x=Math.cos(a)*.25,z=Math.sin(a)*.25;parts.push(taper([[0,y-.18,0],[x*.55,y-.14,z*.55],[x,y-.075,z]],.032,.012,12,8));}
 return merge(parts);
}
function roundWindow(){const parts=[new T.TorusGeometry(.31,.012,4,40)];for(const a of [0,Math.PI/3,Math.PI*2/3]){const g=new T.BoxGeometry(.60,.009,.012).rotateZ(a);parts.push(g);}return merge(parts);}
function timberHouse(low=false){
 const s=new T.Shape(),r=.14;s.moveTo(-.5+r,-.5);s.lineTo(.5-r,-.5);s.quadraticCurveTo(.5,-.5,.5,-.5+r);s.lineTo(.5,.5-r);s.quadraticCurveTo(.5,.5,.5-r,.5);s.lineTo(-.5+r,.5);s.quadraticCurveTo(-.5,.5,-.5,.5-r);s.lineTo(-.5,-.5+r);s.quadraticCurveTo(-.5,-.5,-.5+r,-.5);
 const hole=new T.Path();hole.absarc(0,0,.29,0,Math.PI*2,true);s.holes.push(hole);
 const g=new T.ExtrudeGeometry(s,{depth:.84,bevelEnabled:!low,bevelThickness:.08,bevelSize:.025,bevelSegments:2,curveSegments:low?8:24});g.translate(0,0,-.42);return g;
}
function rail(stage){const pieces=[];for(const radius of [.145,.29]){const points=Array.from({length:97},(_,k)=>{const a=k/96*Math.PI*2*(1.5+stage*.25);return new T.Vector3(Math.cos(a)*radius,-.40+k/96*.84,Math.sin(a)*radius);});pieces.push(new T.TubeGeometry(new T.CatmullRomCurve3(points),96,.0025,4));}return merge(pieces);}
function crownFrame(){
 const parts=[];
 for(let k=0;k<28;k++){const a=k*Math.PI*2/28,g=new T.BoxGeometry(.007,1,.007);g.translate(Math.cos(a)*.498,0,Math.sin(a)*.498);parts.push(g);}
 for(const y of [-.49,-.25,0,.25,.49]){const g=new T.TorusGeometry(.498,.006,4,40).rotateX(Math.PI/2);g.translate(0,y,0);parts.push(g);}
 return merge(parts);
}
function steps(stage,low=false){
 const n=low?20:64+stage*12,turns=1.5+stage*.25,parts=[];
 for(let k=0;k<n;k++){const a=k/n*Math.PI*2*turns,g=new T.BoxGeometry(.155,.009,.046);g.translate(.21,-.43+k/n*.84,0);g.rotateY(-a);parts.push(g);}
 return merge(parts);
}
function ribbon(stage,low=false){
 const turns=1.5+stage*.25,n=low?24:96,pos=[],uv=[],indices=[];
 for(let k=0;k<=n;k++)for(let j=0;j<=1;j++){const a=k/n*Math.PI*2*turns,r=.145+j*.145;pos.push(Math.cos(a)*r,-.43+k/n*.84,Math.sin(a)*r);uv.push(j,k/n*turns*4);}
 for(let k=0;k<n;k++){const a=k*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
 const back=g.clone();for(let k=0;k<back.index.count;k+=3){const a=back.index.array;[a[k+1],a[k+2]]=[a[k+2],a[k+1]];}back.translate(0,-.009,0);back.computeVertexNormals();return merge([g,back]);
}
function portal(){const s=new T.Shape();s.moveTo(-.5,-.5);s.lineTo(.5,-.5);s.lineTo(.5,.5);s.lineTo(-.5,.5);s.closePath();const hole=new T.Path();hole.absarc(0,0,.31,0,Math.PI*2,true);s.holes.push(hole);const g=new T.ExtrudeGeometry(s,{depth:.08,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2,curveSegments:24});g.translate(0,0,-.04);return g;}
function cubePortal(low=false){const s=new T.Shape();s.moveTo(-.5,-.5);s.lineTo(-.5,.5);s.lineTo(.5,.5);s.lineTo(.5,-.5);s.lineTo(.24,-.5);s.lineTo(.24,.06);s.absarc(0,.06,.24,0,Math.PI,false);s.lineTo(-.24,-.5);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:1,bevelEnabled:false,curveSegments:low?8:24});g.translate(0,0,-.5);return g;}
function lattice(low=false){
 const parts=[],n=low?6:14;
 for(const dir of [-1,1])for(let k=-n;k<=n;k++){
  const pts=[];for(let j=0;j<=n*2;j++){const x=-.47+j/n*.47,y=dir*x+k/n;
   if(y>=-.47&&y<=.47&&(Math.abs(x)>.245||y>.06+Math.sqrt(Math.max(0,.245**2-x*x))))pts.push(new T.Vector3(x,y,0));else if(pts.length>1){parts.push(new T.TubeGeometry(new T.CatmullRomCurve3(pts),pts.length-1,.0028,4));pts.length=0;}else pts.length=0;
  }if(pts.length>1)parts.push(new T.TubeGeometry(new T.CatmullRomCurve3(pts),pts.length-1,.0028,4));
 }return merge(parts);
}
export function residentialShapes(){
 const s={timberTrunk:timberTrunk(),forestStemGlass:stemSkin(),forestStemFrame:stemFrame(),woodRoundWindow:roundWindow(),timberHouse:timberHouse(),timberHouseLow:timberHouse(true),treeCrownFrame:crownFrame(),forestTrunk:trunk(),forestTrunkLow:trunk(true),woodPortal:portal(),treePod:new T.SphereGeometry(.5,24,12),treePodLow:new T.SphereGeometry(.5,10,6),treeDeckFar:new T.TorusGeometry(.46,.04,2,12).rotateX(Math.PI/2),cubePortal:cubePortal(),cubePortalLow:cubePortal(true),cubeLattice:lattice(),cubeLatticeLow:lattice(true)};
 s.cubeLatticeSide=s.cubeLattice.clone().rotateY(Math.PI/2);s.cubeLatticeSideLow=s.cubeLatticeLow.clone().rotateY(Math.PI/2);
 for(let t=0;t<4;t++){s[`woodRail${t}`]=rail(t);s[`woodBraces${t}`]=woodBraces(t);}
 for(let t=0;t<4;t++)for(const low of [false,true]){s[`woodSteps${t}${low?'Low':''}`]=steps(t,low);s[`woodRibbon${t}${low?'Low':''}`]=ribbon(t,low);}
 for(const g of Object.values(s)){g.computeBoundingBox();g.computeBoundingSphere();}return s;
}
