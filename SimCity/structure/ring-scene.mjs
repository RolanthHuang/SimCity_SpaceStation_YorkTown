import * as T from '../../YorktownPreview/three.module.js';
import {v,makeBuilder,surfaceGeometry,curvePoints,tree,shellPoint} from './geometry.mjs';
export const RING_RADIUS=185;
export function ringPoint(angle,r=RING_RADIUS,z=0){return v(Math.sin(angle)*r,RING_RADIUS-Math.cos(angle)*r,z);}
export function placeOnRing(group,x,z){const angle=Math.asin(x/RING_RADIUS);group.position.copy(ringPoint(angle,RING_RADIUS,z));group.rotation.z=angle;}
export function makeRingScene(m){
 const root=new T.Group(),b=makeBuilder(m,root),cars=[];
 b.mesh(surfaceGeometry((u,t)=>ringPoint((u-.5)*Math.PI*2,RING_RADIUS,-43+t*86),240,8),'deck');
 b.mesh(surfaceGeometry((u,t)=>ringPoint((u-.5)*Math.PI*2,RING_RADIUS+7,-40+t*80),240,8),'ivoryCool');
 for(const z of [-42.8,42.8])for(const r of [185,192])b.tube(curvePoints(t=>ringPoint((t-.5)*Math.PI*2,r,z),240),r===185?.30:.65,r===185?'champagne':'steel',true);
 for(let k=0;k<72;k++){
  const a=-Math.PI+k*Math.PI/36;
  for(const z of [-42,42]){
   const p=ringPoint(a,191,z),q=ringPoint(a+.065,185,z),s=ringPoint(a-.065,185,z);b.beam(p,q,.25,'steel');b.beam(p,s,.25,'steel');b.beam(p,ringPoint(a,191,-z),.13,'titanium');
   const plate=new T.Mesh(new T.BoxGeometry(4,.32,1.8),m.ivoryWarm);plate.position.copy(ringPoint(a,190.4,z));plate.rotation.z=a;root.add(plate);
  }
 }
 for(const z of [-25,25]){
  b.mesh(surfaceGeometry((u,t)=>ringPoint((u-.5)*Math.PI*2,184.8,z-3+t*6),240,2),'steel');
  b.tube(curvePoints(t=>ringPoint((t-.5)*Math.PI*2,184.6,z-2.8),240),.045,'ivory',true);b.tube(curvePoints(t=>ringPoint((t-.5)*Math.PI*2,184.6,z+2.8),240),.045,'ivory',true);
 }
 // A legible secondary infrastructure level, with spars, service panels and rails.
 for(const z of [-35.5,-33.5])b.tube(curvePoints(t=>ringPoint((t-.5)*Math.PI*2,181.8,z),240),.18,'titanium',true);
 for(let k=0;k<96;k++){const a=-Math.PI+k*Math.PI/48;b.beam(ringPoint(a,185,-34.5),ringPoint(a,181.8,-34.5),.14,'steel');b.beam(ringPoint(a,182.3,-36.2),ringPoint(a,182.3,-32.8),.11,'champagne');}
 // Background neighborhoods are instanced, varied in silhouette, color and voids.
 for(let i=0;i<98;i++){
  const a=-Math.PI+(i+.37)*Math.PI*2/98;if(Math.abs(a)<.43)continue;
  const z=i%2?-11:10,h=5+(i*17%25),w=3.6+(i%3)*1.2,d=6.4,role=['ivory','ivoryCool','ivoryWarm','terracotta'][i%4];
  const pos=(x,y,zz)=>ringPoint(a).add(v(Math.cos(a)*x-Math.sin(a)*y,Math.sin(a)*x+Math.cos(a)*y,z+zz));
  const box=(x,y,zz,w,h,d,mat)=>{const p=pos(x,y,zz);b.part('box',p.x,p.y,p.z,w,h,d,mat,new T.Euler(0,0,a));};
  box(0,.18,0,w+1.3,.36,d+1.1,'ivoryCool');box(0,h*.5,0,w,h,d,role);
  for(let f=0;f<Math.ceil(h/2);f++){const y=1+f*1.8;for(const side of [-1,1]){box(0,y,side*3.24,w*.88,1.22,.10,i%4===0?'violet':i%3===0?'teal':'deepGlass');box(0,y-.72,side*3.34,w+.13,.10,.35,'ivory');for(let k=0;k<4;k++)box((k/3-.5)*w*.89,y,side*3.36,.045,1.28,.12,'steel');}}
  if(i%3===0){box(w*.37,h+1.8,0,w*.38,3.6,d*.8,'ivoryWarm');box(-w*.38,h*.62,0,w*.37,h*.52,d*.85,'teal');}
  if(i%5===0){box(0,h+.38,0,w+.5,.12,d+.5,'champagne');box(0,h+.74,0,w*.58,.68,d*.6,'steel');}
 }
 for(let i=0;i<5;i++){
  const car=new T.Group(),c=makeBuilder(m,car);c.box(0,0,0,9.2,1.18,1.45,'ivory');c.box(0,.18,0,7.8,.60,1.52,'deepGlass');c.box(0,.73,0,8.7,.19,1.28,'ivoryWarm');for(const x of [-3.9,3.9])c.box(x,-.41,0,.35,.16,1.55,'champagne');c.finish();root.add(car);cars.push(car);
 }
 // A branching promenade and canal through the foreground district.
 for(const z of [25.3,39]){
  b.mesh(surfaceGeometry((u,t)=>ringPoint((u-.5)*.83,RING_RADIUS-.05,z-2+t*4),96,2),z===25.3?'stone':'water');
  for(const zz of [z-2.1,z+2.1])b.tube(curvePoints(t=>ringPoint((t-.5)*.83,RING_RADIUS-.6,zz),80),.055,'champagne');
 }
 for(let i=0;i<17;i++){
  const x=-67+i*8.2,angle=Math.asin(x/RING_RADIUS),g=new T.Group(),p=makeBuilder(m,g);p.box(0,.45,0,2.5,.90,2.7,'ivoryWarm');p.box(0,.92,0,2.25,.06,2.45,'soil');tree(p,0,.98,0,3.0+(i%3)*.5,i%4);p.finish();placeOnRing(g,x,30.0);root.add(g);
 }
 for(const x of [-53,-5,45]){
  const g=new T.Group(),p=makeBuilder(m,g);p.box(0,.62,0,10.8,.26,9.5,'ivory');for(const z of [-4.6,4.6])p.beam(v(-5.3,1.62,z),v(5.3,1.62,z),.035,'champagne');for(let xx=-4.5;xx<=4.5;xx+=1.5)for(const z of [-4.6,4.6])p.cylinder(xx,1.12,z,.05,1,.05,'steel');p.finish();placeOnRing(g,x,39);root.add(g);
 }
 b.finish();return {root,animate(time){cars.forEach((car,i)=>{const angle=-Math.PI+((time*.011+i*Math.PI*.4)%(Math.PI*2));car.position.copy(ringPoint(angle,181.10,-34.5));car.rotation.z=angle;});}};
}
export function makeGarden(m,state){
 const root=new T.Group(),gm={...m};for(const name of ['foliage','foliagePale','foliageBlue','foliageAmber']){gm[name]=m[name].clone();gm[name].color.lerp(new T.Color(0x9b8c6e),1-state.health);}const b=makeBuilder(gm,root);root.userData.ownedMaterials=['foliage','foliagePale','foliageBlue','foliageAmber'].map(name=>gm[name]);
 b.box(0,.12,0,31.6,.24,31.6,'ivoryCool');
 // The garden cantilevers past the rim: a deep box girder and diagonal ties carry it.
 b.box(0,-1.0,0,30.8,1.8,31,'steel');b.box(0,-.37,0,31.0,.16,31.2,'ivoryWarm');
 for(const x of [-15,0,15]){b.beam(v(x,-1.9,-15.2),v(x,-1.9,15.2),.21,'titanium');for(const z of [-12,-4,4,12]){b.beam(v(x,-1.9,z),v(x,-.15,z+3),.12,'champagne');b.beam(v(x,-.15,z),v(x,-1.9,z+3),.12,'steel');}}
 for(const x of [-12,-4,4,12])b.beam(v(x,-6.1,-18),v(x,-1.3,12),.28,'steel');
 for(const x of [-14,-7,0,7,14]){b.box(x,-1.08,15.57,5.6,1.12,.14,'ivoryCool');b.box(x,-1.12,15.69,3.2,.15,.08,'copper');}

 for(let z=0;z<3;z++)for(let x=0;x<3;x++){
  const px=(x-1)*10,pz=(z-1)*10;b.box(px,.28,pz,9.5,.30,9.5,'stone');b.box(px,.55,pz,7.8,.18,7.8,'soil');b.box(px,.68,pz,7.4,.07,7.4,'grass');
  tree(b,px-2.2,.7,pz-1.8,2.8+state.stage*.3,(x+z)%4);tree(b,px+2.3,.7,pz+1.7,2.2+state.stage*.3,(x+z+2)%4);
  b.box(px+1.4,1.13,pz-3.6,3.2,.17,.60,'wood');for(let i=0;i<14;i++){const xx=px-3.0+(i%7)*.88,zz=pz+3.0+Math.floor(i/7)*.25;b.cylinder(xx,.87,zz,.015,.26,.015,'foliage');b.sphere(xx,1.02,zz,.07,.08,.07,'champagne');for(let petal=0;petal<5;petal++){const a=petal*Math.PI*.4;b.sphere(xx+Math.cos(a)*.09,1.01,zz+Math.sin(a)*.09,.12,.048,.12,(i+x)%3?'flower':'lavender');}}
 }
 if(state.stage>=2){
  b.box(-4.9,.58,-4.9,15.0,.30,15.0,'ivoryWarm');b.box(-4.9,.77,-4.9,12.8,.10,12.8,'water');
  for(let k=0;k<5;k++)b.box(-5.0+k*2.8,1.02,-5.0,2.1,.22,3.0,'ivoryCool');
  for(const x of [-13,3.4]){b.cylinder(x,2.7,-4.9,.16,5.4,.16,'titanium');b.beam(v(x,5.4,-13),v(x,5.4,3.4),.14,'ivory');}
  for(let i=0;i<8;i++){const x=-12+i*2.0;b.box(x,5.35,-4.9,.055,.19,16.4,'champagne');}
  b.box(-5,1.18,-5,3.0,.30,3.0,'stone');b.sphere(-5,2.1,-5,.8,1.5,.8,'cyanDim');
 }
 if(state.stage>=3){
  // A lightweight multi-level canopy with a genuine inner opening and structural ribs.
  const canopy=surfaceGeometry((u,t)=>{const a=(u-.5)*Math.PI*1.7,r=9+t*4.3;return v(Math.sin(a)*r,6.2+2.8*Math.sin(Math.PI*t)+.6*Math.cos(a),Math.cos(a)*r);},96,18);b.mesh(canopy,'shell');
  for(let k=0;k<19;k++){const a=-Math.PI*.85+k*Math.PI*1.7/18;const pts=curvePoints(t=>{const r=9+t*4.3;return v(Math.sin(a)*r,6.0+2.8*Math.sin(Math.PI*t)+.6*Math.cos(a),Math.cos(a)*r);},24);b.tube(pts,.085,'titanium');}
  for(let k=0;k<8;k++){const a=-Math.PI*.8+k*Math.PI*1.6/7,p=v(Math.sin(a)*12.3,6.9,Math.cos(a)*12.3);b.beam(v(p.x,.6,p.z),p,.16,'ivory');b.beam(v(p.x+1.4,1.0,p.z),p,.07,'steel');}
  for(const z of [-11.2,11.2]){b.box(0,3.25,z,27,.25,1.7,'ivory');b.beam(v(-13.2,4.35,z-.80),v(13.2,4.35,z-.80),.039,'champagne');b.beam(v(-13.2,4.35,z+.80),v(13.2,4.35,z+.80),.039,'champagne');for(let x=-13;x<=13;x+=1.5)for(const zz of [z-.8,z+.8])b.cylinder(x,3.8,zz,.043,1.1,.043,'steel');}
  for(const x of [-12.2,12.2]){b.box(x,3.24,0,1.7,.24,22,'ivory');for(const z of [-9,0,9]){b.box(x,3.8,z,1.6,1.05,2.2,'terracotta');tree(b,x,4.35,z,3.0,2);}}
  for(let k=0;k<18;k++)b.box(9.3,1.0+k*.135,-7.8+k*.24,3.8,.13,.35,'stone');
 }
 b.finish();return root;
}
export function makeSky(scene){
 const sky=new T.Mesh(new T.SphereGeometry(1400,48,24),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 p;void main(){vec3 d=normalize(p);float h=d.y;vec3 c=mix(vec3(.37,.54,.66),vec3(.035,.10,.18),smoothstep(-.10,.84,h));float dawn=pow(max(dot(d,normalize(vec3(-.7,.08,.5))),0.),18.);c=mix(c,vec3(.80,.70,.52),dawn*.53);vec2 grid=vec2(atan(d.z,d.x),asin(d.y))*360.;vec2 cell=floor(grid);float n=fract(sin(dot(cell,vec2(127.1,311.7)))*43758.5453);float star=step(.9965,n)*(1.-smoothstep(.035,.18,length(fract(grid)-.5)))*smoothstep(.03,.70,h);c+=vec3(.56,.66,.74)*star;gl_FragColor=vec4(c,1.);}'}));scene.add(sky);
 const planet=new T.Mesh(new T.SphereGeometry(145,96,64),new T.ShaderMaterial({
 vertexShader:`varying vec3 p;varying vec3 viewN;varying vec3 viewP;void main(){p=position;viewN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);viewP=-mv.xyz;gl_Position=projectionMatrix*mv;}`,
 fragmentShader:`varying vec3 p;varying vec3 viewN;varying vec3 viewP;
 float hash(vec3 a){a=fract(a*.1031);a+=dot(a,a.yzx+33.33);return fract((a.x+a.y)*a.z);}
 float noise(vec3 a){vec3 i=floor(a),f=fract(a);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
 float fbm(vec3 a){float sum=0.,w=.5;for(int k=0;k<5;k++){sum+=w*noise(a);a=a*2.03+vec3(17.1,9.2,4.7);w*=.5;}return sum;}
 void main(){vec3 d=normalize(p);float land=fbm(d*3.8+vec3(1.2,4.7,8.9));float high=fbm(d*28.);vec3 ocean=mix(vec3(.025,.11,.23),vec3(.045,.32,.46),smoothstep(.40,.55,land));vec3 ground=mix(vec3(.14,.24,.19),vec3(.47,.42,.30),smoothstep(.48,.68,high+abs(d.y)*.12));vec3 c=mix(ocean,ground,smoothstep(.51,.535,land));float cloud=fbm(d*15.+vec3(8,3,13));cloud=pow(smoothstep(.42,.69,cloud+abs(d.y)*.13),1.8);c=mix(c,vec3(.80,.83,.81),cloud*.88);float light=.12+.88*max(dot(d,normalize(vec3(-.8,.6,.7))),0.);c*=light;float rim=pow(1.-max(dot(normalize(viewN),normalize(viewP)),0.),3.6);c=mix(c,vec3(.20,.46,.69),rim*.78);gl_FragColor=vec4(c,1.);}`
 }));planet.position.set(-390,240,-580);scene.add(planet);return {sky,planet};
}
