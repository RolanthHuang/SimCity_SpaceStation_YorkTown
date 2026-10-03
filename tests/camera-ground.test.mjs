import test from 'node:test';
import assert from 'node:assert/strict';
import {surface,frame,surfaceHeight} from '../SimCity/habitat.mjs';
import {constrainDeckCamera,constrainRoomCamera,groundOrbitPitch,DECK_CAMERA_CLEARANCE,ROOM_CAMERA_CLEARANCE} from '../SimCity/camera-ground.mjs';

test('camera floor uses signed curved-deck height, including folded gravity and the complete arm',()=>{
 for(const deck of [0,1])for(const u of [-250,-90,-12,0,14,90,250])for(const h of [-2,0,.16,2])assert.ok(Math.abs(surfaceHeight(surface(u,deck?44:0,h),deck)-h)<1e-10);
});
test('all third-person yaw, pitch and zoom combinations keep the camera and focus ray above both decks',()=>{
 for(const deck of [0,1])for(const u of [-250,-90,0,14,90,250])for(const jump of [0,.65,2]){
  const v=deck?44:4.5,f=frame(u,v),focus=surface(u,v,.22+jump);
  for(let yaw=0;yaw<6.3;yaw+=.5)for(const pitch of [-1.3,-.08,0,.8,1.3])for(const distance of [.55,1.25,3]){
   const forward=f.tangent.map((n,i)=>n*Math.sin(yaw)-f.side[i]*Math.cos(yaw));
   const desired=focus.map((n,i)=>n-forward[i]*distance*Math.cos(pitch)+f.up[i]*(.21-Math.sin(pitch)*distance));
   const safe=constrainDeckCamera(focus,desired,deck);
   assert.ok(surfaceHeight(safe,deck)>=DECK_CAMERA_CLEARANCE-1e-7);
   for(const t of [.25,.5,.75])assert.ok(surfaceHeight(focus.map((n,i)=>n+(safe[i]-n)*t),deck)>=DECK_CAMERA_CLEARANCE-1e-7);
  }
 }
});
test('safe cameras retain their exact position, while smoothed old positions below a new floor are retracted',()=>{
 const focus=surface(10,4.5,.22),safe=surface(9,4.5,.8);assert.deepEqual(constrainDeckCamera(focus,safe),safe);
 const corrected=constrainDeckCamera(focus,surface(10,4.5,-.8));assert.ok(surfaceHeight(corrected)>=DECK_CAMERA_CLEARANCE);
});
test('room and staircase cameras never go below the current floor, including a smoothed previous-floor position',()=>{
 for(const floor of [0,.3,1.8,3.6,4.2,7.2]){
  const focus=[0,floor+1.16,0],desired=[0,floor-1.5,2.3],safe=constrainRoomCamera(focus,desired,floor);
  assert.ok(safe[1]>=floor+ROOM_CAMERA_CLEARANCE);assert.ok(safe[2]<desired[2]);
  const raised=[0,floor+2,2];assert.deepEqual(constrainRoomCamera(focus,raised,floor),raised);
 }
});
test('upward looking retains a usable follow distance and frees the orbit again while airborne',()=>{
 for(const distance of [.55,1.25,3]){
  const pitch=groundOrbitPitch(1.3,distance,.22,.21,.20);
  assert.ok(.22+.21-Math.sin(pitch)*distance>=.20-1e-10);
  assert.ok(distance*Math.cos(pitch)>.85*distance);
 }
 assert.equal(groundOrbitPitch(-1.3,3,.22,.21,.20),-1.3);
 assert.equal(groundOrbitPitch(1.3,1.25,2.22,.21,.20),1.3);
});
