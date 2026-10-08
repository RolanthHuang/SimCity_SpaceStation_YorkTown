import {idx,isEnabled,clamp} from './catalog.mjs';
export const GRAND_PORTS=[idx(14,14),idx(14,66)];
export const GRAND_PROJECTS={
 flagship:{name:'星冠級旗艦訪港',cost:180000,upkeep:6000,months:5,cooldown:12,pop:2000,orders:8,power:800,water:150,heat:900,oxygen:120},
 relay:{name:'遠航中繼巨構',cost:300000,upkeep:1800,activation:35000,activeUpkeep:2600,months:4,cooldown:12,pop:4000,orders:12,power:180,water:20,heat:200,oxygen:20,activePower:1200,activeWater:90,activeHeat:1350,activeOxygen:80}
};
export function createGrandOrbit(){return {version:1,flagship:{remaining:0,cooldown:0,visits:0,spent:0},relay:{built:false,enabled:true,remaining:0,cooldown:0,activations:0,spent:0}};}
const state=s=>s.orbital.grand;
const portOnline=(s,a,n)=>s.cells[GRAND_PORTS[n]]?.type==='dock'&&isEnabled(s.cells[GRAND_PORTS[n]])&&a.operational[GRAND_PORTS[n]]>.95;
export function grandStatus(s,a){
 const g=state(s);if(!g)return {flagship:false,relay:false};
 return {flagship:g.flagship.remaining>0&&portOnline(s,a,0),relay:g.relay.built&&g.relay.enabled&&g.relay.remaining>0&&[0,1].every(n=>portOnline(s,a,n))};
}
export function grandLoads(s,i){
 const load={power:0,water:0,heat:0,oxygen:0},g=state(s);if(!g)return load;
 if(i===GRAND_PORTS[0]&&g.flagship.remaining>0)for(const k of Object.keys(load))load[k]+=GRAND_PROJECTS.flagship[k];
 if(i===GRAND_PORTS[1]&&g.relay.built&&g.relay.enabled)for(const k of Object.keys(load))load[k]+=GRAND_PROJECTS.relay[k]+(g.relay.remaining>0?GRAND_PROJECTS.relay['active'+k[0].toUpperCase()+k.slice(1)]:0);
 return load;
}
export function grandReport(s,a,areas){
 const g=state(s)||createGrandOrbit(),online=grandStatus(s,a),quality=clamp((a.stats.happiness-35)/45,0,1);
 const commercial=areas.reduce((n,d)=>n+d.commercial,0),baseTax=areas.reduce((n,d)=>n+d.commercialTax,0),industry=areas.reduce((n,d)=>n+d.industry+d.makers,0);
 const visitors=online.flagship?Math.floor(Math.min(1500,a.stats.population*.08,commercial*.8)*quality):0;
 const commerceBonus=baseTax*((online.flagship?.12:0)+(online.relay?.18:0))*quality;
 const logistics=online.relay?Math.min(3500,industry*.45)*quality:0;
 const upkeep=(g.flagship.remaining?GRAND_PROJECTS.flagship.upkeep:0)+(g.relay.built?GRAND_PROJECTS.relay.upkeep*(g.relay.enabled?1:.15):0)+(g.relay.remaining&&g.relay.enabled?GRAND_PROJECTS.relay.activeUpkeep:0);
 return {online,visitors,commerceBonus,logistics,income:visitors*5+commerceBonus+logistics,upkeep,demandBonus:(online.flagship?12:0)+(online.relay?8:0),exportBonus:online.relay?.25:0};
}
export function grandAction(s,a,action,analyze,forecast){
 const g=state(s),f=GRAND_PROJECTS.flagship,r=GRAND_PROJECTS.relay;
 if(!g)return {ok:false,error:'遠航計畫尚未初始化。'};
 if(action==='endVisit'){
  if(!g.flagship.remaining)return {ok:false,error:'目前沒有旗艦停泊。'};
  g.flagship.remaining=0;return {ok:true,text:'已提前結束停泊；邀請費不退還，本月起停止接待維護及收益。',cost:0};
 }
 if(action==='pauseRelay'){
  if(!g.relay.built||!g.relay.enabled)return {ok:false,error:'中繼巨構未在營運。'};
  g.relay.enabled=false;g.relay.remaining=0;return {ok:true,text:'中繼巨構轉為保養待機，每月 270；本次啟動費不退還。',cost:0};
 }
 const definition=action==='invite'?f:r;
 if(!['invite','constructRelay','activateRelay','resumeRelay'].includes(action))return {ok:false,error:'未知遠航操作。'};
 if(action==='invite'&&(g.flagship.remaining||g.flagship.cooldown))return {ok:false,error:`旗艦邀請仍在冷卻，尚需 ${g.flagship.cooldown} 個月。`};
 if(action==='constructRelay'&&g.relay.built)return {ok:false,error:'中繼巨構已建成。'};
 if(action==='activateRelay'&&(!g.relay.built||!g.relay.enabled||g.relay.remaining||g.relay.cooldown))return {ok:false,error:!g.relay.built?'請先建造中繼巨構。':!g.relay.enabled?'請先恢復中繼巨構營運。':`中繼啟動仍在冷卻，尚需 ${g.relay.cooldown} 個月。`};
 if(action==='resumeRelay'&&(!g.relay.built||g.relay.enabled))return {ok:false,error:'中繼巨構沒有處於保養待機。'};
 if(action!=='resumeRelay'&&(s.highPopulation<definition.pop||s.orbital.completed<definition.orders))return {ok:false,error:`需要歷史人口 ${definition.pop.toLocaleString()}、完成 ${definition.orders} 張訂單。`};
 if(a.stats.happiness<55||a.stats.population<600)return {ok:false,error:'城市需要至少 600 位實際居民、55 滿意度，才能承接遠航服務。'};
 const cost=action==='invite'?f.cost:action==='constructRelay'?r.cost:action==='activateRelay'?r.activation:0;
 if(s.cash<cost)return {ok:false,error:`啟動需要 ${cost.toLocaleString()} 信用點。`};
 const next=structuredClone(g),target=action==='invite'?next.flagship:next.relay;
 if(action==='invite'){target.remaining=f.months;target.cooldown=f.cooldown;target.visits++;target.spent+=cost;}
 if(action==='constructRelay'){target.built=true;target.enabled=true;target.spent+=cost;}
 if(action==='activateRelay'){target.remaining=r.months;target.cooldown=r.cooldown;target.activations++;target.spent+=cost;}
 if(action==='resumeRelay')target.enabled=true;
 // This single action-only trial includes the new loads on the actual networks.
 // It never mutates or clones the 47,168 city cells, and never runs per frame.
 const trial={...s,cash:s.cash-cost,orbital:{...s.orbital,grand:next}},checked=analyze(trial);
 const needed=action==='invite'?[0]:[0,1];
 if(!needed.every(n=>portOnline(trial,checked,n))||['power','water','oxygen','cooling'].some(k=>checked.stats[k]<.95))return {ok:false,error:'加入遠航負載後，船塢或城市水電、氧氣、散熱不足。請先擴充實際管網供應。'};
 const finance=forecast(trial,checked),months=action==='invite'?f.months:action==='activateRelay'?r.months:3,reserve=Math.ceil(Math.max(0,-finance.net)*months);
 if(trial.cash<reserve)return {ok:false,error:`啟動後預估每月淨額 ${Math.round(finance.net).toLocaleString()}，另需保留 ${reserve.toLocaleString()} 信用點支應營運。`};
 s.cash-=cost;s.orbital.grand=next;
 return {ok:true,cost,text:action==='invite'?`旗艦即將抵港。邀請費 ${cost.toLocaleString()}；停泊 5 個月，每月接待 6,000。`:action==='constructRelay'?`遠航中繼巨構落成，支出 ${cost.toLocaleString()}；每月維護 1,800。`:action==='activateRelay'?`中繼航道啟動，支出 ${cost.toLocaleString()}；服務 4 個月，期間每月總維護 4,400。`:'中繼巨構恢復營運。'};
}
export function tickGrandOrbit(s,notify){
 const g=state(s);if(!g)return false;let changed=false;
 for(const [key,label]of [['flagship','旗艦已離港，接待負載與維護停止。'],['relay','中繼航道本次服務結束，回到一般維護。']]){
  const p=g[key];if(p.cooldown>0)p.cooldown--;if(p.remaining>0){p.remaining--;if(!p.remaining){changed=true;notify(label,'info');}}
 }
 return changed;
}
export function restoreGrandOrbit(raw){
 if(raw===undefined)return createGrandOrbit();const g=createGrandOrbit(),num=(x,max=1e12)=>Number.isSafeInteger(x)&&x>=0&&x<=max;
 if(!raw||raw.version!==1)throw new Error('遠航計畫存檔損毀。');
 for(const k of ['flagship','relay']){
  const p=raw[k],d=GRAND_PROJECTS[k],counter=k==='flagship'?'visits':'activations';
  if(!p||!num(p.remaining,d.months)||!num(p.cooldown,d.cooldown)||p.cooldown<p.remaining||!num(p[counter],1e7)||!num(p.spent)||p.remaining>0&&p[counter]===0)throw new Error('遠航停泊或冷卻資料損毀。');
  if(k==='flagship'&&p.spent!==p.visits*GRAND_PROJECTS.flagship.cost||k==='relay'&&p.spent!==(p.built?GRAND_PROJECTS.relay.cost:0)+p.activations*GRAND_PROJECTS.relay.activation)throw new Error('遠航支出紀錄不正確。');
  g[k]={remaining:p.remaining,cooldown:p.cooldown,[counter]:p[counter],spent:p.spent};
  if(k==='relay'){
   if(typeof p.built!=='boolean'||typeof p.enabled!=='boolean'||(!p.built||!p.enabled)&&p.remaining>0||!p.built&&(p.activations>0||p.spent>0))throw new Error('中繼巨構資料損毀。');
   Object.assign(g[k],{built:p.built,enabled:p.enabled});
  }
 }
 return g;
}
