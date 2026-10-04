// Branch identity is persistent simulation state, not a camera-time colour choice.
const path=(name,stages,condition,form,palette,effects,heights)=>({name,stages,condition,form,palette,effects,heights});
export const BRANCHES={
 R:{
  garden:path('森林天冠',['穹庭居所','懸庭聚落','雙翼森林冠','三冠參天城'], '公園充足、環境潔淨', '初階層疊森林露台；高階單一主幹、高空三冠與懸空居住平台', [0xece5cf,0x669b86,0xab9062,0x304c45], {amenity:10,water:1.12,power:.94,upkeep:4},[1.65,2.1,3.9,5.5]),
  civic:path('巨木共居',['木庭居所','樹幹生活街','參天木構聚落','巨木共居城'], '附近住宅、商店與生活服務較強', '天然巨木支架、炭化木圓窗居所、螺旋階梯與被動保溫外殼', [0xd3b794,0x74959c,0xbb8752,0x403d37], {amenity:5,homeAura:.08,power:.55,upkeep:3},[1.8,2.5,3.4,4.4]),
  research:path('魔方學研城',['方庭學苑','晶格幻城','複層知識城','星門魔方城'], '教育完善、附近有潔淨產業', '巨型中空方城、幾何格柵外牆、高拱入口與層疊學研內庭', [0xece5db,0x528dac,0x948095,0x344353], {productionAura:.12,power:.86,water:.94,upkeep:6},[2.1,2.7,3.45,4.25])
 },
 C:{
  market:path('層疊港灣市集',['扇頂商街','階庭市集','疊翼商埠','層疊港灣市集'], '附近居民、船塢與車站支持消費', '扇形折翼屋頂、赤陶拱廊、退台商街與水庭', [0xead8bd,0x648d99,0xbb8148,0x443b32], {trade:1.2,amenity:3,upkeep:4},[1.05,1.35,1.65,1.95]),
  finance:path('螺旋金融尖塔',['晶格金融塔','螺旋交易庭','金環交換尖塔','螺旋金融尖塔'], '高地價、成熟商業聚集', '晶體卵形塔身、香檳金斜網外骨架與連續螺旋交易帶', [0xe7dfc9,0x466981,0xc7a35c,0x283d4c], {trade:1.3,tradeAura:.1,power:1.12,upkeep:9},[2.2,3.05,3.95,4.9]),
  innovation:path('懸橋商研城',['懸橋商務街','吊艙創研苑','複層協作橋','懸橋商研城'], '教育及附近製造業支持技術交易', '分叉承重塔、索懸商務街、晶體吊艙與屋頂論壇', [0xe4e9df,0x3e9f9d,0xb77d64,0x304b53], {trade:1.14,productionAura:.16,power:1.06,upkeep:6},[1.6,2.15,2.7,3.25])
 },
 I:{
  logistics:path('星艦建造場',['船體裝配塢','星艦建造場','雙軌巨構船塢','軌道星艦聯合船廠'], '貨運船塢與運輸連接較強', '開放式巨型船塢、吊運骨架與隨施工階段輪替的船體／模組', [0xc9c4b5,0x708490,0xb26942,0x3b4347], {production:1.3,pollution:1.12,power:1.2,water:1.1,upkeep:4},[.78,.96,1.12,1.3]),
  precision:path('巨型壓鑄工廠',['整合壓鑄廠','多線智造園','巨型壓鑄聯合廠','軌道超級工廠'], '教育、商業與技術職位支持', '鋸齒採光廠房、整列壓鑄機、橋式吊車與熱回收設備', [0xdde6e4,0x4a79a6,0x738cb0,0x2c3f4e], {production:1.32,pollution:.78,power:1.08,upkeep:7},[1.2,1.55,1.92,2.3]),
  circular:path('循環生技',['循環溫室','生技環廠','再生生態園','軌道循環城'], '清潔工業政策與公園支持', '翡翠色生物儲槽、環形淨化器與透明溫室', [0xdfe4cf,0x4b9389,0x98a96e,0x314c40], {production:1.16,pollution:.38,power:.9,water:.82,amenity:4,upkeep:6},[.92,1.16,1.43,1.68])
 }
};
export const BRANCH_FIELDS=['branch','branchCandidate','branchMonths','branchStress','growthMonths','branchCooldown','residentReserve','vacant'];
export const branchDefaults=()=>({branch:null,branchCandidate:null,branchMonths:0,branchStress:0,growthMonths:0,branchCooldown:0,residentReserve:0,vacant:false});
export const branchZone=c=>['R','C','I'].includes(c?.type?.toUpperCase())?c.type.toUpperCase():null;
export const branchDefinition=c=>BRANCHES[branchZone(c)]?.[c.branch]||null;
export const branchName=c=>branchDefinition(c)?.name||'共同基礎';
export const branchStageName=c=>c.level>=5?branchDefinition(c)?.stages[c.level-5]:null;
export const EVOLUTION_WAITS=[0,0,4,7,10,18,24,42,72];
export function branchEffects(c){
 const d=branchDefinition(c),t=d&&c.level>=5&&c.enabled!==false&&!c.fire&&!c.vacant?(c.level-4)/4:0,e=d?.effects||{};
 const ratio=k=>1+((e[k]??1)-1)*t;
 return {trade:ratio('trade'),production:ratio('production'),pollution:ratio('pollution'),power:ratio('power'),water:ratio('water'),amenity:(e.amenity||0)*t,homeAura:(e.homeAura||0)*t,tradeAura:(e.tradeAura||0)*t,productionAura:(e.productionAura||0)*t,upkeep:(e.upkeep||0)*t};
}
const mix=(a,b,t)=>{const rgb=k=>Math.round(((a>>k)&255)*(1-t)+((b>>k)&255)*t);return (rgb(16)<<16)|(rgb(8)<<8)|rgb(0);};
export function architecturePalette(c,x=0,y=0){
 const z=branchZone(c)||'R',d=c.level>=5?branchDefinition(c):null;
 const palettes={R:[[0xebe2ce,0x73918f,0xaf8967,0x3d4e4f],[0xe3dacb,0x7b98a0,0xb39472,0x34494e],[0xe6dfd2,0x809494,0xa78371,0x40464b]],C:[[0xe7dfcf,0x63889f,0xbfa16e,0x344653],[0xe5ddd3,0x6b839e,0xa493a8,0x353f51],[0xe8ddcb,0x669494,0xb58f64,0x304c50]],I:[[0xd6d2c4,0x66828d,0xa47751,0x3b464b],[0xc7cecc,0x64838b,0x9c735e,0x35464b],[0xd6d6c5,0x698a89,0x99a37a,0x3d4c45]]};
 const seed=Math.abs(Math.imul(Math.round(x),73856093)^Math.imul(Math.round(y),19349663)),p=d?.palette||palettes[z][seed%3],shade=((seed>>>3)%7-3)/70;
 const tint=v=>mix(v,shade<0?0x8f9b9c:0xffffff,Math.abs(shade));
 const abandoned=!!c.vacant;
 return {white:tint(p[0]),glass:abandoned?0x69757a:tint(p[1]),glassLight:abandoned?0x69757a:mix(tint(p[1]),0xc2ded8,.24),accent:abandoned?0x948577:tint(p[2]),dark:p[3],metal:mix(p[1],0xc7d1d1,.65),gold:mix(0xb68d54,p[2],.14),stone:mix(p[0],0x999c98,.25),leaf:[0x5d8d65,0x709a61,0x447d67,0x9caa68][seed%4]};
}
export function facilityPalette(type){
 const tone={power:[0x83939e,0xb9874f],solar:[0x52749c,0x7b91af],water:[0x6caaa8,0x75a7a4],life:[0x7eaa85,0x8eaa6f],radiator:[0x6e91a5,0x779ab4],school:[0x9298ab,0xb19677],hospital:[0x779fa7,0x9f828e],fire:[0x8d7770,0xbb755c],police:[0x6e84a0,0x758fac],fabricator:[0x7492a3,0x7d90a5],station:[0x6d97a8,0xb29d6a],dock:[0x788999,0xb18356],arcology:[0x729c92,0xac956c]}[type]||[0x849b9f,0xa99479];
 return {ivory:0xe9e4d8,stone:0xc9c8bb,titanium:mix(tone[0],0xc4cfd0,.60),dark:0x3b515b,window:tone[0],glass:tone[0],pane:tone[0],gold:mix(tone[1],0xb89054,.45),red:tone[1],leaf:0x88a67a};
}
export function branchEffectText(c){
 const e=branchEffects(c),pct=n=>Math.round(n*100),num=n=>Number(n.toFixed(1)),parts=[];
 if(!branchDefinition(c)||c.level<5)return '穩定的地區條件會選擇後續分支。';
 if(e.trade!==1)parts.push(`本棟商業稅收效率 +${pct(e.trade-1)}%`);
 if(e.production!==1)parts.push(`本棟合金效率 +${pct(e.production-1)}%`);
 if(e.amenity)parts.push(`周邊綠地舒適最高 +${num(e.amenity)}`);
 if(e.homeAura)parts.push(`鄰近住宅稅收效率最高 +${pct(e.homeAura)}%`);
 if(e.tradeAura)parts.push(`鄰近商業效率最高 +${pct(e.tradeAura)}%`);
 if(e.productionAura)parts.push(`鄰近合金效率最高 +${pct(e.productionAura)}%`);
 for(const [key,label] of [['pollution','污染'],['power','用電'],['water','用水']])if(e[key]!==1)parts.push(`${label} ${e[key]>1?'+':''}${pct(e[key]-1)}%`);
 return parts.join(' · ')||'停用期間不提供分支效益。';
}
