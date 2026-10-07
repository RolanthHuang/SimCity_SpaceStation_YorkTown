import test from 'node:test';
import assert from 'node:assert/strict';
import {analyze,forecast,step,serialize,deserialize,buildingReport} from '../SimCity/engine.mjs';
import {industrialEmission,industrialConcentration,industrialSiteValue} from '../SimCity/industry-balance.mjs';
import {advanceConditions,tickBranches} from '../SimCity/branch-development.mjs';
import {branchFixture} from './branch-fixtures.mjs';
import {orbitalReport} from '../SimCity/orbital.mjs';
import {zoneOf} from '../SimCity/catalog.mjs';
import {industryFixture} from './industry-fixture.mjs';

test('high industrial demand recruits real reachable workers despite nearer retail, and keeps retail operating',()=>{
 const {s,homes,shops,factories}=industryFixture(),a=analyze(s),i=factories[0];
 assert.equal(a.stats.demand.I,100);assert.ok(a.filled[i]>=a.jobs[i]*.4);assert.ok(orbitalReport(s,a).areas[0].alloy>0);
 assert.ok(shops.reduce((n,j)=>n+a.filled[j],0)>0);assert.equal(a.stats.unemployment,0);
 assert.equal(homes.reduce((n,j)=>n+a.employed[j],0),a.stats.employed);
 for(let j=0;j<s.cells.length;j++)assert.ok(a.filled[j]<=a.jobs[j]);
 assert.ok(a.stats.employed<=a.stats.workers);
});

test('industrial recruitment cannot invent residents or workers, or cross disconnected roads',()=>{
 for(const empty of [true,false]){const {s,homes,factories}=industryFixture({connected:empty});if(empty)for(const i of homes)s.cells[i].pop=0;
  const a=analyze(s);assert.equal(a.filled[factories[0]],0);assert.equal(a.industrialPollution[factories[0]],0);
  assert.equal(advanceConditions(s,a,factories[0]).find(c=>c.label==='職位使用率至少 40%').ok,false);
 }
});

test('missing freight still blocks industry even if residential workers and demand exist',()=>{
 const {s,factories}=industryFixture({freight:false}),a=analyze(s),i=factories[0];
 assert.equal(a.freight[i],0);assert.equal(advanceConditions(s,a,i).find(c=>c.label==='連通貨運船塢').ok,false);
 assert.equal(orbitalReport(s,a).areas[0].alloy,0);
});

test('a supported factory steadily evolves while industrial demand remains high',()=>{
 const {s,factories,homes}=industryFixture(),i=factories[0];
 for(let m=0;m<36;m++){const a=step(s);assert.ok(a.filled[i]>=a.jobs[i]*.4,`month ${m+1}`);assert.equal(s.cells[i].vacant,false);}
 assert.ok(s.cells[i].level>=3);assert.ok(homes.reduce((n,j)=>n+s.cells[j].pop,0)>=480);
});

test('a compact industrial district no longer prices itself out or empties, without bypassing demand',()=>{
 const {s,factories}=industryFixture({lots:9});for(let m=0;m<36;m++)step(s);
 assert.ok(factories.filter(i=>s.cells[i].level>=2).length>=7);
 assert.ok(factories.every(i=>!s.cells[i].vacant));
 const a=analyze(s);assert.ok(a.stats.demand.I<=0,'filling industrial demand still stops endless upgrades');
 assert.equal(advanceConditions(s,a,factories[0]).find(c=>c.label==='分區需求為正').ok,false);
 for(const i of factories)assert.ok(a.industrialSuitability[i]>=a.landValue[i]);
});

test('nearby functioning homes and shops remain supported next to a staffed industrial block',()=>{
 const {s,homes,shops,factories}=industryFixture({lots:9,adjacent:true});
 for(let m=0;m<24;m++)step(s);const a=analyze(s);
 assert.ok(factories.reduce((n,i)=>n+a.filled[i],0)>0);
 assert.ok(homes.reduce((n,i)=>n+s.cells[i].pop,0)>=480*.95);
 assert.ok(homes.every(i=>a.happiness[i]>=50&&!s.cells[i].vacant));
 assert.ok(shops.filter(i=>zoneOf(s.cells[i].type)==='C').every(i=>a.operational[i]===1));
});

test('idle factories do not emit phantom industrial pollution; production, cleaning and distance still matter',()=>{
 const c={type:'I',level:8,enabled:true,span:1};const full=industrialEmission(c,1,100,100,{green:false},50);
 assert.equal(industrialEmission(c,1,0,100,{green:false},50),0);
 assert.equal(industrialEmission(c,0,100,100,{green:false},50),0);
 assert.ok(Math.abs(industrialEmission(c,1,100,100,{green:true},50)-full*.6)<1e-9);
 assert.ok(industrialEmission(c,1,50,100,{green:false},50)<full);
 assert.ok(industrialConcentration(full*16,16)<full*2);
 const {s,factories,homes}=industryFixture({lots:9,adjacent:true}),a=analyze(s);
 assert.ok(Math.max(...factories.map(i=>a.industrialPollution[i]))>Math.min(...homes.map(i=>a.industrialPollution[i])));
 assert.equal(industrialSiteValue(20,40,true),46);
});

test('residential and retail zoning still starts without industry',()=>{
 const {s,homes,shops}=industryFixture({industry:false});for(const i of [...homes,...shops])Object.assign(s.cells[i],{level:0,pop:0,age:0});
 for(let m=0;m<18;m++)step(s);const a=analyze(s);
 assert.ok(a.stats.population>100);assert.ok(shops.some(i=>s.cells[i].level>=1));
 assert.equal(s.cells.filter(c=>zoneOf(c.type)==='I').length,0);assert.ok(a.stats.employed>0);
});

test('industrial taxes match the building panel and give an operating factory a positive direct margin',()=>{
 const {s,factories}=industryFixture(),a=analyze(s),f=forecast(s,a),r=buildingReport(s,a,factories[0]),o=orbitalReport(s,a);
 assert.equal(r.revenue,f.income.I);assert.ok(f.income.I>o.productionCost);
 const before=f.expenses.policies;s.policies.green=true;const b=analyze(s),g=forecast(s,b);
 assert.ok(Math.abs(g.expenses.policies-before-b.filled[factories[0]]*.08)<1e-9);
 assert.ok(b.industrialPollution[factories[0]]<a.industrialPollution[factories[0]]);
});

test('existing saves keep exact zoning, people, cash, materials and manual development preferences',()=>{
 const {s}=industryFixture({lots:9});s.autoDevelopment=false;const r=deserialize(serialize(s,{compact:true}));
 assert.equal(r.cash,s.cash);assert.equal(r.autoDevelopment,false);assert.deepEqual(r.orbital.stock,s.orbital.stock);
 assert.deepEqual(r.cells.map(c=>[c.type,c.level,c.pop]),s.cells.map(c=>[c.type,c.level,c.pop]));
 assert.equal(analyze(r).stats.population,analyze(s).stats.population);
});

test('an old vacant factory recovers after six supplied months rather than requiring demolition',()=>{
 const {s,factories}=industryFixture(),i=factories[0];Object.assign(s.cells[i],{vacant:true,branchStress:24});
 const restored=deserialize(serialize(s,{compact:true}));
 for(let m=0;m<5;m++){step(restored);assert.equal(restored.cells[i].vacant,true);}
 const a=step(restored);assert.equal(restored.cells[i].vacant,false);assert.ok(a.filled[i]>=a.jobs[i]*.4);
});

test('citywide excess supply stops growth without abandoning healthy occupied commercial or industrial buildings',()=>{
 for(const [z,branch]of [['C','market'],['I','logistics']])for(const level of [4,6]){
  const {s,a,i}=branchFixture(z,branch,level);a.stats.demand[z]=-100;
  for(let m=0;m<36;m++)tickBranches(s,a);
  assert.equal(s.cells[i].level,level);assert.equal(s.cells[i].vacant,false);assert.equal(s.cells[i].growthMonths,0);
 }
});

test('persistently unoccupied excess retail still becomes vacant after the normal grace period',()=>{
 const {s,a,i}=branchFixture('C','market',4);a.stats.demand.C=-100;a.filled[i]=0;
 for(let m=0;m<23;m++)tickBranches(s,a);assert.equal(s.cells[i].vacant,false);
 tickBranches(s,a);assert.equal(s.cells[i].vacant,true);
});
