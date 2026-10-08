import {grandOrbitAction} from './engine.mjs';
// Temporary showcase only. Purchases are actual transactions, with a visible
// demonstration budget; neither primary city nor browser saves are modified.
export function prepareGrandShowcase(s){
 s.cash=1000000;s.highPopulation=Math.max(s.highPopulation,4000);s.orbital.completed=Math.max(s.orbital.completed,12);s.orbital.sequence=Math.max(s.orbital.sequence,12);
 for(const action of ['invite','constructRelay','activateRelay']){const result=grandOrbitAction(s,action);if(!result.ok)throw new Error('遠航示範供應配置失效：'+result.error);}
 s.events.unshift({month:s.month,tone:'info',text:'遠航示範城市使用 1,000,000 展示預算，已支付旗艦邀請、中繼建造與啟動合計 515,000；這不是你的城市與資金。'});
 return s;
}
