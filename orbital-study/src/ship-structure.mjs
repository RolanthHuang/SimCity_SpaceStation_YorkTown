import * as T from '../lib/three.module.js';
import {v} from './geometry.mjs';

// Explicit stations keep long straight hull runs and bevels. Every loft has
// bulkheads: looking along the axis can never expose an uncapped tube.
export function stationAt(stations,z){
 const found=stations.findIndex((p,k)=>k<stations.length-1&&z<=stations[k+1][0]),i=found<0?stations.length-2:found;
 const a=stations[i],b=stations[Math.min(i+1,stations.length-1)],t=T.MathUtils.clamp((z-a[0])/(b[0]-a[0]||1),0,1);
 return [T.MathUtils.lerp(a[1],b[1],t),T.MathUtils.lerp(a[2],b[2],t),T.MathUtils.lerp(a[3]||0,b[3]||0,t)];
}
export function hullPoint(stations,a,z,offset=0){
 const [rx,ry,cy]=stationAt(stations,z);
 return v(Math.cos(a)*(rx+offset),cy+Math.sin(a)*(ry+offset),z);
}
export function closedLoft(stations,sides=32){
 const p=[],uv=[],ix=[];
 for(let j=0;j<stations.length;j++)for(let i=0;i<=sides;i++){
  const a=-i/sides*Math.PI*2,s=stations[j];p.push(Math.cos(a)*s[1],(s[3]||0)+Math.sin(a)*s[2],s[0]);uv.push(i/sides,j/(stations.length-1));
 }
 for(let j=0;j<stations.length-1;j++)for(let i=0;i<sides;i++){
  const a=j*(sides+1)+i,c=a+sides+1;ix.push(a,c,a+1,a+1,c,c+1);
 }
 for(const end of [0,stations.length-1]){
  const base=end*(sides+1),s=stations[end],center=p.length/3;p.push(0,s[3]||0,s[0]);uv.push(.5,.5);
  for(let i=0;i<sides;i++)end===0?ix.push(center,base+i,base+i+1):ix.push(center,base+i+1,base+i);
 }
 return finish(p,uv,ix);
}
function finish(p,uv,ix){
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;
}
// Independent, closed plating. The lateral faces catch light and cast real
// seam shadows; these are not dark lines printed over a smooth balloon.
export function solidPatch(point,normal,nu=3,nv=2,thickness=.16){
 const p=[],uv=[],ix=[],stride=nu+1,layer=stride*(nv+1);
 for(let k=0;k<2;k++)for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
  const u=i/nu,w=j/nv,q=point(u,w).clone().addScaledVector(normal(u,w),k?-thickness:0);p.push(...q.toArray());uv.push(u,w);
 }
 for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){
  const a=j*stride+i,c=a+stride;ix.push(a,a+1,c,a+1,c+1,c,a+layer,c+layer,a+1+layer,a+1+layer,c+layer,c+1+layer);
 }
 const edge=[];for(let i=0;i<=nu;i++)edge.push(i);for(let j=1;j<=nv;j++)edge.push(j*stride+nu);for(let i=nu-1;i>=0;i--)edge.push(nv*stride+i);for(let j=nv-1;j>0;j--)edge.push(j*stride);
 for(let i=0;i<edge.length;i++){const a=edge[i],b=edge[(i+1)%edge.length];ix.push(a,a+layer,b,b,a+layer,b+layer);}
 const g=finish(p,uv,ix).toNonIndexed();g.computeVertexNormals();return g;
}
export function structuralPlate(points,offset=v(.5,0,0)){
 const p=[],uv=[],ix=[],n=points.length;
 for(const k of [1,-1])for(const q of points){p.push(...q.clone().addScaledVector(offset,k).toArray());uv.push(q.z*.04,q.y*.04);}
 for(let i=1;i<n-1;i++)ix.push(0,i,i+1,n,n+i+1,n+i);
 for(let i=0;i<n;i++){const j=(i+1)%n;ix.push(i,n+i,j,j,n+i,n+j);}
 // Mirrored wings must retain exterior winding rather than disappearing
 // when the viewer approaches the other side of the ship.
 let volume=0;for(let i=0;i<ix.length;i+=3){const a=v(...p.slice(ix[i]*3,ix[i]*3+3)),b=v(...p.slice(ix[i+1]*3,ix[i+1]*3+3)),c=v(...p.slice(ix[i+2]*3,ix[i+2]*3+3));volume+=a.dot(b.cross(c))/6;}
 if(volume<0)for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];
 const g=finish(p,uv,ix).toNonIndexed();g.computeVertexNormals();return g;
}
export const NACELLE_STATIONS=[[-45,.85,.72],[-43,2.6,2.0],[-39,4.35,3.35],[-33,4.7,3.65],[-14,4.65,3.65],[14,4.45,3.5],[27,4.1,3.3],[35.8,3.84,3.12]];
export const ENGINEERING_STATIONS=[[-56,6.6,4.65,-8],[-45,8.55,6.5,-8],[-29,9.2,6.8,-8],[-9,9.0,6.6,-8],[7,7.75,5.7,-8],[18,6.7,4.8,-8]];
