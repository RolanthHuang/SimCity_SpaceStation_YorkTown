export const SIMULATION_SPEEDS=Object.freeze([0,1,2,4]);
export const MONTH_DURATION_MS=8000;
export const SPEED_KEYS=Object.freeze({Digit1:1,Digit2:2,Digit3:4});
export function simulationSpeed(value){
 const n=Number(value);if(!Number.isFinite(n)||n<=0)return 0;
 return SIMULATION_SPEEDS.filter(s=>s<=Math.min(4,n)).at(-1);
}
// A slow city advances slowly; background work never receives an unbounded backlog.
export function monthWorkRest(workMs){return Math.max(250,Number.isFinite(workMs)?workMs:250);}
