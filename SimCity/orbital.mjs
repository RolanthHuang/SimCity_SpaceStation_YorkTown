import {GRAND_PORTS,createGrandOrbit,grandLoads,grandReport,tickGrandOrbit,restoreGrandOrbit} from './grand-orbit.mjs';
import {branchEffects} from './branches.mjs';
import {idx,xy,deckOf,zoneOf,districtCore,isEnabled,isRoad,clamp} from './catalog.mjs';

export const PORTS=GRAND_PORTS;
export const GATES=[idx(12,25),idx(12,77)];
export const GATE_FOOTINGS=[24,25,26,76,77,78].flatMap(y=>[idx(9,y),idx(15,y)]);
export const DISTRICTS=[{name:'曙光花園',tile:idx(23,19)},{name:'星港折臂',tile:idx(26,71)}];
export const PROJECTS={
 arch:{name:'晨曦之門',cost:18000,upkeep:120,power:320,water:30,heat:350,orders:1,pop:500,anchor:0,description:'一對跨臂拱門。可親自穿越；兩區通勤轉乘成本從 12 降至 2。',effect:'傳送門與快速通勤'},
 lift:{name:'天際升降港',cost:30000,upkeep:180,power:700,water:45,heat:750,orders:4,pop:800,anchor:1,description:'升降艙往返外側泊位；兩區出口合約酬勞增加 25%，運送時間縮短一個月。',effect:'出口收入 +25% · 快速裝船'},
 citadel:{name:'浮航城邦',cost:48000,upkeep:300,power:1000,water:200,heat:1100,orders:8,pop:1100,anchor:1,description:'獨立科研居住城邦。依主城人口、教育、滿意度招待最多 100 位外來研究員，每位每月 9 點租金；精密製造產能 +25%。',effect:'科研租金 · 精密製造 +25%'}
};
const blank=()=>({version:2,grand:createGrandOrbit(),stock:[{alloy:0,parts:0},{alloy:0,parts:0}],projects:Object.fromEntries(Object.keys(PROJECTS).map(k=>[k,{built:false,enabled:true}])),completed:0,earned:0,sequence:0,orders:[],visitorUnlocked:false,visitorCycle:0,last:{reward:0,delivered:0},travel:0});
export function createOrbital(){return blank();}
export function orbitalLoads(s,i){const o=s.orbital;if(!o||!PORTS.includes(i))return {power:0,water:0,heat:0};const result=grandLoads(s,i);for(const [k,d]of Object.entries(PROJECTS))if(o.projects[k].built&&o.projects[k].enabled&&PORTS[d.anchor]===i&&s.cells[i]?.type==='dock'&&isEnabled(s.cells[i]))for(const key of Object.keys(result))result[key]+=d[key]||0;return result;}
export function projectOnline(s,a,k){const o=s.orbital,d=PROJECTS[k];if(!o?.projects[k]?.built||!o.projects[k].enabled)return false;const i=PORTS[d.anchor];return s.cells[i]?.type==='dock'&&a.operational[i]>.95&&(k!=='arch'||PORTS.every(n=>s.cells[n]?.type==='dock'&&a.operational[n]>.95)&&GATES.every(n=>isRoad(s.cells[n]?.type)));}
export function canPortal(s,a){return projectOnline(s,a,'arch');}
export function orbitalReport(s,a){
 const o=s.orbital||blank(),online=Object.fromEntries(Object.keys(PROJECTS).map(k=>[k,projectOnline(s,a,k)]));
 const areas=DISTRICTS.map((d,n)=>({name:d.name,pop:0,industry:0,makers:0,docks:0,alloy:0,parts:0,productionCost:0,commercial:0,commercialTax:0,capacity:240}));
 for(let i=0;i<s.cells.length;i++){const c=s.cells[i],d=areas[deckOf(i)];d.pop+=c.pop;
  if(c.type==='dock'&&a.operational[i]>.75)d.docks++;
  if(zoneOf(c.type)==='I'&&a.freight[i])d.industry+=a.filled[i]*(districtCore(c)?.production||1)*branchEffects(c).production*(1+(a.branchProduction?.[i]||0));
  if(zoneOf(c.type)==='C'&&!c.subplot){d.commercial+=a.filled[i];d.commercialTax+=a.filled[i]*s.tax.C/100*16*(districtCore(c)?.trade||1)*branchEffects(c).trade*(1+(a.branchTrade?.[i]||0));}
  if(c.type==='fabricator'&&a.freight[i])d.makers+=a.filled[i];
 }
 for(let n=0;n<2;n++){
  const d=areas[n],st=o.stock[n];d.capacity=240+d.docks*120;
  d.alloy=d.docks?Math.max(0,Math.min(Math.floor(d.industry*.65),d.capacity-st.alloy)):0;
  d.parts=d.docks?Math.max(0,Math.min(Math.floor(d.makers*.32*(online.citadel?1.25:1)),Math.floor((st.alloy+d.alloy)/3),d.capacity-st.parts)):0;
  d.productionCost=d.alloy*2+d.parts*9;
 }
 const tourists=o.visitorUnlocked&&o.visitorCycle<5&&areas[0].docks>0&&areas[1].docks>0?Math.floor(Math.min(90,a.stats.population*.075)*a.stats.happiness/100):0;
 const researchers=online.citadel?Math.floor(Math.min(100,a.stats.population*.065)*clamp(s.education/70,0,1)*clamp(a.stats.happiness/70,0,1)):0;
 const upkeep=Object.entries(PROJECTS).reduce((sum,[k,d])=>sum+(o.projects[k].built?d.upkeep*(o.projects[k].enabled?1:.15):0),0);
 return {grand:grandReport(s,a,areas),areas,online,tourists,researchers,income:tourists*5+researchers*9,upkeep,productionCost:areas.reduce((sum,d)=>sum+d.productionCost,0),visitorPresent:o.visitorUnlocked&&o.visitorCycle<5};
}
const TEMPLATES=[
 {title:'軌道修復材料',alloy:45,parts:4,reward:2400},
 {title:'深空探測器組件',alloy:30,parts:12,reward:3500},
 {title:'訪客船補給',alloy:65,parts:8,reward:3600},
 {title:'科研艙體訂製',alloy:90,parts:18,reward:5600},
 {title:'航道維護模組',alloy:60,parts:22,reward:5400},
 {title:'遠航居住艙',alloy:110,parts:28,reward:7000}
];
export function offer(s){const o=s.orbital;return {...TEMPLATES[o.sequence%Math.min(6,2+Math.floor(o.completed/2))],id:o.sequence+1};}
export function orbitalAction(s,a,action,key){
 const o=s.orbital;
 if(action==='accept'){
  const n=Number(key);if(![0,1].includes(n))return {ok:false,error:'請選擇船塢。'};
  if(o.orders.length>=2)return {ok:false,error:'最多同時承接兩張訂單。'};
  const r=orbitalReport(s,a);if(!r.areas[n].docks)return {ok:false,error:'這個街區需要運作中的貨運船塢。'};
  const order=offer(s);o.sequence++;o.orders.push({...order,deck:n,deadline:s.month+24,status:'producing',eta:0});return {ok:true,text:`已承接「${order.title}」；24 個月內備妥並交貨，逾期費 400。`};
 }
 if(action==='cancel'){
  const j=o.orders.findIndex(r=>r.id===Number(key));if(j<0||o.orders[j].status!=='producing')return {ok:false,error:'已裝船的訂單無法取消。'};
  if(s.cash<150)return {ok:false,error:'取消費需要 150。'};s.cash-=150;o.orders.splice(j,1);return {ok:true,text:'已取消，支出 150。原料仍保留於倉庫。'};
 }
 const d=PROJECTS[key];if(!d)return {ok:false,error:'未知巨構。'};
 if(action==='construct'){
  if(o.projects[key].built)return {ok:false,error:'此巨構已建成。'};
  if(o.completed<d.orders||s.highPopulation<d.pop)return {ok:false,error:`需要累計完成 ${d.orders} 張訂單、歷史人口 ${d.pop}。`};
  if(PORTS.some(i=>s.cells[i].type!=='dock'))return {ok:false,error:'請先恢復兩個預留船塢位置的貨運船塢。'};
  if(key==='arch'&&GATE_FOOTINGS.some(i=>s.cells[i].type))return {ok:false,error:'拱門支座需要清空：兩區 x=10 或 16，y=25–27 / 77–79（畫面座標）。請先定位場址。'};
  if(s.cash<d.cost)return {ok:false,error:`建造需要 ${d.cost.toLocaleString()} 信用點。`};
  s.cash-=d.cost;o.projects[key]={built:true,enabled:true};return {ok:true,text:`${d.name}落成。每月維護 ${d.upkeep}；需要船塢供水、供電及散熱。`};
 }
 if(action==='toggle'&&o.projects[key].built){o.projects[key].enabled=!o.projects[key].enabled;return {ok:true,text:`${d.name}${o.projects[key].enabled?'恢復營運':'進入保養待機，維護費降為 15%'}。`};}
 return {ok:false,error:'目前無法進行此操作。'};
}
export function tickOrbital(s,a,notify){
 const o=s.orbital,r=orbitalReport(s,a);let reward=0,delivered=0;
 for(let n=0;n<2;n++){o.stock[n].alloy+=r.areas[n].alloy-r.areas[n].parts*3;o.stock[n].parts+=r.areas[n].parts;}
 for(const c of [...o.orders]){
  const stock=o.stock[c.deck],dock=r.areas[c.deck].docks>0;
  if(c.status==='shipping'&&dock&&s.month>=c.eta&&s.month<=c.deadline){
   const payment=c.payment;reward+=payment;o.earned+=payment;o.completed++;delivered++;
   o.orders=o.orders.filter(row=>row.id!==c.id);notify(`「${c.title}」完成交貨，入帳 ${payment.toLocaleString()}。`,'good');continue;
  }
  if(s.month>c.deadline){reward-=400;o.orders=o.orders.filter(row=>row.id!==c.id);notify(`「${c.title}」逾期取消，支出 400；已裝船原料不退還。`,'warn');continue;}
  if(c.status==='producing'&&dock&&stock.alloy>=c.alloy&&stock.parts>=c.parts){stock.alloy-=c.alloy;stock.parts-=c.parts;c.status='shipping';c.eta=s.month+(r.online.lift?1:2);c.payment=Math.round(c.reward*(1+(r.online.lift?.25:0)+r.grand.exportBonus));notify(`「${c.title}」已裝船，預計 ${c.eta-s.month} 個月後到款。`);}
 }
 if(!o.visitorUnlocked&&o.completed>=2&&s.highPopulation>=600){o.visitorUnlocked=true;o.visitorCycle=0;notify('巨型訪客船「極光號」首次抵港。每 12 個月停泊 5 個月；兩區船塢運作時產生訪客收益。','good');}
 else if(o.visitorUnlocked)o.visitorCycle=(o.visitorCycle+1)%12;
 o.last={reward,delivered,loadsChanged:tickGrandOrbit(s,notify)};return reward;
}
// Explicit schema: imported contracts cannot mint arbitrary rewards or duplicate a delivery.
export function restoreOrbital(raw){
 if(raw===undefined)return blank();const o=blank();
 const num=(v,max=1e9)=>Number.isFinite(v)&&v>=0&&v<=max&&Number.isInteger(v);
 if(!raw||![1,2].includes(raw.version)||!Array.isArray(raw.stock)||raw.stock.length!==2||!num(raw.completed)||!num(raw.sequence)||raw.sequence<raw.completed||!num(raw.earned)||!num(raw.visitorCycle,11)||typeof raw.visitorUnlocked!=='boolean'||!Array.isArray(raw.orders)||raw.orders.length>2)throw new Error('軌道經營存檔損毀。');
 o.stock=raw.stock.map(v=>{if(!num(v?.alloy,1e6)||!num(v?.parts,1e6))throw new Error('倉庫數值損毀。');return {alloy:v.alloy,parts:v.parts};});
 for(const k of Object.keys(PROJECTS)){const p=raw.projects?.[k];if(typeof p?.built!=='boolean'||typeof p?.enabled!=='boolean')throw new Error('巨構存檔損毀。');o.projects[k]={built:p.built,enabled:p.enabled};}
 const ids=new Set();o.orders=raw.orders.map(v=>{
  const t=TEMPLATES.find(t=>t.title===v.title&&t.alloy===v.alloy&&t.parts===v.parts&&t.reward===v.reward);
  if(!t||!num(v.id)||v.id<1||v.id>raw.sequence||ids.has(v.id)||![0,1].includes(v.deck)||!num(v.deadline)||!['producing','shipping'].includes(v.status)||!num(v.eta)||v.status==='shipping'&&![v.reward,Math.round(v.reward*1.25),Math.round(v.reward*1.5)].includes(v.payment))throw new Error('訂單資料損毀。');
  ids.add(v.id);return {...t,id:v.id,deck:v.deck,deadline:v.deadline,status:v.status,eta:v.eta,...(v.status==='shipping'?{payment:v.payment}:{})};
 });
 o.grand=restoreGrandOrbit(raw.version===1?undefined:raw.grand);
 for(const k of ['completed','earned','sequence','visitorUnlocked','visitorCycle'])o[k]=raw[k];o.travel=num(raw.travel)?raw.travel:0;return o;
}
