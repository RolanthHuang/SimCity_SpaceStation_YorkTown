import {STOREY,supportAt,moveHorizontal,floorPath} from './interior-plan.mjs';
export const JUMP_ASSIST_SECONDS=.64,JUMP_ASSIST_SPEED=5.4;
export function createExplorer(){return {x:0,y:0,z:10,vy:0,grounded:true,yaw:0,pitch:.08,third:true,checkpoint:{x:0,y:0,z:10}};}
export function stepExplorer(plan,p,input,dt,quest){
 const state={...p,checkpoint:{...p.checkpoint}};dt=Math.min(.05,Math.max(0,dt));
 if(input.jump&&state.grounded){state.vy=5.5;state.grounded=false;}
 const motion=moveHorizontal(plan,state,(input.x||0)*dt*(input.speed||3.8),(input.z||0)*dt*(input.speed||3.8),quest);state.x=motion.x;state.z=motion.z;
 let floor=supportAt(plan,state.x,state.z,state.y,.48);
 if(state.grounded&&floor>=state.y-.52&&floor<=state.y+.48){state.y=floor;state.vy=0;}
 else{
  state.grounded=false;state.vy-=16*dt;state.y+=state.vy*dt;
  floor=supportAt(plan,state.x,state.z,state.y,.14);
  if(state.vy<=0&&state.y<=floor+.14){state.y=floor;state.vy=0;state.grounded=true;}
 }
 if(state.grounded&&Math.abs(state.y/STOREY-Math.round(state.y/STOREY))<.035&&!(state.y>=STOREY*5&&Math.abs(state.x)<4))state.checkpoint={x:state.x,y:state.y,z:state.z};
 state.recovered=false;
 if(!Number.isFinite(state.y)||state.y<state.checkpoint.y-1.8){Object.assign(state,state.checkpoint,{vy:0,grounded:true,recovered:true});}
 return state;
}
export function guideRoute(plan,p,target,quest){
 let f=Math.round(p.y/STOREY);if(Math.abs(p.y-f*STOREY)>.25)return null;let current={x:p.x,z:p.z},route=[];
 while(f!==target.floor){
  const ascending=f<target.floor,ramp=ascending?f:f-1,startZ=(ramp%2?-8.5:8.5)*(ascending?1:-1),end={x:12,z:startZ};
  const path=floorPath(plan,current,end,f,quest);if(!path)return null;route.push(...path);
  for(let k=0;k<=36;k++){const t=ascending?k/36:1-k/36;route.push({x:12,z:ramp%2?-8+16*t:8-16*t,y:ramp*STOREY+t*STOREY});}
  f+=ascending?1:-1;current={x:12,z:-startZ};route.push({...current,y:f*STOREY});
 }
 const end=target.id==='treasure'?{x:5.6,z:0}:target;const last=floorPath(plan,current,end,f,quest);if(!last)return null;route.push(...last);return route;
}
