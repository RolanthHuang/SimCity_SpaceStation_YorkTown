import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../YorktownPreview/three.module.js';
import {closedLoft,solidPatch,structuralPlate,stationAt,NACELLE_STATIONS,ENGINEERING_STATIONS} from '../SimCity/orbital-assets/ship-structure.mjs';
import {v} from '../SimCity/orbital-assets/geometry.mjs';
import {flagship} from '../SimCity/orbital-assets/flagship.mjs';
import {batchStaticArchitecture} from '../SimCity/static-batch.mjs';

function watertight(g,name){
 const p=g.getAttribute('position'),n=g.getAttribute('normal'),ix=g.index,edges=new Map();
 const key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(x=>Math.round(x*10000)).join(',');
 for(let i=0;i<p.count;i++)for(const x of [p.getX(i),p.getY(i),p.getZ(i),n.getX(i),n.getY(i),n.getZ(i)])assert(Number.isFinite(x),name+' has non-finite geometry');
 for(let i=0;i<(ix?.count||p.count);i+=3){
  const ids=[0,1,2].map(k=>ix?ix.getX(i+k):i+k),keys=ids.map(key);
  assert(new Set(keys).size===3,name+' has a collapsed face');
  for(let j=0;j<3;j++){const a=keys[j],b=keys[(j+1)%3],k=[a,b].sort().join('|'),e=edges.get(k)||{count:0,balance:0};e.count++;e.balance+=a<b?1:-1;edges.set(k,e);}
 }
 for(const e of edges.values()){assert.equal(e.count,2,name+' has an open/non-manifold edge');assert.equal(e.balance,0,name+' has inconsistent exterior winding');}
 return {name,triangles:(ix?.count||p.count)/3,closed:true};
}

test('integrated flagship retains closed armor, internal backing, correct mirror winding and static batching',()=>{
const results=[];
for(const [name,stations]of [['nacelle',NACELLE_STATIONS],['engineering',ENGINEERING_STATIONS]]){
 const g=closedLoft(stations,48);results.push(watertight(g,name));
 const mesh=new T.Mesh(g,new T.MeshBasicMaterial());mesh.updateMatrixWorld();
 for(const direction of [-1,1]){
  const cy=stations[direction===1?0:stations.length-1][3]||0;
  const ray=new T.Raycaster(v(0,cy,direction===1?-100:100),v(0,0,direction));
  const hit=ray.intersectObject(mesh);assert(hit.length>0,name+' axial view sees through the body');
  const expected=stations[direction===1?0:stations.length-1][0];assert(Math.abs(hit[0].point.z-expected)<.001,name+' bulkhead missing');
 }
}
results.push(watertight(solidPatch((u,w)=>v(Math.cos(u*.6)*(4+w),2,Math.sin(u*.6)*(4+w)),()=>v(0,1,0),4,2,.18),'armor panel'));
for(const side of [-1,1])results.push(watertight(structuralPlate([v(side*7,-3,-34),v(side*13,0,-46),v(side*30,12,-40),v(side*31,12,-31),v(side*14,1,-28)],v(.65,0,0)),'mirrored wing '+side));
assert.deepEqual(stationAt(NACELLE_STATIONS,99),[3.84,3.12,0]);
// Exercise the assembled ship and the same batching path as the browser.
const mats=new Proxy({}, {get:(target,role)=>target[role]||(target[role]=new T.MeshBasicMaterial({name:String(role),color:0xaaaaaa,transparent:role==='collectorGlass',opacity:role==='collectorGlass'?.2:1}))});
const ship=flagship(mats,{labels:false});ship.door.userData.dynamic=true;ship.root.updateMatrixWorld(true);
let meshes=0;ship.root.traverse(o=>{if(o.isMesh){assert(o.geometry.getAttribute('position')?.count>0,'assembled ship has an empty part');meshes++;}});
const opaque=[];ship.root.traverse(o=>{if(o.isMesh&&o.visible&&!o.material.transparent)opaque.push(o);});
for(const side of [-1,1])for(const r of [0,1.8,3.1,3.50])for(let j=0;j<12;j++){
 const a=j*Math.PI/6,local=v(side*31+Math.cos(a)*r,13+Math.sin(a)*r*.89,25),origin=ship.root.localToWorld(local),direction=v(0,0,-1).transformDirection(ship.root.matrixWorld);
 const ray=new T.Raycaster(origin,direction),hits=ray.intersectObjects(opaque,false);assert(hits.length>0,'collector recess reveals open space');
 const hit=ship.root.worldToLocal(hits[0].point.clone());assert(hit.z>=4.43&&hit.z<8,'collector opaque backing is not inside its housing');
}
for(const side of [-1,1])for(let j=0;j<12;j++){
 const a=j*Math.PI/6,origin=ship.root.localToWorld(v(side*31+Math.cos(a)*3.8,13+Math.sin(a)*3.8*.89,25)),ray=new T.Raycaster(origin,v(0,0,-1).transformDirection(ship.root.matrixWorld));
 const hits=ray.intersectObjects(opaque,false);assert(hits.length>0,'collector rim has a hole');const z=ship.root.worldToLocal(hits[0].point.clone()).z;assert(z>6.1,'collector axial scale pulled the housing away from its face');
}
for(const x of [-4,-2,0,2,4])for(const y of [-1,0,1,2]){
 const origin=ship.root.localToWorld(v(x,-8+y,-90)),ray=new T.Raycaster(origin,v(0,0,1).transformDirection(ship.root.matrixWorld)),hits=ray.intersectObjects(opaque,false);assert(hits.length>0,'hangar opening sees through the ship');const z=ship.root.worldToLocal(hits[0].point.clone()).z;assert(z>-66.2&&z<-56.5,'hangar needs an opaque interior at its actual entrance');
}
results.push({name:'both assembled collectors and hangar',opaqueBackingRays:140,passed:true});
batchStaticArchitecture(ship.root);ship.root.traverse(o=>{if(o.isMesh)assert(o.geometry.getAttribute('position')?.count>0,'static batch has an empty mesh');});
results.push({name:'assembled and batched flagship',partsBeforeBatch:meshes,passed:true});
assert(results.every(r=>r.closed||r.passed));

});
