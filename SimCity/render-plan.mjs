import {architecturePalette} from './branches.mjs';
import {stageHeight} from './evolution.mjs';

// Detail is bounded by the view, not by the total city population or plot count.
export function buildingDetailPlan(items,mode='build'){
 const plan=new Map(items.map(p=>[p.i,0]));if(mode==='overview')return plan;
 const nearby=items.filter(p=>p.distance<80).sort((a,b)=>a.distance-b.distance||a.i-b.i);
 let full=0,medium=0;
 for(const p of nearby){if(p.distance<36&&full<80){plan.set(p.i,2);full++;}else if(medium<320){plan.set(p.i,1);medium++;}}
 return plan;
}
export const renderChunk=i=>`${Math.floor((i%536)/32)}:${Math.floor(Math.floor(i/536)/16)}`;
export function distantBuilding({x,y,c,add}){
 const w=(c.span||1)*.86,h=stageHeight(c)*(1+((c.span||1)-1)*.18),p=architecturePalette(c,x,y),z=c.type.toUpperCase();
 const b=(dx,dz,at,sx,sy,sz,color,role='ivory')=>add(x+dx,y+dz,at,sx,sy,sz,color,'box',role);
 b(0,0,.16,w,.25,w,p.stone,'stone');
 const towers=z==='I'?2:c.branch==='civic'||c.branch==='market'?3:2;
 for(let j=0;j<towers;j++){
  const dx=(j-(towers-1)/2)*w*.37,ht=h*(z==='I'?.40+.22*j:1-j*.22),sx=w/(towers+1),sz=w*.55;
  b(dx,0,.30+ht/2,sx,ht,sz,p.glass,'window');b(dx,0,.31+ht,sx+.06,.065,sz+.08,p.white);
  b(dx-sx*.46,0,.30+ht/2,.045,ht,sz+.04,p.metal,'titanium');
 }
 if(c.level>=5){const at=.30+h*.58;b(0,0,at,w*.91,.10,w*.32,p.gold,'gold');}
 if(c.branch==='garden'||c.branch==='circular')b(0,w*.28,.37,w*.85,.08,w*.17,0x718f75,'leaf');
 if(c.branch==='research'||c.branch==='innovation'||c.branch==='precision')b(w*.12,0,h+.40,.10,.35,.10,p.gold,'gold');
}
