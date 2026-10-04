import test from 'node:test';
import assert from 'node:assert/strict';
import {RenderBudget,ViewQuality,renderPixelRatio} from '../SimCity/render-budget.mjs';
import {buildingDetailPlan,distantBuilding} from '../SimCity/render-plan.mjs';
import {MonthRunner} from '../SimCity/simulation-runner.mjs';
import {createMonthTask,applyMonth,hydrateSimulation} from '../SimCity/simulation-protocol.mjs';
import {createCity,serialize,step,analyze} from '../SimCity/engine.mjs';
import {prepareLiving} from '../SimCity/living-plan.mjs';
import {prepareContinuum} from '../SimCity/continuum-plan.mjs';
import {idx} from '../SimCity/catalog.mjs';
import {simulationSpeed,SPEED_KEYS,MONTH_DURATION_MS,monthWorkRest} from '../SimCity/simulation-speed.mjs';
import {CityView} from '../SimCity/view.mjs';
import {surface} from '../SimCity/habitat.mjs';
import * as T from '../YorktownPreview/three.module.js';

function clock(){
 let now=0,id=0;const tasks=new Map(),listeners=new Map();
 const win={performance:{now:()=>now},setTimeout:(fn,ms)=>{const n=++id;tasks.set(n,{at:now+ms,fn});return n;},clearTimeout:n=>tasks.delete(n),requestAnimationFrame:fn=>{const n=++id;tasks.set(n,{at:now+1000/120,fn:()=>fn(now)});return n;},cancelAnimationFrame:n=>tasks.delete(n)};
 const doc={hidden:false,addEventListener:(k,fn)=>listeners.set(k,fn),removeEventListener:k=>listeners.delete(k)};
 return {win,doc,tasks,advance(ms){const end=now+ms;for(let guard=0;guard<10000;guard++){const next=[...tasks].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>end)break;now=next[1].at;tasks.delete(next[0]);next[1].fn();}now=end;},hide(on){doc.hidden=on;listeners.get('visibilitychange')?.();}};
}
test('paused static city draws once then stops; hidden and disabled views schedule no frames',()=>{
 const c=clock();let frames=0;const r=new RenderBudget({doc:c.doc,win:c.win,draw:()=>frames++,activity:()=>0});c.advance(5000);assert.equal(frames,1);assert.equal(c.tasks.size,0);
 r.invalidate();c.advance(100);assert.equal(frames,2);c.hide(true);r.invalidate();c.advance(1000);assert.equal(frames,2);c.hide(false);c.advance(100);assert.equal(frames,3);
 r.setEnabled(false);r.invalidate();c.advance(1000);assert.equal(frames,3);r.dispose();
});
test('120 Hz input cannot exceed the movement frame budget',()=>{
 const c=clock();let frames=0;const r=new RenderBudget({doc:c.doc,win:c.win,draw:()=>frames++,activity:()=>30});for(let i=0;i<120;i++){r.invalidate();c.advance(1000/120);}assert.ok(frames<=30,frames);assert.ok(frames>=20,frames);r.dispose();
});
test('settled Retina views exceed the old 1.7 ratio at laptop and 4K CSS sizes while motion remains bounded',()=>{
 for(const [w,h]of [[1334,557],[1728,1117],[1920,1080],[3456,2234]]){
  const still=renderPixelRatio(w,h,2),moving=renderPixelRatio(w,h,2,'moving');
  assert.ok(w*h*still**2<=8388609);assert.ok(w*h*moving**2<=2500001);assert.ok(still>=moving);assert.ok(moving<=1.4);
  if(w<=1920)assert.ok(still>=1.7);
 }
 assert.equal(renderPixelRatio(1280,720,1),1.5);
});
test('camera settles to a sharp final frame, without a permanent redraw timer',()=>{
 const c=clock(),tiers=[];let frames=0;const r=new RenderBudget({doc:c.doc,win:c.win,draw:()=>frames++,activity:()=>0});
 const q=new ViewQuality({doc:c.doc,win:c.win,change:t=>{tiers.push(t);r.invalidate();}});
 q.motion();c.advance(300);q.motion();c.advance(300);assert.equal(q.tier,'moving');c.advance(500);assert.equal(q.tier,'still');assert.deepEqual(tiers,['moving','still']);assert.equal(frames,2);assert.equal(c.tasks.size,0);q.dispose();r.dispose();
});
test('quality timers do not redraw a hidden or disabled view',()=>{
 const c=clock();let changes=0,settles=0;const q=new ViewQuality({doc:c.doc,win:c.win,change:()=>changes++,settle:()=>settles++});
 q.motion();c.hide(true);c.advance(1000);assert.equal(settles,0);assert.equal(c.tasks.size,0);c.hide(false);c.advance(1000);assert.equal(settles,1);
 q.motion();q.setEnabled(false);c.advance(1000);assert.equal(settles,1);assert.equal(c.tasks.size,0);assert.equal(changes,3);q.dispose();
});
test('legacy 12x speeds are capped; yearly time stays meaningful at the new maximum',()=>{
 assert.deepEqual(Object.values(SPEED_KEYS),[1,2,4]);assert.equal(simulationSpeed(12),4);assert.equal(simulationSpeed(3),2);assert.equal(simulationSpeed(Infinity),0);assert.equal(simulationSpeed(-1),0);assert.equal(MONTH_DURATION_MS*12/4,24000);
 for(const work of [0,600,3200])assert.ok(monthWorkRest(work)>=work);assert.equal(monthWorkRest(600),600);
});
test('visible large buildings get detail regardless of ground distance, and offscreen buildings do not consume it',()=>{
 const p=buildingDetailPlan([{i:1,distance:95,pixels:170,visible:true},{i:2,distance:2,pixels:900,visible:false},{i:3,distance:8,pixels:8,visible:true}],'overview');
 assert.equal(p.get(1),2);assert.equal(p.get(2),0);assert.equal(p.get(3),0);
 assert.equal(buildingDetailPlan([{i:1,distance:95,pixels:62}], 'build',p).get(1),2);
});
test('large city detail count is bounded and every distant building keeps a visible model',()=>{
 const items=Array.from({length:6000},(_,i)=>({i,distance:20+i/1000})),p=buildingDetailPlan(items);assert.equal([...p.values()].filter(n=>n===2).length,96);assert.equal([...p.values()].filter(n=>n===1).length,320);assert.equal(p.size,6000);
 for(const type of ['R','C','I'])for(const branch of ['garden','finance','precision']){const parts=[];distantBuilding({x:3,y:4,c:{type,level:8,span:4,branch},add:(...p)=>parts.push(p)});assert.ok(parts.length>=7&&parts.length<=16);assert.ok(parts.flat().filter(v=>typeof v==='number').every(Number.isFinite));}
});
test('background months produce the same state and indicators as direct simulation',()=>{
 let city=prepareContinuum(prepareLiving(createCity()));const direct=hydrateSimulation(serialize(city)),month=createMonthTask();
 for(let n=0;n<4;n++){const a=step(direct),r=month({id:n,revision:1,snapshot:n===0?serialize(city):undefined});const b=applyMonth(city,structuredClone(r));assert.equal(serialize(city),serialize(direct));assert.deepEqual(b.stats,a.stats);}
});
test('background patches include a cell cleared during a month and preserve removed objects after resync',()=>{
 const s=createCity();s.disasters=false;const i=s.cells.findIndex(c=>c.type==='power');s.cells[i].age=599;s.powerRenewal=false;const month=createMonthTask(),r=month({id:1,revision:1,snapshot:serialize(s)});applyMonth(s,r);assert.equal(s.cells[i].type,'rubble');
 s.cells[i]=createCity({starter:false}).cells[i];const r2=month({id:2,revision:2,snapshot:serialize(s)});applyMonth(s,r2);assert.equal(s.cells[i].type,null);
});
test('worker runner allows only one month, caches snapshots, and resyncs after edits',async()=>{
 const worker={postMessage:m=>worker.last=m,terminate:()=>{}},r=new MonthRunner(worker);let snapshots=0;const snapshot=()=>{snapshots++;return '{}';};
 const a=r.run(1,snapshot);await assert.rejects(r.run(1,snapshot),/already/);worker.onmessage({data:{id:1,revision:1}});await a;
 const b=r.run(1,snapshot);assert.equal(worker.last.snapshot,undefined);worker.onmessage({data:{id:2,revision:1}});await b;assert.equal(snapshots,1);
 r.invalidate();const d=r.run(2,snapshot);assert.equal(worker.last.snapshot,'{}');worker.onmessage({data:{id:3,revision:2}});await d;assert.equal(snapshots,2);r.dispose();
});
test('worker errors stop calculation and reject the pending month',async()=>{
 let terminated=false;const worker={postMessage(){},terminate(){terminated=true;}},r=new MonthRunner(worker);const promise=r.run(1,()=> '{}');worker.onerror({message:'failure'});await assert.rejects(promise,/failure/);assert.equal(r.failed,true);assert.equal(terminated,true);assert.equal(r.busy,false);
});
test('display meshes are reused for population changes and only the affected chunk is rebuilt',()=>{
 const oldDoc=globalThis.document;globalThis.document={body:{classList:{toggle(){}}}};
 try{
  const s=createCity({starter:false});for(const i of [idx(20,20),idx(60,20)])Object.assign(s.cells[i],{type:'R',level:2,pop:8,wire:true,pipe:true});
  const valid=[idx(20,20),idx(60,20)],box=new T.BoxGeometry(1,1,1),mat=new T.MeshStandardMaterial(),v=Object.create(CityView.prototype),noop={update(){},root:{}};
  Object.assign(v,{valid,tilePositions:new Map(valid.map(i=>[i,new T.Vector3(...surface(i%536-27.5,Math.floor(i/536)-27.5))])),camera:new T.PerspectiveCamera(),chunkModels:new Map(),buildings:new T.Group(),floor:new T.InstancedMesh(box,mat,2),dummy:new T.Object3D(),color:new T.Color(),mat,box,shapes:{box},cityMaterials:{},sharedMaterials:new Set([mat]),growth:new Map(),signatures:new Map(),growing:[],mode:'build',secondaryRails:{},station:{},dawn:noop,atelier:noop,continuum:noop,maglev:noop,explorer:{rebuildCameraIndex(){}},updatePeople(){},renderer:{shadowMap:{}}});
  v.update(s,analyze(s));const meshes=[...v.buildings.children],builds=v.geometryBuilds;s.cells[valid[0]].pop++;
  v.update(s,analyze(s));assert.equal(v.geometryBuilds,builds);assert.deepEqual(v.buildings.children,meshes);
  s.cells[valid[0]].level++;v.update(s,analyze(s));assert.equal(v.geometryBuilds,builds+1);assert.ok(meshes.some(m=>v.buildings.children.includes(m)));assert.ok(meshes.some(m=>!v.buildings.children.includes(m)));
 }finally{globalThis.document=oldDoc;}
});

test('dense detailed prototypes stay within triangle budgets and prioritize the closest visible plots',()=>{
 const items=Array.from({length:6000},(_,i)=>({i,distance:2+i*.01,pixels:100,visible:true,detailCost:{fine:41000,medium:13000}}));
 const plan=buildingDetailPlan(items),count=d=>[...plan.values()].filter(v=>v===d).length;
 assert.ok(count(2)*41000<=900000);assert.ok(count(1)*13000<=700000);assert.equal(plan.get(0),2);assert.equal(plan.get(5999),0);assert.equal(plan.size,6000);
});
