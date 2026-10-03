import * as T from '../YorktownPreview/three.module.js';
const normalized=g=>{g.computeBoundingBox();const b=g.boundingBox,size=b.getSize(new T.Vector3()),center=b.getCenter(new T.Vector3());g.translate(-center.x,-center.y,-center.z);g.scale(1/size.x,1/size.y,1/size.z);g.computeVertexNormals();return g;};
function domeFrame(){
 const pieces=[];
 const tube=points=>pieces.push(new T.TubeGeometry(new T.CatmullRomCurve3(points),24,.0035,5,false).toNonIndexed());
 for(let k=0;k<12;k++){const a=k*Math.PI/6;tube(Array.from({length:17},(_,j)=>{const u=j*Math.PI/32;return new T.Vector3(.5*Math.cos(u)*Math.cos(a),.5*Math.sin(u),.5*Math.cos(u)*Math.sin(a));}));}
 for(let k=1;k<=4;k++){const u=k*Math.PI/12;tube(Array.from({length:49},(_,j)=>{const a=j*Math.PI/24;return new T.Vector3(.5*Math.cos(u)*Math.cos(a),.5*Math.sin(u),.5*Math.cos(u)*Math.sin(a));}));}
 const g=new T.BufferGeometry();for(const key of ['position','normal','uv']){const data=new Float32Array(pieces.reduce((n,p)=>n+p.getAttribute(key).array.length,0));let offset=0;for(const p of pieces){data.set(p.getAttribute(key).array,offset);offset+=p.getAttribute(key).array.length;}g.setAttribute(key,new T.BufferAttribute(data,key==='uv'?2:3));}
 pieces.forEach(p=>p.dispose());return normalized(g);
}
export function architecturalShapes(){
 const sailShape=new T.Shape();sailShape.moveTo(-.5,-.5);sailShape.lineTo(.5,-.5);sailShape.lineTo(.5,.5);sailShape.bezierCurveTo(.2,.43,-.45,-.05,-.5,-.5);
 return {ring:normalized(new T.TorusGeometry(.485,.015,8,64)),ringDeck:normalized(new T.TorusGeometry(.46,.04,7,40).rotateX(Math.PI/2)),arch:normalized(new T.TorusGeometry(.46,.04,7,32,Math.PI)),dome:normalized(new T.SphereGeometry(.5,32,16,0,Math.PI*2,0,Math.PI/2)),domeFrame:domeFrame(),vault:normalized(new T.CylinderGeometry(.5,.5,1,24,1,false,0,Math.PI).rotateZ(Math.PI/2)),sail:normalized(new T.ExtrudeGeometry(sailShape,{depth:1,bevelEnabled:false,curveSegments:20}))};
}
