import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../YorktownPreview/three.module.js';
import {batchStaticArchitecture} from '../SimCity/static-batch.mjs';
import {AtelierScene} from '../SimCity/atelier-scene.mjs';
import {createCity} from '../SimCity/engine.mjs';
import {idx} from '../SimCity/catalog.mjs';
import {fuse,square} from '../SimCity/plots.mjs';
import {makeSailTower,makeShellHall} from '../SimCity/structure/landmarks.mjs';

test('static batching preserves all transformed triangles, bounds, normals and UVs',()=>{
 const root=new T.Group(),material=new T.MeshStandardMaterial(),geometry=new T.BoxGeometry(1,1,1),instances=new T.InstancedMesh(geometry,material,2),single=new T.Mesh(geometry,material);
 root.position.set(100,4,8);instances.position.set(2,0,0);single.position.set(-2,0,0);single.scale.set(1,2,3);single.rotation.y=.3;
 instances.setMatrixAt(0,new T.Matrix4().makeTranslation(0,1,0));instances.setMatrixAt(1,new T.Matrix4().makeTranslation(0,4,0));root.add(instances,single);
 root.updateMatrixWorld(true);const before=new T.Box3().setFromObject(root),triangles=geometry.index.count*3/3;batchStaticArchitecture(root);assert.equal(root.children.length,1);
 const baked=root.children[0],after=new T.Box3().setFromObject(root);assert.ok(before.min.distanceTo(after.min)<1e-6);assert.ok(before.max.distanceTo(after.max)<1e-6);assert.equal(baked.geometry.attributes.position.count/3,triangles);assert.equal(baked.material,material);
 for(const name of ['position','normal','uv'])assert.ok([...baked.geometry.getAttribute(name).array].every(Number.isFinite));
 const clone=root.clone(true);assert.equal(clone.children[0].geometry,baked.geometry,'city copies reuse the exact baked buffer');
});
test('moving mechanisms and individually coloured instances are kept live',()=>{
 const root=new T.Group(),material=new T.MeshStandardMaterial(),geometry=new T.BoxGeometry(1,1,1),mechanism=new T.Group();mechanism.userData.dynamic=true;
 const moving=new T.Mesh(geometry,material),a=new T.Mesh(geometry,material),b=new T.Mesh(geometry,material),colours=new T.InstancedMesh(geometry,material,1);colours.setColorAt(0,new T.Color('red'));mechanism.add(moving);root.add(a,b,mechanism,colours);
 batchStaticArchitecture(root);assert.equal(moving.parent,mechanism);assert.equal(colours.parent,root);assert.equal(root.children.length,3);mechanism.position.x=8;root.updateMatrixWorld(true);assert.equal(moving.getWorldPosition(new T.Vector3()).x,8);
});
test('all fused district branches bypass old showcase replacements',()=>{
 const s=createCity({starter:false}),scene=new T.Scene(),models=new Map(),detailPlan=new Map(),operational=new Float32Array(s.cells.length).fill(1);
 for(const [type,branch,size,x,key] of [['R','garden',4,20,'residence'],['c','finance',3,30,'commerce'],['i','precision',3,40,'industry']]){
  const anchor=idx(x,20),ids=square(anchor,size);for(const i of ids){Object.assign(s.cells[i],{type,branch,level:6});detailPlan.set(i,2);}assert.equal(fuse(s,anchor,size),true);
  const proto=new T.Group(),body=new T.Group(),addon=new T.Group();body.name='mature';body.add(new T.Mesh(new T.BoxGeometry(),new T.MeshBasicMaterial()));addon.name='addition6';proto.add(body,addon);models.set(key,proto);
 }
 const a=Object.assign(Object.create(AtelierScene.prototype),{view:{scene,detailPlan,mode:'build'},models,landmarks:new Map(),pickables:[]});
 a.updateLandmarks(s,{operational});assert.equal(a.landmarks.size,0);assert.equal(scene.children.length,0);assert.equal(a.pickables.length,0);assert.equal(a.landmarks.has(idx(30,20)),false,'finance cannot be replaced by the old twin-sail landmark');
 const first=[...a.landmarks.values()];a.updateLandmarks(s,{operational});assert.deepEqual([...a.landmarks.values()],first,'unchanged lots reuse existing models');
 detailPlan.clear();a.updateLandmarks(s,{operational});assert.equal(scene.children.filter(g=>g.visible).length,0);assert.equal(a.landmarks.size,0,'branch buildings remain in the shared renderer');
 for(const i of square(idx(20,20),4))s.cells[i].type=null;a.updateLandmarks(s,{operational});assert.equal(a.landmarks.size,0);assert.equal(a.pickables.length,0,'removed plots leave no retained pick targets');
});
test('real sail and shell landmarks retain their complete geometry with fewer static submissions',()=>{
 const oldDoc=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},strokeRect(){},fillText(){},beginPath(){},moveTo(){},lineTo(){},stroke(){}})})};
 try{
  const cache=new Map(),materials=new Proxy({}, {get:(_,name)=>{if(!cache.has(name))cache.set(name,new T.MeshStandardMaterial());return cache.get(name);}});
  const count=root=>{let meshes=0,triangles=0;root.traverse(m=>{if(m.isMesh){meshes++;triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3*(m.isInstancedMesh?m.count:1);}});return {meshes,triangles};};
  // Use transformed vertices: a rotated cylinder's old instance box is conservative.
  const bounds=root=>{root.updateMatrixWorld(true);const box=new T.Box3(),p=new T.Vector3(),matrix=new T.Matrix4(),instance=new T.Matrix4();root.traverse(m=>{if(!m.isMesh)return;const positions=m.geometry.attributes.position;for(let k=0;k<(m.isInstancedMesh?m.count:1);k++){matrix.copy(m.matrixWorld);if(m.isInstancedMesh){m.getMatrixAt(k,instance);matrix.multiply(instance);}for(let j=0;j<positions.count;j++)box.expandByPoint(p.fromBufferAttribute(positions,j).applyMatrix4(matrix));}});return box;};
  for(const root of [makeSailTower(materials).root,makeShellHall(materials)]){
   root.position.set(13,5,-9);root.rotation.z=.21;root.scale.setScalar(.12);const before=count(root),box=bounds(root);batchStaticArchitecture(root);const after=count(root),bakedBox=bounds(root);
   assert.equal(after.triangles,before.triangles);assert.ok(after.meshes<before.meshes*.5,`${before.meshes} -> ${after.meshes}`);assert.ok(box.min.distanceTo(bakedBox.min)<1e-5);assert.ok(box.max.distanceTo(bakedBox.max)<1e-5);
  }
 }finally{globalThis.document=oldDoc;}
});
