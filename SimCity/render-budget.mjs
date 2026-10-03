// A static paused city must not keep the GPU busy. Movement has a bounded rate.
export function renderPixelRatio(width,height,deviceRatio=1){
 return Math.min(deviceRatio,1,Math.sqrt(1152000/Math.max(1,width*height)));
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
  const dt=this.last?Math.min(.12,Math.max(0,(now-this.last)/1000)):1/30;this.last=now;this.dirty=false;
  this.draw(now,dt);this.schedule();
 }
 dispose(){this.stop();this.doc.removeEventListener('visibilitychange',this.visibility);this.enabled=false;}
}
