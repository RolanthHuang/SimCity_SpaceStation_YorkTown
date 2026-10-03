import {TYPES,SIZE,HEIGHT,idx,xy,wrapX,deltaX,terrain,deckOf,isRoad,isEnabled,buildingCapacity} from './catalog.mjs';
import {branchDefaults} from './branches.mjs';
import {createQuest} from './structure/interior-plan.mjs';
import {GATE_FOOTINGS} from './orbital.mjs';

export const LINE={metresPerTile:20,width:4,segment:2,min:4,initialMax:8,max:16,height:120,baseCost:5000,segmentCost:6000};
export const emptyContinuum=()=>({lines:[],gardens:{},parkMonths:{},quests:{},assistant:null,nextLine:1});
export function ensureContinuum(s){return s.continuum??=emptyContinuum();}
export const lineAt=(s,i)=>s.continuum?.lines.find(l=>l.cells.includes(i));
export const lineJobs=c=>c.type==='line'&&!c.subplot?(c.lineSegments||4)*40*(1+.3*(c.level-1))*(1+(c.upgrade||0)*.25):0;
export const lineMaintenance=c=>(40+(c.lineSegments||4)*55*(1+.4*(c.level-1)))*(1+(c.upgrade||0)*.2);
export function lineDimensions(l){return l.axis==='x'?{w:l.segments*2,h:4}:{w:4,h:l.segments*2};}
export function lineStops(s,l){const [x,y]=xy(l.anchor),across=[0,1,2,3];return [-1,l.segments*2].map(along=>across.map(cross=>l.axis==='x'?idx(wrapX(x+along),y+cross):idx(wrapX(x+cross),y+along)).filter(i=>terrain(i)&&isRoad(s.cells[i]?.type)));}
export function attachLineTransit(s,operational,graph){
 const lines=[];graph.transfers??=new Map();graph.railEdges??=new Map();
 for(const l of s.continuum?.lines||[]){const stops=lineStops(s,l),active=operational[l.anchor]>.95&&s.funding.transport>=50,capacity=l.segments*120,line={id:`line-${l.id}`,anchor:l.anchor,capacity,riders:0,active,stops};lines.push(line);if(!active)continue;
  for(const u of stops[0])for(const v of stops[1]){const cost=Math.max(1.3,l.segments*.32);for(const [a,b]of [[u,v],[v,u]]){if(!graph[a].includes(b))graph[a].push(b);graph.transfers.set(`${a}:${b}`,cost);graph.railEdges.set(`${a}:${b}`,line);}}
 }
 return lines;
}
export function lineCells(anchor,axis,segments){
 const [x,y]=xy(anchor),w=axis==='x'?segments*LINE.segment:LINE.width,h=axis==='x'?LINE.width:segments*LINE.segment;
 if(y+h>HEIGHT)return [];
 return Array.from({length:w*h},(_,k)=>idx(wrapX(x+k%w),y+Math.floor(k/w)));
}
export function lineDrag(a,b){
 const [x,y]=xy(a),[bx,by]=xy(b),dx=deltaX(x,bx),dy=by-y,axis=Math.abs(dx)>=Math.abs(dy)?'x':'y';
 const segments=Math.max(LINE.min,Math.min(LINE.initialMax,Math.ceil((Math.abs(axis==='x'?dx:dy)+1)/LINE.segment)));
 const anchor=idx(wrapX(axis==='x'&&dx<0?x-(segments*2-1):x),axis==='y'&&dy<0?y-(segments*2-1):y);
 return {anchor,axis,segments,cells:lineCells(anchor,axis,segments)};
}
export function lineFromSelection(ids){
 if(!ids.length)return null;const [x,y]=xy(ids[0]);let maxX=0,maxY=0;
 for(const i of ids){const [u,v]=xy(i);maxX=Math.max(maxX,deltaX(x,u));maxY=Math.max(maxY,v-y);}
 const axis=maxX>=maxY?'x':'y',segments=(axis==='x'?maxX+1:maxY+1)/2;
 if(!Number.isInteger(segments)||segments<LINE.min||segments>LINE.initialMax)return null;
 return {anchor:ids[0],axis,segments,cells:lineCells(ids[0],axis,segments)};
}
export function previewLine(s,ids,{extend=null}={}){
 if(s.highPopulation<TYPES.line.unlock)return {ok:false,error:`人口達 ${TYPES.line.unlock} 才能建造天際長廊。`};
 const old=extend===null?null:lineAt(s,extend);
 if(extend!==null&&!old)return {ok:false,error:'請選取既有的天際長廊。'};
 const l=old?{...old,segments:old.segments+1,cells:lineCells(old.anchor,old.axis,old.segments+1)}:lineFromSelection(ids);
 if(!l||l.segments>LINE.max)return {ok:false,error:'拖曳 160～320 公尺的起始長度；後續可逐段延長至 640 公尺。'};
 const existing=new Set(old?.cells||[]),fresh=l.cells.filter(i=>!existing.has(i));
 if(l.cells.length!==l.segments*2*LINE.width||l.cells.some(i=>!terrain(i)||deckOf(i)!==deckOf(l.anchor))||fresh.some(i=>s.cells[i].type||s.cells[i].preserve||s.orbital.projects.arch.built&&GATE_FOOTINGS.includes(i)))return {ok:false,error:'天際長廊需要寬 4 格的完整空地，不能穿過道路、建築或保留地。'};
 const roads=[...new Set(l.cells.flatMap(i=>{const [x,y]=xy(i);return [idx(wrapX(x-1),y),idx(wrapX(x+1),y),i-SIZE,i+SIZE];}).filter(i=>terrain(i)&&isRoad(s.cells[i]?.type)))];
 const cost=old?LINE.segmentCost:LINE.baseCost+l.segments*LINE.segmentCost;
 return {ok:true,...l,cost,fresh,roads,extension:!!old,old,warning:roads.length?'':'尚未連道路；長廊會等待外部道路、水電與維生供應才迎接居民。'};
}
export function constructLine(s,plan){
 if(!plan.ok)return plan;if(s.cash<plan.cost)return {ok:false,error:`需要 ${plan.cost} 信用點。`};
 const meta=ensureContinuum(s),before=structuredClone(meta),root=s.cells[plan.anchor],changes=[];
 const l=plan.extension?meta.lines.find(x=>x.id===plan.old.id):{id:meta.nextLine++,anchor:plan.anchor,axis:plan.axis,segments:plan.segments,cells:plan.cells,built:s.month};
 if(!plan.extension)meta.lines.push(l);Object.assign(l,{segments:plan.segments,cells:plan.cells});
 for(const i of plan.cells){const previous={...s.cells[i]},next=plan.extension&&previous.type==='line'?{...previous}:{...branchDefaults(),type:'line',level:1,pop:0,age:0,wire:true,pipe:true,fire:0,renewal:'inherit',retiredPlant:null,enabled:true,upgrade:0,preserve:false,roadBase:null};Object.assign(next,{plot:l.anchor,span:1,subplot:i!==l.anchor,lineSegments:l.segments});if(plan.extension)Object.assign(next,{level:root.level,enabled:root.enabled,upgrade:root.upgrade,preserve:root.preserve});s.cells[i]=next;changes.push({i,before:previous,after:{...next}});}
 s.cash-=plan.cost;return {ok:true,count:plan.fresh.length,cost:plan.cost,month:s.month,changes,continuumBefore:before,continuumAfter:structuredClone(meta),warning:plan.warning};
}
export function continuumIncome(s,a){
 let income=0,upkeep=0;for(let i=0;i<s.cells.length;i++){const c=s.cells[i];if(c.subplot)continue;
  if(c.type==='line'){upkeep+=lineMaintenance(c)*(isEnabled(c)?1:.18);income+=(a.filled[i]||0)*.72*(isEnabled(c)?1:0);}
  if(c.type==='shell'&&isEnabled(c))income+=Math.min(180,a.stats.population*.028)*(a.operational[i]||0);
 }
 for(const [key,g]of Object.entries(s.continuum?.gardens||{}))if(s.cells[Number(key)]?.type==='park')upkeep+=(g.stage===3?160:70)-g.span*g.span*3;
 return {income,upkeep};
}
export function applyContinuumAuras(s,operational,parks,around){
 for(let i=0;i<s.cells.length;i++){const c=s.cells[i];if(c.subplot||!isEnabled(c)||c.fire)continue;
  if(c.type==='sail'||c.type==='shell')around(i,c.type==='sail'?8:12,(j,d)=>parks[j]+=(c.type==='sail'?10:18)*(1-d/(c.type==='sail'?9:13))*(operational[i]||0));
 }
 for(const [id,g]of Object.entries(s.continuum?.gardens||{})){const i=Number(id);if(s.cells[i]?.type!=='park')continue;const [x,y]=xy(i),center=idx(wrapX(x+Math.floor(g.span/2)),y+Math.floor(g.span/2));around(center,g.stage===3?8:6,(j,d)=>parks[j]+=(g.stage===3?18:10)*g.health*(1-d/(g.stage===3?9:7))*(operational[i]||0));}
}
export function tickGardens(s,a,f,notify){
 if(!s.autoDevelopment)return;const meta=ensureContinuum(s);let changed=false;
 for(const [key,g]of Object.entries(meta.gardens)){
  const i=Number(key);if(s.cells[i]?.type!=='park'){delete meta.gardens[key];changed=true;continue;}
  const good=g.cells.every(j=>a.power.coverage[j]>.95&&a.water.coverage[j]>.95&&a.pollution[j]<35);
  const health=g.health;g.health=Math.max(.20,Math.min(1,g.health+(good?.025:-.06)));changed||=g.health!==health;g.stress=good?0:g.stress+1;g.stable=good?g.stable+1:0;
  if(g.stress>=6&&g.stage===3){g.stage=2;g.stress=0;changed=true;notify('環帶花園因供應不足縮減為水庭，保留既有步道。','warn');}
 }
 if(s.month%3!==0)return changed;
 for(const size of [3,2])for(let i=0;i<s.cells.length;i++){
  const c=s.cells[i];if(c.type!=='park'||c.plot!==null&&c.plot!==i||c.preserve)continue;
  const current=meta.gardens[i];if(current?.stage===3||size===2&&current)continue;
  const [x,y]=xy(i);if(y+size>HEIGHT)continue;
  const cells=Array.from({length:size*size},(_,k)=>idx(wrapX(x+k%size),y+Math.floor(k/size))),set=new Set(cells);
  if(cells.some(j=>!terrain(j)||s.cells[j].type!=='park'||s.cells[j].preserve||s.cells[j].enabled===false||s.cells[j].fire||s.cells[j].plot!==null&&!set.has(s.cells[j].plot))||Object.values(meta.gardens).some(g=>g.cells.some(j=>set.has(j))&&!g.cells.every(j=>set.has(j))))continue;
  const good=cells.every(j=>a.power.coverage[j]>.95&&a.water.coverage[j]>.95&&a.pollution[j]<35&&a.landValue[j]>=45);
  const stable=current?.stable??Math.min(...cells.map(j=>meta.parkMonths[j]||0));
  if(!good||a.stats.population<(size===3?800:250)||stable<(size===3?18:12))continue;
  const cost=size===3?9200:2600,monthly=size===3?160:70,extra=monthly-(current?70:cells.length*3);
  if(f.net<extra||s.cash<cost+Math.max(6000,(f.cost+extra)*6))continue;
  for(const [id,g]of Object.entries(meta.gardens))if(g.cells.every(j=>set.has(j)))delete meta.gardens[id];
  for(const j of cells)Object.assign(s.cells[j],{plot:i,span:size,level:1});meta.gardens[i]={stage:size,span:size,cells,health:1,stable:0,stress:0};s.cash-=cost;notify(`${size} × ${size} ${size===3?'環帶樹冠花園':'晨光水庭'}完成，投資 ${cost}，月維護 ${monthly}。`,'good');return true;
 }
 return changed;
}
export function tickGardenMonths(s,a){const months=ensureContinuum(s).parkMonths??={};for(const key of Object.keys(months))if(s.cells[key]?.type!=='park')delete months[key];for(let i=0;i<s.cells.length;i++){const c=s.cells[i];if(c.type==='park')months[i]=a.power.coverage[i]>.95&&a.water.coverage[i]>.95&&a.pollution[i]<35&&a.landValue[i]>=45?(months[i]||0)+1:0;}}
export function questFor(s,i){return ensureContinuum(s).quests[i]??=createQuest();}
export function restoreContinuum(s,raw){
 const meta=emptyContinuum();if(raw===undefined){s.continuum=meta;return;}
 if(!raw||!Array.isArray(raw.lines)||raw.lines.length>100)throw new Error('長廊存檔資料損毀。');
 const occupied=new Set(),ids=new Set();for(const l of raw.lines){
  if(!l||!Number.isInteger(l.id)||l.id<1||ids.has(l.id)||!Number.isInteger(l.anchor)||!['x','y'].includes(l.axis)||!Number.isInteger(l.segments)||l.segments<LINE.min||l.segments>LINE.max)throw new Error('長廊尺寸資料損毀。');
  const cells=lineCells(l.anchor,l.axis,l.segments);if(cells.length!==l.segments*8||cells.some(i=>!terrain(i)||occupied.has(i)||s.cells[i].type!=='line'||s.cells[i].plot!==l.anchor||s.cells[i].level!==s.cells[l.anchor].level||s.cells[i].enabled!==s.cells[l.anchor].enabled))throw new Error('長廊地基不完整。');
  cells.forEach(i=>{occupied.add(i);Object.assign(s.cells[i],{subplot:i!==l.anchor,lineSegments:l.segments});});ids.add(l.id);meta.lines.push({id:l.id,anchor:l.anchor,axis:l.axis,segments:l.segments,cells,built:Number.isInteger(l.built)?l.built:0});
 }
 if(s.cells.some((c,i)=>c.type==='line'&&!occupied.has(i)))throw new Error('找不到長廊地基。');
 meta.nextLine=Math.max(1,...meta.lines.map(l=>l.id+1));
 if(raw.parkMonths){for(const [key,value]of Object.entries(raw.parkMonths)){const i=Number(key);if(!Number.isInteger(i)||s.cells[i]?.type!=='park'||!Number.isInteger(value)||value<0||value>1e7)throw new Error('花園穩定月份資料損毀。');meta.parkMonths[i]=value;}}
 if(raw.gardens){for(const [key,g]of Object.entries(raw.gardens)){const i=Number(key),c=s.cells[i];if(!c||c.type!=='park'||c.plot!==i||![2,3].includes(g.stage)||![2,3].includes(g.span)||g.stage>g.span||c.span!==g.span||!Number.isFinite(g.health)||g.health<0||g.health>1||!Number.isInteger(g.stable)||g.stable<0||!Number.isInteger(g.stress)||g.stress<0)throw new Error('花園進化資料損毀。');const [x,y]=xy(i),cells=Array.from({length:g.span*g.span},(_,k)=>idx(wrapX(x+k%g.span),y+Math.floor(k/g.span)));meta.gardens[i]={stage:g.stage,span:g.span,cells,health:g.health,stable:g.stable,stress:g.stress};}}
 if(s.cells.some(c=>c.type==='park'&&c.span>1&&!meta.gardens[c.plot]))throw new Error('找不到進化花園資料。');
 if(raw.quests){for(const [key,q]of Object.entries(raw.quests)){const i=Number(key);if(s.cells[i]?.type!=='sail')continue;if(!q||['archive','power','stars','complete'].some(k=>typeof q[k]!=='boolean')||q.complete&&!q.stars||q.stars&&!q.power||q.power&&!q.archive||!Array.isArray(q.rings)||q.rings.length!==3||q.rings.some(v=>!Number.isInteger(v)||v<0||v>5)||!Array.isArray(q.route)||q.route.length>3||q.route.some(v=>!['cool','store','drive'].includes(v)))throw new Error('秘庫進度資料損毀。');meta.quests[i]={...createQuest(),...q,message:String(q.message||'').slice(0,250)};}}
 meta.assistant=raw.assistant??null;s.continuum=meta;
}

export function buildingDoors(s,i){const c=s.cells[i],[x,y]=xy(i);if(c.type==='sail')return [{u:x+2-27.5,v:y+5.1-27.5}];if(c.type==='line'){const l=lineAt(s,i);if(!l)return [];return l.axis==='x'?[{u:x-1-27.5,v:y+1.5-27.5},{u:x+l.segments*2-27.5,v:y+1.5-27.5}]:[{u:x+1.5-27.5,v:y-1-27.5},{u:x+1.5-27.5,v:y+l.segments*2-27.5}];}return [{u:x-27.5,v:y-26.92}];}
