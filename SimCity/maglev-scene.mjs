import * as T from '../YorktownPreview/three.module.js';
import {xy,deltaX,deckOf} from './catalog.mjs';
import {surface,frame} from './habitat.mjs';

export class MaglevScene{
 constructor(view){this.view=view;this.group=new T.Group();view.scene.add(this.group);this.clock=0;this.signature='';this.lines=[];
  this.rail=new T.MeshStandardMaterial({color:0xbcced2,metalness:.7,roughness:.3});
  this.light=new T.MeshStandardMaterial({color:0xe9f4ef,emissive:0x568a94,emissiveIntensity:.24,metalness:.2,roughness:.4});
  this.trainMat=new T.MeshStandardMaterial({color:0xf2ede0,metalness:.38,roughness:.28});
  this.glass=new T.MeshStandardMaterial({color:0x375c6c,metalness:.3,roughness:.19});
 }
 curve(line){const [ax,ay]=xy(line.a),[bx,by]=xy(line.b),same=deckOf(line.a)===deckOf(line.b);let points=[];
  if(line.kind==='road'){let u=ax;points=line.path.map((i,k)=>{const [x,y]=xy(i);if(k)u+=deltaX(xy(line.path[k-1])[0],x);return new T.Vector3(...surface(u-27.5,y-27.5,1.12+Math.sin(Math.PI*k/(line.path.length-1))*.85));});}
  else if(same){points=Array.from({length:33},(_,k)=>{const t=k/32;return new T.Vector3(...surface(ax+deltaX(ax,bx)*t-27.5,ay+(by-ay)*t-27.5,1.12+Math.sin(Math.PI*t)*Math.min(12,3+line.length*.08)));});}
  else{const a=new T.Vector3(...surface(ax-27.5,ay-27.5,1.12)),b=new T.Vector3(...surface(bx-27.5,by-27.5,1.12)),up=new T.Vector3(...frame(ax-27.5,ay-27.5).up).add(new T.Vector3(...frame(bx-27.5,by-27.5).up)).normalize();points=Array.from({length:33},(_,k)=>a.clone().lerp(b,k/32).addScaledVector(up,Math.sin(Math.PI*k/32)*9));}
  return new T.CatmullRomCurve3(points,false,'centripetal',.15);
 }
 clear(){for(const child of [...this.group.children]){this.group.remove(child);child.traverse(m=>{if(m.geometry)m.geometry.dispose();});}this.lines=[];}
 update(s,a){const list=a.maglev.lines,signature=JSON.stringify(list.map(l=>[l.id,l.path,l.active]));if(signature!==this.signature){this.signature=signature;this.clear();
   for(const line of list){const g=new T.Group(),curve=this.curve(line),segments=Math.min(260,Math.max(24,Math.ceil(line.length*3))),bed=new T.Mesh(new T.TubeGeometry(curve,segments,.105,8,false),this.rail);bed.userData.maglev=line.id;g.add(bed);
    const [ax,ay]=xy(line.a),[bx,by]=xy(line.b),upA=new T.Vector3(...frame(ax-27.5,ay-27.5).up),upB=new T.Vector3(...frame(bx-27.5,by-27.5).up);
    const glowCurve=new T.CatmullRomCurve3(curve.getSpacedPoints(segments).map((p,k)=>p.addScaledVector(upA.clone().lerp(upB,k/segments).normalize(),.106)),false,'centripetal',.15);
    const glow=new T.Mesh(new T.TubeGeometry(glowCurve,segments,.019,5,false),this.light);glow.userData.maglev=line.id;g.add(glow);
    const train=new T.Group(),hull=new T.Mesh(new T.CapsuleGeometry(.13,.86,3,8),this.trainMat);hull.rotation.x=Math.PI/2;train.add(hull);const window=new T.Mesh(new T.BoxGeometry(.18,.075,.61),this.glass);window.position.set(0,.085,0);train.add(window);train.traverse(m=>m.userData.maglev=line.id);g.add(train);
    this.group.add(g);this.lines.push({line,g,curve,train});
   }
  }
  for(const row of this.lines){row.line=list.find(l=>l.id===row.line.id)||row.line;row.g.visible=!(this.view.isolate&&this.view.mode==='build'&&deckOf(row.line.a)!==this.view.deck&&deckOf(row.line.b)!==this.view.deck);row.train.visible=row.line.active;}
 }
 animate(dt){this.clock+=dt;for(const {line,curve,train} of this.lines){if(!line.active)continue;const phase=(this.clock*.055+line.a*.001)%2,t=phase<1?phase:2-phase,point=curve.getPointAt(Math.min(.999,Math.max(.001,t))),tangent=curve.getTangentAt(Math.min(.999,Math.max(.001,t))).multiplyScalar(phase<1?1:-1),[x,y]=xy(t<.5?line.a:line.b),up=new T.Vector3(...frame(x-27.5,y-27.5).up),side=new T.Vector3().crossVectors(up,tangent).normalize(),normal=new T.Vector3().crossVectors(tangent,side).normalize();train.position.copy(point).addScaledVector(normal,.16);train.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(side,normal,tangent));}}
}
