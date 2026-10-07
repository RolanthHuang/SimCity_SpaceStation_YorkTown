import {clamp,developmentFactor,districtCore,isEnabled,zoneOf} from './catalog.mjs';
import {branchEffects} from './branches.mjs';

// A high-demand production sector gets a share of reachable workers before
// distance-only retail allocation. The share is bounded; no workers or seats
// are created, and unconnected factories cannot reserve commuters.
export function industrialWorkerBudget(workers,candidates,jobs,filled,cells,freight,target,remainingWorkers,pending){
 let industry=0;
 for(const {j}of candidates)if(zoneOf(cells[j].type)==='I'&&freight[j])industry+=Math.max(0,Math.ceil(jobs[j]*target)-filled[j]);
 if(!industry||!workers)return 0;
 return Math.min(industry,Math.floor(workers*.4),Math.ceil(pending*workers/Math.max(1,remainingWorkers)));
}

export function industrialEmission(c,operation,filled,jobs,policies,education){
 if(zoneOf(c.type)!=='I'||!c.level||!isEnabled(c)||c.fire||!operation||!filled||!jobs)return 0;
 // Larger factories emit more, but emissions are tied to actual production
 // and abatement rather than every installed, possibly empty, job seat.
 return (c.type==='I'?28:16)*Math.sqrt(developmentFactor(c))*clamp(filled/jobs,0,1)*operation*(policies.green?.6:1)*(education>70?.7:1)*(districtCore(c)?.pollution||1)*branchEffects(c).pollution;
}

export const industrialConcentration=(load,influence)=>load/(1+influence*.55);

// Goods-producing land is evaluated for freight/access and services. Its own
// industrial nuisance is not a luxury-residential land-price requirement.
export const industrialSiteValue=(landValue,industrialPollution,freight)=>clamp(landValue+industrialPollution*.45+(freight?8:0),1,100);

export const industrialTax=(c,filled,tax,freight,aura=0)=>filled*tax/100*18*(freight?1:.4)*(districtCore(c)?.production||1)*branchEffects(c).production*(1+aura);
