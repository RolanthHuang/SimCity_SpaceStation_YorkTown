import {BRANCHES,branchDefaults,branchZone,branchDefinition,branchName,EVOLUTION_WAITS} from './branches.mjs';
import {SIZE,HEIGHT,idx,xy,wrapX,deckOf,zoneOf,buildingCapacity,baseBuildingCapacity,isEnabled,clamp} from './catalog.mjs';
import {plotMembers,plotAnchor} from './plots.mjs';

export function branchContext(s,a,i){
 i=plotAnchor(s,i);const members=plotMembers(s,i),c=s.cells[i],own=new Set(members),[xx,yy]=xy(i),x=xx+((c.span||1)-1)/2,y=yy+((c.span||1)-1)/2;
 const avg=(data,fallback=0)=>members.reduce((n,j)=>n+(data?.[j]??fallback),0)/members.length;
 const ctx={parks:avg(a.baseParks||a.parks),school:avg(a.services?.school),hospital:avg(a.services?.hospital),pollution:avg(a.pollution),value:avg(a.landValue),operational:Math.min(...members.map(j=>a.operational[j])),education:s.education,homePop:0,commerce:0,industry:0,matureCommerce:0,docks:0,stations:0,green:!!s.policies.green,freight:members.every(j=>a.freight[j]),occupancy:0};
 for(let dy=-8;dy<=8;dy++)for(let dx=-8;dx<=8;dx++){
  const d=Math.hypot(dx,dy);if(d>8)continue;const ny=Math.round(y)+dy;if(ny<0||ny>=HEIGHT)continue;const j=idx(wrapX(Math.round(x)+dx),ny);
  if(own.has(j)||deckOf(j)!==deckOf(i))continue;const b=s.cells[j];if(!b?.level||!isEnabled(b)||b.fire||b.subplot)continue;
  const w=1-d/10,z=zoneOf(b.type);if(z==='R')ctx.homePop+=b.pop*w;
  if(z==='C'){ctx.commerce+=(a.jobs?.[j]||0)*w;if(b.level>=4&&(a.filled?.[j]||0)>0)ctx.matureCommerce+=w*Math.min(1,a.filled[j]/Math.max(1,a.jobs[j]));}
  if(z==='I')ctx.industry+=(a.jobs?.[j]||0)*w;
  if(b.type==='dock'&&a.operational[j]>.75)ctx.docks+=w;
  if(b.type==='station'&&a.operational[j]>.75)ctx.stations+=w;
 }
 const filled=branchZone(c)==='R'?members.reduce((n,j)=>n+s.cells[j].pop,0):members.reduce((n,j)=>n+(a.filled[j]||0),0);
 const cap=branchZone(c)==='R'?members.reduce((n,j)=>n+buildingCapacity(s.cells[j]),0):members.reduce((n,j)=>n+(a.jobs[j]||0),0);
 ctx.occupancy=filled/Math.max(1,cap);return ctx;
}
export function branchCandidates(s,a,i){
 const c=s.cells[plotAnchor(s,i)],z=branchZone(c);if(!z)return [];const q=branchContext(s,a,i),norm=(n,max)=>clamp(n/max,0,1),ed=norm(q.education,100),sch=norm(q.school,100),home=norm(q.homePop,600),shops=norm(q.commerce,180),industry=norm(q.industry,160),parks=norm(q.parks,30),dock=norm(q.docks,1.5),station=norm(q.stations,1.2),clean=1-norm(q.pollution,80);
 let scores;
 if(z==='R')scores={garden:[.25+parks*.5+clean*.1+norm(q.hospital,100)*.15,q.parks>=4&&q.pollution<55],civic:[.3+home*.3+shops*.3+norm(q.hospital,100)*.1,q.homePop>=24||q.commerce>=12],research:[.18+ed*.28+sch*.34+industry*.2,q.education>=58&&q.school>=24&&q.pollution<48]};
 else if(z==='C')scores={market:[.3+home*.4+dock*.18+station*.12,q.homePop>=24],finance:[.15+norm(q.value,100)*.5+norm(q.matureCommerce,2)*.25+ed*.1,q.value>=62&&q.matureCommerce>=.6],innovation:[.17+sch*.3+ed*.28+industry*.3,q.education>=58&&q.school>=18&&q.industry>=10]};
 else scores={logistics:[.35+dock*.25+station*.16+shops*.09+(q.freight?.15:0),q.freight],precision:[.15+ed*.4+sch*.28+shops*.3,q.education>=58&&q.school>=18&&q.freight],circular:[.15+parks*.33+(q.green?.26:0)+sch*.18+clean*.08,q.green&&q.parks>=4&&q.freight]};
 return Object.entries(scores).map(([id,[score,eligible]])=>({id,...BRANCHES[z][id],score,eligible:eligible&&score>=.42,context:q})).sort((u,v)=>v.score-u.score||u.id.localeCompare(v.id));
}
export const preferredBranch=(s,a,i)=>branchCandidates(s,a,i).find(d=>d.eligible)||null;
export function advanceConditions(s,a,i,next=s.cells[plotAnchor(s,i)].level+1){
 const members=plotMembers(s,i),c=s.cells[members[0]],z=branchZone(c);if(!z)return [];
 const q=branchContext(s,a,i),education=[0,0,20,28,36,46,58,68,78][next]||0,land=[0,0,20,26,32,38,45,53,60][next]||0;
 const checks=[{label:'建築正在營運',ok:isEnabled(c)&&!c.fire&&c.level>0},{label:'水電與維生至少 98%',ok:q.operational>=.98},{label:`教育 ${education}`,ok:s.education>=education},{label:`地價 ${z==='I'?Math.round(land*.42):land}`,ok:q.value>=(z==='I'?Math.round(land*.42):land)},{label:z==='R'?'入住率至少 55%':'職位使用率至少 40%',ok:q.occupancy>=(z==='R'?.55:.4)},{label:'分區需求為正',ok:a.stats.demand[z]>0}];
 if(z==='I')checks.push({label:'連通貨運船塢',ok:q.freight});
 if(z==='R')checks.push({label:'居住滿意度至少 50',ok:members.reduce((n,j)=>n+a.happiness[j],0)/members.length>=50});
 if(next>=6)checks.push({label:`已完成 ${next-5} 張船塢訂單`,ok:s.orbital.completed>=next-5});
 if(next>=5){const choice=c.branch?branchCandidates(s,a,i).find(b=>b.id===c.branch):preferredBranch(s,a,i);checks.push({label:choice?`${choice.name}的地區條件`:'等待適合的地區分支',ok:!!choice?.eligible},{label:'更新準備期已結束',ok:!(c.branchCooldown>0)});}
 return checks;
}
const assign=(s,members,values)=>{for(const j of members)Object.assign(s.cells[j],values);};
export function advancePlot(s,i,branch){
 const members=plotMembers(s,i),c=s.cells[members[0]],next=c.level+1;
 assign(s,members,{level:next,age:0,growthMonths:0,branch:next>=5?(c.branch||branch):null,branchCandidate:null,branchMonths:0,branchStress:0,branchCooldown:0});
}
function retreat(s,i,notify,reason){
 const members=plotMembers(s,i),c=s.cells[members[0]],name=branchName(c);
 for(const j of members){const b=s.cells[j];Object.assign(b,{level:4,branch:null,branchCandidate:null,branchMonths:0,branchStress:0,growthMonths:0,branchCooldown:12,age:0,residentReserve:branchZone(b)==='R'?Math.max(b.pop,b.residentReserve||0):0});}
 notify(`${name}因${reason}回到第 4 階共同基礎；準備更新 12 個月，再依地區條件重新發展。現有住戶先保留過渡安置。`,'warn');
}
// Legacy high-stage buildings acquire an identity once, without advancing a stage.
export function initializeBranches(s,a){
 let changed=false;
 for(let i=0;i<s.cells.length;i++){const c=s.cells[i];if(!branchZone(c)||c.level<5||plotAnchor(s,i)!==i||c.branch)continue;
  const id=preferredBranch(s,a,i)?.id||Object.keys(BRANCHES[branchZone(c)])[0];assign(s,plotMembers(s,i),{branch:id});changed=true;
 }
 return changed;
}
export function tickBranches(s,a,notify=()=>{}){
 let changed=false;
 for(let i=0;i<s.cells.length;i++){
  const c=s.cells[i],z=branchZone(c);if(!z||!c.level||plotAnchor(s,i)!==i||c.fire)continue;const members=plotMembers(s,i),q=branchContext(s,a,i),options=branchCandidates(s,a,i),best=options.find(b=>b.eligible),current=options.find(b=>b.id===c.branch);
  const supplied=members.every(j=>(a.power?.coverage?.[j]??a.operational[j])>.95&&(a.water?.coverage?.[j]??a.operational[j])>.95&&(a.space?.oxygen?.[j]??1)>.95&&(a.space?.cooling?.[j]??1)>.95&&(a.roadDistance?.[j]??0)>=0);
  if(c.vacant){
   const recovery=supplied&&c.enabled!==false&&a.stats.demand[z]>-15&&q.value>=22,months=recovery?(c.branchMonths||0)+1:0;
   assign(s,members,{branchMonths:months});if(months>=6){assign(s,members,{vacant:false,branchStress:0,branchMonths:0,growthMonths:0,branchCooldown:6,age:0});changed=true;notify('閒置街區重新接通服務，恢復共同基礎建築；後續仍需穩定經營才能進階。','good');}continue;
  }
  if(c.enabled===false){assign(s,members,{growthMonths:0,branchMonths:0,branchStress:0});continue;}
  const retentionLand=[0,0,0,0,0,30,36,43,50][c.level]*(z==='I'?.42:1);
  const bad=q.operational<.75||a.stats.demand[z]<-45||q.value<18||(c.level>=5&&(!current?.eligible||q.occupancy<.18||q.value<retentionLand));
  const stress=bad?(c.branchStress||0)+1:Math.max(0,(c.branchStress||0)-2),cooldown=Math.max(0,(c.branchCooldown||0)-1);
  const shift=c.level>=5?best&&best.id!==c.branch&&best.score-(current?.score||0)>=.14&&!bad:best;
  const candidate=shift?best.id:null,months=candidate?(candidate===c.branchCandidate?(c.branchMonths||0)+1:1):0;
  const stable=advanceConditions(s,a,i).every(v=>v.ok)&&!bad&&!(c.level>=5&&candidate),growth=stable?(c.growthMonths||0)+1:0;
  assign(s,members,{branchCandidate:candidate,branchMonths:months,branchStress:stress,growthMonths:growth,branchCooldown:cooldown});
  if(c.level>=5&&(stress>=12||candidate&&months>=18)){retreat(s,i,notify,stress>=12?'地段持續不再支持原分支':'周邊形成新的發展方向');changed=true;continue;}
  if(c.level<5&&stress>=24&&(z!=='R'||members.every(j=>s.cells[j].pop===0))){assign(s,members,{vacant:true,branch:null,branchCandidate:null,branchMonths:0,growthMonths:0});changed=true;notify('共同基礎街區長期失去供應或需求，進入閒置；恢復服務與需求後可重新使用。','warn');}
 }
 return changed;
}
export function branchProgress(s,a,i){
 const c=s.cells[plotAnchor(s,i)],d=branchDefinition(c),best=preferredBranch(s,a,i),next=Math.min(8,c.level+1);
 return {name:d?.name||'共同基礎',condition:d?.condition||best?.condition||'等待附近公園、生活服務或產業形成',form:d?.form||'共同基礎建築',target:c.branchCandidate?BRANCHES[branchZone(c)][c.branchCandidate]?.name:null,months:c.branchMonths||0,stress:c.branchStress||0,cooldown:c.branchCooldown||0,growth:c.growthMonths||0,wait:EVOLUTION_WAITS[next],reserve:plotMembers(s,i).reduce((n,j)=>n+Math.max(0,s.cells[j].pop-baseBuildingCapacity(s.cells[j])),0),vacant:!!c.vacant};
}
