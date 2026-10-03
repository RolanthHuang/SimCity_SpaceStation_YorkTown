import {branchDefinition,architecturePalette} from './branches.mjs';
import {stageHeight} from './evolution.mjs';
import {towerDetails,sailProfile} from './facade-details.mjs';

// Distinct massing per branch; stage changes add public spaces and process systems.
export function branchBuilding({x=0,y=0,c,far=false,occupied=true,add,light=()=>{}}){
 const definition=branchDefinition(c);if(!definition||c.level<5)return false;
 const span=c.span||1,w=span-.10,t=c.level-5,h=stageHeight(c)*(1+(span-1)*.13),p=architecturePalette(c,x,y),z=c.type.toUpperCase();
 const b=(dx,dz,ht,sx,sy,sz,role='ivory',shape='box',colour)=>{add(x+dx,y+dz,ht,sx,sy,sz,colour??({ivory:p.white,stone:p.stone,titanium:p.metal,gold:p.gold,dark:p.dark,window:p.glass,glass:p.glass,pane:p.glass,leaf:p.leaf,red:p.accent}[role]||p.white),shape,role);if(shape==='dome'&&role==='glass'&&!far)add(x+dx,y+dz,ht,sx*1.003,sy*1.003,sz*1.003,p.metal,'domeFrame','titanium');};
 const slab=(ht,width,depth,dx=0,dz=0,role='ivory')=>{b(dx,dz,ht,width,.025,depth,role);b(dx,dz,ht-.024,width*.98,.018,depth*.98,'dark');};
 const shrub=(dx,dz,ht,size)=>{b(dx,dz,ht,size,.075,size,'leaf','foliage');if(!far)b(dx+size*.14,dz-size*.1,ht+.025,size*.72,.08,size*.72,'leaf','foliage',0x93ac67);};
 const ring=(ht,width,depth=width,thickness=.06,role='ivory',dx=0,dz=0)=>b(dx,dz,ht,width,thickness,depth,role,'ringDeck');
 const tower=(dx,dz,width,depth,height,base=.26,sail=false)=>{
  b(dx,dz,base+height/2,width,height,depth,'window',sail?'sail':'box');
  const floors=Math.max(3,Math.round(height/.16)),stride=far?Math.max(1,Math.ceil(floors/6)):1;
  for(let k=0;k<=floors;k+=stride){const q=sail?sailProfile(Math.min(.985,k/floors)):{center:0,width:1};b(dx+width*q.center,dz,base+k*height/floors,width*q.width+.012,.014,depth+.018,k%4===0?'ivory':'titanium');}
  if(sail)b(dx+width*.49,dz,base+height*.5,.017,height,depth+.028,'titanium');
  else for(const side of [-1,1])b(dx+side*width*.47,dz,base+height*.42,.016,height*.82,depth+.025,'titanium');
  towerDetails({x,y,dx,dz,width,depth,height,base,palette:p,zone:z,sail,occupied,far,footprint:span,add,light});
 };
 const bridge=(ht,width,depth,dx=0,dz=0)=>{slab(ht,width,depth,dx,dz);b(dx,dz,ht+.075,width*.98,.12,depth*.93,'glass');slab(ht+.145,width+.016,depth+.016,dx,dz);};
 const tank=(dx,dz,base,width,height)=>{b(dx,dz,base+height/2,width,height,width,'window','cylinder');for(const u of [0,.5,1])b(dx,dz,base+u*height,width+.02,.022,width+.02,'titanium','ringDeck');if(!far)for(const side of [-1,1]){b(dx+side*width*.38,dz,base+height/2,.017,height,.02,'gold');b(dx+side*width*.22,dz+width*.40,base+height*.55,.022,height*.56,.028,'titanium');b(dx+side*width*.22,dz+width*.42,base+height*.80,.039,.050,.012,'pane');}};
 slab(.10,w,w,0,0,'stone');b(0,0,.19,w*.91,.17,w*.87,'window');slab(.285,w*.97,w*.94);

 if(z==='R'&&c.branch==='garden'){
  for(let k=0;k<4;k++){const a=k*Math.PI/2+.4,dx=Math.cos(a)*w*.29,dz=Math.sin(a)*w*.29;tower(dx,dz,w*.23,w*.22,h*(.62+(k%2)*.18));}
  for(let k=0;k<2+t;k++){const ht=.35+h*(.15+k*.18);ring(ht,w*(.91-k*.035),w*(.86-k*.035),.05);ring(ht+.10,w*(.88-k*.035),w*(.83-k*.035),.12,'window');if(!far)for(let j=0;j<6;j++){const a=j*Math.PI/3;shrub(Math.cos(a)*w*.39,Math.sin(a)*w*.36,ht+.19,w*.095);}}
  b(0,0,.38,w*.35,.24,w*.35,'glass','dome');if(t>=2)b(0,0,h*.72,w*.38,.025,w*.37,'gold','ringDeck');if(t===3){b(-w*.34,-w*.29,h*.85,w*.13,h*.5,w*.10,'ivory','sail');b(w*.34,w*.29,h*.85,w*.13,h*.5,w*.10,'ivory','sail');}
 }else if(z==='R'&&c.branch==='civic'){
  const levels=2+t;
  for(let k=0;k<levels;k++){const ht=.29+k*h/levels,side=k%2?-1:1;const depth=w*(k%2?.29:.33);tower(side*w*.17,-w*.21,w*.53,depth,h/levels*.75,ht);tower(-side*w*.24,w*.17,w*.22,w*.53,h/levels*.7,ht);slab(ht+h/levels*.82,w*.85,w*.18,0,w*.29);b(0,w*.29,ht+h/levels*.87,w*.76,.035,w*.14,'red');if(k>0)bridge(ht,w*.58,w*.16,0,w*.05);if(!far)for(const dx of [-w*.27,w*.27])shrub(dx,w*.30,ht+h/levels*.96,w*.13);}
  if(t>=1)b(0,0,.34,w*.31,.12,w*.25,'glass','dome');if(t>=2)bridge(h*.67,w*.89,w*.17,0,-w*.28);if(t===3)ring(h+.25,w*.69,w*.60,.035,'gold');
 }else if(z==='R'&&c.branch==='research'){
  tower(-w*.24,-w*.1,w*.24,w*.38,h,.28,true);tower(w*.24,-w*.02,w*.24,w*.38,h*.82,.28,true);
  tower(0,-w*.3,w*.16,w*.22,h*.62);bridge(h*.38,w*.69,w*.17,0,w*.06);
  b(0,-w*.03,h*.76,w*.58,h*.32,w*.06,'gold','ring');if(t>=1)b(0,w*.16,h*.55,w*.42,.10,w*.32,'glass','dome');if(t>=2)bridge(h*.65,w*.75,w*.16,0,-w*.1);if(t===3)ring(h*.83,w*.86,w*.71,.035,'titanium');
 }else if(z==='C'&&c.branch==='market'){
  for(const side of [-1,1])tower(side*w*.30,-w*.10,w*.22,w*.60,h*.55);
  for(let k=0;k<3;k++){const dx=(k-1)*w*.27;b(dx,w*.31,.44,w*.23,.18,w*.20,'window');b(dx,w*.27,.61,w*.25,.10,w*.28,'gold','vault');b(dx,w*.37,.45,w*.21,.32,.024,'gold','arch');}
  for(let k=0;k<=t;k++)bridge(.39+h*(.24+k*.14),w*.72,w*.16,0,-w*.23+k*w*.10);
  if(t>=1)ring(h*.57+.33,w*.87,w*.77,.045,'gold');if(t>=2)b(0,0,h*.64+.32,w*.51,h*.25,w*.50,'glass','dome');if(t===3)for(const dx of [-w*.27,w*.27])shrub(dx,w*.28,h*.57+.46,w*.17);
 }else if(z==='C'&&c.branch==='finance'){
  tower(-w*.24,-w*.10,w*.28,w*.38,h,.28,true);tower(w*.24,-w*.04,w*.27,w*.37,h*.88,.28,true);
  b(0,-w*.07,h*.78,w*.72,h*.40,w*.10,'gold','arch');bridge(h*.31,w*.66,w*.18,0,w*.05);
  if(t>=1)bridge(h*.57,w*.74,w*.22,0,-w*.09);if(t>=2){ring(h*.48,w*.91,w*.69,.045,'gold');b(0,0,h*.48+.12,w*.33,.24,w*.25,'glass','dome');}if(t===3){b(0,-w*.04,h+.13,w*.55,.20,w*.35,'gold','dome');bridge(h*.75,w*.70,w*.14,0,w*.17);}
 }else if(z==='C'&&c.branch==='innovation'){
  b(0,0,.39+h*.19,w*.60,h*.39,w*.55,'glass','dome');for(const dx of [-w*.31,w*.31])tower(dx,-w*.18,w*.21,w*.32,h*(dx<0?.78:1),.28,true);
  for(let k=0;k<=t;k++){const ht=.40+h*(.19+k*.16);ring(ht,w*.91,w*.75,.042,'titanium');b(0,w*.30,ht+.08,w*.62,.13,w*.11,'window');b(0,w*.31,ht+.15,w*.65,.019,w*.13,'red');}
  if(t>=2)bridge(h*.70,w*.78,w*.19,0,-w*.10);if(t===3)b(0,0,h*.86,w*.51,.35,w*.40,'glass','dome');
 }else if(z==='I'&&c.branch==='logistics'){
  b(-w*.06,0,.37+h*.18,w*.76,h*.36,w*.57,'dark');b(-w*.06,0,.38+h*.43,w*.81,h*.20,w*.62,'titanium','vault');
  const gantries=1+t;for(let k=0;k<gantries;k++){const dz=(k-(gantries-1)/2)*w*.19;for(const dx of [-w*.41,w*.41])b(dx,dz,.30+h*.43,w*.045,h*.86,w*.065,'red');b(0,dz,.31+h*.86,w*.89,.05,w*.08,'gold');if(!far){b(w*.12,dz,.27+h*.67,.008,h*.30,.008,'dark');b(w*.12,dz,.27+h*.50,.07,.05,.065,'gold');}}
  if(!far)for(let k=0;k<3+t;k++)b(-w*.33+k*w*.66/(2+t),w*.36,.25,w*.13,.21,w*.17,'red');
  if(t>=2)b(w*.22,-w*.16,.39+h*.51,w*.23,h*.48,w*.32,'glass','sail');if(t===3)bridge(.38+h*.39,w*.84,w*.15,0,w*.21);
 }else if(z==='I'&&c.branch==='precision'){
  tower(-w*.24,-w*.08,w*.29,w*.50,h*.85);tower(w*.24,w*.08,w*.27,w*.41,h);
  for(let k=0;k<2+t;k++){const dx=-w*.31+k*w*.62/(1+t);tank(dx,w*.29,.30,w*.12,.20+h*.19);}
  bridge(.30+h*.36,w*.76,w*.18);b(0,-w*.09,.35+h*.77,w*.69,h*.30,w*.06,'titanium','arch');
  if(t>=1)ring(.32+h*.59,w*.82,w*.64,.04,'gold');if(t>=2)bridge(.35+h*.72,w*.84,w*.13,0,-w*.12);if(t===3)b(0,0,h*.89,w*.35,.33,w*.31,'glass','dome');
 }else if(z==='I'&&c.branch==='circular'){
  const n=4+t;for(let k=0;k<n;k++){const a=k*Math.PI*2/n,dx=Math.cos(a)*w*.30,dz=Math.sin(a)*w*.30;tank(dx,dz,.29,w*.18,h*(.53+(k%2)*.15));if(!far)shrub(dx,dz,.32+h*(.53+(k%2)*.15),w*.14);}
  b(0,0,.38+h*.22,w*.38,h*.38,w*.38,'glass','dome');for(let k=0;k<2+t;k++)ring(.33+h*(.16+k*.17),w*.88,w*.82,.043,k%2?'gold':'titanium');
  if(t>=2)b(0,0,.36+h*.61,w*.40,.09,w*.38,'leaf','foliage');if(t===3)b(0,0,.43+h*.78,w*.43,h*.20,w*.42,'glass','dome');
 }
 if(!far){
  b(0,w*.43,.24,w*.16,.18,.016,'dark');slab(.34,w*.31,w*.15,0,w*.38);b(0,w*.43,.37,w*.29,.019,.024,'red');
  for(const side of [-1,1]){b(side*w*.08,w*.444,.24,.012,.19,.028,'gold');b(side*w*.115,w*.37,.20,.013,.27,.020,'titanium');b(side*w*.25,w*.39,.155,w*.09,.050,.08,'stone');b(side*w*.25,w*.40,.19,w*.09,.019,.09,'gold');}
  b(0,w*.449,.25,w*.14,.15,.008,'pane');b(0,w*.442,.315,w*.18,.012,.018,'gold');
  for(const dx of [-w*.39,w*.39]){b(dx,w*.36,.20,w*.14,.10,w*.16,'stone');if(z!=='I'||c.branch==='circular')shrub(dx,w*.36,.30,w*.15);}
  if(occupied)for(const dx of [-w*.11,w*.11])light({x:x+dx,y:y+w*.44,h:.26,sx:w*.06,sy:.055,sz:.007,color:0xf0cf9e});
 }
 return true;
}
