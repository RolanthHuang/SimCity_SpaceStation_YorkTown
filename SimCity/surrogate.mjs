import {deltaX,xy,deckOf,terrain} from './catalog.mjs';
import {canWalk,tileAt,wrapU} from './habitat.mjs';
import {wrapAngle} from './camera-controls.mjs';
import {movePhysicalBody,bodyClear} from './body-collision.mjs';

// Exploration state is separate from the city save: a visitor never replaces a resident.
export const PROFILES=Object.freeze({
 architect:{id:'architect',name:'澄',role:'城市建築師',ability:'步行',description:'步行與快走，適合觀察街景、對話和搭乘。',speed:.72,sprint:1.35,jump:0,color:0x357c78},
 courier:{id:'courier',name:'迅',role:'躍行信使',ability:'強化跳躍',description:'空白起跳，移動中能躍過約三格街道距離；落地後可再跳。',speed:.9,sprint:2.2,jump:2.2,color:0xb96b46},
 pilot:{id:'pilot',name:'翼',role:'短航機師',ability:'短程飛行',description:'按住空白飛行約五秒，最高兩格；落地補能。C 提早降落。',speed:.8,sprint:1.5,jump:0,color:0x4a789c}
});
export const VEHICLES=Object.freeze({
 scooter:{name:'磁驅 Scooter',speed:2.5,radius:.12},
 hound:{name:'機械運輸犬',speed:1.65,radius:.17}
});
export const FLIGHT_SECONDS=5,MAX_FLIGHT_HEIGHT=2;
export function createExplorer(preferences={}){
 return {profile:PROFILES[preferences.profile]?preferences.profile:'architect',thirdPerson:preferences.thirdPerson!==false,distance:1.25,heading:0,phase:0,energy:1,cooldown:0,flightExhausted:false,mounted:null,moving:0};
}
export const currentProfile=e=>PROFILES[e.profile]||PROFILES.architect;
export function chooseProfile(e,id,w){
 if(!PROFILES[id])return false;
 // A change in flight lands through the same collision/terrain guard, never into a roof.
 e.profile=id;e.energy=1;e.cooldown=0;e.flightExhausted=false;w.jump=0;w.velocity=0;return true;
}
export function beginAbility(e,w){
 if(e.mounted)return false;const p=currentProfile(e);
 if(p.jump&&w.jump===0){w.velocity=p.jump;return true;}
 return p.id==='pilot'&&e.energy>.02&&e.cooldown<=0&&!e.flightExhausted;
}
export function advanceAbility(e,w,keys,dt){
 e.cooldown=Math.max(0,e.cooldown-dt);
 if(!keys.Space&&w.jump===0&&e.energy>.12)e.flightExhausted=false;
 const pilot=currentProfile(e).id==='pilot',lift=pilot&&keys.Space&&!keys.KeyC&&e.energy>0&&e.cooldown===0&&!e.mounted&&!e.flightExhausted;
 if(lift){
  e.energy=Math.max(0,e.energy-dt/FLIGHT_SECONDS);w.velocity=Math.min(1.4,w.velocity+5*dt);
  if(e.energy<=0){e.cooldown=1.25;e.flightExhausted=true;}
 }else w.velocity-=3.5*dt;
 if(keys.KeyC&&pilot)w.velocity=Math.min(w.velocity,-1);
 w.jump=Math.max(0,Math.min(pilot?MAX_FLIGHT_HEIGHT:2,w.jump+w.velocity*dt));
 if(w.jump===0){w.velocity=0;if(!lift)e.energy=Math.min(1,e.energy+dt*.24);}
 if(w.jump===MAX_FLIGHT_HEIGHT&&w.velocity>0)w.velocity=0;
 if(e.mounted){w.jump=0;w.velocity=0;}
 return lift;
}
export function moveExplorer(cells,w,e,keys,dt,bodies=[]){
 const p=currentProfile(e),vehicle=e.mounted,forward=(keys.KeyW?1:0)-(keys.KeyS?1:0),side=(keys.KeyD?1:0)-(keys.KeyA?1:0);
 const moving=Math.hypot(forward,side),sprint=keys.ShiftLeft||keys.ShiftRight;
 const speed=vehicle?VEHICLES[vehicle.kind].speed*(1+(vehicle.tier-1)*.14):p.id==='pilot'&&w.jump>.03?2.3:sprint?p.sprint:p.speed;
 const step=moving?speed*dt/moving:0,du=(Math.sin(w.yaw)*forward+Math.cos(w.yaw)*side)*step,dv=(-Math.cos(w.yaw)*forward+Math.sin(w.yaw)*side)*step;
 advanceAbility(e,w,keys,dt);
 const u=w.u,v=w.v,body={u:w.u,v:w.v,jump:vehicle?0:w.jump,id:vehicle?.id||'player',kind:vehicle?.kind||'surrogate',heading:e.heading,mass:vehicle?(vehicle.kind==='hound'?1400:180)+80:80};
 movePhysicalBody(cells,body,du,dv,bodies);w.u=body.u;w.v=body.v;
 const distance=Math.hypot(deltaX(u,w.u),w.v-v);e.moving=distance/Math.max(.001,dt);e.phase+=distance*22;
 if(distance>.00001){const heading=Math.atan2(deltaX(u,w.u),-(w.v-v));e.heading=wrapAngle(e.heading+wrapAngle(heading-e.heading)*Math.min(1,dt*14));}
 if(vehicle){vehicle.u=w.u;vehicle.v=w.v;vehicle.heading=e.heading;vehicle.progress+=distance;}
 return distance;
}

export function vehicleTier(s,a){
 const st=a.stats;if(st.population>=6000&&st.happiness>=65&&s.orbital.completed>=16)return 3;
 return st.population>=2000&&st.happiness>=55?2:1;
}
export function safeDismount(cells,w,vehicle,bodies=[]){
 const yaw=vehicle.heading||0;
 const obstacles=bodies.includes(vehicle)?bodies:[vehicle,...bodies],safe=(u,v)=>canWalk(cells,u,v)&&bodyClear({u,v,kind:'surrogate'},obstacles,.015);
 for(const distance of vehicle.kind==='hound'?[.44,.6,.74,.9]:[.34,.48,.65,.85])for(const angle of [Math.PI/2,-Math.PI/2,Math.PI,0,Math.PI/4,-Math.PI/4]){
  const u=wrapU(w.u+Math.sin(yaw+angle)*distance),v=w.v-Math.cos(yaw+angle)*distance;
  if(safe(u,v)&&tileAt(u,v)!==tileAt(vehicle.u,vehicle.v))return {u,v};
 }
 // A narrow road can have no safe side tile. The rider can still stand beside the chassis.
 for(const distance of vehicle.kind==='hound'?[.44,.48]:[.34,.4])for(const angle of [Math.PI/2,-Math.PI/2,Math.PI,0]){
  const u=wrapU(w.u+Math.sin(yaw+angle)*distance),v=w.v-Math.cos(yaw+angle)*distance;
  if(safe(u,v))return {u,v};
 }
 return null;
}
export function proximity(w,targets,{radius=.75}={}){
 if(w.jump>.15)return null;let best=null;
 for(const t of targets){if(t.disabled||t.deck!==undefined&&t.deck!==deckOf(tileAt(w.u,w.v)))continue;
  const distance=Math.hypot(deltaX(w.u,t.u),w.v-t.v),limit=t.radius??radius;
  if(distance<limit&&(!best||distance<(best.distance-.08)||Math.abs(distance-best.distance)<.08&&(t.priority||0)>(best.priority||0))){best={...t,distance};}
 }
 return best;
}
export function createFleet(s,a,routes){
 const tier=vehicleTier(s,a),roads=s.cells.map((c,i)=>['road','avenue','station'].includes(c.type)&&terrain(i)&&canWalk(s.cells,...xy(i).map(n=>n-27.5))?i:-1).filter(i=>i>=0);
 if(!roads.length||a.stats.population===0)return [];
 const fleet=[],add=(kind,i,tag,path=null)=>{const [x,y]=xy(i);fleet.push({id:`${kind}:${tag}`,kind,tier,u:x-27.5,v:y-27.5,heading:Math.PI/2,progress:0,path,parked:!path,deck:deckOf(i)});};
 const stations=roads.filter(i=>s.cells[i].type==='station'&&a.operational[i]>.5);
 const roadNear=(u,v,deck=0)=>roads.filter(i=>deckOf(i)===deck).sort((a,b)=>{const [x,y]=xy(a),[p,q]=xy(b);return deltaX(x-27.5,u)**2+(y-27.5-v)**2-deltaX(p-27.5,u)**2-(q-27.5-v)**2;})[0];
 // A shared stop on each inhabited deck; stations add their own visible rental pad.
 for(const deck of [0,1]){const i=roadNear(deck?0:-2.5,deck?43.5:4.5,deck);if(i!==undefined&&roads.some(r=>deckOf(r)===deck&&a.traffic[r]>0)){add('scooter',i,`plaza-${deck}`);const dog=roadNear(deck?3.5:6.5,deck?43.5:4.5,deck);if(dog!==undefined)add('hound',dog,`cargo-${deck}`);}}
 stations.slice(0,3).forEach(i=>add('scooter',i,`station-${i}`));
 routes.slice(0,4).forEach((path,n)=>{if(path.length>2)add(n%2?'hound':'scooter',path[0],`traffic-${n}`,path);});
 return fleet;
}
export function routePosition(path,progress,lane=0){
 const length=path.length-1,t=((progress%(length*2))+length*2)%(length*2),reverse=t>length,p=reverse?length*2-t:t,j=Math.min(length-1,Math.floor(p)),f=p-j;
 const [x,y]=xy(path[j]),[u,v]=xy(path[j+1]),dx=deltaX(x,u),dy=v-y,sign=reverse?-1:1;
 return {u:wrapU(x-27.5+dx*f+dy*lane),v:y-27.5+dy*f-dx*lane,heading:Math.atan2(dx*sign,-dy*sign),deck:deckOf(path[j])};
}

const number=n=>Math.round(n||0).toLocaleString('en-US');
export function citizenReport(s,a,person,net=0){
 const st=a.stats,i=person.tile,localPower=a.power.coverage[i]??st.power,localWater=a.water.coverage[i]??st.water;
 const load=(a.traffic[i]||0)/Math.max(1,a.roadCapacity[i]||1),riders=a.maglev?.riders||0;
 const roles=[['街區居民','我住在這一帶'],['商業店主','我在附近經營商店'],['維生工程師','我負責檢查街區的供應'],['通勤旅人','我每天經過這條街']];
 const role=(person.id||0)%4,[title,intro]=roles[role];let text,metric;
 if(role===0){text=`${intro}。全城目前有 ${number(st.population)} 位居民，滿意度 ${number(st.happiness)}%。${st.happiness>=70?'住起來很舒服，想繼續留下來。':'如果公共服務改善，大家會更願意留下。'}`;metric=`居民 ${number(st.population)} · 滿意 ${number(st.happiness)}%`;}
 if(role===1){text=`${intro}。目前 ${number(st.employed)} 人就業，失業率 ${number(st.unemployment*100)}%。城市月收支 ${net>=0?'+':''}${number(net)} 信用點。${net>=0?'營運有餘裕，可以評估下一筆投資。':'希望先穩住收入，再增加維護負擔。'}`;metric=`就業 ${number(st.employed)} · 月收支 ${net>=0?'+':''}${number(net)}`;}
 if(role===2){text=`${intro}。這附近供電 ${number(localPower*100)}%、供水 ${number(localWater*100)}%。全城氧氣 ${number(st.oxygen*100)}%、散熱 ${number(st.cooling*100)}%。${Math.min(localPower,localWater,st.oxygen,st.cooling)<.9?'有供應缺口，請看看維生面板。':'維生供應穩定，適合繼續發展。'}`;metric=`附近水電 ${number(localWater*100)}% / ${number(localPower*100)}%`;}
 if(role===3){text=`${intro}。這一格道路負載為容量的 ${number(load*100)}%；全城磁浮本月承接 ${number(riders)} 人次通勤。${load>1?'這裡很擁擠，新增車站或改善起終點道路會有幫助。':'這段路通行順暢。'}`;metric=`道路負載 ${number(load*100)}% · 磁浮 ${number(riders)} 人次`;}
 return {title,text,metric};
}
