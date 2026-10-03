import {architecturePalette} from './branches.mjs';
import {stageHeight} from './evolution.mjs';

// Detail is bounded by the view, not by the total city population or plot count.
export function buildingDetailPlan(items,mode='build',previous=new Map()){
 const plan=new Map(items.map(p=>[p.i,0]));if(mode==='interior')return plan;
 const size=p=>p.pixels??3600/Math.max(1,p.distance);
 const nearby=items.filter(p=>p.visible!==false&&size(p)>=12).sort((a,b)=>Math.round((size(b)+(previous.get(b.i)===2?4:0))/12)-Math.round((size(a)+(previous.get(a.i)===2?4:0))/12)||a.distance-b.distance||a.i-b.i);
 let full=0,medium=0;
 for(const p of nearby){if(size(p)>=(p.hero?20:previous.get(p.i)===2?24:28)&&full<96){plan.set(p.i,2);full++;}else if(size(p)>=(previous.get(p.i)===1?12:16)&&medium<320){plan.set(p.i,1);medium++;}}
 return plan;
}
export const renderChunk=i=>`${Math.floor((i%536)/32)}:${Math.floor(Math.floor(i/536)/16)}`;
export function distantBuilding({x,y,c,add}){
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
 if(c.level>=5&&c.branch){
  if(z==='R'&&c.branch==='garden'){
   for(let k=0;k<4;k++){const a=k*Math.PI/2+.4;tower(Math.cos(a)*w*.29,Math.sin(a)*w*.29,w*.23,w*.22,h*(.62+k%2*.18));}
   ring(.30+h*.24,.94);ring(.30+h*.58,.86);b(0,w*.32,.35+h*.58,w*.55,.07,w*.16,p.leaf,'leaf','foliage');return;
  }else if(z==='R'&&c.branch==='civic'){
   for(let k=0;k<3;k++){const at=.30+k*h*.28,side=k%2?-1:1;b(side*w*.15,-w*.2,at+h*.105,w*.60,h*.21,w*.32,p.glass,'window');b(side*w*.15,-w*.2,at+h*.22,w*.65,.06,w*.35,p.accent,'red');b(-side*w*.24,w*.15,at+h*.105,w*.22,h*.21,w*.55,p.white);}
   bridge(.30+h*.58);return;
  }else if(z==='R'&&c.branch==='research'||z==='C'&&c.branch==='finance'){
   tower(-w*.24,-w*.1,w*.28,w*.38,h,true);tower(w*.24,0,w*.27,w*.37,h*.84,true);bridge(.30+h*.37);
   b(0,0,.30+h*.78,w*.69,h*.37,w*.08,p.gold,'gold',z==='C'?'archLow':'ringLow');if(c.level>=7)ring(.30+h*.55,.91,'gold');return;
  }else if(z==='C'&&c.branch==='market'){
   tower(-w*.30,-w*.1,w*.22,w*.60,h*.55);tower(w*.30,-w*.1,w*.22,w*.60,h*.55);
   for(let k=0;k<3;k++)b((k-1)*w*.27,w*.27,.63,w*.25,.13,w*.28,p.gold,'gold','vaultLow');bridge(.30+h*.42);ring(.30+h*.58,.88,'gold');return;
  }else if(z==='C'&&c.branch==='innovation'){
   tower(-w*.31,-w*.18,w*.21,w*.32,h*.78,true);tower(w*.31,-w*.18,w*.21,w*.32,h,true);
   b(0,0,.35+h*.2,w*.61,h*.40,w*.56,p.glass,'glass','domeLow');ring(.40+h*.3,.92);ring(.40+h*.66,.84);return;
  }else if(z==='I'&&c.branch==='logistics'){
   b(0,0,.30+h*.20,w*.76,h*.4,w*.57,p.dark,'dark');b(0,0,.30+h*.48,w*.81,h*.20,w*.62,p.metal,'titanium','vaultLow');
   for(const dz of [-w*.22,w*.22]){for(const dx of [-w*.41,w*.41])b(dx,dz,.30+h*.43,w*.045,h*.86,w*.07,p.accent,'red');b(0,dz,.30+h*.86,w*.89,.06,w*.08,p.gold,'gold');}return;
  }else if(z==='I'&&c.branch==='precision'){
   tower(-w*.24,-w*.08,w*.29,w*.50,h*.85);tower(w*.24,w*.08,w*.27,w*.41,h);bridge(.30+h*.36);ring(.32+h*.59,.83,'gold');b(0,0,.35+h*.77,w*.69,h*.30,w*.06,p.metal,'titanium','archLow');return;
  }else if(z==='I'&&c.branch==='circular'){
   for(let k=0;k<4;k++){const a=k*Math.PI/2;b(Math.cos(a)*w*.30,Math.sin(a)*w*.30,.30+h*.30,w*.21,h*.60,w*.21,p.glass,'window','cylinderLow');}
   b(0,0,.38+h*.22,w*.4,h*.4,w*.4,p.glass,'glass','domeLow');ring(.35+h*.22,.89);ring(.35+h*.58,.85,'gold');b(0,0,.43+h*.68,w*.43,.1,w*.42,p.leaf,'leaf','foliage');return;
  }
 }

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
