const PREFERENCE='yorktown-background-music-v1',LEGACY_PREFERENCE='yorktown-warm-cello-music-v1';

export class CityMusic {
 constructor({audio,button,document:doc=globalThis.document,window:win=globalThis.window,storage=null}){
  this.audio=audio;this.button=button;this.doc=doc;this.win=win;this.enabled=true;this.engaged=false;this.pending=false;this.generation=0;this.frame=0;this.level=.55;this.blocked=false;
  try{this.storage=storage||win.localStorage;this.enabled=(this.storage.getItem(PREFERENCE)??this.storage.getItem(LEGACY_PREFERENCE))!=='off';}catch{}
  audio.loop=true;audio.preload='none';audio.volume=0;
  this.gesture=e=>{if(button.contains(e.target))return;this.engaged=true;this.start();};
  this.visibility=()=>{if(doc.hidden)this.pause();else this.start();};
  this.leave=()=>this.pause();
  doc.addEventListener('pointerdown',this.gesture,{capture:true});doc.addEventListener('keydown',this.gesture,{capture:true});
  doc.addEventListener('visibilitychange',this.visibility);win.addEventListener('pagehide',this.leave);
  button.onclick=()=>{this.engaged=true;if(this.blocked){this.blocked=false;this.enabled=true;}else this.enabled=!this.enabled;try{this.storage?.setItem(PREFERENCE,this.enabled?'on':'off');}catch{}if(this.enabled)this.start();else this.pause();this.update();};
  this.update();
 }
 update(){
  this.button.textContent=this.blocked?'♪ 點此播放':this.enabled?'♪ 配樂開啟':'♪ 配樂關閉';
  this.button.setAttribute('aria-pressed',String(this.enabled));
  this.button.title='Firstlight・初見星海';
  this.button.setAttribute('aria-label',this.blocked?'播放 Firstlight 配樂':this.enabled?'關閉背景配樂':'開啟背景配樂');
 }
 async start(){
  if(!this.enabled||!this.engaged||this.doc.hidden||this.pending||!this.audio.paused)return;
  const generation=++this.generation;this.pending=true;
  try{
   await this.audio.play();
   if(generation!==this.generation){if(!this.enabled||this.doc.hidden)this.audio.pause();return;}
   if(!this.enabled||this.doc.hidden){this.audio.pause();return;}
   this.blocked=false;this.fadeIn();
  }catch{if(generation===this.generation)this.blocked=true;}
  finally{if(generation===this.generation){this.pending=false;this.update();}}
 }
 fadeIn(){
  this.win.cancelAnimationFrame(this.frame);const start=this.win.performance.now();
  const tick=now=>{if(!this.enabled||this.doc.hidden||this.audio.paused)return;const progress=Math.max(0,Math.min(1,(now-start)/1800));this.audio.volume=this.level*Math.sin(progress*Math.PI/2);if(progress<1)this.frame=this.win.requestAnimationFrame(tick);};
  this.frame=this.win.requestAnimationFrame(tick);
 }
 pause(){this.generation++;this.pending=false;this.win.cancelAnimationFrame(this.frame);this.audio.pause();this.audio.volume=0;}
 dispose(){this.pause();this.doc.removeEventListener('pointerdown',this.gesture,{capture:true});this.doc.removeEventListener('keydown',this.gesture,{capture:true});this.doc.removeEventListener('visibilitychange',this.visibility);this.win.removeEventListener('pagehide',this.leave);this.button.onclick=null;}
}
