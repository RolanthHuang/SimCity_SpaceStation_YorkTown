import {createTransit,planLink} from './maglev.mjs';
import {idx,zoneOf} from './catalog.mjs';
import {fuse} from './plots.mjs';
// A playable, pre-developed city reveals the different foundations immediately.
// Starting a blank or small settlement remains available in the save panel.
export function prepareLiving(s){
 s.artSample=false;s.cells.atelier=false;s.name='Yorktown · 晨光生長';s.cash=160000;s.education=82;s.health=90;s.disasters=false;s.autoDevelopment=true;s.policies.green=true;
 const put=(x,y,type,level=1,pop=0)=>Object.assign(s.cells[idx(x,y)],{type,level,pop,age:36,wire:true,pipe:true,fire:0,enabled:true,upgrade:0,preserve:false,plot:null,span:1,subplot:false});
 for(let y=24;y<=38;y++)for(let x=17;x<=45;x++)put(x,y,null,0);
 for(const y of [24,29,32,36])for(let x=17;x<=43;x++)put(x,y,'avenue');
 for(const x of [18,25,30,35,40,43])for(let y=21;y<=36;y++)if(s.cells[idx(x,y)].type===null)put(x,y,'road');
 const lot=(x,y,type,size,level,pop=0)=>{for(let r=0;r<size;r++)for(let c=0;c<size;c++)put(x+c,y+r,type,level,pop);fuse(s,idx(x,y),size);};
 lot(20,25,'R',4,5,100);lot(26,26,'c',3,5);lot(31,27,'i',2,5);lot(36,27,'r',2,4,45);
 lot(37,22,'power',2,2);lot(41,22,'water',2,2);lot(26,30,'school',2,2);lot(31,30,'hospital',2,2);
 lot(36,30,'radiator',2,2);lot(41,30,'life',2,2);
 put(22,31,'arcology',1,180);put(23,31,'park');put(21,31,'park');put(28,31,'park');put(33,31,'park');put(38,31,'park');
 put(31,34,'C',4);put(32,34,'C',4);put(31,35,'C',4);put(32,35,'C',4);
 for(const x of [20,21,22,23,26,27,28,36,37,38])put(x,35,'park');
 for(const p of Object.values(s.orbital.projects))p.built=true;
 s.orbital.completed=8;s.orbital.sequence=8;s.orbital.visitorUnlocked=true;s.orbital.visitorCycle=0;s.orbital.stock=[{alloy:1500,parts:600},{alloy:250,parts:80}];
 s.transit=createTransit();for(const [x,y] of [[19,24],[34,29]]){put(x,y,'station');s.cells[idx(x,y)].roadBase='avenue';}const line=planLink(s,idx(19,24),idx(34,29));if(line)s.transit.links.push(line);
 s.highPopulation=s.cells.reduce((n,c)=>n+c.pop,0);
 s.events=[{month:s.month,text:'晨光生長城市：4 × 4 住宅、3 × 3 商業、2 × 2 工業與公共設施園已建成。可繼續經營或拆改；普通分區會自行融合與進化。',tone:'good'}];return s;
}
