import {branchDefinition,architecturePalette} from './branches.mjs';
import {stageHeight} from './evolution.mjs';

export function residentialBodyHeight(c){const w=(c.span||1)-.1;return c.branch==='research'?w*[.76,.87,1.0,1.08][Math.min(3,Math.max(0,c.level-5))]:stageHeight(c)*(1+((c.span||1)-1)*.13);}
export function residentialBuilding({x=0,y=0,c,detail=2,occupied=true,add,light=()=>{}}){
 if(c.type?.toUpperCase()!=='R'||c.level<5||!branchDefinition(c))return false;
 const t=Math.min(3,c.level-5),w=(c.span||1)-.1,H=residentialBodyHeight(c),p=architecturePalette(c,x,y),near=detail===2,medium=detail>=1;
 const color={ivory:p.white,stone:p.stone,titanium:p.metal,gold:p.gold,dark:p.dark,window:p.glass,glass:p.glassLight,pane:p.glassLight,leaf:p.leaf,red:p.accent,wood:0xc1a07c,bark:0x76644d,charcoal:0x494642};
 const b=(dx,dz,ht,sx,sy,sz,role='ivory',shape='box',tint)=>add(x+dx,y+dz,ht,sx,sy,sz,tint??color[role],shape,role);
 const deck=(dx,dz,ht,width,depth,role='ivory')=>b(dx,dz,ht,width,.035,depth,role,medium?'ringDeck':'treeDeckFar');
 const tree=(dx,dz,ht,size,k=0)=>{if(near)b(dx,dz,ht+size*.22,size*.025,size*.44,size*.025,'bark','cylinder');b(dx,dz,ht+size*.54,size*.65,size*.62,size*.65,'leaf','foliage',[p.leaf,0x99ab65,0x508565][k%3]);if(near)b(dx+size*.12,dz-size*.07,ht+size*.71,size*.50,size*.45,size*.55,'leaf','foliage',0xa5b784);};
 const grove=(dx,dz,ht,width,depth,n=8)=>{if(!medium){b(dx,dz,ht+.06,width,.12,depth,'leaf','foliage');return;}for(let k=0;k<(near?n:4);k++){const a=k*2.399,r=.27+.12*(k%3);tree(dx+Math.cos(a)*width*r,dz+Math.sin(a)*depth*r,ht,width*(.19+(k%3)*.022),k);}};
 const band=(dx,dz,ht,width,depth,height,role='window',shape='cylinder')=>{b(dx,dz,ht+height/2,width,height,depth,role,shape);deck(dx,dz,ht,width*1.06,depth*1.06);deck(dx,dz,ht+height,width*1.07,depth*1.07);if(near){for(let k=1;k<4;k++)deck(dx,dz,ht+height*k/4,width*1.025,depth*1.025,'titanium');b(dx,dz,ht+height/2,width*1.01,height,depth*1.01,'ivory','treeCrownFrame');}};
 b(0,0,.115,w,.18,w,'stone');
 if(c.branch==='garden'){
  if(t<2){
   const levels=3+t;
   for(const side of [-1,1])b(side*w*.20,0,.26+H*.43,w*.19,H*.86,w*.23,'window',medium?'cylinder':'cylinderLow');
   for(let k=0;k<levels;k++){const at=.30+k*H/(levels+1),d=w*(.88-k*.08);band(0,0,at,d,d*.84,H/(levels+1)*.38,'glass',medium?'cylinder':'cylinderLow');grove(0,0,at+H/(levels+1)*.4,d,d*.84,near?9:4);}
   if(medium)b(0,0,.25,w*.34,.22,w*.30,'glass','dome');
  }else{
   // The side crowns begin high above the ground: one trunk and one ground base.
   b(0,0,.25+H/2,w*.83,H,w*.83,'ivory',medium?'forestTrunk':'forestTrunkLow');
   if(near){b(0,0,.25+H/2,w*.83,H,w*.83,'window','forestStemGlass');b(0,0,.25+H/2,w*.83,H,w*.83,'gold','forestStemFrame');}
   else b(0,w*.058,.24+H*.33,w*.13,H*.58,w*.08,'window',medium?'cylinder':'cylinderLow');
   for(const side of [-1,1]){const at=.25+H*.91,dx=side*w*.27;band(dx,0,at,w*.36,w*.38,H*.10,'glass',medium?'cylinder':'cylinderLow');if(t===3&&medium)band(dx,0,at+H*.065,w*.30,w*.31,H*.055,'window');grove(dx,0,at+H*.122,w*.34,w*.36,near?12:4);if(near){deck(dx,0,at-H*.045,w*.42,w*.40);grove(dx,w*.08,at-H*.035,w*.34,w*.23,8);}}
   band(0,0,.25+H*.98,w*.32,w*.35,H*.13,'glass',medium?'cylinder':'cylinderLow');grove(0,0,.25+H*1.112,w*.33,w*.34,near?14:4);
   if(near){for(let k=0;k<12;k++)b(0,w*.11,.28+k*H*.044,w*.028,.014,.012,'gold');deck(0,0,.25+H*.60,w*.23,w*.26,'gold');for(const dx of [-w*.27,0,w*.27])for(let k=0;k<10;k++){const a=k*Math.PI/5,r=w*(dx===0?.16:.18),at=.25+H*(dx===0?1.09:.99);b(dx+Math.cos(a)*r,Math.sin(a)*r,at,w*.030,H*.012,w*.030,'stone');tree(dx+Math.cos(a)*r,Math.sin(a)*r,at+H*.006,w*.08,k);}}
  }
 }else if(c.branch==='civic'){
  b(0,0,.25+H/2,w*.89,H,w*.82,'bark',near?'timberTrunk':medium?'forestTrunk':'forestTrunkLow');
  if(near)b(0,0,.25+H/2,w,H,w,'wood',`woodBraces${t}`);
  const n=3+t;
  if(medium){b(0,0,.25+H/2,w,H,w,'wood',`woodRibbon${t}${near?'':'Low'}`);if(near){b(0,0,.25+H/2,w,H,w,'wood',`woodSteps${t}`);b(0,0,.25+H/2,w,H,w,'gold',`woodRail${t}`);}}
  for(let k=0;k<n;k++){const a=k*2.399,dx=Math.cos(a)*w*.25,dz=Math.sin(a)*w*.25,at=.30+H*(.20+k*.63/(n-1)),sx=w*(.33-(k%2)*.025),ht=H*.15;
   b(dx,dz,at,sx,ht,w*.32,'charcoal',medium?(near?'timberHouse':'timberHouseLow'):'treePodLow');deck(dx,dz,at-ht*.50,sx*1.19,w*.40,'wood');if(near)b(dx,dz+w*.18,at-ht*.50,sx*.87,.025,w*.08,'wood');
   if(near){b(dx,dz+w*.163,at,sx*.85,ht*.85,.027,'wood','woodPortal');b(dx,dz+w*.171,at,sx*.85,ht*.85,.032,'wood','woodRoundWindow');b(dx,dz+w*.155,at,sx*.60,ht*.60,.014,'pane','treePod',0xe3c79b);b(dx,dz+w*.15,at-ht*.27,sx*.48,.016,w*.05,'gold');
    for(let j=0;j<12;j++)for(const side of [-1,1])b(dx+side*sx*.497,dz-w*.132+j*w*.023,at,.012,ht*.91,.006,'wood','box',j%3?0x8f765a:0xb6a088);
    for(const side of [-1,1]){b(dx+side*sx*.46,dz+w*.18,at-ht*.40,.012,ht*.17,.012,'gold');b(dx+side*sx*.46,dz+w*.18,at-ht*.31,.014,.013,w*.085,'gold');}b(dx,dz+w*.219,at-ht*.31,sx*.94,.014,.010,'wood');
   }
   if(medium)tree(dx,dz,at+ht*.42,sx*.33,k);if(near){for(let j=0;j<4;j++)tree(dx-sx*.36+j*sx*.24,dz-w*.13,at+ht*.50,sx*.20,j);}
  }
  if(t>=2)deck(0,0,.25+H*.88,w*.58,w*.55,'wood');
  if(t===3&&medium){band(0,0,.25+H*.93,w*.27,w*.28,H*.12,'glass');grove(0,0,.25+H*1.06,w*.39,w*.38,6);}
 }else{
  // A hollow monumental cube with a tall portal, nested courtyards and latticed skins.
  const base=.23;
  for(const side of [-1,1])b(side*w*.365,0,base+H/2,w*.24,H,w*.89,'window');b(0,-w*.365,base+H/2,w*.89,H,w*.24,'glass');b(0,w*.365,base+H*.89,w*.50,H*.22,w*.24,'glass');
  // The front central opening is a real void; no glass slab closes the entrance.
  b(0,w*.375,base+H*.68,w*.50,H*.63,.032,'gold',medium?'arch':'archLow');
  for(const side of [-1,1]){b(side*w*.48,0,base+H/2,.029,H,w*.96,'ivory');b(0,side*w*.48,base+H/2,w*.96,H,.032,'ivory',medium?'cubePortal':'cubePortalLow');}
  if(medium){for(const side of [-1,1]){b(0,side*w*.487,base+H/2,w*.98,H,.02,'gold',near?'cubeLattice':'cubeLatticeLow');b(side*w*.487,0,base+H/2,.02,H,w*.98,'titanium',near?'cubeLatticeSide':'cubeLatticeSideLow');}
   for(let k=0;k<2+t;k++){const at=base+k*H/(3+t);for(const side of [-1,1]){b(side*w*.34,0,at,w*.28,.032,w*.87,'stone');grove(side*w*.34,-w*.07,at+.04,w*.22,w*.75,near?6:2);}}
   for(let k=0;k<2+t;k++)b(0,-w*.25+k*w*.04,base+H*(.20+k*.15),w*(.34-k*.02),H*.08,w*.20,'ivory');
  }
  b(0,0,base+H,w*.99,.055,w*.99,'gold');b(0,0,base+.018,w*.21,.025,w*.76,'stone');
  if(near){b(0,0,base+H*.37,w*.10,H*.46,w*.10,'window');for(let k=0;k<10;k++)b(0,w*.30-k*w*.035,base+.009+k*.012,w*.18,.025,w*.04,'stone');grove(0,-w*.04,base+H+.03,w*.86,w*.79,14);
   for(const dz of [w*.41,w*.44])b(0,dz,base+H/2,w*.79,H*.93,.020,'stone','cubePortal');
   for(let k=0;k<2+t;k++){const at=base+(k+.82)*H/(3+t);for(const side of [-1,1]){b(side*w*.21,0,at,.015,.08,w*.84,'gold');for(let j=0;j<12;j++)b(side*w*.21,-w*.39+j*w*.072,at-.025,.008,.13,.008,'titanium');b(side*w*.36,-w*.03,at-.02,w*.17,.08,w*.16,'stone');}}
   const roof=base+H+.04;b(0,0,roof+w*.095,w*.38,w*.19,w*.37,'glass','dome');b(0,0,roof+w*.095,w*.38,w*.19,w*.37,'gold','domeFrame');
   for(const side of [-1,1])for(let k=0;k<18;k++)b(side*w*.482,-w*.42+k*w*.049,base+H/2,.013,H*.96,.008,'titanium');
  }
 }
 if(near){b(0,w*.465,.25,w*.13,.20,.015,'dark');b(0,w*.473,.25,w*.10,.15,.005,'pane');for(const side of [-1,1])tree(side*w*.36,w*.38,.16,w*.13,side+1);if(occupied)light({x,y:y+w*.46,h:.29,sx:w*.09,sy:.014,sz:.009,color:0xe3c292});}
 return true;
}
