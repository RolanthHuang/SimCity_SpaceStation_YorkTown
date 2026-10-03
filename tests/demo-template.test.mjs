import test from 'node:test';
import assert from 'node:assert/strict';
import {createCity,analyze,forecast,step,serialize,deserialize} from '../SimCity/engine.mjs';
import {prepareLiving} from '../SimCity/living-plan.mjs';
import {prepareContinuum,DEMO_BLUEPRINT} from '../SimCity/continuum-plan.mjs';
import {idx,xy,isTransport,terrain,neighbors} from '../SimCity/catalog.mjs';
import {plotMembers} from '../SimCity/plots.mjs';
import {branchCandidates} from '../SimCity/branch-development.mjs';
const starter=()=>prepareContinuum(prepareLiving(createCity()));

test('morning-axis template supplies every constructed building and employs its residents',()=>{
 const s=starter(),a=analyze(s),f=forecast(s,a);
 assert.equal(a.stats.population,5845);assert.ok(f.net>0);
 for(const key of ['power','water','oxygen','cooling'])assert.equal(a.stats[key],1,key);
 assert.equal(a.stats.unemployment,0);assert.ok(a.stats.congestion<1.5);
 for(let i=0;i<s.cells.length;i++){const c=s.cells[i];if(c.type&&c.level&&!c.subplot&&!isTransport(c.type)&&c.type!=='station')assert.equal(a.operational[i],1,`${c.type} at ${xy(i)}`);}
 for(const l of a.maglev.lines)assert.equal(l.active,true);assert.ok(a.maglev.riders>0);assert.equal(a.lineTransit[0].active,true);
});
test('representative architecture is ordinary supported zoning, not protected display props',()=>{
 const s=starter(),a=analyze(s);
 for(const i of Object.values(DEMO_BLUEPRINT.representatives)){
  assert.equal(s.cells[i].level,6);assert.equal(s.cells[i].preserve,false);
  assert.ok(branchCandidates(s,a,i).find(b=>b.id===s.cells[i].branch)?.eligible);
  assert.ok(plotMembers(s,i).every(j=>a.operational[j]===1));
 }
});
test('demo stays solvent and keeps all three high-stage branches for sixty operating months',()=>{
 const s=starter(),start=analyze(s),branches=Object.fromEntries(Object.values(DEMO_BLUEPRINT.representatives).map(i=>[i,s.cells[i].branch]));
 for(let m=1;m<=60;m++){
  const a=step(s);assert.equal(s.insolvent,false,`month ${m}`);assert.ok(s.cash>50000,`cash month ${m}`);
  assert.ok(a.stats.population>=start.stats.population*.95,`population month ${m}`);
  for(const key of ['power','water','oxygen','cooling'])assert.equal(a.stats[key],1,`${key} month ${m}`);
  for(const [key,branch] of Object.entries(branches)){const i=Number(key),c=s.cells[i];assert.ok(c.level>=6,`stage ${key} month ${m}`);assert.equal(c.branch,branch,`branch ${key} month ${m}`);assert.equal(c.vacant,false);assert.equal(a.operational[i],1);}
 }
 assert.ok(forecast(s).net>0);assert.ok(s.cash>160000);assert.ok(s.autoDevelopment);
 assert.equal(deserialize(serialize(s,{compact:true})).month,60);
});
test('west and east extension sites are empty and their boulevard stubs join the entire main district',()=>{
 const s=starter(),streets=new Set(),q=[DEMO_BLUEPRINT.expansion.west];streets.add(q[0]);
 for(let k=0;k<q.length;k++)for(const j of neighbors(q[k]))if((isTransport(s.cells[j].type)||s.cells[j].type==='station')&&!streets.has(j)){streets.add(j);q.push(j);}
 assert.ok(streets.has(DEMO_BLUEPRINT.expansion.east));
 for(const x0 of [2,69])for(let y=25;y<31;y++)for(let x=x0;x<x0+6;x++){assert.ok(terrain(idx(x,y)));assert.equal(s.cells[idx(x,y)].type,null);}
 for(const compact of [false,true]){const r=deserialize(serialize(s,{compact}));assert.equal(analyze(r).stats.population,5845);assert.equal(forecast(r).net,forecast(s).net);assert.equal(r.continuum.lines[0].segments,5);}
});
