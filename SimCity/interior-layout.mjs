export const FLOOR_HEIGHT=3.6,CELL=1.2,GRID=13;
function makeLayout(seed,floor){
 const map=Array.from({length:GRID},()=>Array(GRID).fill('#'));let rng=seed;
 const random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
 const visit=(x,y)=>{map[y][x]='.';const dirs=[[2,0],[-2,0],[0,2],[0,-2]].map(d=>[random(),d]).sort((a,b)=>a[0]-b[0]);for(const [, [dx,dy]] of dirs){const u=x+dx,v=y+dy;if(u>0&&v>0&&u<12&&v<12&&map[v][u]==='#'){map[y+dy/2][x+dx/2]='.';visit(u,v);}}};visit(1,1);
 for(const [x,y] of [[1,1],[9,1],[1,9],[9,9]])for(let r=y;r<y+3;r++)for(let c=x;c<x+3;c++)map[r][c]='.';
 for(let r=1;r<=11;r++)map[r][6]='.';
 for(let x=1;x<=11;x++)map[5][x]='.';
 if(floor===0)map[11][12]='.';
 if(floor===1){map[1][12]='.';map[1][0]='.';}
 if(floor===2)map[11][0]='.';
 return map.map(row=>row.join(''));
}
export const LAYOUTS=[makeLayout(2263,0),makeLayout(4207,1),makeLayout(6119,2)];
export const ROOMS=[{floor:0,x:-4.8,z:-4.8,name:'生態花園',hint:'找到花園光核',color:0xabcdb0},{floor:1,x:4.8,z:4.8,name:'觀星圖書室',hint:'找到星圖光核',color:0xadcede},{floor:2,x:4.8,z:-4.8,name:'空中展望廊',hint:'找到觀景光核',color:0xd3bc87}];
const tile=(v)=>Math.round(v/CELL)+6;
export function interiorHeight(x,z,currentY){
 if(x>=7.5&&x<=9.1&&z>=-6.15&&z<=6.15)return Math.max(0,Math.min(FLOOR_HEIGHT,(6-z)/12*FLOOR_HEIGHT));
 if(x<=-7.5&&x>=-9.1&&z>=-6.15&&z<=6.15)return FLOOR_HEIGHT+Math.max(0,Math.min(FLOOR_HEIGHT,(z+6)/12*FLOOR_HEIGHT));
 if(Math.abs(x)>7.75||Math.abs(z)>7.75)return null;
 const floor=Math.round(currentY/FLOOR_HEIGHT);if(floor<0||floor>2||Math.abs(currentY-floor*FLOOR_HEIGHT)>.25)return null;
 const row=tile(z),col=tile(x);if(!LAYOUTS[floor][row]||LAYOUTS[floor][row][col]!=='.')return null;
 return floor*FLOOR_HEIGHT;
}
export function moveInterior(p,dx,dz){
 const parts=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.09)),radius=.18;
 const tryMove=(x,z)=>{const height=interiorHeight(x,z,p.y);if(height===null||Math.abs(height-p.y)>.26)return false;
  for(const [ox,oz] of [[radius,0],[-radius,0],[0,radius],[0,-radius]])if(interiorHeight(x+ox,z+oz,height)===null)return false;
  p.x=x;p.z=z;p.y=height;return true;};
 for(let k=0;k<parts;k++){tryMove(p.x+dx/parts,p.z);tryMove(p.x,p.z+dz/parts);}
 p.floor=Math.max(0,Math.min(2,Math.round(p.y/FLOOR_HEIGHT)));
}
export function nearbyRoom(p){return ROOMS.find(r=>r.floor===p.floor&&Math.hypot(p.x-r.x,p.z-r.z)<1.8);}
