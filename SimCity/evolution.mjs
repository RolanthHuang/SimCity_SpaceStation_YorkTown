import {branchStageName,branchDefinition,EVOLUTION_WAITS} from './branches.mjs';
import {advanceConditions,preferredBranch} from './branch-development.mjs';
import {plotMembers} from './plots.mjs';
import {TYPES,zoneOf,deckOf,upgradeFactor,developmentFactor,buildingCapacity,isEnabled} from './catalog.mjs';
export const MAX_STAGE=8;
export const STAGE_NAMES={
 R:['','定居小屋','庭院聚落','街坊公寓','花園露台','複合住宅塔','空中花園社區','垂直生態城','星環居住聯合體'],
 C:['','街角商舖','商業街廊','城市商場','企業辦公塔','天際雙塔','空中商業中樞','軌道金融中心','星際貿易聯合體'],
 I:['','基礎工坊','模組工廠','產業園區','自動化工廠','精密製造園','高科技製造塔','軌道組裝中心','星際工業聯合體']};
export const stageName=c=>branchStageName(c)||STAGE_NAMES[zoneOf(c.type)]?.[c.level]||TYPES[c.type]?.name||'空地';
export const evolvable=c=>!!c&&['r','R','c','C','i','I'].includes(c.type);
export const stageUpkeep=c=>evolvable(c)?(Math.max(0,c.level-5)*4*(c.type===c.type.toUpperCase()?1.5:1)*upgradeFactor(c)+(c.level>=5?(branchDefinition(c)?.effects.upkeep||0)*(c.level-4)/4:0))*(isEnabled(c)?1:.15):0;
export const stageHeight=(c)=>{const level=Math.max(1,Math.min(8,c.level)),dense=c.type===c.type.toUpperCase(),z=zoneOf(c.type);const branch=branchDefinition(c);if(branch&&level>=5)return branch.heights[level-5]*(dense?1:.66)*(1+(c.upgrade||0)*.05);return (z==='R'?[0,.46,.68,1,1.45,2.1,2.9,3.8,4.8]:z==='C'?[0,.40,.61,.87,1.5,2.25,3.05,4,5.15]:[0,.34,.45,.65,.86,1.12,1.48,1.86,2.2])[level]*(dense?1:0.66)*(1+(c.upgrade||0)*.05);};
export function evolutionStatus(s,a,i,{automatic=false}={}){
 const members=plotMembers(s,i),c=s.cells[members[0]],z=zoneOf(c?.type);if(!evolvable(c))return null;
 const area=members.length,priceFactor=Math.pow(area,.85),next=c.level+1,max=c.level>=8,unitCost=next<=5?Math.round(TYPES[c.type].cost*(1+next)*1.8):[0,0,0,0,0,0,1200,2400,4200][next]||0;
 const cost=Math.round(unitCost*priceFactor),unitAlloy=next>=6?[0,0,0,0,0,0,20,35,60][next]||0:0,unitParts=next>=6?[0,0,0,0,0,0,8,16,30][next]||0:0;
 const alloy=Math.ceil(unitAlloy*priceFactor),parts=Math.ceil(unitParts*priceFactor);
 const district=deckOf(i),stock=s.orbital.stock[district],education=[0,0,20,28,36,46,58,68,78][next]||0,land=[0,0,20,26,32,38,45,53,60][next]||0;
 const choice=c.branch?{id:c.branch,...branchDefinition(c)}:preferredBranch(s,a,i),checks=advanceConditions(s,a,i,next);
 const wait=EVOLUTION_WAITS[next]||0;
 if(next>=5){checks.push({label:`本階條件連續穩定 ${Math.min(c.growthMonths||0,wait)} / ${wait} 個月`,ok:(c.growthMonths||0)>=wait});if(c.level===4)checks.push({label:'分支方向連續確認至少 12 個月',ok:!!choice&&c.branchCandidate===choice.id&&(c.branchMonths||0)>=12});}
 else if(automatic)checks.push({label:`建築穩定 ${wait} 個月`,ok:members.every(j=>s.cells[j].age>=wait)});
 if(automatic)checks.push({label:'未保留目前外觀',ok:!c.preserve});
 if(!automatic||next>=6)checks.push({label:`資金 ${cost.toLocaleString()}`,ok:s.cash>=cost},{label:`本街區合金 ${alloy} · 零件 ${parts}`,ok:stock.alloy>=alloy&&stock.parts>=parts});
 return {next,max,branch:choice?.id||null,wait,progress:c.growthMonths||0,name:next>=5&&choice?choice.stages[next-5]:STAGE_NAMES[z][next],currentName:stageName(c),cost,alloy,parts,checks,ready:!max&&checks.every(c=>c.ok),capacity:area*Math.round(TYPES[c.type].base*(developmentFactor({...c,level:Math.min(next,8)}))*upgradeFactor(c)),extraUpkeep:area*Math.max(0,stageUpkeep({...c,level:Math.min(next,8),branch:choice?.id||null})-stageUpkeep(c))};
}
