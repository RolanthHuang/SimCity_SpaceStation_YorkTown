import {SIZE,CELL_COUNT,idx,xy,deltaX,deckOf,neighbors,terrain,isRoad,isEnabled,TYPES} from './catalog.mjs';

export const streetCell=c=>isRoad(c?.type)||c?.type==='station';
export const createTransit=()=>({links:[],blocked:[]});
export const linkKey=(a,b)=>a<b?`${a}:${b}`:`${b}:${a}`;
const separation=(a,b)=>{const [x,y]=xy(a),[u,v]=xy(b);return Math.hypot(deltaX(x,u),y-v);};
export const linkUpkeep=l=>l.length*.08;
export function planLink(s,a,b){
 if(a===b||!terrain(a)||!terrain(b)||s.cells[a].type!=='station'||s.cells[b].type!=='station'||separation(a,b)>140)return null;
 const previous=new Int32Array(CELL_COUNT).fill(-2),queue=[a];previous[a]=-1;
 if(deckOf(a)===deckOf(b))for(let p=0;p<queue.length&&previous[b]===-2;p++){
  for(const j of neighbors(queue[p]))if(previous[j]===-2&&terrain(j)&&streetCell(s.cells[j])){previous[j]=queue[p];queue.push(j);}
 }
 let path=[];if(previous[b]!==-2){for(let n=b;n>=0;n=previous[n])path.push(n);path.reverse();}
 // Wide detours become suspended express links, leaving the ground untouched.
 const kind=path.length&&path.length<=separation(a,b)*1.7+12?'road':'space';
 if(kind==='space')path=[a,b];
 const length=Math.max(1,kind==='road'?path.length-1:separation(a,b));
 return {id:linkKey(a,b),a,b,kind,path,length};
}
function proposedLinks(s,i,{restore=false}={}){
 const t=s.transit||createTransit(),existing=new Set(t.links.map(l=>l.id)),blocked=new Set(restore?[]:t.blocked),stations=[];
 for(let j=0;j<s.cells.length;j++)if(j!==i&&s.cells[j].type==='station')stations.push(j);
 const component=new Map(stations.map(j=>[j,j])),root=j=>{while(component.get(j)!==j)j=component.get(j);return j;};
 for(const l of t.links)if(component.has(l.a)&&component.has(l.b)){const a=root(l.a),b=root(l.b);component.set(a,b);}
 const candidates=stations.map(j=>planLink(s,i,j)).filter(l=>l&&!existing.has(l.id)&&!blocked.has(l.id)).sort((a,b)=>a.length-b.length);
 const reached=new Set();for(const l of t.links)if(l.a===i||l.b===i)reached.add(root(l.a===i?l.b:l.a));
 const chosen=[];for(const l of candidates){const r=root(l.b);if(reached.has(r))continue;chosen.push(l);reached.add(r);if(chosen.length===2)break;}
 return {chosen,otherStations:stations.length};
}
export function previewStation(s,i,{restore=false}={}){
 if(!Number.isInteger(i)||!terrain(i))return {ok:false,error:'請選擇太空站平台。'};
 const c=s.cells[i];if(!restore&&c.type&&!isRoad(c.type))return {ok:false,error:'車站可設在空地或既有道路，請勿重疊其他建築。'};
 const cells=s.cells.slice();if(!restore)cells[i]={...c,type:'station',roadBase:isRoad(c.type)?c.type:null};
 const {chosen,otherStations}=proposedLinks({...s,cells},i,{restore}),lineCost=Math.round(chosen.reduce((n,l)=>n+l.length*12,0));
 const warning=chosen.length?'':otherStations?'這座車站暫時找不到 140 格內可連接的其他車站；可先建成，之後增設中繼車站。':'第一座車站已預備好；再放置一座車站即可自動連線。';
 return {ok:true,links:chosen,cost:(restore?0:TYPES.station.cost)+lineCost,lineCost,warning};
}
export function cleanTransit(s){
 s.transit??=createTransit();s.transit.links=s.transit.links.filter(l=>s.cells[l.a]?.type==='station'&&s.cells[l.b]?.type==='station');
}
export function restoreTransit(raw,cells){
 if(raw===undefined)return createTransit();
 if(!raw||!Array.isArray(raw.links)||raw.links.length>256||!Array.isArray(raw.blocked)||raw.blocked.length>512)throw new Error('磁浮連線資料損毀。');
 const ids=new Set(),links=raw.links.map(l=>{
  if(!l||!Number.isInteger(l.a)||!Number.isInteger(l.b)||l.a===l.b||cells[l.a]?.type!=='station'||cells[l.b]?.type!=='station'||l.id!==linkKey(l.a,l.b)||ids.has(l.id)||!['road','space'].includes(l.kind)||!Number.isFinite(l.length)||l.length<1||l.length>260||!Array.isArray(l.path)||l.path.length<2||l.path.length>261||l.path[0]!==l.a||l.path.at(-1)!==l.b||l.path.some(i=>!terrain(i)))throw new Error('磁浮軌道或車站端點不合法。');
  if(l.kind==='road'&&l.path.some((i,k)=>k&&!neighbors(l.path[k-1]).includes(i)))throw new Error('高架磁浮路徑不連續。');
  const length=l.kind==='road'?l.path.length-1:separation(l.a,l.b);if(Math.abs(l.length-Math.max(1,length))>.001||separation(l.a,l.b)>140)throw new Error('磁浮路徑長度不正確。');
  ids.add(l.id);return {id:l.id,a:l.a,b:l.b,kind:l.kind,path:[...l.path],length:l.length};
 });
 const blocked=raw.blocked.map(id=>{if(typeof id!=='string'||!/^\d+:\d+$/.test(id))throw new Error('磁浮拆除紀錄不正確。');const [a,b]=id.split(':').map(Number);if(!terrain(a)||!terrain(b)||a===b||id!==linkKey(a,b)||ids.has(id))throw new Error('磁浮拆除端點不正確。');return id;});
 return {links,blocked:[...new Set(blocked)]};
}
export function attachMaglev(s,operational,graph,roadCapacity){
 const factor=Math.max(0,Math.min(1.5,s.funding.transport/100)),lines=[];
 graph.transfers??=new Map();graph.railEdges=new Map();
 for(const l of s.transit?.links||[]){
  if(s.cells[l.a]?.type!=='station'||s.cells[l.b]?.type!=='station')continue;
  const active=isEnabled(s.cells[l.a])&&isEnabled(s.cells[l.b])&&Math.min(operational[l.a],operational[l.b])>.75&&factor>.2;
  const line={...l,active,riders:0,capacity:Math.floor(600*factor*Math.min(operational[l.a],operational[l.b]))};lines.push(line);if(!active)continue;
  graph[l.a].push(l.b);graph[l.b].push(l.a);
  for(const [a,b] of [[l.a,l.b],[l.b,l.a]]){graph.transfers.set(`${a}:${b}`,1.8+l.length*.12);graph.railEdges.set(`${a}:${b}`,line);}
 }
 return {lines,get riders(){return lines.reduce((n,l)=>n+l.riders,0);},upkeep:(s.transit?.links||[]).reduce((n,l)=>n+linkUpkeep(l)*factor,0)};
}
