export const SIZE=536; // Number of cells around the complete arm.
export const HEIGHT=88;
export const CELL_COUNT=SIZE*HEIGHT;
export const VERSION=9;
export const TYPES={
  road:{name:'道路',cost:12,upkeep:.12,color:0x40546b,group:'transport',capacity:60},
  avenue:{name:'幹道',cost:32,upkeep:.3,color:0x5e6b83,group:'transport',capacity:180},
  rail:{name:'磁浮軌道',cost:24,upkeep:.2,color:0x9ab5c7,group:'transport',capacity:500},
  station:{name:'磁浮車站',cost:650,upkeep:14,color:0xa2c6da,group:'transport',jobs:8,capacity:600},
  bus:{name:'接駁車總站',cost:550,upkeep:16,color:0x8ecfea,group:'transport',jobs:8},
  dock:{name:'貨運船塢',cost:2200,upkeep:25,color:0xeac28b,group:'transport',jobs:32},
  airport:{name:'星際客運港',cost:4500,upkeep:55,color:0xd3dee8,group:'transport',jobs:50,unlock:800},
  r:{name:'低密度住宅',cost:20,color:0x73cfa4,group:'zone',zone:'R',base:20},
  R:{name:'高密度住宅',cost:55,color:0x47bda0,group:'zone',zone:'R',base:55},
  c:{name:'低密度商業',cost:25,color:0x70aee3,group:'zone',zone:'C',base:12},
  C:{name:'高密度商業',cost:60,color:0x4685c9,group:'zone',zone:'C',base:30},
  i:{name:'輕工業',cost:25,color:0xe4bd69,group:'zone',zone:'I',base:20},
  I:{name:'重工業',cost:65,color:0xca9253,group:'zone',zone:'I',base:45},
  power:{name:'融合電廠',cost:2400,upkeep:40,color:0xf4c979,group:'utility',supply:6000,jobs:16},
  solar:{name:'太陽能陣列',cost:1100,upkeep:10,color:0x748ee8,group:'utility',supply:1800,jobs:3},
  water:{name:'水循環廠',cost:1500,upkeep:25,color:0x71cfea,group:'utility',supply:6000,jobs:10},
  life:{name:'生命維持中心',cost:1900,upkeep:26,color:0x8de4b7,group:'utility',jobs:12,oxygen:2400},
  radiator:{name:'散熱控制站',cost:1600,upkeep:20,color:0x86b6ee,group:'utility',jobs:8,cooling:7000},
  wire:{name:'電力管線',cost:4,color:0xffd27c,group:'network'},
  pipe:{name:'供水管線',cost:4,color:0x70cfff,group:'network'},
  fire:{name:'消防局',cost:1100,upkeep:28,color:0xe87f75,group:'service',radius:9,jobs:12},
  police:{name:'警察局',cost:1100,upkeep:28,color:0x8d9ce9,group:'service',radius:9,jobs:12},
  school:{name:'學校',cost:1400,upkeep:32,color:0xe5d5a7,group:'service',radius:11,jobs:16,capacity:600},
  hospital:{name:'醫院',cost:1800,upkeep:42,color:0xe3edf2,group:'service',radius:11,jobs:24,capacity:900},
  park:{name:'生態公園',cost:180,upkeep:3,color:0x51b88b,group:'service',radius:5},
  stadium:{name:'公共會館',cost:3000,upkeep:28,color:0xc4a9ef,group:'service',radius:16,unlock:400,jobs:20},
  arcology:{name:'垂直居住塔',cost:20000,upkeep:90,color:0x8ff7df,group:'special',base:500,zone:'R',unlock:2000},
  fabricator:{name:'精密製造所',cost:3200,upkeep:32,color:0xb8d8dc,group:'special',jobs:32},
  aurelia:{name:'曙光花園居所',cost:18000,upkeep:65,color:0xd2dccc,group:'special',base:400,zone:'R',unlock:1200},
  meridian:{name:'天際商業匯',cost:24000,upkeep:90,color:0xaebfcb,group:'special',base:240,zone:'C',unlock:1800},
  aurora:{name:'極光製造園',cost:16000,upkeep:75,color:0xcac5b0,group:'special',base:200,zone:'I',unlock:1200},
  sail:{name:'星帆巡航塔',cost:24000,upkeep:120,color:0xc4dedb,group:'special',base:650,zone:'R',jobs:80,unlock:2000},
  shell:{name:'潮汐殼館',cost:14500,upkeep:70,color:0xdfcdb8,group:'special',jobs:60,unlock:800},
  line:{name:'天際長廊 · THE LINE',cost:29000,color:0x8bb7ba,group:'special',base:180,jobs:40,zone:'R',unlock:1200},
  rubble:{name:'受損地塊',cost:0,color:0x655c64,group:'damage'},
};
export const GROUPS=[['inspect','檢視'],['zone','分區'],['transport','交通'],['utility','水電'],['service','服務'],['special','地標'],['bulldoze','拆除']];
export const FUNDING={utilities:'水電維護',transport:'交通維護',fire:'消防',police:'治安',school:'教育',hospital:'醫療',parks:'公園文化'};
export const POLICIES={green:{name:'清潔工業規範',description:'工業污染降低 40%；每名工業職位每月支出 0.08。'},transit:{name:'大眾運輸補助',description:'道路承載量增加 35%；每位居民每月支出 0.05。'},campaign:{name:'招商與移居計畫',description:'住宅與商業需求增加 12；每月支出 35。'}};
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const idx=(x,y)=>y*SIZE+x;
export const xy=i=>[i%SIZE,Math.floor(i/SIZE)];
export const wrapX=x=>((x%SIZE)+SIZE)%SIZE;
export const deltaX=(a,b)=>{let d=wrapX(b-a);return d>SIZE/2?d-SIZE:d;};
export const neighbors=i=>{const [x,y]=xy(i);return [idx(wrapX(x-1),y),idx(wrapX(x+1),y),y>0?i-SIZE:-1,y<HEIGHT-1?i+SIZE:-1].filter(n=>n>=0);};
export const DECK={minX:0,maxX:SIZE-1,minY:8,maxY:43,radius:SIZE/(Math.PI*2)};
export function terrain(i){if(!Number.isInteger(i)||i<0||i>=CELL_COUNT)return false;const [x,y]=xy(i);return y>=DECK.minY&&y<=DECK.maxY || x>=8&&x<=47&&y>=60&&y<=83;}
export const SECTORS=['曙光','星港','晨星','天頂','遠航','星雲','暮光','歸航'];
export const sectorX=n=>wrapX(20+Math.round(n*SIZE/8));
export function district(i){const [x,y]=xy(i);if(y>=60)return '星港折臂 · 造船街區';return '曙光環臂 · '+SECTORS[Math.floor(wrapX(x-20+SIZE/16)/(SIZE/8))]+'區';}
export const upgradeFactor=c=>1+(c.upgrade||0)*.25;
export const isEnabled=c=>c.enabled!==false&&!c.vacant;
export const isRoad=t=>t==='road'||t==='avenue';
export const isTransport=t=>isRoad(t)||t==='rail';
export const zoneOf=t=>TYPES[t]?.zone;
export const residential=t=>zoneOf(t)==='R';

export const deckOf=i=>Math.floor(i/SIZE)>=60?1:0;

// Legacy stages 1/2/3 map to 1/3/5, preserving exact capacity on import.
export const DEVELOPMENT=[0,1,1.4,2,2.5,3,3.6,4.3,5.1];
export const developmentFactor=c=>['r','R','c','C','i','I'].includes(c.type)?DEVELOPMENT[Math.max(1,Math.min(8,c.level))]:Math.max(1,c.level);
export const baseBuildingCapacity=c=>c.subplot?0:Math.round((TYPES[c.type]?.base||0)*(c.type==='line'?(c.lineSegments||4):1)*developmentFactor(c)*upgradeFactor(c));
// Existing residents retain transitional rooms during redevelopment, never new immigration seats.
export const buildingCapacity=c=>Math.max(baseBuildingCapacity(c),residential(c.type)?Math.min(c.residentReserve||0,c.pop||0):0);

// Only these selected buildings expose playable interiors.
export const INTERIORS={arcology:'星環居住塔 · 三層探索',sail:'星帆巡航塔 · 六層棱光秘庫',line:'天際長廊 · 多層公共街道'};
export const isFacility=t=>['power','solar','water','life','radiator','school','hospital','fire','police','fabricator'].includes(t);
export const facilityFactor=c=>isFacility(c.type)?[1,1,1.25,1.65,2.05][Math.min(4,c.level||1)]*(1+Math.max(0,(c.span||1)-1)*.115):1;
export const facilityUpkeep=c=>isFacility(c.type)?[1,1,1.18,1.44,1.8][Math.min(4,c.level||1)]*(1+Math.max(0,(c.span||1)-1)*.085):1;
// Shared civic functions emerge inside mature districts, rather than requiring
// a duplicate manually managed headquarters for every zoning category.
export function districtCore(c){
 if(!['r','R','c','C','i','I'].includes(c?.type)||(c.span||1)<3||c.level<7||!isEnabled(c)||c.fire)return null;
 const top=c.level===8,z=zoneOf(c.type);
 return z==='R'?{name:'社區共享中心',amenity:top?20:12,trade:1,production:1,pollution:1,effect:'空中花園與公共會所改善周邊居住品質'}:z==='C'?{name:'街區交易中心',amenity:0,trade:top?1.12:1.06,production:1,pollution:1,effect:`本棟商業稅收效率 +${top?12:6}%`}:{name:'製造協調中心',amenity:0,trade:1,production:top?1.25:1.15,pollution:top?.75:.85,effect:`本棟合金產出 +${top?25:15}% · 污染 -${top?25:15}%`};
}
