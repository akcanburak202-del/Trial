import {perspective,lookAt,multiply,project} from './math.js';
const VS_HEAD=`#version 300 es
precision highp float;
`;
const VS_TERRAIN=VS_HEAD+`layout(location=0) in vec3 aPos;layout(location=1) in vec3 aNormal;layout(location=2) in vec3 aColor;
uniform mat4 uVP;uniform vec3 uEye;
out vec3 vColor;out vec3 vNormal;out float vDistance;out float vGlow;
void main(){gl_Position=uVP*vec4(aPos,1.);vColor=aColor;vNormal=aNormal;vDistance=length(aPos-uEye);vGlow=0.;}`;
const VS_INSTANCES=VS_HEAD+`layout(location=0) in vec3 aPos;layout(location=1) in vec3 aNormal;layout(location=2) in vec3 aOffset;layout(location=3) in vec3 aScale;layout(location=4) in vec3 aColor;layout(location=5) in float aGlow;layout(location=6) in float aSway;
uniform mat4 uVP;uniform vec3 uEye;uniform float uTime;
out vec3 vColor;out vec3 vNormal;out float vDistance;out float vGlow;
void main(){vec3 pos=aPos*aScale+aOffset;if(aSway>1.5){pos.x+=sin(uTime*.09+aOffset.z*.13)*2.2;}else if(aSway>.5){pos.x+=sin(uTime*.86+aOffset.x*.23+aOffset.z*.3)*.13;pos.z+=cos(uTime*.65+aOffset.z*.21)*.1;}gl_Position=uVP*vec4(pos,1.);vColor=aColor;vNormal=aNormal;vDistance=length(pos-uEye);vGlow=aGlow;}`;
const FS=VS_HEAD+`in vec3 vColor;in vec3 vNormal;in float vDistance;in float vGlow;
uniform vec3 uAmbient;uniform vec3 uSun;uniform vec3 uLight;uniform vec3 uFog;uniform float uNight;uniform float uLights;
out vec4 frag;
void main(){float diffuse=max(dot(normalize(vNormal),normalize(uLight)),0.);vec3 shade=uAmbient+uSun*(diffuse*.85+.07);vec3 col=vColor*shade;col+=vec3(1.,.76,.43)*vGlow*(.10+uNight*.9)*uLights;float fog=smoothstep(55.,178.,vDistance)*.67;col=mix(col,uFog,fog);frag=vec4(col,1.);}`;
const VS_WATER=VS_HEAD+`layout(location=0) in vec2 aXZ;uniform mat4 uVP;uniform float uTime;out vec2 vXZ;out float vWave;void main(){float a=sin(aXZ.x*.22+uTime*.8)*cos(aXZ.y*.18-uTime*.62);float b=sin((aXZ.x+aXZ.y)*.085+uTime*.6);float wave=.095*a+.07*b;vXZ=aXZ;vWave=wave;gl_Position=uVP*vec4(aXZ.x,2.7+wave,aXZ.y,1.);}`;
const FS_WATER=VS_HEAD+`in vec2 vXZ;in float vWave;uniform float uTime;uniform float uNight;uniform vec3 uWater;out vec4 frag;void main(){float ripple=sin(vXZ.x*.45+uTime*1.35)*sin(vXZ.y*.38-uTime*.8);float shimmer=pow(max(0.,sin(vXZ.x*.32+vXZ.y*.19+uTime*.65)),16.);vec3 col=uWater+(vWave*.36+ripple*.027)*vec3(.5,.85,.92)+shimmer*vec3(.13,.21,.20)*(1.-uNight*.7);frag=vec4(col,.88);}`;
function shader(gl,type,source){const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw new Error('Shader: '+gl.getShaderInfoLog(sh));return sh}
function program(gl,vs,fs){const p=gl.createProgram();gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,vs));gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error('Program: '+gl.getProgramInfoLog(p));return p}
const lerp=(a,b,t)=>a+(b-a)*t;
const lerp3=(a,b,t)=>a.map((v,i)=>lerp(v,b[i],t));
const themes=[{ambient:[.60,.66,.62],sun:[.74,.75,.63],fog:[.67,.78,.75],water:[.25,.58,.61],top:'#9fcbd4',bottom:'#f8e7b9',sunCss:'#fff1bc'},
{ambient:[.44,.42,.43],sun:[1,.61,.32],fog:[.56,.46,.47],water:[.22,.43,.48],top:'#394a6a',bottom:'#ebaa78',sunCss:'#ffcd86'},
{ambient:[.19,.28,.4],sun:[.30,.39,.52],fog:[.13,.19,.30],water:[.10,.27,.37],top:'#101b35',bottom:'#415275',sunCss:'#a7cfff'}];
function parseHex(hex){return [1,3,5].map(n=>parseInt(hex.slice(n,n+2),16))}
function hexMix(a,b,t){const x=parseHex(a),y=parseHex(b);return '#'+x.map((v,i)=>Math.round(lerp(v,y[i],t)).toString(16).padStart(2,'0')).join('')}
export function themeAt(t,rain=false){const segment=t<.5?0:1,f=(t<.5?t*2:(t-.5)*2);const a=themes[segment],b=themes[segment+1],mixv=k=>lerp3(a[k],b[k],f);const theme={ambient:mixv('ambient'),sun:mixv('sun'),fog:mixv('fog'),water:mixv('water'),top:hexMix(a.top,b.top,f),bottom:hexMix(a.bottom,b.bottom,f),sunCss:hexMix(a.sunCss,b.sunCss,f),night:Math.max(0,(t-.45)/.55)};
 if(rain){theme.ambient=theme.ambient.map(v=>v*.71);theme.sun=theme.sun.map(v=>v*.64);theme.fog=lerp3(theme.fog,[.29,.39,.45],.48);theme.top=hexMix(theme.top,'#344455',.62);theme.bottom=hexMix(theme.bottom,'#66747d',.54)}
 return theme}
const cube=()=>{const out=[];const face=(p,n)=>p.forEach(v=>out.push(...v,...n));const f=(a,b,c,d,n)=>face([a,b,c,a,c,d],n);
 f([-.5,.5,-.5],[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5],[0,1,0]);f([-.5,-.5,.5],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[0,-1,0]);
 f([.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5],[.5,-.5,.5],[1,0,0]);f([-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5],[-.5,-.5,-.5],[-1,0,0]);
 f([-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5],[0,0,1]);f([.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5],[0,0,-1]);return new Float32Array(out)};
export class VoxelRenderer {
 constructor(canvas,world){this.canvas=canvas;this.gl=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'high-performance'});if(!this.gl)throw new Error('Bu cihazda WebGL 2 kullanılamıyor.');const gl=this.gl;
 this.programs={terrain:program(gl,VS_TERRAIN,FS),boxes:program(gl,VS_INSTANCES,FS),water:program(gl,VS_WATER,FS_WATER)};
 this.terrainVAO=gl.createVertexArray();gl.bindVertexArray(this.terrainVAO);
 for(const [loc,data] of [[0,world.terrain.positions],[1,world.terrain.normals],[2,world.terrain.colors]]){const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0)}
 let ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,world.terrain.indices,gl.STATIC_DRAW);this.terrainIndexCount=world.terrain.indices.length;
 this.boxVAO=gl.createVertexArray();gl.bindVertexArray(this.boxVAO);let cb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,cb);gl.bufferData(gl.ARRAY_BUFFER,cube(),gl.STATIC_DRAW);for(const loc of [0,1]){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,24,loc*12)}
 let instanceBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,instanceBuffer);gl.bufferData(gl.ARRAY_BUFFER,world.instances,gl.STATIC_DRAW);for(const [loc,n,offset] of [[2,3,0],[3,3,12],[4,3,24],[5,1,36],[6,1,40]]){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,n,gl.FLOAT,false,44,offset);gl.vertexAttribDivisor(loc,1)}this.boxCount=world.instanceCount;
 this.waterVAO=gl.createVertexArray();gl.bindVertexArray(this.waterVAO);const coords=[],indices=[],steps=42,span=360;for(let z=0;z<=steps;z++)for(let x=0;x<=steps;x++)coords.push(-span/2+x*span/steps,-span/2+z*span/steps);for(let z=0;z<steps;z++)for(let x=0;x<steps;x++){const i=z*(steps+1)+x;indices.push(i,i+1,i+steps+1,i+1,i+steps+2,i+steps+1)}let vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(coords),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);this.waterCount=indices.length;gl.bindVertexArray(null);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);this.vp=null;
 }
 resize(){const ratio=Math.min(window.devicePixelRatio||1,1.5),w=Math.max(1,Math.floor(this.canvas.clientWidth*ratio)),h=Math.max(1,Math.floor(this.canvas.clientHeight*ratio));if(w!==this.canvas.width||h!==this.canvas.height){this.canvas.width=w;this.canvas.height=h;this.gl.viewport(0,0,w,h)}}
 draw(camera,time,rain,elapsed,lights=true){this.resize();const gl=this.gl,t=themeAt(time,rain);const eye=[camera.target[0]+Math.sin(camera.yaw)*camera.radius*Math.cos(camera.pitch),camera.target[1]+Math.sin(camera.pitch)*camera.radius,camera.target[2]+Math.cos(camera.yaw)*camera.radius*Math.cos(camera.pitch)];
 this.vp=multiply(perspective(Math.PI/3.6,this.canvas.width/this.canvas.height,.1,520),lookAt(eye,camera.target));gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 for(const [name,vao,count,instanced] of [['terrain',this.terrainVAO,this.terrainIndexCount,false],['boxes',this.boxVAO,this.boxCount,true]]){
  const p=this.programs[name];gl.useProgram(p);gl.bindVertexArray(vao);gl.uniformMatrix4fv(gl.getUniformLocation(p,'uVP'),false,this.vp);gl.uniform3fv(gl.getUniformLocation(p,'uEye'),eye);gl.uniform1f(gl.getUniformLocation(p,'uTime'),elapsed);gl.uniform3fv(gl.getUniformLocation(p,'uAmbient'),t.ambient);gl.uniform3fv(gl.getUniformLocation(p,'uSun'),t.sun);gl.uniform3fv(gl.getUniformLocation(p,'uFog'),t.fog);gl.uniform3fv(gl.getUniformLocation(p,'uLight'),[-.45,.82,.4]);gl.uniform1f(gl.getUniformLocation(p,'uNight'),t.night);gl.uniform1f(gl.getUniformLocation(p,'uLights'),lights?1:0);
  if(instanced)gl.drawArraysInstanced(gl.TRIANGLES,0,36,count);else gl.drawElements(gl.TRIANGLES,count,gl.UNSIGNED_INT,0)
 }
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);const p=this.programs.water;gl.useProgram(p);gl.bindVertexArray(this.waterVAO);gl.uniformMatrix4fv(gl.getUniformLocation(p,'uVP'),false,this.vp);gl.uniform1f(gl.getUniformLocation(p,'uTime'),elapsed);gl.uniform1f(gl.getUniformLocation(p,'uNight'),t.night);gl.uniform3fv(gl.getUniformLocation(p,'uWater'),t.water);gl.drawElements(gl.TRIANGLES,this.waterCount,gl.UNSIGNED_SHORT,0);gl.depthMask(true);gl.disable(gl.BLEND);gl.bindVertexArray(null);return t}
 point(v){return this.vp&&project(v,this.vp,this.canvas.clientWidth,this.canvas.clientHeight)}
}
