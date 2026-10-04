import {writeFile} from 'node:fs/promises';
import * as T from '../YorktownPreview/three.module.js';
import {BRANCHES} from '../SimCity/branches.mjs';
import {branchBuilding} from '../SimCity/branch-architecture.mjs';
import {distantBuilding} from '../SimCity/render-plan.mjs';
import {architecturalShapes} from '../SimCity/architecture-shapes.mjs';
import {commercialShapes} from '../SimCity/commercial-shapes.mjs';
import {residentialShapes} from '../SimCity/residential-shapes.mjs';
import {industrialShapes} from '../SimCity/industrial-shapes.mjs';
import {foliageGeometry} from '../SimCity/evolution-materials.mjs';
const shapes={...architecturalShapes(),...commercialShapes(),...residentialShapes(),...industrialShapes(),box:new T.BoxGeometry(),cylinder:new T.CylinderGeometry(.5,.5,1,24),foliage:foliageGeometry()};
const report={release:'11.2.0',scope:'Actual shared geometry; maximum per prototype across levels 5-8 and all nine shipyard work states. Submitted triangles, not measured GPU time.',branches:{}};
for(const [type,defs]of Object.entries(BRANCHES))for(const branch of Object.keys(defs)){
 const v={};for(const [label,detail]of [['fine',2],['medium',1],['distant',0]]){
  let triangles=0,pieces=0;for(let level=5;level<=8;level++)for(let work=0;work<9;work++){
   const c={type,branch,level,span:4,age:work*8},parts=[],add=(...p)=>parts.push(p);
   detail===0?distantBuilding({x:0,y:0,c,add}):branchBuilding({x:0,y:0,c,far:detail===1,add});
   triangles=Math.max(triangles,parts.reduce((sum,p)=>sum+(shapes[p[7]||'box'].index?.count||shapes[p[7]||'box'].attributes.position.count)/3,0));pieces=Math.max(pieces,parts.length);
  }v[label]={triangles,pieces};
 }report.branches[branch]=v;console.log(branch,JSON.stringify(v));
}
await writeFile('checks/branch-geometry-report.json',JSON.stringify(report,null,2)+'\n');
