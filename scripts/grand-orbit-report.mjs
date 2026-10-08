import {writeFile} from 'node:fs/promises';import {performance} from 'node:perf_hooks';
import {createCity,analyze,forecast,serialize,deserialize,step,grandOrbitAction} from '../SimCity/engine.mjs';
import {prepareLiving} from '../SimCity/living-plan.mjs';import {prepareContinuum} from '../SimCity/continuum-plan.mjs';import {prepareGrandShowcase} from '../SimCity/grand-orbit-showcase.mjs';
const basic=()=>prepareContinuum(prepareLiving(createCity()));
const normal=basic(),grand=prepareGrandShowcase(deserialize(serialize(normal))),timeline=[];
for(let month=0;month<=80;month++){
 if([0,1,4,5,12,24,60,80].includes(month))timeline.push({month,cash:grand.cash,population:analyze(grand).stats.population,net:forecast(grand).net,grand:structuredClone(grand.orbital.grand),income:forecast(grand).income.grandOrbit,upkeep:forecast(grand).expenses.grandOrbit,power:analyze(grand).stats.power,water:analyze(grand).stats.water,oxygen:analyze(grand).stats.oxygen,cooling:analyze(grand).stats.cooling});
 if(month===80)break;step(normal);step(grand);if(grand.insolvent)throw new Error('Funded showcase became insolvent');
}
const loaded=deserialize(serialize(grand,{compact:true}));if(loaded.cash!==grand.cash)throw new Error('Roundtrip changed funds');
const profile=s=>{analyze(s);const rows=[];for(let i=0;i<5;i++){const t=performance.now();analyze(s);rows.push(performance.now()-t);}return rows.sort((a,b)=>a-b)[2];};
const before=basic(),after=prepareGrandShowcase(deserialize(serialize(before))),costs={baselineMedianMs:profile(before),grandMedianMs:profile(after)};
const ready=basic();ready.cash=1000000;ready.highPopulation=6000;ready.orbital.completed=ready.orbital.sequence=12;
await writeFile('checks/grand-orbit-ready-city.json',serialize(ready,{compact:true}));
await writeFile('checks/grand-orbit-economy.json',JSON.stringify({version:'11.3.0',startupPaid:515000,initialCash:485000,timeline,normal80:{cash:normal.cash,population:analyze(normal).stats.population,net:forecast(normal).net},grand80:{cash:grand.cash,population:analyze(grand).stats.population,net:forecast(grand).net},cpu:costs,limits:['This fixed funded scenario does not calibrate every city or certify heat/battery performance.']},null,2));
console.log(JSON.stringify({timeline:timeline.map(t=>({month:t.month,cash:t.cash,net:t.net,grandIncome:t.income,grandUpkeep:t.upkeep,power:t.power,water:t.water})),cpu:costs},null,2));
