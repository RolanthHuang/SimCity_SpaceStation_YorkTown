import {architecturePalette,branchDefinition} from './branches.mjs';
import {stageHeight} from './evolution.mjs';

// A single authored pipeline feeds main city, medium/distant LOD and the gallery.
export function commercialBuilding({x=0,y=0,c,detail=2,occupied=true,add,light=()=>{}}){
 if(c.type?.toUpperCase()!=='C'||c.level<5||!branchDefinition(c))return false;
 const t=Math.min(3,c.level-5),span=c.span||1,w=span-.10,h=stageHeight(c)*(1+(span-1)*.13),p=architecturePalette(c,x,y),near=detail===2,medium=detail>=1;
 const colors={ivory:p.white,stone:p.stone,titanium:p.metal,gold:p.gold,dark:p.dark,window:p.glass,glass:p.glass,pane:p.glassLight,red:p.accent,leaf:p.leaf};
 const b=(dx,dz,ht,sx,sy,sz,role='ivory',shape='box',color)=>add(x+dx,y+dz,ht,sx,sy,sz,color??colors[role],shape,role);
 const slab=(dx,dz,at,width,depth,role='ivory')=>{b(dx,dz,at,width,.035,depth,role);if(near)b(dx,dz,at-.026,width*.986,.014,depth*.986,'dark');};
 const tree=(dx,dz,at,size)=>{b(dx,dz,at+.015,size,.028,size,'stone');b(dx,dz,at+size*.31,size*.035,size*.58,size*.035,'dark','cylinder');b(dx,dz,at+size*.73,size*.63,size*.70,size*.63,'leaf','foliage');if(near)b(dx+size*.16,dz,at+size*.81,size*.52,size*.55,size*.54,'leaf','foliage',0x8f9e68);};
 const facade=(dx,dz,at,width,depth,height,rows=4)=>{
  b(dx,dz,at+height/2,width,height,depth,'window');
  const n=near?rows:2;for(let k=0;k<=n;k++){const y=at+k*height/n;slab(dx,dz,y,width+.012,depth+.012,k===n?'ivory':'titanium');}
  if(near){const bays=Math.min(12,Math.max(3,Math.round(width/.17)));for(const side of [-1,1])for(let j=0;j<=bays;j++)b(dx-width/2+j*width/bays,dz+side*(depth*.5+.013),at+height/2,.009,height,.020,'titanium');}
 };
 if(detail===0){
  b(0,0,.15,w,.23,w,'stone');
  if(c.branch==='finance'){
   const H=h*1.25;b(0,0,.28,w*.85,.25,w*.76,'window');b(0,0,.41,w*.88,.04,w*.80);
   b(0,-w*.025,.40+H/2,w*.88,H,w*.88,'window','exchangeCoreFar');b(0,-w*.025,.40+H/2,w*.88,H,w*.88,'gold',`helix${t}deckFar`);
   b(0,-w*.025,.40+H+.08,w*.035,.16,w*.035,'gold');b(0,w*.38,.22,w*.18,.18,.02,'dark');
   if(t>=2)b(-w*.29,w*.21,.42+H*.075,w*.22,H*.15,w*.34,'window');
   if(t===3)b(0,w*.25,.68+H*.12,w*.76,.045,w*.24,'ivory');
  }else if(c.branch==='market'){
   const top=.30+h*.59;
   for(const side of [-1,1])b(side*w*.32,-w*.05,.17+h*.28,w*.24,h*.56,w*.52,'window');
   b(0,-w*.31,.17+h*.28,w*.73,h*.56,w*.20,'window');b(0,-w*.31,top,w*.77,.04,w*.24);
   for(const [dx,dz,y,sx,sz]of [[0,-.10,top+.17,.54,.61],[-.29,.08,top*.78+.13,.33,.57],[.29,.08,top*.78+.13,.33,.57],...(t>=2?[[-.23,-.29,top+.23,.37,.37]]:[]),...(t===3?[[.23,-.29,top+.29,.37,.37]]:[])])b(w*dx,w*dz,y,w*sx,h*.37,w*sz,'red','marketShellFar');
   b(0,w*.31,.27,w*.83,.24,w*.21,'window');for(let k=0;k<3;k++)b((k-1)*w*.27,w*.405,.32,w*.24,.26,.035,'red','archLow');
   b(0,0,.165,w*.23,.018,w*.31,'glass');
  }else{
   const H=h*1.08,deck=.16+H*.55;
   for(const side of [-1,1])b(side*w*.36,0,.16+H*.56,w*.18,H*1.1,w*.25,'ivory','bridgePylon');
   b(0,0,deck+H*.10,w*.86,H*.20,w*.32,'window');b(0,0,deck+H*.20+.04,w*.88,.04,w*.38,'stone');
   for(let k=0;k<2+t;k++)b((k-(1+t)/2)*w*.62/(1+t),0,deck-H*(.13+k%2*.045),w*.15,H*.19,w*.23,'window','bridgePodFar');
   b(0,0,.19,w*.73,.035,w*.74,'stone');b(0,-w*.30,.365,w*.52,.27,w*.16,'window');
   if(t>=2)b(0,0,deck+H*.20+.25,w*.60,t===3?.40:.20,w*.22,'glass');
  }
  return true;
 }
 slab(0,0,.095,w,w,'stone');
 if(c.branch==='finance'){
  // Crystal ovoid, continuous inhabited helical ribbon and a faceted crown.
  const base=.40,H=h*1.25,coreW=w*.88;
  facade(0,0,.16,w*.83,w*.75,.25,2);slab(0,0,.405,w*.90,w*.84);
  b(0,-w*.025,base+H/2,coreW,H,coreW,'window',near?'exchangeCore':'exchangeCoreLow');
  b(0,-w*.025,base+H/2,coreW,H,coreW,'gold',near?'exchangeLattice':'exchangeLatticeLow');
  b(0,-w*.025,base+H/2,coreW,H,coreW,'ivory',`helix${t}deck${near?'':'Low'}`);
  if(medium)b(0,-w*.025,base+H/2,coreW,H,coreW,'gold',`helix${t}edge${near?'':'Low'}`);
  if(near){b(0,-w*.025,base+H/2,coreW,H,coreW,'glass',`helix${t}glass`);b(0,-w*.025,base+H/2,coreW,H,coreW,'titanium','exchangeFloors');}
  b(0,-w*.025,base+H+.04,w*.055,.10,w*.055,'titanium','bridgePod');
  b(0,-w*.025,base+H+.13,.009,.18,.009,'gold');
  if(t>=1){slab(w*.25,w*.24,.54,w*.31,w*.35);if(medium)tree(w*.25,w*.24,.56,w*.19);}
  if(t>=2){facade(-w*.29,w*.21,.41,w*.22,w*.34,H*.15,3);slab(-w*.29,w*.21,.42+H*.15,w*.23,w*.35,'gold');}
  if(t===3){slab(0,w*.25,.68+H*.12,w*.76,w*.24);if(medium)for(const dx of [-w*.26,0,w*.26])tree(dx,w*.28,.72+H*.12,w*.12);}
  if(near){for(const side of [-1,1]){for(let j=0;j<20;j++)b(-w*.37+j*w*.039,side*w*.386,.275,.010,.23,.018,'ivory');for(let j=0;j<6;j++)b(side*w*.16,-w*.20+j*w*.074,.442,w*.10,.027,w*.050,'stone');}for(let k=0;k<12;k++){b(-w*.25+k*w*.046,w*.416,.43,.010,.16,.009,'gold');b(-w*.25+k*w*.046,w*.416,.51,w*.046,.011,.009,'gold');}}
 }else if(c.branch==='market'){
  // Set-back galleries frame an open courtyard; evolved roofs multiply and unfold.
  const floors=2+t,step=h*.59/floors,top=.30+h*.59;
  for(let k=0;k<floors;k++){
   const at=.17+k*step,depth=w*(.29-k*.025),dx=w*(.32-k*.016);
   for(const side of [-1,1]){facade(side*dx,-w*.05,at,w*.24,depth*1.8,step*.76,2);slab(side*dx,-w*.05,at+step*.82,w*.28,depth*1.88,'stone');}
   facade(0,-w*.31+k*w*.025,at,w*.73,w*.20,step*.78,2);
   if(medium){b(0,-w*.30,at+step*.88,w*.74,.025,.02,'gold');for(const side of [-1,1])b(side*w*.20,w*.07,at+step*.81,w*.11,.025,w*.25,'ivory');}
  }
  const roofs=[{dx:0,dz:-.10,at:top+.17,width:.54,depth:.61},{dx:-.29,dz:.08,at:top*.78+.13,width:.33,depth:.57},{dx:.29,dz:.08,at:top*.78+.13,width:.33,depth:.57}];
  if(t>=2)roofs.push({dx:-.23,dz:-.29,at:top+.23,width:.37,depth:.37});if(t===3)roofs.push({dx:.23,dz:-.29,at:top+.29,width:.37,depth:.37});
  for(const [j,r]of roofs.entries()){
   b(w*r.dx,w*r.dz,r.at,w*r.width,h*.37,w*r.depth,j%2?'ivory':'red',near?'marketShell':'marketShellLow');
   if(near)b(w*r.dx,w*r.dz,r.at,w*r.width,h*.37,w*r.depth,'gold','marketRibs');
   b(w*r.dx,w*(r.dz+r.depth*.41),(r.at+.18)/2,.026,r.at-.18,.026,'titanium');
  }
  // Broad entrance arcade and terracotta piers, not a central management tower.
  facade(0,w*.31,.16,w*.83,w*.21,.24,2);
  for(let k=0;k<3;k++){const dx=(k-1)*w*.27;b(dx,w*.405,.32,w*.24,.26,.035,'red','arch');if(near){b(dx,w*.397,.20,w*.16,.20,.009,'pane');b(dx,w*.42,.10,w*.23,.02,w*.13,'stone');}}
  if(medium){slab(0,w*.02,.145,w*.26,w*.34,'dark');b(0,w*.02,.165,w*.23,.018,w*.31,'glass', 'box',0x5b9d9b);for(const side of [-1,1])tree(side*w*.12,w*.15,.18,w*.13);}
  if(t>=1&&near)for(let j=0;j<8;j++)b(0,w*(.24-j*.035),.14+j*.025,w*.18,.045,w*.05,'stone');
  if(near){for(let k=0;k<floors;k++){const at=.17+k*step+step*.88;for(const side of [-1,1]){b(side*w*.188,-w*.05,at,.008,.065,w*.53,'gold');for(let j=0;j<9;j++)b(side*w*.188,-w*.30+j*w*.063,at-.019,.008,.10,.008,'titanium');b(side*w*.22,-w*.14,at-.027,w*.08,.058,w*.12,'stone');tree(side*w*.22,-w*.14,at+.005,w*.08);}}for(let k=0;k<3;k++){const dx=(k-1)*w*.27;b(dx,w*.418,.27,w*.15,.011,.032,'gold');for(let j=0;j<5;j++)b(dx-w*.055+j*w*.027,w*.422,.21,.007,.14,.012,'titanium');}}
 }else if(c.branch==='innovation'){
  // Engineering-led suspended office street, pylons, tendons and crystal pods.
  const H=h*1.08,base=.16,deck=base+H*.55,depth=w*.32,body=H*.20;
  for(const side of [-1,1]){b(side*w*.36,0,base+H*.56,w*.18,H*1.1,w*.25,'ivory','bridgePylon');facade(side*w*.36,-w*.01,.19,w*.10,w*.17,H*.77,5);}
  facade(0,0,deck,w*.86,depth,body,3+t);
  b(0,0,deck+body*.42,w*.90,body,w*.35,'titanium','bridgeTruss');
  b(0,0,base+H*.62,w,H,w,'gold',near?'bridgeCables':'bridgeCablesLow');
  slab(0,0,deck+body+.04,w*.88,w*.38,'stone');
  const pods=2+t;for(let k=0;k<pods;k++){
   const dx=(k-(pods-1)/2)*w*.62/Math.max(1,pods-1),at=deck-H*(.13+(k%2)*.045);
   b(dx,0,at,w*.15,H*.19,w*.23,'window','bridgePod');if(medium){b(dx,0,at+H*.12,.015,H*.14,.015,'gold');b(dx,0,at,w*.16,H*.19,w*.24,'titanium','ring');}
   if(near){b(dx,0,at,w*.15,H*.19,w*.23,'gold','bridgePodFrame');for(const dz of [-w*.119,w*.119])for(let j=0;j<5;j++)b(dx-w*.051+j*w*.0255,dz,at,.006,H*.09,.006,'ivory');}
  }
  // The ground-level forum remains open beneath the suspended complex.
  slab(0,w*.05,.19,w*.73,w*.74,'stone');facade(0,-w*.30,.23,w*.52,w*.16,.27,2);
  if(medium){for(const dx of [-w*.29,0,w*.29])tree(dx,0,deck+body+.06,w*.12);for(const side of [-1,1])tree(side*w*.27,w*.28,.22,w*.16);}
  if(t>=2){slab(0,-w*.025,deck+body+.13,w*.62,w*.24);b(0,-w*.025,deck+body+.24,w*.56,.20,w*.19,'glass');slab(0,-w*.025,deck+body+.35,w*.62,w*.24,'gold');}
  if(t===3){b(0,-w*.025,deck+body+.48,w*.47,.18,w*.18,'window');slab(0,-w*.025,deck+body+.58,w*.50,w*.21);}
  if(near){for(const side of [-1,1]){for(let j=0;j<16;j++){const dx=-w*.40+j*w*.053;b(dx,side*w*.198,deck+body+.095,.007,.11,.007,'titanium');}b(0,side*w*.198,deck+body+.15,w*.85,.010,.008,'gold');for(let j=0;j<6;j++)b(side*w*.36,-w*.112+j*w*.044,base+H*.76,w*.048,.018,.035,'gold');}
   b(0,-w*.026,deck+body+.68,w*.39,.17,w*.22,'glass','dome');b(0,-w*.026,deck+body+.68,w*.39,.17,w*.22,'gold','domeFrame');
   for(let k=0;k<4;k++){const dx=-w*.22+k*w*.15;for(const side of [-1,1])b(dx,side*w*.172,deck+body/2,w*.04,body*.60,.012,'ivory');}
  }
 }
 if(near){
  b(0,w*.458,.22,w*.14,.18,.015,'dark');b(0,w*.466,.23,w*.11,.14,.006,'pane');slab(0,w*.42,.35,w*.26,w*.13,'gold');
  for(const side of [-1,1]){b(side*w*.065,w*.464,.23,.008,.19,.020,'titanium');b(side*w*.36,w*.39,.135,w*.16,.045,w*.15,'stone');tree(side*w*.36,w*.39,.16,w*.12);}
  if(occupied)light({x,y:y+w*.464,h:.295,sx:w*.10,sy:.012,sz:.008,color:0xe4c594});
 }
 return true;
}
