import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../YorktownPreview/three.module.js';
import {createCity,analyze,forecast,serialize} from '../SimCity/engine.mjs';
import {prepareLiving} from '../SimCity/living-plan.mjs';
import {idx,deltaX,CELL_COUNT} from '../SimCity/catalog.mjs';
import {canWalk,frame,tileAt} from '../SimCity/habitat.mjs';
import {PROFILES,createExplorer,chooseProfile,beginAbility,moveExplorer,advanceAbility,vehicleTier,safeDismount,proximity,createFleet,routePosition,citizenReport,MAX_FLIGHT_HEIGHT} from '../SimCity/surrogate.mjs';
import {SurrogateRig,VehicleRig} from '../SimCity/surrogate-scene.mjs';
const empty=()=>createCity({starter:false});
const walker=()=>({u:0,v:0,yaw:Math.PI/2,pitch:0,jump:0,velocity:0});
const run=(s,w,e,keys,seconds)=>{for(let n=0;n<Math.round(seconds*60);n++)moveExplorer(s.cells,w,e,keys,1/60);};

test('surrogate choices are optional and have genuinely different abilities',()=>{
 assert.equal(createExplorer({thirdPerson:false}).thirdPerson,false);assert.equal(createExplorer({profile:'bad'}).profile,'architect');
 const e=createExplorer(),w=walker();assert.equal(beginAbility(e,w),false);assert.equal(w.velocity,0);
 assert.equal(chooseProfile(e,'courier',w),true);assert.equal(beginAbility(e,w),true);assert.equal(w.velocity,PROFILES.courier.jump);
 assert.equal(chooseProfile(e,'pilot',w),true);assert.equal(w.velocity,0);assert.equal(w.jump,0);assert.equal(beginAbility(e,w),true);
});
test('courier jumps nearly three cells while running, then lands and can jump again',()=>{
 const s=empty(),w=walker(),e=createExplorer({profile:'courier'});beginAbility(e,w);let peak=0,time=0;
 do{moveExplorer(s.cells,w,e,{KeyW:true,ShiftLeft:true},1/60);peak=Math.max(peak,w.jump);time+=1/60;}while(w.jump>0&&time<3);
 assert.ok(peak>.6&&peak<.75);assert.ok(w.u>2.5&&w.u<3);assert.equal(w.jump,0);assert.equal(w.velocity,0);assert.equal(beginAbility(e,w),true);
});
test('pilot flight has a height limit, depletes, lands even with Space held, and recovers on the ground',()=>{
 const s=empty(),w=walker(),e=createExplorer({profile:'pilot'});let peak=0,emptyAt=0;
 for(let n=0;n<660;n++){moveExplorer(s.cells,w,e,{Space:true},1/60);peak=Math.max(peak,w.jump);if(e.energy<=0&&!emptyAt)emptyAt=n/60;}
 assert.equal(peak,MAX_FLIGHT_HEIGHT);assert.ok(emptyAt>4.9&&emptyAt<5.1);assert.equal(w.jump,0);assert.ok(e.energy>=0&&e.energy<=1);
 for(let n=0;n<300;n++)advanceAbility(e,w,{},1/60);assert.equal(e.energy,1);assert.equal(e.cooldown,0);
});
test('walk, jump, flight and riding never tunnel through buildings or off the deck',()=>{
 const s=empty();Object.assign(s.cells[idx(29,28)],{type:'R',level:2});
 for(const profile of Object.keys(PROFILES)){const w=walker(),e=createExplorer({profile});if(profile==='courier')beginAbility(e,w);run(s,w,e,{KeyW:true,ShiftLeft:true,Space:profile==='pilot'},2);assert.ok(w.u<=.991);assert.ok(canWalk(s.cells,w.u,w.v));}
 const w={...walker(),u:0,v:15.2,yaw:Math.PI},e=createExplorer({profile:'pilot'});run(s,w,e,{KeyW:true,Space:true},4);assert.ok(canWalk(s.cells,w.u,w.v));assert.ok(w.v<16.1);
});
test('mounting changes speed, footprint and animation position, and a safe dismount is on open terrain',()=>{
 const s=empty(),w=walker(),e=createExplorer(),vehicle={id:'test',kind:'hound',tier:2,u:0,v:0,heading:Math.PI/2,progress:0};e.mounted=vehicle;
 run(s,w,e,{KeyW:true,Space:true},1);assert.ok(w.u>1.85&&w.u<1.9);assert.equal(w.jump,0);assert.equal(vehicle.u,w.u);assert.ok(vehicle.progress>1.85);
 const safe=safeDismount(s.cells,w,vehicle);assert.ok(safe);assert.ok(canWalk(s.cells,safe.u,safe.v));assert.ok(Math.hypot(deltaX(w.u,safe.u),w.v-safe.v)>=.34);
});
test('vehicle upgrades require current population, wellbeing and completed orders',()=>{
 const s=empty(),a={stats:{population:300,happiness:90}};assert.equal(vehicleTier(s,a),1);a.stats.population=2000;assert.equal(vehicleTier(s,a),2);a.stats.happiness=40;assert.equal(vehicleTier(s,a),1);
 a.stats.population=6000;a.stats.happiness=70;assert.equal(vehicleTier(s,a),2);s.orbital.completed=16;assert.equal(vehicleTier(s,a),3);
});
test('nearby interaction respects deck, distance, disabled objects and altitude',()=>{
 const w=walker(),targets=[{kind:'ride',u:.2,v:0,deck:0},{kind:'talk',u:.1,v:0,deck:1},{kind:'enter',u:.05,v:0,disabled:true}];
 assert.equal(proximity(w,targets).kind,'ride');assert.equal(proximity({...w,jump:.5},targets),null);assert.equal(proximity({...w,u:8},targets),null);
});
test('visible traffic is generated from operating streets and real commute routes, without creating residents or tax income',()=>{
 const s=prepareLiving(createCity()),a=analyze(s),before=serialize(s),path=[idx(25,29),idx(25,30),idx(25,31),idx(25,32)],fleet=createFleet(s,a,[path]);
 assert.ok(fleet.some(v=>v.kind==='scooter'&&v.parked));assert.ok(fleet.some(v=>v.kind==='hound'&&v.parked));assert.ok(fleet.some(v=>v.path));assert.ok(fleet.every(v=>v.tier===2&&canWalk(s.cells,v.u,v.v)));
 assert.equal(serialize(s),before);const none=empty(),na=analyze(none);assert.deepEqual(createFleet(none,na,[]),[]);
});
test('route traffic moves along road geometry and reverses its heading rather than teleporting at the endpoints',()=>{
 const path=[idx(25,29),idx(26,29),idx(27,29)],a=routePosition(path,.75),b=routePosition(path,2.75);
 assert.ok(Math.abs(a.u-(-1.75))<1e-8);assert.equal(a.v,1.5);assert.ok(Math.abs(a.heading-Math.PI/2)<1e-8);assert.ok(b.heading<0);
 const c=routePosition(path,3.99999),d=routePosition(path,4.00001);assert.ok(Math.hypot(c.u-d.u,c.v-d.v)<.00003);
});
test('citizens give measured city and local road information, and change when the city changes',()=>{
 const s=prepareLiving(createCity()),a=analyze(s),tile=idx(25,29),net=forecast(s,a).net;
 const resident=citizenReport(s,a,{id:0,tile},net);assert.match(resident.text,/2,840/);assert.match(resident.text,/94%/);
 const shop=citizenReport(s,a,{id:1,tile},net);assert.match(shop.text,/1,338/);assert.ok(shop.text.includes(`+${Math.round(net).toLocaleString('en-US')} 信用點`));
 a.power.coverage[tile]=.2;assert.match(citizenReport(s,a,{id:2,tile},net).text,/20%/);a.traffic[tile]=a.roadCapacity[tile]*2;assert.match(citizenReport(s,a,{id:3,tile},net).text,/200%/);
});
test('articulated character meshes face travel direction on both gravity frames and stay finite',()=>{
 for(const profile of Object.keys(PROFILES)){const rig=new SurrogateRig(profile);for(const [u,v]of [[0,0],[5,44]]){rig.place(u,v,.065,Math.PI/2);const dir=new THREE.Vector3(0,0,-1).applyQuaternion(rig.root.quaternion),f=frame(u,v);assert.ok(dir.distanceTo(new THREE.Vector3(...f.tangent))<1e-8);}
  rig.animate({...createExplorer({profile}),moving:2,phase:7},{jump:.5});rig.root.updateMatrixWorld(true);let meshes=0;rig.root.traverse(o=>{if(o.isMesh){meshes++;assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));assert.ok(o.matrixWorld.elements.every(Number.isFinite));}});assert.ok(meshes>8);rig.dispose();}
});
test('scooter and mechanical hound have three distinct, renderable tiers and movable wheels or legs',()=>{
 for(const kind of ['scooter','hound']){let previous=0;for(const tier of [1,2,3]){const rig=new VehicleRig({id:'sample',kind,tier});let vertices=0;rig.root.traverse(o=>{if(o.isMesh){vertices+=o.geometry.attributes.position.count;assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));}});assert.ok(vertices>previous);previous=vertices;rig.animate(1.5,true);rig.place({u:0,v:0,heading:Math.PI/2});assert.ok(kind==='scooter'?rig.wheels.every(w=>w.rotation.x!==0):rig.legs.some(l=>l.upper.rotation.x!==0));rig.dispose();}}
});
