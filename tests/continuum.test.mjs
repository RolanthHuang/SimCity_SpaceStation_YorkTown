import test from 'node:test';
import assert from 'node:assert/strict';
import {createCity,analyze,forecast,build,undo,serialize,deserialize,buildingReport} from '../SimCity/engine.mjs';
import {idx,CELL_COUNT,buildingCapacity,neighbors,isRoad,zoneOf} from '../SimCity/catalog.mjs';
import {prepareLiving} from '../SimCity/living-plan.mjs';
import {prepareContinuum} from '../SimCity/continuum-plan.mjs';
import {LINE,lineDrag,lineCells,previewLine,constructLine,attachLineTransit,questFor,tickGardenMonths,tickGardens} from '../SimCity/continuum.mjs';
import {planExpansion,commitExpansion} from '../SimCity/assisted-planning.mjs';
import {lineAppearance,adoptedForm} from '../SimCity/continuum-scene.mjs';
import {lineFloorPatches,linePlanters,moveLineWalker} from '../SimCity/line-walking.mjs';
import {interactQuest} from '../SimCity/structure/interior-plan.mjs';
const starter=()=>prepareContinuum(prepareLiving(createCity()));
const area=(x,y,w,h)=>Array.from({length:w*h},(_,k)=>idx(x+k%w,y+Math.floor(k/w)));
const lineCity=()=>{const s=createCity({starter:false});s.cash=200000;s.highPopulation=3000;return s;};
const fill=n=>new Float32Array(CELL_COUNT).fill(n);

test('new district has operating architecture, real populations and positive initial finance',()=>{
 const s=starter(),a=analyze(s),f=forecast(s,a);
 for(const type of ['sail','shell','line']){const i=s.cells.findIndex(c=>c.type===type&&!c.subplot),r=buildingReport(s,a,i);assert.ok(i>=0);assert.equal(r.operational,1,type);assert.ok(r.upkeep>0);assert.ok(r.jobs>0);}
 const i=s.cells.findIndex(c=>c.type==='line'&&!c.subplot),r=buildingReport(s,a,i);
 assert.equal(r.capacity,5*180);assert.equal(r.jobs,5*40);assert.equal(s.cells.filter(c=>c.type==='line'&&c.subplot).reduce((n,c)=>n+c.pop,0),0);
 assert.ok(f.net>0);assert.ok(f.expenses.continuum>=240+160-27);assert.ok(Number.isFinite(f.income.continuum));
});
test('line initial drag, reverse drag and extension use consistent real dimensions',()=>{
 for(const [a,b]of [[idx(100,20),idx(107,20)],[idx(107,20),idx(100,20)],[idx(100,20),idx(100,27)],[idx(100,27),idx(100,20)]]){const l=lineDrag(a,b);assert.equal(l.segments,4);assert.equal(l.cells.length,32);assert.equal(l.anchor,idx(100,20));}
 const s=lineCity(),l=lineDrag(idx(100,20),idx(107,20)),before=serialize(s),built=constructLine(s,previewLine(s,l.cells));assert.equal(built.ok,true);assert.equal(built.cost,LINE.baseCost+4*LINE.segmentCost);assert.equal(buildingCapacity(s.cells[l.anchor]),720);
 const extension=constructLine(s,previewLine(s,[],{extend:l.anchor}));assert.equal(extension.ok,true);assert.equal(extension.cost,6000);assert.equal(s.continuum.lines[0].cells.length,40);assert.equal(buildingCapacity(s.cells[l.anchor]),900);
 assert.equal(undo(s,extension).ok,true);assert.equal(s.continuum.lines[0].segments,4);assert.equal(undo(s,built).ok,true);assert.equal(serialize(s),before);
});
test('line protects occupied ground, unlocks and the maximum length without losing funds',()=>{
 const s=lineCity(),l=lineDrag(idx(100,20),idx(107,20));s.highPopulation=100;assert.equal(previewLine(s,l.cells).ok,false);s.highPopulation=3000;s.cells[l.cells[10]].type='road';const before=serialize(s);assert.equal(constructLine(s,previewLine(s,l.cells)).ok,false);assert.equal(serialize(s),before);s.cells[l.cells[10]].type=null;
 constructLine(s,previewLine(s,l.cells));for(let n=4;n<16;n++)assert.equal(constructLine(s,previewLine(s,[],{extend:l.anchor})).ok,true);assert.equal(previewLine(s,[],{extend:l.anchor}).ok,false);assert.equal(s.continuum.lines[0].cells.length,128);
});
test('line demolition removes its whole foundation, undo and both save formats restore it',()=>{
 const s=lineCity(),l=lineDrag(idx(100,20),idx(107,20));constructLine(s,previewLine(s,l.cells));s.cells[l.anchor].pop=40;
 for(const compact of [false,true]){const r=deserialize(serialize(s,{compact}));assert.equal(r.cells[l.anchor].pop,40);assert.equal(buildingCapacity(r.cells[l.anchor]),720);assert.equal(r.continuum.lines[0].cells.length,32);}
 const before=serialize(s),r=build(s,[l.cells.at(-1)],'bulldoze');assert.equal(r.ok,true);assert.equal(r.count,32);assert.equal(s.continuum.lines.length,0);assert.ok(l.cells.every(i=>s.cells[i].type===null));assert.equal(undo(s,r).ok,true);assert.equal(serialize(s),before);
 const broken=JSON.parse(serialize(s));broken.continuum.lines=[];assert.throws(()=>deserialize(JSON.stringify(broken)),/長廊/);
});
test('the Line shortcut joins only end roads and requires operating supply and transport funding',()=>{
 const s=lineCity(),l=lineDrag(idx(100,20),idx(107,20));constructLine(s,previewLine(s,l.cells));for(const i of [idx(99,21),idx(108,21),idx(104,19)])Object.assign(s.cells[i],{type:'road',level:1});
 const graph=()=>Array.from({length:CELL_COUNT},()=>[]),g=graph(),lines=attachLineTransit(s,fill(1),g);assert.equal(lines[0].active,true);assert.deepEqual(g[idx(99,21)],[idx(108,21)]);assert.equal(g[idx(104,19)].length,0);assert.equal(g.railEdges.get(`${idx(99,21)}:${idx(108,21)}`),lines[0]);
 assert.equal(attachLineTransit(s,fill(.5),graph())[0].active,false);s.funding.transport=0;assert.equal(attachLineTransit(s,fill(1),graph())[0].active,false);
});
test('assistant preserves sources, reserves supply, and does not add oversupplied commercial zoning',()=>{
 const s=starter();assert.equal(build(s,[idx(50,33)],'bulldoze').ok,true);s.tax.C=20;s.tax.I=20;const a=analyze(s),f=forecast(s,a),before=serialize(s),p=planExpansion(s,a,f,area(69,25,12,12),'balanced',analyze,forecast);
 assert.ok(a.stats.demand.C<0&&a.stats.demand.I<0);
 assert.equal(p.ok,true,p.error);assert.equal(serialize(s),before);assert.ok(p.coverage>=.95);assert.equal(p.zoneCounts.C,0);assert.equal(p.zoneCounts.I,0);assert.ok(p.sites>0);assert.ok(p.remaining>=p.reserve);assert.ok(p.cost<=p.budget);
 for(const c of p.changes){assert.equal(s.cells[c.i].type,null);assert.equal(s.cells[c.i].preserve,false);}
 const start=s.cash,r=commitExpansion(s,p,build);assert.equal(r.ok,true,r.error);assert.equal(r.cost,p.cost);assert.equal(start-s.cash,p.cost);assert.ok(p.changes.filter(c=>zoneOf(c.type)).every(c=>s.cells[c.i].level===0));
 assert.equal(undo(s,r).ok,true);assert.equal(serialize(s),before);
});
test('all assistant roads connect to existing roads, no isolated grid remains in a new district',()=>{
 const s=starter(),a=analyze(s),p=planExpansion(s,a,forecast(s,a),area(69,25,12,12),'lean',analyze,forecast);assert.equal(p.ok,true,p.error);const previous=new Set(s.cells.map((c,i)=>isRoad(c.type)?i:-1).filter(i=>i>=0));assert.equal(commitExpansion(s,p,build).ok,true);
 const reached=new Set(previous),q=[...previous];for(let k=0;k<q.length;k++)for(const i of neighbors(q[k]))if(isRoad(s.cells[i].type)&&!reached.has(i)){reached.add(i);q.push(i);}assert.ok(p.changes.filter(c=>isRoad(c.type)).every(c=>reached.has(c.i)));
});
test('assistant rejects insufficient funds and changed quotes atomically',()=>{
 const s=starter(),a=analyze(s),ids=area(69,25,12,12),p=planExpansion(s,a,forecast(s,a),ids,'balanced',analyze,forecast);assert.equal(p.ok,true,p.error);s.cells[p.changes[0].i].preserve=true;const before=serialize(s);assert.equal(commitExpansion(s,p,build).ok,false);assert.equal(serialize(s),before);
 s.cash=1000;assert.equal(planExpansion(s,a,forecast(s,a),ids,'lean',analyze,forecast).ok,false);
});
test('assistant refuses distant unsupported industry and nonpositive city demand before spending',()=>{
 const s=starter(),a=analyze(s),before=serialize(s),p=planExpansion(s,a,forecast(s,a),area(101,24,12,12),'balanced',analyze,forecast);
 assert.equal(p.ok,false);assert.match(p.error,/貨運船塢/);assert.equal(serialize(s),before);
 s.tax={R:20,C:20,I:20};const low=analyze(s),lowBefore=serialize(s);assert.ok(Object.values(low.stats.demand).every(v=>v<=0));
 const noDemand=planExpansion(s,low,forecast(s,low),area(69,25,12,12),'balanced',analyze,forecast);
 assert.equal(noDemand.ok,false);assert.match(noDemand.error,/稅率/);assert.equal(serialize(s),lowBefore);
});
test('automatic gardens pay for staged fusion and respond gradually to supply loss',()=>{
 const s=lineCity(),ids=area(100,20,3,3);for(const i of ids)Object.assign(s.cells[i],{type:'park',level:1,wire:true,pipe:true});s.autoDevelopment=true;
 const a={power:{coverage:fill(1)},water:{coverage:fill(1)},pollution:fill(0),landValue:fill(70),stats:{population:1500}},f={net:1500,cost:400},events=[];
 for(let m=1;m<=11;m++){s.month=m;tickGardenMonths(s,a);tickGardens(s,a,f,(...e)=>events.push(e));}assert.equal(Object.keys(s.continuum.gardens).length,0);
 s.month=12;tickGardenMonths(s,a);tickGardens(s,a,f,(...e)=>events.push(e));assert.equal(s.continuum.gardens[ids[0]].stage,2);assert.equal(s.cash,197400);
 for(let m=13;m<=30;m++){s.month=m;tickGardenMonths(s,a);tickGardens(s,a,f,(...e)=>events.push(e));}assert.equal(s.continuum.gardens[ids[0]].stage,3);assert.equal(s.cash,188200);assert.equal(events.length,2);
 const restored=deserialize(serialize(s,{compact:true}));assert.equal(restored.continuum.parkMonths[ids[0]],30);assert.equal(restored.continuum.gardens[ids[0]].span,3);
 a.water.coverage.fill(0);for(let m=31;m<=35;m++){s.month=m;tickGardens(s,a,f,()=>{});}assert.equal(s.continuum.gardens[ids[0]].stage,3);s.month=36;tickGardens(s,a,f,()=>{});assert.equal(s.continuum.gardens[ids[0]].stage,2);assert.equal(s.continuum.gardens[ids[0]].span,3);
});
test('a preserve flag or poor finances prevents automatic park fusion',()=>{
 const s=lineCity(),ids=area(100,20,2,2);for(const i of ids){Object.assign(s.cells[i],{type:'park',level:1});s.continuum.parkMonths[i]=24;}s.month=24;s.cells[ids[2]].preserve=true;const a={power:{coverage:fill(1)},water:{coverage:fill(1)},pollution:fill(0),landValue:fill(70),stats:{population:1000}},f={net:1500,cost:400};tickGardens(s,a,f,()=>{});assert.deepEqual(s.continuum.gardens,{});s.cells[ids[2]].preserve=false;s.cash=3000;tickGardens(s,a,f,()=>{});assert.deepEqual(s.continuum.gardens,{});
});
test('star sail quest progress is saved with its actual landmark and impossible prerequisites are rejected',()=>{
 const s=starter(),i=s.cells.findIndex(c=>c.type==='sail'&&!c.subplot);s.continuum.quests[i]=interactQuest(questFor(s,i),'archive');const restored=deserialize(serialize(s,{compact:true}));assert.equal(questFor(restored,i).archive,true);assert.equal(questFor(restored,i).complete,false);const raw=JSON.parse(serialize(s));raw.continuum.quests[i].complete=true;assert.throws(()=>deserialize(JSON.stringify(raw)),/秘庫/);
});
test('camouflage is used on long side views; end, inside and overhead views expose structure',()=>{
 assert.equal(lineAppearance({x:100,y:40,z:0},80).side,true);assert.equal(lineAppearance({x:0,y:20,z:120},80).side,false);assert.equal(lineAppearance({x:0,y:20,z:0},80).side,false);assert.equal(lineAppearance({x:0,y:150,z:0},80).side,false);
});
test('adopted forms remain distinct district branches with valid stages and footprints',()=>{
 for(const [type,branch,form]of [['R','garden','residence'],['C','finance','commerce'],['I','precision','industry']]){assert.equal(adoptedForm({type,branch,level:6,span:3}),form);assert.equal(adoptedForm({type,branch,level:4,span:3}),null);assert.equal(adoptedForm({type,branch,level:6,span:2}),null);assert.equal(adoptedForm({type,branch,level:6,span:3,vacant:true}),null);}
});
test('Line floor area has real elevator openings while central train corridors retain floors',()=>{
 const L=160,patches=lineFloorPatches(L),covered=(x,z)=>patches.some(p=>Math.abs(x-p.x)<p.w/2&&Math.abs(z-p.z)<p.d/2);assert.equal(covered(0,0),true);assert.equal(covered(10,68),false);assert.equal(covered(10,-68),false);assert.equal(covered(10,0),true);assert.equal(covered(20,68),true);assert.equal(patches.reduce((n,p)=>n+p.w*p.d,0),80*L-2*8*6);
});
test('Line planters block movement and oblique walking slides without leaving the corridor',()=>{
 const L=160,b=linePlanters(L)[0],p={x:b.x-2.9,z:b.z,y:0},next=moveLineWalker(p,{x:1,z:.3,speed:6},L,.6);assert.ok(next.x<b.x-2.7);assert.ok(next.z>p.z);const edge=moveLineWalker({x:24,z:79,y:0},{x:1,z:1,speed:20},L,1);assert.ok(edge.x<=25&&edge.z<=79);
});
