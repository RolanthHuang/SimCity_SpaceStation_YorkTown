import * as T from '../../YorktownPreview/three.module.js';
export const v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
export function surfaceGeometry(point,nu=48,nv=20){
 const p=[],uv=[],idx=[];for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const a=point(i/nu,j/nv);p.push(a.x,a.y,a.z);uv.push(i/nu,j/nv);}
 for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+1,c=a+nu+1,d=c+1;idx.push(a,c,b,b,c,d);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();g.computeBoundingBox();return g;
}
export function shellPoint(u,vv,w=5,h=15,l=16){const a=(vv-.5)*Math.PI;return v(Math.sin(a)*w*(.24+.76*Math.pow(Math.sin(Math.PI*u),.6)),h*Math.sin(Math.PI*u/1.18)*(.25+.75*Math.cos(a)),l*(u-.5));}
export function curveTube(points,r=.08,closed=false,segments=80){const curve=new T.CatmullRomCurve3(points,closed,'centripetal');return new T.TubeGeometry(curve,segments,r,8,closed);}
export function curvePoints(fn,count=40){return Array.from({length:count+1},(_,i)=>fn(i/count));}
export function makeBuilder(materials,parent=new T.Group()){
 const geometry={box:new T.BoxGeometry(1,1,1),cylinder:new T.CylinderGeometry(.5,.5,1,16),sphere:new T.SphereGeometry(.5,12,8),leaf:new T.PlaneGeometry(1,1)},batches=new Map();
 const add=(shape,x,y,z,w,h,d,role,rotation=null)=>{const key=shape+':'+role;if(!batches.has(key))batches.set(key,[]);batches.get(key).push({shape,x,y,z,w,h,d,role,rotation});};
 const api={group:parent,part:add,box:(x,y,z,w,h,d,role='ivory',ry=0)=>add('box',x,y,z,w,h,d,role,new T.Euler(0,ry,0)),cylinder:(x,y,z,w,h,d,role='titanium')=>add('cylinder',x,y,z,w,h,d,role),sphere:(x,y,z,w,h,d,role='ivory')=>add('sphere',x,y,z,w,h,d,role),leaf:(x,y,z,w,h,role,rotation)=>add('leaf',x,y,z,w,h,1,role,rotation),beam:(a,b,r=.1,role='titanium')=>{const p=a.clone().add(b).multiplyScalar(.5),d=b.clone().sub(a);add('cylinder',p.x,p.y,p.z,r*2,d.length(),r*2,role,new T.Quaternion().setFromUnitVectors(v(0,1,0),d.normalize()));},mesh:(g,role='ivory',position=null,rotation=null)=>{const mesh=new T.Mesh(g,materials[role]);if(position)mesh.position.copy(position);if(rotation)mesh.rotation.copy(rotation);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;},tube:(points,r=.08,role='gold',closed=false)=>api.mesh(curveTube(points,r,closed),role),finish:()=>{
  const dummy=new T.Object3D();for(const list of batches.values()){const first=list[0],mesh=new T.InstancedMesh(geometry[first.shape],materials[first.role],list.length);for(let i=0;i<list.length;i++){const p=list[i];dummy.position.set(p.x,p.y,p.z);dummy.scale.set(p.w,p.h,p.d);dummy.quaternion.identity();if(p.rotation instanceof T.Quaternion)dummy.quaternion.copy(p.rotation);else if(p.rotation)dummy.rotation.copy(p.rotation);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);}return parent;
 }};return api;
}
export function tree(b,x,y,z,size=4,variant=0){
 b.cylinder(x,y+size*.29,z,.14*size,size*.58,.14*size,'bark');
 const role=['foliage','foliagePale','foliageBlue','foliageAmber'][variant%4];
 for(let k=0;k<4;k++){const a=k*2.39+variant,r=size*(.12+.035*k),c=v(x+Math.cos(a)*r,y+size*(.65+.07*(k%2)),z+Math.sin(a)*r);b.beam(v(x,y+size*.4,z),c,.035*size,'bark');for(let j=0;j<8;j++){const angle=j*2.399+k,rr=size*(.1+.04*(j%3));b.leaf(c.x+Math.cos(angle)*rr,c.y+(j%4)*.13*size,c.z+Math.sin(angle)*rr,size*.46,size*.39,role,new T.Euler(.1+(j%3)*.5,angle,Math.sin(j)*.3));}}
}
export function railing(b,a,z0,z1,y,role='titanium'){b.beam(v(a,y+1.04,z0),v(a,y+1.04,z1),.045,role);b.beam(v(a,y+.45,z0),v(a,y+.45,z1),.028,role);for(let z=z0;z<=z1+.01;z+=1.5)b.cylinder(a,y+.52,z,.055,1.04,.055,role);}
