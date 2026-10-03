import test from 'node:test';
import assert from 'node:assert/strict';
import {createCity,analyze} from '../SimCity/engine.mjs';
import {prepareLiving} from '../SimCity/living-plan.mjs';
import {idx,deltaX} from '../SimCity/catalog.mjs';
import {canWalk} from '../SimCity/habitat.mjs';
import {BODY_SHAPES,bodyClear,bodyOverlaps,movePhysicalBody,resolveBodyContacts} from '../SimCity/body-collision.mjs';
import {createExplorer,moveExplorer,createFleet,safeDismount} from '../SimCity/surrogate.mjs';

const empty=()=>createCity({starter:false}).cells;
const person=(u=0,v=0)=>({id:'player',kind:'surrogate',u,v,jump:0,heading:Math.PI/2});
const dog=(u=.7,v=0)=>({id:'dog',kind:'hound',u,v,heading:Math.PI/2});
const distance=(a,b)=>Math.hypot(deltaX(a.u,b.u),a.v-b.v);

test('inverse mass gives most contact displacement to the lighter body',()=>{
 const cells=empty(),a=person(),b=dog(.35),before={a:a.u,b:b.u};resolveBodyContacts(cells,[a,b]);
 assert.ok(bodyClear(a,[b]));assert.ok(a.u<before.a&&b.u>before.b);
 const ratio=(before.a-a.u)/(b.u-before.b);assert.ok(Math.abs(ratio-BODY_SHAPES.hound.mass/BODY_SHAPES.surrogate.mass)<.001);
 const scooter={id:'scooter',kind:'scooter',u:0,v:0},hound=dog(.42);resolveBodyContacts(cells,[scooter,hound]);
 assert.ok(Math.abs(scooter.u)>Math.abs(hound.u-.42)*7);
});
test('head-on walking cannot penetrate the mechanical hound and slowly slides around it',()=>{
 const cells=empty(),a=person(),b=dog();let sideAtContact=0;
 for(let step=0;step<900;step++){
  movePhysicalBody(cells,a,.72/60,0,[b]);assert.ok(bodyClear(a,[b]),`contact at step ${step}`);
  assert.ok(canWalk(cells,a.u,a.v));if(step===90)sideAtContact=Math.abs(a.v);
 }
 assert.ok(sideAtContact>.03&&sideAtContact<.25);assert.ok(a.u>b.u+.45,'eventually passes on the side');assert.ok(b.u<1.05,'heavy chassis moves only a little');
});
test('oblique impact preserves faster tangent motion than head-on impact',()=>{
 const cells=empty(),head=person(.29,0),headDog=dog(),oblique=person(.29,0),angleDog=dog();
 for(let n=0;n<8;n++){movePhysicalBody(cells,head,.012,0,[headDog]);movePhysicalBody(cells,oblique,.012/Math.sqrt(2),.012/Math.sqrt(2),[angleDog]);}
 assert.ok(bodyClear(head,[headDog])&&bodyClear(oblique,[angleDog]));assert.ok(Math.abs(oblique.v)>Math.abs(head.v)*2);
});
test('substeps prevent a fast rider tunnelling through a hound during a slow frame',()=>{
 const cells=empty(),a={id:'scooter',kind:'scooter',u:0,v:0},b=dog();movePhysicalBody(cells,a,4,0,[b]);
 assert.ok(bodyClear(a,[b]));assert.ok(Math.abs(a.v)>.1||a.u<b.u,'can pass only around the chassis');
});
test('a chassis pinned against a building pushes the walker out, never into that building',()=>{
 const cells=empty();Object.assign(cells[idx(29,28)],{type:'R',level:2});
 const a=person(.28),b=dog(.93);assert.ok(canWalk(cells,b.u,b.v,.17));
 for(let n=0;n<120;n++){movePhysicalBody(cells,a,.012,0,[b]);assert.ok(bodyClear(a,[b]));assert.ok(canWalk(cells,a.u,a.v));assert.ok(canWalk(cells,b.u,b.v,.17));}
});
test('different gravity decks do not collide; airborne feet clear a lower chassis',()=>{
 const a=person(),b=dog(0);assert.equal(bodyOverlaps(a,b),true);a.jump=.55;assert.equal(bodyOverlaps(a,b),false);
 a.jump=.49;assert.equal(bodyOverlaps(a,b),true);b.v=44;assert.equal(bodyOverlaps(a,b),false);
});
test('landing separates the character from a chassis in the same update',()=>{
 const cells=empty(),b=dog(0),w={u:0,v:0,jump:.55,velocity:-2,yaw:Math.PI/2},e=createExplorer({profile:'pilot'});
 moveExplorer(cells,w,e,{},.06,[b]);assert.ok(w.jump<.52);assert.ok(bodyClear(w,[b]));
});
test('a rider and shared vehicles obey contacts, while dismount never places a person inside any chassis',()=>{
 const cells=empty(),vehicle={id:'scooter',kind:'scooter',tier:2,u:0,v:0,heading:Math.PI/2,progress:0},b=dog(),e=createExplorer(),w={u:0,v:0,jump:0,velocity:0,yaw:Math.PI/2};e.mounted=vehicle;
 for(let n=0;n<180;n++){moveExplorer(cells,w,e,{KeyW:true},1/60,[vehicle,b]);assert.ok(bodyClear(vehicle,[b]));}
 const safe=safeDismount(cells,w,vehicle,[vehicle,b]);assert.ok(safe);assert.ok(bodyClear({...safe,kind:'surrogate'},[vehicle,b],.015));
});
test('an inhabited fleet can be separated without changing city simulation data or clipping into buildings',()=>{
 const s=prepareLiving(createCity()),a=analyze(s),fleet=createFleet(s,a,[[idx(25,29),idx(25,30),idx(25,31),idx(25,32)]]),before=JSON.stringify(s);resolveBodyContacts(s.cells,fleet,12);
 assert.ok(fleet.every(v=>canWalk(s.cells,v.u,v.v,BODY_SHAPES[v.kind].terrainRadius)));assert.equal(JSON.stringify(s),before);
 for(let i=0;i<fleet.length;i++)assert.ok(bodyClear(fleet[i],fleet.slice(i+1)));
});
