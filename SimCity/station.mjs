import * as THREE from '../YorktownPreview/three.module.js';
import {DECK,SIZE} from './catalog.mjs';
import {surface} from './habitat.mjs';

export function createStation(scene){
 const station=new THREE.Group();scene.add(station);
 const metal=new THREE.MeshStandardMaterial({color:0xdce0d7,emissive:0x343e40,emissiveIntensity:.3,roughness:.53,metalness:.25});
 const dark=new THREE.MeshStandardMaterial({color:0x82959e,roughness:.6,metalness:.6});
 const glow=new THREE.MeshBasicMaterial({color:0xb5d7d9});
 const box=new THREE.BoxGeometry(1,1,1),dummy=new THREE.Object3D(),center=new THREE.Vector3(0,DECK.radius,0);
 const structural=[],windows=[],city=[];
 const emit=(list,p,scale,quaternion,color)=>list.push({p,scale,quaternion,color});
 for(let ring=1;ring<3;ring++){
  const orientation=new THREE.Quaternion().setFromEuler(new THREE.Euler(ring===0?0:ring===1?.94:-1.04,0,ring===0?0:ring===1?.45:-.65));
  const radius=DECK.radius+ring*5,width=ring===0?13:8;
  for(let j=0;j<200;j++){
   const a=j/200*Math.PI*2,angle=a>Math.PI?a-Math.PI*2:a;
   if(ring===0&&Math.abs(angle)<20.5/DECK.radius)continue;
   const rotation=orientation.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),a));
   const at=(h,z=0)=>new THREE.Vector3((radius-h)*Math.sin(a),-(radius-h)*Math.cos(a),z).applyQuaternion(orientation).add(center);
   emit(structural,at(-.75),[radius*Math.PI*2/200+ .12,1.5,width],rotation,ring===0?0x547586:0x405c72);
   for(const side of [-1,1])emit(windows,at(.15,side*(width/2-.15)),[radius*Math.PI*2/200,.06,.07],rotation,0x6bbccb);
   if(j%3===0){
    const h=1.1+((j*17+ring*13)%23)/5;
    emit(city,at(h/2+.05,(j%5-2)*width*.12),[.9,h,1.3],rotation,j%2?0x91aebb:0x688f9f);
    emit(windows,at(h+.1,(j%5-2)*width*.12),[1.02,.06,1.4],rotation,0x90cbd2);
   }
  }
 }
 const beam=(from,to,width,material=metal)=>{const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),d=b.clone().sub(a);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(width,width,d.length(),6),material);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());station.add(mesh);};
 // Physical spine, radial connections and underslung ribs on the playable cantilever.
 beam([0,DECK.radius,-20],[0,DECK.radius,20],5,dark);
 const hub=new THREE.Mesh(new THREE.SphereGeometry(10,24,16),metal);hub.position.copy(center);station.add(hub);
 for(let j=0;j<6;j++){const a=j*Math.PI/3+.5;beam([0,DECK.radius,0],[Math.sin(a)*DECK.radius,DECK.radius-Math.cos(a)*DECK.radius,0],.65);}
 for(let x=0;x<SIZE;x+=12){const u=x-28;beam(surface(u,-20,-1),surface(u,16,-1),.23);beam(surface(u,0,-3),surface(u,-20,-1),.22);beam(surface(u,0,-3),surface(u,16,-1),.22);}
 beam([-20,-3,0],[20,-3,0],.55,dark);
 for(const [items,material] of [[structural,metal],[city,metal],[windows,glow]]){
  const mesh=new THREE.InstancedMesh(box,material,items.length);items.forEach((p,i)=>{dummy.position.copy(p.p);dummy.scale.set(...p.scale);dummy.quaternion.copy(p.quaternion);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,new THREE.Color(p.color));});station.add(mesh);
 }
 const shell=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.SphereGeometry(104,24,16),12),new THREE.LineBasicMaterial({color:0x4c8094,transparent:true,opacity:.10}));shell.position.copy(center);station.add(shell);
 return station;
}
