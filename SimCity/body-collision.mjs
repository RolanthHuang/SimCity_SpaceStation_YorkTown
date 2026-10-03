import {deltaX,deckOf} from './catalog.mjs';
import {canWalk,moveWalker,tileAt,wrapU} from './habitat.mjs';

// Equivalent masses tune a stable, damped kinematic response. They are not
// a rigid-body or ragdoll simulation. Ground clearance and visible chassis
// clearance differ, so a long chassis also blocks a walking visitor.
export const BODY_SHAPES=Object.freeze({
 surrogate:{radius:.12,terrainRadius:.12,height:.30,mass:80},
 scooter:{radius:.20,terrainRadius:.12,height:.36,mass:180},
 hound:{radius:.29,terrainRadius:.17,height:.52,mass:1400}
});
export function bodyShape(body){
 const base=BODY_SHAPES[body.kind]||BODY_SHAPES.surrogate;
 return {...base,mass:body.mass??base.mass,radius:body.radius??base.radius};
}
export function bodyOverlaps(a,b,margin=0){
 if(a===b||a.id&&a.id===b.id||deckOf(tileAt(a.u,a.v))!==deckOf(tileAt(b.u,b.v)))return false;
 const sa=bodyShape(a),sb=bodyShape(b),az=a.jump||0,bz=b.jump||0;
 if(az>=bz+sb.height+.02||bz>=az+sa.height+.02)return false;
 return Math.hypot(deltaX(a.u,b.u),a.v-b.v)<sa.radius+sb.radius+margin;
}
export function bodyClear(body,others,margin=0){return !others.some(other=>bodyOverlaps(body,other,margin));}

function shift(cells,b,du,dv){
 if(b.fixed)return false;
 const u=wrapU(b.u+du),v=b.v+dv;
 if(!canWalk(cells,u,v,bodyShape(b).terrainRadius))return false;
 b.u=u;b.v=v;return true;
}
function separate(cells,a,b){
 if(!bodyOverlaps(a,b))return false;
 const sa=bodyShape(a),sb=bodyShape(b),dx=deltaX(b.u,a.u),dy=a.v-b.v,d=Math.hypot(dx,dy);
 const nx=d>.000001?dx/d:-Math.sin(a.heading??Math.PI/2),ny=d>.000001?dy/d:Math.cos(a.heading??Math.PI/2),depth=sa.radius+sb.radius-d+.00002;
 const ia=a.fixed?0:1/sa.mass,ib=b.fixed?0:1/sb.mass,total=ia+ib;
 if(!total)return false;
 const am=depth*ia/total,bm=depth*ib/total;
 const movedA=shift(cells,a,nx*am,ny*am),movedB=shift(cells,b,-nx*bm,-ny*bm);
 // A wall may pin either participant. Give the remaining clearance to the
 // other one, without pushing a heavy object into a building or off its deck.
 if(!movedA&&movedB)shift(cells,b,-nx*am,-ny*am);
 if(!movedB&&movedA)shift(cells,a,nx*bm,ny*bm);
 return movedA||movedB;
}
export function resolveBodyContacts(cells,bodies,passes=6){
 for(let pass=0;pass<passes;pass++){
  let changed=false;for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++)changed=separate(cells,bodies[i],bodies[j])||changed;
  if(!changed)break;
 }
 return bodies;
}
export function movePhysicalBody(cells,body,du,dv,others=[]){
 const shape=bodyShape(body),steps=Math.max(1,Math.ceil(Math.hypot(du,dv)/.035)),sx=du/steps,sy=dv/steps,length=Math.hypot(sx,sy);
 const obstacles=others.filter(other=>other!==body&&(!body.id||other.id!==body.id));
 for(let step=0;step<steps;step++){
  const old={u:body.u,v:body.v};moveWalker(cells,body,sx,sy,shape.terrainRadius);
  let nudge=null;
  for(const other of obstacles){
   if(!bodyOverlaps(body,other))continue;
   const dx=deltaX(other.u,body.u),dy=body.v-other.v,d=Math.hypot(dx,dy),nx=d>.000001?dx/d:-sx/(length||1),ny=d>.000001?dy/d:-sy/(length||1),tangent=-ny*sx+nx*sy;
   // Oblique input retains its tangential speed. A head-on contact gets a
   // small, consistent sideways drift, avoiding a zero-speed deadlock.
   const drift=Math.max(0,length*.16-Math.abs(tangent));
   if(drift>0)nudge={u:-ny*drift*(tangent<-.000001?-1:body.slideSide||1),v:nx*drift*(tangent<-.000001?-1:body.slideSide||1)};
  }
  resolveBodyContacts(cells,[body,...obstacles]);
  if(nudge){const before={u:body.u,v:body.v};moveWalker(cells,body,nudge.u,nudge.v,shape.terrainRadius);
   if(Math.hypot(deltaX(before.u,body.u),body.v-before.v)<.000001)moveWalker(cells,body,-nudge.u,-nudge.v,shape.terrainRadius);
   resolveBodyContacts(cells,[body,...obstacles]);
  }
  if(!bodyClear(body,obstacles)){body.u=old.u;body.v=old.v;resolveBodyContacts(cells,[body,...obstacles]);}
 }
 return body;
}
