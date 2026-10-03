import {createCity} from '../SimCity/engine.mjs';
import {idx,CELL_COUNT,buildingCapacity} from '../SimCity/catalog.mjs';
import {branchDefaults} from '../SimCity/branches.mjs';
import {preferredBranch} from '../SimCity/branch-development.mjs';
import {plotMembers} from '../SimCity/plots.mjs';
export const BRANCH_SITE=idx(100,20);
export function branchFixture(type='R',id='garden',level=6){
 const s=createCity({starter:false});s.education=95;s.health=95;s.cash=1e7;s.disasters=false;s.autoDevelopment=false;s.orbital.completed=10;s.orbital.sequence=10;s.orbital.stock=[{alloy:100000,parts:100000},{alloy:100000,parts:100000}];
 const full=n=>new Float32Array(CELL_COUNT).fill(n),a={operational:full(1),landValue:full(100),happiness:full(100),freight:full(1),jobs:full(0),filled:full(0),parks:full(0),baseParks:full(0),pollution:full(0),services:{school:full(0),hospital:full(0)},stats:{population:5000,demand:{R:50,C:50,I:50}}};
 const put=(dx,dy,t,l=4,pop=0,jobs=0)=>{const i=idx(100+dx,20+dy);Object.assign(s.cells[i],{...branchDefaults(),type:t,level:l,pop,wire:true,pipe:true,age:100});a.jobs[i]=jobs;a.filled[i]=jobs;};
 put(0,0,type,level,type==='R'?buildingCapacity({type,level}):0, type==='R'?0:buildingCapacity({type,level}));s.cells[BRANCH_SITE].branch=level>=5?id:null;
 if(id==='garden'){a.parks.fill(40);a.baseParks.fill(40);}
 if(id==='civic'||id==='market'){put(-1,0,'R',4,500);put(1,0,'C',4,0,id==='civic'?100:0);}
 if(id==='research'||id==='innovation'){a.services.school.fill(100);put(1,0,'I',4,0,200);}
 if(id==='finance'){put(1,0,'C',4,0,100);put(-1,0,'C',4,0,100);}
 if(id==='logistics'){put(1,0,'dock',1);}
 if(id==='precision'){a.services.school.fill(100);put(1,0,'C',4,0,120);}
 if(id==='circular'){s.policies.green=true;a.parks.fill(40);a.baseParks.fill(40);}
 return {s,a,i:BRANCH_SITE};
}
// A billing fixture representing a building after its required stable months.
// Exact elapsed-time gates are exercised separately by tickBranches tests.
export function mature(s,a,i){const choice=preferredBranch(s,a,i);for(const j of plotMembers(s,i)){const c=s.cells[j];if(c.level>=5)c.branch=choice?.id||c.branch;c.growthMonths=100;c.branchCandidate=c.level===4?choice?.id||null:null;c.branchMonths=c.level===4?100:0;c.branchStress=0;c.branchCooldown=0;}return choice;}
