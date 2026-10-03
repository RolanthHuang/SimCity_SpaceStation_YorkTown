// One month in flight; revisions prevent a stale month from overwriting construction.
export class MonthRunner{
 constructor(worker,{timeoutMs=60000,timers=globalThis}={}){
  Object.assign(this,{worker,timeoutMs,timers,next:0,cacheRevision:null,pending:null,failed:false});
  worker.onmessage=({data})=>{const p=this.pending;if(!p||data.id!==p.id)return;this.timers.clearTimeout(p.timer);this.pending=null;if(data.error){this.fail(new Error(data.error),p);return;}this.cacheRevision=data.revision;p.resolve(data);};
  worker.onerror=event=>this.fail(new Error(event.message||'Background simulation failed.'));
  worker.onmessageerror=()=>this.fail(new Error('Background simulation response could not be read.'));
 }
 get busy(){return !!this.pending;}
 invalidate(){this.cacheRevision=null;}
 run(revision,snapshot){
  if(this.failed)return Promise.reject(new Error('Background simulation is unavailable.'));
  if(this.busy)return Promise.reject(new Error('A month is already in progress.'));
  return new Promise((resolve,reject)=>{
   const id=++this.next,p={id,resolve,reject};this.pending=p;
   p.timer=this.timers.setTimeout(()=>this.fail(new Error('Background simulation timed out.')),this.timeoutMs);
   try{this.worker.postMessage({id,revision,snapshot:this.cacheRevision===revision?undefined:snapshot()});}
   catch(error){this.fail(error);}
  });
 }
 fail(error,p=this.pending){this.failed=true;this.cacheRevision=null;if(p){this.timers.clearTimeout(p.timer);p.reject(error);}this.pending=null;this.worker.terminate();}
 dispose(){this.fail(new Error('Background simulation stopped.'));}
}
