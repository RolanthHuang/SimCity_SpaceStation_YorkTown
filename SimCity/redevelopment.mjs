import {advancePlot} from './branch-development.mjs';
import {TYPES,deckOf,zoneOf,facilityFactor,facilityUpkeep,buildingCapacity} from './catalog.mjs';
import {FACILITIES,ZONE_TYPES,plotMembers,plotAnchor,square,fuse} from './plots.mjs';
import {evolutionStatus,stageUpkeep} from './evolution.mjs';
const monthlyCost=(s,c)=>{const d=TYPES[c.type],key=d.group==='utility'?'utilities':['fire','police','school','hospital'].includes(c.type)?c.type:'parks';return stageUpkeep(c)+(d.upkeep||0)*facilityUpkeep(c)*s.funding[key]/100*(1+(c.upgrade||0)*.2)+(s.policies.green&&zoneOf(c.type)==='I'?buildingCapacity(c)*.08:0);};
export function developmentReserve(s,f,cost=0,extra=0){return s.cash>=cost+Math.max(5000,(f.cost+extra)*6)&&f.net>=Math.max(0,extra);}
export function redevelopment(s,a,f,notify){
 if(s.autoDevelopment===false)return;
 const population=a.stats.population;
 // At most one reconstruction or utility investment per month.
 if(s.month%3===0){let done=false;
  for(const size of [4,3,2]){if(done)break;if(population<(size===4?2000:size===3?800:200))continue;
   for(let i=0;i<s.cells.length;i++){
    const c=s.cells[i],z=ZONE_TYPES.includes(c.type),facility=FACILITIES.includes(c.type);if(!z&&!facility||facility&&size>3||c.preserve||c.enabled===false||c.fire||c.span>=size)continue;
    const ids=square(i,size),set=new Set(ids),minAge=size===4?24:size===3?18:6,minLevel=z?(size===4?5:size===3?4:2):1;
    if(ids.length!==size*size||ids.some(j=>{const v=s.cells[j];return v.type!==c.type||v.level<minLevel||v.age<minAge||v.preserve||v.enabled===false||v.fire||a.operational[j]<.98||plotMembers(s,j).some(k=>!set.has(k));}))continue;
    if(z&&a.stats.demand[zoneOf(c.type)]<=0)continue;
    const cost=facility?Math.round(TYPES[c.type].cost*size*size*.24):0;
    const level=(z?Math.min:Math.max)(...ids.map(j=>s.cells[j].level));
    const extra=Math.max(0,ids.reduce((n,j)=>n+monthlyCost(s,{...s.cells[j],span:size,level})-monthlyCost(s,s.cells[j]),0));
    if(!developmentReserve(s,f,cost,extra))continue;
    if(fuse(s,i,size)){s.cash-=cost;notify(`${TYPES[c.type].name}已重建為 ${size} × ${size} ${facility?'公共設施園':'綜合建築'}，${z?'採整片地基的共同成熟度，住戶分階段安置。':'保留既有設備策略。'}${cost?'工程費 '+cost+'。':''}`,'good');return true;}
   }
  }
 }
 if(s.month%6!==0)return;
 const maxLevel=population>=2000&&s.education>=70?4:population>=800&&s.education>=55?3:population>=250&&s.education>=40?2:1;
 for(let i=0;i<s.cells.length;i++){
  const c=s.cells[i];if(!FACILITIES.includes(c.type)||plotAnchor(s,i)!==i||c.level>=maxLevel||c.age<12*c.level||c.preserve||c.enabled===false||c.fire||a.operational[i]<.98)continue;
  const members=plotMembers(s,i),cost=Math.round(TYPES[c.type].cost*.55*c.level*members.length),next={...c,level:c.level+1};
  const extra=members.reduce((n,j)=>n+monthlyCost(s,{...s.cells[j],level:next.level})-monthlyCost(s,s.cells[j]),0);
  let use=1;if(['power','solar'].includes(c.type))use=a.power.demand/Math.max(1,a.power.supply);if(c.type==='water')use=a.water.demand/Math.max(1,a.water.supply);if(c.type==='life')use=a.space.air.demand/Math.max(1,a.space.air.supply);if(c.type==='radiator')use=a.space.heat.demand/Math.max(1,a.space.heat.supply);
  if(use<.35||!developmentReserve(s,f,cost,extra))continue;
  s.cash-=cost;for(const j of members)s.cells[j].level++;
  notify(`${TYPES[c.type].name}進化至第 ${c.level} 階；工程費 ${cost}，產能修正 ×${facilityFactor(c).toFixed(2)}。`,'good');return true;
 }
}
export function autoInvest(s,a,f,notify){
 if(s.autoDevelopment===false)return;
 for(let i=0;i<s.cells.length;i++){
  const c=s.cells[i];if(c.level<4||plotAnchor(s,i)!==i)continue;
  const e=evolutionStatus(s,a,i,{automatic:true}),members=plotMembers(s,i),extra=members.reduce((n,j)=>n+monthlyCost(s,{...s.cells[j],level:s.cells[j].level+1,branch:e?.branch||null})-monthlyCost(s,s.cells[j]),0);if(!e?.ready||!developmentReserve(s,f,e.cost,extra))continue;
  const stock=s.orbital.stock[deckOf(i)];s.cash-=e.cost;stock.alloy-=e.alloy;stock.parts-=e.parts;
  advancePlot(s,i,e.branch);
  notify(`${e.name}已自動進階；投資 ${e.cost}，保留六個月營運準備金。`,'good');return true;
 }
}
