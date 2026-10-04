import {stageHeight} from './evolution.mjs';
import {residentialBodyHeight} from './residential-architecture.mjs';
// Conservative submitted-triangle estimates; independent of population and calendar.
export function branchDetailCost(c){
 if(c.level<5)return {fine:5000,medium:1700};
 const v={garden:[45000,11000],civic:[43000,11000],research:[30000,4000],market:[42000,6000],finance:[42000,6000],innovation:[21000,8000],logistics:[25000,3500],precision:[18000,5500],circular:[37000,7000]}[c.branch];
 return {fine:v?.[0]||5000,medium:v?.[1]||1700};
}
export function branchVisualHeight(c){
 const span=c.span||1,h=stageHeight(c)*(1+(span-1)*.13),z=c.type?.toUpperCase();
 if(c.level>=5){
  if(z==='R'){const H=residentialBodyHeight(c);return .75+H*(c.branch==='garden'?1.2:c.branch==='civic'?1.13:1.14);}
  if(z==='C')return .65+h*(c.branch==='finance'?1.25:c.branch==='market'?.97:1.25);
  if(z==='I')return .65+h*1.18;
 }
 return Math.max(.8,stageHeight(c)*(1+(span-1)*.18)+.5);
}
