import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../YorktownPreview/three.module.js';
import {BRANCHES,branchEffects} from '../SimCity/branches.mjs';
import {branchBuilding} from '../SimCity/branch-architecture.mjs';
import {distantBuilding} from '../SimCity/render-plan.mjs';
import {commercialShapes} from '../SimCity/commercial-shapes.mjs';
import {residentialShapes} from '../SimCity/residential-shapes.mjs';
import {industrialShapes} from '../SimCity/industrial-shapes.mjs';
import {architecturalShapes} from '../SimCity/architecture-shapes.mjs';
import {foliageGeometry} from '../SimCity/evolution-materials.mjs';
import {branchVisualHeight,branchDetailCost} from '../SimCity/branch-visuals.mjs';
import {shipyardWork,industrialVisualKey} from '../SimCity/industrial-architecture.mjs';

const shapes={...architecturalShapes(),...commercialShapes(),...residentialShapes(),...industrialShapes(),box:new T.BoxGeometry(),cylinder:new T.CylinderGeometry(.5,.5,1,24),foliage:foliageGeometry()};
const model=(c,detail)=>{const parts=[],add=(...p)=>parts.push(p);detail===0?distantBuilding({x:0,y:0,c,add}):branchBuilding({x:0,y:0,c,far:detail===1,add});return parts;};
const triangles=parts=>parts.reduce((n,p)=>n+(shapes[p[7]||'box'].index?.count||shapes[p[7]||'box'].attributes.position.count)/3,0);
test('all nine authored branches remain inside every fused foundation and camera height bound',()=>{
 for(const [type,defs]of Object.entries(BRANCHES))for(const branch of Object.keys(defs))for(const span of [1,2,3,4])for(let level=5;level<=8;level++)for(const detail of [0,1,2]){
  const c={type,branch,level,span},parts=model(c,detail);
  for(const [x,z,y,w,h,d,color,shape='box']of parts){const g=shapes[shape];assert.ok(g,shape);g.computeBoundingBox();const b=g.boundingBox;
   assert.ok([x,z,y,w,h,d,color].every(Number.isFinite));
   for(const edge of [x+b.min.x*w,x+b.max.x*w,z+b.min.z*d,z+b.max.z*d])assert.ok(Math.abs(edge)<=span/2+.02,`${type}/${branch}/${level}/${span}/${detail}: ${edge}`);
   assert.ok(y+b.max.y*h<=branchVisualHeight(c)+.015,`${branch} top must be inside its culling sphere`);
  }
 }
});
test('fine silhouettes have bounded geometry and distant models keep less than a tenth of fine triangles',()=>{
 for(const [type,defs]of Object.entries(BRANCHES))for(const branch of Object.keys(defs))for(let level=5;level<=8;level++){
  const c={type,branch,level,span:4},fine=model(c,2),mid=model(c,1),far=model(c,0),a=triangles(fine),b=triangles(mid),d=triangles(far);
  assert.ok(a<45000,`${branch} fine budget ${a}`);assert.ok(b<a,`${branch} medium ${b} / ${a}`);assert.ok(a<=branchDetailCost(c).fine,`${branch} fine estimate ${a}`);assert.ok(b<=branchDetailCost(c).medium,`${branch} medium estimate ${b}`);assert.ok(d<1600,`${branch} distant budget ${d}`);assert.ok(d<a/10,`${branch} ${d} / ${a}`);assert.ok(far.length<=20,`${branch} far pieces ${far.length}`);
 }
});
test('forest high tiers have one central ground trunk with crowns well above street level',()=>{
 const p=model({type:'R',branch:'garden',level:8,span:4},2),trunks=p.filter(v=>v[7]==='forestTrunk');assert.equal(trunks.length,1);assert.equal(trunks[0][0],0);
 const sideHomes=p.filter(v=>v[8]==='glass'&&v[7]==='cylinder'&&Math.abs(v[0])>1);assert.ok(sideHomes.length>=2);assert.ok(sideHomes.every(v=>v[2]-v[4]/2>5));
});
test('shipyard work varies by site and advances only at an eight-month work boundary',()=>{
 const c={type:'I',branch:'logistics',level:8,age:0};assert.deepEqual(shipyardWork(c,0,0),shipyardWork({...c,age:7},0,0));assert.notEqual(industrialVisualKey(c,0,0),industrialVisualKey({...c,age:8},0,0));
 const forms=new Set(Array.from({length:9},(_,k)=>JSON.stringify(shipyardWork({...c,age:k*8},0,0))));assert.equal(forms.size,9);assert.notEqual(industrialVisualKey(c,0,0),industrialVisualKey(c,0,2));
 assert.equal(industrialVisualKey({...c,branch:'precision'},0,0),'');
});
test('passive timber homes save power progressively without bypassing branch availability',()=>{
 assert.ok(branchEffects({type:'R',branch:'civic',level:8}).power<.6);assert.ok(branchEffects({type:'R',branch:'civic',level:5}).power>.8);assert.equal(branchEffects({type:'R',branch:'civic',level:8,vacant:true}).power,1);
});

test('organic trunk normals face outward so crowns have solid supports in WebGL',()=>{
 const g=shapes.forestTrunk,p=g.attributes.position,n=g.attributes.normal;
 // First ring of the central trunk is centered on the origin horizontally.
 for(let k=0;k<48;k++){const dot=p.getX(k)*n.getX(k)+p.getZ(k)*n.getZ(k);assert.ok(dot>0,'trunk side must not be inside out');}
});

test('all three completed shipyard objects have distinct geometry and remain within budget',()=>{
 const signatures=new Set();for(const age of [16,40,64]){const c={type:'I',branch:'logistics',level:8,span:4,age},parts=model(c,2);signatures.add(JSON.stringify(parts));assert.ok(triangles(parts)<=branchDetailCost(c).fine);assert.ok(triangles(model(c,0))<triangles(parts)/10);}
 assert.equal(signatures.size,3);
});
test('market canopy upper surface faces the sky rather than disappearing from above',()=>{
 const normal=shapes.marketShell.attributes.normal;let upward=0;const upperVertices=18*42*6;for(let k=0;k<upperVertices;k++)upward+=normal.getY(k);assert.ok(upward/upperVertices>.5,'upper roof normals must face above the market');
});
test('high-tier near models expose inhabited trunks and industrial hardware while far geometry omits them',()=>{
 for(const [branch,type,shape]of [['garden','R','forestStemGlass'],['civic','R','woodRoundWindow'],['logistics','I','equipmentLadder'],['precision','I','machineHardware'],['circular','I','recoveryPipes'],['innovation','C','bridgePodFrame']]){const c={branch,type,level:8,span:3,age:16};assert.ok(model(c,2).some(p=>p[7]===shape),branch);assert.ok(model(c,0).every(p=>p[7]!==shape),`${branch} distant hardware must be culled`);}
});
