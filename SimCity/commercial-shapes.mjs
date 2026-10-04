import * as T from '../YorktownPreview/three.module.js';

// Built once per renderer. Every plot instances these buffers; no per-frame geometry.
// Unlike the older primitives, these shapes share an authored unit coordinate frame.
export const exchangeRadius=t=>.225*(1-t)+.277*Math.sin(Math.PI*t)**.88+.004;
const point=(t,a,extra=0)=>new T.Vector3((exchangeRadius(t)+extra)*Math.cos(a),t-.5,(exchangeRadius(t)+extra)*Math.sin(a));
function merge(parts){
 const out=new T.BufferGeometry(),flat=parts.map(g=>g.index?g.toNonIndexed():g);
 for(const name of ['position','normal','uv']){const data=new Float32Array(flat.reduce((n,g)=>n+g.attributes[name].array.length,0));let at=0;for(const g of flat){data.set(g.attributes[name].array,at);at+=g.attributes[name].array.length;}out.setAttribute(name,new T.BufferAttribute(data,name==='uv'?2:3));}
 for(const g of new Set([...parts,...flat]))g.dispose();out.computeBoundingBox();out.computeBoundingSphere();return out;
}
const tube=(points,r=.002,segments=24)=>new T.TubeGeometry(new T.CatmullRomCurve3(points),segments,r,5,false);
function surface(rows,columns,fn){
 const pos=[],uv=[],indices=[];
 for(let i=0;i<=rows;i++)for(let j=0;j<=columns;j++){pos.push(...fn(i/rows,j/columns));uv.push(j/columns,i/rows);}
 for(let i=0;i<rows;i++)for(let j=0;j<columns;j++){const a=i*(columns+1)+j,b=a+columns+1;indices.push(a,b,a+1,b,b+1,a+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function core(low=false,far=false){const n=far?10:low?16:48;return new T.LatheGeometry(Array.from({length:n+1},(_,k)=>new T.Vector2(exchangeRadius(k/n),k/n-.5)),far?12:low?20:48);}
function lattice(low=false){
 const parts=[],strands=low?8:16;
 for(const direction of [-1,1])for(let k=0;k<strands;k++)parts.push(tube(Array.from({length:33},(_,j)=>point(.015+j*.97/32,k*Math.PI*2/strands+direction*j*.065,.003)),low?.003:.0018,low?20:48));
 return merge(parts);
}
function floors(){return merge(Array.from({length:38},(_,k)=>{const t=.022+k*.0254,r=exchangeRadius(t)+.001,g=new T.TorusGeometry(r,.0015,4,40);g.rotateX(Math.PI/2);g.translate(0,t-.5,0);return g;}));}
function helix(stage,kind,low=false,far=false){
 const turns=[1.25,1.85,2.5,3.15][stage],steps=far?24:low?40:Math.ceil(turns*54),at=(u,e)=>point(.035+u*.92,u*Math.PI*2*turns-.8,e);
 if(kind==='deck'){
  const top=surface(steps,2,(u,v)=>at(u,.006+v*.070).toArray());
  const bottom=top.clone();bottom.translate(0,-.009,0);const index=bottom.index.array;for(let k=0;k<index.length;k+=3)[index[k+1],index[k+2]]=[index[k+2],index[k+1]];bottom.computeVertexNormals();
  const edge=surface(steps,1,(u,v)=>{const p=at(u,.076);p.y-=v*.009;return p.toArray();});return merge([top,bottom,edge]);
 }
 if(kind==='glass')return surface(steps,1,(u,v)=>{const p=at(u,.062);p.y+=.014+v*.030;return p.toArray();});
 const parts=[.008,.078].map(extra=>tube(Array.from({length:steps+1},(_,k)=>at(k/steps,extra)),.0022,steps));
 if(!low)for(let k=0;k<=Math.ceil(turns*22);k++){const u=k/Math.ceil(turns*22),p=at(u,.077),q=p.clone();q.y+=.044;parts.push(tube([p,q],.0012,1));}
 return merge(parts);
}
function fanPoint(r,a,under=false){
 const angle=(a-.5)*Math.PI*.96,x=.47*r*Math.sin(angle),z=.46-.86*r*Math.cos(angle);
 const y=.34*(1-r)**.72+.075*r*Math.cos(angle*5)-.15-(under?.026:0);return new T.Vector3(x,y,z);
}
function shell(low=false,far=false){
 const rows=far?4:low?7:18,cols=far?8:low?16:42;
 const upper=surface(rows,cols,(r,a)=>fanPoint(r,a).toArray()),lower=surface(rows,cols,(r,a)=>fanPoint(r,1-a,true).toArray());
 // Parametric radius/angle order points down on the upper roof. Correct both
 // skins so the canopy is solid when seen from above and from its arcade.
 for(const g of [upper,lower]){const a=g.index.array;for(let k=0;k<a.length;k+=3)[a[k+1],a[k+2]]=[a[k+2],a[k+1]];g.computeVertexNormals();}
 const lip=surface(cols,1,(a,v)=>fanPoint(1,a,!!v).toArray());return merge([upper,lower,lip]);
}
function ribs(){return merge(Array.from({length:13},(_,k)=>tube(Array.from({length:17},(_,j)=>fanPoint(j/16,k/12,true)),.006,24)));}
function pylon(){
 const s=new T.Shape();s.moveTo(-.23,-.5);s.lineTo(.13,-.5);s.lineTo(.48,.5);s.lineTo(.20,.5);s.lineTo(-.02,.07);s.lineTo(-.22,.5);s.lineTo(-.47,.5);s.lineTo(-.20,-.05);s.closePath();
 const g=new T.ExtrudeGeometry(s,{depth:1,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.016,bevelThickness:.016});g.translate(0,0,-.5);g.scale(.95,.96,.96);return g;
}
function cables(low=false){
 const parts=[];for(const side of [-1,1])for(const z of [-.19,.19])for(let k=0;k<(low?3:7);k++){
  const x=-.29+k*.58/((low?3:7)-1);parts.push(tube([new T.Vector3(side*.37,.48,z),new T.Vector3(x,.02,z)],low?.003:.0018,1));
 }return merge(parts);
}
function truss(){
 const parts=[];for(const z of [-.48,.48]){for(const y of [-.45,.45])parts.push(tube([new T.Vector3(-.48,y,z),new T.Vector3(.48,y,z)],.012,1));for(let k=0;k<12;k++){const x=-.48+k*.08;parts.push(tube([new T.Vector3(x,k%2?.45:-.45,z),new T.Vector3(x+.08,k%2?-.45:.45,z)],.009,1));}}return merge(parts);
}
function podFrame(){const g=new T.IcosahedronGeometry(.502,1),edges=new T.EdgesGeometry(g,1),a=edges.attributes.position.array,parts=[];for(let i=0;i<a.length;i+=6)parts.push(new T.TubeGeometry(new T.LineCurve3(new T.Vector3(...a.slice(i,i+3)),new T.Vector3(...a.slice(i+3,i+6))),1,.004,4));g.dispose();edges.dispose();return merge(parts);}
export function commercialShapes(){
 const shapes={bridgePodFrame:podFrame(),exchangeCore:core(),exchangeCoreLow:core(true),exchangeCoreFar:core(true,true),exchangeLattice:lattice(),exchangeLatticeLow:lattice(true),exchangeFloors:floors(),marketShell:shell(),marketShellLow:shell(true),marketShellFar:shell(true,true),marketRibs:ribs(),bridgePylon:pylon(),bridgeCables:cables(),bridgeCablesLow:cables(true),bridgeTruss:truss(),bridgePod:new T.IcosahedronGeometry(.5,1),bridgePodFar:new T.IcosahedronGeometry(.5,0)};
 for(let stage=0;stage<4;stage++)for(const kind of ['deck','edge','glass']){const name=`helix${stage}${kind}`;shapes[name]=helix(stage,kind);if(kind==='deck'||kind==='edge')shapes[name+'Low']=helix(stage,kind,true);}
 for(let stage=0;stage<4;stage++)shapes[`helix${stage}deckFar`]=helix(stage,'deck',true,true);
 for(const g of Object.values(shapes)){g.computeBoundingBox();g.computeBoundingSphere();}
 return shapes;
}
