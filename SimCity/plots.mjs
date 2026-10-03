import {SIZE,HEIGHT,CELL_COUNT,TYPES,idx,xy,wrapX,terrain,isRoad,zoneOf} from './catalog.mjs';
import {branchZone} from './branches.mjs';
const street=c=>isRoad(c.type)||c.type==='station';
export const ZONE_TYPES=['r','R','c','C','i','I'];
export const FACILITIES=['power','solar','water','life','radiator','school','hospital','fire','police','fabricator'];
export const LANDMARK_TYPES=['aurelia','meridian','aurora','sail','shell'];
export const canFuse=c=>ZONE_TYPES.includes(c?.type)||FACILITIES.includes(c?.type);
export const plotAnchor=(s,i)=>Number.isInteger(s.cells[i]?.plot)?s.cells[i].plot:i;
export function square(anchor,size){const [x,y]=xy(anchor);if(y+size>HEIGHT)return [];return Array.from({length:size*size},(_,k)=>idx(wrapX(x+k%size),y+Math.floor(k/size)));}
export function plotMembers(s,i){const anchor=plotAnchor(s,i);if(s.cells[anchor]?.type==='line')return s.continuum?.lines.find(l=>l.anchor===anchor)?.cells||[anchor];const span=s.cells[anchor]?.span||1;return span>1?square(anchor,span):[anchor];}
export function roadAccess(cells){
 // Pedestrian access follows occupied zoning three lots deep. A service yard
 // may cross the same facility type, but cannot bridge unrelated buildings.
 const dist=new Int8Array(CELL_COUNT).fill(-1),owner=new Int32Array(CELL_COUNT).fill(-1),queue=[];
 for(let i=0;i<cells.length;i++)if(street(cells[i])){dist[i]=0;owner[i]=i;queue.push(i);}
 for(let p=0;p<queue.length;p++){
  const i=queue[p];if(dist[i]>=3)continue;const [x,y]=xy(i);
  for(const j of [idx(wrapX(x-1),y),idx(wrapX(x+1),y),y?i-SIZE:-1,y<HEIGHT-1?i+SIZE:-1]){
   if(j<0||!terrain(j)||dist[j]>=0)continue;
   const from=cells[i].type,to=cells[j].type;
   const valid=(isRoad(from)||from==='station')?ZONE_TYPES.includes(to)||FACILITIES.includes(to)||LANDMARK_TYPES.includes(to):ZONE_TYPES.includes(from)?ZONE_TYPES.includes(to):(FACILITIES.includes(from)||LANDMARK_TYPES.includes(from))&&to===from;
   if(!valid)continue;
   dist[j]=dist[i]+1;owner[j]=owner[i];queue.push(j);
  }
 }
 return {dist,owner};
}
export function clearPlot(s,i){for(const j of plotMembers(s,i)){s.cells[j].plot=null;s.cells[j].span=1;s.cells[j].subplot=false;}}
export function fuse(s,anchor,size){
 const ids=square(anchor,size),type=s.cells[anchor]?.type;if(ids.length!==size*size||!canFuse(s.cells[anchor])||ids.some(i=>!terrain(i)||s.cells[i].type!==type||s.cells[i].fire||s.cells[i].vacant||s.cells[i].enabled===false||s.cells[i].preserve))return false;
 const included=new Set(ids),root=s.cells[anchor];if(ids.some(i=>plotMembers(s,i).some(j=>!included.has(j))||(s.cells[i].upgrade||0)!==(root.upgrade||0)||['power','solar'].includes(type)&&s.cells[i].renewal!==root.renewal))return false;
 const zoned=!!branchZone(root),branched=zoned&&ids.some(i=>s.cells[i].level>=5);
 if(branched&&ids.some(i=>s.cells[i].level<5||s.cells[i].branch!==root.branch))return false;
 const level=(zoned?Math.min:Math.max)(...ids.map(i=>s.cells[i].level));if(level<1)return false;
 const sameCandidate=ids.every(i=>s.cells[i].branchCandidate===root.branchCandidate),candidate=sameCandidate?root.branchCandidate:null;
 const progress=zoned?{branch:branched?root.branch:null,branchCandidate:candidate,branchMonths:candidate?Math.min(...ids.map(i=>s.cells[i].branchMonths||0)):0,branchStress:Math.max(...ids.map(i=>s.cells[i].branchStress||0)),growthMonths:Math.min(...ids.map(i=>s.cells[i].growthMonths||0)),branchCooldown:Math.max(...ids.map(i=>s.cells[i].branchCooldown||0)),vacant:false}:{};
 const plantAge=['power','solar'].includes(type)?Math.max(...ids.map(i=>s.cells[i].age)):null;
 for(const i of ids){const c=s.cells[i],reserve=zoned&&type.toUpperCase()==='R'&&c.level>level?Math.max(c.pop,c.residentReserve||0):c.residentReserve||0;Object.assign(c,{plot:anchor,span:size,level,subplot:false,...progress,residentReserve:reserve,...(plantAge===null?{}:{age:plantAge})});}
 return true;
}
export function validatePlots(s){
 for(let i=0;i<s.cells.length;i++){const c=s.cells[i];if(c.type==='line')continue;if(c.plot===null||c.plot===undefined){if(c.span!==undefined&&c.span!==1)throw new Error('融合地基資料損毀。');continue;}
  if(!Number.isInteger(c.plot)||!Number.isInteger(c.span)||c.span<2||c.span>(LANDMARK_TYPES.includes(c.type)?5:ZONE_TYPES.includes(c.type)?4:3)||!(canFuse(c)||LANDMARK_TYPES.includes(c.type)||c.type==='park'))throw new Error('融合建築資料損毀。');
  const root=s.cells[c.plot],ids=square(c.plot,c.span);if(!root||root.plot!==c.plot||root.span!==c.span||root.type!==c.type||root.level!==c.level||!ids.includes(i)||ids.some(j=>!terrain(j)||s.cells[j].plot!==c.plot||s.cells[j].span!==c.span||s.cells[j].type!==c.type||s.cells[j].level!==c.level||(s.cells[j].upgrade||0)!==(root.upgrade||0)||s.cells[j].enabled!==root.enabled||s.cells[j].preserve!==root.preserve))throw new Error('融合建築地基不完整。');
  if(branchZone(c)&&ids.some(j=>['branch','branchCandidate','branchMonths','branchStress','growthMonths','branchCooldown','vacant'].some(k=>(s.cells[j][k]??(['branch','branchCandidate'].includes(k)?null:k==='vacant'?false:0))!==(root[k]??(['branch','branchCandidate'].includes(k)?null:k==='vacant'?false:0)))))throw new Error('融合建築的分支進化資料不一致。');
 }
}
export const plotLabel=c=>c.type==='line'?`${(c.lineSegments||4)*2} × 4 長廊地基`:(c.span||1)>1?`${c.span} × ${c.span} 融合建築`:'1 × 1 建築';
