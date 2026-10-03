export const TAU=Math.PI*2;
export const wrapAngle=a=>((a+Math.PI)%TAU+TAU)%TAU-Math.PI;
export function turnInput(p,keys,dt,{orbit=false}={}){
 p.yaw=wrapAngle(p.yaw+((keys.ArrowRight||orbit&&keys.KeyE?1:0)-(keys.ArrowLeft||orbit&&keys.KeyQ?1:0))*dt*1.6);
 p.pitch=Math.max(orbit?.18:-1.3,Math.min(orbit?1.42:1.3,p.pitch+((keys.ArrowUp?1:0)-(keys.ArrowDown?1:0))*dt));
}
