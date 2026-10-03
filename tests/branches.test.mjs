import test from 'node:test';
import assert from 'node:assert/strict';
import {createCity,analyze,forecast,serialize,deserialize,manageBuilding,step} from '../SimCity/engine.mjs';
import {idx,buildingCapacity,baseBuildingCapacity,CELL_COUNT} from '../SimCity/catalog.mjs';
import {BRANCHES,branchEffects,architecturePalette,facilityPalette,EVOLUTION_WAITS,branchDefaults} from '../SimCity/branches.mjs';
import {preferredBranch,branchCandidates,tickBranches,initializeBranches,advancePlot} from '../SimCity/branch-development.mjs';
import {evolutionStatus,stageUpkeep} from '../SimCity/evolution.mjs';
import {plotMembers,square,fuse,validatePlots} from '../SimCity/plots.mjs';
import {complexBuilding,utilityComplex} from '../SimCity/architecture.mjs';
import {architecturalShapes} from '../SimCity/architecture-shapes.mjs';
import {orbitalReport} from '../SimCity/orbital.mjs';
import {prepareLiving} from '../SimCity/living-plan.mjs';
import {branchFixture,mature} from './branch-fixtures.mjs';

test('each zone can select all three branches from different neighbourhood conditions',()=>{
 for(const [type,defs] of Object.entries(BRANCHES))for(const id of Object.keys(defs)){const {s,a,i}=branchFixture(type,id,4);assert.equal(preferredBranch(s,a,i)?.id,id,`${type}/${id}`);assert.equal(s.cells[i].branch,null);}
});
test('initial branch selection needs eighteen continuous months; a manual investment cannot bypass it',()=>{
 const {s,a,i}=branchFixture('R','garden',4);for(let m=1;m<=18;m++){tickBranches(s,a);const e=evolutionStatus(s,a,i);assert.equal(e.ready,m===18,`month ${m}`);assert.equal(s.cells[i].level,4);}advancePlot(s,i,evolutionStatus(s,a,i).branch);assert.equal(s.cells[i].level,5);assert.equal(s.cells[i].branch,'garden');assert.equal(s.cells[i].growthMonths,0);
});
test('tier 6->7 takes 42 stable months and tier 7->8 takes 72; disruption restarts growth',()=>{
 for(const level of [6,7]){const {s,a,i}=branchFixture('R','garden',level),wait=EVOLUTION_WAITS[level+1];for(let m=1;m<wait;m++){tickBranches(s,a);assert.equal(evolutionStatus(s,a,i).ready,false);}assert.equal(s.cells[i].growthMonths,wait-1);a.operational[i]=.8;tickBranches(s,a);assert.equal(s.cells[i].growthMonths,0);a.operational[i]=1;for(let m=0;m<wait;m++)tickBranches(s,a);assert.equal(evolutionStatus(s,a,i).ready,true);advancePlot(s,i,'garden');assert.equal(s.cells[i].level,level+1);assert.equal(s.cells[i].growthMonths,0);}
 const s=prepareLiving(createCity());initializeBranches(s,analyze(s));const i=idx(20,25),before=serialize(s);assert.equal(manageBuilding(s,i,'evolve').ok,false);assert.equal(serialize(s),before);
});
test('a new better branch never swaps at the same high level and must redevelop from common tier 4',()=>{
 const {s,a,i}=branchFixture('R','garden',7);a.parks.fill(5);a.baseParks.fill(5);a.services.school.fill(100);const j=i+1;Object.assign(s.cells[j],{type:'I',level:4,age:30});a.jobs[j]=200;a.filled[j]=200;assert.equal(preferredBranch(s,a,i).id,'research');
 for(let m=0;m<8;m++)tickBranches(s,a);assert.equal(s.cells[i].branch,'garden');a.services.school.fill(0);tickBranches(s,a);assert.equal(s.cells[i].branchMonths,0);a.services.school.fill(100);
 for(let m=0;m<17;m++){tickBranches(s,a);assert.equal(s.cells[i].level,7);assert.equal(s.cells[i].branch,'garden');}const population=s.cells[i].pop;tickBranches(s,a);assert.equal(s.cells[i].level,4);assert.equal(s.cells[i].branch,null);assert.equal(s.cells[i].pop,population);assert.equal(buildingCapacity(s.cells[i]),population);assert.equal(s.cells[i].vacant,false);
 for(let m=0;m<30;m++){assert.equal(s.cells[i].branch,null);assert.equal(s.cells[i].level,4);tickBranches(s,a);}const e=evolutionStatus(s,a,i);assert.equal(e.ready,true);advancePlot(s,i,e.branch);assert.equal(s.cells[i].branch,'research');assert.equal(s.cells[i].level,5);
});
test('sustained service failure retreats first, preserves residents, and only later can leave an empty vacant base',()=>{
 const {s,a,i}=branchFixture('R','research',8),initial=s.cells[i].pop;for(let m=0;m<11;m++){a.operational[i]=0;tickBranches(s,a);assert.equal(s.cells[i].level,8);}tickBranches(s,a);assert.equal(s.cells[i].level,4);assert.equal(s.cells[i].pop,initial);assert.equal(s.cells[i].residentReserve,initial);assert.equal(baseBuildingCapacity(s.cells[i]),138);assert.equal(s.cells[i].vacant,false);
 const loaded=deserialize(serialize(s,{compact:true}));assert.equal(loaded.cells[i].pop,initial);assert.equal(loaded.cells[i].branch,null);
 for(let m=0;m<30;m++)tickBranches(s,a);assert.equal(s.cells[i].vacant,false,'occupied base cannot be marked empty');s.cells[i].pop=0;s.cells[i].residentReserve=0;tickBranches(s,a);assert.equal(s.cells[i].vacant,true);
 a.operational[i]=1;for(let m=0;m<5;m++){tickBranches(s,a);assert.equal(s.cells[i].vacant,true);}tickBranches(s,a);assert.equal(s.cells[i].vacant,false);assert.equal(s.cells[i].level,4);
});
test('fusion carries the slowest stage/progress, preserves population and refuses incompatible branch identities',()=>{
 const {s,a,i}=branchFixture('R','garden',7),ids=square(i,2);for(const j of ids)Object.assign(s.cells[j],{...branchDefaults(),type:'R',level:7,pop:220,age:100,branch:'garden',growthMonths:71});s.cells[ids[1]].level=6;s.cells[ids[1]].pop=180;s.cells[ids[1]].growthMonths=9;s.cells[ids[2]].branchCooldown=8;
 assert.equal(fuse(s,i,2),true);validatePlots(s);assert.ok(ids.every(j=>s.cells[j].level===6&&s.cells[j].growthMonths===9&&s.cells[j].branchCooldown===8&&s.cells[j].pop===(j===ids[1]?180:220)));assert.equal(buildingCapacity(s.cells[i]),220);
 const bad=structuredClone(s);bad.cells[ids[1]].branch='research';assert.throws(()=>validatePlots(bad),/分支/);assert.throws(()=>deserialize(serialize(bad,{compact:true})),/分支/);
 const mixed=branchFixture('R','garden',5).s;for(const j of square(i,2))Object.assign(mixed.cells[j],{type:'R',level:5,branch:'garden'});mixed.cells[i+1].branch='research';assert.equal(fuse(mixed,i,2),false);mixed.cells[i+1].branch=null;mixed.cells[i+1].level=4;assert.equal(fuse(mixed,i,2),false);
});
test('common-stage fusion cannot borrow a mature neighbour and retains existing residents above the lower base capacity',()=>{
 const {s,i}=branchFixture('R','garden',4),ids=square(i,2),levels=[4,3,3,4],pops=[138,92,90,136];
 ids.forEach((j,k)=>Object.assign(s.cells[j],{...branchDefaults(),type:'R',level:levels[k],pop:pops[k],age:40,growthMonths:4+k,branchCandidate:'garden',branchMonths:3+k}));
 assert.equal(fuse(s,i,2),true);validatePlots(s);
 for(const [k,j] of ids.entries()){assert.equal(s.cells[j].level,3);assert.equal(s.cells[j].growthMonths,4);assert.equal(s.cells[j].branchMonths,3);assert.equal(s.cells[j].pop,pops[k]);assert.ok(buildingCapacity(s.cells[j])>=pops[k]);}
 assert.equal(s.cells[i].residentReserve,138);assert.equal(s.cells[ids[1]].residentReserve,0);
 const loaded=deserialize(serialize(s,{compact:true}));validatePlots(loaded);assert.equal(loaded.cells[i].pop,138);assert.equal(loaded.cells[i].level,3);
});
test('both save formats retain every branch timer and reject invalid lineage; v7 migration keeps stages and people',()=>{
 const {s,i}=branchFixture('R','garden',7);Object.assign(s.cells[i],{branchCandidate:'research',branchMonths:17,branchStress:3,growthMonths:20,branchCooldown:2});
 for(const compact of [false,true]){const r=deserialize(serialize(s,{compact}));for(const k of ['branch','branchCandidate','branchMonths','branchStress','growthMonths','branchCooldown'])assert.equal(r.cells[i][k],s.cells[i][k]);}
 for(const invalid of [{branch:'finance'},{growthMonths:-1},{branchStress:1.5},{vacant:true}]){const raw=JSON.parse(serialize(s));Object.assign(raw.cells[i],invalid);assert.throws(()=>deserialize(JSON.stringify(raw)),/分支/);}
 const raw=JSON.parse(serialize(s));raw.version=7;for(const c of raw.cells)if(c)for(const k of Object.keys(branchDefaults()))delete c[k];const r=deserialize(JSON.stringify(raw));assert.equal(r.cells[i].level,7);assert.equal(r.cells[i].pop,s.cells[i].pop);assert.ok(r.cells[i].branch);const again=deserialize(serialize(r));assert.equal(again.cells[i].branch,r.cells[i].branch);
});
test('branch effects alter actual utility loads, pollution, commerce and local production and incur maintenance',()=>{
 const s=prepareLiving(createCity()),ri=idx(20,25),ci=idx(26,26),ii=idx(31,27);initializeBranches(s,analyze(s));s.autoDevelopment=false;
 const set=(i,branch,level=8)=>{for(const j of plotMembers(s,i))Object.assign(s.cells[j],{branch,level,enabled:true});};set(ri,'research',5);set(ci,'finance',6);set(ii,'logistics',5);
 const first=analyze(s),f1=forecast(s,first),o1=orbitalReport(s,first);set(ii,'circular',5);const next=analyze(s),f2=forecast(s,next),o2=orbitalReport(s,next);assert.ok(next.power.demand<first.power.demand);assert.ok(next.water.demand<first.water.demand);assert.ok(next.pollution[ii]<first.pollution[ii]);assert.ok(o1.areas[0].industry>o2.areas[0].industry);assert.ok(stageUpkeep(s.cells[ii])>0);
 const before=forecast(s,next).income.C;set(ci,'innovation',6);const aura=analyze(s);set(ci,null,6);const neutral=analyze(s);assert.ok(before>forecast(s,neutral).income.C);assert.ok(next.branchTrade[ci]===0,'own finance aura excludes own campus');assert.ok(aura.branchProduction[ii]>0,'nearby research/business produces a real industrial aura');
 for(const j of plotMembers(s,ri))s.cells[j].enabled=false;for(const j of plotMembers(s,ci))s.cells[j].enabled=false;const off=analyze(s);assert.equal(off.branchProduction[ii],0);assert.equal(branchEffects(s.cells[ri]).productionAura,0);assert.ok(f1.cost>0&&f2.cost>0);
});
test('every branch has four distinct massings for all foundations and both LODs, with finite bounded geometry',()=>{
 for(const [type,defs] of Object.entries(BRANCHES))for(const density of [type,type.toLowerCase()])for(const span of [1,2,3,4])for(const far of [false,true]){
  const silhouettes=[];for(const branch of Object.keys(defs)){const stages=[];for(let level=5;level<=8;level++){const p=[];complexBuilding({x:0,y:0,c:{type:density,level,span,branch},far,add:(...v)=>p.push(v)});assert.ok(p.length>5);for(const v of p){assert.ok(v.slice(0,7).every(Number.isFinite));assert.ok(v[3]>0&&v[4]>0&&v[5]>0);assert.ok(Math.abs(v[0])+v[3]/2<=span/2+.06,`${density}/${branch} width ${span}`);assert.ok(Math.abs(v[1])+v[5]/2<=span/2+.06,`${density}/${branch} depth ${span}`);}stages.push(JSON.stringify(p));if(level===6)silhouettes.push(JSON.stringify(p.map(v=>[v[0],v[1],v[3],v[5],v[7]])));}assert.equal(new Set(stages).size,4);}assert.equal(new Set(silhouettes).size,3,'distinct forms even with height and colours removed');
 }
});
test('architectural shapes are normalized finite true arches, rings, domes and sails; palettes remain stable and diverse',()=>{
 const shapes=architecturalShapes();assert.equal(Object.keys(shapes).length,14);for(const g of Object.values(shapes)){g.computeBoundingBox();const {min,max}=g.boundingBox;for(const axis of ['x','y','z']){assert.ok(Math.abs(min[axis]+.5)<1e-5);assert.ok(Math.abs(max[axis]-.5)<1e-5);}assert.ok(Array.from(g.attributes.position.array).every(Number.isFinite));g.dispose();}
 const palettes=new Set();for(const [type,defs] of Object.entries(BRANCHES))for(const branch of Object.keys(defs)){const c={type,branch,level:8},p=architecturePalette(c,100,20);assert.deepEqual(p,architecturePalette(c,100,20));palettes.add(JSON.stringify(p));}assert.equal(palettes.size,9);assert.notDeepEqual(facilityPalette('power'),facilityPalette('water'));
});
test('the branch city remains serializable and financially playable through five years of real simulation',()=>{
 const s=prepareLiving(createCity());initializeBranches(s,analyze(s));const start=analyze(s).stats.population;for(let m=0;m<60;m++)step(s);const a=analyze(s);assert.ok(Number.isFinite(s.cash)&&s.cash>0);assert.ok(a.stats.population>=start*.5);validatePlots(s);const r=deserialize(serialize(s,{compact:true}));assert.equal(analyze(r).stats.population,a.stats.population);assert.equal(r.cash,s.cash);assert.ok(s.cells.some(c=>c.level>=6&&c.branch),'automatic progression can pass its month gates in a real city');
});
