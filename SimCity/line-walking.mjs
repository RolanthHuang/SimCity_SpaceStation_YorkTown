// Public corridors stay clear of the residential pods, planters and lift shafts.
export function linePlanters(length){const boxes=[];for(let z=-length/2+12;z<length/2-9;z+=40)for(const x of [-18,18])boxes.push({x,z,w:5,d:4});return boxes;}
export function lineFloorPatches(length){
 const h=length/2,holes=[-h+12,h-12],patches=[{x:-17,z:0,w:46,d:length},{x:27,z:0,w:26,d:length}];
 let start=-h;for(const z of holes){patches.push({x:10,z:(start+z-3)/2,w:8,d:z-3-start});start=z+3;}patches.push({x:10,z:(start+h)/2,w:8,d:h-start});return patches;
}
export function moveLineWalker(position,input,length,dt){
 const p={...position},n=Math.max(1,Math.hypot(input.x,input.z)),speed=input.speed??3.8,boxes=linePlanters(length),blocked=(x,z)=>boxes.some(b=>Math.abs(x-b.x)<b.w/2+.36&&Math.abs(z-b.z)<b.d/2+.36);
 const steps=Math.max(1,Math.ceil(speed*dt/.16));for(let k=0;k<steps;k++){const x=Math.max(-25,Math.min(25,p.x+input.x/n*speed*dt/steps));if(!blocked(x,p.z))p.x=x;const z=Math.max(-length/2+1,Math.min(length/2-1,p.z+input.z/n*speed*dt/steps));if(!blocked(p.x,z))p.z=z;}return p;
}
