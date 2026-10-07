import {writeFile} from 'node:fs/promises';
import {analyze,forecast,step,serialize} from '../SimCity/engine.mjs';
import {industryFixture} from '../tests/industry-fixture.mjs';
import {prepareContinuum} from '../SimCity/continuum-plan.mjs';
import {prepareLiving} from '../SimCity/living-plan.mjs';
import {createCity} from '../SimCity/engine.mjs';
import {advanceConditions} from '../SimCity/branch-development.mjs';
import {orbitalReport} from '../SimCity/orbital.mjs';

const output=process.argv[2]||'industry-balance';
const report={scope:'Deterministic real-network fixtures; identical seed and layout before/after. No device thermal or battery benchmark.',cases:[]};
for(const lots of [1,9]){
 const {s,homes,shops,factories}=industryFixture({lots});
 const snapshot=()=>{const a=analyze(s),f=forecast(s,a);return {month:s.month,population:a.stats.population,cash:s.cash,net:f.net,demand:a.stats.demand,industrialJobs:factories.reduce((n,i)=>n+a.jobs[i],0),industrialFilled:factories.reduce((n,i)=>n+a.filled[i],0),factoryLevels:factories.map(i=>s.cells[i].level),factoryVacant:factories.filter(i=>s.cells[i].vacant).length,homePopulation:homes.reduce((n,i)=>n+s.cells[i].pop,0),homeHappiness:homes.map(i=>a.happiness[i]),pollutionAtFactories:factories.map(i=>a.pollution[i]),pollutionAtHomes:homes.map(i=>a.pollution[i]),blocked:advanceConditions(s,a,factories[0]).filter(c=>!c.ok).map(c=>c.label),alloyPerMonth:orbitalReport(s,a).areas[0].alloy};};
 const row={lots,initial:snapshot(),months:[]};for(let m=1;m<=36;m++){step(s);if(m%6===0)row.months.push(snapshot());}
 report.cases.push(row);
 if(output==='industry-balance')await writeFile(`checks/industry-${lots}-lots-city.json`,serialize(s,{compact:true}));
}
const demo=prepareContinuum(prepareLiving(createCity()));let a=analyze(demo);const initial={population:a.stats.population,cash:demo.cash,net:forecast(demo,a).net};for(let m=0;m<60;m++)a=step(demo);
report.demo={initial,after60Months:{population:a.stats.population,cash:demo.cash,net:forecast(demo,a).net,insolvent:demo.insolvent}};
await writeFile(`checks/${output}.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
