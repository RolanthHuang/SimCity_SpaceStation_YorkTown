import test from 'node:test';
import assert from 'node:assert/strict';
import {CityMusic} from '../SimCity/music.mjs';

class Target {
 constructor(){this.listeners=new Map();}
 addEventListener(name,fn){this.listeners.set(name,fn);}
 removeEventListener(name){this.listeners.delete(name);}
 fire(name,event={target:{}}){return this.listeners.get(name)?.(event);}
}
function fixture(preference='on'){
 const document=new Target(),window=new Target();document.hidden=false;
 window.performance={now:()=>0};window.frames=new Map();let frame=0;
 window.requestAnimationFrame=fn=>{window.frames.set(++frame,fn);return frame;};
 window.cancelAnimationFrame=id=>window.frames.delete(id);
 window.advance=now=>{const callbacks=[...window.frames.values()];window.frames.clear();callbacks.forEach(fn=>fn(now));};
 const values=new Map([['yorktown-warm-cello-music-v1',preference]]);
 const storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
 const button={attributes:{},contains:target=>target===button,setAttribute(name,value){this.attributes[name]=value;}};
 const audio={paused:true,volume:1,currentTime:64,plays:0,pauses:0,play(){this.plays++;this.paused=false;return Promise.resolve();},pause(){this.pauses++;this.paused=true;}};
 const music=new CityMusic({audio,button,document,window,storage});
 return {music,audio,button,document,window,values};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));

test('music waits for interaction, fades gently and suspends hidden-page playback without restarting the track',async()=>{
 const f=fixture();assert.equal(f.audio.plays,0);assert.equal(f.audio.preload,'none');assert.equal(f.audio.loop,true);assert.equal(f.audio.volume,0);
 f.document.fire('pointerdown');await settle();assert.equal(f.audio.plays,1);f.window.advance(-20);assert.equal(f.audio.volume,0);f.window.advance(900);assert.ok(f.audio.volume>0&&f.audio.volume<.55);f.window.advance(1800);assert.equal(f.audio.volume,.55);
 f.document.hidden=true;f.document.fire('visibilitychange');assert.equal(f.audio.paused,true);assert.equal(f.audio.volume,0);
 f.document.hidden=false;f.document.fire('visibilitychange');await settle();assert.equal(f.audio.plays,2);assert.equal(f.audio.currentTime,64);
 f.music.dispose();assert.equal(f.audio.paused,true);assert.equal(f.document.listeners.size,0);
});
test('an explicitly muted preference survives reload and the single control enables or disables playback',async()=>{
 const f=fixture('off');f.document.fire('keydown');await settle();assert.equal(f.audio.plays,0);
 f.button.onclick();await settle();assert.equal(f.audio.paused,false);assert.equal(f.values.get('yorktown-warm-cello-music-v1'),'on');
 f.button.onclick();assert.equal(f.audio.paused,true);assert.equal(f.values.get('yorktown-warm-cello-music-v1'),'off');assert.equal(f.button.attributes['aria-pressed'],'false');
 f.music.dispose();
});
test('a browser playback rejection offers one retry control and does not break the city',async()=>{
 const f=fixture();f.audio.play=()=>{f.audio.plays++;return Promise.reject(new Error('gesture required'));};
 f.document.fire('pointerdown');await settle();assert.equal(f.music.blocked,true);assert.equal(f.button.textContent,'♪ 點此播放');
 f.audio.play=()=>{f.audio.plays++;f.audio.paused=false;return Promise.resolve();};f.button.onclick();await settle();assert.equal(f.audio.paused,false);assert.equal(f.music.blocked,false);assert.equal(f.music.enabled,true);
 f.music.dispose();
});
test('a delayed playback response cannot unmute a paused page or stop a newer successful start',async()=>{
 const f=fixture();let resolveOld;f.audio.play=()=>{f.audio.plays++;f.audio.paused=false;return new Promise(resolve=>resolveOld=resolve);};
 f.document.fire('pointerdown');f.button.onclick();resolveOld();await settle();assert.equal(f.audio.paused,true);assert.equal(f.music.enabled,false);
 let resolveStale;f.audio.play=()=>{f.audio.paused=false;return new Promise(resolve=>resolveStale=resolve);};f.button.onclick();f.button.onclick();
 f.audio.play=()=>{f.audio.paused=false;return Promise.resolve();};f.button.onclick();await settle();resolveStale();await settle();assert.equal(f.audio.paused,false);assert.equal(f.music.enabled,true);
 f.window.fire('pagehide');assert.equal(f.audio.paused,true);f.music.dispose();
});
