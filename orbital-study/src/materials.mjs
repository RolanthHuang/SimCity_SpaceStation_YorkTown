import * as T from '../lib/three.module.js';
import {makeAtelierMaterials} from './atelier-materials.mjs';
function texture(draw,size=1024){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
export function materials(renderer,scene){
 const assets=makeAtelierMaterials(renderer,scene),m=assets.m;
 const paint=texture((c,s)=>{c.fillStyle='#dddeda';c.fillRect(0,0,s,s);let seed=2263;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let y=0;y<16;y++)for(let x=0;x<16;x++){const n=rnd(),px=x*64,py=y*64;c.fillStyle=['#e7e7df','#c7d0cd','#dbe0db','#cdd5d2','#f0ede3'][Math.floor(n*5)];c.fillRect(px+1,py+1,62,62);c.strokeStyle='#a2b0af';c.lineWidth=.65;c.strokeRect(px+1,py+1,62,62);c.strokeStyle='#eef2e9';c.strokeRect(px+2,py+2,60,60);c.fillStyle='#a5b2ae';if(n>.65)c.fillRect(px+8,py+8,20,45);if(n>.84){for(let k=0;k<5;k++){c.fillStyle='#71878b';c.fillRect(px+33,py+11+k*7,23,2);}}for(const q of [6,58]){c.fillStyle='#84979a';c.fillRect(px+q,py+6,1.3,1.3);c.fillRect(px+q,py+58,1.3,1.3);}}
  for(let k=0;k<3000;k++){c.fillStyle=k%2?'#e9e9e01c':'#53676412';c.fillRect(rnd()*s,rnd()*s,1,1);}
 });paint.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const clone=(name,base,color,opts={})=>{m[name]=m[base].clone();m[name].color.set(color);Object.assign(m[name],opts);};
 clone('hull','ivory',0xe2e4df,{map:paint,metalness:.25,roughness:.42,normalScale:new T.Vector2(.035,.035)});
 clone('hullShade','hull',0xa7b9be,{map:null,roughness:.46});clone('steel','titanium',0x718c99,{roughness:.37});clone('navy','dark',0x263e50,{roughness:.48});clone('copper','gold',0xb89974,{roughness:.39});clone('silver','titanium',0xd0dad8,{roughness:.28});
 clone('warmDim','warm',0xffd4a0,{emissiveIntensity:.22});clone('blue','cyan',0x98d8e4,{emissiveIntensity:.3});clone('redLight','warm',0xaf563e,{emissive:new T.Color(0xe86734),emissiveIntensity:.35,roughness:.2,metalness:.22});clone('paneDark','window',0x637f8c,{map:null,metalness:.4,roughness:.23});
 m.collectorRing=new T.MeshStandardMaterial({color:0x702b18,emissive:0xdb6625,emissiveIntensity:.72,roughness:.25,metalness:.38});
 const heat=texture((c,s)=>{const g=c.createRadialGradient(s/2,s/2,s*.05,s/2,s/2,s*.49);g.addColorStop(0,'#fff5d4');g.addColorStop(.24,'#ffc07a');g.addColorStop(.61,'#c25f2d');g.addColorStop(1,'#28140e');c.fillStyle=g;c.fillRect(0,0,s,s);},256);
 m.collectorCore=new T.MeshStandardMaterial({color:0x8f542c,map:heat,emissive:0xf59a4f,emissiveMap:heat,emissiveIntensity:1.35,roughness:.25,metalness:.16});
 m.collectorGlass=new T.MeshPhysicalMaterial({color:0xcd9b75,transparent:true,opacity:.16,depthWrite:false,metalness:.05,roughness:.09,clearcoat:.8,clearcoatRoughness:.08,envMapIntensity:1.1});
 clone('walkway','stone',0xc5d1cc,{roughness:.9});clone('green','ivory',0x83a497,{map:paint});clone('groundDark','stone',0x557276);clone('bluePanel','ivory',0x5c8390);
 m.field=new T.ShaderMaterial({side:T.DoubleSide,transparent:true,depthWrite:false,uniforms:{intensity:{value:0},time:{value:0}},vertexShader:'varying vec2 p;void main(){p=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 p;uniform float intensity;uniform float time;void main(){float r=length(p-.5)*2.;float rim=pow(clamp(r,0.,1.),9.);float ripple=pow(max(0.,sin(r*45.-time*4.)),12.);float a=(rim*.18+ripple*.06)*intensity;gl_FragColor=vec4(.4,.8,1.,a*(1.-smoothstep(.96,1.02,r)));}'});
 return {...assets,m,paint};
}
