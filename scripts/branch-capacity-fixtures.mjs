import {readFile,writeFile} from 'node:fs/promises';
import {deserialize,serialize,analyze,forecast,step} from '../SimCity/engine.mjs';
import {terrain} from '../SimCity/catalog.mjs';
import {plotAnchor,plotMembers} from '../SimCity/plots.mjs';
import {BRANCHES} from '../SimCity/branches.mjs';
const original=await readFile('checks/branch-capacity-20pct-city.json','utf8');
await writeFile('checks/branch-capacity-20pct-city.json',original);
const high=deserialize(original);high.name='20% coverage / high-tier architecture stress fixture';
let count=0;for(let i=0;i<high.cells.length;i++){const c=high.cells[i];const type=c.type?.toUpperCase();if(plotAnchor(high,i)!==i||!BRANCHES[type])continue;const branch=Object.keys(BRANCHES[type])[count++%3];for(const id of plotMembers(high,i))Object.assign(high.cells[id],{type,level:8,branch,branchCandidate:null,branchMonths:0,branchStress:0,branchCooldown:0,growthMonths:0,age:16,vacant:false});}
await writeFile('checks/branch-high-tier-20pct-city.json',serialize(high,{compact:true}));
const report={scope:'Synthetic fixtures. Existing 20% coverage test reused; new all-level-8 variant is a rendering stress case, not a recommended viable city.',scenarios:[]};
for(const [kind,s]of [['operating',deserialize(original)],['high-tier-rendering',high]]){
 const a=analyze(s);const begin=performance.now();step(s);const elapsed=performance.now()-begin;
 report.scenarios.push({kind,occupiedCells:s.cells.filter(c=>!!c.type).length,buildableCells:s.cells.reduce((n,c,i)=>n+Number(terrain(i)),0),newBranchPlots:kind==='high-tier-rendering'?count:null,oneMonthMs:Math.round(elapsed),population:a.stats.population,net:Math.round(forecast(s,a).net)});
}
await writeFile('checks/branch-capacity-fixtures.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
