import * as THREE from '../YorktownPreview/three.module.js';
import {LAYOUTS,ROOMS,FLOOR_HEIGHT,CELL,moveInterior,nearbyRoom} from './interior-layout.mjs';
// Only this visited, three-floor building is loaded; no generic control rooms.
export class InteriorRoom{
 constructor(type){
  this.type=type;this.resources=[];this.found=new Set();this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x899faa);
  this.scene.add(new THREE.HemisphereLight(0xe8f3f5,0x8b887d,2));const sun=new THREE.DirectionalLight(0xffe0b0,2.7);sun.position.set(-6,13,5);this.scene.add(sun);
  const geo=new THREE.BoxGeometry(1,1,1);this.resources.push(geo);
  const material=(color,glow=false)=>{const m=glow?new THREE.MeshBasicMaterial({color}):new THREE.MeshStandardMaterial({color,roughness:.62,metalness:.18});this.resources.push(m);return m;};
  const wall=material(0xd9dbd0),floor=material(0xaab9b8),dark=material(0x5c7277),gold=material(0xd2bc87),leaf=material(0x7b9276),light=material(0xf9e7bd,true),cyan=material(0xb1e5e3,true);
  const box=(x,y,z,w,h,d,m)=>{const mesh=new THREE.Mesh(geo,m);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);this.scene.add(mesh);return mesh;};
  const label=(text,x,y,z,rotation=0,width=2)=>{const cv=document.createElement('canvas');cv.width=1024;cv.height=256;const ctx=cv.getContext('2d');ctx.fillStyle='#26474f';ctx.fillRect(0,0,1024,256);ctx.fillStyle='#eee8d6';ctx.font='52px system-ui';ctx.textAlign='center';ctx.fillText(text,512,150);const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;const mat=new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}),g=new THREE.PlaneGeometry(width,width/4),mesh=new THREE.Mesh(g,mat);mesh.position.set(x,y,z);mesh.rotation.y=rotation;this.scene.add(mesh);this.resources.push(tex,mat,g);};
  for(let f=0;f<3;f++){
   const y=f*FLOOR_HEIGHT;box(0,y-.1,0,15.6,.2,15.6,floor);
   for(let row=0;row<13;row++)for(let col=0;col<13;col++)if(LAYOUTS[f][row][col]==='#'){
    const x=(col-6)*CELL,z=(row-6)*CELL;box(x,y+1.48,z,CELL,2.96,CELL,wall);box(x,y+2.97,z,CELL+.01,.028,CELL+.01,gold);
   }
   for(let z=-6;z<=6;z+=1.2){box(0,y+.025,z,.024,.022,1.04,gold);box(.42,y+.012,z,.045,.01,.82,light);}
   label(['01 · GARDEN / 花園','02 · LIBRARY / 星圖','03 · SKY DECK / 展望'][f],0,y+2.2,-5.36,0,2.5);
   const r=ROOMS[f];box(r.x,y+.03,r.z,2.85,.05,2.85,dark);box(r.x,y+.08,r.z,1.15,.10,.95,gold);box(r.x,y+.88,r.z,.2,1.5,.2,cyan);
   if(f===0){for(const [x,z]of [[-5.7,-5.7],[-3.9,-5.7],[-5.7,-3.9]]){box(x,y+.3,z,.4,.6,.4,gold);box(x,y+1,z,.8,.85,.8,leaf);}}
   if(f===1){for(let k=0;k<3;k++){box(3.7+k*.8,y+.65,5.8,.5,1.3,.3,dark);for(let j=0;j<4;j++)box(3.7+k*.8,y+.15+j*.3,5.62,.46,.2,.018,j%2?gold:wall);}}
   if(f===2){box(5.75,y+.3,-4.8,.3,.6,2.5,gold);box(5.8,y+1.3,-4.8,.035,1.4,2.5,cyan);}
   label(r.name+' · E',r.x,y+1.85,r.z-.9,0,2.3);
  }
  for(let k=0;k<36;k++){
   box(8.32,k*.1-.035,6-(k+.5)/3,1.58,.17,1/3+.015,floor);
   box(-8.32,3.6+k*.1-.035,-6+(k+.5)/3,1.58,.17,1/3+.015,floor);
   if(k%3===0){box(9.14,k*.1+.58,6-(k+.5)/3,.026,1.13,.026,gold);box(-9.14,3.6+k*.1+.58,-6+(k+.5)/3,.026,1.13,.026,gold);}
  }
  box(9.4,5.35,0,.18,10.7,15.6,wall);box(-9.4,5.35,0,.18,10.7,15.6,wall);
  label('↑ 2F / 觀星圖書室',8.3,1.6,6.3,Math.PI,1.4);label('↑ 3F / 空中展望廊',-8.3,5.2,-6.3,0,1.4);label('EXIT / 返回街道 · E',0,1.8,6.55,Math.PI,2.2);
  const stars=new Float32Array(600);for(let k=0;k<200;k++){stars[k*3]=Math.sin(k*2.4)*40;stars[k*3+1]=12+(k%17)*.65;stars[k*3+2]=Math.cos(k*2.4)*40;}const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(stars,3));const sm=new THREE.PointsMaterial({color:0xffffff,size:.09});this.scene.add(new THREE.Points(sg,sm));this.resources.push(sg,sm);
  // Start just inside the entrance, leaving room for a third-person camera.
  this.position={x:0,y:0,z:4.7,floor:0,yaw:0,pitch:0};
 }
 update(c,a,i,month){this.operational=c.enabled!==false&&a.operational[i]>.9;}
 move(dx,dz){moveInterior(this.position,dx,dz);}
 interact(){const p=this.position;if(p.floor===0&&Math.hypot(p.x,p.z-6)<1.4)return {exit:true};const r=nearbyRoom(p);if(r){this.found.add(r.floor);return {text:`${r.name}已探索 · ${this.found.size} / 3${this.found.size===3?' · 三層探索完成':''}`};}return {text:'沿樓梯探索其他樓層；靠近光核按 E。'};}
 status(){const r=nearbyRoom(this.position);return `${this.position.floor+1} 樓 · ${r?r.name+' · E 探索':'沿走廊與樓梯尋找光核'} · 已探索 ${this.found.size} / 3`;}
 dispose(){this.resources.forEach(r=>r.dispose());}
}
