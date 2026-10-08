import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../YorktownPreview/three.module.js';
import {DOCK_FRAME,DOCK_START,DOCK_ROUTE,onDock,moveDock,dockEdges,dockWorld,dockCamera} from '../SimCity/dock-walking.mjs';
import {centralDock,DockWalk} from '../SimCity/central-dock.mjs';
import {ORBIT_PLACEMENT} from '../SimCity/grand-orbit-scene.mjs';
test('the central deck has connected floors; railings do not close passage junctions',()=>{
 assert.equal(onDock(5,0),false,'walking route stays outside the existing citadel towers');const p={...DOCK_START};for(const t of DOCK_ROUTE){for(let j=0;j<900;j++){const d=Math.hypot(t.x-p.x,t.z-p.z);if(d<.01)break;moveDock(p,(t.x-p.x)/d*Math.min(.04,d),(t.z-p.z)/d*Math.min(.04,d));assert.ok(onDock(p.x,p.z));}assert.ok(Math.hypot(p.x-t.x,p.z-t.z)<.01);}
 for(const [a,b]of dockEdges()){const x=(a[0]+b[0])/2,z=(a[1]+b[1])/2;assert.ok(onDock(x,z,0));assert.ok(!onDock(x,z,.02),'union interior cannot have a blocking rail');}
});
test('large steps cannot tunnel through rails and oblique contact slides',()=>{
 const p={...DOCK_START};moveDock(p,100,-100);assert.ok(onDock(p.x,p.z));assert.equal(p.y,0);
 const q={x:14,y:-99,z:-8.90};moveDock(q,2,-2);assert.ok(q.x>15.8);assert.ok(onDock(q.x,q.z));assert.equal(q.y,0);
});
test('both human camera modes stay above the real dock floor at all pitch limits',()=>{
 for(const pitch of [-1.3,-.6,0,.7,1.3])for(const third of [false,true]){const c=dockCamera({...DOCK_START,pitch},third);assert.ok(c.eye[1]>=DOCK_FRAME.position[1]+.18);assert.ok([...c.eye,...c.aim].every(Number.isFinite));}
 assert.deepEqual(ORBIT_PLACEMENT.flagship.position,dockWorld({x:24,y:8,z:0}));assert.ok(ORBIT_PLACEMENT.flagship.position[1]>DOCK_FRAME.position[1]);
});
test('the underslung dock has finite 3D surfaces and uses at most 16 material batches',()=>{
 const names=['plate','ivory','hullShade','steel','cyan','silver','leaf'],m=Object.fromEntries(names.map(n=>[n,new T.MeshStandardMaterial()])),r=centralDock(m,{labels:false});let meshes=0,points=0;
 r.traverse(o=>{if(!o.isMesh)return;meshes++;const a=o.geometry.attributes.position.array;points+=a.length;assert.ok(a.every(Number.isFinite));});assert.ok(points>4000);assert.ok(meshes<=16);assert.deepEqual(r.position.toArray(),DOCK_FRAME.position);
});
test('leaving a dock visit does not dispose the shared city scene',()=>{
 const elements=new Map();globalThis.document={getElementById(id){if(!elements.has(id))elements.set(id,{});return elements.get(id);}};
 let disposed=false;const scene={dispose(){disposed=true;}},view={scene,state:{orbital:{grand:{flagship:{remaining:5}}}}};const room=new DockWalk(view);assert.equal(room.scene,scene);assert.equal(room.avatarScale,.165);room.dispose();assert.equal(disposed,false);assert.equal(elements.get('structure-hud').hidden,true);delete globalThis.document;
});

test('paused idle dock stops rendering; guided walking resumes the existing frame budget',async()=>{
 const {CityView}=await import('../SimCity/view.mjs');globalThis.document={querySelector(){return null;},getElementById(){return null;}};
 const v={room:{kind:'dock',guide:null},keys:{},pointers:new Map(),walker:{velocity:0,jump:0},explorer:{state:{cooldown:0}},growing:[],simulationSpeed:0,grandOrbit:{pending:()=>false}};
 assert.equal(CityView.prototype.renderActivity.call(v),0);v.room.guide={};assert.equal(CityView.prototype.renderActivity.call(v),12);v.keys.KeyW=true;assert.equal(CityView.prototype.renderActivity.call(v),30);delete globalThis.document;
});
test('an idle dock camera does not invalidate itself into a perpetual render loop',async()=>{
 const {CityView}=await import('../SimCity/view.mjs');let frames=0;const v={room:{kind:'dock',guide:null},keys:{},explorer:{state:{moving:1}},cameraUpdate(){frames++;}};
 CityView.prototype.walkInterior.call(v,.1);assert.equal(frames,0);assert.equal(v.explorer.state.moving,0);
});
test('finishing the guided promenade updates its button before rendering becomes idle',()=>{
 const elements=new Map();globalThis.document={getElementById(id){if(!elements.has(id))elements.set(id,{});return elements.get(id);}};
 const view={scene:{},state:{orbital:{grand:{flagship:{remaining:5}}}}},room=new DockWalk(view);room.guide={index:2};Object.assign(room.position,DOCK_ROUTE[2]);room.step(.01,{});
 assert.equal(room.guide,null);assert.equal(elements.get('room-guide').textContent,'沿甲板走向觀景端');room.dispose();delete globalThis.document;
});
