import * as T from '../lib/three.module.js';
import {builder,rail,tree,v,surface,label} from './geometry.mjs';
export function harbour(m){
 const root=new T.Group(),b=builder(m,root);root.name='Dawn observation promenade';
 b.box(0,-2.3,60,205,4.4,117,'hullShade');b.box(0,-.18,60,204,.30,116,'stone');b.box(0,-4,60,192,2.0,105,'navy');
 for(const z of [2,14,26,38,50,62,74,86,98,110])b.box(0,.003,z,203,.017,.075,'silver',null,false);
 for(let x=-100;x<=100;x+=8)b.box(x,.005,60,.045,.014,114,'titanium',null,false);
 b.box(9,.024,60,22,.025,114,'walkway',null,false);for(const x of [-2,20])b.box(x,.04,60,.12,.014,114,'copper',null,false);
 for(let z=9;z<110;z+=4.5)b.box(9,.045,z,.09,.012,1.9,'silver',null,false);
 rail(b,v(-101,0,2),v(101,0,2),0);rail(b,v(-101,0,2),v(-101,0,117),0);rail(b,v(101,0,2),v(101,0,117),0);
 // Inlaid gardens, circular seating, planters, and underside service bays.
 for(let k=0;k<7;k++){
  const x=k%2?-27:43,z=20+k*13;
  b.box(x,.40,z,14,.80,8,'hull');b.box(x,.84,z,13,.08,7,'soil');
  for(let j=0;j<3;j++)tree(b,x-4+j*4,.9,z,4.2+j%2,k+j);
  b.box(x,.95,z+4.2,12,.24,1.15,'wood');b.box(x,1.15,z+4.6,12,.10,.12,'silver');
 }
 for(let i=0;i<25;i++){
  const x=-96+i*8;b.box(x,-1.2,1,6.5,1.9,.30,'navy');b.box(x,-1.0,.76,5.5,.12,.12,'silver');
  b.beam(v(x-2,-3,1),v(x,-7,-5),.23,'steel');b.beam(v(x+2,-3,1),v(x,-7,-5),.23,'steel');
 }
 for(let i=0;i<9;i++){const x=-87+i*21;b.cylinder(x,2.5,6,.18,5,.18,'steel');b.box(x,5,6,1.8,.12,.4,'warmDim',null,false);}
 // Port reception pavilion: colonnade, louvers and a visibly recessed public arcade.
 for(const side of [-1,1]){
  const p=new T.Group();p.position.set(side*74,0,54);root.add(p);const a=builder(m,p);
  a.box(0,.15,0,33,.30,68,'walkway');a.box(0,15,0,34,.7,67,'hull');a.box(0,15.45,0,30,.1,63,'copper');
  a.box(side*7,7,-1,15,14,60,'paneDark');a.box(side*7,14.55,0,15,.30,63,'silver');
  for(let z=-30;z<=30;z+=5){a.box(-side*13,7.5,z,.65,15,.65,'hull');a.box(-side*13,8.8,z,.7,.13,1.1,'copper');a.box(side*.1,7,z,.12,13.8,.5,'silver');}
  for(let y=1.5;y<14;y+=2.2)a.box(side*7,y,-31.3,14,.10,.09,'steel');
  for(let z=-25;z<30;z+=8){a.box(side*7,4,z,12,.15,.5,'warmDim',null,false);a.box(side*7,2,z,8,.10,3.4,'wood');a.box(side*7,.75,z,8,1.4,.25,'steel');}
  a.finish();
 }
 const sign=label('YORKTOWN','HORIZON PORT   ·   DAWN OBSERVATORY',16,4);sign.position.set(-58,10,22.4);root.add(sign);
 // Dock fingers reach below the flagship, with real trusses and separate service decks.
 for(const x of [-40,-15]){
  b.box(x,1,-28,6,2,60,'hullShade');b.box(x,2.08,-28,5.7,.10,59,'walkway');
  for(const xx of [x-2.5,x+2.5])rail(b,v(xx,0,0),v(xx,0,-54),2.1);
  for(let z=-4;z>-56;z-=6){b.beam(v(x-2,-1,z),v(x+2,-6,z-3),.15,'steel');b.beam(v(x+2,-1,z),v(x-2,-6,z-3),.15,'steel');}
  b.box(x,5.6,-42,7,7,10,'hull');b.box(x,7.4,-36.8,6,2,.12,'paneDark');
 }
 // An articulated service arm connects towards the ship without hiding its silhouette.
 const arm=new T.Group();arm.position.set(-15,8,-37);root.add(arm);const a=builder(m,arm);
 a.cylinder(0,0,0,3,2,3,'steel');a.beam(v(0,0,0),v(-5,16,-1),.8,'hull');a.beam(v(-5,16,-1),v(-10,35,-3),.65,'hullShade');a.beam(v(-10,35,-3),v(-13,43,-7),.45,'silver');
 for(let k=0;k<12;k++){const y=9+k*2.5;a.box(-3-y*.16,y,-1-y*.10,1.4,.18,1.9,'copper',new T.Euler(0,0,-.24));}a.finish();
 b.finish();return {root,arm};
}
export function distantCity(m){
 const root=new T.Group(),b=builder(m,root);root.name='Layered city ribbons';
 for(let tier=0;tier<3;tier++){
  const z=-620-tier*200,y=-60+tier*120;
  const bridge=surface((u,w)=>{const x=-900+1800*u;return v(x,y+(x*x)*.00002,z+(w-.5)*25);},140,1);b.mesh(bridge,'walkway',null,null,false);
  for(let i=0;i<80;i++){
   const x=-890+i*23,h=12+(i*13+tier*17)%60,w=5+(i*7)%8,yy=y+x*x*.00002;
   b.box(x,yy+h/2,z-5,w,h,8,i%5===0?'hullShade':i%3?'hull':'bluePanel',null,false);
   b.box(x-w*.38,yy+h/2,z-.82,.3,h,.15,'silver',null,false);b.box(x+w*.38,yy+h/2,z-.82,.3,h,.15,'silver',null,false);
   for(let j=3;j<h;j+=3)b.box(x,yy+j,z-.73,w*.72,.19,.08,j%9?'paneDark':'warmDim',null,false);
   if(i%9===0)b.cylinder(x,yy+h+3,z-5,w*.8,6,6,'silver',null,false);
  }
  for(let x=-800;x<=800;x+=80){b.beam(v(x,y+x*x*.00002,z),v(x+30,y-65+x*x*.00002,z-5),1.0,'hullShade');}
 }
 b.finish();root.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});return root;
}
export function sky(scene){
 const sky=new T.Mesh(new T.SphereGeometry(2800,48,24),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 p;void main(){vec3 d=normalize(p);vec3 c=mix(vec3(.24,.34,.42),vec3(.035,.075,.145),smoothstep(-.25,.70,d.y));float glow=pow(max(0.,dot(d,normalize(vec3(-.65,.28,.45)))),22.);c=mix(c,vec3(1.,.85,.63),glow*.65);gl_FragColor=vec4(c,1.);}'}));scene.add(sky);
 const cv=document.createElement('canvas');cv.width=1024;cv.height=512;const c=cv.getContext('2d'),img=c.createImageData(1024,512);
 const hash=(x,y,z)=>{let h=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(z,2147483647);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;};
 const noise=(x,y,z)=>{const i=Math.floor(x),j=Math.floor(y),k=Math.floor(z),s=t=>t*t*(3-2*t),a=s(x-i),b=s(y-j),d=s(z-k),mix=(p,q,t)=>p+(q-p)*t;return mix(mix(mix(hash(i,j,k),hash(i+1,j,k),a),mix(hash(i,j+1,k),hash(i+1,j+1,k),a),b),mix(mix(hash(i,j,k+1),hash(i+1,j,k+1),a),mix(hash(i,j+1,k+1),hash(i+1,j+1,k+1),a),b),d);};
 const fbm=(x,y,z)=>{let n=0,amp=.55;for(let k=0;k<5;k++){n+=noise(x,y,z)*amp;x=x*2.03+7;y=y*2.03+3;z=z*2.03+11;amp*=.48;}return n;};
 for(let y=0;y<512;y++)for(let x=0;x<1024;x++){
  const u=x/1024*Math.PI*2,w=y/512*Math.PI,xx=Math.cos(u)*Math.sin(w),yy=Math.cos(w),zz=Math.sin(u)*Math.sin(w);
  const n=fbm(xx*3.4+15,yy*3.4+12,zz*3.4+9),small=fbm(xx*29,yy*29,zz*29),height=Math.max(0,n-.49);
  const clouds=fbm(xx*12+yy*1.4,yy*12+20,zz*12),cloud=Math.min(.87,Math.max(0,(clouds-.49)*5));
  const ice=Math.pow(Math.abs(yy),18),v=(y*1024+x)*4;
  const land=n>.49,base=land?[100+height*190+small*19,118+height*160+small*12,91+height*190+small*18]:[32+small*17,75+small*21,108+small*31];
  for(let k=0;k<3;k++)img.data[v+k]=base[k]*(1-cloud-ice*.12)+(cloud+ice*.12)*[222,228,222][k];img.data[v+3]=255;
 }c.putImageData(img,0,0);const map=new T.CanvasTexture(cv);map.colorSpace=T.SRGBColorSpace;
 const planet=new T.Mesh(new T.SphereGeometry(620,96,64),new T.MeshStandardMaterial({map,roughness:1}));planet.position.set(-590,-490,-1220);planet.rotation.z=.30;planet.rotation.y=.55;scene.add(planet);
 const atmosphere=new T.Mesh(new T.SphereGeometry(624,64,40),new T.ShaderMaterial({side:T.BackSide,transparent:true,depthWrite:false,vertexShader:'varying vec3 n;varying vec3 e;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);e=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',fragmentShader:'varying vec3 n;varying vec3 e;void main(){float a=pow(1.-abs(dot(normalize(n),normalize(e))),3.);gl_FragColor=vec4(.46,.75,1.,a*.4);}'}));atmosphere.position.copy(planet.position);scene.add(atmosphere);
 let seed=867;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},positions=[];
 for(let i=0;i<900;i++){const a=rnd()*Math.PI*2,h=.20+rnd()*.75,r=Math.sqrt(1-h*h);positions.push(Math.cos(a)*r*2300,h*2300,Math.sin(a)*r*2300);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));scene.add(new T.Points(g,new T.PointsMaterial({color:0xc2d5e2,size:1.7,sizeAttenuation:false,transparent:true,opacity:.65,depthWrite:false})));
 const glow=new T.Mesh(new T.PlaneGeometry(500,500),new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,vertexShader:'varying vec2 p;void main(){p=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 p;void main(){vec2 q=p-.5;float r=length(q)*2.;float a=pow(max(0.,1.-r),7.)*.7;float flare=exp(-abs(q.y)*100.)*exp(-abs(q.x)*9.)*.06;gl_FragColor=vec4(1.,.81,.52,a+flare);}'}));glow.position.set(-950,400,100);glow.lookAt(0,60,-70);scene.add(glow);
}
