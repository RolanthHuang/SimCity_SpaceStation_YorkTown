import test from 'node:test';
import assert from 'node:assert/strict';
import {createCity,analyze,forecast,build,buildStation,removeMaglev,serialize,deserialize,undo,step} from '../SimCity/engine.mjs';
import {idx,TYPES} from '../SimCity/catalog.mjs';
import {createTransit,previewStation,planLink,linkKey} from '../SimCity/maglev.mjs';
import {roadRoute,canWalk} from '../SimCity/habitat.mjs';
const put=(s,x,y,type,level=1,pop=0)=>Object.assign(s.cells[idx(x,y)],{type,level,pop,wire:true,pipe:true,age:0,enabled:true});
function corridor(){const s=createCity({starter:false});s.cash=200000;s.disasters=false;s.autoDevelopment=false;s.education=80;for(let x=100;x<=135;x++)put(s,x,20,'road');for(let x=101;x<=109;x+=2)put(s,x,21,'R',5,100);for(let x=128;x<=135;x++)put(s,x,21,'C',5);put(s,100,19,'power');put(s,101,19,'water');put(s,102,19,'life');put(s,103,19,'radiator');s.highPopulation=500;return s;}

test('stations have boarding capacity and do not break the connected bus catchment',()=>{
 const s=corridor();build(s,[idx(103,20)],'station');build(s,[idx(131,20)],'station');
 const before=analyze(s);put(s,104,19,'bus');const after=analyze(s);
 assert.equal(after.roadCapacity[idx(100,20)],before.roadCapacity[idx(100,20)]*1.2);
 assert.equal(after.roadCapacity[idx(135,20)],before.roadCapacity[idx(135,20)]*1.2);
 assert.ok(after.roadCapacity[idx(103,20)]>=TYPES.station.capacity);
});

test('first maglev station is allowed, retains its road, and gives a non-blocking connection notice',()=>{
 const s=corridor(),i=idx(103,20),cash=s.cash,plan=previewStation(s,i),r=build(s,[i],'station');assert.equal(r.ok,true);assert.ok(r.warning.includes('第一座'));assert.equal(s.cash,cash-TYPES.station.cost);assert.equal(s.cells[i].roadBase,'road');assert.equal(s.transit.links.length,0);assert.ok(roadRoute(s.cells,idx(100,20),idx(135,20)).includes(i));assert.equal(canWalk(s.cells,103-27.5,20-27.5),true);assert.equal(build(s,[i],'station').ok,false);assert.equal(plan.cost,r.cost);assert.equal(undo(s,r).ok,true);assert.equal(s.cells[i].type,'road');
});
test('second station automatically creates an elevated link, charges its path and never replaces intervening roads',()=>{
 const s=corridor(),a=idx(103,20),b=idx(131,20);build(s,[a],'station');const before=s.cash,plan=previewStation(s,b),r=build(s,[b],'station');assert.equal(r.ok,true);assert.equal(s.transit.links.length,1);assert.equal(r.cost,plan.cost);assert.equal(before-s.cash,TYPES.station.cost+28*12);assert.equal(s.transit.links[0].kind,'road');for(let x=104;x<131;x++)assert.equal(s.cells[idx(x,20)].type,'road');assert.equal(undo(s,r).ok,true);assert.equal(s.cells[b].type,'road');assert.equal(s.transit.links.length,0);
});
test('automatic space links bridge disconnected surfaces; an out-of-range site warns without blocking construction',()=>{
 const s=createCity({starter:false});s.cash=1e6;let a=idx(20,20),b=idx(20,70);build(s,[a],'station');const r=build(s,[b],'station');assert.equal(r.ok,true);assert.equal(s.transit.links[0].kind,'space');assert.deepEqual(s.transit.links[0].path,[b,a]);const far=build(s,[idx(250,20)],'station');assert.equal(far.ok,true);assert.ok(far.warning.includes('140'));assert.equal(s.transit.links.length,1);
});
test('funded, supplied maglev carries actual commuters and removes their intermediate-road load',()=>{
 const s=corridor(),before=analyze(s),flow=Array.from(before.traffic).reduce((n,x,i)=>n+(s.cells[i].type==='road'?x:0),0);build(s,[idx(103,20)],'station');build(s,[idx(131,20)],'station');const after=analyze(s),newFlow=Array.from(after.traffic).reduce((n,x,i)=>n+(s.cells[i].type==='road'?x:0),0);assert.equal(after.maglev.lines[0].active,true);assert.ok(after.maglev.riders>100);assert.ok(after.stats.employed>=before.stats.employed);assert.ok(newFlow<flow*.65,`${newFlow} / ${flow}`);assert.ok(after.traffic[idx(117,20)]<before.traffic[idx(117,20)]);assert.ok(forecast(s,after).expenses.transport>forecast(corridor()).expenses.transport);s.funding.transport=0;const idle=analyze(s);assert.equal(idle.maglev.riders,0);assert.equal(idle.maglev.lines[0].active,false);assert.ok(idle.traffic[idx(117,20)]>after.traffic[idx(117,20)]);
});
test('manual track removal persists, leaves stations and roads, can be undone or explicitly restored',()=>{
 const s=corridor(),a=idx(103,20),b=idx(131,20);build(s,[a],'station');build(s,[b],'station');const original=serialize(s,{compact:true}),id=s.transit.links[0].id,r=removeMaglev(s,id);assert.equal(r.ok,true);assert.equal(s.transit.links.length,0);assert.equal(s.cells[a].type,'station');assert.equal(s.cells[idx(117,20)].type,'road');assert.deepEqual(s.transit.blocked,[id]);assert.equal(deserialize(serialize(s,{compact:true})).transit.links.length,0);assert.equal(undo(s,r).ok,true);assert.equal(serialize(s,{compact:true}),original);removeMaglev(s,id);step(s);assert.equal(s.transit.links.length,0);assert.equal(buildStation(s,a,{reconnect:true}).ok,true);assert.equal(s.transit.links.length,1);assert.deepEqual(s.transit.blocked,[]);
});
test('station demolition removes its lines atomically and undo restores the complete network',()=>{
 const s=corridor(),a=idx(103,20),b=idx(131,20);build(s,[a],'station');build(s,[b],'station');const before=serialize(s),r=build(s,[b],'bulldoze');assert.equal(s.transit.links.length,0);assert.equal(undo(s,r).ok,true);assert.equal(serialize(s),before);assert.equal(analyze(deserialize(serialize(s,{compact:true}))).maglev.riders,analyze(s).maglev.riders);
});
test('malformed magnetic tracks are rejected and obsolete passenger ports or hand rails cannot be newly built',()=>{
 const s=corridor();build(s,[idx(103,20)],'station');build(s,[idx(131,20)],'station');for(const mutate of [r=>r.transit.links[0].b=idx(117,20),r=>r.transit.links[0].path[1]=idx(120,22),r=>r.transit.links[0].length=1,r=>r.transit.links.push(r.transit.links[0])]){const r=JSON.parse(serialize(s));mutate(r);assert.throws(()=>deserialize(JSON.stringify(r)),/磁浮|高架/);}assert.equal(build(s,[idx(120,22)],'airport').ok,false);assert.equal(build(s,[idx(120,22)],'rail').ok,false);s.highPopulation=800;step(s);assert.equal(s.events.some(e=>e.text.includes('已開放星際客運港')),false);
});
