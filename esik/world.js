import * as T from './vendor/three.module.min.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
export const FOCI={aqueduct:new T.Vector3(-9,14,-6),garden:new T.Vector3(0,6,8),organ:new T.Vector3(17,12,3)};
export const VIEWS={overview:{target:[0,7,0],radius:74,yaw:.65,pitch:.57},aqueduct:{target:[-9,11,-5],radius:45,yaw:.43,pitch:.5},garden:{target:[0,5,7],radius:38,yaw:.2,pitch:.7},organ:{target:[16,10,3],radius:35,yaw:.45,pitch:.43}};
export function createWorld(canvas, rendererOverride=null){
 const renderer=rendererOverride||new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;renderer.outputColorSpace=T.SRGBColorSpace;
 const scene=new T.Scene();scene.background=new T.Color('#71999b');scene.fog=new T.FogExp2('#83a5a0',.0045);
 const camera=new T.PerspectiveCamera(43,1,.15,500);
 const ambient=new T.HemisphereLight('#bfe2df','#594334',2.1);scene.add(ambient);
 const sun=new T.DirectionalLight('#ffe0ac',3.6);sun.position.set(-35,65,25);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-48;sun.shadow.camera.right=48;sun.shadow.camera.top=45;sun.shadow.camera.bottom=-40;sun.shadow.camera.near=1;sun.shadow.camera.far=160;sun.shadow.normalBias=.08;sun.shadow.bias=-.0003;sun.target.position.set(0,4,0);scene.add(sun,sun.target);
 const fill=new T.DirectionalLight('#8fdacf',.9);fill.position.set(30,20,-25);scene.add(fill);
 const lens={position:{value:FOCI.aqueduct.clone()},radius:{value:8.5},strength:{value:0},time:{value:0}};
 const staticGroups=new Map(),animated=[],waterSheets=[],streams=[],flowers=[],flags=[],chimes=[];
 let seed=16723;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const materials=new Map();
 function material(color,era=0,opts={}){
  const key=[color,era,JSON.stringify(opts)].join(':');if(materials.has(key))return materials.get(key);
  const m=new T.MeshStandardMaterial({color,roughness:.85,flatShading:true,...opts});
  if(era){m.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,{uLens:lens.position,uRadius:lens.radius,uStrength:lens.strength,uEra:{value:era}});
    shader.vertexShader='varying vec3 vEraWorld;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvEraWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
    shader.fragmentShader='uniform vec3 uLens;uniform float uRadius;uniform float uStrength;uniform float uEra;varying vec3 vEraWorld;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
     float edge=length(vEraWorld-uLens)-(uRadius*uStrength);
     float grain=sin(vEraWorld.x*21.0+sin(vEraWorld.y*16.0))*sin(vEraWorld.z*19.0)*0.10;
     if(uEra>0.0 && edge+grain>0.0)discard;
     if(uEra<0.0 && edge+grain<0.0)discard;`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>',`#include <dithering_fragment>
     float rim=1.0-smoothstep(0.0,0.26,abs(edge));
     gl_FragColor.rgb+=vec3(0.36,0.66,0.52)*rim*uStrength*0.4;`);
   };m.customProgramCacheKey=()=>`era-${era}`;}
  materials.set(key,m);return m;
 }
 const M={stone:material('#b6a58b'),light:material('#deccb0'),chalk:material('#ddcfb6'),dark:material('#716e60'),rock:material('#8c8c77'),copper:material('#ba8853',0,{metalness:.4,roughness:.45}),patina:material('#54897c',0,{metalness:.25}),wood:material('#6d5140'),leaf:material('#567f65'),leaf2:material('#799669'),shadow:material('#273e3c'),gold:material('#e9c887',0,{metalness:.35})};
 function add(geo,mat,pos=[0,0,0],rot=[0,0,0],scale=[1,1,1],dynamic=false){
  const mesh=new T.Mesh(geo,mat);mesh.position.set(...pos);mesh.rotation.set(...rot);mesh.scale.set(...scale);mesh.castShadow=true;mesh.receiveShadow=true;
  if(dynamic){scene.add(mesh);return mesh;}
  mesh.updateMatrix();const g=(geo.index?geo.toNonIndexed():geo.clone()).applyMatrix4(mesh.matrix);let a=staticGroups.get(mat);if(!a){a=[];staticGroups.set(mat,a)}a.push(g);geo.dispose();return mesh;
 }
 function box(pos,size,mat=M.stone,rot=0,dynamic=false){return add(new T.BoxGeometry(...size),mat,pos,[0,rot,0],[1,1,1],dynamic)}
 function cylinder(pos,top,bottom,height,mat=M.stone,n=12,dynamic=false){return add(new T.CylinderGeometry(top,bottom,height,n),mat,pos,[0,0,0],[1,1,1],dynamic)}
 function ball(pos,scale,mat=M.leaf,detail=1){return add(new T.IcosahedronGeometry(1,detail),mat,pos,[rand(),rand()*6,rand()],[...scale]);}
 function rod(a,b,r,mat=M.copper,dynamic=false){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av);const g=new T.CylinderGeometry(r,r,d.length(),8);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()));return add(g,mat,av.add(bv).multiplyScalar(.5).toArray(),[0,0,0],[1,1,1],dynamic)}
 function ring(pos,r,t,mat=M.copper,rot=[0,0,0],dynamic=false){return add(new T.TorusGeometry(r,t,6,40),mat,pos,rot,[1,1,1],dynamic)}
 function arch(x,y,z,width,height,depth,mat=M.light,era=0){
  const m=era?material(era>0?'#ead7b5':'#9d9e88',era):mat;
  const r=width/2,th=.38;box([x-r-th/2,y+height/2,z],[th,height,depth],m);box([x+r+th/2,y+height/2,z],[th,height,depth],m);
  for(let i=0;i<13;i++){const a=(i+.5)*Math.PI/13;const geo=new T.BoxGeometry(th,.56,depth);add(geo,m,[x+Math.cos(a)*(r+th/2),y+height+Math.sin(a)*(r+th/2),z],[0,0,a],[1,1,1]);}
 }
 function rock(x,y,z,sx,sy,sz,color='#939181',detail=1){const g=new T.IcosahedronGeometry(1,detail);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),yy=p.getY(i),z=p.getZ(i),q=1+.1*Math.sin(x*11+yy*7+z*9);p.setXYZ(i,x*q,yy*q,z*q)}g.computeVertexNormals();return add(g,material(color),[x,y,z],[0,rand()*6.2,0],[sx,sy,sz]);}
 // A sculpted, layered island. Each stratum has a different broken outline.
 function plateau(cx,cz,rx,rz,top,depth,color){
  const n=55,g=new T.BufferGeometry(),pos=[],cols=[],idx=[],c=new T.Color(color);
  for(let ring=0;ring<3;ring++){for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,j=1+.055*Math.sin(i*.8)+.03*Math.sin(i*2.1),f=ring===0?0:ring===1?1:.83;const y=ring<2?top:top-depth;pos.push(cx+Math.cos(a)*rx*j*f,y+(ring===2?Math.sin(a*5)*.8:0),cz+Math.sin(a)*rz*j*f);const cc=c.clone().multiplyScalar(.89+.12*Math.sin(i*.76)+(ring===0?.08:0));cols.push(cc.r,cc.g,cc.b)}}
  for(let r=0;r<2;r++)for(let i=0;i<n;i++){const a=r*(n+1)+i,b=a+n+1;idx.push(a,a+1,b,a+1,b+1,b)}g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(cols,3));g.setIndex(idx);g.computeVertexNormals();add(g,material('#ffffff',0,{vertexColors:true}));
 }
 plateau(0,0,34,24,1,8,'#818b79');plateau(-1,-1,29,20,3.1,4,'#a19a7f');plateau(-2,-2,25,16,6.1,3.3,'#b6ad8b');plateau(-8,-9,21,10,8.6,4,'#a49e81');plateau(-20,-12,11,10,13.2,7,'#aa9b80');plateau(17,-1,9,11,9,5,'#c3b593');
 // Tall weathered tuff formations and a distant valley silhouette.
 for(let i=0;i<15;i++){const x=-32+rand()*67,z=-17-rand()*13,h=9+rand()*17;rock(x,h*.43,z,2+rand()*4,h*.72,3+rand()*3,i%3?'#9c9c86':'#b1ab92',1);rock(x-.4,h*1.08,z,1.5+rand()*2,1.4,2,'#bbb197',0);}
 for(let i=0;i<16;i++){const a=i/16*Math.PI*1.6+Math.PI*.5,r=82+rand()*40;const x=Math.cos(a)*r,z=Math.sin(a)*r-35;rock(x,7,z,14+rand()*16,16+rand()*16,14,'#668b89',0)}
 // Strata seams and ledges across the cliff face.
 for(let i=0;i<90;i++){const a=rand()*Math.PI*2,r=25+rand()*7,x=Math.cos(a)*r,z=Math.sin(a)*r*.67;rock(x,-.5+rand()*4,z,1+rand()*2,1+rand()*3,1.1+rand()*2,i%3?'#999e86':'#798b7a',0)}
 // Upper spring house, roof, carved portal and copper spout.
 box([-25,15.4,-7],[5,4.4,5],M.stone);box([-25,17.9,-7],[5.7,.6,5.5],M.light);cylinder([-25,18.35,-7],2.5,3,.4,M.dark,4);arch(-25,13.2,-4.43,1.8,1.5, .28,M.chalk);box([-25,14.4,-4.25],[1.7,2.4,.1],M.shadow);rod([-23,14.3,-6],[-21,14.3,-6],.3);cylinder([-25,18.9,-7],.1,.22,.9,M.copper);
 // Aqueduct. Its central missing span exists only inside the time lens.
 for(let i=0;i<7;i++){const x=-22+i*4.35,era=(i===2||i===3)?1:0;const mat=era?material('#e4cfaa',1):M.light;arch(x,7.6,-6,3.5,5.2,.95,mat,era);box([x,15.1,-6],[4.4,.42,1.9],mat);box([x,15.62,-6.82],[4.4,.65,.25],mat);box([x,15.62,-5.18],[4.4,.65,.25],mat);if(!era){for(let k=0;k<3;k++)box([x-1.9,8.5+k*1.5,-6],[.8,.08,1.15],M.dark)}}
 for(let i=0;i<19;i++)rock(-15+rand()*11,7.1+rand(),-4+rand()*3,.35+rand()*.5,.3+rand()*.4,.3+rand()*.5,'#c3b99e',0);
 // Time-contrasting plants, mosaics and intact upper parapet.
 for(let i=0;i<9;i++){box([-14+i,16.25,-6.8],[.24,.75,.24],material('#e8d3aa',1));box([-14+i,8,-5.8],[.22,.55,.25],material('#79826e',-1));}
 ring([-25,15.9,-4.08],.43,.065,M.copper);rod([-25.42,15.9,-4.03],[-24.58,15.9,-4.03],.055);rod([-25,15.48,-4.03],[-25,16.32,-4.03],.055);
 // Lower receiving cistern and a large moving waterwheel.
 const basinCenter=[6,8.7,-5.8];
 function pool(x,y,z,w,d){box([x,y-.9,z],[w,.3,d],M.dark);box([x,y,z-d/2],[w+.6,1.25,.45],M.light);box([x,y,z+d/2],[w+.6,1.25,.45],M.light);box([x-w/2,y,z],[.45,1.25,d],M.light);box([x+w/2,y,z],[.45,1.25,d],M.light);}
 pool(...basinCenter,5.2,4.4);arch(6,6.1,-3.4,2.1,1,.5,M.light);
 const wheel=new T.Group();wheel.position.set(8.9,8.3,-3.3);scene.add(wheel);
 function wheelPart(g,m,p=[0,0,0],r=[0,0,0]){const o=new T.Mesh(g,m);o.position.set(...p);o.rotation.set(...r);o.castShadow=true;wheel.add(o);return o;}
 for(const z of [-.36,.36]){wheelPart(new T.TorusGeometry(2.4,.17,7,36),M.wood,[0,0,z]);wheelPart(new T.TorusGeometry(2.04,.08,6,36),M.copper,[0,0,z]);}
 for(let i=0;i<14;i++){const a=i/14*Math.PI*2;wheelPart(new T.BoxGeometry(.33,.75,1),M.wood,[Math.cos(a)*2.3,Math.sin(a)*2.3,0],[0,0,a]);wheelPart(new T.BoxGeometry(4.5,.09,.12),M.copper,[0,0,0],[0,0,a]);}wheelPart(new T.CylinderGeometry(.23,.23,1.8,10),M.copper,[0,0,0],[Math.PI/2,0,0]);
 // A raised gate whose counterweight is powered by the reservoir.
 arch(4,6.2,.5,3.3,2.9,.8);const gate=box([4,8,.5],[3.05,3.4,.3],M.wood,0,true);for(let i=0;i<8;i++)box([2.65+i*.39,8.1,.71],[.1,3.5,.1],M.copper);rod([2,11.3,.5],[6,11.3,.5],.12);ball([6.25,10.4,.6],[.6,.85,.6],M.dark);
 // Winding stairs carved into the terraces.
 function stairs(a,b,n,width){for(let i=0;i<n;i++){const t=i/n,x=T.MathUtils.lerp(a[0],b[0],t),y=T.MathUtils.lerp(a[1],b[1],t),z=T.MathUtils.lerp(a[2],b[2],t);box([x,y-.15,z],[width,.3,Math.hypot(b[0]-a[0],b[2]-a[2])/n+.1],i%4===0?M.light:M.stone,Math.atan2(b[0]-a[0],b[2]-a[2]))}}
 stairs([-17,6.3,8],[-17,9,-1],14,2.4);stairs([12,6.4,10],[16,9.25,6],12,2.2);stairs([-21,9,-10],[-25,13.35,-11],16,1.9);stairs([5,3.3,17],[4,6.3,10],14,2.5);
 // Two garden pools, a diverting sluice and old colonnades.
 pool(-5,6.35,9,6,4.5);pool(3,6.35,9,6,4.5);box([-1,6.7,5.2],[2.4,.5,2],M.light);const sluice=box([-1,7.1,5.2],[1.6,.35,.3],M.copper,0,true);
 for(const x of [-9,7]){for(let i=0;i<4;i++){const z=4+i*2.8;const h=i%3===0?3.4:2.3;cylinder([x,6.1+h/2,z],.25,.34,h);cylinder([x,6.1+h,z],.53,.45,.28,M.light);cylinder([x,6.25,z],.54,.55,.32,M.dark);}}
 for(let i=0;i<20;i++){const x=-8+rand()*14,z=6.5+rand()*6.5;box([x,6.17,z],[.4+rand()*.4,.08,.45],i%2?M.dark:M.light,rand()*2);}
 // Past garden arches and patterns reveal the three-note code.
 for(let i=0;i<3;i++){arch(-5+i*4,6.2,4,2.1,2,.4,M.chalk,1);for(let j=0;j<[1,3,2][i];j++)cylinder([-5+i*4+(j-([1,3,2][i]-1)/2)*.5,8,4.26],.14,.14,.055,material('#2b807c',1),12);}
 // Grove: irregular trunks, soft olive crowns, scattered plants and flowers.
 function tree(x,y,z,s=1){rod([x,y,z],[x+.2*s,y+3.2*s,z],.16*s,M.wood);rod([x,y+1.8*s,z],[x-1.2*s,y+3.1*s,z+.2],.09*s,M.wood);for(let i=0;i<4;i++)ball([x+(rand()-.5)*2*s,y+(3+rand())*s,z+(rand()-.5)*1.8*s],[(.9+rand()*.5)*s,(.6+rand()*.4)*s,(.8+rand()*.5)*s],i%2?M.leaf:M.leaf2);}
 for(const [x,y,z,s] of [[-19,6,6,1.2],[-12,6,12,1.3],[-11,6,5,.85],[-22,8.6,-3,1.1],[-16,8.6,-11,1.2],[11,6,11,.9],[10,3,17,1.2],[-16,3,17,1.1],[23,9,5,.8],[23,6,12,.9],[-29,3,0,1.4],[-4,8.6,-14,.8],[25,3,-7,1.2]])tree(x,y,z,s);
 for(let i=0;i<85;i++){const a=rand()*Math.PI*2,r=20+rand()*7,x=Math.cos(a)*r,z=Math.sin(a)*r*.65;if(z<-10)continue;ball([x,3.4,z],[.3+rand()*.5,.35+rand()*.4,.3+rand()*.5],M.leaf,0);}
 for(let i=0;i<90;i++){const side=i%2,x=(side?3:-5)+(rand()-.5)*5,z=9+(rand()-.5)*3.5,y=6.4;const stem=rod([x,y,z],[x,y+.5+rand()*.6,z],.025,M.leaf,true);const flower=add(new T.IcosahedronGeometry(.11,0),material(i%4?'#d7b56c':'#daa49b'),[x,y+.75,z],[0,0,0],[1,1,1],true);flowers.push({stem,flower,side,base:y,phase:rand()*6});}
 // Temple of water: vaulted facade, domed roof and three ranks of bronze pipes.
 box([18,10.4,1],[10,2.8,8],M.stone);box([18,12,1],[10.8,.5,8.6],M.light);
 for(const x of [13.6,22.4])for(const z of [-2.3,4.3]){cylinder([x,14.4,z],.4,.48,4.5,M.chalk);cylinder([x,12.3,z],.65,.65,.35,M.light);cylinder([x,16.65,z],.6,.55,.35,M.light);}
 box([18,16.9,1],[10.4,.65,8],M.light);arch(18,12.15,4.8,4.2,1.5,.6,M.chalk);
 const domeGeo=new T.SphereGeometry(4.7,24,12,0,Math.PI*2,0,Math.PI/2);add(domeGeo,material('#779c8b',0,{metalness:.3,roughness:.6}),[18,17.2,1],[0,0,0],[1,.68,.83]);
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const pts=[];for(let j=0;j<=16;j++){const q=j/16*Math.PI/2;pts.push(new T.Vector3(18+Math.cos(a)*Math.sin(q)*4.75,17.25+Math.cos(q)*3.2,1+Math.sin(a)*Math.sin(q)*3.96));}add(new T.TubeGeometry(new T.CatmullRomCurve3(pts),18,.035,4,false),M.copper);}
 cylinder([18,20.7,1],.09,.18,1,M.gold);ring([18,21.4,1],.4,.065,M.gold);
 box([18,13.6,-2.55],[8.4,3.2,.4],M.shadow);box([18,13.65,4.95],[7.6,2.7,.22],M.dark);
 const pipes=[];
 for(let i=0;i<9;i++){const x=14.6+i*.85,h=2.6+Math.sin((i+1)/10*Math.PI)*2.7,broken=i===3||i===4||i===5;const mat=broken?material('#a2784c',1,{metalness:.45,roughness:.4}):M.copper;
 cylinder([x,12.5+h/2,4.4],.25,.25,h,mat,12);ring([x,12.7+h,4.4],.29,.065,mat,[Math.PI/2,0,0]);box([x,13.25,4.7],[.19,.38,.05],M.shadow);
 if(broken)cylinder([x,12.85,4.4],.25,.25,.7,material('#51786b',-1,{metalness:.3}),12);
 pipes.push({x,h});}
 for(let i=0;i<3;i++){const x=15.5+i*2.5;ring([x,11.4,5.18],.45,.08,M.copper);for(let j=0;j<5;j++){const a=j/5*Math.PI*2;ball([x+Math.sin(a)*.33,11.4+Math.cos(a)*.33,5.21],[.06,.06,.05],M.gold,0);}}
 // Ceramic jars, dry vines, benches, balconies and woven cloth.
 function jar(x,y,z,s=1){cylinder([x,y+.5*s,z],.32*s,.26*s,1*s,material('#ae7052'),10);cylinder([x,y+1.05*s,z],.22*s,.28*s,.15*s,M.light,10);}
 for(const [x,y,z] of [[-23,13.2,-4],[-18,8.6,-8],[8,6.1,5],[11,6.1,8],[22,9,7],[-12,6.1,9],[-6,6.1,4]])jar(x,y,z,.6+rand()*.4);
 for(const [x,y,z] of [[-15,6.4,9],[9,6.5,8],[21,9.3,6]]){box([x,y+.7,z],[2.5,.18,.65],M.wood);box([x-.9,y+.3,z],[.15,.8,.4],M.dark);box([x+.9,y+.3,z],[.15,.8,.4],M.dark);}
 function flag(x,y,z,w,h,era=0){rod([x,y,z],[x,y+h+1,z],.045);rod([x,y+h+.7,z],[x+w,y+h+.7,z],.04);const g=new T.PlaneGeometry(w,h,12,8);g.translate(w/2,-h/2,0);const mat=material(era?'#4d9185':'#b29265',era,{side:T.DoubleSide,roughness:1});const m=add(g,mat,[x,y+h+.65,z],[0,0,0],[1,1,1],true);m.castShadow=false;flags.push({m,base:new Float32Array(m.geometry.attributes.position.array),phase:rand()*6,h});}
 flag(-23,17.8,-6,1.25,3);flag(12.7,16.8,3.6,1.4,3.7);flag(-6,9.2,4,1.4,2,1);
 // Broken masonry, irregular paving and small dwellings give the place a human scale.
 function hut(x,y,z,w,d,h){
  box([x,y+h/2,z],[w,h,d],M.stone);box([x,y+h+.12,z],[w+.35,.24,d+.35],M.light);
  arch(x,y,z+d/2+.02,Math.min(1.3,w*.3),h*.42,.15,M.chalk);box([x,y+h*.4,z+d/2+.025],[Math.min(1.2,w*.29),h*.8,.08],M.shadow);
  box([x+w*.3,y+h*.65,z+d/2+.08],[.55,.8,.1],M.shadow);box([x+w*.3,y+h*.4,z+d/2+.18],[.8,.13,.3],M.light);
  for(let i=0;i<4;i++)box([x-w*.4+i*w*.26,y+h+.38,z+d/2],[.24,.5,.27],M.light);
 }
 hut(-13,6.1,1,4,3.2,3.7);hut(-21,8.6,-.5,4.5,3.7,4.1);hut(-9,8.6,-12,3.8,3.6,3.4);
 for(let i=0;i<8;i++){const x=-18+i*1.6;box([x,6.3,1.8],[1.3,.18,1.1],i%3?M.stone:M.light,rand()*.18);}
 for(let i=0;i<75;i++){const t=rand(),x=-17+t*32,z=13+Math.sin(t*6)*1.1;box([x,6.16,z],[.35+rand()*.55,.06,.35+rand()*.5],i%3?M.stone:M.light,rand()*3);}
 for(let i=0;i<38;i++){const x=-18+rand()*24,z=rand()<.5?14:3.3;rod([x,6.2,z],[x+.12,6.6+rand()*.35,z],.025,M.leaf);}
 for(let i=0;i<65;i++){const x=-12+rand()*20,z=3.3+rand()*12;if(z>5.5&&z<11.8&&x>-9&&x<7)continue;const y=6.15;
  ball([x,y+.12,z],[.16+rand()*.2,.12+rand()*.12,.15+rand()*.2],i%3?M.leaf:M.leaf2,0);
 }
 for(let i=0;i<38;i++){const z=-3+rand()*10,x=24+rand()*1.3;ball([x,9-rand()*4,z],[.17,.3+rand()*.4,.22],M.leaf,0);}
 for(let i=0;i<3;i++){const x=-5+i*4;box([x,8.1,3.95],[1.9,1.1,.18],material('#ddc18e',1));for(let j=0;j<[1,3,2][i];j++)ball([x+(j-([1,3,2][i]-1)/2)*.45,8.1,4.1],[.13,.13,.04],material('#226c66',1),1);}
 // Gentle pools and a wide river carry a living surface shader.
 const waterUniforms={uTime:{value:0},uLight:{value:0}};
 function waterMat(alpha=1){return new T.ShaderMaterial({transparent:alpha<1,depthWrite:alpha>=1,side:T.DoubleSide,uniforms:{...waterUniforms,uAlpha:{value:alpha}},vertexShader:`varying vec3 vW; varying vec2 vUv;uniform float uTime;void main(){vUv=uv;vec3 p=position;p.z+=sin(p.x*.7+uTime)*cos(p.y*.4+uTime*.6)*.025;vec4 w=modelMatrix*vec4(p,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,fragmentShader:`uniform float uTime;uniform float uAlpha;uniform float uLight;varying vec3 vW;varying vec2 vUv;void main(){float r=sin(vW.x*.65+uTime*.9)*sin(vW.z*.83-uTime*.66);float l=pow(max(0.,sin(vW.x*1.3+vW.z*.8+uTime)),18.);float c=sin(vW.x*2.5+cos(vW.z*2.1)+uTime*.5)*sin(vW.z*2.2+sin(vW.x*1.7)-uTime*.5);vec3 col=mix(vec3(.035,.22,.23),vec3(.19,.48,.43),.48+r*.16);col+=l*vec3(.16,.21,.14)+smoothstep(.55,.95,c)*.06;col+=uLight*vec3(.03,.035,.0);gl_FragColor=vec4(col,uAlpha);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`});}
 const waterMaterial=waterMat();const sea=add(new T.PlaneGeometry(800,800,80,80),waterMaterial,[0,-1.3,0],[-Math.PI/2,0,0],[1,1,1],true);sea.receiveShadow=false;
 function waterPlane(x,y,z,w,d){const m=add(new T.PlaneGeometry(w,d,3,3),waterMat(.88),[x,y,z],[-Math.PI/2,0,0],[1,1,1],true);m.castShadow=false;return m;}
 const basinWater=waterPlane(6,8.6,-5.8,4.7,3.9),leftWater=waterPlane(-5,6.2,9,5.5,4),rightWater=waterPlane(3,6.2,9,5.5,4);
 // Flow ribbons follow real connected channels; their visibility is driven by the simulation.
 function stream(points,width,kind){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const g=new T.TubeGeometry(curve,Math.max(10,points.length*8),width,5,false);const m=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:waterUniforms.uTime,uFlow:{value:0},uTint:{value:new T.Color('#8fe4c6')}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float uTime;uniform float uFlow;uniform vec3 uTint;varying vec2 vUv;void main(){float streak=pow(max(0.,sin(vUv.x*100.-uTime*8.)),10.);float bands=sin(vUv.y*18.+vUv.x*8.)*.12;gl_FragColor=vec4(uTint*(.55+streak*.4+bands),uFlow*(.52+streak*.3));\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}'});const mesh=add(g,m,[0,0,0],[0,0,0],[1,1,1],true);mesh.castShadow=false;mesh.frustumCulled=false;streams.push({mesh,kind,curve});return mesh;}
 stream([[-24,15.39,-6],[-18,15.39,-6],[-14,15.39,-6]],.17,'source');stream([[-14,15.39,-6],[-9,15.39,-6],[-4,15.39,-6],[5,15.39,-6],[6,14.2,-6],[6,9,-6]],.2,'intake');
 stream([[-14,15.4,-6],[-13.8,12,-5.8],[-14,8.9,-5.6],[-13.2,7,-4]],.15,'spill');
 stream([[6,8.75,-3.8],[5.9,8.7,-1],[4.1,7.3,1.5],[-1,6.6,5.2]],.16,'wheel');stream([[-1,6.6,5.2],[-5,6.5,5.5],[-5,6.5,7.5]],.12,'left');stream([[-1,6.6,5.2],[3,6.5,5.5],[3,6.5,7.5]],.12,'right');
 // Stone beds under the small irrigation streams.
 for(const [a,b] of [[[6,8.5,-3.8],[6,8.5,-1]],[[5.9,7.3,-1],[-1,6.3,5.2]],[[-1,6.2,5.2],[-5,6.2,5.5]],[[-1,6.2,5.2],[3,6.2,5.5]]]){rod(a,b,.24,M.dark);}
 stream([[-5,6.5,11],[-5,6,13],[-5,3.5,15],[-2,3.4,18],[0,.1,23]],.2,'finale');stream([[3,6.5,11],[3,6,13],[5,3.5,16],[10,3.5,19],[13,-.7,22]],.2,'finale');stream([[18,10.5,6],[18,9,8],[17,6.5,11],[16,3,17],[20,-.6,21]],.24,'finale');
 // Water drops, drifting seed dust and a flock of distant swallows.
 const pCount=150,pos=new Float32Array(pCount*3),phase=new Float32Array(pCount),sizes=new Float32Array(pCount);for(let i=0;i<pCount;i++){pos[i*3]=(rand()-.5)*66;pos[i*3+1]=4+rand()*22;pos[i*3+2]=(rand()-.5)*44;phase[i]=rand()*6;sizes[i]=rand();}
 const pg=new T.BufferGeometry();pg.setAttribute('position',new T.BufferAttribute(pos,3));pg.setAttribute('phase',new T.BufferAttribute(phase,1));
 const particles=new T.Points(pg,new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:waterUniforms.uTime},vertexShader:'uniform float uTime;attribute float phase;varying float vAlpha;void main(){vec3 p=position;p.x+=sin(uTime*.12+phase)*1.1;p.y+=sin(uTime*.2+phase)*.8;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(90./-mv.z,1.,3.);vAlpha=.2+.4*pow(sin(phase+uTime*.3),2.);}',fragmentShader:'varying float vAlpha;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(.96,.87,.65,vAlpha*(1.-d*2.));}'}));scene.add(particles);
 const birds=[];for(let i=0;i<10;i++){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-.65,0,0,0,.08,.18,0,0,-.12,0,.08,.18,.65,0,0,0,0,-.12],3));const mesh=new T.Mesh(g,new T.MeshBasicMaterial({color:'#263f40',side:T.DoubleSide}));scene.add(mesh);birds.push({mesh,phase:i*.6,r:20+rand()*10});}
 // The lens is a real world-space sphere. Its rings are an interactive handle.
 const lensRing=ring(lens.position.value.toArray(),8.5,.035,new T.MeshBasicMaterial({color:'#f5d6a1',transparent:true,opacity:.75,depthWrite:false}),[Math.PI/2,0,0],true);lensRing.castShadow=false;
 const lensSphere=new T.Mesh(new T.SphereGeometry(8.5,40,28),new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.FrontSide,uniforms:{uOpacity:{value:0},uTime:waterUniforms.uTime},vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',fragmentShader:'uniform float uOpacity;uniform float uTime;varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.-abs(dot(normalize(vN),normalize(vV))),3.8);gl_FragColor=vec4(.59,.89,.74,(f*.28+.012)*uOpacity);}'}));scene.add(lensSphere);
 // Merge the static masonry by material to keep the draw count bounded.
 for(const [mat,geos] of staticGroups){const merged=mergeGeometries(geos,false);if(!merged)throw new Error('Geometri birleştirilemedi');const mesh=new T.Mesh(merged,mat);mesh.castShadow=!mat.customProgramCacheKey().startsWith('era');mesh.receiveShadow=true;scene.add(mesh);geos.forEach(g=>g.dispose());}
 const vec=new T.Vector3();let width=1,height=1,lensTarget=0,low=false,frames=0,lastStat=performance.now(),fps=0;
 function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(width===w&&height===h)return;width=w;height=h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
 function quality(value){low=value==='low'||(value==='auto'&&matchMedia('(max-width:650px)').matches);renderer.setPixelRatio(low?Math.min(devicePixelRatio,1.15):Math.min(devicePixelRatio,1.75));renderer.shadowMap.enabled=!low;resize();renderer.setSize(width,height,false);}
 function setCamera(view){const t=new T.Vector3(...view.target);camera.position.set(t.x+Math.sin(view.yaw)*Math.cos(view.pitch)*view.radius,t.y+Math.sin(view.pitch)*view.radius,t.z+Math.cos(view.yaw)*Math.cos(view.pitch)*view.radius);camera.lookAt(t);camera.updateMatrixWorld();}
 function project(p){vec.copy(p).project(camera);return {x:(vec.x*.5+.5)*width,y:(-.5*vec.y+.5)*height,visible:vec.z>-1&&vec.z<1&&Math.abs(vec.x)<1.15&&Math.abs(vec.y)<1.15};}
 function dragLens(x,y,area){const ndc=new T.Vector2(x/width*2-1,-y/height*2+1);const ray=new T.Raycaster();ray.setFromCamera(ndc,camera);const plane=new T.Plane(new T.Vector3(0,1,0),-FOCI[area].y),hit=new T.Vector3();if(ray.ray.intersectPlane(plane,hit)){const focus=FOCI[area],offset=hit.sub(focus);if(offset.length()>12)offset.setLength(12);lens.position.value.copy(focus).add(offset);}}
 function focusLens(area){lens.position.value.copy(FOCI[area]);}
 function coverage(area){const d=lens.position.value.distanceTo(FOCI[area]);return Math.max(0,1-d/9);}
 function update(dt,time,s,flow,reduced=false){
  resize();waterUniforms.uTime.value=time;waterUniforms.uLight.value=s.finished?1:0;lens.time.value=time;lensTarget=s.lens?1:0;lens.strength.value=T.MathUtils.damp(lens.strength.value,lensTarget,5,dt);lensRing.visible=lensSphere.visible=lens.strength.value>.015;lensRing.position.copy(lens.position.value);lensSphere.position.copy(lens.position.value);lensRing.scale.setScalar(lens.strength.value);lensSphere.scale.setScalar(lens.strength.value);lensSphere.material.uniforms.uOpacity.value=lens.strength.value;
  wheel.rotation.z-=flow.wheel*dt*.55;gate.position.y=T.MathUtils.damp(gate.position.y,s.gate?11.5:8,1.3,dt);sluice.rotation.y=T.MathUtils.damp(sluice.rotation.y,[.5,-.5,0][s.distributor],5,dt);
  basinWater.position.y=8.03+s.basin*.75;basinWater.visible=s.basin>.008;leftWater.position.y=5.8+s.left*.65;rightWater.position.y=5.8+s.right*.65;leftWater.visible=s.left>.01;rightWater.visible=s.right>.01;
  for(const st of streams){let value=st.kind==='source'?+s.sourceOpen:st.kind==='spill'?s.sourceOpen*(1-flow.intake):st.kind==='left'?Math.min(1,flow.left*45):st.kind==='right'?Math.min(1,flow.right*45):st.kind==='finale'?Math.min(1,s.finaleTime/6):flow[st.kind]||0;st.mesh.material.uniforms.uFlow.value=T.MathUtils.damp(st.mesh.material.uniforms.uFlow.value,value,3,dt);st.mesh.visible=st.mesh.material.uniforms.uFlow.value>.01;}
  for(const f of flowers){const a=f.side?s.right:s.left,h=.15+a*.85;f.stem.scale.y=h;f.stem.position.y=f.base+(f.stem.geometry.parameters.height||.6)*h/2;f.flower.position.y=f.base+.7*h;f.flower.scale.setScalar(.15+a*.85);if(!reduced)f.flower.rotation.y=time*.3+f.phase;}
  if(!reduced){for(const f of flags){const p=f.m.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=f.base[i*3],y=f.base[i*3+1];p.setZ(i,Math.sin(x*2.3+time*2+f.phase+y*.5)*.2*(-y/f.h+.2));}p.needsUpdate=true;f.m.geometry.computeVertexNormals();}
   for(const b of birds){const a=time*.045+b.phase;b.mesh.position.set(Math.cos(a)*b.r,26+Math.sin(a*2+b.phase)*3,Math.sin(a)*b.r-10);b.mesh.rotation.y=-a;b.mesh.scale.y=.4+Math.sin(time*4+b.phase)*.5;}}
  sun.intensity=T.MathUtils.damp(sun.intensity,s.finished?4.1:3.6,.15,dt);
  renderer.render(scene,camera);frames++;const now=performance.now();if(now-lastStat>1500){fps=frames*1000/(now-lastStat);frames=0;lastStat=now;}
 }
 quality('auto');resize();
 return {renderer,scene,camera,lens,update,setCamera,project,focusLens,dragLens,coverage,quality,stats:()=>({fps:Math.round(fps),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,quality:low?'Hafif':'Yüksek'}),dispose:()=>{renderer.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material){const a=Array.isArray(o.material)?o.material:[o.material];a.forEach(m=>m.dispose())}});}};
}
