// The art sample reserves three large plots; each has one authoritative simulation building.
// This is a visual review district, not a new multi-tile growth system.
import {idx,xy,zoneOf} from './catalog.mjs';
export const ATELIER_LOTS=[
 {key:'residence',name:'曙光花園居所',subtitle:'TERRACE RESIDENCES',type:'R',x:22,y:27,anchor:idx(22,29),bounds:[20,24,25,29],height:9.1},
 {key:'commerce',name:'天際商業匯',subtitle:'SKYLINE EXCHANGE',type:'C',x:29,y:27,anchor:idx(29,29),bounds:[27,31,25,29],height:12.7},
 {key:'industry',name:'極光精密工坊',subtitle:'AURORA FABRICATION',type:'I',x:36,y:27,anchor:idx(36,29),bounds:[34,38,25,29],height:4.4}
];
export function lotAt(i){const [x,y]=xy(i);return ATELIER_LOTS.find(p=>x>=p.bounds[0]&&x<=p.bounds[1]&&y>=p.bounds[2]&&y<=p.bounds[3]);}
export function sampleWater(x,y){return x>=19.5&&x<=40.5&&y>=33.65&&y<=36.35&&!(x>=25&&x<=27)&&!(x>=35&&x<=37);}
export function reservedSample(i){const [x,y]=xy(i);return !!lotAt(i)||x>=19&&x<=41&&y>=31&&y<=38;}
export function prepareAtelier(s){
 s.artSample=true;s.cells.atelier=true;s.name='Yorktown · 晨光樣板';s.cash=180000;s.education=82;s.health=90;s.disasters=false;s.policies.green=true;s.powerRenewal=true;
 const put=(x,y,type,level=1,pop=0)=>Object.assign(s.cells[idx(x,y)],{type,level,pop,age:0,wire:true,pipe:true,enabled:true,upgrade:0,fire:0});
 for(let y=24;y<=40;y++)for(let x=18;x<=43;x++)put(x,y,null,0);
 for(let y=21;y<=39;y++)for(const x of [18,42])put(x,y,'avenue');
 for(let x=12;x<=42;x++)put(x,30,'avenue');
 for(let x=18;x<=42;x++)put(x,24,'road');
 for(let y=25;y<=30;y++)put(12,y,'road');
 for(const p of ATELIER_LOTS){const [x,y]=xy(p.anchor);put(x,y,p.type,5,p.type==='R'?150:0);}
 // Services remain on the existing utility grid, with real staff and operating costs.
 put(19,23,'park');put(21,23,'park');put(24,23,'park');put(30,23,'park');put(39,23,'park');
 put(19,29,'park');put(26,29,'park');put(32,29,'park');
 put(26,23,'school');put(32,23,'hospital');put(40,23,'radiator');put(41,23,'life');
 // Add connected housing to support the sample's high-density jobs.
 for(const y of [14,16])for(const x of [16,17,19,20,21,22,23,24,25,26]){const c=s.cells[idx(x,y)];if(zoneOf(c.type)==='R'){c.type='R';c.level=[3,4,5,4,5][x%5];c.pop=100;}}
 s.orbital.completed=8;s.orbital.sequence=8;s.orbital.visitorUnlocked=true;s.orbital.visitorCycle=0;
 for(const p of Object.values(s.orbital.projects))p.built=true;
 s.orbital.stock=[{alloy:180,parts:60},{alloy:120,parts:30}];s.highPopulation=s.cells.reduce((n,c)=>n+c.pop,0);
 s.events.unshift({month:s.month,text:'晨光樣板已預設三棟建築與巨構。可管理營運、推進月份、接單及在樣板用地外建造；展示地塊保留。',tone:'info'});return s;
}
