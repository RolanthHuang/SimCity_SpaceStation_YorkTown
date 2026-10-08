import test from 'node:test';import assert from 'node:assert/strict';
import {createCity,analyze,forecast,serialize,deserialize,step,grandOrbitAction} from '../SimCity/engine.mjs';
import {prepareContinuum} from '../SimCity/continuum-plan.mjs';import {prepareLiving} from '../SimCity/living-plan.mjs';
import {GRAND_PROJECTS,createGrandOrbit,grandLoads} from '../SimCity/grand-orbit.mjs';
import {orbitalReport,tickOrbital,PORTS,orbitalAction,restoreOrbital} from '../SimCity/orbital.mjs';
import {createMonthTask,applyMonth} from '../SimCity/simulation-protocol.mjs';
import {prepareGrandShowcase} from '../SimCity/grand-orbit-showcase.mjs';
const ready=()=>{const s=prepareContinuum(prepareLiving(createCity()));s.cash=1000000;s.highPopulation=6000;s.orbital.completed=s.orbital.sequence=12;s.autoDevelopment=false;return s;};
const bought=()=>{const s=ready();for(const action of ['invite','constructRelay','activateRelay'])assert.equal(grandOrbitAction(s,action).ok,true);return s;};
test('real payments debit exactly once, spending records match, and duplicate operations cannot repeat',()=>{
 const s=ready(),pop=analyze(s).stats.population,stock=structuredClone(s.orbital.stock);
 for(const [action,cost]of [['invite',180000],['constructRelay',300000],['activateRelay',35000]]){const cash=s.cash;assert.equal(grandOrbitAction(s,action).cost,cost);assert.equal(s.cash,cash-cost);const before=serialize(s);assert.equal(grandOrbitAction(s,action).ok,false);assert.equal(serialize(s),before);}
 assert.equal(s.cash,485000);assert.equal(analyze(s).stats.population,pop);assert.deepEqual(s.orbital.stock,stock);assert.equal(s.orbital.grand.flagship.spent,180000);assert.equal(s.orbital.grand.relay.spent,335000);
});
test('old orbital saves migrate without granting projects, charging money, or changing old visitor/orders',()=>{
 const s=ready(),raw=JSON.parse(serialize(s));raw.orbital.version=1;delete raw.orbital.grand;
 const r=deserialize(JSON.stringify(raw));assert.equal(r.cash,s.cash);assert.deepEqual(r.orbital.grand,createGrandOrbit());assert.equal(r.orbital.visitorUnlocked,true);assert.deepEqual(r.orbital.stock,s.orbital.stock);assert.deepEqual(r.orbital.orders,s.orbital.orders);
});
test('compact and ordinary saves retain paid projects and refuse malformed duration/cooldown/spend state',()=>{
 const s=bought();for(const compact of [false,true]){const r=deserialize(serialize(s,{compact}));assert.deepEqual(r.orbital.grand,s.orbital.grand);assert.equal(r.cash,485000);}
 for(const mutate of [r=>r.orbital.grand.flagship.remaining=6,r=>r.orbital.grand.flagship.cooldown=2,r=>r.orbital.grand.flagship.spent=0,r=>r.orbital.grand.relay.remaining=5,r=>r.orbital.grand.relay.built=false,r=>r.orbital.grand.relay.enabled=false]){const raw=JSON.parse(serialize(s));mutate(raw);assert.throws(()=>deserialize(JSON.stringify(raw)),/遠航|中繼/);}
});
test('unlocks, missing funds, low happiness, disabled docks and added utility loads reject atomically',()=>{
 for(const reason of ['population','orders','cash','happiness','dock','power','water','oxygen','heat']){
  const s=ready();if(reason==='population')s.highPopulation=100;if(reason==='orders')s.orbital.completed=s.orbital.sequence=1;if(reason==='cash')s.cash=179999;if(reason==='dock')s.cells[PORTS[0]].enabled=false;
  if(reason==='power')for(const c of s.cells)if(c.type==='power'||c.type==='solar')c.enabled=false;if(reason==='water')for(const c of s.cells)if(c.type==='water')c.enabled=false;
  if(reason==='oxygen')for(const c of s.cells)if(c.type==='life'||c.type==='water')c.enabled=false;
  if(reason==='heat'){s.funding.utilities=5;for(const c of s.cells)if(c.type==='radiator')c.enabled=false;}
  if(reason==='happiness'){s.tax.R=25;s.funding.police=0;s.funding.parks=0;s.health=0;}
  const before=serialize(s),result=grandOrbitAction(s,'invite');assert.equal(result.ok,false,reason+': '+result.text);assert.equal(serialize(s),before,reason);
 }
});
test('utilities and upkeep are actual forecast loads; profits need operating commercial/industrial activity',()=>{
 const s=bought(),a=analyze(s),r=orbitalReport(s,a),f=forecast(s,a);
 assert.equal(f.expenses.grandOrbit,10400);assert.equal(f.income.grandOrbit,r.grand.income);assert.ok(r.grand.visitors>0&&r.grand.visitors<=1500);assert.equal(grandLoads(s,PORTS[0]).power,800);assert.equal(grandLoads(s,PORTS[1]).power,1380);
 const noBusiness=structuredClone(a);noBusiness.filled.fill(0);const empty=orbitalReport(s,noBusiness).grand;assert.equal(empty.visitors,0);assert.equal(empty.income,0);assert.equal(empty.upkeep,10400);
 for(const i of PORTS)s.cells[i].enabled=false;const failed=orbitalReport(s,analyze(s)).grand;assert.equal(failed.income,0);assert.equal(failed.upkeep,10400);
});
test('monthly charges settle before expiry, stop at five/four months, and do not permit early reactivation',()=>{
 const s=bought();for(let n=0;n<5;n++){
  const before=s.cash;step(s);assert.equal(s.history.at(-1).grandUpkeep,n<4?10400:7800);assert.equal(s.cash,Math.round((before+s.history.at(-1).net)*100)/100,'month '+n);
 }
 assert.equal(s.orbital.grand.flagship.remaining,0);assert.equal(s.orbital.grand.relay.remaining,0);assert.equal(forecast(s).expenses.grandOrbit,1800);assert.equal(forecast(s).income.grandOrbit,0);assert.equal(s.orbital.grand.flagship.cooldown,7);
 const before=serialize(s);assert.equal(grandOrbitAction(s,'invite').ok,false);assert.equal(serialize(s),before);
});
test('standby and early departure preserve spent fees, remove active effects, and do not erase cooldowns',()=>{
 const s=bought(),cash=s.cash;assert.equal(grandOrbitAction(s,'endVisit').ok,true);assert.equal(grandOrbitAction(s,'pauseRelay').ok,true);assert.equal(s.cash,cash);assert.equal(forecast(s).expenses.grandOrbit,270);assert.equal(forecast(s).income.grandOrbit,0);assert.equal(s.orbital.grand.flagship.cooldown,12);assert.equal(s.orbital.grand.relay.cooldown,12);assert.equal(grandOrbitAction(s,'resumeRelay').ok,true);assert.equal(forecast(s).expenses.grandOrbit,1800);assert.equal(grandOrbitAction(s,'activateRelay').ok,false);
});
test('active relay exports lock bounded prices when cargo ships, remain importable and pay once',()=>{
 const s=bought(),a=analyze(s);assert.equal(orbitalAction(s,a,'accept','0').ok,true);const c=s.orbital.orders[0];s.orbital.stock[0]={alloy:500,parts:500};tickOrbital(s,a,()=>{});assert.equal(c.payment,Math.round(c.reward*1.5));s.orbital.grand.relay.remaining=0;
 const restored=deserialize(serialize(s));assert.equal(restored.orbital.orders[0].payment,c.payment);restored.month=c.eta;const b=analyze(restored),earned=restored.orbital.earned;assert.equal(tickOrbital(restored,b,()=>{}),c.payment);assert.equal(restored.orbital.earned,earned+c.payment);assert.equal(tickOrbital(restored,b,()=>{}),0);
});
test('worker month result and foreground settlement preserve identical grand-orbit state and money',()=>{
 const a=bought(),b=deserialize(serialize(a)),task=createMonthTask();const response=task({snapshot:serialize(a),revision:1,id:1});applyMonth(a,response);step(b);assert.deepEqual(a.orbital.grand,b.orbital.grand);assert.equal(a.cash,b.cash);
});
test('funded showcase pays the 515000 bill and operates independently of normal city initialization',()=>{
 const original=prepareContinuum(prepareLiving(createCity())),before=serialize(original),s=prepareGrandShowcase(deserialize(before));assert.equal(s.cash,485000);assert.equal(s.orbital.grand.flagship.remaining,5);assert.equal(s.orbital.grand.relay.remaining,4);assert.equal(serialize(original),before);
});
