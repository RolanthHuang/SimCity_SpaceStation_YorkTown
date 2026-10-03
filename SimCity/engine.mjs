import {emptyContinuum,ensureContinuum,lineAt,lineJobs,lineMaintenance,previewLine,constructLine,continuumIncome,applyContinuumAuras,tickGardens,tickGardenMonths,restoreContinuum,attachLineTransit} from './continuum.mjs';
import {branchDefaults,BRANCH_FIELDS,branchZone,branchDefinition,branchEffects,BRANCHES} from './branches.mjs';
import {initializeBranches,tickBranches,advancePlot,branchProgress} from './branch-development.mjs';
import {streetCell,createTransit,previewStation,cleanTransit,restoreTransit,attachMaglev,linkUpkeep} from './maglev.mjs';
import {plotAnchor,plotMembers,roadAccess,clearPlot,validatePlots,square,LANDMARK_TYPES} from './plots.mjs';
import {redevelopment,autoInvest} from './redevelopment.mjs';
import {evolvable,evolutionStatus,stageName,stageUpkeep} from './evolution.mjs';
import {SIZE,HEIGHT,CELL_COUNT,VERSION,deckOf,wrapX,deltaX,upgradeFactor,buildingCapacity,baseBuildingCapacity,developmentFactor,facilityFactor,facilityUpkeep,districtCore,isEnabled,INTERIORS,TYPES,FUNDING,clamp,idx,xy,neighbors,terrain,isRoad,isTransport,zoneOf,residential} from './catalog.mjs';

import {createOrbital,restoreOrbital,orbitalLoads,orbitalReport,tickOrbital,PORTS,GATES,GATE_FOOTINGS,canPortal} from './orbital.mjs';
import {spaceNetworks} from './space.mjs';
import {reservedSample} from './atelier-plan.mjs';
const N=CELL_COUNT;
const empty=()=>({...branchDefaults(),type:null,level:0,pop:0,age:0,wire:false,pipe:false,fire:0,renewal:'inherit',retiredPlant:null,enabled:true,upgrade:0,preserve:false,plot:null,span:1,subplot:false,roadBase:null});
const fundingKey=t=>TYPES[t]?.group==='utility'?'utilities':TYPES[t]?.group==='transport'?'transport':['fire','police','school','hospital'].includes(t)?t:'parks';
const scale=(s,t)=>s.funding[fundingKey(t)]/100;
const building=t=>t&&TYPES[t]?.group!=='network'&&!isTransport(t)&&t!=='rubble';
// Zoning is a plan, not a constructed consumer. Its conduits can still carry supply to future development.
const consumesUtilities=c=>!c.subplot&&building(c.type)&&c.level>0&&isEnabled(c);
const capacity=buildingCapacity;
const nominalJobs=c=>c.subplot||c.vacant?0:c.type==='line'?Math.round(lineJobs(c)):zoneOf(c.type)==='C'||zoneOf(c.type)==='I'?(c.level?capacity(c):0):Math.round((TYPES[c.type]?.jobs||0)*upgradeFactor(c)*facilityFactor(c));
function random(s){s.rng=(Math.imul(1664525,s.rng)+1013904223)>>>0;return s.rng/4294967296;}
export function message(s,text,tone='info'){s.events.unshift({month:s.month,text,tone});s.events=s.events.slice(0,45);}

export function createCity({starter=true,seed=2263}={}){
 const s={continuum:emptyContinuum(),transit:createTransit(),orbital:createOrbital(),spaceIncident:null,autoDevelopment:true,powerRenewal:true,powerIncident:null,lastRenewal:{month:0,cost:0},version:VERSION,name:'Yorktown',month:0,cash:65000,rng:seed>>>0,cells:Array.from({length:N},empty),tax:{R:9,C:9,I:9},funding:Object.fromEntries(Object.keys(FUNDING).map(k=>[k,100])),policies:{green:false,transit:false,campaign:false},loans:[],education:48,health:65,history:[],events:[],disasters:true,emergency:0,highPopulation:0,insolvent:false,unlocks:[]};
 if(starter){
  const put=(x,y,type,level=1,pop=0)=>{if(terrain(idx(x,y)))Object.assign(s.cells[idx(x,y)],{type,level:['r','R','c','C','i','I'].includes(type)?[0,1,3,5][level]:level,pop,wire:true,pipe:true});};
  for(const offset of [0,52]){
   const putAt=(x,y,type,level=1,pop=0)=>put(x,y+offset,type,level,pop);
   for(const y of [15,21])for(let x=9;x<=38;x++)putAt(x,y,'avenue');
   for(const x of [18,28])for(let y=11;y<=26;y++)putAt(x,y,'road');
   for(let y=21;y<=26;y++)putAt(12,y,'road');
   putAt(12,14,'power');putAt(13,14,'water');putAt(14,14,'dock');putAt(15,14,'fabricator');
   for(const y of [14,16])for(const x of [16,17,19,20,21,22,23,24,25,26])putAt(x,y,'r',2,22);
   for(let x=22;x<=26;x++)putAt(x,20,'c',1);
   for(const y of [14,20])for(let x=29;x<=36;x++)putAt(x,y,'i',1);
   putAt(17,19,'school');putAt(19,19,'hospital');putAt(17,23,'fire');putAt(19,23,'police');
   putAt(27,19,'radiator');putAt(27,17,'life');
   for(const [x,y] of [[17,17],[19,17],[20,20],[21,20],[24,22],[25,22],[26,22]])putAt(x,y,'park');
  }
  s.cash=70000;s.disasters=false;s.policies.green=true;
  message(s,'軌道晨光計畫：兩個街區已各自接通水電。前往「船塢與巨構」接單，讓工業與精密製造供應出口。');
  message(s,'巨構預留場址已標記。晨曦之門完成後可步行穿越；先完成兩張訂單迎接巨型訪客船。');
 }else message(s,'空白殖民地已就緒。先建道路、電廠、水循環廠及貨運船塢，再沿路劃住宅、商業與工業。');
 s.highPopulation=s.cells.reduce((v,c)=>v+c.pop,0);return s;
}

// Independent utility networks: roads include both conduits, while separate lines can cross open land.
function utility(s,key,sources,demandFor){
 const labels=new Int32Array(N).fill(-1),groups=[];
 for(let i=0;i<N;i++)if(terrain(i)&&s.cells[i][key]&&labels[i]<0){
  const id=groups.length,queue=[i];labels[i]=id;const g={cells:queue,supply:0,demand:0};groups.push(g);
  for(let p=0;p<queue.length;p++)for(const j of neighbors(queue[p]))if(terrain(j)&&s.cells[j][key]&&labels[j]<0){labels[j]=id;queue.push(j);}
 }
 for(const [i,amount] of sources){const id=labels[i];if(id>=0)groups[id].supply+=amount;}
 const servedBy=new Int32Array(N).fill(-1),demand=new Float64Array(N);
 for(let i=0;i<N;i++){
  demand[i]=demandFor(s.cells[i],i);if(!demand[i])continue;
  const ids=[labels[i],...neighbors(i).map(j=>labels[j])].filter(id=>id>=0);
  const id=ids.sort((a,b)=>groups[b].supply-groups[a].supply)[0];
  if(id!==undefined){servedBy[i]=id;groups[id].demand+=demand[i];}
 }
 const coverage=new Float32Array(N);
 for(let i=0;i<N;i++){const id=servedBy[i]>=0?servedBy[i]:labels[i];coverage[i]=id>=0&&groups[id].supply>0?Math.min(1,groups[id].supply/Math.max(1,groups[id].demand)):0;}
 return {coverage,labels,servedBy,groups,supply:groups.reduce((v,g)=>v+g.supply,0),demand:Array.from(demand).reduce((a,b)=>a+b,0),delivered:Array.from(demand).reduce((v,n,i)=>v+n*coverage[i],0)};
}
const distance=(a,b)=>{const [x,y]=xy(a),[u,v]=xy(b);return Math.hypot(deltaX(x,u),y-v);};
const around=(i,r,fn)=>{const [x,y]=xy(i);for(let v=Math.max(0,y-r);v<=Math.min(HEIGHT-1,y+r);v++)for(let dx=-r;dx<=r;dx++){const d=Math.hypot(dx,y-v);if(d<=r)fn(idx(wrapX(x+dx),v),d);}};

class Heap{
 constructor(){this.a=[];}
 push(item){const a=this.a;let i=a.length;a.push(item);while(i>0){const p=(i-1)>>1;if(a[p][0]<=item[0])break;a[i]=a[p];i=p;}a[i]=item;}
 pop(){const a=this.a,first=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1][0]<a[c][0])c++;if(a[c][0]>=last[0])break;a[i]=a[c];i=c;}a[i]=last;}return first;}
}
function routes(graph,starts,traffic,roadCapacity,cells){
 const dist=new Float32Array(N).fill(Infinity),previous=new Int32Array(N).fill(-1),heap=new Heap();
 for(const n of starts){dist[n]=0;heap.push([0,n]);}
 while(heap.a.length){const [d,i]=heap.pop();if(d>dist[i]+.0001||d>65)continue;for(const j of graph[i]){
  const link=graph.railEdges?.get(`${i}:${j}`),weight=link?(graph.transfers.get(`${i}:${j}`))*(1+Math.min(3,link.riders/Math.max(1,link.capacity))*.6):(graph.transfers?.get(`${i}:${j}`)||0)+(cells[j].type==='rail'?.35:1)*(1+Math.min(3,(traffic[j]||0)/Math.max(1,roadCapacity[j]))*.55),next=d+weight;
  if(next<dist[j]){dist[j]=next;previous[j]=i;heap.push([dist[j],j]);}
 }}return {dist,previous};
}

export function analyze(s){
 const cells=s.cells,active=[];let population=0;
 for(let i=0;i<N;i++){if(building(cells[i].type)&&!cells[i].subplot)active.push(i);population+=cells[i].pop;}
 const pSources=active.filter(i=>['power','solar'].includes(cells[i].type)&&cells[i].age<600&&!cells[i].fire&&isEnabled(cells[i])).map(i=>[i,TYPES[cells[i].type].supply*upgradeFactor(cells[i])*facilityFactor(cells[i])*clamp(scale(s,cells[i].type),0,1.15)]);
 for(const l of s.continuum?.lines||[]){const c=cells[l.anchor];if(isEnabled(c)&&!c.fire)pSources.push([l.anchor,l.segments*175]);}
 const power=utility(s,'wire',pSources,(c,i)=>(consumesUtilities(c)?(residential(c.type)?(4+c.pop*.8+(c.type==='line'?lineJobs(c)*.6:0))*branchEffects(c).power:(8+nominalJobs(c)*1.2)*branchEffects(c).power):0)+orbitalLoads(s,i).power);
 const wSources=active.filter(i=>cells[i].type==='water'&&!cells[i].fire&&isEnabled(cells[i])).map(i=>[i,TYPES.water.supply*upgradeFactor(cells[i])*facilityFactor(cells[i])*power.coverage[i]*clamp(scale(s,'water'),0,1.15)]);
 const water=utility(s,'pipe',wSources,(c,i)=>(consumesUtilities(c)&&!['water','power','solar'].includes(c.type)?(residential(c.type)?(3+c.pop)*(c.type==='line'?.65:1)*branchEffects(c).water:(8+nominalJobs(c)*.9)*branchEffects(c).water):0)+orbitalLoads(s,i).water);
 const space=spaceNetworks(s,power,water);
 const access=Array.from({length:N},()=>[]),graph=Array.from({length:N},()=>[]),traffic=new Float32Array(N),roadCapacity=new Float32Array(N);
 const busNodes=new Float32Array(N);
 for(const i of active)if(cells[i].type==='bus'&&isEnabled(cells[i])&&power.coverage[i]>.5&&water.coverage[i]>.5){
  const seen=new Set(),queue=neighbors(i).filter(j=>streetCell(cells[j]));for(const n of queue)seen.add(n);
  for(let p=0;p<queue.length;p++){const n=queue[p];busNodes[n]+=1;for(const j of neighbors(n))if(streetCell(cells[j])&&!seen.has(j)){seen.add(j);queue.push(j);}}
 }
 for(let i=0;i<N;i++)if(isTransport(cells[i].type)||cells[i].type==='station'){
  // Boarding riders use a station platform, rather than a single local-road lane.
  roadCapacity[i]=(cells[i].type==='station'?Math.max(TYPES.station.capacity,TYPES[cells[i].roadBase||'road'].capacity):TYPES[cells[i].type].capacity)*clamp(scale(s,'road'),.05,1.5)*(1+Math.min(.6,busNodes[i]*.2)+(s.policies.transit?.35:0));
  graph[i]=neighbors(i).filter(j=>(isTransport(cells[j].type)||cells[j].type==='station')&&(cells[i].type==='rail')===(cells[j].type==='rail'));
 }
 for(const i of active)if(cells[i].type==='station'&&isEnabled(cells[i])&&power.coverage[i]>.5){const ns=neighbors(i).filter(j=>isTransport(cells[j].type));for(const a of ns)for(const b of ns)if(a!==b)graph[a].push(b);}
 const pedestrian=roadAccess(cells);
 for(const i of active){
  access[i]=neighbors(i).filter(j=>streetCell(cells[j]));if(cells[i].type==='station'&&access[i].length)access[i]=[i];
  if(!access[i].length&&pedestrian.owner[i]>=0)access[i]=[pedestrian.owner[i]];
  if(LANDMARK_TYPES.includes(cells[i].type)||cells[i].type==='line'||cells[i].type==='park'&&cells[i].span>1)access[i]=[...new Set(plotMembers(s,i).flatMap(j=>neighbors(j).filter(k=>streetCell(cells[k]))))];
 }
 const operational=new Float32Array(N);
 for(const i of active)operational[i]=isEnabled(cells[i])&&!cells[i].fire&&access[i].length?Math.min(power.coverage[i],['power','solar','water'].includes(cells[i].type)?1:water.coverage[i]):0;
 for(const i of active)if(!['power','solar','water','life','radiator'].includes(cells[i].type))operational[i]*=Math.min(space.oxygen[i],space.cooling[i]);
 const transitAnalysis={operational};
 const portsReady=PORTS.every(i=>cells[i].type==='dock'&&operational[i]>.95);
 if(portsReady){
  graph.transfers=new Map();
  const connect=(starts,cost)=>{if(starts.every(i=>Number.isInteger(i)&&isRoad(cells[i]?.type))){const [u,v]=starts;graph[u].push(v);graph[v].push(u);graph.transfers.set(`${u}:${v}`,cost);graph.transfers.set(`${v}:${u}`,cost);}};
  connect(PORTS.map(i=>access[i][0]),11);
  if(canPortal(s,transitAnalysis))connect(GATES,1);
 }
 // Freight and external passenger connections are reachable network services, never global magic bonuses.
 const portStarts=active.filter(i=>cells[i].type==='dock'&&operational[i]>.5).flatMap(i=>access[i]);
 const passengerStarts=active.filter(i=>cells[i].type==='airport'&&operational[i]>.5).flatMap(i=>access[i]);
 const portDist=routes(graph,portStarts,traffic,roadCapacity,cells).dist;
 const passengerDist=routes(graph,passengerStarts,traffic,roadCapacity,cells).dist;
 const freight=new Uint8Array(N),passengers=new Uint8Array(N);
 for(const i of active){freight[i]=access[i].some(n=>portDist[n]<60)?1:0;passengers[i]=access[i].some(n=>passengerDist[n]<60)?1:0;}
 const maglev=attachMaglev(s,operational,graph,roadCapacity),lineTransit=attachLineTransit(s,operational,graph);
 const pollution=new Float32Array(N),parks=new Float32Array(N),services=Object.fromEntries(['fire','police','school','hospital'].map(k=>[k,new Float32Array(N)]));
 for(const i of active){const c=cells[i],t=c.type;
  if(zoneOf(t)==='I'&&c.level>0&&isEnabled(c))around(i,7,(j,d)=>pollution[j]+=(t==='I'?28:16)*developmentFactor(c)*(1-d/8)*(s.policies.green?.6:1)*(s.education>70?.7:1)*(districtCore(c)?.pollution||1)*branchEffects(c).pollution);
  const core=districtCore(c);if(core?.amenity&&plotAnchor(s,i)===i){const [x,y]=xy(i),offset=Math.floor((c.span-1)/2),center=idx(wrapX(x+offset),y+offset);around(center,5,(j,d)=>parks[j]+=core.amenity*(1-d/6)*operational[i]);}
  if(t==='power')around(i,4,(j,d)=>pollution[j]+=8*(1-d/5));
  if(t==='park'||t==='stadium')around(i,TYPES[t].radius,(j,d)=>parks[j]+=22*(1-d/(TYPES[t].radius+1))*scale(s,t)*upgradeFactor(c)*operational[i]);
  if(services[t]){const radius=Math.round(TYPES[t].radius*Math.sqrt(clamp(scale(s,t),0,1.5)*facilityFactor(c)));if(radius)around(i,radius,(j,d)=>services[t][j]=Math.max(services[t][j],100*(1-d/(radius+2))*clamp(scale(s,t),0,1.3)*upgradeFactor(c)*facilityFactor(c)*operational[i]));}
 }
 applyContinuumAuras(s,operational,parks,around);
 const schoolCapacity=active.filter(i=>cells[i].type==='school').reduce((a,i)=>a+600*upgradeFactor(cells[i])*facilityFactor(cells[i])*operational[i]*scale(s,'school'),0);
 const hospitalCapacity=active.filter(i=>cells[i].type==='hospital').reduce((a,i)=>a+900*upgradeFactor(cells[i])*facilityFactor(cells[i])*operational[i]*scale(s,'hospital'),0);
 for(let i=0;i<N;i++){services.school[i]*=Math.min(1,schoolCapacity/Math.max(1,population));services.hospital[i]*=Math.min(1,hospitalCapacity/Math.max(1,population));}
 const baseParks=parks.slice(),branchHome=new Float32Array(N),branchTrade=new Float32Array(N),branchProduction=new Float32Array(N);
 const crime=new Float32Array(N),landValue=new Float32Array(N),happiness=new Float32Array(N);
 const nominal=active.reduce((a,i)=>a+nominalJobs(cells[i]),0),jobs=new Float32Array(N),filled=new Float32Array(N),employed=new Float32Array(N),commute=new Float32Array(N);
 for(const i of active){const c=cells[i];let factor=1;if(zoneOf(c.type)==='I')factor=freight[i]?1:.2;if(zoneOf(c.type)==='C')factor=clamp(population/Math.max(100,nominal*.7),.15,1)+(passengers[i]?.2:0);jobs[i]=Math.floor(nominalJobs(c)*Math.min(1,factor)*operational[i]*(c.level?1:0));}
 // Assign finite job seats along actual paths. Rotating origin priority prevents permanent residential bias.
 const homes=active.filter(i=>residential(cells[i].type)&&cells[i].pop>0),jobSites=active.filter(i=>jobs[i]>0),offset=s.month%Math.max(1,homes.length);
 let totalWorkers=0,totalEmployed=0,commuteTotal=0;
 for(let h=0;h<homes.length;h++){
  const i=homes[(h+offset)%homes.length],workers=Math.floor(cells[i].pop*.48);totalWorkers+=workers;if(!access[i].length)continue;
  const path=routes(graph,access[i],traffic,roadCapacity,cells),candidates=[];
  for(const j of jobSites)if(jobs[j]-filled[j]>=1){let best=-1,d=Infinity;for(const n of access[j])if(path.dist[n]<d){d=path.dist[n];best=n;}d+=Math.max(0,pedestrian.dist[i])+Math.max(0,pedestrian.dist[j]);if(d<=42)candidates.push({j,d,best});}
  candidates.sort((a,b)=>a.d-b.d);let needed=workers,travel=0;
  for(const {j,d,best} of candidates){const count=Math.min(needed,jobs[j]-filled[j]);if(!count)continue;filled[j]+=count;employed[i]+=count;needed-=count;travel+=count*d;
   let n=best,guard=0;while(n>=0&&guard++<N){const prev=path.previous[n],link=prev>=0?graph.railEdges?.get(`${prev}:${n}`):null;if(link)link.riders+=count;traffic[n]+=count;n=prev;}if(!needed)break;
  }totalEmployed+=employed[i];commuteTotal+=travel;commute[i]=employed[i]?travel/employed[i]:0;
 }
 for(const i of active){const c=cells[i],e=branchEffects(c);if(!c.branch||plotAnchor(s,i)!==i||operational[i]<=0)continue;const members=plotMembers(s,i),own=new Set(members),occupied=members.reduce((n,j)=>n+(residential(c.type)?cells[j].pop:filled[j]),0),seats=members.reduce((n,j)=>n+(residential(c.type)?capacity(cells[j]):jobs[j]),0),activity=clamp(occupied/Math.max(1,seats),0,1)*Math.min(...members.map(j=>operational[j])),[x,y]=xy(i),offset=Math.floor((c.span-1)/2),center=idx(wrapX(x+offset),y+offset),radius=4+offset;
  around(center,radius,(j,d)=>{if(deckOf(j)!==deckOf(i))return;const weight=(1-d/(radius+1))*activity;if(e.amenity)parks[j]+=Math.min(12,e.amenity*weight);if(own.has(j))return;branchHome[j]=Math.min(.08,branchHome[j]+e.homeAura*weight);branchTrade[j]=Math.min(.10,branchTrade[j]+e.tradeAura*weight);branchProduction[j]=Math.min(.20,branchProduction[j]+e.productionAura*weight);});
 }
 for(let i=0;i<N;i++)if(isRoad(cells[i].type)&&traffic[i]>0)around(i,2,(j,d)=>pollution[j]+=Math.min(12,traffic[i]*.018)*(1-d/3)*(s.policies.transit?.75:1));
 let satisfied=0,coveragePower=0,coverageWater=0,edu=0,health=0,crimeSum=0,pollutionSum=0;
 for(let i=0;i<N;i++){if(!terrain(i))continue;const c=cells[i],workers=Math.floor(c.pop*.48),employment=workers?employed[i]/workers:1;
  crime[i]=clamp(12+(1-employment)*45+(c.type==='R'?8:0)-services.police[i]*.6,0,100);
  landValue[i]=clamp(42+parks[i]+services.school[i]*.13+services.hospital[i]*.13+services.police[i]*.1-pollution[i]*.45-crime[i]*.25,1,100);
  happiness[i]=clamp(55+(s.health-65)*.18+parks[i]*.25+services.school[i]*.12+services.hospital[i]*.12+employment*20-(s.tax.R-8)*2-pollution[i]*.35-crime[i]*.2-(1-power.coverage[i])*35-(1-water.coverage[i])*35-(access[i].length?0:30),0,100);
  if(c.pop){satisfied+=happiness[i]*c.pop;coveragePower+=power.coverage[i]*c.pop;coverageWater+=water.coverage[i]*c.pop;edu+=services.school[i]*c.pop;health+=services.hospital[i]*c.pop;crimeSum+=crime[i]*c.pop;pollutionSum+=pollution[i]*c.pop;}
 }
 const availableJobs=Array.from(jobs).reduce((a,b)=>a+b,0),vacancies=availableJobs-totalEmployed;
 const workforce=totalWorkers||1,unemployment=totalWorkers?(totalWorkers-totalEmployed)/workforce:0;
 const totalC=active.filter(i=>zoneOf(cells[i].type)==='C').reduce((a,i)=>a+nominalJobs(cells[i]),0),totalI=active.filter(i=>zoneOf(cells[i].type)==='I').reduce((a,i)=>a+nominalJobs(cells[i]),0);
 const demand={R:clamp(12+(vacancies-Math.max(0,totalWorkers-totalEmployed))*100/Math.max(40,workforce)-(s.tax.R-9)*6+(s.policies.campaign?12:0),-100,100),C:clamp((population*.23+20-totalC)*100/Math.max(80,totalC)-(s.tax.C-9)*6+(s.policies.campaign?12:0),-100,100),I:clamp((population*.32+65-totalI)*100/Math.max(80,totalI)-(s.tax.I-9)*6,-100,100)};
 const congestion=Array.from(traffic).reduce((v,n,i)=>Math.max(v,roadCapacity[i]?n/roadCapacity[i]:0),0);
 const stats={oxygen:space.oxygenCoverage,cooling:space.coolingCoverage,population,workers:totalWorkers,employed:totalEmployed,jobs:availableJobs,unemployment,happiness:population?satisfied/population:50,power:population?coveragePower/population:power.demand?power.delivered/power.demand:1,water:population?coverageWater/population:water.demand?water.delivered/water.demand:1,school:population?edu/population:0,hospital:population?health/population:0,crime:population?crimeSum/population:0,pollution:population?pollutionSum/population:0,commute:totalEmployed?commuteTotal/totalEmployed:0,congestion,demand};
 return {stats,maglev,lineTransit,space,power,water,access,baseParks,branchHome,branchTrade,branchProduction,roadDistance:pedestrian.dist,operational,freight,passengers,pollution,parks,services,crime,landValue,happiness,jobs,filled,employed,traffic,roadCapacity,commute};
}

export function forecast(s,a=analyze(s)){
 const income={R:0,C:0,I:0},expenses={utilities:0,transport:0,fire:0,police:0,school:0,hospital:0,parks:0,policies:0,debt:0};
 for(let i=0;i<N;i++){const c=s.cells[i],def=TYPES[c.type];if(!def||c.subplot)continue;
  if(residential(c.type))income.R+=c.pop*s.tax.R/100*5*(.45+.55*(a.employed[i]/Math.max(1,Math.floor(c.pop*.48))))*(1+(a.branchHome?.[i]||0));
  if(zoneOf(c.type)==='C')income.C+=a.filled[i]*s.tax.C/100*16*(districtCore(c)?.trade||1)*branchEffects(c).trade*(1+(a.branchTrade?.[i]||0));
  if(zoneOf(c.type)==='I')income.I+=a.filled[i]*s.tax.I/100*14*(a.freight[i]?1:.4);
  expenses.policies+=stageUpkeep(c);
  if(def.upkeep)expenses[fundingKey(c.type)]+=def.upkeep*facilityUpkeep(c)*scale(s,c.type)*(1+(c.upgrade||0)*.2)*(isEnabled(c)?1:.15);
  if(s.policies.green&&zoneOf(c.type)==='I')expenses.policies+=a.jobs[i]*.08;
 }
 expenses.transport+=a.maglev.upkeep;
 expenses.policies+=(s.policies.transit?a.stats.population*.05:0)+(s.policies.campaign?35:0);
 expenses.debt=s.loans.reduce((v,l)=>v+Math.min(l.principal,l.balance)+l.balance*.004,0);
 const continuum=continuumIncome(s,a);income.continuum=continuum.income;expenses.continuum=continuum.upkeep;
 const orbit=orbitalReport(s,a);income.orbital=orbit.income;expenses.megastructures=orbit.upkeep;expenses.production=orbit.productionCost;
 const revenue=Object.values(income).reduce((a,b)=>a+b,0),cost=Object.values(expenses).reduce((a,b)=>a+b,0);
 return {income,expenses,revenue,cost,net:revenue-cost};
}

export const isPowerPlant=c=>['power','solar'].includes(c?.type);
export const renewalEnabled=(s,c)=>c.renewal==='on'||c.renewal!=='off'&&s.powerRenewal;
export const renewalCost=(s,i)=>{const c=s.cells[plotAnchor(s,i)],type=isPowerPlant(c)?c.type:c.retiredPlant;return (TYPES[type]?.cost||0)*plotMembers(s,i).length*facilityUpkeep({...c,type});};
export function renewPlant(s,i){
 i=plotAnchor(s,i);const c=s.cells[i],type=isPowerPlant(c)?c.type:c?.type==='rubble'?c.retiredPlant:null;
 if(!['power','solar'].includes(type))return {ok:false,error:'這格不是可更新的發電設施。'};
 const members=plotMembers(s,i),cost=Math.round(renewalCost(s,i));if(s.cash<cost)return {ok:false,error:`更新需要 ${cost} 信用點，資金不足。`};
 s.cash-=cost;for(const j of members){const v=s.cells[j];Object.assign(v,{type,level:Math.max(1,v.level),age:0,pop:0,fire:0,retiredPlant:null,wire:true,pipe:true});}
 message(s,`${TYPES[type].name}已更新，保留進化階層；支出 ${cost}，使用年限重新起算 50 年。`,'good');return {ok:true,cost};
}
function powerLifecycle(s){
 let cost=0;s.powerIncident=null;
 for(const c of s.cells)if(isPowerPlant(c))c.age++;
 for(let i=0;i<N;i++){
  const c=s.cells[i];if(plotAnchor(s,i)!==i)continue;
  if(isPowerPlant(c)&&[60,12,1].includes(600-c.age))message(s,`${TYPES[c.type].name}剩 ${600-c.age} 個月到期；${renewalEnabled(s,c)?'已安排自動更新':'到期將變成殘骸'}。`,'warn');
  const expired=isPowerPlant(c)&&c.age>=600,pending=c.type==='rubble'&&c.retiredPlant;if(!expired&&!pending)continue;
  if(renewalEnabled(s,c)){const result=renewPlant(s,i);if(result.ok){cost+=result.cost;continue;}}
  if(expired){const type=c.type,members=plotMembers(s,i);for(const j of members){const v=s.cells[j];Object.assign(v,{type:'rubble',retiredPlant:type,pop:0,fire:0,plot:null,span:1,subplot:false});}s.powerIncident=s.month;message(s,`${TYPES[type].name}已到期，整座設施轉為停機殘骸；${renewalEnabled(s,c)?'資金不足，資金足夠後會重試':'自動更新已關閉'}。`,'bad');}
 }
 s.lastRenewal={month:s.month,cost};return cost;
}

export function step(s){
 if(s.insolvent)return analyze(s);
 s.month++;const renewalCost=powerLifecycle(s);let a=analyze(s);initializeBranches(s,a);a=analyze(s);tickBranches(s,a,(text,tone)=>message(s,text,tone));a=analyze(s);
 s.education=clamp(s.education+(clamp(25+a.stats.school*.85,15,95)-s.education)*.025,10,95);
 s.health=clamp(s.health+(clamp(42+a.stats.hospital*.7-a.stats.pollution*.2,15,98)-s.health)*.035,10,98);
 const growth=[];
 for(let i=0;i<N;i++){
  const c=s.cells[i],t=c.type;if(!t)continue;if(!isPowerPlant(c))c.age++;
  if(c.fire){const protection=a.services.fire[i];c.fire-=protection>25?2:1;if(c.fire<=0){if(protection<25){damageTile(s,i);message(s,'火災留下受損地塊，請拆除後重建。','bad');}else{c.fire=0;message(s,'消防隊已控制火勢。','good');}}else if(c.fire===3&&protection<20){const next=neighbors(i).find(j=>building(s.cells[j].type)&&!s.cells[j].fire);if(next!==undefined)s.cells[next].fire=5;}continue;}
  const z=zoneOf(t);if(!z)continue;
  const viable=a.operational[i]>.75&&(z!=='I'||a.freight[i]);
  if(c.level===0){if(viable&&a.stats.demand[z]>0&&random(s)<.45){c.level=1;c.age=0;}continue;}
  if(evolvable(c)&&c.level<4&&plotAnchor(s,i)===i&&evolutionStatus(s,a,i,{automatic:true}).ready&&random(s)<.14){advancePlot(s,i,null);}
  if(residential(t)){
   const workers=Math.floor(c.pop*.48),employment=workers?a.employed[i]/workers:1;
   let change=0;
   if(!viable)change=-Math.max(2,Math.ceil(c.pop*.15));
   else if(a.happiness[i]<35||employment<.6&&c.pop>6||s.tax.R>=17)change=-Math.max(1,Math.ceil(c.pop*.07));
   else if(c.pop>baseBuildingCapacity(c))change=-Math.min(c.pop-baseBuildingCapacity(c),Math.max(1,Math.ceil((c.pop-baseBuildingCapacity(c))*.06)));
   else if(a.stats.demand.R>0&&a.happiness[i]>40)change=Math.min(baseBuildingCapacity(c)-c.pop,Math.max(1,Math.ceil(a.stats.demand.R/22)));
   growth.push([i,change]);
  }
 }
 // Immigration is limited by available jobs so simultaneous vacant zones cannot create unlimited demand.
 let immigration=Math.max(0,Math.floor((a.stats.jobs-a.stats.workers)/.48));
 for(const [i,change] of growth){const c=s.cells[i];const delta=change>0?Math.min(change,immigration):change;if(delta>0)immigration-=delta;c.pop=clamp(c.pop+delta,0,capacity(c));if(c.pop<=baseBuildingCapacity(c))c.residentReserve=0;}
 if(s.disasters&&s.month%12===0&&random(s)<.28){const vulnerable=s.cells.map((c,i)=>({c,i})).filter(({c,i})=>building(c.type)&&c.level&&a.services.fire[i]<45);if(vulnerable.length){const {i}=vulnerable[Math.floor(random(s)*vulnerable.length)];s.cells[i].fire=5;message(s,'站內發生火災。消防覆蓋不足時，火勢會延燒；可派遣應變隊。','bad');}}
 if(s.emergency>0){s.emergency--;for(const c of s.cells)if(c.fire)c.fire=Math.max(0,c.fire-2);}
 cleanTransit(s);a=analyze(s);const notify=(text,tone)=>message(s,text,tone);tickGardenMonths(s,a);tickGardens(s,a,forecast(s,a),notify);a=analyze(s);redevelopment(s,a,forecast(s,a),notify);a=analyze(s);autoInvest(s,a,forecast(s,a),notify);a=analyze(s);if(Math.min(a.stats.oxygen,a.stats.cooling)<.9&&s.spaceIncident===null){s.spaceIncident=s.month;message(s,'生命維持或散熱不足。請從「太空維生」檢查容量與管網。','bad');}else if(Math.min(a.stats.oxygen,a.stats.cooling)>=.95)s.spaceIncident=null;const f=forecast(s,a),contractNet=tickOrbital(s,a,(text,tone)=>message(s,text,tone));s.cash=Math.round((s.cash+f.net+contractNet)*100)/100;
 for(const l of s.loans){l.balance=Math.max(0,l.balance-l.principal);l.months--;}
 s.loans=s.loans.filter(l=>l.balance>.01&&l.months>0);
 s.highPopulation=Math.max(s.highPopulation,a.stats.population);
 for(const [milestone,label] of [[400,'公共會館'],[2000,'垂直居住塔']])if(s.highPopulation>=milestone&&!s.unlocks.includes(milestone)){s.unlocks.push(milestone);message(s,`人口達到 ${milestone}，已開放${label}。`,'good');}
 if(s.cash<0&&s.month%3===0)message(s,'財庫已透支。請增加收入、調整預算或發行債券。','warn');
 if(s.cash<=-20000){s.insolvent=true;message(s,'財政進入接管：時間暫停。可發債補足資金，或重新建立殖民地。','bad');}
 s.history.push({month:s.month,population:a.stats.population,cash:s.cash,net:f.net+contractNet-renewalCost,happiness:a.stats.happiness,unemployment:a.stats.unemployment});s.history=s.history.slice(-240);
 return a;
}

export function build(s,indices,tool){
 if(!['bulldoze','eraseWire','erasePipe',...Object.keys(TYPES).filter(t=>t!=='rubble')].includes(tool))return {ok:false,error:'未知建造工具。'};
 if(tool==='line')return constructLine(s,previewLine(s,indices));
 if(tool==='station')return buildStation(s,indices[0]);
 if(tool==='airport'||tool==='rail')return {ok:false,error:tool==='airport'?'星際客運港暫停新建，等待專屬客運經濟系統。':'只需放置磁浮車站，系統會自動建立高架連線。'};
 const def=TYPES[tool];if(def?.unlock&&s.highPopulation<def.unlock)return {ok:false,error:`人口達 ${def.unlock} 才能建造${def.name}。`};
 const continuumBefore=structuredClone(ensureContinuum(s));
 const transitBefore=structuredClone(s.transit||createTransit()),changes=[];let cost=0,occupied=0;
 if(LANDMARK_TYPES.includes(tool))return buildLandmark(s,indices[0],tool);
 if(tool==='bulldoze')indices=indices.flatMap(i=>Number.isInteger(i)&&s.cells[i]?plotMembers(s,i):[]);
 for(const i of [...new Set(indices)]){
  if(!Number.isInteger(i)||i<0||i>=N||!terrain(i))continue;
  if(s.orbital.projects.arch.built&&GATE_FOOTINGS.includes(i)&&!['wire','pipe','eraseWire','erasePipe'].includes(tool)){occupied++;continue;}
  if(s.artSample&&reservedSample(i)){occupied++;continue;}
  const c=s.cells[i],next={...c};let price=0;
  if(tool==='bulldoze'){if(!c.type&&!c.wire&&!c.pipe)continue;Object.assign(next,empty());price=5;}
  else if(tool==='eraseWire'||tool==='erasePipe'){const k=tool==='eraseWire'?'wire':'pipe';if(!c[k])continue;next[k]=false;price=1;}
  else if(tool==='wire'||tool==='pipe'){if(c[tool])continue;next[tool]=true;price=def.cost;}
  else{
   if(c.type===tool)continue;
   if(c.type&&!(isRoad(c.type)&&isRoad(tool))){occupied++;continue;}
   Object.assign(next,{...branchDefaults(),type:tool,level:zoneOf(tool)&&tool!=='arcology'?0:1,pop:0,age:0,wire:true,pipe:true,fire:0,renewal:'inherit',retiredPlant:null,enabled:true,upgrade:0,preserve:false,plot:null,span:1,subplot:false});price=def.cost;
  }
  changes.push({i,before:{...c},after:next});cost+=price;
 }
 if(!changes.length)return {ok:false,error:occupied?(s.artSample?'樣板建築與水岸保留用地不可改建；可管理三棟建築，或在周邊空地建造。':'地塊已使用，請先拆除；住宅、商業與工業會自行成長。'):'沒有可變更的地塊。請選擇太空站平台。'};
 if(s.cash<cost)return {ok:false,error:`資金不足：需要 ${cost.toLocaleString()}，目前可用 ${Math.floor(s.cash).toLocaleString()}。`};
 for(const {i,after} of changes)s.cells[i]=after;s.cash-=cost;cleanTransit(s);if(tool==='bulldoze'){s.continuum.lines=s.continuum.lines.filter(l=>s.cells[l.anchor].type==='line');for(const key of Object.keys(s.continuum.gardens))if(s.cells[key]?.type!=='park')delete s.continuum.gardens[key];for(const key of Object.keys(s.continuum.parkMonths))if(s.cells[key]?.type!=='park')delete s.continuum.parkMonths[key];for(const key of Object.keys(s.continuum.quests))if(s.cells[key]?.type!=='sail')delete s.continuum.quests[key];}
 return {ok:true,cost,count:changes.length,month:s.month,changes,transitBefore,transitAfter:structuredClone(s.transit),continuumBefore,continuumAfter:structuredClone(s.continuum)};
}

export function buildStation(s,i,{reconnect=false}={}){
 const plan=previewStation(s,i,{restore:reconnect});if(!plan.ok)return plan;
 if(reconnect&&!plan.links.length)return {ok:false,error:'沒有可恢復的連線，請增設較近的中繼車站。'};
 if(s.cash<plan.cost)return {ok:false,error:`車站與自動軌道合計需要 ${plan.cost} 信用點。`};
 const transitBefore=structuredClone(s.transit||createTransit()),before={...s.cells[i]},after=reconnect?{...before}:{...empty(),type:'station',level:1,wire:true,pipe:true,roadBase:isRoad(before.type)?before.type:null};
 s.cells[i]=after;s.transit??=createTransit();
 const ids=new Set(plan.links.map(l=>l.id));s.transit.blocked=s.transit.blocked.filter(id=>!ids.has(id));s.transit.links.push(...plan.links);s.cash-=plan.cost;
 return {ok:true,cost:plan.cost,count:1,month:s.month,changes:[{i,before,after}],warning:plan.warning,transitBefore,transitAfter:structuredClone(s.transit)};
}
export function removeMaglev(s,id){
 const line=s.transit?.links.find(l=>l.id===id);if(!line)return {ok:false,error:'這條連線已不存在。'};const cost=5;if(s.cash<cost)return {ok:false,error:'拆除連線需要 5 信用點。'};
 const transitBefore=structuredClone(s.transit);s.transit.links=s.transit.links.filter(l=>l.id!==id);s.transit.blocked.push(id);s.cash-=cost;
 return {ok:true,cost,count:1,month:s.month,changes:[],transitBefore,transitAfter:structuredClone(s.transit)};
}

export function undo(s,receipt){
 if(!receipt?.ok||receipt.month!==s.month)return {ok:false,error:'只能撤銷本月的建造；時間推進後需使用拆除。'};
 if(receipt.continuumAfter&&JSON.stringify(s.continuum)!==JSON.stringify(receipt.continuumAfter))return {ok:false,error:'巨構或探索進度已變更，無法撤銷。'};
 if(receipt.transitAfter&&JSON.stringify(s.transit)!==JSON.stringify(receipt.transitAfter))return {ok:false,error:'磁浮路網已變更，無法撤銷。'};
 if(receipt.changes.some(({i,after})=>JSON.stringify(s.cells[i])!==JSON.stringify(after)))return {ok:false,error:'地塊已變更，無法撤銷。'};
 for(const {i,before} of receipt.changes)s.cells[i]={...before};if(receipt.continuumBefore)s.continuum=structuredClone(receipt.continuumBefore);if(receipt.transitBefore)s.transit=structuredClone(receipt.transitBefore);s.cash+=receipt.cost;return {ok:true};
}
export function takeLoan(s){
 if(s.loans.length>=3)return {ok:false,error:'最多同時持有三筆債券。'};
 s.loans.push({balance:15000,principal:125,months:120});s.cash+=15000;s.insolvent=s.cash<=-20000;
 message(s,'發行 15,000 信用點債券：120 個月攤還，每月本金 125，另計餘額 0.4% 利息。','warn');return {ok:true};
}
export function emergency(s){if(s.cash<500)return {ok:false,error:'應變隊需要 500 信用點。'};if(!s.cells.some(c=>c.fire))return {ok:false,error:'目前沒有火災。'};s.cash-=500;s.emergency=3;message(s,'應變隊已出發，接下來三個月協助全站滅火。','good');return {ok:true};}
function damageTile(s,i,conduits=false){
 const members=LANDMARK_TYPES.includes(s.cells[i].type)||s.cells[i].type==='line'||s.cells[i].type==='park'?plotMembers(s,i):[i];const anchor=plotAnchor(s,i);clearPlot(s,i);ensureContinuum(s).lines=s.continuum.lines.filter(l=>l.anchor!==anchor);delete s.continuum.gardens[anchor];delete s.continuum.quests[anchor];for(const j of members)delete s.continuum.parkMonths[j];
 for(const j of members)if(s.cells[j].type)Object.assign(s.cells[j],{...branchDefaults(),type:'rubble',level:0,pop:0,fire:0,roadBase:null,...(conduits?{wire:false,pipe:false}:{})});
}
export function triggerDisaster(s,kind='fire'){
 const occupied=s.cells.map((c,i)=>({c,i})).filter(({c})=>building(c.type));if(!occupied.length)return {ok:false,error:'目前沒有建築。'};
 const {i}=occupied[Math.floor(random(s)*occupied.length)];
 if(kind==='meteor'){around(i,1,j=>damageTile(s,j,true));message(s,'微隕石擊中平台，局部建築與管線受損。','bad');}
 else{s.cells[i].fire=5;message(s,'已啟動火災演習；這次演習會實際影響建築。','warn');}return {ok:true};
}
export function explain(s,a,i){
 i=plotAnchor(s,i);const c=s.cells[i],t=c.type;if(!t)return ['空地：可建造設施或劃設分區。'];
 if(t==='rubble')return [c.retiredPlant?`到期停機殘骸：原為${TYPES[c.retiredPlant].name}，目前不供電、不提供職位，也不收取電廠維護費。${renewalEnabled(s,c)?'已安排自動更新，資金足夠時於下個月重建。':'可在電廠更新面板重建，或拆除。'}`:'受損地塊：先拆除，再重建。'];
 if(isTransport(t))return [`承載率 ${Math.round(a.traffic[i]/Math.max(1,a.roadCapacity[i])*100)}%（${Math.round(a.traffic[i])} / ${Math.round(a.roadCapacity[i])}）`,t==='rail'?'磁浮軌道須透過車站銜接道路，才會納入通勤。':'道路施工費包含地下水管與電力線。'];
 const reasons=[];if(t==='station'){const lines=a.maglev.lines.filter(l=>l.a===i||l.b===i);reasons.push(lines.length?`自動磁浮連線 ${lines.length} 條 · 本月通勤 ${Math.round(lines.reduce((n,l)=>n+l.riders,0))} 人次。${c.roadBase?'下方原道路繼續通行。':''}`:'暫無磁浮連線；再放置一座 140 格內的車站即可自動連接。');}
 if(t==='airport')reasons.push('舊版客運港保留職位；暫停新建，等待旅遊與客運訂單系統。');if(!isEnabled(c))reasons.push('已暫停營運：仍支付 15% 基本維護，可從建築管理恢復。');if(a.space.oxygen[i]<.95)reasons.push('所在管網氧氣不足，請接通水循環廠或生命維持中心。');if(a.space.cooling[i]<.95)reasons.push('所在電網散熱不足，請建造散熱控制站。');if(c.fire)reasons.push('正在燃燒：消防覆蓋或應變隊可控制火勢。');
 if(!a.access[i].length)reasons.push(['power','solar','water'].includes(t)?'設施職位缺少道路連接；發電與供水仍依管線、預算與電力運作。':'分區需要沿連續地塊，在道路三格內；公共設施需有可達入口。');
 if(a.power.coverage[i]<.95)reasons.push(a.power.coverage[i]===0?'沒有接入運作中的電網。':'所在電網容量不足，正在限電。');
 if(!['power','solar','water'].includes(t)&&a.water.coverage[i]<.95)reasons.push(a.water.coverage[i]===0?'沒有接入供水網；水廠也需要電力。':'所在水網容量不足。');
 if(zoneOf(t)==='I'&&!a.freight[i])reasons.push('無法沿交通網抵達貨運船塢。');
 if(residential(t)&&c.pop>0){const workers=Math.floor(c.pop*.48);if(workers&&a.employed[i]<workers)reasons.push(`${workers-a.employed[i]} 位居民找不到可達的工作。`);}
 if(zoneOf(t)&&a.stats.demand[zoneOf(t)]<=0)reasons.push('目前同類分區供給充足，需求偏低。');
 if(a.pollution[i]>30)reasons.push('工業污染偏高，影響地價與居住品質。');
 if(isPowerPlant(c))reasons.push(`剩餘使用年限 ${Math.max(0,600-c.age)} 個月；${renewalEnabled(s,c)?'自動更新已開啟':'到期不更新，將變為殘骸'}。`);
 if(!reasons.length)reasons.push(c.level===0?'條件已滿足，等待私人開發。':'運作正常。城市需求與地價會影響後續發展。');
 return reasons;
}
function buildLandmark(s,i,type){
 if(!Number.isInteger(i)||!terrain(i))return {ok:false,error:'請選擇平台。'};
 const ids=square(i,5),def=TYPES[type];if(ids.length!==25||ids.some(j=>!terrain(j)||s.cells[j].type||s.orbital.projects.arch.built&&GATE_FOOTINGS.includes(j)||s.artSample&&reservedSample(j)))return {ok:false,error:'地標需要完整 5 × 5 空地；請移開或拆除既有建築。'};
 if(s.cash<def.cost)return {ok:false,error:`地標需要 ${def.cost} 信用點。`};
 const changes=ids.map(j=>({i:j,before:{...s.cells[j]},after:{...empty(),type,level:1,plot:i,span:5,subplot:j!==i,wire:true,pipe:true}}));
 for(const v of changes)s.cells[v.i]=v.after;s.cash-=def.cost;return {ok:true,cost:def.cost,count:25,month:s.month,changes};
}
export function serialize(s,{compact=false}={}){return JSON.stringify({...s,encoding:compact?'tiles-v5':undefined,cells:s.cells.map(c=>!c.type&&!c.wire&&!c.pipe&&!c.pop&&!c.age&&!c.fire?null:compact?[c.type,c.level,c.pop,c.age,c.wire?1:0,c.pipe?1:0,c.fire,c.renewal,c.retiredPlant,c.enabled?1:0,c.upgrade,c.preserve?1:0,c.plot??null,c.span||1,c.roadBase||null,BRANCH_FIELDS.map(k=>c[k]??branchDefaults()[k])]:c)});}
export function manageBuilding(s,i,action){
 i=plotAnchor(s,i);const c=s.cells[i],d=TYPES[c?.type],members=plotMembers(s,i);
 if(!d||['network','damage'].includes(d.group))return {ok:false,error:'請選擇可管理的建築或設施。'};
 if(action==='preserve'){const preserve=!c.preserve;for(const j of members)s.cells[j].preserve=preserve;return {ok:true};}
 if(action==='evolve'){const a=analyze(s),e=evolutionStatus(s,a,i);if(!e||!e.ready)return {ok:false,error:e?.max?'已達第八階。':e?.checks.filter(x=>!x.ok).map(x=>x.label).join('；')||'此設施沒有分區進化。'};const stock=s.orbital.stock[deckOf(i)];s.cash-=e.cost;stock.alloy-=e.alloy;stock.parts-=e.parts;advancePlot(s,i,e.branch);message(s,`${stageName(c)}完工，投資 ${e.cost} 信用點。`,'good');return {ok:true,cost:e.cost};}
 if(action==='toggle'){
  if(isTransport(c.type))return {ok:false,error:'道路與軌道以拆除或升級管理，不能停用。'};
  const enabled=!isEnabled(c);for(const j of members)s.cells[j].enabled=enabled;message(s,`${d.name}已${enabled?'恢復營運':'暫停營運'}。`);return {ok:true};
 }
 if(action!=='upgrade'||isTransport(c.type)||!c.level||(c.upgrade||0)>=2)return {ok:false,error:'此設施目前無法再升級。'};
 const cost=Math.max(100,Math.round(d.cost*.6*((c.upgrade||0)+1)))*(LANDMARK_TYPES.includes(c.type)||c.type==='line'?1:members.length);
 if(s.cash<cost)return {ok:false,error:`升級需要 ${cost} 信用點。`};
 s.cash-=cost;for(const j of members)s.cells[j].upgrade++;message(s,`${d.name}完成設備升級 ${c.upgrade}，支出 ${cost}。`,'good');return {ok:true,cost};
}
export function buildingReport(s,a,i){
 i=plotAnchor(s,i);const c=s.cells[i],d=TYPES[c?.type],members=plotMembers(s,i);if(!d)return null;
 let upkeep=0,revenue=0,pop=0,capacityTotal=0,jobs=0,filled=0,operational=1,employed=0;
 for(const j of members){const v=s.cells[j];if(v.subplot)continue;upkeep+=(v.type==='line'?lineMaintenance(v)*(isEnabled(v)?1:.18):0)+stageUpkeep(v)+(d.upkeep||0)*facilityUpkeep(v)*scale(s,v.type)*(1+(v.upgrade||0)*.2)*(isEnabled(v)?1:.15);pop+=v.pop;capacityTotal+=capacity(v);jobs+=a.jobs[j];filled+=a.filled[j];employed+=a.employed[j];operational=Math.min(operational,a.operational[j]);
 if(residential(v.type))revenue+=v.pop*s.tax.R/100*5*(.45+.55*a.employed[j]/Math.max(1,Math.floor(v.pop*.48)))*(1+(a.branchHome?.[j]||0));
 if(zoneOf(v.type)==='C')revenue+=a.filled[j]*s.tax.C/100*16*(districtCore(v)?.trade||1)*branchEffects(v).trade*(1+(a.branchTrade?.[j]||0));
 if(zoneOf(v.type)==='I')revenue+=a.filled[j]*s.tax.I/100*14*(a.freight[j]?1:.4);if(v.type==='line')revenue+=a.filled[j]*.72*(isEnabled(v)?1:0);}
 return {branch:branchZone(c)?branchProgress(s,a,i):null,name:d.name,upkeep,revenue,pop,capacity:capacityTotal,jobs,filled,employed,operational,area:members.length,span:c.span||1,core:districtCore(c),interior:c.level&&!c.fire?INTERIORS[c.type]:null,upgradeCost:Math.max(100,Math.round(d.cost*.6*((c.upgrade||0)+1)))*(LANDMARK_TYPES.includes(c.type)||c.type==='line'?1:members.length)};
}
export function deserialize(text){
 if(typeof text!=='string'||text.length>12000000)throw new Error('存檔過大或格式錯誤。');
 const raw=JSON.parse(text);const legacy=raw?.version===2,oldArm=raw?.version===3;
 if(!raw||!Array.isArray(raw.cells)||!([VERSION,8,7,6,5,4,3,2].includes(raw.version))||raw.cells.length!==(legacy?56*56:oldArm?536*56:N))throw new Error('不支援這個存檔版本或地圖大小。');
 if(legacy){const migrated=Array(N).fill(null);raw.cells.forEach((c,i)=>{const x=i%56,y=Math.floor(i/56);if((x<8||x>47||y<8||y>43)&&c&&(c.type||c.wire||c.pipe))throw new Error('舊版地塊位置不合法。');migrated[idx(x,y)]=c;});raw.cells=migrated;}
 if(oldArm)raw.cells=raw.cells.concat(Array(N-raw.cells.length).fill(null));
 const number=(v,lo,hi,integer=false)=>typeof v==='number'&&Number.isFinite(v)&&v>=lo&&v<=hi&&(!integer||Number.isInteger(v));
 if(!number(raw.cash,-1e9,1e12)||!number(raw.month,0,1e7,true)||!number(raw.rng,0,4294967295,true))throw new Error('存檔中的時間或財務資料不正確。');
 const s=createCity({starter:false});s.orbital=restoreOrbital(raw.orbital);
 const decodeBranch=values=>{if(!Array.isArray(values)||values.length!==8)throw new Error('分支存檔資料損毀。');return Object.fromEntries(BRANCH_FIELDS.map((k,j)=>[k,values[j]]));};
 s.cells=raw.cells.map((c,i)=>{
  if(c===null)return empty();
  if(['tiles-v1','tiles-v2','tiles-v3','tiles-v4','tiles-v5'].includes(raw.encoding)){if(!Array.isArray(c)||c.length!==({ 'tiles-v1':11,'tiles-v2':12,'tiles-v3':14,'tiles-v4':15,'tiles-v5':16 }[raw.encoding])||![0,1].includes(c[4])||![0,1].includes(c[5])||![0,1].includes(c[9])||(raw.encoding!=='tiles-v1'&&![0,1].includes(c[11])))throw new Error('壓縮地塊資料損毀。');c={type:c[0],level:c[1],pop:c[2],age:c[3],wire:!!c[4],pipe:!!c[5],fire:c[6],renewal:c[7],retiredPlant:c[8],enabled:!!c[9],upgrade:c[10],preserve:raw.encoding!=='tiles-v1'?c[11]===1:false,plot:['tiles-v3','tiles-v4','tiles-v5'].includes(raw.encoding)?c[12]:null,span:['tiles-v3','tiles-v4','tiles-v5'].includes(raw.encoding)?c[13]:1,roadBase:['tiles-v4','tiles-v5'].includes(raw.encoding)?c[14]:null,...(raw.encoding==='tiles-v5'?decodeBranch(c[15]):{})};}
  if(!c||c.type!==null&&!Object.hasOwn(TYPES,c.type)||c.type&&['network'].includes(TYPES[c.type].group)||!number(c.level,0,raw.version<5?3:8,true)||!number(c.pop,0,c.type==='line'?20000:2250,true)||!number(c.age,0,1e8,true)||!number(c.fire,0,20,true)||typeof c.wire!=='boolean'||typeof c.pipe!=='boolean')throw new Error('地塊資料損毀。');
  if(raw.version<5&&evolvable(c))c={...c,level:[0,1,3,5][c.level]};
  if(c.roadBase!==undefined&&c.roadBase!==null&&(!['road','avenue'].includes(c.roadBase)||c.type!=='station'))throw new Error('車站下方道路資料損毀。');
  c={...c,lineSegments:c.type==='line'?(raw.continuum?.lines?.find(l=>l.anchor===c.plot)?.segments||4):undefined,plot:c.plot??null,span:c.span??1,subplot:(LANDMARK_TYPES.includes(c.type)||c.type==='line')&&c.plot!==null&&c.plot!==i};
  const b={...branchDefaults(),...Object.fromEntries(BRANCH_FIELDS.filter(k=>c[k]!==undefined).map(k=>[k,c[k]]))},z=branchZone(c);
  if([b.branch,b.branchCandidate].some(v=>v!==null&&(!z||!Object.hasOwn(BRANCHES[z],v)))||b.branch!==null&&c.level<5||typeof b.vacant!=='boolean'||b.vacant&&(c.level>4||b.branch!==null)||['branchMonths','branchStress','growthMonths','branchCooldown','residentReserve'].some(k=>!number(b[k],0,k==='residentReserve'?2250:1e7,true))||b.residentReserve>0&&!residential(c.type))throw new Error('建築分支資料損毀。');
  c={...c,...b};
  if(c.preserve!==undefined&&typeof c.preserve!=='boolean')throw new Error('建築保留設定不正確。');
  if(!terrain(i)&&(c.type||c.wire||c.pipe)||c.pop>0&&!residential(c.type)||c.pop>capacity(c))throw new Error('建築人口或位置不合法。');
  if(c.enabled!==undefined&&typeof c.enabled!=='boolean'||c.upgrade!==undefined&&!number(c.upgrade,0,2,true))throw new Error('建築管理設定不正確。');
  const enabled=c.enabled??true,upgrade=c.upgrade??0;
  const renewal=c.renewal??'inherit',retiredPlant=c.retiredPlant??null;
  if(!['inherit','on','off'].includes(renewal)||retiredPlant!==null&&(!['power','solar'].includes(retiredPlant)||c.type!=='rubble'))throw new Error('電廠更新設定不正確。');
  // Legacy expired plants must never look operational after loading.
  if(isPowerPlant(c)&&c.age>=600)return {type:'rubble',level:Math.max(1,c.level),pop:0,age:c.age,wire:c.wire,pipe:c.pipe,fire:0,renewal,retiredPlant:c.type,enabled,upgrade,preserve:false,plot:null,span:1,subplot:false};
  return {...b,type:c.type,level:c.level,pop:c.pop,age:c.age,wire:c.wire,pipe:c.pipe,fire:c.fire,renewal,retiredPlant,enabled,upgrade,preserve:c.preserve??false,plot:c.plot,span:c.span,subplot:c.subplot,roadBase:c.roadBase||null,...(c.type==='line'?{lineSegments:c.lineSegments}:{})};
 });
 restoreContinuum(s,raw.continuum);validatePlots(s);s.transit=restoreTransit(raw.transit,s.cells);
 if(raw.autoDevelopment!==undefined&&typeof raw.autoDevelopment!=='boolean')throw new Error('自動發展設定不正確。');s.autoDevelopment=raw.autoDevelopment??true;
 s.artSample=raw.artSample===true;s.cells.atelier=s.artSample;
 for(const k of ['cash','month','rng'])s[k]=raw[k];
 if(raw.powerRenewal!==undefined&&typeof raw.powerRenewal!=='boolean')throw new Error('全城電廠設定不正確。');
 s.spaceIncident=number(raw.spaceIncident,0,s.month,true)?raw.spaceIncident:null;
 s.powerRenewal=raw.powerRenewal??true;
 if(raw.powerIncident!==undefined&&raw.powerIncident!==null&&!number(raw.powerIncident,0,s.month,true))throw new Error('電廠事件不正確。');
 s.powerIncident=raw.powerIncident??null;
 if(raw.lastRenewal!==undefined&&(!raw.lastRenewal||!number(raw.lastRenewal.month,0,s.month,true)||!number(raw.lastRenewal.cost,0,1e12)))throw new Error('更新支出不正確。');
 s.lastRenewal=raw.lastRenewal??{month:s.month,cost:0};
 for(const k of ['education','health']){if(!number(raw[k],0,100))throw new Error('城市指標不正確。');s[k]=raw[k];}
 for(const k of Object.keys(s.tax)){if(!number(raw.tax?.[k],0,25))throw new Error('稅率不正確。');s.tax[k]=raw.tax[k];}
 for(const k of Object.keys(s.funding)){if(!number(raw.funding?.[k],0,150))throw new Error('預算不正確。');s.funding[k]=raw.funding[k];}
 for(const k of Object.keys(s.policies)){if(typeof raw.policies?.[k]!=='boolean')throw new Error('法令不正確。');s.policies[k]=raw.policies[k];}
 if(!Array.isArray(raw.loans)||raw.loans.length>3)throw new Error('債券資料不正確。');
 s.loans=raw.loans.map(l=>{if(!l||!number(l.balance,.001,15000)||l.principal!==125||!number(l.months,1,120,true)||Math.abs(l.balance-l.months*125)>.01)throw new Error('債券餘額不正確。');return {balance:l.balance,principal:125,months:l.months};});
 if(typeof raw.disasters!=='boolean'||!number(raw.emergency,0,3,true)||!number(raw.highPopulation,0,1e7,true))throw new Error('城市狀態不正確。');
 s.disasters=raw.disasters;s.emergency=raw.emergency;s.highPopulation=Math.max(raw.highPopulation,s.cells.reduce((a,c)=>a+c.pop,0));s.insolvent=s.cash<=-20000;
 s.unlocks=[400,800,2000].filter(n=>s.highPopulation>=n);
 s.history=Array.isArray(raw.history)?raw.history.slice(-240).filter(h=>h&&['month','population','cash','net','happiness','unemployment'].every(k=>Number.isFinite(h[k]))).map(h=>Object.fromEntries(['month','population','cash','net','happiness','unemployment'].map(k=>[k,h[k]]))):[];
 s.events=Array.isArray(raw.events)?raw.events.slice(0,45).filter(e=>e&&typeof e.text==='string'&&number(e.month,0,1e7,true)).map(e=>({month:e.month,text:e.text.slice(0,250),tone:['good','bad','warn','info'].includes(e.tone)?e.tone:'info'})):[];
 if(raw.version<8)initializeBranches(s,analyze(s));
 return s;
}
