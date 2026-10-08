import {prepareGrandShowcase} from './grand-orbit-showcase.mjs';
import {ContinuumUI} from './continuum-ui.mjs';
import {CityMusic} from './music.mjs';
import {SIMULATION_WORKER_SOURCE} from 'yorktown-worker-source';
import {MonthRunner} from './simulation-runner.mjs';
import {applyMonth} from './simulation-protocol.mjs';
import {prepareContinuum} from './continuum-plan.mjs';
import {lineAt,lineMaintenance} from './continuum.mjs';
import {PROFILES,citizenReport} from './surrogate.mjs';
import {previewStation,linkUpkeep} from './maglev.mjs';
import {plotAnchor,plotMembers,plotLabel,LANDMARK_TYPES} from './plots.mjs';
import {prepareLiving} from './living-plan.mjs';
import {galleryHTML,mountGallery} from './evolution-gallery.mjs';
import {evolvable,evolutionStatus,stageName,STAGE_NAMES,stageUpkeep} from './evolution.mjs';
import {SIZE,DECK,SECTORS,sectorX,idx,INTERIORS,upgradeFactor,buildingCapacity,isEnabled,TYPES,facilityFactor,facilityUpkeep,GROUPS,FUNDING,POLICIES,xy,district,zoneOf,residential,isTransport} from './catalog.mjs';
import {createCity,analyze,forecast,step,build,undo,takeLoan,emergency,triggerDisaster,explain,serialize,deserialize,isPowerPlant,renewalEnabled,renewPlant,renewalCost,manageBuilding,buildingReport,buildStation,removeMaglev,grandOrbitAction} from './engine.mjs';
import {CityView} from './view.mjs';
import {PROJECTS,DISTRICTS,PORTS,GATES,orbitalAction,orbitalReport} from './orbital.mjs';
import {orbitalPanelHTML} from './orbital-ui.mjs';
import {surface} from './habitat.mjs';
import {prepareAtelier,ATELIER_LOTS} from './atelier-plan.mjs';
import {initializeBranches,branchProgress} from './branch-development.mjs';
import {branchDefinition,branchEffectText} from './branches.mjs';

const $=id=>document.getElementById(id),fmt=n=>Math.round(n).toLocaleString('en-US'),pct=n=>`${Math.round(n*100)}%`;
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=m=>`${2263+Math.floor(m/12)} / ${String(m%12+1).padStart(2,'0')}`;
const AUTO='yorktown-continuum-city-autosave-v1',MANUAL='yorktown-continuum-city-manual-v1';
import {simulationSpeed,MONTH_DURATION_MS,SPEED_KEYS,monthWorkRest} from './simulation-speed.mjs';
let previewCity=false,returnCity=null,galleryDispose=null,monthRunner,cityRevision=0,simulationEpoch=0,nextMonthAt=0;
let city=prepareContinuum(prepareLiving(createCity())),a,speed=0,category='inspect',tool='inspect',selected=-1,overlay='normal',receipts=[],view,modalType='',lastTime=performance.now(),accumulator=0,toastTimer,loaded=false,storageWarning=false,wasRunning=0,continuumUI;
try{const text=localStorage.getItem(AUTO);if(text){city=deserialize(text);loaded=true;}}catch(e){storageWarning=true;}
if(new URL(location.href).searchParams.get('demo')==='1'||location.hash==='#showcase'){
 returnCity=city;city=prepareGrandShowcase(prepareContinuum(prepareLiving(createCity())));previewCity=true;
}
initializeBranches(city,analyze(city));
function characters(){
 const current=view.explorer.state.profile;
 showModal('選擇你的 Surrogate','characters',`<p class="modal-intro">同一座城市，以不同身體探索。可隨時用 V 切換第一／第三人稱。</p><div class="surrogate-cards">${Object.values(PROFILES).map(p=>`<button data-profile="${p.id}" class="surrogate-card ${current===p.id?'chosen':''}" aria-pressed="${current===p.id}"><span class="surrogate-emblem ${p.id}" aria-hidden="true">${p.id==='architect'?'◈':p.id==='courier'?'↗':'✦'}</span><strong>${p.name} · ${p.role}</strong><small>${p.ability}</small><p>${p.description}</p></button>`).join('')}</div><p class="tiny">角色沿甲板與街道活動；目前沒有屋頂攀爬或打鬥。城市維生與財政繼續影響你看到的人流。交通工具停在廣場和車站附近，走近按 E 搭乘。</p>`);
 document.querySelectorAll('[data-profile]').forEach(b=>b.onclick=()=>{view.explorer.selectProfile(b.dataset.profile);closeModal();toast(`已換成${PROFILES[b.dataset.profile].role}「${PROFILES[b.dataset.profile].name}」。`);});
}
function citizenDialogue(person){
 const report=citizenReport(city,a,person,forecast(city,a).net);
 showModal(report.title,'citizen',`<div class="citizen-avatar" aria-hidden="true">◉</div><p class="eyebrow">YORKTOWN / STREET VOICES</p><p class="citizen-quote">「${esc(report.text)}」</p><p class="notice">${esc(report.metric)}</p><button id="dialogue-return" class="primary">繼續漫步</button><p class="tiny">資訊取自目前的城市運作與附近道路。</p>`);
 $('dialogue-return').onclick=closeModal;
}

function toast(text,bad=false){$('toast').textContent=text;$('toast').classList.add('visible');$('toast').style.borderColor=bad?'#cf918280':'#7fafad80';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),5200);}
function invalidateSimulation(){cityRevision++;monthRunner?.invalidate();}
function persist(key=AUTO,monthly=false){if(!monthly)invalidateSimulation();if(previewCity)return true;try{localStorage.setItem(key,serialize(city,{compact:true}));return true;}catch(e){if(!storageWarning){toast('瀏覽器無法寫入儲存空間；請用「匯出存檔」保存進度。',true);storageWarning=true;}return false;}}
function setSpeed(n){const next=city.insolvent?0:simulationSpeed(n);if(next!==speed){simulationEpoch++;monthRunner?.invalidate();}speed=next;if(view){view.simulationSpeed=speed;view.budget?.invalidate();}accumulator=0;lastTime=performance.now();document.querySelectorAll('[data-speed]').forEach(b=>{b.classList.toggle('active',Number(b.dataset.speed)===speed);b.setAttribute('aria-pressed',String(Number(b.dataset.speed)===speed));});$('resume-game').hidden=speed!==0;$('resume-game').textContent=city.insolvent?'財政接管 · 開啟財政面板':'已暫停 · 繼續經營 ▶';}
function chooseTool(t){tool=t;view?.setTool(t);if(t!=='inspect')setSpeed(0);if(t==='wire'||t==='eraseWire')setOverlay('power');if(t==='pipe'||t==='erasePipe')setOverlay('water');renderTools();}
const descriptions={assist:'框選 6 × 6 至 32 × 24 格，選擇投資級距並預覽道路、供應與分區，再確認施工。',line:'寬 4 格，拖曳 8～16 格長度。先預覽 160～320 公尺長廊，之後可逐段延長至 640 公尺；長側面呈透明背景迷彩，兩端可見內部。',sail:'5 × 5 星帆巡航塔提供 650 個居住名額及 80 個職位。可進入六層航跡秘庫，探索樓梯、連橋與解謎。',shell:'5 × 5 潮汐殼館提供文化活動、60 個職位與周邊公共空間效益，需水電、維生與持續維護。',fabricator:'已就業人員把 3 合金製成 1 零件；需道路、船塢、水電與維生。從「船塢與巨構」查看生產。',life:'提供 2,400 單位氧氣；需供電供水，沿水管供應。設備升級增加容量。',radiator:'提供 7,000 單位散熱；需供電供水，服務相連的電網。設備升級增加容量。',inspect:'點選建築查看運作原因。左拖平移、右拖旋轉、滾輪縮放。遮擋時可開「專注本臂」。',road:'道路兩側三格內，沿連續分區可開發。道路施工包含電線與水管；拖曳可連續鋪設。',avenue:'提高道路容量至 180，可直接升級現有道路。',rail:'磁浮軌道容量 500。車站四周的道路與軌道會互相連通；只鋪軌道不會產生通勤。',station:'可放在道路上，原道路繼續通行。車站會自動連接 140 格內的其他車站，優先沿路高架，必要時跨空間；軌道費用納入預覽。連線承接實際通勤，減少沿途道路流量。',dock:'工業必須沿交通網抵達運作中的船塢，才能正常出口。',power:'提供 6,000 單位電力。生產依維護預算與電網連接；工作職位另需道路。50 年壽命；可設定自動更新，未更新將變成殘骸。',solar:'提供 1,800 單位電力，維護較低。生產依預算與電網連接；50 年壽命；可設定自動更新，未更新將變成殘骸。',water:'水循環廠必須供電。生產依維護預算與電力，供水需求及輸送量獨立計算。',wire:'連接電廠與使用端。道路、建築自帶管線；可另外鋪線跨越空地。',pipe:'連接水循環廠與使用端。可獨立鋪設，與電網分開運作。',bulldoze:'拖曳拆除建築與管線，每格 5。無拆除退款；當月可撤銷最後一次施工。',eraseWire:'僅移除電力管線，保留地面建築，每格 1。',erasePipe:'僅移除供水管線，保留地面建築，每格 1。'};
function renderTools(){
 $('categories').innerHTML=GROUPS.map(([key,name])=>`<button data-category="${key}" class="${category===key?'active':''}" aria-pressed="${category===key}">${name}</button>`).join('');
 let list=Object.entries(TYPES).filter(([t,d])=>d.group===category&&!['rail','airport'].includes(t));
 if(category==='utility')list.push(['wire',TYPES.wire],['pipe',TYPES.pipe]);
 if(category==='inspect')list=[['inspect',{name:'檢視與移動',color:0xa3e9ce}]];
 if(category==='bulldoze')list=[['bulldoze',{name:'拆除全部',color:0xe79b8d,cost:5}],['eraseWire',{name:'移除電線',color:0xeac484,cost:1}],['erasePipe',{name:'移除水管',color:0x7cbcd9,cost:1}]];
 const toolHTML=([t,d])=>`<button class="tool ${tool===t?'active':''}" data-tool="${t}" ${d.unlock&&city.highPopulation<d.unlock?'disabled':''}><span class="tool-swatch" style="background:#${d.color.toString(16).padStart(6,'0')}"></span><span>${d.name}</span><small>${d.unlock&&city.highPopulation<d.unlock?`人口 ${fmt(d.unlock)} 解鎖`:d.cost===undefined?'選取 · 平移':t==='line'?'29,000 起 · 拖曳長度':`${fmt(d.cost)}${LANDMARK_TYPES.includes(t)?' · 5 × 5':' / 格'}`}</small></button>`;
 const secondary=category==='zone'?list.filter(([t])=>['r','c','I'].includes(t)):category==='transport'?list.filter(([t])=>['bus'].includes(t)):category==='bulldoze'?list.slice(1):[];
 const primary=list.filter(p=>!secondary.includes(p));$('tools').innerHTML=primary.map(toolHTML).join('')+(secondary.length?`<details class="tool-more"><summary>其他${category==='zone'?'密度':category==='transport'?'交通':'管線'}選項</summary>${secondary.map(toolHTML).join('')}</details>`:'');
 $('tool-description').textContent=(tool==='arcology'?'提供最多 500 人居住，需相鄰道路與充足供應。這座塔開放三層房間、迷宮走廊與樓梯探索。':descriptions[tool])||(zoneOf(tool)?'道路三格內的連續分區會自行開發。成熟街區可融合 2 × 2、3 × 3、4 × 4，並繼續八階進化。':`${TYPES[tool]?.name||''}需要相鄰道路與水電，並持續支付維護費。`);
}
function setOverlay(value){overlay=value;$('overlay').value=value;const legends={normal:'拖曳平移 · 滾輪縮放',oxygen:'綠：充足 · 黃：不足 · 暗：無氧氣',cooling:'藍：充足 · 黃：不足 · 暗：無散熱',power:'綠：充足 · 黃：不足 · 暗：未供電',water:'藍：充足 · 黃：不足 · 暗：未供水',traffic:'綠：順暢 · 黃：繁忙 · 紅：超載',pollution:'綠：較低 · 紅：較高',value:'越亮代表地價越高'};$('legend').textContent=legends[value]||'綠：良好 · 黃：部分 · 暗：不足';if(a)view?.update(city,a,overlay);}
function buildSelection(indices){if(!indices.length)return;if(continuumUI?.selected(indices,tool))return;if(!view.permitsBuild(indices,tool)){toast('這裡是你目前站立的位置，請先走開或切換到建造視角。',true);return;}const result=build(city,indices,tool);if(result.ok){receipts.push(result);receipts=receipts.slice(-20);selected=indices[indices.length-1];toast(`已${tool.includes('erase')||tool==='bulldoze'?'移除':'施工'} ${result.count} 格 · 支出 ${fmt(result.cost)}。按 1 或右下 1× 繼續經營。`);persist();refresh();if(result.warning)toast(result.warning);}else toast(result.error,true);}
function trackPanel(id,demolish=false){const l=a.maglev.lines.find(v=>v.id===id);if(!l)return;const remove=()=>{const r=removeMaglev(city,id);if(!r.ok){toast(r.error,true);return;}receipts.push(r);closeModal();persist();refresh();toast('磁浮連線已拆除；車站與下方道路保留。當月可撤銷。');};if(demolish){remove();return;}showModal('磁浮連線','maglev',`<p class="modal-intro">${l.kind==='road'?'沿路高架':'跨空間快線'} · ${Math.round(l.length)} 格距離</p><p class="notice">${l.active?'正在營運':'供應或交通預算不足，列車待機'}<br>本月通勤 ${Math.round(l.riders)} 人次 · 容量 ${l.capacity}<br>月維護 ${fmt(linkUpkeep(l)*city.funding.transport/100)} 信用點。沿線道路持續通行；乘客只在起終點使用道路。</p><button id="remove-maglev" class="danger">拆除這條連線 · 5</button>`);$('remove-maglev').onclick=remove;}
function bar(label,value,color='var(--mint)'){return `<div class="status-row"><span>${label}</span><strong>${Math.round(value)}%</strong></div><div class="bar"><span style="width:${Math.max(0,Math.min(100,value))}%;background:${color}"></span></div>`;}
function inspector(){
 let html='';
 if(selected>=0){selected=plotAnchor(city,selected);const c=city.cells[selected],d=TYPES[c.type],r=buildingReport(city,a,selected),[x,y]=xy(selected);
  html=`<h2>${evolvable(c)?stageName(c):d?.name||'待開發平台'}</h2><div class="subheading">${district(selected)} · ${x+1}, ${y+1}${r?' · '+plotLabel(c):''}</div>`;
  if(r){html+=`<div class="stat-cards"><div class="stat-card"><small>${residential(c.type)?'居民 / 容量':'就業 / 職位'}</small><strong>${fmt(residential(c.type)?r.pop:r.filled)} / ${fmt(residential(c.type)?r.capacity:r.jobs)}</strong></div><div class="stat-card"><small>月稅收 / 維護</small><strong>${fmt(r.revenue)} / ${fmt(r.upkeep)}</strong></div></div>`;
   if(evolvable(c))html+=`<div class="status-row"><span>建築進化</span><strong>${c.level} / 8</strong></div>${branchSummary(c,selected)}`;
   if(d.supply)html+=`<div class="status-row"><span>${c.type==='water'?'供水':'供電'}產能上限</span><strong>${fmt(d.supply*facilityFactor(c)*upgradeFactor(c)*r.area)}</strong></div>`;
   html+=`<div class="status-row"><span>營運狀態</span><strong>${pct(r.operational)}</strong></div>`;
   if(c.type==='station'){
    const lines=a.maglev.lines.filter(l=>l.a===selected||l.b===selected),plan=previewStation(city,selected,{restore:true});
    html+=lines.map(l=>`<button data-maglev="${l.id}">查看磁浮連線 · ${Math.round(l.riders)} 人次</button>`).join('');
    if(plan.links?.length)html+=`<button id="reconnect-station">恢復／尋找連線 · ${fmt(plan.lineCost)}</button>`;
   }
   if(r.core)html+=`<p class="notice">${r.core.name}已在建築內形成。${r.core.effect}。</p>`;
   if(!isTransport(c.type)&&c.type!=='rubble')html+=`<button id="building-manage" class="primary">建築管理</button>${r.interior?'<button id="building-enter">進入公共空間 →</button>':''}`;
  }
  const reasons=explain(city,a,selected);html+=`<p class="notice">${esc(reasons[0])}</p>${reasons.length>1?`<details><summary>供應與運作詳情</summary>${reasons.slice(1).map(t=>`<p class="tiny">${esc(t)}</p>`).join('')}</details>`:''}`;
  if(isPowerPlant(c)||c.retiredPlant)html+=`<p class="tiny">${c.retiredPlant?'已停機':`距離更新 ${Math.max(0,600-c.age)} 個月`}</p>${plantControl(c,selected)}<button id="inspect-plants">全城電廠設定</button>`;
 }else html=`<h2>城市正在生長</h2><p class="notice">點選地面或建築，查看居民、職位與營運。需要建造時，開啟左側「建造工具」。</p>`;
 $('inspection').innerHTML=html;$('reconnect-station')?.addEventListener('click',()=>{const r=buildStation(city,selected,{reconnect:true});if(!r.ok){toast(r.error,true);return;}receipts.push(r);persist();refresh();toast(`磁浮連線已建立 · 費用 ${fmt(r.cost)}`);});
 document.querySelectorAll('[data-maglev]').forEach(b=>b.onclick=()=>trackPanel(b.dataset.maglev));
 $('building-manage')?.addEventListener('click',()=>buildingPanel(selected));$('building-enter')?.addEventListener('click',()=>view.enterInterior(selected));bindPlantControls();$('inspect-plants')?.addEventListener('click',plants);
}

function milestones(){return [
 {done:city.highPopulation>=300,title:'第一個社區',description:'讓 300 位居民在此安家',detail:'沿現有道路新增住宅，保留商業與工業用地，確保每戶都能抵達工作。'},
 {done:city.history.some(h=>h.net>=0),title:'收支平衡',description:'讓每月收入覆蓋支出',detail:'稅收來自居民與實際就業。公共設施過多會壓低收支；預算面板可調整稅率與維護。'},
 {done:city.highPopulation>=800,title:'交通網成形',description:'人口達到 800，規劃跨區磁浮',detail:'在住宅與工作區設置車站，讓自動磁浮連線分擔通勤；保留起終點的道路與公共服務。'},
 {done:city.highPopulation>=2000,title:'軌道都會',description:'人口達到 2,000，開放垂直居住塔',detail:'幹道、接駁與磁浮可分擔交通；高密度分區需要更大的水電供應。'}];}
function refresh(recompute=true,draw=true){if(recompute){invalidateSimulation();a=analyze(city);if(city.cells.some(c=>evolvable(c)&&c.level>=5&&!c.branch)){initializeBranches(city,a);a=analyze(city);}}const f=forecast(city,a),st=a.stats;
 $('cash').textContent=fmt(city.cash);$('cash').className=city.cash<0?'negative':'';$('net').textContent=`${f.net>=0?'+':''}${fmt(f.net)} / 月`;$('net').className=f.net>=0?'positive':'negative';$('population').textContent=fmt(st.population);$('jobs').textContent=`${fmt(st.employed)} 人就業`;$('happiness').textContent=`${Math.round(st.happiness)}%`;$('employment').textContent=`失業 ${pct(st.unemployment)}`;$('date').textContent=date(city.month);
 const plantSummary=plantRows(),retired=plantSummary.filter(({c})=>c.retiredPlant).length,dueSoon=plantSummary.filter(({c})=>!c.retiredPlant&&c.age>=588).length;$('plant-button').textContent=retired?`⚡ 停機 ${retired}`:dueSoon?`⚡ 到期 ${dueSoon}`:'⚡ 電廠';$('plant-button').classList.toggle('plant-warning',retired>0||dueSoon>0);
 $('space-button').textContent=`維生 ${pct(Math.min(st.oxygen,st.cooling))}`;$('space-button').classList.toggle('plant-warning',Math.min(st.oxygen,st.cooling)<.95);
 $('power-status').textContent=`電力 ${fmt(a.power.demand)} / ${fmt(a.power.supply)}`;$('water-status').textContent=`供水 ${fmt(a.water.demand)} / ${fmt(a.water.supply)}`;
 $('demand').innerHTML=[['R','住宅','#83d2af'],['C','商業','#82b6e8'],['I','工業','#e8c883']].map(([k,label,color])=>`<div class="demand-item" title="需求 ${Math.round(st.demand[k])}；正值有利於開發，負值代表供給偏多"><div class="demand-label"><span style="color:${color}">${label}</span><span>${st.demand[k]>0?'+':''}${Math.round(st.demand[k])}</span></div><div class="demand-track"><span class="demand-fill" style="left:${st.demand[k]<0?50+st.demand[k]/2:50}%;width:${Math.abs(st.demand[k])/2}%;background:${color}"></span></div></div>`).join('');
 const o=city.orbital,r=orbitalReport(city,a);$('mission-text').textContent=o.orders.length?`${o.orders.length} 張訂單進行中 · 已完成 ${o.completed} →`:'承接船塢訂單，推進巨構計畫 →';$('orbital-badge').textContent=`訂單 ${o.completed} · ${o.visitorUnlocked?(r.visitorPresent?'極光號抵港':'極光號巡航'):'等待首次來訪'}`;
 $('undo').disabled=!receipts.length||receipts.at(-1).month!==city.month;
 updateSampleStatus();inspector();if(draw)view?.update(city,a,overlay);view?.showSelection(selected);
 if(modalType==='budget')updateLedger();
 if(city.insolvent)setSpeed(0);
}
function showModal(title,type,html){galleryDispose?.();galleryDispose=null;if(!$('modal').open){wasRunning=speed;setSpeed(0);}$('modal').dataset.kind=type;$('modal-title').textContent=title;$('modal-body').innerHTML=html;modalType=type;if(!$('modal').open)$('modal').showModal();view?.budget?.invalidate();}
function closeModal(){view?.showPlan(null);galleryDispose?.();galleryDispose=null;modalType='';$('modal').close();setSpeed(wasRunning);}
function updateLedger(){const f=forecast(city,a);if(!$('budget-revenue'))return;$('budget-revenue').textContent=fmt(f.revenue);$('budget-expenses').textContent=fmt(f.cost);$('budget-net').textContent=(f.net>=0?'+':'')+fmt(f.net);$('budget-net').className=f.net>=0?'positive':'negative';$('ledger').innerHTML=[...Object.entries(f.income).map(([k,v])=>[`${{R:'住宅稅收',C:'商業稅收',I:'工業稅收',orbital:'訪客與科研租金',grandOrbit:'旗艦消費與中繼服務',continuum:'長廊租金與文化活動'}[k]}`,v]),...Object.entries(f.expenses).map(([k,v])=>[FUNDING[k]||{policies:'法令與進階建築維護',debt:'債券本息',megastructures:'巨構維護',production:'市營材料支出',grandOrbit:'旗艦接待與中繼維護',continuum:'長廊與環帶花園維護'}[k],-v])].map(([label,v])=>`<tr><td>${label}</td><td class="${v>=0?'positive':''}">${v>=0?'+':''}${fmt(v)}</td></tr>`).join('');}
function plantRows(){return city.cells.flatMap((c,i)=>plotAnchor(city,i)===i&&(isPowerPlant(c)||c.type==='rubble'&&c.retiredPlant)?[{c,i,type:isPowerPlant(c)?c.type:c.retiredPlant}]:[]);}
function plantControl(c,i){return `<label class="plant-setting">自動更新<select aria-label="${i+1} 號電廠自動更新" data-renewal="${i}"><option value="inherit" ${c.renewal==='inherit'?'selected':''}>依全城設定（${city.powerRenewal?'開啟':'關閉'}）</option><option value="on" ${c.renewal==='on'?'selected':''}>這座開啟</option><option value="off" ${c.renewal==='off'?'selected':''}>這座關閉</option></select></label>`;}
function bindPlantControls(){document.querySelectorAll('[data-renewal]').forEach(el=>el.onchange=()=>{for(const j of plotMembers(city,Number(el.dataset.renewal)))city.cells[j].renewal=el.value;persist();refresh();if(modalType==='plants')plants();});}
function plants(){
 const rows=plantRows().sort((a,b)=>(b.c.retiredPlant?1000:b.c.age)-(a.c.retiredPlant?1000:a.c.age));
 const due=rows.filter(({c})=>c.retiredPlant||c.age>=588),required=due.filter(({c})=>renewalEnabled(city,c)).reduce((n,{i})=>n+renewalCost(city,i),0);
 showModal('電廠壽命與自動更新','plants',`<p class="modal-intro">發電設施使用 50 年。自動更新會按目前規模與階層收取更新費，保留已取得的進化與設備，重設 50 年年限。</p><label class="policy"><input type="checkbox" id="global-renewal" ${city.powerRenewal?'checked':''}>全城電廠預設自動更新<small>套用到「依全城設定」的電廠；單座開啟／關閉優先。新建電廠依全城設定。</small></label><div class="stat-cards"><div class="stat-card"><small>發電設施與待更新殘骸</small><strong>${rows.length}</strong></div><div class="stat-card"><small>一年內到期／已到期</small><strong>${due.length}</strong></div><div class="stat-card"><small>以上預計自動更新費</small><strong>${fmt(required)}</strong></div></div><p class="${required>city.cash?'warning-banner':'tiny'}">可用資金 ${fmt(city.cash)}。未啟用或資金不足時，到期會變成停機殘骸，城市時間自動暫停提醒；已啟用者會在資金足夠的下一個月重試，不會自動借款。</p><p class="tiny">本月已支付自動更新費：${fmt(city.lastRenewal?.month===city.month?city.lastRenewal.cost:0)}。此為一次性支出，人口歷史記錄的淨收支已包含它。</p><details><summary>查看各座電廠</summary>${rows.length?rows.map(({c,i,type})=>{const [x,y]=xy(i);return `<section class="plant-row"><strong>${TYPES[type].name} · ${x+1}, ${y+1}</strong><p class="tiny">${c.retiredPlant?'已到期 · 停機殘骸':`已使用 ${Math.floor(c.age/12)} 年 ${c.age%12} 月 · 剩 ${600-c.age} 個月`}　更新費 ${fmt(renewalCost(city,i))}</p>${plantControl(c,i)}<div class="modal-actions"><button data-locate-plant="${i}">查看位置</button><button data-renew-now="${i}" ${city.cash<renewalCost(city,i)?'disabled':''}>${c.retiredPlant?'重建':'立即更新'} · ${fmt(renewalCost(city,i))}</button></div></section>`;}).join(''):'<p class="notice">目前沒有發電設施，請從水電工具建造。</p>'}</details>`);
 $('global-renewal').onchange=e=>{city.powerRenewal=e.target.checked;persist();refresh();plants();};bindPlantControls();
 document.querySelectorAll('[data-locate-plant]').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.locatePlant);wasRunning=0;closeModal();view.focus(selected);$('inspector').hidden=false;refresh();});
 document.querySelectorAll('[data-renew-now]').forEach(b=>b.onclick=()=>{const result=renewPlant(city,Number(b.dataset.renewNow));toast(result.ok?'已更新，供電依電網與維護預算恢復。':result.error,!result.ok);refresh();persist();plants();});
}

function branchSummary(c,i){
 if(!evolvable(c))return '';
 const b=branchProgress(city,a,i),d=branchDefinition(c),status=b.vacant?`閒置；供應及需求恢復後，連續穩定 ${b.months} / 6 個月可重啟。`:b.cooldown?`已回到共同基礎；尚需 ${b.cooldown} 個月準備更新。`:b.stress?`原有條件持續不佳 ${b.stress} / ${c.level>=5?12:24} 個月。`:b.target?`地區方向：${b.target} · 已觀察 ${b.months} / ${c.level>=5?18:12} 個月。`:b.condition;
 return `<p class="branch-summary"><strong>${esc(b.name)}${c.level>=5?' · 第 '+c.level+' 階':''}</strong><span>${esc(status)}</span>${c.level<8&&!b.vacant?`<span>下階穩定累積 ${Math.min(b.growth,b.wait)} / ${b.wait} 個月</span>`:''}${d?`<span>${esc(branchEffectText(c))}</span>`:''}${b.reserve?`<span>過渡安置 ${fmt(b.reserve)} 位現有住戶；不增加新入住名額。</span>`:''}</p>`;
}
function evolutionPanel(c,i){
 const e=evolutionStatus(city,a,i);if(!e)return '';
 return `<section class="evolution-panel"><h3>${plotLabel(c)} · ${c.level} / 8 階</h3>${branchSummary(c,i)}<div class="evolution-track">${Array.from({length:8},(_,k)=>`<span class="${k<c.level?'reached':''}">${k+1}</span>`).join('')}</div><p>${e.max?'最高階城市聯合體':`下一階：${e.name} · 整棟容量 ${buildingReport(city,a,i).capacity} → ${e.capacity}`}</p>${e.max?'':`<p class="tiny">${c.level<4?'前四階可依需求自然成長。':'第 5 階起依地區條件選擇分支；投資也必須等待本階穩定期。自動投資保留六個月營運準備金。'}<br>手動投資 ${fmt(e.cost)} · 合金 ${e.alloy} · 零件 ${e.parts}</p><button id="evolve-building" class="primary" ${e.ready?'':'disabled'}>投資下一階</button><details><summary>進階條件${e.ready?'已滿足':''}</summary>${e.checks.map(v=>`<p class="tiny">${v.ok?'✓':'○'} ${v.label}</p>`).join('')}</details>`}<button id="preserve-building" class="ghost">${c.preserve?'恢復自動進化':'保留目前造型'}</button></section>`;
}

function evolutionGallery(){showModal('分支進化圖鑑','evolution-gallery',galleryHTML());galleryDispose=mountGallery($('evolution-canvas'));}
function buildingPanel(i){
 if(city.cells[i]?.type==='line'&&continuumUI?.building(i))return;
 i=plotAnchor(city,i);const c=city.cells[i],r=buildingReport(city,a,i);if(!r)return;selected=i;const d=TYPES[c.type],road=isTransport(c.type),upgradable=!road&&c.level>0&&(c.upgrade||0)<2;
 const role=residential(c.type)?'居民依工作與供應入住。':zoneOf(c.type)==='C'?'提供商業職位與稅收。':zoneOf(c.type)==='I'?'工人經貨運船塢生產合金，供應建築進化與船塢訂單，並帶來工業稅收。' :d.supply?`第 ${c.level} 階 · ${plotLabel(c)} · ${c.type==='water'?'供水':'發電'}上限 ${fmt(d.supply*facilityFactor(c)*upgradeFactor(c)*r.area)}`:d.oxygen?`第 ${c.level} 階 · 氧氣上限 ${fmt(d.oxygen*facilityFactor(c)*upgradeFactor(c)*r.area)}`:d.cooling?`第 ${c.level} 階 · 散熱上限 ${fmt(d.cooling*facilityFactor(c)*upgradeFactor(c)*r.area)}`:'公共設施依供應、預算與城市需求運作。';
 showModal((evolvable(c)?stageName(c):r.name)+' · '+plotLabel(c),'building',`<p class="modal-intro">${role}</p><div class="stat-cards"><div class="stat-card"><small>居民 / 職位</small><strong>${residential(c.type)?fmt(r.pop)+' / '+fmt(r.capacity):fmt(r.filled)+' / '+fmt(r.jobs)}</strong></div><div class="stat-card"><small>月稅收</small><strong>${fmt(r.revenue)}</strong></div><div class="stat-card"><small>月維護</small><strong>${r.upkeep.toFixed(1)}</strong></div></div>${evolutionPanel(c,i)}<p class="notice">${esc(explain(city,a,i)[0])}</p><div class="modal-actions">${r.interior?'<button id="visit-interior" class="primary">進入公共空間 →</button>':''}<button id="locate-building">查看位置</button></div><details><summary>營運與設備</summary><p class="tiny">供電 ${pct(a.power.coverage[i])} · 供水 ${pct(a.water.coverage[i])} · 氧氣 ${pct(a.space.oxygen[i])} · 散熱 ${pct(a.space.cooling[i])}<br>設備 ${c.upgrade||0} / 2。設備提高容量，與公共設施的自動階層進化分開計算。</p><div class="modal-actions">${!road?`<button id="toggle-building">${isEnabled(c)?'暫停營運':'恢復營運'}</button>`:''}${upgradable?`<button id="upgrade-building" ${city.cash<r.upgradeCost?'disabled':''}>設備改善 · ${fmt(r.upgradeCost)}</button>`:''}</div></details>`);
 for(const [id,action] of [['toggle-building','toggle'],['upgrade-building','upgrade'],['evolve-building','evolve'],['preserve-building','preserve']])$(id)?.addEventListener('click',()=>{const result=manageBuilding(city,i,action);toast(result.ok?'建築已更新。':result.error,!result.ok);receipts=[];refresh();persist();buildingPanel(i);});
 $('visit-interior')?.addEventListener('click',()=>{closeModal();view.enterInterior(i);});$('locate-building').onclick=()=>{closeModal();view.focus(i);view.showSelection(i);$('inspector').hidden=false;inspector();};
}

function spacePanel(){
 const sp=a.space;showModal('太空城市 · 生命維持','space',`<p class="modal-intro">每個相連街區必須有足夠的氧氣與散熱。氧氣沿供水管網輸送，散熱控制站服務相連電網；全城總量充足不代表斷開的街區能取得供應。</p><div class="stat-cards"><div class="stat-card"><small>居民氧氣覆蓋</small><strong>${pct(a.stats.oxygen)}</strong></div><div class="stat-card"><small>居民散熱覆蓋</small><strong>${pct(a.stats.cooling)}</strong></div><div class="stat-card"><small>供電覆蓋</small><strong>${pct(a.stats.power)}</strong></div></div><table class="ledger"><tr><td>氧氣需求 / 產能</td><td>${fmt(sp.air.demand)} / ${fmt(sp.air.supply)}</td></tr><tr><td>熱負載 / 散熱能力</td><td>${fmt(sp.heat.demand)} / ${fmt(sp.heat.supply)}</td></tr></table><p class="notice">水循環廠附帶空氣循環（2,000 單位）；融合電廠附帶 6,000 單位散熱，但反應爐本身也產生廢熱；太陽能附帶 600 單位散熱。人口擴張後需專用的生命維持中心與散熱控制站。兩者都需要水電；超出容量會降低受影響建築的運作率，並影響入住與就業。</p><div class="modal-actions"><button id="build-life">建生命維持中心 · 1,900</button><button id="build-radiator">建散熱控制站 · 1,600</button></div><details><summary>可探索的居住塔</summary>${city.cells.flatMap((c,i)=>INTERIORS[c.type]&&c.level?[`<button class="facility-link" data-facility="${i}">${TYPES[c.type].name} · ${district(i)} →</button>`]:[]).join('')||'<p class="tiny">尚無三層探索居住塔。</p>'}</details>`);
 $('build-life').onclick=()=>{wasRunning=0;closeModal();category='utility';chooseTool('life');};$('build-radiator').onclick=()=>{wasRunning=0;closeModal();category='utility';chooseTool('radiator');};document.querySelectorAll('[data-facility]').forEach(b=>b.onclick=()=>buildingPanel(Number(b.dataset.facility)));
}

function budget(){
 const sliders=(items,kind)=>Object.entries(items).map(([k,name])=>`<label class="budget-row"><span>${name}</span><output id="out-${kind}-${k}">${city[kind][k]}%</output><input aria-label="${name}" type="range" min="${kind==='tax'?0:0}" max="${kind==='tax'?25:150}" step="${kind==='tax'?1:10}" value="${city[kind][k]}" data-setting="${kind}" data-key="${k}"></label>`).join('');
 showModal('財政與公共政策','budget',`<p class="tiny">以下為本月固定營運預估，包含材料與巨構支出。訂單交貨款為一次性收入，於城市紀錄與人口歷史帳目記錄。調整政策時城市暫停。</p><div class="stat-cards"><div class="stat-card"><small>月收入</small><strong id="budget-revenue"></strong></div><div class="stat-card"><small>月支出</small><strong id="budget-expenses"></strong></div><div class="stat-card"><small>淨收支</small><strong id="budget-net"></strong></div></div><div class="modal-grid"><section><h3>分區稅率</h3>${sliders({R:'住宅稅',C:'商業稅',I:'工業稅'},'tax')}<details><summary>公共服務預算</summary>${sliders(FUNDING,'funding')}</details></section><section><h3>每月收支明細</h3><table class="ledger"><tbody id="ledger"></tbody></table><label class="policy"><input id="auto-development" type="checkbox" ${city.autoDevelopment!==false?'checked':''}>自動融合與進階投資<small>依人口、教育與使用率重建；保留至少 5,000 與六個月營運費，新增維護須有淨收入支撐。關閉後前四階仍可自然發展；高階也可手動投資。</small></label><details><summary>城市法令與債券</summary>${Object.entries(POLICIES).map(([k,p])=>`<label class="policy"><input type="checkbox" data-policy="${k}" ${city.policies[k]?'checked':''}>${p.name}<small>${p.description}</small></label>`).join('')}<h3>城市債券</h3><p class="tiny">目前 ${city.loans.length} / 3 筆 · 未償本金 ${fmt(city.loans.reduce((v,l)=>v+l.balance,0))}<br>每筆取得 15,000；120 個月攤還，每月本金 125，加餘額 0.4% 利息。這筆錢需要償還。</p><button id="loan" ${city.loans.length>=3?'disabled':''}>發行一筆債券</button></details></section></div>`);
 updateLedger();$('auto-development').onchange=e=>{city.autoDevelopment=e.target.checked;persist();};
 document.querySelectorAll('[data-setting]').forEach(input=>input.oninput=()=>{const {setting,key}=input.dataset;city[setting][key]=Number(input.value);$(`out-${setting}-${key}`).textContent=input.value+'%';refresh();persist();});
 document.querySelectorAll('[data-policy]').forEach(input=>input.onchange=()=>{city.policies[input.dataset.policy]=input.checked;refresh();persist();});
 $('loan').onclick=()=>{const result=takeLoan(city);if(!result.ok)toast(result.error,true);else{refresh();persist();budget();}};
}
function chart(){const cv=$('history-chart');if(!cv)return;const ctx=cv.getContext('2d'),w=cv.width=1200,h=cv.height=270;ctx.clearRect(0,0,w,h);ctx.font='18px system-ui';ctx.fillStyle='#8aa7ba';if(city.history.length<2){ctx.fillText('城市推進兩個月後，這裡會顯示人口歷史。',28,70);return;}const rows=city.history,max=Math.max(100,...rows.map(x=>x.population));ctx.strokeStyle='#324b5d';ctx.lineWidth=1;for(let j=0;j<4;j++){const y=24+j*65;ctx.beginPath();ctx.moveTo(65,y);ctx.lineTo(w-20,y);ctx.stroke();ctx.fillText(fmt(max*(1-j/3)),5,y+6);}ctx.beginPath();rows.forEach((row,i)=>{const x=65+i/(rows.length-1)*(w-95),y=24+(1-row.population/max)*195;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle='#a3e9ce';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#8aa7ba';ctx.fillText(date(rows[0].month),65,254);ctx.fillText(date(rows.at(-1).month),w-150,254);}
function report(){const st=a.stats;showModal('城市報告與應變','report',`<div class="stat-cards"><div class="stat-card"><small>就業 / 工作</small><strong>${fmt(st.employed)} / ${fmt(st.jobs)}</strong></div><div class="stat-card"><small>平均教育</small><strong>${Math.round(city.education)}</strong></div><div class="stat-card"><small>平均健康</small><strong>${Math.round(city.health)}</strong></div></div><h3>人口成長 · 最近 ${city.history.length} 個月</h3><canvas id="history-chart" class="chart" aria-label="城市人口歷史圖"></canvas><div class="modal-grid"><section><h3>城市品質</h3>${bar('教育服務覆蓋',st.school)}${bar('醫療服務覆蓋',st.hospital)}<div class="status-row"><span>平均犯罪風險</span><strong>${Math.round(st.crime)}</strong></div><div class="status-row"><span>平均污染</span><strong>${Math.round(st.pollution)}</strong></div><h3>應變中心</h3><label class="policy"><input id="disasters" type="checkbox" ${city.disasters?'checked':''}>啟用隨機火災<small>缺乏消防覆蓋的建築可能失火並延燒；關閉不會消除既有火災。</small></label><button id="emergency">派遣應變隊 · 500</button><details><summary style="margin-top:18px;cursor:pointer" class="tiny">災害演習（會造成實際損失）</summary><div class="modal-actions"><button class="danger" id="fire-drill">觸發火災</button><button class="danger" id="meteor-drill">觸發微隕石</button></div></details></section><section><h3>城市紀錄</h3>${city.events.slice(0,12).map(e=>`<div class="event ${e.tone}"><time>${date(e.month)}</time>${esc(e.text)}</div>`).join('')}</section></div>`);chart();$('disasters').onchange=e=>{city.disasters=e.target.checked;persist();};$('emergency').onclick=()=>{const r=emergency(city);toast(r.ok?'應變隊已出發。請恢復時間推進。':r.error,!r.ok);refresh();persist();report();};for(const [id,kind] of [['fire-drill','fire'],['meteor-drill','meteor']])$(id).onclick=()=>{const r=triggerDisaster(city,kind);if(!r.ok)toast(r.error,true);refresh();persist();report();};}
function goals(){showModal('殖民地發展里程碑','goals',`<p class="modal-intro">完成這些里程碑後，城市仍可繼續經營。沒有強制結束時間。</p>${milestones().map((m,i)=>`<div class="onboarding-goal ${m.done?'done':''}"><strong>${m.done?'✓':String(i+1).padStart(2,'0')} · ${m.title}</strong><br>${m.description}<div class="tiny">${m.detail}</div></div>`).join('')}`);}
function help(){showModal('操作指南','help',`<p class="modal-intro">上方中央切換建造、步行、飛行與全站。任何模式都可用 ← → 連續 360° 轉向，也可點兩側旋轉按鈕。↑ ↓ 調整仰俯。</p><p class="notice"><strong>建造</strong><br>左拖平移、右拖旋轉、滾輪縮放。「建造工具」選擇住宅、商業或工業後拖出分區。道路三格內的連續分區可開發；4 × 4 街區建議兩側供路。拆除融合建築時會處理整座地基，可在本月撤銷。</p><p class="notice"><strong>城市進化</strong><br>第 1–4 階為共同基礎，第 5–8 階依環境自動分成住宅、商業、工業各三條路徑；造型與效果一起改變。4→5、5→6、6→7、7→8 分別需要連續穩定 18、24、42、72 個月，並滿足教育、地價（工業採適地度）、需求與材料。工業招工會保留有限度的職位機會；污染依實際開工率與清潔規範計算，聚集不會無限疊加。長期失去條件或新的方向持續勝出，會先退回第 4 階，準備更新 12 個月再重新進化；現有住戶分階段安置。融合採整片地基中較低的成熟度，不會用一棟高階建築跳過等待。更多裡的「分支進化圖鑑」可比較三種分支及各階實際模型。公共設施仍可進化四階並融合至 3 × 3。「財政」可關閉自動投資；單座可保留目前造型。特殊展示建築屬於自選地標。</p><p class="notice"><strong>步行與飛行</strong><br>WASD 移動，方向鍵或拖曳轉頭；F 切換步行、G 飛行。飛行用 Space 上升、C 下降、Shift 加速。步行預設第三人稱，V 切換第一人稱，T 選擇角色。澄只能步行、迅可強化跳躍、翼按住 Space 短飛並落地補能。走近行人按 E 對話，停靠工具按 E 搭乘／下車。靠近傳送門按 E 穿越；星帆巡航塔可探索六層秘庫；天際長廊可步行、搭列車及升降梯。星環居住塔提供三層探索，沿樓梯上下樓，找到三個光核。E 互動，入口按 E 返回街道；上方也有返回按鈕。</p><p class="tiny">P 暫停時間 · 1 / 2 / 3 切換速度 · H 淨空畫面 · Cmd/Ctrl Z 撤銷本月施工。前後版本使用獨立自動存檔，匯入舊版 JSON 可保留城市。街道人流代表部分通勤居民。磁浮只需放置車站，軌道自動連接；點選連線可查看通勤量或拆除。</p>`);}

function saves(){if(previewCity){toast('示範城市使用臨時進度；請先返回我的城市，再使用存檔功能。');return;}showModal('保存你的殖民地','save',`<p class="modal-intro">每月與施工後會自動保存於這個瀏覽器。晨光立體城使用獨立存檔欄位；不覆蓋先前版本；匯出的 JSON 可帶到另一台裝置，也可匯入先前懸臂版與分支版城市。角色與視角偏好另外保存，城市原有經營進度會保留。</p><div class="file-actions"><button id="manual-save" class="primary">手動儲存目前城市</button><button id="manual-load">讀取手動存檔</button><button id="export">匯出存檔檔案</button><button id="import">匯入存檔檔案</button></div><p class="tiny" id="save-status"></p><h3>建立另一座城市</h3><p class="tiny">開始新城市會取代此瀏覽器的自動存檔，手動欄位保留。建議先匯出目前進度。</p><div class="modal-actions"><button id="new-continuum">晨光中軸城 · 新模板</button><button id="new-starter">新的起始聚落</button><button id="new-empty">空白殖民地</button></div>`);
 $('manual-save').onclick=()=>{if(persist(MANUAL))$('save-status').textContent=`已手動儲存 · ${date(city.month)} · ${fmt(a.stats.population)} 人`;};
 $('manual-load').onclick=()=>{try{const text=localStorage.getItem(MANUAL);if(!text){$('save-status').textContent='尚無手動存檔。';return;}const next=deserialize(text);confirmReplace('讀取手動存檔',()=>replaceCity(next));}catch(e){$('save-status').textContent=e.message;}};
 $('export').onclick=()=>{const url=URL.createObjectURL(new Blob([serialize(city,{compact:true})],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=`Yorktown-${2263+Math.floor(city.month/12)}-${city.month%12+1}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),5000);$('save-status').textContent='已送出存檔下載。';};
 $('import').onclick=()=>$('import-file').click();
 $('new-continuum').onclick=()=>confirmReplace('建立晨光立體城',()=>replaceCity(prepareContinuum(prepareLiving(createCity()))));
 $('new-starter').onclick=()=>confirmReplace('建立新的起始聚落',()=>replaceCity(createCity()));$('new-empty').onclick=()=>confirmReplace('建立空白殖民地',()=>replaceCity(createCity({starter:false})));
}
function confirmReplace(title,action){showModal(title,'confirm',`<p class="modal-intro">此操作會取代目前城市與自動存檔。手動存檔欄位保留。</p><div class="modal-actions"><button id="confirm-action" class="primary">確認取代</button><button id="cancel-action">返回存檔選單</button></div>`);$('confirm-action').onclick=action;$('cancel-action').onclick=saves;}
function replaceCity(next){view.setMode('build');city=next;receipts=[];selected=-1;wasRunning=0;persist();closeModal();category='inspect';chooseTool('inspect');renderTools();refresh();view.home();toast('城市已載入。按 1× 開始經營。');}
function goDistrict(n){selected=-1;view.showSelection(-1);view.focus(DISTRICTS[n].tile);view.distance=38;view.pitch=.60;view.yaw=-.35;view.cameraUpdate();refresh(false);}
function orbitalPanel(){
 showModal('船塢與巨構','orbital',orbitalPanelHTML(city,a));
 document.querySelectorAll('[data-orbit-action]').forEach(b=>b.onclick=()=>{const r=orbitalAction(city,a,b.dataset.orbitAction,b.dataset.key);toast(r.text||r.error,!r.ok);if(r.ok){receipts=[];refresh();persist();orbitalPanel();}});
 document.querySelectorAll('[data-grand-action]').forEach(b=>b.onclick=()=>{const r=grandOrbitAction(city,b.dataset.grandAction);toast(r.text||r.error,!r.ok);if(r.ok){receipts=[];refresh();persist();orbitalPanel();}});
 document.querySelectorAll('[data-grand-board]').forEach(b=>b.onclick=()=>{closeModal();view.isolate=false;$('isolate').classList.remove('active');$('isolate').textContent='專注本臂';view.grandOrbit.board();});
 document.querySelectorAll('[data-grand-focus]').forEach(b=>b.onclick=()=>{closeModal();view.isolate=false;$('isolate').classList.remove('active');$('isolate').textContent='專注本臂';if(!view.grandOrbit.focus(b.dataset.grandFocus,b.dataset.grandPart))toast('此項目尚未啟動或建造。',true);});
 document.querySelectorAll('[data-district]').forEach(b=>b.onclick=()=>{closeModal();goDistrict(Number(b.dataset.district));});
 document.querySelectorAll('[data-port]').forEach(b=>b.onclick=()=>{closeModal();const i=PORTS[Number(b.dataset.port)];selected=i;view.focus(i);$('inspector').hidden=false;inspector();});
 document.querySelectorAll('[data-gate]').forEach(b=>b.onclick=()=>{closeModal();view.visitGate(Number(b.dataset.gate));});
 document.querySelectorAll('[data-monument]').forEach(b=>b.onclick=()=>{closeModal();view.isolate=false;$('isolate').classList.remove('active');$('isolate').textContent='專注本臂';const k=b.dataset.monument;if(k==='arch'){view.focus(GATES[0]);view.distance=12;}else if(k==='lift'){view.focus(DISTRICTS[1].tile);view.distance=50;view.pitch=.4;}else if(k==='citadel'){view.focus(DISTRICTS[1].tile);view.distance=65;view.yaw=1;view.pitch=.4;}else {view.focus(PORTS[0]);view.distance=40;view.yaw=.5;view.pitch=.35;}view.cameraUpdate();});
}
function armPanel(){
 showModal('兩個街區 · 兩種重力方向','arm',`<p class="modal-intro">曙光花園位於完整環臂；星港折臂朝主城傾斜，提供 40 × 24 格的新建造區。兩區共用財庫，各有獨立水電與倉庫。兩個預留船塢運作後有公共渡船，晨曦之門可大幅縮短跨區通勤。</p><div class="sector-grid">${DISTRICTS.map((d,n)=>`<section class="sector-card"><span class="eyebrow">DISTRICT ${n+1}</span><h3>${d.name}</h3><button data-go="${n}">前往建造</button><button data-walk="${n}">街道漫步</button></section>`).join('')}</div><h3>完整曙光環臂</h3><div class="orbit-jumps">${SECTORS.map((name,n)=>`<button data-sector="${n}">${name}</button>`).join('')}</div><p class="notice">建造時右鍵拖曳可自由旋轉。按「專注本臂」隱藏另一街區與外圍巨構，避免遮住施工位置；步行與飛行會恢復全景。</p>`);
 document.querySelectorAll('[data-go],[data-walk]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.go??b.dataset.walk);closeModal();goDistrict(n);if(b.dataset.walk!==undefined)view.setMode('walk');});
 document.querySelectorAll('[data-sector]').forEach(b=>b.onclick=()=>{closeModal();view.focus(idx(sectorX(Number(b.dataset.sector)),25));});
}
function toggleShowcase(){
 const button=$('showcase-toggle');if(button.disabled)return;
 if($('modal').open)closeModal();setSpeed(0);
 button.disabled=true;button.textContent=previewCity?'返回城市…':'準備示範城…';
 // Paint the loading state and release the click before rebuilding the detailed district.
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  try{
   if(!previewCity){
    // Build only the preview in the next page, rather than both cities in one renderer.
    if(persist()){const target=new URL(location.href);target.searchParams.set('demo','1');location.assign(target.href);return;}
    returnCity=city;city=prepareGrandShowcase(prepareContinuum(prepareLiving(createCity())));previewCity=true;
   }else{
    city=returnCity;returnCity=null;previewCity=false;
    // Restore the original save, then release the preview's GPU resources with a fresh page.
    // When storage is unavailable, keep the in-memory return path instead of losing progress.
    if(persist()){const target=new URL(location.href);target.searchParams.delete('demo');if(target.hash==='#showcase')target.hash='';location.replace(target.href);return;}
   }
   view.setMode('build');selected=-1;receipts=[];category='inspect';chooseTool('inspect');a=analyze(city);view.state=city;view.analysis=a;view.home();refresh(false,false);renderTools();button.classList.toggle('active',previewCity);button.setAttribute('aria-pressed',String(previewCity));$('showcase-banner').hidden=!previewCity;toast(previewCity?'遠航示範已自費邀請旗艦並啟動中繼；展示進度不改動你的城市。':'已返回你的城市。');
  }finally{button.textContent=previewCity?'回我的城':'示範城市';button.disabled=false;}
 }));
}
function updateSampleStatus(){
 if(!$('sample-live'))return;const counts={2:0,3:0,4:0};city.cells.forEach((c,i)=>{if(plotAnchor(city,i)===i&&counts[c.span]!==undefined)counts[c.span]++;});$('sample-live').textContent=`${previewCity?'示範城市 · ':''}融合地基 · 2 × 2：${counts[2]} · 3 × 3：${counts[3]} · 4 × 4：${counts[4]}`;
}
function setupLiving(){
 document.body.classList.add('living-city','surrogate-city');$('inspector').hidden=true;
 $('perspective-toggle').onclick=()=>view.explorer.togglePerspective();$('surrogate-character').onclick=characters;$('interaction-button').onclick=()=>view.explorer.interact();
 $('sample-ui').onclick=()=>{const on=document.body.classList.toggle('tools-open');$('sample-ui').textContent=on?'收合工具':'建造工具';};$('sample-photo').onclick=()=>document.body.classList.toggle('sample-photo');$('evolution-gallery').onclick=evolutionGallery;
 $('explore-tower').onclick=()=>{const i=city.cells.findIndex(c=>c.type==='sail'&&c.level>0&&!c.fire);if(i<0){toast('人口 2,000 後可從地標建造星帆巡航塔，開放六層秘庫探索。');return;}view.enterInterior(i);};
 document.addEventListener('keydown',e=>{if(e.code==='KeyH'&&!$('modal').open&&!/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))document.body.classList.toggle('sample-photo');});
 document.querySelector('.more-menu')?.addEventListener('click',e=>{if(e.target.closest('button'))document.querySelector('.more-menu').open=false;});
}


try{
 view=new CityView($('viewport'),{notice:toast,recover:()=>{setSpeed(0);persist();},save:()=>persist(),talk:citizenDialogue,characters,track:trackPanel,transit:()=>persist(),manage:buildingPanel,mode:mode=>{if(['walk','fly','interior'].includes(mode)){if(mode==='interior')setSpeed(0);$('inspector').hidden=true;document.body.classList.remove('tools-open');$('sample-ui').textContent='建造工具';category='inspect';tool='inspect';view?.setTool('inspect');renderTools();}},select:i=>{if(city.artSample&&ATELIER_LOTS.some(p=>p.anchor===i)){buildingPanel(i);return;}selected=i;$('inspector').hidden=false;view.showSelection(i);inspector();},build:buildSelection,hover:i=>{},preview:indices=>{const el=$('build-preview');el.hidden=!indices.length||tool==='inspect';if(!el.hidden){const cost=TYPES[tool]?.cost||(['eraseWire','erasePipe'].includes(tool)?1:5);if(tool==='assist'){el.textContent='延續街區 · '+indices.length+' 格 · 放開後選擇投資級距';return;}if(tool==='line'){el.textContent='天際長廊 · 拖曳起始長度 160～320m · 放開後確認費用';return;}if(tool==='station'){const p=previewStation(city,indices[0]);el.textContent=p.ok?`磁浮車站 · 自動連線 ${p.links.length} 條 · 合計 ${fmt(p.cost)}${p.warning?' · 暫未連線':''}`:p.error;return;}el.textContent=`${TYPES[tool]?.name||'拆除'} · ${indices.length} 格 · 費用上限 ${fmt((LANDMARK_TYPES.includes(tool)?1:indices.length)*cost)}`;}}});
 continuumUI=new ContinuumUI({city:()=>city,analysis:()=>a,view,choose:chooseTool,show:showModal,close:closeModal,notice:toast,select:i=>{selected=i;view.showSelection(i);$('inspector').hidden=false;inspector();},done:r=>{receipts.push(r);persist();refresh();renderTools();}});
 $('loading').remove();a=analyze(city);refresh(false);renderTools();setSpeed(0);view.home();
 $('inspector').hidden=true;
 $('categories').onclick=e=>{const b=e.target.closest('[data-category]');if(!b)return;category=b.dataset.category;if(category==='inspect')chooseTool('inspect');else if(category==='bulldoze')chooseTool('bulldoze');else{const first=Object.entries(TYPES).find(([k,d])=>(category!=='zone'||k==='R')&&d.group===category&&(!d.unlock||city.highPopulation>=d.unlock));if(first)chooseTool(first[0]);}renderTools();};
 $('tools').onclick=e=>{const b=e.target.closest('[data-tool]');if(b&&!b.disabled)chooseTool(b.dataset.tool);};
 $('overlay').onchange=e=>setOverlay(e.target.value);
 $('speeds').onclick=e=>{const b=e.target.closest('[data-speed]');if(b){if(Number(b.dataset.speed)>0&&tool!=='inspect'){category='inspect';chooseTool('inspect');}setSpeed(Number(b.dataset.speed));}};
 document.querySelectorAll('[data-view-mode]').forEach(b=>b.onclick=()=>{if(b.dataset.viewMode==='overview')view.overview();else view.setMode(b.dataset.viewMode);});
 document.querySelectorAll('[data-walk-key]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);view.keys[b.dataset.walkKey]=true;view.budget.invalidate();if(b.dataset.walkKey==='Space'){if(view.mode==='walk')view.explorer.beginAbility();else if(view.mode==='interior')view.room?.jump?.();}};b.onpointerup=b.onpointercancel=()=>delete view.keys[b.dataset.walkKey];});
 $('orbital-button').onclick=orbitalPanel;$('orbital-badge').onclick=orbitalPanel;$('district-a').onclick=()=>goDistrict(0);$('district-b').onclick=()=>goDistrict(1);$('isolate').onclick=()=>{const on=view.toggleIsolation();$('isolate').classList.toggle('active',on);$('isolate').textContent=on?'顯示全站':'專注本臂';};$('showcase-toggle').onclick=toggleShowcase;
 $('arm-button').onclick=armPanel;$('space-button').onclick=spacePanel;$('interior-exit').onclick=()=>view.setMode('walk');$('interior-manage').onclick=()=>buildingPanel(view.interiorTile);
 $('home').onclick=()=>view.home();$('overview').onclick=()=>view.overview();$('rotate').onclick=()=>view.rotate();$('rotate-left').onclick=()=>view.rotate(-1);$('rotate-right').onclick=()=>view.rotate(1);$('zoom-in').onclick=()=>view.zoom(.8);$('zoom-out').onclick=()=>view.zoom(1.25);
 $('resume-game').onclick=()=>{if(city.insolvent){budget();return;}category='inspect';chooseTool('inspect');setSpeed(1);};
 const undoLast=()=>{const result=undo(city,receipts.at(-1));if(result.ok){receipts.pop();refresh();persist();toast('已撤銷，施工費已退還。');}else toast(result.error,true);};$('undo').onclick=undoLast;
 $('plant-button').onclick=plants;$('budget-button').onclick=budget;$('data-button').onclick=report;$('save-button').onclick=saves;$('help-button').onclick=help;$('mission-button').onclick=orbitalPanel;
 $('close-inspector').onclick=()=>$('inspector').hidden=true;
 $('modal-close').onclick=closeModal;$('modal').addEventListener('cancel',e=>{e.preventDefault();closeModal();});
 $('import-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>12000000)throw new Error('存檔超過大小上限。');const next=deserialize(await file.text());confirmReplace('匯入城市存檔',()=>replaceCity(next));}catch(err){toast(`無法匯入：${err.message}`,true);}e.target.value='';};
 document.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||$('modal').open)return;if((e.metaKey||e.ctrlKey)&&e.code==='KeyZ'){e.preventDefault();undoLast();return;}if(e.code==='Space'&&!['walk','fly','interior'].includes(view.mode)){e.preventDefault();if(!speed){category='inspect';chooseTool('inspect');}setSpeed(speed?0:1);}if(['Digit1','Digit2','Digit3'].includes(e.code)){category='inspect';chooseTool('inspect');setSpeed(SPEED_KEYS[e.code]);}if(e.code==='Escape'){category='inspect';chooseTool('inspect');}if(e.code==='KeyB')budget();if(e.code==='KeyP')setSpeed(speed?0:1);});
 document.addEventListener('visibilitychange',()=>{accumulator=0;lastTime=performance.now();if(document.hidden)persist();});
 addEventListener('pagehide',persist);
 const workerURL=URL.createObjectURL(new Blob([SIMULATION_WORKER_SOURCE],{type:'text/javascript'}));
 try{monthRunner=new MonthRunner(new Worker(workerURL));}finally{URL.revokeObjectURL(workerURL);}
 document.addEventListener('visibilitychange',()=>{simulationEpoch++;monthRunner.invalidate();accumulator=0;lastTime=performance.now();});
 setInterval(async()=>{
  const now=performance.now(),elapsed=Math.min(500,now-lastTime);lastTime=now;
  if(!speed||document.hidden||$('modal').open||monthRunner.failed)return;
  accumulator=Math.min(MONTH_DURATION_MS*2,accumulator+elapsed*speed);
  if(accumulator<MONTH_DURATION_MS||monthRunner.busy||now<nextMonthAt)return;
  accumulator-=MONTH_DURATION_MS;const current=city,revision=cityRevision,epoch=simulationEpoch,previous=city.unlocks.length;
  document.body.dataset.simulationBusy='true';
  try{
   const result=await monthRunner.run(revision,()=>serialize(current));
   if(city!==current||cityRevision!==revision||simulationEpoch!==epoch||!speed||document.hidden||$('modal').open){monthRunner.invalidate();return;}
   a=applyMonth(city,result);document.body.dataset.monthWorkMs=String(Math.round(result.workMs));
   // Leave idle CPU time between completed months; never queue an unlimited catch-up burst.
   nextMonthAt=performance.now()+monthWorkRest(result.workMs);
   receipts=[];refresh(false);persist(AUTO,true);if(city.unlocks.length!==previous)renderTools();
   if(city.spaceIncident===city.month){setSpeed(0);toast('維生容量不足，已暫停提醒。請開啟「維生」補足氧氣或散熱。',true);}
   if(city.powerIncident===city.month){setSpeed(0);toast('電廠到期停機，城市已暫停。請開啟上方「⚡ 電廠」處理。',true);}
  }catch(error){setSpeed(0);toast('背景計算已停止；保留最後完成的月份。請先匯出存檔，再重新開啟遊戲。',true);console.error('Yorktown simulation stopped',error);}
  finally{document.body.dataset.simulationBusy='false';}
 },100);
 setupLiving();$('showcase-toggle').textContent=previewCity?'回我的城':'示範城市';$('showcase-toggle').classList.toggle('active',previewCity);$('showcase-toggle').setAttribute('aria-pressed',String(previewCity));$('showcase-banner').hidden=!previewCity;
 new CityMusic({audio:$('city-music'),button:$('music-toggle')});
}catch(e){console.error(e);const el=$('loading');if(el){el.textContent='3D 畫面無法啟動。請使用支援 WebGL 的 Safari 或 Chrome，並啟用硬體加速。';}else toast('程式發生錯誤，請匯出存檔後重新開啟。',true);}
