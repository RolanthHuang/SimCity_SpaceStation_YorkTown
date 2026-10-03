import test from 'node:test';import assert from 'node:assert/strict';
import {makeInteriorPlan,createQuest,interactQuest,INTERIOR_TARGETS,STOREY,blockedAt} from '../SimCity/structure/interior-plan.mjs';
import {createExplorer,stepExplorer,guideRoute,JUMP_ASSIST_SECONDS,JUMP_ASSIST_SPEED} from '../SimCity/structure/explorer.mjs';
test('puzzle rewards require correct order and alignment, cannot bypass prerequisites',()=>{let q=createQuest();q=interactQuest(q,'treasure');assert.equal(q.complete,false);q=interactQuest(q,'archive');q=interactQuest(q,'valve','drive');assert.deepEqual(q.route,[]);for(const id of ['cool','store','drive'])q=interactQuest(q,'valve',id);assert.equal(q.power,true);q=interactQuest(q,'align');assert.equal(q.stars,false);for(const [k,n]of [[0,2],[1,4],[2,1]])for(let j=0;j<n;j++)q=interactQuest(q,'ring',k);q=interactQuest(q,'align');assert.equal(q.stars,true);q=interactQuest(q,'treasure');assert.equal(q.complete,true);});
test('the floor-aware walking guide reaches the archive, workshop and star room through actual stairs',()=>{
 const plan=makeInteriorPlan();let q=createQuest(),p=createExplorer();
 for(const target of [INTERIOR_TARGETS.archive,INTERIOR_TARGETS.power,INTERIOR_TARGETS.stars]){
  const route=guideRoute(plan,p,target,q);assert.ok(route,`No route to ${target.id}`);let n=0,ticks=0;
  while(n<route.length&&ticks++<20000){const w=route[n],dx=w.x-p.x,dz=w.z-p.z,dist=Math.hypot(dx,dz);if(dist<.15&&Math.abs(w.y-p.y)<.60){n++;continue;}p=stepExplorer(plan,p,{x:dist?dx/dist:0,z:dist?dz/dist:0,speed:Math.min(5.4,dist*60)},1/60,q);assert.equal(p.recovered,false,`Fell on route to ${target.id}`);}
  assert.equal(n,route.length,`Guide stuck to ${target.id}: ${JSON.stringify(p)}, ${JSON.stringify(route[n])}`);assert.ok(Math.abs(p.y-target.floor*STOREY)<.1);assert.ok(Math.hypot(p.x-target.x,p.z-target.z)<.8);
  if(target.id==='archive')q=interactQuest(q,'archive');if(target.id==='power')for(const id of ['cool','store','drive'])q=interactQuest(q,'valve',id);
 }
});
test('walls and bookshelves block movement, oblique input still slides along the wall',()=>{const plan=makeInteriorPlan(),q=createQuest();let p={...createExplorer(),x:-7.45,y:STOREY,z:3};p=stepExplorer(plan,p,{x:-1,z:.4,speed:4},.05,q);assert.ok(p.x>-7.60);assert.ok(p.z>3);assert.equal(blockedAt(plan,-12.9,-9,STOREY,q),true);});
test('the final gap requires a real jump and falls return to a safe place',()=>{
 const plan=makeInteriorPlan(),q={...createQuest(),archive:true,power:true,stars:true};let p={...createExplorer(),x:5.55,y:STOREY*5,z:0,checkpoint:{x:5.55,y:STOREY*5,z:0}};
 for(let i=0;i<65;i++)p=stepExplorer(plan,p,{x:-1,z:0,speed:5,jump:i===0},1/60,q);assert.ok(p.x<3&&p.y>=STOREY*5-.1,'Jump did not reach the island');
 p={...createExplorer(),x:5.55,y:STOREY*5,z:0,checkpoint:{x:5.55,y:STOREY*5,z:0}};let rescue=false;for(let i=0;i<80;i++){p=stepExplorer(plan,p,{x:-1,z:0,speed:3},1/60,q);rescue ||= p.recovered;}assert.equal(rescue,true);assert.ok(p.y>=STOREY*5-1.8);
});

test('the on-screen jump assist crosses the gap and stops within vault interaction range at multiple frame rates',()=>{
 const plan=makeInteriorPlan(),q={...createQuest(),archive:true,power:true,stars:true};
 for(const rate of [30,60,120]){let p={...createExplorer(),x:5.62,y:STOREY*5,z:0,checkpoint:{x:5.62,y:STOREY*5,z:0}},assist=JUMP_ASSIST_SECONDS;
  for(let k=0;k<rate*2;k++){const active=assist>0;p=stepExplorer(plan,p,{x:active?-1:0,z:0,speed:JUMP_ASSIST_SPEED,jump:k===0},1/rate,q);assist=Math.max(0,assist-1/rate);assert.equal(p.recovered,false);}
  assert.equal(p.grounded,true);assert.ok(p.x<2.25);assert.equal(p.y,STOREY*5);
 }
});
