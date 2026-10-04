import {branchDefinition,architecturePalette} from './branches.mjs';
import {stageHeight} from './evolution.mjs';

// Staggered, eight-month visual work phases. No frame-time geometry or extra simulation.
export function shipyardWork(c,x=0,y=0){const seed=Math.abs(Math.imul(x|0,31)+(y|0)*7),n=Math.floor((Math.max(0,c.age||0)+seed%24)/8);return {kind:Math.floor(n/3)%3,phase:n%3};}
export function industrialVisualKey(c,x=0,y=0){if(c.type?.toUpperCase()!=='I'||c.branch!=='logistics'||c.level<5)return '';const q=shipyardWork(c,x,y);return `${q.kind}:${q.phase}`;}
export function industrialBuilding({x=0,y=0,c,detail=2,occupied=true,add,light=()=>{}}){
 if(c.type?.toUpperCase()!=='I'||c.level<5||!branchDefinition(c))return false;
 const t=Math.min(3,c.level-5),w=(c.span||1)-.1,H=stageHeight(c)*(1+((c.span||1)-1)*.13),p=architecturePalette(c,x,y),near=detail===2,medium=detail>=1;
 const colors={ivory:p.white,stone:p.stone,titanium:p.metal,gold:p.gold,dark:p.dark,window:p.glass,glass:p.glassLight,pane:p.glassLight,red:p.accent,leaf:p.leaf};
 const b=(dx,dz,ht,sx,sy,sz,role='ivory',shape='box',color)=>add(x+dx,y+dz,ht,sx,sy,sz,color??colors[role],shape,role);
 const slab=(dx,dz,ht,sx,sz,role='ivory')=>b(dx,dz,ht,sx,.035,sz,role);
 const tank=(dx,dz,at,sx,ht)=>{b(dx,dz,at+ht/2,sx,ht,sx,'glass',near?'cylinder':'cylinderLow');if(medium)for(const q of [0,.5,1])b(dx,dz,at+ht*q,sx*1.03,.023,sx*1.03,'titanium',near?'ringDeck':'ringDeckLow');};
 b(0,0,.10,w,.17,w,'stone');
 if(c.branch==='logistics'){
  const q=shipyardWork(c,x,y),base=.26,work=.28+H*.31;
  // Open elevated gantries and separate workshops surround a legible drydock.
  b(0,0,base+H*.45,w*.94,H*.90,w*.91,'titanium',near?'yardFrame':'yardFrameLow');
  slab(0,0,.20,w*.66,w*.67,'dark');b(0,-w*.40,.31,w*.75,.26,w*.13,'window');
  if(q.kind===0){b(0,-w*.07,work,w*.49,H*.24,w*.50,'titanium',near?'shipRibs':medium?'shipRibsLow':'shipRibsFar');if(q.phase>0)b(0,-w*.07,work,w*.53,H*.16,w*.52,'ivory',medium?'shipHull':'shipHullFar');}
  else if(q.kind===1){b(0,0,work,w*.28,H*.25,w*.68,'titanium',near?'shipRibs':medium?'shipRibsLow':'shipRibsFar');if(q.phase>0)b(0,0,work,w*.31,H*.20,w*.71,'ivory',medium?'shipHull':'shipHullFar');}
  else{for(const v of [-1,1])b(0,0,work+v*H*.09,w*.30,.024,w*.30,'titanium',near?'ringDeck':'treeDeckFar');if(q.phase>0){b(0,0,work,w*.27,H*.27,w*.27,'ivory',medium?'cylinder':'cylinderLow');b(0,0,work+H*.15,w*.24,.018,w*.24,'gold');}if(q.phase===2)b(0,0,work+H*.20,w*.11,H*.09,w*.11,'window',medium?'cylinder':'cylinderLow');}
  if(q.phase===2||q.kind===2)for(const side of [-1,1])b(side*w*.28,w*.07,work+H*.12,w*.11,H*.085,w*.46,'glass',medium?'shipHull':'shipHullFar');
  if(medium){
   for(let k=0;k<2+t;k++){const dz=(k-(1+t)/2)*w*.14;slab(0,dz,base+H*.64,w*.82,w*.045,'titanium');for(const side of [-1,1]){b(side*w*.38,dz,base+H*.40,.018,H*.78,.018,'gold');b(side*w*.39,dz,base+H*.55,w*.035,.025,w*.19,'gold');}}
   if(near){b(w*.13,0,base+H*.70,w*.15,.10,w*.11,'red');for(const side of [-1,1])b(w*.13+side*w*.034,0,base+H*.53,.008,H*.34,.008,'dark');for(let k=0;k<8;k++)b(-w*.32+k*w*.091,-w*.475,.32,.018,.10,.009,'gold');}
   for(let k=0;k<3+t;k++){b(-w*.30+k*w*.60/(2+t),w*.38,.22,w*.09,.15,w*.10,'red');if(near)b(-w*.30+k*w*.60/(2+t),w*.436,.24,.023,.04,.006,'pane');}
   for(const side of [-1,1]){slab(side*w*.37,0,base+H*.32,w*.14,w*.67,'stone');b(side*w*.28,0,base+H*.34,.009,.09,w*.71,'gold');}
  }
  if(near){
   if(q.phase>0&&q.kind!==2)b(0,q.kind===0?-w*.07:0,work,w*(q.kind===0?.53:.31),H*(q.kind===0?.16:.20),w*(q.kind===0?.52:.71),'titanium','hullPanels');
   for(const side of [-1,1]){b(side*w*.43,w*.34,base+H*.35,w*.16,H*.60,w*.16,'gold','equipmentLadder');for(let k=0;k<4;k++){const dz=-w*.27+k*w*.18;b(side*w*.14,dz,work-H*.15,w*.04,H*.23,w*.034,'titanium');slab(side*w*.14,dz,work-H*.033,w*.10,w*.08,'dark');}
    b(side*w*.38,0,base+H*.64,.014,.026,w*.80,'gold');for(let k=0;k<13;k++)b(side*w*.38,-w*.38+k*w*.062,base+H*.62,.008,.10,.008,'gold');}
   for(let k=0;k<18;k++){const dx=-w*.34+k*w*.04;b(dx,-w*.47,.31,.015,.20,.012,'titanium');b(dx,-w*.462,.31,.022,.10,.008,'dark');}
   for(let k=0;k<3+t;k++){const dx=-w*.30+k*w*.60/(2+t);for(let j=0;j<6;j++)b(dx-w*.035+j*w*.014,w*.435,.24,.006,.11,.009,'gold');}
   b(0,-w*.40,.50,w*.60,.04,w*.08,'stone');for(const side of [-1,1])b(side*w*.22,-w*.40,.59,w*.075,.16,w*.09,'titanium','recoveryPipes');
   if(q.phase===2||q.kind===2)for(const side of [-1,1]){b(side*w*.28,w*.07,work+H*.12,w*.12,H*.094,w*.46,'titanium','hullPanels');b(side*w*.28,w*.292,work+H*.12,w*.061,H*.045,.016,'pane');}
  }
 }else if(c.branch==='precision'){
  const base=.18,body=H*.58,front=w*.36;
  b(0,-w*.10,base+body/2,w*.93,body,w*.60,'dark');b(0,-w*.10,base+body*.72,w*.95,body*.15,w*.62,'ivory');
  b(0,0,base+body,w*.95,H*.26,w*.91,'ivory',medium?'factoryRoof':'factoryRoofLow');
  for(const side of [-1,1])b(side*w*.46,0,base+body/2,w*.06,body,w*.94,'ivory');
  for(let k=0;k<2+t;k++){const dx=(k-(1+t)/2)*w*.65/(1+t);b(dx,front*.52,.18+body*.29,w*.13,body*.55,w*.19,'titanium',medium?'pressMachine':'pressMachineFar',0x748184);}
  b(w*.39,-w*.35,.18+H*.53,w*.08,H*1.06,w*.12,'titanium',near?'recoveryPipes':'box');
  if(medium){
   for(let k=0;k<3+t;k++){const dx=-w*.34+k*w*.68/(2+t);b(dx,w*.37,.18+body*.49,w*.025,body,w*.05,'ivory');b(dx,-w*.02,base+body*.92,w*.015,.020,w*.83,'gold');slab(dx,w*.18,.18,w*.16,w*.28,'dark');}
   for(let k=0;k<5;k++){const dx=-w*.38+k*w*.19;b(dx,-w*.02,base+body+H*.042,w*.12,.012,w*.69,'pane');}
   for(let k=0;k<2+t;k++){const dx=-w*.33+k*w*.65/(1+t);b(dx,w*.23,.20+body*.36,.013,body*.58,.013,'gold');tank(dx,-w*.40,.19,w*.055,H*.25);}
   if(near){for(let k=0;k<2+t;k++){const dx=(k-(1+t)/2)*w*.65/(1+t);b(dx,front*.52,.20+body*.35,w*.10,body*.12,w*.16,'red','box',0xb98259);b(dx-w*.061,front*.60,.20+body*.29,w*.018,body*.34,w*.02,'gold');}for(let k=0;k<12;k++){b(-w*.38+k*w*.069,w*.39,.16,w*.048,.05,w*.10,'titanium');b(-w*.38+k*w*.069,w*.395,.19,w*.048,.012,w*.10,'gold');}for(let k=0;k<2+t;k++)b(-w*.3+k*w*.6/(1+t),w*.12,.17,w*.08,.12,w*.10,'ivory');}
  }
  if(near){for(let k=0;k<2+t;k++){const dx=(k-(1+t)/2)*w*.65/(1+t);b(dx,front*.52,.18+body*.29,w*.13,body*.55,w*.19,'gold','machineHardware');b(dx,front*.77,.22+body*.19,w*.075,body*.20,.010,'dark');b(dx,front*.79,.24+body*.19,w*.055,body*.12,.006,'pane');}
   for(let k=0;k<5;k++){const dx=-w*.38+k*w*.19;for(let j=0;j<12;j++)b(dx,-w*.39+j*w*.067,base+body+H*.048,w*.122,.018,.009,'titanium');b(dx,-w*.27,base+body+H*.12,w*.085,H*.09,w*.10,'titanium');for(let j=0;j<6;j++)b(dx-w*.032+j*w*.013,-w*.27,base+body+H*.17,.006,.006,w*.09,'dark');}
   b(0,w*.10,base+body*.83,w*.85,body*.12,w*.08,'gold');b(-w*.12,w*.12,base+body*.69,w*.14,body*.15,w*.11,'red');b(w*.43,-w*.31,.20+H*.47,w*.12,H*.9,w*.13,'gold','equipmentLadder');
  }
 }else{
  const n=detail===0?4:4+t;
  for(let k=0;k<n;k++){const a=k*Math.PI*2/n,dx=Math.cos(a)*w*.30,dz=Math.sin(a)*w*.30,ht=H*(.52+k%2*.13);tank(dx,dz,.20,w*.17,ht);if(medium){slab(dx,dz,.23+ht,w*.20,w*.20);b(dx,dz,.28+ht,w*.15,.10,w*.15,'leaf','foliage');}}
  b(0,0,.24+H*.25,w*.43,H*.42,w*.43,'glass',near?'dome':'domeLow');
  for(const q of [.23,.57])b(0,0,.25+H*q,w*.87,.042,w*.85,'titanium',near?'ringDeck':'ringDeckLow');
  if(medium){for(let k=0;k<2+t;k++){const at=.29+H*(.18+k*.15);for(const side of [-1,1])b(side*w*.27,0,at,.018,.020,w*.71,'gold');b(0,w*.27,at,w*.67,.020,.018,'gold');}for(let k=0;k<3+t;k++)b(-w*.22+k*w*.44/(2+t),-w*.32,.27+H*.21,w*.046,H*.31,w*.048,'dark');}
  if(t>=2)b(0,0,.29+H*.75,w*.47,.12,w*.42,'leaf','foliage');if(t===3&&medium)b(0,0,.38+H*.86,w*.34,H*.16,w*.30,'glass','dome');
  if(near){for(let k=0;k<n;k++){const a=k*Math.PI*2/n,dx=Math.cos(a)*w*.30,dz=Math.sin(a)*w*.30,ht=H*(.52+k%2*.13);b(dx,dz,.20+ht*.5,w*.11,ht*.92,w*.11,'gold','recoveryPipes');b(dx,dz+w*.091,.20+ht*.5,w*.065,ht*.90,w*.035,'titanium','equipmentLadder');for(let j=0;j<5;j++)b(dx,dz,.23+ht*j/5,w*.174,.012,w*.174,'gold','treeDeckFar');b(dx*.67,dz*.67,.20+H*.20,w*.12,.030,w*.04,'titanium');}
   for(const dx of [-w*.29,w*.29])for(const dz of [-w*.23,w*.23])b(dx,dz,.21+H*.28,.025,H*.56,.025,'titanium');b(0,0,.24+H*.25,w*.43,H*.42,w*.43,'gold','domeFrame');
   for(let k=0;k<4;k++){const dx=-w*.16+k*w*.107;b(dx,-w*.39,.24,w*.075,.13,w*.12,'titanium');b(dx,-w*.456,.26,w*.048,.045,.006,'pane');for(let j=0;j<5;j++)b(dx-w*.024+j*w*.012,-w*.455,.21,.006,.02,.010,'dark');}
   if(t===3)b(0,0,.38+H*.86,w*.34,H*.16,w*.30,'gold','domeFrame');
  }
 }
 if(near&&occupied)light({x,y:y+w*.43,h:.30,sx:w*.10,sy:.013,sz:.009,color:0xe9c794});
 return true;
}
