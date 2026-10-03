import {surfaceHeight,surface,localPoint} from './habitat.mjs';

export const DECK_CAMERA_CLEARANCE=.16;
export const ROOM_CAMERA_CLEARANCE=.28;
const between=(a,b,t)=>a.map((n,i)=>n+(b[i]-n)*t);
// Stop the downward orbit before hitting the deck, retaining the horizontal
// follow distance so looking upward does not push the lens inside the avatar.
export function groundOrbitPitch(requested,distance,focusHeight,offset,clearance){
 const lowestAngle=Math.asin(Math.max(-1,Math.min(1,(focusHeight+offset-clearance)/distance)));
 return Math.min(requested,lowestAngle);
}

// Retract along the already collision-tested focus ray instead of raising the
// camera sideways through a nearby wall. The inhabitable side of each curved
// deck is a convex cylinder, so a segment with safe endpoints is also safe.
export function constrainDeckCamera(focus,desired,deck=0,clearance=DECK_CAMERA_CLEARANCE){
 let start=focus;
 if(surfaceHeight(start,deck)<clearance){const [u,v]=localPoint(...start,deck);start=surface(u,v,clearance+.00001);}
 if(surfaceHeight(desired,deck)>=clearance)return [...desired];
 let safe=0,blocked=1;
 for(let i=0;i<22;i++){const t=(safe+blocked)/2;if(surfaceHeight(between(start,desired,t),deck)>=clearance)safe=t;else blocked=t;}
 return between(start,desired,Math.max(0,safe-.000001));
}

export function constrainRoomCamera(focus,desired,floorY,clearance=ROOM_CAMERA_CLEARANCE){
 const bottom=floorY+clearance;
 if(desired[1]>=bottom)return [...desired];
 const t=Math.max(0,Math.min(1,(focus[1]-bottom)/Math.max(.000001,focus[1]-desired[1])));
 const result=between(focus,desired,Math.max(0,t-.000001));result[1]=Math.max(bottom,result[1]);return result;
}
