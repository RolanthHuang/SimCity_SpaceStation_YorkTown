// Shared close-range construction details; the city's simulation and footprint stay unchanged.
export function sailProfile(u){
 let lo=0,hi=1;
 const cubic=(t,a,b,c,d)=>(1-t)**3*a+3*(1-t)**2*t*b+3*(1-t)*t*t*c+t**3*d;
 for(let k=0;k<14;k++){const t=(lo+hi)/2;if(cubic(t,-.5,-.05,.43,.5)<u-.5)lo=t;else hi=t;}
 const left=cubic((lo+hi)/2,-.5,-.45,.2,.5);
 return {center:(left+.5)/2,width:Math.max(.018,.5-left)};
}

export function towerDetails({x,y,dx=0,dz=0,width,depth,height,base,palette:p,zone='R',sail=false,occupied=false,far=false,footprint=1,add,light=()=>{}}){
 if(far)return;
 const limit=footprint/2-.008;
 const b=(a,z,h,w,t,d,role='ivory',color)=>{const left=Math.max(-limit,a-w/2),right=Math.min(limit,a+w/2),back=Math.max(-limit,z-d/2),front=Math.min(limit,z+d/2);if(right-left<.001||front-back<.001)return;add(x+(left+right)/2,y+(back+front)/2,h,right-left,t,front-back,color??({ivory:p.white,stone:p.stone,titanium:p.metal,gold:p.gold,dark:p.dark,pane:p.glass,red:p.accent}[role]||p.white),'box',role);};
 const rows=Math.min(22,Math.max(2,Math.round(height/.28))),rowH=height/rows;
 for(let row=0;row<rows;row++){
  const profile=sail?sailProfile((row+.96)/rows):{center:0,width:1};
  const usable=width*profile.width*.94,center=dx+width*profile.center,bays=Math.min(7,Math.max(1,Math.round(usable/.23))),bw=usable/bays,ht=base+(row+.5)*rowH;
  if(usable<.033)continue;
  for(const side of [-1,1]){
   const face=dz+side*(depth/2);
   b(center,face+side*.023,ht,usable,rowH*.88,.020,'dark');
   for(let col=0;col<bays;col++){
    const cx=center-usable/2+(col+.5)*bw,clad=col===0&&row%4!==3;
    if(clad){b(cx,face+side*.041,ht,bw*.94,rowH*.90,.028,'red');
     b(cx,face+side*.057,ht-rowH*.29,bw*.75,.008,.006,'titanium');}
    else {
     b(cx,face+side*.036,ht,bw*.89,rowH*.73,.008,'pane',(row+col)%5===0?p.glassLight:p.glass);
     b(cx-bw*.48,face+side*.050,ht,.008,rowH*.94,.032,'titanium');
     b(cx,face+side*.053,ht-rowH*.44,bw,.012,.036,'ivory');
     if(occupied&&(row*7+col*3+(side>0?2:0))%13===0)light({x:x+cx,y:y+face+side*.042,h:ht-rowH*.12,sx:bw*.72,sy:rowH*.20,sz:.005,color:0xdcbc85});
    }
   }
   // Deeper loggias and slim metal rails break up residential facades.
   if(zone==='R'&&row>0&&row%3===1){
    b(center,face+side*.070,ht-rowH*.44,usable,.014,.110,'ivory');
    b(center,face+side*.119,ht-rowH*.10,usable,.008,.008,'gold');
    for(let k=0;k<=bays;k++)b(center-usable/2+k*bw,face+side*.119,ht-rowH*.27,.006,rowH*.34,.009,'titanium');
   }
  }
  // The side elevations have the same recessed glazing as the street-facing facade.
  const sideBays=Math.min(6,Math.max(2,Math.round(depth/.16))),sideW=depth*.94/sideBays;
  for(const side of sail?[1]:[-1,1]){
   const face=dx+side*width/2;
   b(face+side*.014,dz,ht,.020,rowH*.88,depth*.94,'dark');
   for(let col=0;col<sideBays;col++){
    const cz=dz-depth*.47+(col+.5)*sideW;
    if((row+col*3)%11===0)b(face+side*.027,cz,ht,.020,rowH*.84,sideW*.88,'red');
    else b(face+side*.025,cz,ht,.008,rowH*.73,sideW*.87,'pane',(row+col)%5===0?p.glassLight:p.glass);
    b(face+side*.036,cz-sideW*.48,ht,.029,rowH*.94,.007,'titanium');
    b(face+side*.038,cz,ht-rowH*.43,.032,.009,sideW,'ivory');
   }
  }
 }
 // A continuous curved structural rib follows the actual sail rather than floating beside it.
 if(sail){for(let k=0;k<24;k++){const q=sailProfile((k+.5)/24),cx=dx+width*(q.center-q.width/2);for(const side of [-1,1])b(cx,dz+side*(depth/2+.035),base+(k+.5)*height/24,.020,height/24*1.04,.038,'ivory');}}
 // Rooftop service plant has grilles, raised feet and a metal service walkway.
 if(!sail){const ht=base+height+.026,eqW=width*.37,eqD=depth*.31;
  b(dx,dz,ht+.030,eqW,.060,eqD,'titanium');
  for(let k=0;k<6;k++)b(dx-eqW*.42+k*eqW*.84/5,dz,ht+.065,eqW*.05,.008,eqD*.88,'dark');
  for(const side of [-1,1])b(dx+side*eqW*.36,dz,ht-.008,.014,.025,eqD*.8,'gold');
 }
}

export function processDetails({x,y,c,width:w,height,add,palette:p}){
 const b=(dx,dz,h,sx,sy,sz,role='titanium',shape='box')=>add(x+dx,y+dz,h,sx,sy,sz,p[role]||p.titanium,shape,role);
 const n=Math.max(1,c.span||1),tankW=n===1?w*.48:w*.35;
 if(['power','water','life','fabricator'].includes(c.type))for(let k=0;k<n;k++){
  const dx=n===1?0:(k-(n-1)/2)*w*.60/(n-1),h=c.type==='power'?height:height*.65;
  b(dx,-w*.15,.36+h*.52,tankW*1.025,.019,tankW*1.025,'gold','ringDeck');
  for(const side of [-1,1]){
   b(dx+side*tankW*.30,-w*.15+tankW*.40,.36+h*.47,.018,h*.71,.022,'glass');
   b(dx+side*tankW*.32,-w*.15+tankW*.39,.36+h*.88,.057,.045,.057,'gold','cylinder');
  }
  b(dx,-w*.15,.37+h,tankW*.31,.042,tankW*.31,'dark','cylinder');
  b(dx,w*.10,.45,tankW*.46,.05,.035,'glass');
  b(dx,w*.02,.52,.035,.21,.035,'gold');
 }
 // Recessed service bays, cooling grilles, cable trays and maintenance access.
 b(0,w*.404,.23,w*.27,.18,.027,'dark');b(0,w*.424,.23,w*.21,.13,.009,'pane');
 for(let k=0;k<5;k++)b(-w*.30+k*w*.10,w*.402,.30,w*.060,.014,.035,'titanium');
 for(const side of [-1,1]){
  b(side*w*.35,w*.33,.125,w*.18,.017,w*.22,'ivory');
  b(side*w*.35,w*.40,.24,w*.17,.009,.009,'gold');
  for(const u of [-.07,.07])b(side*w*.35+w*u,w*.40,.18,.008,.12,.010,'titanium');
 }
}
