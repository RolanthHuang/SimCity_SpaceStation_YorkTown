import test from 'node:test';
import assert from 'node:assert/strict';
import {createCity,analyze,forecast,serialize,deserialize,build,undo,manageBuilding,step,renewPlant,renewalCost,triggerDisaster,buildingReport} from '../SimCity/engine.mjs';
import {idx,CELL_COUNT,TYPES,buildingCapacity,facilityFactor,facilityUpkeep,districtCore,VERSION} from '../SimCity/catalog.mjs';
import {square,plotMembers,roadAccess,fuse,validatePlots} from '../SimCity/plots.mjs';
import {redevelopment,autoInvest,developmentReserve} from '../SimCity/redevelopment.mjs';
import {evolutionStatus} from '../SimCity/evolution.mjs';
import {prepareLiving} from '../SimCity/living-plan.mjs';
import {wrapAngle,turnInput} from '../SimCity/camera-controls.mjs';
import {LAYOUTS,ROOMS,CELL,FLOOR_HEIGHT,moveInterior,interiorHeight} from '../SimCity/interior-layout.mjs';
import {complexBuilding,utilityComplex} from '../SimCity/architecture.mjs';
import {orbitalReport} from '../SimCity/orbital.mjs';
import {mature} from './branch-fixtures.mjs';
const fresh=()=>{const s=createCity({starter:false});s.cash=1e7;s.education=100;s.highPopulation=5000;s.disasters=false;s.orbital.completed=10;s.orbital.sequence=10;s.orbital.stock=[{alloy:100000,parts:100000},{alloy:100000,parts:100000}];return s;};
const put=(s,x,y,type,level=5,pop=0)=>Object.assign(s.cells[idx(x,y)],{type,level,pop,age:100,wire:true,pipe:true});
function lot(s,type,size,level=5,x=100,y=20){const i=idx(x,y);for(const j of square(i,size))put(s,j%536,Math.floor(j/536),type,level,type==='R'?40:0);return i;}
const gates=()=>({operational:new Float32Array(CELL_COUNT).fill(1),landValue:new Float32Array(CELL_COUNT).fill(100),happiness:new Float32Array(CELL_COUNT).fill(100),freight:new Float32Array(CELL_COUNT).fill(1),parks:new Float32Array(CELL_COUNT).fill(40),baseParks:new Float32Array(CELL_COUNT).fill(40),pollution:new Float32Array(CELL_COUNT),services:{school:new Float32Array(CELL_COUNT).fill(90),hospital:new Float32Array(CELL_COUNT).fill(90)},jobs:new Float32Array(CELL_COUNT).fill(100),filled:new Float32Array(CELL_COUNT).fill(100),stats:{population:3000,demand:{R:50,C:50,I:50}},power:{demand:5000,supply:6000},water:{demand:5000,supply:6000},space:{air:{demand:2000,supply:2400},heat:{demand:6000,supply:7000}}});
test('both sides of a road grow through continuous zoning to distance three, never four or across vacant lots',()=>{
 const s=fresh();put(s,100,20,'road',1);for(let k=1;k<=4;k++)for(const dir of [-1,1])put(s,100,20+dir*k,'R',0);
 let a=roadAccess(s.cells);for(const dir of [-1,1])for(let k=1;k<=4;k++)assert.equal(a.dist[idx(100,20+dir*k)],k<=3?k:-1);
 s.cells[idx(100,22)].type=null;a=roadAccess(s.cells);assert.equal(a.dist[idx(100,23)],-1);
 put(s,100,22,'water',1);assert.equal(roadAccess(s.cells).dist[idx(100,23)],-1);
});
test('2/3/4 square foundations fuse, preserve residents, and support continued eight-stage evolution',()=>{
 for(const size of [2,3,4]){const s=fresh(),i=lot(s,'R',size),pop=s.cells.reduce((n,c)=>n+c.pop,0);assert.equal(fuse(s,i,size),true);validatePlots(s);assert.equal(plotMembers(s,i+536+1).length,size*size);assert.equal(s.cells.reduce((n,c)=>n+c.pop,0),pop);
  const a=gates();for(const j of plotMembers(s,i))s.cells[j].pop=120;mature(s,a,i);const e=evolutionStatus(s,a,i);assert.equal(e.ready,true);assert.ok(e.cost>1200&&e.cost<1200*size*size);s.cells[i].level=8;for(const j of plotMembers(s,i))s.cells[j].level=8;assert.equal(evolutionStatus(s,a,i).max,true);
 }
});
test('fusion refuses partial old plots, mismatched equipment and explicit plant renewal policies',()=>{
 const s=fresh(),i=lot(s,'power',3,2);assert.equal(fuse(s,i,2),true);assert.equal(fuse(s,i+1,2),false);s.cells[i+2].upgrade=1;assert.equal(fuse(s,i,3),false);s.cells[i+2].upgrade=0;s.cells[i+2].renewal='off';assert.equal(fuse(s,i,3),false);s.cells[i+2].renewal='inherit';s.cells[i+2].age=150;assert.equal(fuse(s,i,3),true);assert.ok(plotMembers(s,i).every(j=>s.cells[j].age===150));
});
test('automatic fusion chooses fitting 2/3/4 foundations and leaves reserved buildings untouched',()=>{
 for(const size of [2,3,4]){const s=fresh(),i=lot(s,'R',size);s.month=3;const a=gates(),f={cost:200,net:2000};redevelopment(s,a,f,()=>{});assert.equal(s.cells[i].span,size);validatePlots(s);}
 const s=fresh(),i=lot(s,'R',4);s.month=3;for(const j of square(i,4))s.cells[j].preserve=true;redevelopment(s,gates(),{cost:200,net:2000},()=>{});assert.equal(s.cells[i].span,1);
});
test('fused utility capacity and upkeep grow nonlinearly without losing the underlying network',()=>{
 const s=prepareLiving(createCity()),i=idx(37,22),members=plotMembers(s,i);assert.equal(members.length,4);const a=analyze(s),f=forecast(s,a),supply=a.power.supply;
 for(const j of members)s.cells[j].level=3;const b=analyze(s),g=forecast(s,b);assert.ok(b.power.supply>supply);assert.ok(g.cost>f.cost);assert.ok(facilityFactor(s.cells[i])>facilityUpkeep(s.cells[i]));assert.ok(members.every(j=>b.power.coverage[j]===1&&b.water.coverage[j]===1));
 const report=buildingReport(s,b,i);assert.equal(report.area,4);assert.ok(report.jobs>16*4);
});
test('facility automatic upgrades stop for low cash or demand and proceed with a funded mature city',()=>{
 const s=fresh(),i=lot(s,'power',1,1),a=gates();s.month=6;let f={cost:200,net:2000};s.cash=600;redevelopment(s,a,f,()=>{});assert.equal(s.cells[i].level,1);s.cash=1e7;a.power.demand=1;redevelopment(s,a,f,()=>{});assert.equal(s.cells[i].level,1);a.power.demand=5000;const before=s.cash;redevelopment(s,a,f,()=>{});assert.equal(s.cells[i].level,2);assert.equal(s.cash,before-Math.round(TYPES.power.cost*.55));assert.equal(developmentReserve(s,{cost:1000,net:10},500,20),false);
});
test('paid automatic high-stage investment debits actual district stock and preserves the operating reserve',()=>{
 const s=prepareLiving(createCity()),i=idx(20,25);s.autoDevelopment=false;step(s);step(s);s.autoDevelopment=true;mature(s,analyze(s),i);const a=analyze(s),f=forecast(s,a),e=evolutionStatus(s,a,i,{automatic:true});assert.equal(e.ready,true);let before=s.cash,stock=structuredClone(s.orbital.stock[0]);autoInvest(s,a,f,()=>{});assert.equal(s.cells[i].level,6);assert.equal(s.cash,before-e.cost);assert.equal(s.orbital.stock[0].alloy,stock.alloy-e.alloy);assert.equal(s.orbital.stock[0].parts,stock.parts-e.parts);assert.ok(plotMembers(s,i).every(j=>s.cells[j].level===6));
 const low=prepareLiving(createCity());low.cash=1000;const exact=serialize(low);autoInvest(low,analyze(low),forecast(low),()=>{});assert.equal(serialize(low),exact);
});
test('whole-plot demolition and undo are atomic; equipment never exceeds two upgrades',()=>{
 const s=prepareLiving(createCity()),i=idx(20,25),members=plotMembers(s,i),original=serialize(s);const r=build(s,[members.at(-1)],'bulldoze');assert.equal(r.count,16);assert.ok(members.every(j=>s.cells[j].type===null));assert.equal(undo(s,r).ok,true);assert.equal(serialize(s),original);
 for(let k=0;k<2;k++)assert.equal(manageBuilding(s,members.at(-1),'upgrade').ok,true);assert.ok(members.every(j=>s.cells[j].upgrade===2));assert.equal(manageBuilding(s,i,'upgrade').ok,false);validatePlots(s);
});
test('landmarks occupy the previewed foundation, charge once, simulate once and cannot duplicate through damage',()=>{
 const s=fresh(),i=idx(100,20),ids=square(i,5),cash=s.cash,r=build(s,ids,'meridian');assert.equal(r.ok,true);assert.equal(r.cost,TYPES.meridian.cost);assert.equal(s.cash,cash-r.cost);assert.equal(plotMembers(s,i).length,25);assert.equal(s.cells.filter(c=>c.type==='meridian'&&!c.subplot).length,1);assert.equal(ids.reduce((n,j)=>n+buildingCapacity(s.cells[j]),0),TYPES.meridian.base);validatePlots(s);
 const load=deserialize(serialize(s,{compact:true}));assert.equal(load.cells.filter(c=>c.type==='meridian'&&!c.subplot).length,1);assert.equal(buildingReport(load,analyze(load),i).capacity,TYPES.meridian.base);
 triggerDisaster(s,'meteor');assert.equal(s.cells.filter(c=>c.type==='meridian').length,0);validatePlots(s);assert.equal(s.cells.reduce((n,c)=>n+buildingCapacity(c),0),0);
});
test('power campus renews together without resetting its evolution; disabled renewal produces real ruins',()=>{
 const s=prepareLiving(createCity()),i=idx(37,22),members=plotMembers(s,i);s.autoDevelopment=false;for(const j of members){s.cells[j].age=599;s.cells[j].level=3;}const cost=Math.round(renewalCost(s,i));step(s);assert.equal(s.lastRenewal.cost,cost);assert.ok(members.every(j=>s.cells[j].type==='power'&&s.cells[j].level===3&&s.cells[j].age===0));validatePlots(s);
 for(const j of members){s.cells[j].age=599;s.cells[j].renewal='off';}step(s);assert.ok(members.every(j=>s.cells[j].type==='rubble'&&s.cells[j].level===3));assert.ok(s.powerIncident!==null);const restored=deserialize(serialize(s,{compact:true}));assert.equal(restored.cells[i].level,3);const price=Math.round(TYPES.power.cost*facilityUpkeep({...restored.cells[i],type:'power'}));assert.equal(renewPlant(restored,i).cost,price);assert.equal(restored.cells[i].level,3);
});
test('fused plots survive both saves; malformed partial foundations fail visibly',()=>{
 const s=prepareLiving(createCity());for(const compact of [true,false]){const r=deserialize(serialize(s,{compact}));assert.equal(r.version,VERSION);validatePlots(r);assert.equal(analyze(r).stats.population,analyze(s).stats.population);assert.equal(r.cells[idx(20,25)].span,4);assert.equal(r.autoDevelopment,true);}
 const bad=JSON.parse(serialize(s));bad.cells[idx(21,26)].plot=null;bad.cells[idx(21,26)].span=1;assert.throws(()=>deserialize(JSON.stringify(bad)),/融合/);
});
test('mature large districts form civic functions automatically, once per campus or economic unit',()=>{
 const s=prepareLiving(createCity()),r=idx(20,25),c=idx(26,26);for(const j of plotMembers(s,r))s.cells[j].level=6;const before=analyze(s).parks[idx(21,26)];for(const j of plotMembers(s,r))s.cells[j].level=7;const after=analyze(s).parks[idx(21,26)];assert.ok(Math.abs(after-before-12)<1e-4);
 for(const j of plotMembers(s,c))s.cells[j].level=7;const a=analyze(s),report=buildingReport(s,a,c),expected=plotMembers(s,c).reduce((n,j)=>n+a.filled[j]*s.tax.C/100*16*1.06,0);assert.equal(report.core.name,'街區交易中心');assert.ok(Math.abs(report.revenue-expected)<1e-8);assert.equal(districtCore({type:'C',level:8,span:2}),null);assert.equal(districtCore({type:'C',level:8,span:3,enabled:false}),null);
 const industrial=fresh(),i=lot(industrial,'I',3,6),sim=gates();assert.equal(fuse(industrial,i,3),true);industrial.orbital.stock=[{alloy:0,parts:0},{alloy:0,parts:0}];sim.filled.fill(0);put(industrial,14,14,'dock',1);for(const j of square(i,3))sim.filled[j]=5;const basic=orbitalReport(industrial,sim).areas[0].alloy;for(const j of square(i,3))industrial.cells[j].level=7;assert.ok(orbitalReport(industrial,sim).areas[0].alloy>basic);assert.equal(districtCore(industrial.cells[i]).pollution,.85);
});
test('continuous arrow yaw crosses many complete turns in either direction; pitch alone is bounded',()=>{
 const p={yaw:0,pitch:.5};for(const orbit of [false,true])for(const direction of ['ArrowLeft','ArrowRight']){p.yaw=0;const keys={[direction]:true,ArrowUp:true};for(let k=0;k<1200;k++)turnInput(p,keys,.02,{orbit});assert.ok(Math.abs(wrapAngle(p.yaw-(direction==='ArrowRight'?1:-1)*1200*.02*1.6))<1e-10);assert.equal(p.pitch,orbit?1.42:1.3);}
 p.yaw=0;turnInput(p,{KeyE:true},1);assert.equal(p.yaw,0);turnInput(p,{KeyE:true},1,{orbit:true});assert.ok(p.yaw>1.5);
});
function path(map,from,to){const key=(x,z)=>`${x},${z}`,queue=[from],previous=new Map([[key(...from),null]]);for(let q=0;q<queue.length;q++){const [x,z]=queue[q];if(x===to[0]&&z===to[1])break;for(const [u,v]of [[x+1,z],[x-1,z],[x,z+1],[x,z-1]])if(map[v]?.[u]==='.'&&!previous.has(key(u,v))){previous.set(key(u,v),[x,z]);queue.push([u,v]);}}
 assert.ok(previous.has(key(...to)),'room or staircase has no connected path');const steps=[];for(let n=to;n;n=previous.get(key(...n)))steps.unshift(n);return steps;}
const follow=(p,steps)=>{for(const [col,row]of steps){const x=(col-6)*CELL,z=(row-6)*CELL;moveInterior(p,x-p.x,z-p.z);assert.ok(Math.hypot(p.x-x,p.z-z)<.01,`movement blocked at ${col},${row}, floor ${p.floor+1}`);}};
test('all three interior rooms are reachable and both staircases support actual ascent and descent',()=>{
 const p={x:0,z:6,y:0,floor:0};follow(p,path(LAYOUTS[0],[6,11],[2,2]));follow(p,path(LAYOUTS[0],[2,2],[12,11]));moveInterior(p,1.12,0);moveInterior(p,0,-12);assert.ok(Math.abs(p.y-FLOOR_HEIGHT)<.01);moveInterior(p,-1.12,0);follow(p,path(LAYOUTS[1],[12,1],[10,10]));follow(p,path(LAYOUTS[1],[10,10],[0,1]));moveInterior(p,-1.12,0);moveInterior(p,0,12);assert.ok(Math.abs(p.y-FLOOR_HEIGHT*2)<.01);moveInterior(p,1.12,0);follow(p,path(LAYOUTS[2],[0,11],[10,2]));
 follow(p,path(LAYOUTS[2],[10,2],[0,11]));moveInterior(p,-1.12,0);moveInterior(p,0,-12);moveInterior(p,1.12,0);follow(p,path(LAYOUTS[1],[0,1],[12,1]));moveInterior(p,1.12,0);moveInterior(p,0,12);moveInterior(p,-1.12,0);follow(p,path(LAYOUTS[0],[12,11],[6,11]));assert.equal(p.y,0);assert.equal(interiorHeight(0,7.2,0),null);assert.equal(new Set(LAYOUTS.map(m=>m.join(''))).size,3);
});
test('fused RCI campuses and evolved utility campuses render finite distinct forms within their foundations',()=>{
 for(const type of ['R','C','I','r','c','i'])for(const span of [2,3,4])for(const far of [false,true]){const forms=[];for(let level=1;level<=8;level++){const pieces=[];complexBuilding({x:0,y:0,c:{type,level,span},far,add:(...p)=>pieces.push(p)});checkPieces(pieces,span,type);forms.push(JSON.stringify(pieces));}assert.equal(new Set(forms).size,8);}
 for(const type of ['power','water','life','radiator','solar','school','hospital','fire','police','fabricator'])for(const span of [1,2,3]){const forms=[];for(let level=1;level<=4;level++){const pieces=[];utilityComplex({x:0,y:0,c:{type,level,span},add:(...p)=>pieces.push(p)});checkPieces(pieces,span,type);forms.push(JSON.stringify(pieces));}assert.equal(new Set(forms).size,4);}
});
function checkPieces(pieces,span,type){assert.ok(pieces.length>5);for(const p of pieces){assert.ok(p.slice(0,7).every(Number.isFinite));assert.ok(p[3]>0&&p[4]>0&&p[5]>0);assert.ok(Math.abs(p[0])+p[3]/2<=span/2+.055,`${type} width ${span}`);assert.ok(Math.abs(p[1])+p[5]/2<=span/2+.055,`${type} depth ${span}`);}}
test('the new playable city keeps residents, pays expenses and round-trips after a year of evolution',()=>{
 const s=prepareLiving(createCity()),pop=analyze(s).stats.population;for(let k=0;k<12;k++)step(s);const a=analyze(s);assert.ok(a.stats.population>=pop);assert.ok(s.cash>0);assert.equal(a.stats.oxygen,1);assert.equal(a.stats.cooling,1);validatePlots(s);assert.equal(analyze(deserialize(serialize(s,{compact:true}))).stats.population,a.stats.population);
});
