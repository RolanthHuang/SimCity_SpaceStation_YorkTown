// Coordinates are relative to the central floating platform, in city units.
export const DOCK_FRAME={position:[15,33.55,-7],yaw:-.35};
export const DOCK_FLOORS=[{x0:7.4,x1:11,z0:-9,z1:2},{x0:9,x1:35,z0:-9,z1:-5},{x0:26,x1:36,z0:-12,z1:-3}];
export const DOCK_START={x:8,y:0,z:-6.6,yaw:1.99,pitch:.25};
export const DOCK_ROUTE=[{x:8,z:-6.6},{x:29,z:-6.6},{x:32,z:-10}];
export const DOCK_JUMP={speed:1.1,gravity:3};
export function dockAirborne(air){return air.height>0||air.velocity>0;}
export function beginDockJump(air){if(dockAirborne(air))return false;air.height=0;air.velocity=DOCK_JUMP.speed;return true;}
export function stepDockAir(air,dt){
 if(!dockAirborne(air))return false;
 const n=Math.max(1,Math.ceil(Math.max(0,dt)*120)),step=Math.max(0,dt)/n;
 for(let j=0;j<n;j++){
  air.height+=air.velocity*step-DOCK_JUMP.gravity*step*step/2;air.velocity-=DOCK_JUMP.gravity*step;
  if(air.height<=0&&air.velocity<=0){air.height=0;air.velocity=0;return true;}
 }return false;
}
export function onDock(x,z,r=.06){return [[0,0],[r,0],[-r,0],[0,r],[0,-r]].every(([dx,dz])=>DOCK_FLOORS.some(f=>x+dx>=f.x0&&x+dx<=f.x1&&z+dz>=f.z0&&z+dz<=f.z1));}
export function moveDock(p,dx,dz){
 if(!onDock(p.x,p.z))Object.assign(p,DOCK_START);
 const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.05));
 for(let j=0;j<n;j++){const x=p.x+dx/n,z=p.z+dz/n;if(onDock(x,z)){p.x=x;p.z=z;}else{if(onDock(x,p.z))p.x=x;if(onDock(p.x,z))p.z=z;}}
 p.y=0;return p;
}
export function dockWorld(p){const c=Math.cos(DOCK_FRAME.yaw),s=Math.sin(DOCK_FRAME.yaw),o=DOCK_FRAME.position;return [o[0]+c*p.x+s*p.z,o[1]+(p.y||0),o[2]-s*p.x+c*p.z];}
export function dockCamera(p,third=false){
 const floor=Math.max(0,p.y||0),head={x:p.x,y:floor+.245,z:p.z},pitch=Math.max(-1.0,Math.min(1.05,p.pitch||0)),forward={x:Math.sin(p.yaw)*Math.cos(pitch),y:Math.sin(pitch),z:-Math.cos(p.yaw)*Math.cos(pitch)};
 const eye=third?{x:head.x-forward.x*.8,y:Math.max(floor+.18,head.y+.15-forward.y*.8),z:head.z-forward.z*.8}:head;
 // Keep the chase camera inside the rail boundary, including at takeoff.
 if(third){let amount=1;for(let j=1;j<=20;j++){const t=j/20;if(!onDock(head.x+(eye.x-head.x)*t,head.z+(eye.z-head.z)*t,.035)){amount=(j-1)/20;break;}}for(const k of ['x','y','z'])eye[k]=head[k]+(eye[k]-head[k])*amount;}
 return {eye:dockWorld(eye),aim:dockWorld({x:head.x+forward.x*4,y:head.y+forward.y*4,z:head.z+forward.z*4})};
}
// Only exposed union edges get rails; connecting passages stay open.
export function dockEdges(){
 const edges=[];
 for(const f of DOCK_FLOORS)for(const [a,b,n]of [[[f.x0,f.z0],[f.x1,f.z0],[0,-1]],[[f.x1,f.z0],[f.x1,f.z1],[1,0]],[[f.x1,f.z1],[f.x0,f.z1],[0,1]],[[f.x0,f.z1],[f.x0,f.z0],[-1,0]]]){
  const count=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*2);let start=null;
  for(let j=0;j<=count;j++){const t=(j+.5)/count,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t,outer=j<count&&!onDock(x+n[0]*.01,z+n[1]*.01,0);
   if(outer&&start===null)start=j/count;if(!outer&&start!==null){edges.push([[a[0]+(b[0]-a[0])*start,a[1]+(b[1]-a[1])*start],[a[0]+(b[0]-a[0])*j/count,a[1]+(b[1]-a[1])*j/count]]);start=null;}}
 }return edges;
}
