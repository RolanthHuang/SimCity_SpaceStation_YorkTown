import {DECK,SIZE,HEIGHT,idx,xy,terrain,isTransport,neighbors,wrapX,deltaX} from './catalog.mjs';

import {ATELIER_LOTS,sampleWater} from './atelier-plan.mjs';

// Intrinsic deck coordinates preserve the simulation's unit-distance road network.
// World-space Y points toward the station centre; local gravity follows the deck normal.
// Two independent decks share intrinsic grid storage, never utility adjacency.
// The folded harbour is rotated toward the first city; its gravity follows its own surface.
const C=Math.cos(-.66),S=Math.sin(-.66),CP=Math.cos(.24),SP=Math.sin(.24);
const rotate=([x,y,z])=>[C*x-S*(CP*y-SP*z),S*x+C*(CP*y-SP*z),SP*y+CP*z];
const unrotate=([x,y,z])=>{const a=C*x+S*y,b=-S*x+C*y;return [a,CP*b+SP*z,-SP*b+CP*z];};
export const deckAt=v=>v>=28?1:0;
export function frame(u,v){const secondary=deckAt(v),a=u/(secondary?65:DECK.radius),rot=secondary?rotate:p=>p;return {up:rot([-Math.sin(a),Math.cos(a),0]),tangent:rot([Math.cos(a),Math.sin(a),0]),side:rot([0,0,1])};}
export function surface(u,v,h=0){if(deckAt(v)){const r=65-h,a=u/65,p=rotate([r*Math.sin(a),65-r*Math.cos(a),v-44]);return [p[0]+15,p[1]+24,p[2]-35];}const a=u/DECK.radius,r=DECK.radius-h;return [r*Math.sin(a),DECK.radius-r*Math.cos(a),v];}
export const wrapU=u=>wrapX(u+28)-28;
export function localPoint(x,y,z,deck=0){if(deck){const p=unrotate([x-15,y-24,z+35]);return [Math.atan2(p[0],65-p[1])*65,p[2]+44];}return [wrapU(Math.atan2(x,DECK.radius-y)*DECK.radius),z];}
// Signed height above a deck, independent of global Y and camera direction.
export function surfaceHeight([x,y,z],deck=0){if(deck){const p=unrotate([x-15,y-24,z+35]);return 65-Math.hypot(p[0],65-p[1]);}return DECK.radius-Math.hypot(x,DECK.radius-y);}
export const clampV=(v,deck)=>deck?Math.max(32.6,Math.min(55.4,v)):Math.max(-19.4,Math.min(15.4,v));
export function tileAt(u,v){const x=wrapX(Math.floor(u+28)),y=Math.floor(v+28);return y>=0&&y<HEIGHT?idx(x,y):-1;}
export function solid(c){return !!(c?.type&&c.level>0&&!isTransport(c.type)&&!['park','rubble','station'].includes(c.type));}
export function canWalk(cells,u,v,radius=.12){
 if(cells.atelier){const x=u+27.5,y=v+27.5;for(const p of ATELIER_LOTS){if(Math.abs(x-p.x)<2.40+radius&&Math.abs(y-p.y)<2.32+radius)return false;}
  for(const dx of [-radius,radius])for(const dy of [-radius,radius])if(sampleWater(x+dx,y+dy))return false;
  for(const gx of [8.8,15.2])if(Math.abs(x-gx)<.72+radius&&Math.abs(y-25)<1.17+radius)return false;
 }
 for(const du of [-radius,radius])for(const dv of [-radius,radius])if(!terrain(tileAt(u+du,v+dv)))return false;
 const cx=Math.floor(u+28),cy=Math.floor(v+28);
 for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++){
  if(y<0||y>=HEIGHT)continue;
  if(solid(cells[idx(wrapX(x),y)])&&Math.abs(deltaX(u,x-27.5))<.39+radius&&Math.abs(v-(y-27.5))<.39+radius)return false;
 }
 return true;
}
export function nearestWalkable(cells,u,v){
 let result=null,best=Infinity;
 for(let i=0;i<cells.length;i++){if(!terrain(i)||deckAt(xy(i)[1]-27.5)!==deckAt(v))continue;const [x,y]=xy(i),a=x-27.5,b=y-27.5;if(!canWalk(cells,a,b))continue;const d=deltaX(u,a)**2+(b-v)**2;if(d<best){best=d;result={u:a,v:b};}}
 return result;
}
export function moveWalker(cells,position,du,dv,radius=.12){
 // Small substeps prevent tunnelling across buildings, even after a slow frame.
 const steps=Math.max(1,Math.ceil(Math.hypot(du,dv)/.06));
 for(let j=0;j<steps;j++){if(canWalk(cells,position.u+du/steps,position.v,radius))position.u+=du/steps;if(canWalk(cells,position.u,position.v+dv/steps,radius))position.v+=dv/steps;}
 position.u=wrapU(position.u);return position;
}
export function roadRoute(cells,start,goal){
 if(start===goal)return [start];
 if(!['road','avenue','station'].includes(cells[start]?.type)||!['road','avenue','station'].includes(cells[goal]?.type))return [];
 const queue=[start],previous=new Map([[start,-1]]);
 for(let k=0;k<queue.length;k++){
  const i=queue[k],[x,y]=xy(i);
  for(const n of neighbors(i)){
   // Street pedestrians do not walk down rail tracks.
   if(n<0||previous.has(n)||!['road','avenue','station'].includes(cells[n]?.type))continue;
   previous.set(n,i);if(n===goal){const path=[n];while(previous.get(path[0])!==-1)path.unshift(previous.get(path[0]));return path;}queue.push(n);
  }
 }
 return [];
}
