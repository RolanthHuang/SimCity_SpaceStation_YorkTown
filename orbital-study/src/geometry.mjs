import * as T from '../lib/three.module.js';
export const v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const primitives={box:new T.BoxGeometry(1,1,1),cylinder:new T.CylinderGeometry(.5,.5,1,16),sphere:new T.SphereGeometry(.5,14,10)};
export function builder(m,root=new T.Group()){
 const batches=new Map();
 const part=(shape,p,s,role,rotation=null,shadow=true)=>{
  const key=shape+':'+role+':'+shadow;
  if(!batches.has(key))batches.set(key,[]);
  batches.get(key).push({shape,p,s,role,rotation,shadow});
 };
 const api={root,part,box:(x,y,z,w,h,d,role='ivory',rotation=null,shadow=true)=>part('box',v(x,y,z),v(w,h,d),role,rotation,shadow),
 cylinder:(x,y,z,w,h,d,role='titanium',rotation=null,shadow=true)=>part('cylinder',v(x,y,z),v(w,h,d),role,rotation,shadow),
 sphere:(x,y,z,w,h,d,role='ivory')=>part('sphere',v(x,y,z),v(w,h,d),role),
 beam:(a,b,r=.12,role='titanium')=>{const delta=b.clone().sub(a);part('cylinder',a.clone().add(b).multiplyScalar(.5),v(r*2,delta.length(),r*2),role,new T.Quaternion().setFromUnitVectors(v(0,1,0),delta.normalize()));},
 mesh:(geometry,role='ivory',position=null,rotation=null,shadow=true)=>{const o=new T.Mesh(geometry,m[role]);if(position)o.position.copy(position);if(rotation)o.rotation.copy(rotation);o.castShadow=shadow;o.receiveShadow=shadow;root.add(o);return o;},
 tube:(points,r=.12,role='titanium',closed=false,segments=80)=>api.mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points,closed,'centripetal'),segments,r,6,closed),role),
 finish:()=>{const dummy=new T.Object3D();for(const list of batches.values()){
  const a=list[0],mesh=new T.InstancedMesh(primitives[a.shape],m[a.role],list.length);
  list.forEach((p,i)=>{dummy.position.copy(p.p);dummy.scale.copy(p.s);dummy.quaternion.identity();if(p.rotation?.isQuaternion)dummy.quaternion.copy(p.rotation);else if(p.rotation)dummy.rotation.copy(p.rotation);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
  mesh.castShadow=a.shadow;mesh.receiveShadow=a.shadow;mesh.computeBoundingSphere();mesh.computeBoundingBox();root.add(mesh);
 }batches.clear();return root;}};return api;
}
export function surface(fn,nu=64,nv=20){
 const pos=[],uv=[],indices=[];
 for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){pos.push(...fn(i/nu,j/nv).toArray());uv.push(i/nu,j/nv);}
 for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i;indices.push(a,a+nu+1,a+1,a+1,a+nu+1,a+nu+2);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();return g;
}
export function radialArc(r,thickness,start=0,end=Math.PI*2,z=0,segments=128){
 return surface((u,w)=>{const a=start+(end-start)*u;return v(Math.cos(a)*(r+(w-.5)*thickness),Math.sin(a)*(r+(w-.5)*thickness),z);},segments,1);
}
export function tree(b,x,y,z,h=5,seed=0){
 b.cylinder(x,y+h*.35,z,.2,h*.7,.2,'bark');
 for(let k=0;k<5;k++){const a=k*2.399+seed,r=h*.15,c=v(x+Math.cos(a)*r,y+h*(.63+.08*(k%2)),z+Math.sin(a)*r);b.beam(v(x,y+h*.43,z),c,.055,'bark');b.sphere(c.x,c.y,c.z,h*.56,h*.46,h*.50,k%2?'leaf':'leaf2');}
}
export function rail(b,a,c,y){
 const length=a.distanceTo(c),n=Math.max(1,Math.ceil(length/2));
 b.beam(v(a.x,y+1.1,a.z),v(c.x,y+1.1,c.z),.047,'steel');b.beam(v(a.x,y+.45,a.z),v(c.x,y+.45,c.z),.025,'steel');
 for(let k=0;k<=n;k++){const p=a.clone().lerp(c,k/n);b.cylinder(p.x,y+.54,p.z,.06,1.08,.06,'steel');}
}
export function label(text,subtitle,w=8,h=2.8){
 const cv=document.createElement('canvas');cv.width=1024;cv.height=256;const c=cv.getContext('2d');c.clearRect(0,0,1024,256);c.fillStyle='#334653';c.font='500 82px sans-serif';c.textAlign='center';c.fillText(text,512,105);c.font='25px sans-serif';c.fillText(subtitle,512,179);
 const map=new T.CanvasTexture(cv);map.colorSpace=T.SRGBColorSpace;
 return new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map,transparent:true,alphaTest:.2,depthWrite:false,roughness:.7,polygonOffset:true,polygonOffsetFactor:-1}));
}
