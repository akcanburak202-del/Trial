import { World, M } from './physics.js';

const canvas=document.querySelector('#world');
const ctx=canvas.getContext('2d',{alpha:false});
const scene=document.querySelector('.scene');
const live=document.querySelector('#live');
const counter=document.querySelector('#counter');
const brushControl=document.querySelector('#brush');
const brushValue=document.querySelector('#brush-value');
const pauseButton=document.querySelector('#pause');
const wipeButton=document.querySelector('#clear');
const materialButtons=[...document.querySelectorAll('[data-material]')];
const sceneButtons=[...document.querySelectorAll('[data-scene]')];
const W=200,H=126,world=new World(W,H);
canvas.width=W;canvas.height=H;
const image=ctx.createImageData(W,H), pixels=image.data;
let selected=M.SAND, paused=false, drawing=false, last=null, frames=0, lastTime=0;
const palette=[ [8,19,29], [242,187,112], [76,167,211], [91,110,125], [139,94,68], [255,118,64], [120,130,146], [190,218,223] ];
const names={ [M.SAND]:'Kum', [M.WATER]:'Su', [M.STONE]:'Taş', [M.WOOD]:'Odun', [M.FIRE]:'Ateş', [M.SMOKE]:'Duman', [M.STEAM]:'Buhar', [M.EMPTY]:'Silgi' };
const rand=(x,y)=>(x*97+y*71+x*y*13)%29-14;
function render(t){
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const i=y*W+x,k=world.cells[i],p=i*4,v=rand(x,y);
    if(!k){const g=Math.max(0,10-(y/12|0));pixels[p]=8+g;pixels[p+1]=19+g;pixels[p+2]=29+g;}
    else {let [r,g,b]=palette[k];const shade=k===M.FIRE ? (world.life[i]%10)*7 : v; pixels[p]=Math.max(0,Math.min(255,r+shade));pixels[p+1]=Math.max(0,Math.min(255,g+shade*.7));pixels[p+2]=Math.max(0,Math.min(255,b+shade*.5));}
    pixels[p+3]=255;
  }
  ctx.putImageData(image,0,0);
  if(!paused && t-lastTime>31){world.step();frames++;lastTime=t;if(frames%14===0){let count=0;for(const m of world.cells) if(m!==0) count++;counter.textContent=count.toLocaleString('tr-TR')+' parçacık';}}
  requestAnimationFrame(render);
}
function pick(material){selected=material;materialButtons.forEach(b=>{const active=+b.dataset.material===material;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active)});live.textContent=names[material]+' seçildi';}
materialButtons.forEach(b=>b.addEventListener('click',()=>pick(+b.dataset.material)));
brushControl.addEventListener('input',()=>{brushValue.textContent=brushControl.value;});
function coordinates(e){const rect=canvas.getBoundingClientRect();return {x:Math.floor((e.clientX-rect.left)/rect.width*W),y:Math.floor((e.clientY-rect.top)/rect.height*H)};}
function paint(e){const p=coordinates(e),size=+brushControl.value;
  if(last){let steps=Math.max(1,Math.ceil(Math.hypot(p.x-last.x,p.y-last.y)/(size*.5+1)));for(let n=0;n<=steps;n++)world.brush(Math.round(last.x+(p.x-last.x)*n/steps),Math.round(last.y+(p.y-last.y)*n/steps),size,selected);}else world.brush(p.x,p.y,size,selected);
  last=p;
}
canvas.addEventListener('pointerdown',e=>{drawing=true;last=null;canvas.setPointerCapture(e.pointerId);paint(e)});
canvas.addEventListener('pointermove',e=>{if(drawing)paint(e)});
canvas.addEventListener('pointerup',()=>{drawing=false;last=null});
canvas.addEventListener('pointercancel',()=>{drawing=false;last=null});
pauseButton.addEventListener('click',()=>{paused=!paused;pauseButton.textContent=paused?'▶ Devam et':'Ⅱ Duraklat';pauseButton.setAttribute('aria-pressed',paused);live.textContent=paused?'Simülasyon durdu':'Simülasyon çalışıyor'});
wipeButton.addEventListener('click',()=>{world.cells.fill(0);world.life.fill(0);sceneButtons.forEach(b=>b.classList.remove('active'));live.textContent='Tuval temizlendi'});
function ground(){for(let x=0;x<W;x++){world.put(x,H-1,M.STONE);world.put(x,H-2,M.STONE)}}
function seed(type){world.cells.fill(0);world.life.fill(0);ground();
  if(type==='shore'){
    for(let x=2;x<118;x++)for(let y=H-3;y>H-12-(x/22|0);y--)world.put(x,y,M.SAND);
    for(let x=112;x<W-2;x++)for(let y=H-3;y>H-32;y--)world.put(x,y,M.WATER);
    for(let x=36;x<41;x++)for(let y=H-27;y<H-13;y++)world.put(x,y,M.WOOD);
    for(let x=20;x<58;x++)world.put(x,H-27+Math.abs(39-x)*.4|0,M.WOOD);
  } else if(type==='volcano'){
    for(let x=8;x<W-8;x++)for(let y=H-3;y>H-8;y--)world.put(x,y,M.STONE);
    for(let y=H-9;y>H-62;y--)for(let x=50-(H-9-y)*.32|0;x<145+(H-9-y)*.32;x++)if(x>1&&x<W-2&&world.random()<.74)world.put(x,y,M.SAND);
    for(let x=89;x<110;x++)for(let y=H-68;y<H-62;y++)world.put(x,y,M.FIRE);
    for(let x=146;x<179;x++)for(let y=H-30;y<H-10;y++)world.put(x,y,M.WATER);
  } else {
    for(let x=4;x<W-4;x++)for(let y=H-3;y>H-11;y--)world.put(x,y,M.SAND);
    for(const trunk of [36,83,146]){
      for(let x=trunk;x<trunk+5;x++)for(let y=H-38;y<H-12;y++)world.put(x,y,M.WOOD);
      for(let d=-13;d<18;d++)for(let x=trunk+d;x<trunk+d+2;x++)world.put(x,H-36+Math.abs(d)*.53|0,M.WOOD);
    }
    for(let x=169;x<183;x++)for(let y=H-15;y<H-10;y++)world.put(x,y,M.FIRE);
    for(let x=6;x<24;x++)for(let y=H-21;y<H-11;y++)world.put(x,y,M.WATER);
  }
  sceneButtons.forEach(b=>b.classList.toggle('active',b.dataset.scene===type));live.textContent=type==='shore'?'Kıyı sahnesi hazır':type==='volcano'?'Volkan sahnesi hazır':'Orman sahnesi hazır';
}
sceneButtons.forEach(b=>b.addEventListener('click',()=>seed(b.dataset.scene)));
seed('shore');pick(M.SAND);requestAnimationFrame(render);
