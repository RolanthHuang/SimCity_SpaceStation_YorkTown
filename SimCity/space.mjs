import {branchEffects} from './branches.mjs';
import {TYPES,residential,zoneOf,isEnabled,upgradeFactor,buildingCapacity,facilityFactor,clamp} from './catalog.mjs';

import {orbitalLoads} from './orbital.mjs';
import {lineJobs} from './continuum.mjs';

// Oxygen travels through the same sealed conduits as water. Heat rejection follows
// each electrical district. Disconnected districts never share capacity implicitly.
export function spaceNetworks(s,power,water){
 const n=s.cells.length,oxygen=new Float32Array(n).fill(1),cooling=new Float32Array(n).fill(1);
 const air=water.groups.map(()=>({supply:0,demand:0})),heat=power.groups.map(()=>({supply:0,demand:0}));
 const airLoad=new Float32Array(n),heatLoad=new Float32Array(n);
 for(let i=0;i<n;i++){
  const c=s.cells[i],d=TYPES[c.type];if(!d||c.subplot||!c.level||c.type==='rubble'||!isEnabled(c)||c.fire)continue;
  const wg=water.servedBy[i]>=0?water.servedBy[i]:water.labels[i],pg=power.servedBy[i]>=0?power.servedBy[i]:power.labels[i],factor=upgradeFactor(c)*facilityFactor(c)*clamp(s.funding.utilities/100,0,1.15);
  if(wg>=0){
   if(c.type==='line')air[wg].supply+=(c.lineSegments||4)*35*Math.min(power.coverage[i],water.coverage[i]);
   // Water recyclers include a small baseline air loop; dedicated life support scales a city.
   if(c.type==='water')air[wg].supply+=2000*factor*power.coverage[i];
   if(c.type==='life')air[wg].supply+=d.oxygen*factor*Math.min(power.coverage[i],water.coverage[i]);
  }
  if(pg>=0){
   if(c.type==='line')heat[pg].supply+=(c.lineSegments||4)*180*Math.min(power.coverage[i],water.coverage[i]);
   if(c.type==='power'||c.type==='solar')heat[pg].supply+=(c.type==='power'?6000:600)*factor;
   if(c.type==='power')heat[pg].demand+=TYPES.power.supply*.6*factor*power.coverage[i];
   if(c.type==='radiator')heat[pg].supply+=d.cooling*factor*Math.min(power.coverage[i],water.coverage[i]);
  }
  if(d.group==='network'||d.group==='transport'&&!d.jobs)continue;
  const nominalJobs=['C','I'].includes(zoneOf(c.type))?buildingCapacity(c):(d.jobs||0)*upgradeFactor(c)*facilityFactor(c);
  airLoad[i]=residential(c.type)?1+c.pop*.45*(c.type==='line'?.75:1):2+nominalJobs*.15;
  heatLoad[i]=((residential(c.type)?4+c.pop*.8+(c.type==='line'?lineJobs(c)*.6:0):8+nominalJobs*1.2)*branchEffects(c).power+orbitalLoads(s,i).heat)*power.coverage[i];
  if(wg>=0)air[wg].demand+=airLoad[i];
  if(pg>=0)heat[pg].demand+=heatLoad[i];
 }
 let people=0,airPeople=0,heatPeople=0;
 for(let i=0;i<n;i++){
  const wg=water.servedBy[i]>=0?water.servedBy[i]:water.labels[i],pg=power.servedBy[i]>=0?power.servedBy[i]:power.labels[i];
  if(airLoad[i])oxygen[i]=wg>=0?Math.min(1,air[wg].supply/Math.max(1,air[wg].demand)):0;
  if(heatLoad[i])cooling[i]=pg>=0?Math.min(1,heat[pg].supply/Math.max(1,heat[pg].demand)):0;
  const pop=s.cells[i].pop;people+=pop;airPeople+=pop*oxygen[i];heatPeople+=pop*cooling[i];
 }
 const totals=groups=>({supply:groups.reduce((v,g)=>v+g.supply,0),demand:groups.reduce((v,g)=>v+g.demand,0)});
 return {oxygen,cooling,air:totals(air),heat:totals(heat),oxygenCoverage:people?airPeople/people:1,coolingCoverage:people?heatPeople/people:1};
}
