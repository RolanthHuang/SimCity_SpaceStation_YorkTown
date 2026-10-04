import {residentialBuilding} from './residential-architecture.mjs';
import {industrialBuilding} from './industrial-architecture.mjs';
import {commercialBuilding} from './commercial-architecture.mjs';
import {architecturePalette} from './branches.mjs';
import {stageHeight} from './evolution.mjs';

// Detail is bounded by the view, not by the total city population or plot count.
export function buildingDetailPlan(items,mode='build',previous=new Map()){
 const plan=new Map(items.map(p=>[p.i,0]));if(mode==='interior')return plan;
 const size=p=>p.pixels??3600/Math.max(1,p.distance);
 const nearby=items.filter(p=>p.visible!==false&&size(p)>=12).sort((a,b)=>Math.round((size(b)+(previous.get(b.i)===2?4:0))/12)-Math.round((size(a)+(previous.get(a.i)===2?4:0))/12)||a.distance-b.distance||a.i-b.i);
 let full=0,medium=0,fineTriangles=0,mediumTriangles=0;
 for(const p of nearby){const cost=p.detailCost||{fine:5000,medium:1700};if(size(p)>=(previous.get(p.i)===2?18:20)&&full<96&&fineTriangles+cost.fine<=900000){plan.set(p.i,2);full++;fineTriangles+=cost.fine;}else if(size(p)>=(previous.get(p.i)===1?12:16)&&medium<320&&mediumTriangles+cost.medium<=700000){plan.set(p.i,1);medium++;mediumTriangles+=cost.medium;}}
 return plan;
}
export const renderChunk=i=>`${Math.floor((i%536)/32)}:${Math.floor(Math.floor(i/536)/16)}`;
export function distantBuilding({x,y,c,add}){
 if(residentialBuilding({x,y,c,detail:0,occupied:false,add})||commercialBuilding({x,y,c,detail:0,occupied:false,add})||industrialBuilding({x,y,c,detail:0,occupied:false,add}))return;
 const w=(c.span||1)*.86,h=stageHeight(c)*(1+((c.span||1)-1)*.18),p=architecturePalette(c,x,y),z=c.type.toUpperCase();
 const b=(dx,dz,at,sx,sy,sz,color,role='ivory',shape='box')=>add(x+dx,y+dz,at,sx,sy,sz,color,shape,role);
 b(0,0,.16,w,.25,w,p.stone,'stone');
 // Keep recognizable branch massing while omitting subpixel facade hardware.
 const tower=(dx,dz,width,depth,height,sail=false)=>{
  b(dx,dz,.30+height/2,width,height,depth,p.glass,'window',sail?'sailLow':'box');
  b(dx+width*.45,dz,.30+height/2,.024,height,depth+.025,p.metal,'titanium');
  if(!sail)b(dx,dz,.31+height,width+.03,.035,depth+.04,p.white);
 };
 const ring=(at,scale,role='ivory')=>b(0,0,at,w*scale,.05,w*scale,role==='gold'?p.gold:p.white,role,'ringDeckLow');
 const bridge=at=>b(0,0,at,w*.81,.10,w*.20,p.white);

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
