import {createCity,step} from './engine.mjs';

const used=c=>!!(c.type||c.wire||c.pipe||c.pop||c.age||c.fire);
export function hydrateSimulation(snapshot){
 const raw=JSON.parse(snapshot),defaults=createCity({starter:false});
 raw.cells=raw.cells.map((c,i)=>c||defaults.cells[i]);raw.cells.atelier=!!raw.artSample;
 return raw;
}
export function applyMonth(city,result){
 Object.assign(city,result.header);
 for(const [i,c]of result.cells)city.cells[i]=c;
 city.cells.atelier=!!city.artSample;
 return result.analysis;
}
export function transferBuffers(value,buffers=new Set(),seen=new Set()){
 if(!value||typeof value!=='object'||seen.has(value))return buffers;seen.add(value);
 if(ArrayBuffer.isView(value)){buffers.add(value.buffer);return buffers;}
 for(const child of value instanceof Map?value.values():Object.values(value))transferBuffers(child,buffers,seen);
 return buffers;
}
export function createMonthTask(){
 let city,revision;
 return request=>{
  if(request.snapshot){city=hydrateSimulation(request.snapshot);revision=request.revision;}
  if(!city||revision!==request.revision)throw new Error('Simulation snapshot is out of date.');
  const before=new Set();city.cells.forEach((c,i)=>{if(used(c))before.add(i);});
  const start=performance.now(),analysis=step(city),workMs=performance.now()-start;
  const cells=[];city.cells.forEach((c,i)=>{if(used(c)||before.has(i))cells.push([i,c]);});
  const {cells:unused,...header}=city;
  return {id:request.id,revision,header,cells,analysis,workMs};
 };
}
