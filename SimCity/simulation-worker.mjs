import {createMonthTask,transferBuffers} from './simulation-protocol.mjs';
const month=createMonthTask();
self.onmessage=({data})=>{
 try{const result=month(data);self.postMessage(result,[...transferBuffers(result.analysis)]);}
 catch(error){self.postMessage({id:data.id,error:String(error?.message||error)});}
};
