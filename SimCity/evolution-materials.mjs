import * as T from '../YorktownPreview/three.module.js';
export function detailMaterials(m){
 const textures=[];
 const tex=(draw,size=512,color=false)=>{const cv=document.createElement('canvas');cv.width=cv.height=size;draw(cv.getContext('2d'),size);const t=new T.CanvasTexture(cv);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;if(color)t.colorSpace=T.SRGBColorSpace;textures.push(t);return t;};
 let seed=921;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const rough=tex((c,s)=>{const d=c.createImageData(s,s);for(let i=0;i<d.data.length;i+=4){const v=185+rnd()*45;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255;}c.putImageData(d,0,0);c.strokeStyle='#878787';c.lineWidth=2;for(let y=0;y<s;y+=128)c.strokeRect(0,y,s,128);});
 const normal=tex((c,s)=>{const d=c.createImageData(s,s);for(let i=0;i<d.data.length;i+=4){d.data[i]=126+rnd()*4;d.data[i+1]=126+rnd()*4;d.data[i+2]=255;d.data[i+3]=255;}c.putImageData(d,0,0);c.strokeStyle='#749bff';c.lineWidth=1;for(let y=0;y<s;y+=128){c.beginPath();c.moveTo(0,y);c.lineTo(s,y);c.stroke();}});
 const stone=tex((c,s)=>{c.fillStyle='#d9d4c7';c.fillRect(0,0,s,s);for(let y=0;y<8;y++)for(let x=0;x<8;x++){const v=210+rnd()*15;c.fillStyle=`rgb(${v+5},${v+2},${v-7})`;c.fillRect(x*64+1,y*64+1,62,62);}for(let j=0;j<10000;j++){c.fillStyle=`rgba(91,88,72,${rnd()*.08})`;c.fillRect(rnd()*s,rnd()*s,1,1);}},512,true);
 // Neutral silver panes retain the facade's hue instead of multiplying it by dark blue.
 const glass=tex((c,s)=>{c.fillStyle='#a5b5b4';c.fillRect(0,0,s,s);const w=s/8,h=s/12;for(let y=0;y<12;y++)for(let x=0;x<8;x++){
  const v=rnd(),g=c.createLinearGradient(x*w,y*h,(x+1)*w,(y+1)*h);g.addColorStop(0,v>.72?'#bac4bc':'#c5dad7');g.addColorStop(.30,'#e4ece4');g.addColorStop(.55,v>.72?'#afbbb3':'#adcbcf');g.addColorStop(1,v>.72?'#9aaea9':'#92b4c0');c.fillStyle=g;c.fillRect(x*w+1,y*h+1,w-2,h-2);
  if(v>.72){c.fillStyle=v>.90?'#e3c491':'#d8cec0';c.fillRect(x*w+3,y*h+3,w*.82,h*(.23+rnd()*.37));c.strokeStyle='rgba(89,99,99,.40)';c.lineWidth=.8;for(let k=0;k<5;k++){c.beginPath();c.moveTo(x*w+3,y*h+4+k*3);c.lineTo(x*w+w*.88,y*h+4+k*3);c.stroke();}}
  c.fillStyle='rgba(34,59,64,.38)';c.fillRect(x*w+1,(y+1)*h-3,w-2,2);c.fillStyle='rgba(236,249,245,.34)';c.fillRect(x*w+2,y*h+1,1,h-3);
 }},512,true);
 const foliage=tex((c,s)=>{c.clearRect(0,0,s,s);for(let k=0;k<380;k++){const a=rnd()*Math.PI*2,r=Math.sqrt(rnd()),x=s/2+Math.cos(a)*r*s*.47,y=s/2+Math.sin(a)*r*s*.43;c.save();c.translate(x,y);c.rotate(a);c.fillStyle=['#e7e2ba','#b5caa2','#8ca88d','#d2dba6'][k%4];c.beginPath();c.ellipse(0,0,3+rnd()*9,2+rnd()*4,0,0,Math.PI*2);c.fill();c.restore();}},256,true);
 for(const name of ['ivory','porcelain','stone','titanium','gold','dark','wood']){m[name].roughnessMap=rough;m[name].normalMap=normal;m[name].normalScale=new T.Vector2(.07,.07);}
 m.ivory.roughness=.61;m.ivory.metalness=.05;m.porcelain.roughness=.48;m.porcelain.metalness=.06;m.stone.map=stone;m.stone.roughness=.88;
 m.titanium.roughness=.34;m.gold.roughness=.31;m.gold.color.set(0xb99762);m.dark.roughness=.62;m.red.metalness=.12;m.red.roughness=.52;
 m.window.map=glass;m.window.color.set(0x67a8b8);m.window.roughness=.19;m.window.metalness=.16;m.window.envMapIntensity=.82;
 const singleRow=glass.clone();singleRow.repeat.set(1,1/12);textures.push(singleRow);m.glass.map=singleRow;m.glass.roughness=.17;m.glass.metalness=.10;m.glass.clearcoat=.75;m.glass.envMapIntensity=.95;m.glass.color.set(0x8cc5c7);
 const paneMap=glass.clone();paneMap.repeat.set(1/8,1/12);paneMap.offset.set(3/8,5/12);textures.push(paneMap);m.pane=m.glass.clone();m.pane.map=paneMap;m.pane.color.set(0xffffff);m.pane.roughness=.14;
 m.warm.emissiveIntensity=.35;m.cyan.emissiveIntensity=.30;
 m.leaf.map=foliage;m.leaf.alphaTest=.42;m.leaf.side=T.DoubleSide;m.leaf.color.set(0x8fa586);m.leaf2.map=foliage;m.leaf2.alphaTest=.42;m.leaf2.side=T.DoubleSide;m.leaf2.color.set(0xb6be90);
 const contact=tex((c,s)=>{const g=c.createRadialGradient(s/2,s/2,2,s/2,s/2,s*.5);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(.55,'rgba(0,0,0,.33)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,s,s);},128);
 m.contact=new T.MeshBasicMaterial({color:0x24343b,map:contact,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
 return textures;
}
// Three intersecting leaf cards per cluster retain gaps and leaf silhouettes.
export function foliageGeometry(){
 const positions=[],uv=[],normals=[];
 for(let k=0;k<3;k++){const a=k*Math.PI/3,c=Math.cos(a)*.5,s=Math.sin(a)*.5;const corners=[[-c,-.5,-s],[c,-.5,s],[c,.5,s],[-c,.5,-s]];for(const j of [0,1,2,0,2,3]){positions.push(...corners[j]);uv.push(...[[0,0],[1,0],[1,1],[0,1]][j]);normals.push(-Math.sin(a),0,Math.cos(a));}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return g;
}
