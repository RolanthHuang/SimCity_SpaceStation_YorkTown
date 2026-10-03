import {TYPES,SIZE,idx,xy,wrapX,deltaX,neighbors,terrain,isRoad,zoneOf,buildingCapacity,deckOf} from './catalog.mjs';
import {branchDefaults} from './branches.mjs';
import {GATE_FOOTINGS} from './orbital.mjs';

export const PLAN_TIERS=[{id:'lean',name:'精簡延伸',limit:11000,sites:20},{id:'balanced',name:'完整街區',limit:25000,sites:38},{id:'flagship',name:'旗艦更新',limit:52000,sites:64}];
const blank=()=>({...branchDefaults(),type:null,level:0,pop:0,age:0,wire:false,pipe:false,fire:0,renewal:'inherit',retiredPlant:null,enabled:true,upgrade:0,preserve:false,plot:null,span:1,subplot:false,roadBase:null});
export function areaBounds(ids){if(!ids.length)return null;const [x,y]=xy(ids[0]);let minX=0,maxX=0,minY=y,maxY=y;for(const i of ids){const [u,v]=xy(i),d=deltaX(x,u);minX=Math.min(minX,d);maxX=Math.max(maxX,d);minY=Math.min(minY,v);maxY=Math.max(maxY,v);}return {x:wrapX(x+minX),y:minY,w:maxX-minX+1,h:maxY-minY+1};}
function connection(s,area,protectedSet){
 const ids=new Set(area),queue=[],prev=new Map(),b=areaBounds(area);for(const i of area){if(neighbors(i).some(n=>!ids.has(n))&&(!s.cells[i].type||isRoad(s.cells[i].type))&&!s.cells[i].preserve&&!protectedSet.has(i)){queue.push(i);prev.set(i,null);}}
 let end=null;for(let p=0;p<queue.length&&p<5000;p++){const i=queue[p];if(isRoad(s.cells[i].type)){end=i;break;}if(p>3000)break;for(const n of neighbors(i)){if(prev.has(n)||!terrain(n)||deckOf(n)!==deckOf(area[0])||protectedSet.has(n)||s.cells[n].preserve||s.cells[n].type&&!isRoad(s.cells[n].type))continue;const [x,y]=xy(n);if(Math.abs(deltaX(b.x,x))>b.w+40||Math.abs(y-b.y)>b.h+30)continue;prev.set(n,i);queue.push(n);}}
 if(end===null)return null;const path=[];for(let i=end;i!==null;i=prev.get(i))path.push(i);return path.reverse();
}
function pattern(s,b){
 const counts={r:0,R:0,c:0,C:0,i:0,I:0},ratio={R:0,C:0,I:0};let samples=0;
 for(let dy=-10;dy<b.h+10;dy++)for(let dx=-12;dx<b.w+12;dx++){const i=idx(wrapX(b.x+dx),b.y+dy);if(!terrain(i))continue;const c=s.cells[i];if(Object.hasOwn(counts,c.type)&&c.level&&c.enabled!==false&&!c.vacant&&!c.fire){counts[c.type]++;ratio[zoneOf(c.type)]++;samples++;}}
 return {types:{R:counts.R>counts.r?'R':'r',C:counts.C>counts.c?'C':'c',I:counts.I>counts.i?'I':'i'},ratio,samples};
}
const clone=s=>({...s,cells:s.cells.map(c=>({...c})),continuum:structuredClone(s.continuum),transit:structuredClone(s.transit),orbital:structuredClone(s.orbital)});
export function planExpansion(s,a,f,ids,tierId,analyze,forecast){
 const tier=PLAN_TIERS.find(t=>t.id===tierId)||PLAN_TIERS[1],b=areaBounds(ids);
 if(!b||b.w<6||b.h<6)return {ok:false,error:'請框選至少 6 × 6 格，才能安排三格進深的街區及基礎設施。'};
 if(b.w>32||b.h>24||ids.length!==b.w*b.h||ids.some(i=>!terrain(i)||deckOf(i)!==deckOf(ids[0])))return {ok:false,error:'每次選擇完整的 6 × 6 至 32 × 24 格平台；較大的基地可分期延伸。'};
 const budget=Math.min(tier.limit,Math.floor(s.cash-Math.max(6000,f.cost*6)));if(budget<3500)return {ok:false,error:'扣除六個月營運預備金後，尚不足以完成一個有供應的街區。'};
 const protection=new Set(s.orbital.projects.arch.built?GATE_FOOTINGS:[]),area=new Set(ids),path=connection(s,ids,protection);
 if(!path)return {ok:false,error:'此範圍找不到可保留既有建築的外部道路連接；請選擇接近市區的位置。'};
 const p=pattern(s,b),candidate=clone(s),changes=new Map();let cost=0;
 const put=(i,type)=>{if(!terrain(i)||protection.has(i)||s.cells[i].preserve||candidate.cells[i].type)return false;const price=TYPES[type].cost;if(cost+price>budget)return false;const next={...blank(),type,level:zoneOf(type)?0:1,wire:true,pipe:true};candidate.cells[i]=next;changes.set(i,{i,type,price,before:{...s.cells[i]},after:next});cost+=price;return true;};
 path.forEach(i=>put(i,'road'));
 // Three lots of pedestrian depth on either side of a seven-cell street pitch.
 const horizontal=b.w>=b.h,spine=horizontal?b.y+Math.floor(b.h/2):wrapX(b.x+Math.floor(b.w/2));
 for(const i of ids){const [x,y]=xy(i),dx=deltaX(b.x,x),dy=y-b.y;if(horizontal&&(dy%7===3||y===spine)||!horizontal&&(dx%7===3||x===spine)||horizontal&&dx===Math.floor(b.w/2)||!horizontal&&dy===Math.floor(b.h/2))put(i,'road');}
 // Join each internal spine to the road connection without crossing occupied plots.
 const roadSet=new Set([...ids,...path].filter(i=>isRoad(candidate.cells[i].type)));
 const reach=new Set();const flood=()=>{const q=path.filter(i=>isRoad(candidate.cells[i].type));q.forEach(i=>reach.add(i));q.push(...reach);for(let k=0;k<q.length;k++)for(const n of neighbors(q[k]))if(roadSet.has(n)&&!reach.has(n)){reach.add(n);q.push(n);}};flood();
 // Connect each street component to the external access through free ground.
 for(const start of roadSet){if(reach.has(start))continue;const queue=[start],prev=new Map([[start,null]]);let end=null;for(let k=0;k<queue.length;k++){const i=queue[k];if(reach.has(i)){end=i;break;}for(const n of neighbors(i))if((area.has(n)||reach.has(n))&&!prev.has(n)&&!protection.has(n)&&!s.cells[n].preserve&&(!candidate.cells[n].type||isRoad(candidate.cells[n].type))){prev.set(n,i);queue.push(n);}}if(end===null)continue;const join=[];for(let i=end;i!==null;i=prev.get(i))join.push(i);for(const i of join)if(!candidate.cells[i].type)put(i,'road');join.forEach(i=>{if(isRoad(candidate.cells[i].type))roadSet.add(i);});flood();}
 const sites=ids.filter(i=>!candidate.cells[i].type&&!protection.has(i)&&!s.cells[i].preserve).sort((i,j)=>{const [x,y]=xy(i),[u,v]=xy(j);return Math.abs(deltaX(b.x,x))+Math.abs(y-b.y)-Math.abs(deltaX(b.x,u))-Math.abs(v-b.y);});
 const nearby=i=>neighbors(i).some(n=>reach.has(n));
 const facility=type=>{const i=sites.find(i=>!candidate.cells[i].type&&nearby(i));return i===undefined?false:put(i,type);};
 // Independent local reserves: a disconnected grid never borrows the city's total supply.
 for(const type of ['power','water','life','radiator'])if(!facility(type))return {ok:false,error:'選取範圍或預算不足以完成水電、氧氣及散熱；請擴大選取或提高投資級距。'};
 const planned={R:0,C:0,I:0};for(const c of s.cells){const z=zoneOf(c.type);if(z&&c.type!=='line')planned[z]+=c.level?buildingCapacity(c):TYPES[c.type].base*2.5;}
 const openJobs=Math.max(0,a.stats.jobs-a.stats.workers),room={R:Math.max(0,Math.ceil(openJobs/.48)-(planned.R-a.stats.population)),C:a.stats.population*.23+20-planned.C,I:a.stats.population*.32+65-planned.I};
 const zoneCounts={R:0,C:0,I:0};let total=0;
 const distance=new Map();for(const i of reach)distance.set(i,0);const dq=[...reach];for(let k=0;k<dq.length;k++){const i=dq[k],d=distance.get(i);if(d>=3)continue;for(const j of neighbors(i))if(area.has(j)&&!distance.has(j)&&(!candidate.cells[j].type||zoneOf(candidate.cells[j].type))){distance.set(j,d+1);dq.push(j);}}
 for(const i of sites){if(candidate.cells[i].type||!distance.has(i)||total>=tier.sites)continue;
  const candidates=['I','R','C'].filter(z=>a.stats.demand[z]>0&&room[z]>=TYPES[p.types[z]].base*2.5).sort((x,y)=>room[y]/Math.max(1,TYPES[p.types[y]].base)-room[x]/Math.max(1,TYPES[p.types[x]].base));
  const z=candidates[0];if(!z)break;const type=p.types[z],capacity=TYPES[type].base*2.5;if(!put(i,type))continue;room[z]-=capacity;zoneCounts[z]++;total++;if(z==='I'||z==='C')room.R+=capacity/.48;if(z==='R'){room.C+=capacity*.23;room.I+=capacity*.32;}
 }
 if(!total)return {ok:false,error:'現有空置分區已足以承接需求，或稅率不支持成長。先改善就業、供應或入住率，再延伸土地。'};
 if(tier.id!=='lean'){facility('fire');facility('school');if(tier.id==='flagship'){facility('hospital');facility('police');}}
 // Place coherent green courtyards rather than packing every spare tile with zones.
 for(const i of sites){if(candidate.cells[i].type||!distance.has(i)||cost+180>budget)continue;const [x,y]=xy(i);if((x+y)%3===0){put(i,'park');if([...changes.values()].filter(c=>c.type==='park').length>=(tier.id==='flagship'?12:6))break;}}
 // Remove disconnected speculative road stubs from the quote.
 for(const [i,c]of [...changes])if(isRoad(c.type)&&!reach.has(i)){candidate.cells[i]={...s.cells[i]};cost-=c.price;changes.delete(i);}
 const mature=clone(candidate);for(const c of changes.values())if(zoneOf(c.type)){const mc=mature.cells[c.i];mc.level=4;if(zoneOf(c.type)==='R')mc.pop=buildingCapacity(mc);}
 let stress=analyze(mature);for(const type of ['power','water','life','radiator']){
  const coverage=()=>Math.min(...[...changes.values()].filter(c=>zoneOf(c.type)).map(c=>type==='power'?stress.power.coverage[c.i]:type==='water'?stress.water.coverage[c.i]:stress.space[type==='life'?'oxygen':'cooling'][c.i]));
  for(let n=0;n<3&&coverage()<.98;n++){if(!facility(type))break;const latest=[...changes.values()].at(-1);mature.cells[latest.i]={...latest.after};stress=analyze(mature);}
 }
 const zoneSites=[...changes.values()].filter(c=>zoneOf(c.type)),coverage=Math.min(...zoneSites.map(c=>Math.min(stress.power.coverage[c.i],stress.water.coverage[c.i],stress.space.oxygen[c.i],stress.space.cooling[c.i])));
 if(coverage<.95)return {ok:false,error:'第四階建築的供應預留不足；此預算或範圍不能負擔安全的擴建。請調整選區或提高級距。'};
 if(zoneSites.some(c=>zoneOf(c.type)==='I'&&!stress.freight[c.i]))return {ok:false,error:'新工業找不到貨運船塢。請沿著有船塢的道路延伸，避免蓋出無法營運的工業。'};
 const immediate=analyze(candidate),future=forecast(mature,stress),now=forecast(candidate,immediate),reserve=Math.max(6000,now.cost*6),remaining=s.cash-cost;
 if(remaining<reserve)return {ok:false,error:'建造後無法保留六個月的營運資金；請降低投資級距。'};
 if(now.net<0&&remaining/Math.abs(now.net)<12)return {ok:false,error:'成長期間的收入不足以支撐十二個月，請先改善財政。'};
 return {ok:true,tier:tier.id,bounds:b,budget,cost,changes:[...changes.values()],zoneCounts,sites:total,roads:[...changes.values()].filter(c=>isRoad(c.type)).length,parks:[...changes.values()].filter(c=>c.type==='park').length,monthlyExtra:now.cost-f.cost,net:now.net,futureNet:future.net,coverage,reserve,remaining,pattern:p.samples?`${p.types.R==='R'?'高':'低'}密度住宅、${p.types.C==='C'?'高':'低'}密度商業、${p.types.I==='I'?'重':'輕'}工業`:'基礎混合街區',phase:'先完成道路與供應；分區從空地自然成長。不複製成熟建築或居民。'};
}
export function commitExpansion(s,plan,build){
 if(!plan?.ok)return {ok:false,error:'請先完成有效的規劃。'};
 if(plan.changes.some(c=>JSON.stringify(s.cells[c.i])!==JSON.stringify(c.before)))return {ok:false,error:'城市格局已變更，請重新規劃。'};
 if(s.cash<plan.cost+plan.reserve)return {ok:false,error:'資金已改變，請重新估算並保留營運預備金。'};
 const before=structuredClone(s.continuum),transitBefore=structuredClone(s.transit),changes=[],start=s.cash;
 const ordered=[...plan.changes].sort((a,b)=>{const order=t=>isRoad(t)?0:TYPES[t].group==='utility'?1:zoneOf(t)?3:2;return order(a.type)-order(b.type);});
 for(const c of ordered){const r=build(s,[c.i],c.type);if(!r.ok){for(const v of changes)s.cells[v.i]=v.before;s.cash=start;s.transit=transitBefore;s.continuum=before;return {ok:false,error:`施工取消並退款：${r.error}`};}changes.push(...r.changes);}
 s.continuum.assistant={month:s.month,cost:plan.cost,sites:plan.sites,pattern:plan.pattern,bounds:plan.bounds};
 return {ok:true,cost:start-s.cash,count:changes.length,month:s.month,changes,transitBefore,transitAfter:structuredClone(s.transit),continuumBefore:before,continuumAfter:structuredClone(s.continuum)};
}
