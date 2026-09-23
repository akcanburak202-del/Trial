// A deterministic landscape. All decoration shares one instanced cube draw call.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const hash=(x,z)=>{let n=(Math.imul(x|0,374761393)+Math.imul(z|0,668265263))|0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295};
const smooth=t=>t*t*(3-2*t);
function noise(x,z){const a=Math.floor(x),b=Math.floor(z),u=smooth(x-a),v=smooth(z-b);return mix(mix(hash(a,b),hash(a+1,b),u),mix(hash(a,b+1),hash(a+1,b+1),u),v)}
const rgb=(hex)=>{const n=parseInt(hex.replace('#',''),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]};
const color=(hex,f=1)=>rgb(hex).map(n=>clamp(n*f,0,1));
const C={grass:'#6e956b',moss:'#52795c',meadow:'#89a679',sand:'#d1b58a',soil:'#776956',stone:'#6e7a7b',cliff:'#798589',wood:'#835d41',trim:'#4a3733',cream:'#d5c4a3',roof:'#3b5c65',glass:'#6a99a0',light:'#ffd48c',water:'#5cc7ca',pine:'#315f55',pineLit:'#47796a',leaf:'#628e69',flower:'#efb479',flower2:'#b3a4dc'};
class Mesh {
 constructor(){this.positions=[];this.normals=[];this.colors=[];this.indices=[]}
 quad(verts,normal,tint){const start=this.positions.length/3;for(const v of verts){this.positions.push(...v);this.normals.push(...normal);this.colors.push(...tint)}this.indices.push(start,start+1,start+2,start,start+2,start+3)}
 arrays(){return {positions:new Float32Array(this.positions),normals:new Float32Array(this.normals),colors:new Float32Array(this.colors),indices:new Uint32Array(this.indices)}}
}
export function heightAt(x,z){
 const r=Math.hypot((x+2)/39,(z-2)/35),ruffled=r*(.93+noise(x*.1,z*.1)*.14);
 if(ruffled>1)return 1;
 let h=2+Math.floor(10.7*(1-ruffled)+4.8*Math.exp(-((x+25)**2+(z+20)**2)/520)+2.2*(noise(x*.105,z*.105)-.35)+1.7*(noise(x*.26,z*.26)-.5)+7*Math.exp(-((x-20)**2+(z-8)**2)/88));
 const d=Math.hypot(x+9,z+5),flatten=clamp((12.3-d)/4.4,0,1);
 h=Math.round(mix(h,12,flatten));return Math.max(3,h);
}
export function buildWorld(seed=2026){
 let state=seed>>>0;const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
 const mesh=new Mesh(),boxes=[];
 const box=(x,y,z,sx,sy,sz,hex,glow=0,sway=0)=>{boxes.push(x,y,z,sx,sy,sz,...color(hex),glow,sway)};
 const min=-39,max=39;
 for(let z=min;z<max;z++)for(let x=min;x<max;x++){
  const h=heightAt(x,z);if(h<=2)continue;
  const n=noise(x*.55,z*.55),shore=h<=4;
  const top=color(shore?C.sand:n>.66?C.meadow:n<.24?C.moss:C.grass,.88+n*.19);
  mesh.quad([[x,h,z],[x,h,z+1],[x+1,h,z+1],[x+1,h,z]],[0,1,0],top);
  for(const [dx,dz,normal] of [[-1,0,[-1,0,0]],[1,0,[1,0,0]],[0,-1,[0,0,-1]],[0,1,[0,0,1]]]){
   const nh=heightAt(x+dx,z+dz);if(nh>=h)continue;
   for(let y=nh;y<h;y++){
    const hex=y>h-2?shore?C.sand:C.soil:y<5?C.cliff:C.stone;
    const tint=color(hex,.75+noise(x*.73+y,z*.71)*.22);
    if(dx===-1)mesh.quad([[x,y,z],[x,y+1,z],[x,y+1,z+1],[x,y,z+1]],normal,tint);
    if(dx===1)mesh.quad([[x+1,y,z+1],[x+1,y+1,z+1],[x+1,y+1,z],[x+1,y,z]],normal,tint);
    if(dz===-1)mesh.quad([[x+1,y,z],[x+1,y+1,z],[x,y+1,z],[x,y,z]],normal,tint);
    if(dz===1)mesh.quad([[x,y,z+1],[x,y+1,z+1],[x+1,y+1,z+1],[x+1,y,z+1]],normal,tint);
   }
  }
 }
 // A stone foundation and a small, deliberately modern timber home.
 const cx=-9,cz=-5,Y=12;
 box(cx,Y+.29,cz,14,.58,11,'#9a9a87');
 box(cx,Y+3.3,cz,11,6.1,9,C.cream);
 box(cx,Y+6.15,cz,11,.25,9,C.wood);
 for(const x of [-14.35,-3.65]){box(x,Y+3.35,cz,.38,6.5,9.4,C.trim);for(const z of [-9.35,-.65])box(x,Y+3.35,z,.53,6.7,.55,C.wood)}
 for(const z of [-9.45,-.55]){box(cx,Y+3.38,z,11.1,.23,.38,C.wood);box(cx,Y+6.2,z,11.7,.37,.53,C.wood)}
 // Gable roof: staggered slate tiles and a dark exposed ridge.
 for(let k=-7;k<=7;k++){
  const x=cx+k,y=Y+9.1-Math.abs(k)*.46;
  box(x,y,cz,1.13,.46,11.35,k%3===0?'#4d7176':k%2?'#42636b':'#36565e');
  if(k%3===0)box(x,y+.26,cz,1.05,.08,11.3,'#6c8582');
 }
 box(cx,Y+9.38,cz,.64,.26,11.5,'#273f4a');
 // Front windows, asymmetric entrance and thin frames.
 for(const [x,w] of [[-12.25,2.6],[-5.85,2.2]]){
  box(x,Y+4.2,-.37,w,3.55,.16,C.glass,.55);
  box(x,Y+4.2,-.25,.12,3.65,.26,C.wood);box(x,Y+6.03,-.25,w+.3,.16,.27,C.wood);box(x,Y+2.38,-.25,w+.3,.17,.27,C.wood);
 }
 box(-9,Y+3.85,-.32,1.78,4.25,.22,'#493b34');box(-9,Y+5.1,-.18,1.18,1.45,.11,C.glass,.65);
 box(-8.3,Y+3.05,-.13,.12,.13,.18,C.light,1);
 // Side glazing creates reflections when the camera orbits.
 for(const z of [-7.6,-3.2]){
  box(-3.41,Y+4.42,z,.16,2.65,2.25,C.glass,.4);
  box(-3.29,Y+4.42,z,.25,2.82,.13,C.wood);
  for(const dy of [3.05,5.83])box(-3.29,Y+dy,z,.25,.12,2.43,C.wood);
 }
 // Chimney, skylight, rain pipe, and the occasional roof imperfection.
 box(-12.8,Y+10.9,-7.6,1.25,4.4,1.35,'#85756b');box(-12.8,Y+13.25,-7.6,1.62,.32,1.62,'#ab9c82');
 box(-4.2,Y+7.18,-6.6,1.65,.13,2.65,'#8fb8b1',.32);box(-4.2,Y+7.27,-6.6,1.82,.09,.12,'#2d454d');
 box(-3.12,Y+3.1,-8.6,.15,5.7,.15,'#7a8584');
 // Warm wooden deck, railing, stair treads and two lanterns.
 for(let x=-15.1;x<=-2.8;x+=.73)box(x,Y+.53,3.14,.58,.21,6.6,x%2<1?'#9c704e':'#ad8059');
 for(const x of [-14.8,-10.5,-6,-2.8]){box(x,Y+1.42,6.3,.17,1.6,.2,C.wood);box(x,Y+.37,6.3,.3,.26,.3,'#65564c')}
 for(const y of [Y+1.05,Y+2.15])box(cx,Y+(y-Y),6.32,12.1,.11,.15,C.wood);
 for(let j=0;j<6;j++)box(-9,Y+.34-j*.22,7.0+j*.78,2.6,.22,.7,'#a68560');
 for(const x of [-13.7,-4.2]){box(x,Y+3.7,6.3,.12,.65,.1,'#372c2e');box(x,Y+3.28,6.32,.36,.39,.28,C.light,1.1)}
 // A crooked stepping-stone path with tiny grasses growing through it.
 for(let j=0;j<23;j++){
  const z=11+j*.86,x=-9+2.2*Math.sin(j*.32),h=heightAt(x,z);
  if(h<=2)break;
  box(x,h+.08,z,1.4,.14,.65,j%4?'#b8aa8b':'#cfbea0');
 }
 // A freestanding boathouse ladder and a tiny canoe near the shallow cove.
 for(const z of [27.2,28.5,29.8])box(15,3.05,z,5,.23,.75,C.wood);
 for(const x of [12.7,17.3])for(const z of [27,30])box(x,2.5,z,.33,2,.32,C.wood);
 box(22,3.1,28,4.4,.37,1.8,'#84604b');box(22,3.65,27.2,4.2,.7,.24,'#a77850');box(22,3.65,28.8,4.2,.7,.24,'#a77850');
 // A broken ribbon of falling water along the island's eastern cliff.
 const fallTop=heightAt(22,8);
 for(let x=15;x<23;x+=.75)box(x,heightAt(x,8)+.12,8,1,.17,2.1,'#65bfc1',.18);
 for(let y=3;y<fallTop;y+=.65){let outer=18;while(outer<37&&heightAt(outer,8)>=y)outer+=.5;for(const dz of [-.65,0,.65])box(outer+.22+Math.sin(y*1.2)*.13,y,8+dz,.53,.78,.6,(y|0)%3===0?'#a4e5d9':'#67c9cd',.3)}
 for(let j=0;j<28;j++)box(29+(rand()-.5)*8,3.2+rand()*1.6,8+(rand()-.5)*5,.13,.11,.15,'#b1e8db',.35,1);
 // Wild forest: irregular trees, shrubs, stones and flowers.
 function pine(x,z,y,t){const trunk=2.6*t;box(x,y+trunk/2,z,.55*t,trunk,.57*t,'#5a4a38');for(let layer=0;layer<3;layer++){
   const size=(3.8-layer*.85)*t,cy=y+trunk+(layer*1.06+.4)*t;
   box(x,cy,z,size,1.13*t,size,layer===1?C.pineLit:C.pine,0,1);
   box(x-size*.4,cy-.1*t,z+.32*t,.84*t,.7*t,.76*t,'#2f5c53',0,1);
 }box(x,y+trunk+3.6*t,z,.9*t,1.12*t,.95*t,'#477b6b',0,1)}
 function broadleaf(x,z,y,t){const th=3.3*t;box(x,y+th/2,z,.57*t,th,.56*t,C.wood);for(const [dx,dy,dz,s] of [[0,0,0,3],[-1.1,.25,0,1.7],[1.2,-.2,.3,2],[-.2,.75,-.95,1.8],[.2,.43,1.1,2.1]])box(x+dx*t,y+th+dy*t,z+dz*t,s*t,s*.68*t,s*.8*t,rand()>.5?C.leaf:C.meadow,0,1)}
 let trees=0;for(let i=0;i<400&&trees<115;i++){
  const x=-36+rand()*72,z=-32+rand()*66,h=heightAt(x,z);
  if(h<5||Math.hypot(x-cx,z-cz)<13||Math.abs(x+9+2*Math.sin(z*.37))<3.5&&z>6&&z<32||Math.hypot(x-22,z-8)<6)continue;
  (rand()<.68?pine:broadleaf)(x,z,h,.64+rand()*.58);trees++;
 }
 for(let i=0;i<115;i++){
  const x=-36+rand()*72,z=-32+rand()*66,h=heightAt(x,z);if(h<4||Math.hypot(x-cx,z-cz)<9)continue;
  const s=.4+rand()*1.45;box(x,h+s*.35,z,s,s*.7,s*.83,rand()<.42?'#87918a':'#697977');
  if(rand()<.45)box(x+s*.5,h+.15,z,.7,.3,.66,'#7f9879');
 }
 for(let i=0;i<370;i++){
  const x=-37+rand()*74,z=-32+rand()*65,h=heightAt(x,z);if(h<4||h>19||Math.hypot(x-cx,z-cz)<8)continue;
  if(rand()<.7){box(x,h+.24,z,.06,.48,.07,'#446b4c',0,1);box(x,h+.52,z,.18,.18,.18,rand()<.45?C.flower:C.flower2,.2,1)}
  else box(x,h+.16,z,.3,.31,.28,'#6f9c70',0,1);
 }
 // Layered, low silhouettes maintain the 3D horizon without boxing in the island.
 for(let i=0;i<17;i++){
  const angle=i*Math.PI*2/17,r=95+rand()*42,x=Math.cos(angle)*r,z=Math.sin(angle)*r;
  const peak=5+rand()*10;
  for(let k=0;k<5;k++)box(x,1.1+k*1.6,z,16-k*2.25,2.5,13-k*1.8,k%2?'#7d9895':'#718b8b');
  box(x,peak+2,z,2,2,2,'#9db4ad');
 }
 // Clouds are the only mobile islands in the sky.
 for(let i=0;i<16;i++){
  const x=-95+rand()*190,z=-110+rand()*175,y=38+rand()*16;
  for(let j=0;j<4;j++)box(x+j*3.2,y+rand()*1.2,z+(rand()-.5)*4,6+rand()*4,1.3+rand(),3+rand()*2,'#e2e5d6',.03,2);
 }
 return {terrain:mesh.arrays(),instances:new Float32Array(boxes),instanceCount:boxes.length/11,trees,features:{house:[-9,17,0],waterfall:[25,fallTop+2,8],forest:[-27,12,14]}};
}
