// Same modular geometry is used by the live city and the evolution catalogue.
import {branchBuilding} from './branch-architecture.mjs';
import {architecturePalette,facilityPalette} from './branches.mjs';
import {stageHeight} from './evolution.mjs';
import {towerDetails,processDetails} from './facade-details.mjs';
export function zoneBuilding({x=0,y=0,h,zone,level,variant=0,far=false,occupied=true,branch=null,cell=null,add,light=()=>{}}){
 if(branch&&branchBuilding({x,y,c:{type:zone,level,branch,span:1},far,occupied,add,light}))return;
 const palette=architecturePalette({...cell,type:zone,level},x+variant,y),{white,stone,metal,glass,gold,dark}=palette;
 const b=(dx,dz,z,w,t,d,c=white,shape='box',role='ivory')=>add(x+dx,y+dz,z,w,t,d,c,shape,role);
 const foliage=(dx,dz,z,size=.12)=>{b(dx,dz,z,size,.07,size,.0+0x708462,'foliage','leaf');};
 const deck=(z,w=.84,d=.82,dx=0,dz=0)=>{b(dx,dz,z,w,.024,d,stone,'box','stone');b(dx,dz,z-.022,w-.04,.02,d-.04,dark,'box','dark');};
 const tower=(dx,dz,w,d,height,bottom=.16,{fins=false,terrace=false}={})=>{
  b(dx,dz,bottom+height/2,w,height,d,glass,'box','window');
  const floors=Math.max(2,Math.round(height/.13)),stride=far?Math.max(1,Math.ceil(floors/5)):1;
  for(let j=0;j<=floors;j+=stride){const z=bottom+j*height/floors,balcony=terrace&&j%3===0; b(dx,dz,z,w+(balcony?.1:.025),balcony?.025:.012,d+(balcony?.1:.025),white,'box','ivory');if(balcony&&!far){b(dx,dz+d/2+.025,z+.035,w*.85,.05,.012,glass,'box','glass');foliage(dx-w*.22,dz+d/2+.035,z+.055,.085);}}
  const cols=far?2:Math.max(3,Math.round(w/.10));
  for(let k=0;k<cols;k++){const cx=dx-w/2+k*w/(cols-1);for(const side of [-1,1])b(cx,dz+side*(d/2+.012),bottom+height/2,fins?.018:.009,height,fins?.055:.018,metal,'box','titanium');}
  deck(bottom+height+.025,w+.045,d+.045,dx,dz);
  if(!far){b(dx,dz,bottom+height+.063,w*.36,.06,d*.32,metal,'box','titanium');for(let k=0;k<3;k++)b(dx-w*.12+k*w*.12,dz,bottom+height+.097,.014,.01,d*.3,dark,'box','dark');}
  towerDetails({x,y,dx,dz,width:w,depth:d,height,base:bottom,palette,zone,far,occupied,add,light});
 };
 const skybridge=(z,dx=0,dz=0,w=.65,d=.16)=>{deck(z,w,d,dx,dz);b(dx,dz,z+.065,w-.025,.11,d-.025,glass,'box','window');deck(z+.13,w+.02,d+.02,dx,dz);};
 const park=(z,w=.6,d=.36)=>{deck(z,w,d);for(const dx of [-w*.33,w*.33]){b(dx,0,z+.03,.10,.04,d*.8,stone,'box','stone');foliage(dx,0,z+.10,.16);}};
 b(0,0,.091,.93,.04,.91,stone,'box','stone');b(0,0,.125,.82,.04,.79,dark,'box','dark');
 if(zone==='R'){
  if(level===1){tower(-.18,.07,.30,.50,h*.65);tower(.17,-.08,.27,.37,h*.83);}
  else if(level===2){tower(-.25,0,.24,.69,h*.86,.16,{fins:false});tower(.25,0,.24,.69,h);tower(0,-.24,.3,.22,h*.72);foliage(0,.08,.2,.21);}
  else if(level===3){tower(-.20,-.05,.34,.64,h);tower(.23,-.17,.25,.41,h*.76);deck(.4,.76,.76);}
  else if(level===4){for(let k=0;k<3;k++)tower((k-1)*.24,-k*.08,.24,.62-k*.10,h*(1-k*.2),.16,{terrace:true});}
  else if(level===5){tower(-.08,-.06,.57,.53,h*.68,.16,{terrace:true});park(h*.68+.21,.77,.73);tower(-.12,-.13,.38,.34,h*.31,h*.68+.24,{terrace:true});}
  else if(level===6){tower(-.22,0,.30,.54,h,.16,{terrace:true});tower(.23,-.13,.28,.41,h*.83,.16,{terrace:true});skybridge(h*.53);park(h*.53+.16,.84,.31);}
  else if(level===7){for(let k=0;k<3;k++)tower((k-1)*.25,k===1?-.24:.02,.23,.36,h*(k===1?1:.82),.16,{terrace:true});for(const z of [.37,.68]){skybridge(h*z);park(h*z+.16,.85,.26);}}
  else {tower(-.23,-.09,.28,.46,h*.90,.16,{fins:true,terrace:true});tower(.23,-.09,.28,.46,h,.16,{fins:true,terrace:true});tower(0,-.27,.19,.22,h*.82,.16,{fins:true});for(const z of [.3,.63,.85]){skybridge(h*z,0,.07,.86,.26);park(h*z+.15,.90,.32);}b(0,-.09,h+.27,.58,.045,.53,white,'cylinder','ivory');b(0,-.09,h+.30,.49,.018,.44,dark,'cylinder','dark');}
 }else if(zone==='C'){
  if(level<=2){const n=level+1;for(let k=0;k<n;k++){const dx=(k-(n-1)/2)*.73/n;tower(dx,-.02,.65/n,.58,h*(1-k*.07));b(dx,.33,.29,.59/n,.025,.20,gold,'box','gold');}}
  else if(level===3){tower(0,0,.73,.65,h*.63);tower(-.14,-.16,.40,.34,h*.35,h*.63+.18);}
  else if(level===4){tower(-.10,-.08,.47,.50,h,.16,{fins:true});tower(.26,.1,.19,.45,h*.42);}
  else if(level===5){tower(-.21,-.05,.34,.55,h,.16,{fins:true});tower(.25,-.12,.25,.4,h*.72,.16,{fins:true});skybridge(h*.45);}
  else if(level===6){for(const dx of [-.25,.25])tower(dx,-.06,.26,.51,h*(dx<0?1:.85),.16,{fins:true});skybridge(h*.64,0,0,.81,.35);b(0,0,h*.64+.17,.67,.045,.35,gold,'box','gold');}
  else {for(let k=0;k<3;k++)tower((k-1)*.255,k===1?-.27:0,.22,k===1?.25:.41,h*(k===1?1:k===0?.89:.78),.16,{fins:true});skybridge(h*.42,0,.12,.84,.25);skybridge(h*.72,0,.04,.74,.28);if(level===8){b(0,-.09,h*.88,.79,.035,.65,white,'cylinder','ivory');b(0,-.09,h*.88+.028,.66,.03,.52,glass,'cylinder','window');b(0,-.09,h+.24,.012,.27,.012,gold,'box','gold');}}
 }else{
  const tank=(dx,dz,z,t)=>{b(dx,dz,z+t/2,.16,t,.16,metal,'cylinder','titanium');for(const j of [0,.5,1])b(dx,dz,z+j*t,.18,.02,.18,gold,'cylinder','gold');};
  const hallH=h*(level<=3?.7:.42);tower(-.07,.05,.66,.57,hallH,.16);deck(.17+hallH,.76,.68,-.07,.05);
  if(level===1)b(-.05,.05,hallH+.25,.53,.05,.52,metal,'box','titanium');
  if(level>=2)for(let k=0;k<Math.min(3,level-1);k++)tank(-.25+k*.22,-.25,.18+hallH,level<4?h*.25:h*.37);
  if(level>=3){for(let k=0;k<4;k++)b(-.3+k*.18,.25,.21+hallH,.12,.075,.18,dark,'box','dark');b(.32,-.05,.3,.13,.35,.45,metal,'box','titanium');}
  if(level>=4){tower(-.07,-.04,.34,.33,h*.37,.23+hallH,{fins:true});b(-.07,-.04,h*.82+.25,.46,.06,.44,white,'cylinder','ivory');}
  if(level>=5)for(const dx of [-.34,.32]){b(dx,0,h*.6,.025,h*.75,.025,gold,'box','gold');b(dx,.02,h*.9,.03,.025,.62,metal,'box','titanium');}
  if(level>=6){skybridge(h*.65,0,.04,.9,.5);b(0,.04,h*.65+.17,.72,.04,.37,dark,'box','dark');for(const dx of [-.27,.27])b(dx,.02,h*.65+.20,.09,.008,.30,gold,'box','gold');}
  if(level>=7){tower(-.24,-.1,.19,.25,h*.75,.16,{fins:true});tower(.24,-.1,.19,.25,h,.16,{fins:true});b(0,-.1,h+.23,.75,.04,.18,metal,'box','titanium');}
  if(level===8){b(0,-.12,h*.83,.85,.035,.62,white,'cylinder','ivory');b(0,-.12,h*.83+.03,.74,.04,.52,glass,'cylinder','window');b(-.39,.28,.16,.04,h*.95,.04,metal,'box','titanium');b(0,.28,h*.95,.82,.04,.04,gold,'box','gold');}
 }
 if(!far){
  // Entrance, lit lobby, paving joints, planters and equipment are readable at street scale.
  b(0,.397,.22,.17,.16,.022,glass,'box','window');b(0,.432,.32,.28,.025,.15,white,'box','ivory');
  for(const dx of [-.32,.32]){b(dx,.37,.14,.17,.09,.12,stone,'box','stone');if(zone!=='I')foliage(dx,.37,.23,.13);}
  if(occupied)for(const dx of [-.22,.22])light({x:x+dx,y:y+.40,h:.25,sx:.06,sy:.09,sz:.006,color:0xecd9b4});
  if(level>=6){const z=h+.25; b(.02,-.04,z,.29,.025,.26,dark,'box','dark');for(const dx of [-.095,.095])b(dx+.02,-.04,z+.015,.008,.006,.13,white);b(.02,-.04,z+.015,.19,.006,.008,white);}
 }
}

export function serviceBuilding({x,y,type,upgrade=0,far=false,add}){
 const palette=facilityPalette(type);
 const b=(dx,dz,z,w,h,d,role='ivory',shape='box',color=0xffffff)=>add(x+dx,y+dz,z,w,h,d,color===0xffffff?(palette[role]||color):color,shape,role);
 if(type==='station'){
  // The road passes underneath; the boarding concourse sits above traffic.
  for(const dx of [-.41,.41]){b(dx,0,.58,.055,1.04,.74,'titanium');b(dx,0,1.08,.12,.065,.82,'stone');}
  b(0,0,1.12,.96,.07,.92,'ivory');b(0,-.28,1.39,.83,.38,.25,'window');b(0,-.28,1.6,.93,.06,.37,'ivory');
  for(const dx of [-.32,0,.32])b(dx,.19,1.3,.035,.32,.44,'titanium');b(0,.2,1.5,.94,.055,.52,'ivory');b(0,.46,1.16,.84,.028,.018,'gold');
  for(let k=0;k<8;k++)b(-.46+k*.025,-.4+k*.047,.17+k*.113,.12,.035,.085,'stone');return;
 }
 b(0,0,.11,.91,.08,.89,'stone');b(0,0,.23,.75,.2,.67,'window');b(0,0,.35,.82,.04,.75);
 const tank=(dx,dz,z,h,w=.23)=>{b(dx,dz,z+h/2,w,h,w,'titanium','cylinder');for(const k of [0,1])b(dx,dz,z+k*h,w+.04,.03,w+.04,'ivory','cylinder');};
 if(type==='power'){tank(0,-.05,.37,.68,.52);b(0,-.05,1.08,.34,.09,.34,'gold','cylinder');for(const dx of [-.33,.33]){b(dx,0,.6,.075,.5,.55,'titanium');b(dx,.28,.6,.012,.32,.016,'gold');}}
 else if(type==='water'||type==='life'){for(const dx of [-.21,.21])tank(dx,-.06,.37,.47,.29);b(0,.27,.6,.6,.17,.1,type==='life'?'leaf':'glass');}
 else if(type==='radiator'){for(let k=0;k<6;k++){b(-.33+k*.13,0,.74,.025,.72,.62,'titanium');b(-.33+k*.13,.32,.74,.028,.58,.015,'dark');}}
 else if(type==='station'||type==='bus'){b(0,-.16,.57,.67,.41,.27,'window');for(const dx of [-.33,.33])b(dx,.17,.58,.028,.45,.025,'titanium');b(0,.09,.83,.9,.055,.66);}
 else if(type==='dock'||type==='airport'){b(0,-.19,.65,.64,.57,.24,'window');b(0,-.19,.97,.74,.06,.35);b(0,.18,.4,.82,.07,.46,'dark');for(const dx of [-.36,.36]){b(dx,.12,.9,.033,1.2,.035,'titanium');b(dx,.13,1.51,.038,.04,.67,'gold');}}
 else if(type==='arcology'){for(let k=0;k<5;k++){const w=.72-k*.075;b(0,0,.37+k*.53,w,.45,w,'window');b(0,0,.61+k*.53,w+.10,.07,w+.10);b(w*.25,0,.71+k*.53,.13,.18,.22,'leaf','foliage');}b(0,0,3.10,.42,.22,.42,'glass','cylinder');}
 else if(type==='fabricator'){tank(-.14,-.06,.4,.53,.40);b(.29,-.02,.75,.12,.74,.48,'titanium');b(-.10,.29,.56,.45,.34,.025,'glass');}
 else if(type==='stadium'){b(0,0,.55,.82,.4,.73,'glass','cylinder');b(0,0,.78,.9,.065,.8,'ivory','cylinder');}
 else {const h=type==='hospital'?.98:type==='school'?.52:.66;b(-.15,-.09,.36+h/2,.40,h,.50,'window');b(.25,0,.55,.25,.39,.64);b(-.15,-.09,.4+h,.49,.04,.59);if(!far)for(let k=0;k<4;k++)b(-.15,-.09,.4+k*h/4,.44,.025,.55,'titanium');if(type==='hospital'){b(-.15,-.09,h+.43,.24,.015,.055,'red');b(-.15,-.09,h+.43,.055,.015,.24,'red');}if(type==='fire')for(const dx of [-.22,0,.22])b(dx,.34,.23,.16,.16,.018,'red');}
 if(!far){b(0,.36,.22,.18,.19,.012,'dark');b(0,.4,.34,.31,.026,.18,'gold');for(const dx of [-.36,.36])b(dx,.3,.28,.055,.32,.06,'titanium');for(let j=0;j<upgrade;j++)tank(-.20+j*.3,-.35,.45,.18,.13);}
}

// A fused lot is a single composed campus, with shared podiums and bridges.
// Its towers and proportions change with both foundation size and evolution.
export function complexBuilding({x,y,c,far=false,occupied=true,add,light=()=>{}}){
 const span=c.span||1,zone=c.type.toUpperCase(),level=c.level;
 if(branchBuilding({x,y,c,far,occupied:occupied&&!c.vacant,add,light}))return;
 if(span===1){zoneBuilding({x,y,h:stageHeightLocal(c),zone,level,cell:c,variant:0,far,occupied:occupied&&!c.vacant,add,light});return;}
 const w=span-.10,h=stageHeightLocal(c)*(1+(span-1)*.18),palette=architecturePalette(c,x,y),{white,glass,metal,gold,stone,dark}=palette;
 const b=(dx,dz,z,sx,sy,sz,col=white,shape='box',role='ivory')=>add(x+dx,y+dz,z,sx,sy,sz,col,shape,role);
 const foliage=(dx,dz,z,size)=>b(dx,dz,z,size,.18,size,0x7c9071,'foliage','leaf');
 const slab=(z,sx,sz,dx=0,dz=0)=>{b(dx,dz,z,sx,.034,sz,white);b(dx,dz,z-.035,sx-.04,.025,sz-.04,dark,'box','dark');};
 const tower=(dx,dz,sx,sz,ht,base=.36)=>{
  b(dx,dz,base+ht/2,sx,ht,sz,glass,'box','window');const rows=Math.max(3,Math.round(ht/.15)),stride=far?Math.max(1,Math.ceil(rows/8)):1;
  for(let j=0;j<=rows;j+=stride){const z=base+j*ht/rows,terrace=zone==='R'&&j%4===0;slab(z,sx+(terrace?.13:.025),sz+(terrace?.13:.025),dx,dz);if(terrace&&!far)foliage(dx-sx*.27,dz+sz*.38,z+.05,.17);}
  for(const side of [-1,1])for(let k=0;k<(far?3:7);k++){const xx=dx-sx/2+k*sx/((far?3:7)-1);b(xx,dz+side*(sz/2+.006),base+ht/2,.009,ht,.026,metal,'box','titanium');}
  slab(base+ht+.05,sx+.09,sz+.09,dx,dz);if(!far)b(dx,dz,base+ht+.14,sx*.32,.16,sz*.34,metal,'box','titanium');
  towerDetails({x,y,dx,dz,width:sx,depth:sz,height:ht,base,palette,zone,far,occupied,footprint:span,add,light});
 };
 b(0,0,.09,w,.06,w,stone,'box','stone');b(0,0,.23,w-.22,.23,w-.28,glass,'box','window');slab(.36,w-.03,w-.04);
 if(zone==='I'){
  const hall=w*.62;tower(-w*.10,w*.06,hall,w*.63,h*.52);
  for(let k=0;k<span;k++){const dx=-w*.32+k*w*.64/Math.max(1,span-1);b(dx,-w*.29,.42+h*.3,.24,h*.6,.24,metal,'cylinder','titanium');for(const z of [.43,.43+h*.3,.43+h*.6])b(dx,-w*.29,z,.27,.025,.27,gold,'cylinder','gold');}
  if(level>=4)tower(w*.30,-w*.05,w*.22,w*.33,h*.87);
  if(level>=6){slab(h*.7,w*.9,w*.38,0,0);b(0,0,h*.7+.12,w*.81,.19,w*.32,glass,'box','glass');}
  if(level>=7)for(const dx of [-w*.44,w*.44])b(dx,w*.36,h*.5,.04,h*.94,.04,metal,'box','titanium');
  if(level===8)b(0,w*.36,h+.04,w*.92,.045,.07,gold,'box','gold');
 }else{
  const offset=w*.255,towerW=w*(span===2?.35:.29),towerD=w*.37;
  tower(-offset,-w*.05,towerW,towerD,h*(zone==='C'?1:.9));tower(offset,-w*.17,towerW*.85,towerD*.83,h*.78);
  if(span>=3)tower(0,-w*.32,w*.19,w*.24,h*.95);
  if(span===4){tower(-w*.28,w*.29,w*.22,w*.21,h*.49);tower(w*.29,w*.29,w*.20,w*.24,h*.58);}
  const bridges=level>=7?[.4,.70]:level>=4?[.48]:[];
  for(const z of bridges){slab(.36+h*z,w*.8,w*.19,0,w*.02);b(0,w*.02,.43+h*z,w*.77,.14,w*.16,glass,'box','glass');if(zone==='R')for(const dx of [-w*.28,w*.28])foliage(dx,w*.08,.55+h*z,.22);}
  if(level>=6){slab(.48,w*.63,w*.28,0,w*.31);for(const dx of [-w*.22,w*.22])foliage(dx,w*.31,.59,.27);}
  if(level===8){b(0,-w*.05,h*.88,w*.78,.045,w*.60,white,'cylinder');b(0,-w*.05,h*.88+.04,w*.64,.035,w*.47,glass,'cylinder','glass');}
 }
 if(!far){
  // Shared pedestrian forecourt, lobby and fine paving keep large lots readable.
  b(0,w*.41,.18,w*.3,.18,.035,glass,'box','window');slab(.29,w*.39,w*.20,0,w*.36);
  for(let k=0;k<span*3;k++)b(-w*.40+k*w*.8/(span*3-1),w*.45,.108,.015,.015,.16,metal,'box','titanium');
  for(const dx of [-w*.40,w*.40]){b(dx,w*.31,.18,.20,.14,.29,stone,'box','stone');if(zone!=='I')foliage(dx,w*.31,.33,.25);}
  if(occupied)for(const dx of [-w*.17,w*.17])light({x:x+dx,y:y+w*.43,h:.24,sx:.15,sy:.05,sz:.008,color:0xf0dfb9});
 }
}
function stageHeightLocal(c){return stageHeight(c);}
export function utilityComplex({x,y,c,far=false,add}){
 const span=c.span||1,tier=Math.min(4,c.level||1),w=span-.10,palette=facilityPalette(c.type);
 const b=(dx,dz,z,sx,sy,sz,role='ivory',shape='box',col=0xffffff)=>add(x+dx,y+dz,z,sx,sy,sz,palette[role]||col,shape,role);
 const tank=(dx,dz,base,width,height)=>{b(dx,dz,base+height/2,width,height,width,'titanium','cylinder',0xb7c1c0);for(const v of [0,.5,1])b(dx,dz,base+v*height,width+.04,.02,width+.04,'gold','cylinder',0xc4b089);b(dx,dz,base+height+.045,width*.65,.065,width*.65,'ivory','cylinder',0xe9e7db);};
 b(0,0,.1,w,.08,w,'stone','box',0xcecbc1);b(0,0,.21,w*.83,.2,w*.77,'window','box',0xaabdc0);b(0,0,.33,w*.92,.035,w*.89,'ivory','box',0xe9e5d8);
 const t=c.type,n=span>1?span:1,height=.56+tier*.20;
 if(t==='power'||t==='water'||t==='life'||t==='fabricator'){
  for(let k=0;k<n;k++){const dx=n===1?0:(k-(n-1)/2)*w*.60/(n-1),width=n===1?w*.48:w*.35;
   tank(dx,-w*.15,.36,width,t==='power'?height:height*.65);
   if(tier>=3&&t!=='power')tank(dx,w*.24,.36,width*.70,height*.47);
  }
  const fins=far?4:8;for(let k=0;k<fins;k++)b(-w*.37+k*w*.74/(fins-1),w*.25,.54,.018,.27,w*.21,'titanium','box',0xc1c9c6);
  if(t==='power')for(const dx of [-w*.39,w*.39])b(dx,0,.37+height/2,w*.06,height*.8,w*.49,'titanium','box',0xb6c0c1);
  if(tier>=2){b(0,w*.28,.74,w*.61,.15,w*.13,t==='life'?'leaf':'glass','box',t==='life'?0x9aad8b:0xafcdd0);b(0,w*.28,.84,w*.64,.018,w*.16,'ivory','box',0xe4e3d7);}
 }else if(t==='radiator'||t==='solar'){
  for(let k=0;k<Math.min(14,4+span*2+tier);k++){const count=Math.min(14,4+span*2+tier);b(-w*.4+k*w*.8/(count-1),0,t==='solar'?.48:.36+height*.48,w*.04,t==='solar'?.15:height,w*.67,t==='solar'?'window':'titanium','box',t==='solar'?0x70909c:0xbac9c9);}
 }else{
  const ht=.55+tier*.29;b(-w*.18,-w*.07,.36+ht/2,w*.43,ht,w*.50,'window','box',0xb1c4c6);b(w*.26,0,.66,w*.22,.6,w*.68,'ivory','box',0xe7e4d9);b(-w*.18,-w*.07,.40+ht,w*.47,.03,w*.54,'ivory','box',0xe7e4d9);
  for(let k=0;k<(far?3:7);k++)b(-w*.18,-w*.07,.39+k*ht/(far?3:7),w*.44,.012,w*.51,'titanium','box',0xbbc3bf);
  towerDetails({x,y,dx:-w*.18,dz:-w*.07,width:w*.43,depth:w*.50,height:ht,base:.36,footprint:span,far,zone:'C',palette:{white:palette.ivory,stone:palette.stone,metal:palette.titanium,glass:palette.glass,glassLight:palette.glass,gold:palette.gold,dark:palette.dark,accent:palette.red},add});
  if(t==='hospital'){b(-w*.18,-w*.07,.44+ht,w*.2,.018,w*.04,'red','box',0xb66e5f);b(-w*.18,-w*.07,.44+ht,w*.04,.018,w*.2,'red','box',0xb66e5f);}
 }
 if(span>=2){b(0,0,.63+height*.3,w*.84,.025,w*.12,'ivory','box',0xe8e2d6);b(0,0,.70+height*.3,w*.79,.12,w*.10,'glass','box',0xb0cace);}
 if(tier===4){b(0,-w*.10,.53+height,w*.62,.045,w*.50,'ivory','cylinder',0xe4e5dc);b(0,-w*.10,.57+height,w*.49,.04,w*.38,'glass','cylinder',0xaac7c7);}
 if(!far){b(0,w*.40,.22,w*.25,.17,.018,'dark','box',0x4c656c);b(0,w*.37,.35,w*.35,.022,w*.23,'gold','box',0xc5b591);for(const dx of [-w*.35,w*.35])b(dx,w*.37,.28,.023,.31,.023,'titanium','box',0xb4c2c2);}
 if(!far)processDetails({x,y,c,width:w,height,add,palette});
}
