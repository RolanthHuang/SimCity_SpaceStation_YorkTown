// A static paused city must not keep the GPU busy. Movement has a bounded rate.
export function renderPixelRatio(width,height,deviceRatio=1,tier='still'){
 const moving=tier==='moving',pixels=moving?2500000:8388608;
 return Math.min(Math.max(moving?1:1.5,deviceRatio),moving?1.4:2,Math.sqrt(pixels/Math.max(1,width*height)));
}
// Camera movement changes resolution once per tier, not once per frame. A paused
// city receives one sharp final frame, then releases the GPU again.
export class ViewQuality{
 constructor({change,settle=()=>{},delay=650,doc=document,win=window}){
  Object.assign(this,{change,settle,delay,doc,win,tier:'still',timer:null,enabled:true});
  this.visibility=()=>{this.cancel();if(!doc.hidden&&this.enabled)this.motion();};
  doc.addEventListener('visibilitychange',this.visibility);
 }
 cancel(){if(this.timer!==null)this.win.clearTimeout(this.timer);this.timer=null;}
 motion(){
  this.cancel();if(!this.enabled||this.doc.hidden)return;
  if(this.tier!=='moving'){this.tier='moving';this.change(this.tier);}
  this.timer=this.win.setTimeout(()=>{this.timer=null;if(!this.enabled||this.doc.hidden)return;this.tier='still';this.change(this.tier);this.settle();},this.delay);
 }
 setEnabled(on){this.enabled=on;this.cancel();if(on)this.motion();}
 dispose(){this.cancel();this.enabled=false;this.doc.removeEventListener('visibilitychange',this.visibility);}
}
export class RenderBudget{
 constructor({draw,activity,doc=document,win=window}){
  Object.assign(this,{draw,activity,doc,win,dirty:true,enabled:true,last:0,frame:null,timer:null});
  this.visibility=()=>{this.stop();this.last=0;if(!doc.hidden)this.invalidate();};
  doc.addEventListener('visibilitychange',this.visibility);this.invalidate();
 }
 invalidate(){this.dirty=true;this.schedule();}
 stop(){if(this.frame!==null)this.win.cancelAnimationFrame(this.frame);if(this.timer!==null)this.win.clearTimeout(this.timer);this.frame=this.timer=null;}
 setEnabled(on){this.enabled=on;this.stop();this.last=0;if(on)this.invalidate();}
 schedule(){
  if(!this.enabled||this.doc.hidden||this.frame!==null||this.timer!==null)return;
  const fps=this.activity();if(!fps&&!this.dirty)return;
  const now=this.win.performance.now(),delay=Math.max(0,1000/(fps||30)-(now-this.last));
  const request=()=>{this.timer=null;this.frame=this.win.requestAnimationFrame(t=>this.run(t));};
  if(delay>1)this.timer=this.win.setTimeout(request,delay);else request();
 }
 run(now){
  this.frame=null;if(!this.enabled||this.doc.hidden)return;
  const dt=this.last?Math.min(.16,Math.max(0,(now-this.last)/1000)):1/30;this.last=now;this.dirty=false;
  this.draw(now,dt);this.schedule();
 }
 dispose(){this.stop();this.doc.removeEventListener('visibilitychange',this.visibility);this.enabled=false;}
}
