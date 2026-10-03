export const STOREY=4.5;
export const FLOOR_NAMES=['晨光大廳','航跡檔案','熱能工坊','空中植苑','星圖迴廊','棱光秘庫'];
export const INTERIOR_TARGETS={archive:{id:'archive',floor:1,x:-11,z:-8,name:'航跡檔案'},power:{id:'power',floor:2,x:-11,z:7,name:'熱能配流'},stars:{id:'stars',floor:4,x:-11,z:7,name:'星圖校準'},treasure:{id:'treasure',floor:5,x:0,z:0,name:'棱光秘庫'}};
export function createQuest(){return {archive:false,power:false,stars:false,complete:false,route:[],rings:[0,0,0],message:'先到二樓的航跡檔案，尋找航行者留下的線索。'};}
export function interactQuest(q,id,value){
 const next=structuredClone(q);
 if(id==='archive'){next.archive=true;next.message='配流順序：冷卻 → 儲能 → 推進。星圖：青環 2／金環 4／紫環 1。';}
 else if(id==='valve'&&q.archive&&!q.power){next.route.push(value);const expected=['cool','store','drive'];if(next.route.some((v,i)=>v!==expected[i])){next.route=[];next.message='配流順序錯誤，安全切斷。可重新嘗試。';}else if(next.route.length===3){next.power=true;next.message='配流完成！中庭連橋與星圖廳恢復供電。';}}
 else if(id==='ring'&&q.power&&!q.stars){next.rings[value]=(next.rings[value]+1)%6;}
 else if(id==='align'&&q.power){if(next.rings.every((v,i)=>v===[2,4,1][i])){next.stars=true;next.message='星圖已校準。前往六樓，跨過斷橋到棱光秘庫。';}else next.message='三環尚未對準。檔案提示：青 2／金 4／紫 1。';}
 else if(id==='treasure'&&q.stars){next.complete=true;next.message='彩蛋完成：取得「晨光航行者」紀念章，秘庫的星冠晶體已亮起。';}
 return next;
}
export function currentTarget(q){return !q.archive?INTERIOR_TARGETS.archive:!q.power?INTERIOR_TARGETS.power:!q.stars?INTERIOR_TARGETS.stars:INTERIOR_TARGETS.treasure;}
export function makeInteriorPlan(){
 const surfaces=[],walls=[];
 const floor=(level,x0,x1,z0,z1,id)=>surfaces.push({level,x0,x1,z0,z1,y:level*STOREY,id});
 const wall=(level,x,z,w,d,h=3.75,id='wall',condition=null)=>walls.push({level,x,z,w,d,y:level*STOREY,h,id,condition});
 for(let f=0;f<6;f++){
  if(f===0)floor(f,-14,14,-12,12,'lobby');else{
   floor(f,-14,-5,-12,12,'west-wing');floor(f,5,10.3,-12,12,'east-wing');floor(f,-5,5,-12,-6,'north-gallery');floor(f,-5,5,6,12,'south-gallery');floor(f,10.3,14,-12,-8,'stair-north');floor(f,10.3,14,8,12,'stair-south');
  }
  for(const x of [-14.05,14.05])wall(f,x,0,.24,24.2,4,'outside');
  wall(f,0,-12.05,28.2,.24,4,'outside');
  // Split the ground-floor frontage to leave a real entrance.
  if(f===0){wall(f,-8,12.05,12.2,.24,4,'outside');wall(f,8,12.05,12.2,.24,4,'outside');}
  else wall(f,0,12.05,28.2,.24,4,'outside');
  if(f>0){
   for(const x of [-5,5]){wall(f,x,-3.7,.13,4.6,1.1,'balustrade');wall(f,x,3.7,.13,4.6,1.1,'balustrade');if(f!==3&&f!==5)wall(f,x,0,.13,2.8,1.1,'balustrade');}
   for(const z of [-6,6])wall(f,0,z,10,.13,1.1,'balustrade');
   for(const z of [-6.7,6.7])wall(f,-8,z,.20,10.6,3.75,'partition');
   for(const z of [-6,0,6]){wall(f,-13,z,2.2,.18,3.75,'partition');wall(f,-8.7,z,2.4,.18,3.75,'partition');}
   for(const z of [-5,3]){wall(f,5.85,z,1.5,.18,3.75,'partition');wall(f,9.15,z,2.2,.18,3.75,'partition');}
   // The stair well has a permanent guard on its inner side.
   wall(f,10.2,0,.10,15.2,1.1,'stair-rail');
  }
 }
 wall(0,0,1.2,6.8,5.2,.6,'pool');
 for(const x of [-10,10])for(const z of [-7,5])wall(0,x,z,2.8,2.8,.95,'furniture');
 wall(0,-8,9.5,4.3,1.6,1.3,'furniture');
 for(const z of [-9,-3,3,9])for(const x of [-12.9,-8.5])wall(1,x,z,.75,3,2.9,'furniture');
 for(const z of [-8,-2,4]){wall(2,-12.9,z,1.35,1.35,2.6,'furniture');wall(2,-8.5,z,.7,2,2.3,'furniture');}
 wall(2,-11,8,3.6,.55,1.3,'furniture');wall(4,-11,9.4,3.2,3.2,.72,'furniture');
 for(const x of [-12.9,-8.9])for(const z of [-9,-3,3,9])wall(3,x,z,1.3,2,1,'furniture');
 wall(5,0,0,1.9,1.9,.6,'furniture');
 for(let f=0;f<5;f++)surfaces.push({level:f,x0:10.45,x1:13.9,z0:-8,z1:8,y:f*STOREY,ramp:true,direction:f%2?-1:1,id:'stair'});
 floor(3,-5,5,-1,1,'atrium-bridge');
 wall(3,5,0,.20,2.1,3.5,'bridge-gate','power');
 floor(5,-3,3,-2.1,2.1,'treasure-island');floor(5,4.8,5.9,-1.05,1.05,'jump-launch');
 wall(5,4.9,0,.20,2.1,3.5,'vault-gate','stars');
 return {surfaces,walls};
}
export function surfaceHeight(s,z){return s.y+(s.ramp?((s.direction===1?8-z:z+8)/16)*STOREY:0);}
export function supportAt(plan,x,z,y,maxRise=.50){let best=-Infinity;for(const s of plan.surfaces)if(x>=s.x0&&x<=s.x1&&z>=s.z0&&z<=s.z1){const h=surfaceHeight(s,z);if(h<=y+maxRise&&h>best)best=h;}return best;}
export function blockedAt(plan,x,z,y,quest,radius=.32){for(const w of plan.walls){if(w.condition&&quest[w.condition])continue;if(y+1.65<=w.y+.06||y>=w.y+w.h-.04)continue;if(Math.abs(x-w.x)<w.w/2+radius&&Math.abs(z-w.z)<w.d/2+radius)return true;}return false;}
export function moveHorizontal(plan,p,dx,dz,quest){
 const out={...p};const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.18));for(let i=0;i<n;i++){
  const nx=out.x+dx/n;if(!blockedAt(plan,nx,out.z,out.y,quest))out.x=nx;
  const nz=out.z+dz/n;if(!blockedAt(plan,out.x,nz,out.y,quest))out.z=nz;
 }return out;
}
// Small, floor-aware navigation graph is used by the optional walking guide.
export function floorPath(plan,start,end,level,quest){
 const step=.5,W=55,D=47,originX=-13.5,originZ=-11.5;
 const key=(x,z)=>z*W+x;const point=k=>({x:originX+(k%W)*step,z:originZ+Math.floor(k/W)*step});
 const cell=p=>key(Math.max(0,Math.min(W-1,Math.round((p.x-originX)/step))),Math.max(0,Math.min(D-1,Math.round((p.z-originZ)/step))));
 const y=level*STOREY,allowed=k=>{const p=point(k),h=supportAt(plan,p.x,p.z,y,.35);return h>=y-.15&&h<=y+.35&&!blockedAt(plan,p.x,p.z,y,quest,.36);};
 const first=cell(start),last=cell(end),queue=[first],prev=new Map([[first,null]]);let cursor=0;
 while(cursor<queue.length){const k=queue[cursor++];if(k===last){const route=[];let a=k;while(a!==null){route.push({...point(a),y});a=prev.get(a);}return route.reverse();}const cx=k%W,cz=Math.floor(k/W);for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=cx+dx,z=cz+dz;if(x<0||x>=W||z<0||z>=D)continue;const n=key(x,z);if(prev.has(n)||!allowed(n))continue;prev.set(n,k);queue.push(n);}}
 return null;
}
