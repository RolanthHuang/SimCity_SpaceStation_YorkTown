import * as T from '../lib/three.module.js';

// Bake static architectural parts once per prototype. Clones share the baked
// buffers; no facade, railing, UV, or material detail is removed.
export function batchStaticArchitecture(root){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),groups=new Map();
 root.traverse(mesh=>{
  if(!mesh.isMesh||Array.isArray(mesh.material)||mesh.instanceColor)return;
  for(let p=mesh;p!==root;p=p.parent)if(p.userData.dynamic||!p.visible)return;
  const key=`${mesh.material.uuid}:${mesh.castShadow}:${mesh.receiveShadow}`;
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(mesh);
 });
 for(const meshes of groups.values()){
  if(meshes.length<2)continue;
  const positions=[],normals=[],uv=[],point=new T.Vector3(),normal=new T.Vector3(),matrix=new T.Matrix4(),instance=new T.Matrix4(),normalMatrix=new T.Matrix3();
  for(const mesh of meshes){
   const geometry=mesh.geometry,position=geometry.getAttribute('position'),n=geometry.getAttribute('normal'),tex=geometry.getAttribute('uv'),index=geometry.index;
   for(let k=0;k<(mesh.isInstancedMesh?mesh.count:1);k++){
    matrix.multiplyMatrices(inverse,mesh.matrixWorld);if(mesh.isInstancedMesh){mesh.getMatrixAt(k,instance);matrix.multiply(instance);}normalMatrix.getNormalMatrix(matrix);
    for(let j=0;j<(index?.count||position.count);j++){
     const v=index?index.getX(j):j;point.fromBufferAttribute(position,v).applyMatrix4(matrix);positions.push(point.x,point.y,point.z);
     if(n)normal.fromBufferAttribute(n,v).applyNormalMatrix(normalMatrix);else normal.set(0,1,0);normals.push(normal.x,normal.y,normal.z);uv.push(tex?tex.getX(v):0,tex?tex.getY(v):0);
    }
   }
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.computeBoundingSphere();geometry.computeBoundingBox();
  const baked=new T.Mesh(geometry,meshes[0].material);baked.castShadow=meshes[0].castShadow;baked.receiveShadow=meshes[0].receiveShadow;
  for(const mesh of meshes){mesh.parent.remove(mesh);if(mesh.isInstancedMesh)mesh.dispose();}root.add(baked);
 }
 return root;
}
