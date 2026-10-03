import test from 'node:test';
import assert from 'node:assert/strict';
import {createCity,analyze,forecast,serialize,deserialize,manageBuilding,step} from '../SimCity/engine.mjs';
import {idx,buildingCapacity,zoneOf,VERSION} from '../SimCity/catalog.mjs';
import {evolutionStatus,stageUpkeep,stageHeight} from '../SimCity/evolution.mjs';
import {prepareAtelier,ATELIER_LOTS} from '../SimCity/atelier-plan.mjs';
import {zoneBuilding} from '../SimCity/architecture.mjs';
import {branchFixture,mature} from './branch-fixtures.mjs';
import {branchDefaults} from '../SimCity/branches.mjs';
const sample=()=>prepareAtelier(createCity());
const site=ATELIER_LOTS[1].anchor;
test('old save preserves RCI capacity and population through 1/2/3 -> 1/3/5 migration',()=>{
 const s=sample();s.version=4;for(const c of s.cells)if(['R','C','I','r','c','i'].includes(c.type))c.level=c.level>=5?3:c.level>=3?2:1;
 for(const c of s.cells)if(c.type==='R')c.pop=Math.min(c.pop,55*c.level);
 const old=JSON.parse(JSON.stringify(s));delete old.cells.atelier;for(const c of old.cells)for(const k of Object.keys(branchDefaults()))delete c[k];
 const counts=old.cells.map(c=>['R','C','I','r','c','i'].includes(c.type)?({type:c.type,R:55,C:30,I:45,r:20,c:12,i:20}[c.type]*Math.max(1,c.level)*(1+(c.upgrade||0)*.25)):null);
 const restored=deserialize(JSON.stringify(old));for(let i=0;i<counts.length;i++)if(counts[i]!==null){assert.equal(buildingCapacity(restored.cells[i]),Math.round(counts[i]));assert.equal(restored.cells[i].pop,s.cells[i].pop);}
 assert.equal(restored.version,VERSION);
});
test('compact and ordinary saves preserve stage 8, preservation policy, exact funds and stocks',()=>{
 const s=sample();for(const type of ['R','C','I']){const c=s.cells[ATELIER_LOTS.find(l=>l.type===type).anchor];c.level=8;c.preserve=true;}s.cells[ATELIER_LOTS[0].anchor].pop=230;
 for(const compact of [false,true]){const r=deserialize(serialize(s,{compact}));assert.equal(r.cells[site].level,8);assert.equal(r.cells[site].preserve,true);assert.equal(r.cells[ATELIER_LOTS[0].anchor].pop,230);assert.equal(r.cash,s.cash);assert.deepEqual(r.orbital.stock,s.orbital.stock);}
 const raw=JSON.parse(serialize(s,{compact:true}));raw.cells[site][11]=2;assert.throws(()=>deserialize(JSON.stringify(raw)),/損毀/);
});
test('investment requires actual resources; denied upgrade changes nothing',()=>{
 for(const reason of ['money','alloy','parts','disabled','water']){const s=sample();if(reason==='money')s.cash=0;if(reason==='alloy')s.orbital.stock[0].alloy=0;if(reason==='parts')s.orbital.stock[0].parts=0;if(reason==='disabled')s.cells[site].enabled=false;if(reason==='water')for(const c of s.cells)if(c.type==='water')c.enabled=false;const before=serialize(s);assert.equal(manageBuilding(s,site,'evolve').ok,false,reason);assert.equal(serialize(s),before,reason);}
});
test('real commercial investment debits one district, raises jobs and upkeep, never invents residents',()=>{
 const s=sample();mature(s,analyze(s),site);const a=analyze(s),e=evolutionStatus(s,a,site),money=s.cash,pop=a.stats.population,stock=structuredClone(s.orbital.stock),before=forecast(s,a);assert.equal(e.ready,true);
 assert.equal(manageBuilding(s,site,'evolve').ok,true);const b=analyze(s),after=forecast(s,b);assert.equal(s.cash,money-e.cost);assert.equal(s.orbital.stock[0].alloy,stock[0].alloy-e.alloy);assert.equal(s.orbital.stock[0].parts,stock[0].parts-e.parts);assert.deepEqual(s.orbital.stock[1],stock[1]);assert.equal(b.stats.population,pop);assert.equal(b.jobs[site],108);assert.ok(Math.abs(after.expenses.policies-before.expenses.policies-e.extraUpkeep)<1e-9);assert.ok(b.space.heat.demand>a.space.heat.demand);
 const stage=s.cells[site].level;assert.equal(manageBuilding(s,site,'preserve').ok,true);assert.equal(s.cells[site].level,stage);assert.equal(s.cells[site].preserve,true);
});
test('all three types have reachable requirements through eight tiers; automatic investment respects growth and preservation',()=>{
 for(const [type,branch] of [['R','garden'],['C','innovation'],['I','circular']])for(let level=1;level<=8;level++){
  const {s,a,i}=branchFixture(type,branch,level);mature(s,a,i);const c=s.cells[i],e=evolutionStatus(s,a,i);assert.equal(e.ready,level<8,`${type}${level}`);assert.equal(evolutionStatus(s,a,i,{automatic:true}).ready,level<8);if(level<4)c.age=0;else c.growthMonths=0;assert.equal(evolutionStatus(s,a,i,{automatic:true}).ready,false);c.age=100;c.growthMonths=100;c.preserve=true;assert.equal(evolutionStatus(s,a,i,{automatic:true}).ready,false);assert.equal(evolutionStatus(s,a,i).ready,level<8);
 }
});
test('8-stage geometry is finite, distinct, and bounded for all zones, densities and LODs',()=>{
 for(const type of ['R','C','I','r','c','i'])for(const far of [true,false]){const signatures=[];for(let level=1;level<=8;level++){const pieces=[];zoneBuilding({h:stageHeight({type,level}),zone:zoneOf(type),level,variant:1,far,occupied:true,add:(...p)=>pieces.push(p)});assert.ok(pieces.length>3);for(const p of pieces){assert.ok(p.slice(0,7).every(Number.isFinite),`${type}${level} non-finite`);assert.ok(p[3]>0&&p[4]>0&&p[5]>0);assert.ok(Math.abs(p[0])+p[3]/2<=.5+.01);assert.ok(Math.abs(p[1])+p[5]/2<=.5+.01);}signatures.push(JSON.stringify(pieces));}assert.equal(new Set(signatures).size,8);}
});
test('stopping a high-tier building retains only 15 percent of progression upkeep',()=>{const c={type:'R',level:8,upgrade:0,enabled:true};const cost=stageUpkeep(c);assert.equal(cost,18);assert.equal(stageUpkeep({...c,enabled:false}),cost*.15);});
test('with automatic investment disabled, free natural growth never exceeds common stage 4',()=>{const s=sample();s.autoDevelopment=false;const common=s.cells.find(c=>c.type==='R'&&c.level===3);const highest=s.cells.filter(c=>['R','C','I','r','c','i'].includes(c.type));for(let k=0;k<18;k++)step(s);assert.ok(highest.every(c=>c.level<=5));assert.ok(common.level<=4);assert.ok(Number.isFinite(s.cash));assert.equal(analyze(deserialize(serialize(s,{compact:true}))).stats.population,analyze(s).stats.population);});
test('real city permits each R/C/I building to reach tier 8 and pays the whole resource bill',()=>{
 for(const lot of ATELIER_LOTS){const s=sample();if(lot.type==='I'){
  for(let i=0;i<s.cells.length;i++)if(i!==lot.anchor&&zoneOf(s.cells[i].type)==='I')s.cells[i].enabled=false;
  // A viable factory district needs nearby workers, not a bypass of its occupancy gate.
  for(const x of [34,35,36,37,38])Object.assign(s.cells[idx(x,23)],{type:'R',level:5,pop:165,age:0,wire:true,pipe:true,enabled:true,upgrade:0,fire:0});
 }
 const start=s.cash,stock=structuredClone(s.orbital.stock[0]);for(let j=0;j<3;j++){mature(s,analyze(s),lot.anchor);const result=manageBuilding(s,lot.anchor,'evolve');assert.equal(result.ok,true,`${lot.type}: ${result.error}`);}assert.equal(s.cells[lot.anchor].level,8);assert.equal(s.cash,start-7800);assert.equal(s.orbital.stock[0].alloy,stock.alloy-115);assert.equal(s.orbital.stock[0].parts,stock.parts-54);assert.equal(manageBuilding(s,lot.anchor,'evolve').ok,false);
 }
});
