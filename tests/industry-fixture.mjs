import {createCity} from '../SimCity/engine.mjs';
import {idx} from '../SimCity/catalog.mjs';

// Existing residential/retail corridor; the industrial lots share supplied roads
// and a real freight dock, but are farther from homes than the retail jobs.
export function industryFixture({lots=1,industry=true,freight=true,connected=true,adjacent=false}={}){
 const s=createCity({starter:false,seed:2263});
 Object.assign(s,{cash:200000,education:82,health:90,disasters:false,autoDevelopment:false,powerRenewal:true});
 const put=(x,y,type,level=1,pop=0)=>Object.assign(s.cells[idx(x,y)],{type,level,pop,age:36,wire:true,pipe:true});
 for(let x=100;x<=128;x++)put(x,25,'avenue');
 for(let y=25;y<=30;y++){put(117,y,'avenue');put(121,y,'avenue');}
 for(const [x,type]of [[100,'power'],[101,'water'],[102,'life'],[103,'radiator'],[104,freight?'dock':'park'],[105,'fire'],[106,'police'],[107,'hospital'],[108,'school']])put(x,24,type);
 const homes=[],shops=[],factories=[];
 for(let x=110;x<=113;x++){homes.push(idx(x,24));put(x,24,'R',4,120);for(const y of [26,27]){shops.push(idx(x,y));put(x,y,'c',4);}}
 if(adjacent)for(let y=25;y<=30;y++)put(113,y,'avenue');
 if(industry)for(let n=0;n<lots;n++){const x=(adjacent?114:118)+n%3,y=26+Math.floor(n/3);factories.push(idx(x,y));put(x,y,'i',1);}
 if(!connected){for(let y=25;y<=30;y++){s.cells[idx(117,y)].type=null;s.cells[idx(121,y)].type=null;}for(let x=116;x<=127;x++)Object.assign(s.cells[idx(x,25)],{type:null,wire:false,pipe:false});}
 s.highPopulation=480;return {s,homes,shops,factories};
}
