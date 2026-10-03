import {idx,xy,terrain,deckOf,zoneOf} from './catalog.mjs';
import {fuse} from './plots.mjs';
import {createCity,build} from './engine.mjs';
import {createTransit,planLink} from './maglev.mjs';
import {lineDrag,emptyContinuum} from './continuum.mjs';

// A single composed main district replaces the two concatenated demo layouts.
// This constructor runs only for new demonstration cities, never imported saves.
export const DEMO_BLUEPRINT={
 name:'晨光中軸街區',core:{x:25,y:17,w:39,h:20},
 landmarks:{sail:idx(34,18),shell:idx(34,26),line:idx(49,18),garden:idx(43,27)},
 representatives:{residential:idx(26,26),commercial:idx(43,18),industrial:idx(55,26)},
 expansion:{west:idx(8,31),east:idx(68,31)},
 camera:{x:40,y:27,distance:48,pitch:.56,yaw:.43,aim:2.6}
};
export function prepareContinuum(s){
 const start=s.cash,blank=createCity({starter:false});
 for(let i=0;i<s.cells.length;i++)if(terrain(i)&&deckOf(i)===0)s.cells[i]=blank.cells[i];
 s.continuum=emptyContinuum();s.transit=createTransit();s.artSample=false;s.cells.atelier=false;
 s.education=82;s.health=90;s.disasters=false;s.autoDevelopment=true;s.powerRenewal=true;s.policies.green=true;
 s.cash=1e6;s.highPopulation=5000;
 const put=(x,y,type,level=1,pop=0)=>Object.assign(s.cells[idx(x,y)],{type,level,pop,age:36,wire:!!type,pipe:!!type,enabled:true,fire:0,plot:null,span:1,subplot:false});
 const road=(x,y,type='road')=>{if(!s.cells[idx(x,y)].type)put(x,y,type);};
 const hroad=(y,x0,x1,type='road')=>{for(let x=x0;x<=x1;x++)road(x,y,type);};
 const vroad=(x,y0,y1,type='road')=>{for(let y=y0;y<=y1;y++)road(x,y,type);};
 const lot=(x,y,type,size,level,pop=0,branch=null)=>{
  for(let dy=0;dy<size;dy++)for(let dx=0;dx<size;dx++){
   if(s.cells[idx(x+dx,y+dy)].type)throw new Error(`示範地基衝突：${x+dx}, ${y+dy}`);
   put(x+dx,y+dy,type,level,pop);if(branch)Object.assign(s.cells[idx(x+dx,y+dy)],{branch,growthMonths:0,branchCooldown:18});
  }
  if(!fuse(s,idx(x,y),size))throw new Error('示範融合地基不完整。');
 };
 // The central avenue, cultural promenade and end stubs form readable expansion axes.
 hroad(24,8,68,'avenue');hroad(31,8,68,'avenue');hroad(17,12,63,'avenue');hroad(36,12,63,'road');
 hroad(15,9,25,'avenue');vroad(12,15,36);vroad(25,15,36);vroad(33,17,36);vroad(40,17,36);vroad(48,17,36);vroad(63,17,36);
 vroad(30,24,31);vroad(54,24,36);vroad(58,29,36);vroad(59,17,24);hroad(29,58,62);hroad(30,55,57);vroad(58,25,26);road(58,28);
 hroad(21,19,24);vroad(19,21,24);hroad(25,15,24);
 hroad(23,42,46);vroad(42,24,31);vroad(49,24,36);
 // Both public atria face the avenue/promenade, with their entrances unobstructed.
 const sail=build(s,[DEMO_BLUEPRINT.landmarks.sail],'sail');if(!sail.ok)throw new Error(sail.error);s.cells[DEMO_BLUEPRINT.landmarks.sail].pop=300;
 const shell=build(s,[DEMO_BLUEPRINT.landmarks.shell],'shell');if(!shell.ok)throw new Error(shell.error);
 const drag=lineDrag(idx(49,18),idx(58,18)),line=build(s,drag.cells,'line');if(!line.ok)throw new Error(line.error);s.cells[drag.anchor].pop=160;
 // Housing leads from smaller harbour blocks to terraced gardens and research living.
 lot(16,18,'r',3,3,35);lot(26,18,'r',3,5,55,'civic');lot(26,22,'r',2,3,25);
 lot(26,26,'R',4,6,120,'garden');lot(26,33,'r',3,5,45,'research');
 lot(43,33,'r',3,4,30);lot(50,33,'R',3,5,140,'research');put(20,22,'arcology',1,180);
 // Jobs, goods and civic activity share short connected streets, not detached sample pads.
 lot(43,18,'c',3,6,0,'finance');lot(43,21,'c',2,4);lot(50,26,'c',3,5,0,'innovation');
 lot(55,26,'i',3,6,0,'precision');lot(59,26,'i',3,5,0,'circular');
 put(14,14,'dock');put(15,14,'fabricator');put(60,37,'dock');put(59,37,'fabricator');
 // A compact utility/civic campus is fully supplied but outside the central sightline.
 hroad(28,15,24);hroad(32,15,24);for(const x of [15,18,21,24])vroad(x,28,36);
 lot(16,29,'power',2,2);lot(19,29,'water',2,2);lot(22,29,'life',2,2);
 lot(16,33,'radiator',2,2);
 lot(20,18,'school',2,1);lot(41,21,'school',2,1);lot(55,33,'school',2,1);
 lot(20,26,'hospital',2,1);lot(41,33,'hospital',2,1);lot(50,29,'hospital',2,1);
 put(19,27,'fire');put(22,27,'police');put(41,29,'fire');put(41,28,'police');
 put(60,30,'fire');put(62,30,'police');
 // Continuous green edges, rather than unrelated single park objects, frame each block.
 for(const [x,y]of [[43,26],[43,30],[44,30],[45,30],[46,30]])put(x,y,'park');
 const anchor=DEMO_BLUEPRINT.landmarks.garden,cells=[];
 for(let dy=0;dy<3;dy++)for(let dx=0;dx<3;dx++){const i=idx(43+dx,27+dy);put(43+dx,27+dy,'park');cells.push(i);Object.assign(s.cells[i],{plot:anchor,span:3});}
 s.continuum.gardens[anchor]={stage:3,span:3,cells,health:1,stable:0,stress:0};
 for(const [y,x0,x1]of [[23,26,28],[23,34,38],[23,43,46],[30,26,29],[30,50,52],[32,26,28],[32,43,45],[32,50,52]])for(let x=x0;x<=x1;x++)if(!s.cells[idx(x,y)].type)put(x,y,'park');
 for(const x of [32,39,47])for(let y=18;y<=30;y++)if(!s.cells[idx(x,y)].type)put(x,y,'park');
 for(let y=26;y<=29;y++)put(31,y,'park');
 for(let x=55;x<=62;x++)if(!s.cells[idx(x,25)].type)put(x,25,'park');
 put(58,27,'park');for(let y=26;y<=28;y++)put(62,y,'park');
 for(let x=55;x<=57;x++)put(x,29,'park');
 // Keep local service lanes, but give busy residential and harbour routes boulevard capacity.
 for(let i=0;i<s.cells.length;i++){const [x,y]=xy(i);if(s.cells[i].type==='road'&&!(deckOf(i)===0&&x>=15&&x<=24&&y>28))s.cells[i].type='avenue';}
 put(24,23,'bus');put(49,23,'bus');s.policies.transit=true;
 // Actual stops serve both the older portal/harbour and the new core's commute.
 for(const [x,y]of [[25,24],[25,31],[48,24],[63,31]]){const c=s.cells[idx(x,y)];put(x,y,'station');c.roadBase='avenue';}
 for(const [a,b]of [[idx(25,24),idx(48,24)],[idx(25,31),idx(48,24)],[idx(48,24),idx(63,31)]]){const l=planLink(s,a,b);if(l)s.transit.links.push(l);}
 for(const p of Object.values(s.orbital.projects))Object.assign(p,{built:true,enabled:true});
 s.orbital.completed=8;s.orbital.sequence=8;s.orbital.visitorUnlocked=true;s.orbital.visitorCycle=0;s.orbital.stock=[{alloy:300,parts:100},{alloy:200,parts:80}];
 s.cash=start;s.highPopulation=s.cells.reduce((n,c)=>n+c.pop,0);s.name='Yorktown · 晨光中軸街區';
 s.events=[{month:s.month,tone:'good',text:'晨光中軸街區：中央大道串起住宅庭院、星帆塔、文化廣場、商業核心與船塢工坊。西端與東端預留擴建，既有城市存檔不受改動。'}];
 return s;
}
