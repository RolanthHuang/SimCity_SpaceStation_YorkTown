import * as T from '../lib/three.module.js';
import {makeAtelierMaterials} from './atelier-materials.mjs';
function texture(draw,size=1024){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
export function materials(renderer,scene){
 const assets=makeAtelierMaterials(renderer,scene),m=assets.m;
 const paint=texture((c,s)=>{c.fillStyle='#cbd1ce';c.fillRect(0,0,s,s);let seed=2263;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  // Fine machining and irregular panel joins, with no large checkerboard.
  for(let y=0;y<24;y++)for(let x=0;x<12;x++){
   const px=x*s/12+(y%2)*18,py=y*s/24,w=s/12,h=s/24;
   c.fillStyle=['#cbd2cf','#d2d6d2','#c6cfcd','#d6d9d3'][Math.floor(rnd()*4)];c.fillRect(px+.8,py+.8,w-1.6,h-1.6);
   c.strokeStyle='#9eaca92c';c.lineWidth=.6;c.strokeRect(px+.8,py+.8,w-1.6,h-1.6);
   if(rnd()>.78){c.strokeStyle='#86999566';c.strokeRect(px+7,py+8,13,17);c.fillStyle='#a9b5b0';c.fillRect(px+9,py+10,9,13);}
  }
  for(let k=0;k<5000;k++){c.fillStyle=k%2?'#eff0e720':'#526c7217';c.fillRect(rnd()*s,rnd()*s,1,rnd()*9+1);}
 });paint.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const clone=(name,base,color,opts={})=>{m[name]=m[base].clone();m[name].color.set(color);Object.assign(m[name],opts);};
 clone('hull','ivory',0xcfd5d0,{map:paint,metalness:.42,roughness:.39,normalScale:new T.Vector2(.035,.035)});
 clone('hullShade','hull',0x748993,{map:null,roughness:.47});clone('plate','hull',0xd5d9d2,{map:paint,metalness:.52,roughness:.42});clone('plateShade','hull',0xa3b0b2,{map:paint,metalness:.48,roughness:.45});clone('plateWarm','hull',0xc8c5b7,{map:null,metalness:.42,roughness:.43});clone('steel','titanium',0x718c99,{roughness:.37});clone('navy','dark',0x263e50,{roughness:.48});clone('copper','gold',0xb89974,{roughness:.39});clone('silver','titanium',0xd0dad8,{roughness:.28});
 clone('warmDim','warm',0xffd4a0,{emissiveIntensity:.22});clone('blue','cyan',0x98d8e4,{emissiveIntensity:.3});clone('redLight','warm',0xaf563e,{emissive:new T.Color(0xe86734),emissiveIntensity:.35,roughness:.2,metalness:.22});clone('paneDark','window',0x637f8c,{map:null,metalness:.4,roughness:.23});
 m.collectorRing=new T.MeshStandardMaterial({color:0x493320,emissive:0xdb8a3b,emissiveIntensity:.43,roughness:.34,metalness:.70});
 const heat=texture((c,s)=>{const g=c.createRadialGradient(s/2,s/2,s*.05,s/2,s/2,s*.49);g.addColorStop(0,'#fff5d4');g.addColorStop(.24,'#ffc07a');g.addColorStop(.61,'#c25f2d');g.addColorStop(1,'#28140e');c.fillStyle=g;c.fillRect(0,0,s,s);},256);
 m.collectorCore=new T.MeshStandardMaterial({color:0x353e41,map:heat,emissive:0xffe6b4,emissiveMap:heat,emissiveIntensity:1.8,roughness:.35,metalness:.3});
 m.collectorGlass=new T.MeshPhysicalMaterial({color:0x7e5a40,transparent:true,opacity:.20,depthWrite:false,metalness:.05,roughness:.16,clearcoat:.65,clearcoatRoughness:.08,envMapIntensity:1.1});
 clone('walkway','stone',0xc5d1cc,{roughness:.9});clone('green','ivory',0x83a497,{map:paint});clone('groundDark','stone',0x557276);clone('bluePanel','ivory',0x5c8390);
 m.field=new T.ShaderMaterial({side:T.DoubleSide,transparent:true,depthWrite:false,uniforms:{intensity:{value:0},time:{value:0}},vertexShader:'varying vec2 p;void main(){p=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 p;uniform float intensity;uniform float time;void main(){float r=length(p-.5)*2.;float rim=pow(clamp(r,0.,1.),9.);float ripple=pow(max(0.,sin(r*45.-time*4.)),12.);float a=(rim*.18+ripple*.06)*intensity;gl_FragColor=vec4(.4,.8,1.,a*(1.-smoothstep(.96,1.02,r)));}'});
 return {...assets,m,paint};
}
