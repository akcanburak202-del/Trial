const $ = selector => document.querySelector(selector);
const frame = $('#art-frame');
const canvas = $('#effects');
const ctx = canvas.getContext('2d');
const hotspots = [...document.querySelectorAll('.hotspot')];
const quickButtons = [...document.querySelectorAll('[data-hour]')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = { hour: 16, raining: false, paused: reducedMotion, selected: null, boat: false, lamps: false, petals: 0, pulses: [], t: 0, last: 0, width: 1, height: 1, dpr: 1 };
const places = {
  tree: { number: 'RESİM / 01', title: 'Nar ağacı', body: 'Rüzgâr dalları kıpırdatıyor. Bir kez daha dokun; yapraklar nehre doğru süzülsün.' },
  bridge: { number: 'RESİM / 02', title: 'Taş köprü', body: 'Köyün iki yakası burada birleşiyor. Suyun üzerinde halkalar açılıyor, kuşlar başının üzerinden geçiyor.' },
  house: { number: 'RESİM / 03', title: 'Pencerelerde ışık', body: 'Gün batınca evler birer birer parlıyor. Dokunarak içerdeki ışıkları yakıp söndürebilirsin.' },
  boat: { number: 'RESİM / 04', title: 'Nehirde yolculuk', body: 'Kayığın çevresinde su kıpırdıyor. Minyatürün içindeki yol, resmin kenarında bitmiyor.' }
};
const rain = Array.from({length: 135}, (_, i) => ({x: random(i, 2), y: random(i, 13), speed: .35 + random(i, 37) * .55, len: .012 + random(i, 53) * .022}));
const fireflies = Array.from({length: 32}, (_, i) => ({x: random(i, 101), y: .42 + random(i, 112) * .42, phase: random(i, 131) * 7, size: .9 + random(i, 150) * 1.5}));
const petals = Array.from({length: 23}, (_, i) => ({x: random(i, 192), y: random(i, 210), speed: .11 + random(i, 222) * .13, phase: random(i, 237) * 7}));
function random(i, salt) { const v = Math.sin((i + 1) * 78.233 + salt * 17.719) * 43758.5453; return v - Math.floor(v); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function smooth(a, b, v) { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function clock(hour) { const minutes = Math.round(hour * 60); return `${String(Math.floor(minutes / 60) % 24).padStart(2,'0')}:${String(minutes % 60).padStart(2,'0')}`; }
function part(hour) { return hour < 5 ? 'GECE' : hour < 9 ? 'ŞAFAK' : hour < 12 ? 'SABAH' : hour < 17 ? 'İKİNDİ' : hour < 20 ? 'AKŞAM' : 'GECE'; }
function nightAmount(hour) { return Math.max(1 - smooth(5, 8, hour), smooth(17.5, 21, hour)) * .82; }

function updateLight() {
  const n = nightAmount(state.hour);
  frame.style.setProperty('--night', n.toFixed(3));
  frame.style.setProperty('--moon', clamp((n - .35) * 1.5, 0, .85).toFixed(3));
  frame.style.setProperty('--lamps', (state.lamps || n > .38 ? clamp(n * .9 + (state.lamps ? .35 : 0), 0, 1) : 0).toFixed(3));
  frame.style.setProperty('--brightness', (1 - n * .36 - (state.raining ? .1 : 0)).toFixed(3));
  frame.style.setProperty('--saturation', (1 - n * .12 - (state.raining ? .16 : 0)).toFixed(3));
  $('#hour-text').textContent = clock(state.hour);
  $('#clock-label').textContent = clock(state.hour);
  $('#ribbon-time').textContent = `${part(state.hour)} / ${clock(state.hour)}`;
  $('#weather-label').textContent = state.raining ? 'YAĞMUR YAĞIYOR' : 'GÖKYÜZÜ AÇIK';
  $('#weather-text').textContent = state.raining ? 'YAĞMUR' : 'AÇIK';
  quickButtons.forEach(button => button.classList.toggle('selected', Number(button.dataset.hour) === state.hour));
  $('#sunny').classList.toggle('selected', !state.raining);
  $('#rainy').classList.toggle('selected', state.raining);
  $('#sunny').setAttribute('aria-pressed', String(!state.raining));
  $('#rainy').setAttribute('aria-pressed', String(state.raining));
}

function choose(place) {
  state.selected = place;
  if (place === 'tree') state.petals = state.t + 7;
  if (place === 'boat') state.boat = !state.boat;
  if (place === 'house') state.lamps = !state.lamps;
  const positions = {tree:[.19,.55],bridge:[.48,.63],house:[.79,.42],boat:[.60,.81]};
  state.pulses.push({x:positions[place][0],y:positions[place][1],start:state.t});
  hotspots.forEach(b => b.classList.toggle('active', b.dataset.place === place));
  $('#story-number').textContent = places[place].number;
  $('#story-title').textContent = places[place].title;
  $('#story-body').textContent = places[place].body;
  document.querySelectorAll('.story-dots i').forEach((dot,i) => dot.classList.toggle('active', i === ['tree','bridge','house','boat'].indexOf(place)));
  render();
}

function resize() {
  const bounds = frame.getBoundingClientRect();
  state.width = bounds.width; state.height = bounds.height;
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(bounds.width * state.dpr);
  canvas.height = Math.round(bounds.height * state.dpr);
  ctx.setTransform(state.dpr,0,0,state.dpr,0,0);
  render();
}

function ellipse(x, y, rx, ry, color, alpha = 1, line = 1) {
  ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = line;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
}

function drawSky(w, h, t) {
  const n = nightAmount(state.hour);
  if (!state.raining && n < .6) {
    const warmth = Math.max(smooth(15, 18, state.hour) * (1 - smooth(18, 20, state.hour)), smooth(5, 7, state.hour) * (1 - smooth(7, 9, state.hour)));
    if (warmth > .03) {
      const x = (state.hour < 12 ? .16 : .82) * w;
      const glow = ctx.createRadialGradient(x, h * .18, 1, x, h * .18, w * .65);
      glow.addColorStop(0, `rgba(255,188,85,${warmth * .32})`); glow.addColorStop(1, 'rgba(255,210,130,0)');
      ctx.fillStyle = glow; ctx.fillRect(0,0,w,h);
    }
  }
  if (n > .3 && !state.raining) {
    ctx.save(); ctx.fillStyle = '#fff6d3';
    for (let i = 0; i < 28; i++) {
      const x = random(i, 311) * w, y = random(i, 321) * h * .38;
      ctx.globalAlpha = (n - .2) * (.25 + .38 * Math.sin(t * 1.4 + i * 3) ** 2);
      ctx.beginPath(); ctx.arc(x,y,.55 + (i % 5 === 0 ? .5 : 0),0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
}

function drawRiver(w,h,t) {
  ctx.save(); ctx.strokeStyle = state.raining ? '#e2f5ee' : '#fff6db'; ctx.lineWidth = 1.1;
  for (let i = 0; i < 19; i++) {
    const x = (.27 + random(i,78) * .51) * w;
    const y = (.68 + random(i,88) * .27) * h;
    const twinkle = Math.sin(t * 2.5 + i * 3.3);
    ctx.globalAlpha = (.13 + Math.max(0,twinkle) * .42) * (state.raining ? .7 : 1);
    ctx.beginPath(); ctx.moveTo(x - 2 - twinkle * 2,y); ctx.quadraticCurveTo(x,y-2,x+4+twinkle*3,y); ctx.stroke();
  }
  ctx.restore();
  if (state.selected === 'bridge' || state.selected === 'boat' || state.raining) {
    const count = state.raining ? 13 : 7;
    for (let i = 0; i < count; i++) {
      const age = (t * .65 + random(i,54)) % 1;
      const x = (.38 + random(i,61) * .31) * w;
      const y = (.68 + random(i,64) * .24) * h;
      ellipse(x,y,(4+age*16)*w/650,(2+age*5)*h/650,'#e5fcf2',(.4 * (1-age)),.8);
    }
  }
}

function drawBirds(w,h,t) {
  if (state.raining || nightAmount(state.hour) > .45) return;
  ctx.save(); ctx.strokeStyle = '#413936'; ctx.lineWidth = Math.max(1, w/670); ctx.globalAlpha = .55;
  for (let i = 0; i < 5; i++) {
    const x = (((t * (.013 + i*.002) + i*.16) % 1.3) - .1) * w;
    const y = (.2 + i*.028 + Math.sin(t*1.1+i*1.6)*.009) * h;
    const wing = 3 + Math.sin(t*7+i)*2;
    ctx.beginPath(); ctx.moveTo(x-7,y-wing); ctx.quadraticCurveTo(x-2,y-1,x,y+1); ctx.quadraticCurveTo(x+2,y-1,x+7,y-wing); ctx.stroke();
  }
  ctx.restore();
}

function drawRain(w,h,t) {
  if (!state.raining) return;
  const veil = ctx.createLinearGradient(0,0,0,h); veil.addColorStop(0,'#1a39475c'); veil.addColorStop(1,'#31465011');
  ctx.fillStyle = veil; ctx.fillRect(0,0,w,h);
  ctx.save(); ctx.strokeStyle = '#e9f7ef'; ctx.lineWidth = Math.max(.65,w/750);
  for (const drop of rain) {
    const y = ((drop.y + t*drop.speed) % 1.13 - .08)*h;
    const x = ((drop.x - t*drop.speed*.2)%1.14 + 1.14)%1.14*w - w*.07;
    ctx.globalAlpha = .15 + drop.speed*.33;
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x - drop.len*w*.37,y + drop.len*h); ctx.stroke();
  }
  ctx.restore();
}

function drawFireflies(w,h,t) {
  if (state.raining) return;
  const n = nightAmount(state.hour);
  if (n < .3) return;
  ctx.save();
  for (const insect of fireflies) {
    const x = (insect.x + Math.sin(t*.45+insect.phase)*.012)*w;
    const y = (insect.y + Math.sin(t*.7+insect.phase)*.008)*h;
    const alpha = Math.pow(Math.max(0,Math.sin(t*1.7+insect.phase)),2)*n*.8;
    ctx.shadowBlur = 11; ctx.shadowColor = '#fcdf78'; ctx.fillStyle = `rgba(255,230,131,${alpha})`;
    ctx.beginPath(); ctx.arc(x,y,insect.size*w/700,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

function drawPetals(w,h,t) {
  if (state.raining || state.petals < t) return;
  ctx.save(); ctx.fillStyle = '#d5675a';
  for (const p of petals) {
    const age = (t*p.speed + p.y) % 1;
    const x = (.19 + p.x*.13 + age*.26 + Math.sin(t*1.3+p.phase)*.02)*w;
    const y = (.43 + age*.38)*h;
    ctx.globalAlpha = .7*(1-age);
    ctx.beginPath(); ctx.ellipse(x,y,2.8*w/650,1.4*h/650,p.phase+t*.8,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

function drawLamps(w,h) {
  const n = nightAmount(state.hour);
  if (!state.lamps && n < .38) return;
  for (const [x,y,r] of [[.81,.4,.13],[.9,.43,.10],[.66,.48,.07]]) {
    const grad = ctx.createRadialGradient(x*w,y*h,1,x*w,y*h,r*w);
    grad.addColorStop(0,`rgba(255,214,116,${clamp(n+.2,0,.68)})`);
    grad.addColorStop(.24,`rgba(255,197,84,${clamp(n*.25,0,.25)})`);
    grad.addColorStop(1,'rgba(255,194,75,0)');
    ctx.fillStyle = grad; ctx.fillRect((x-r)*w,(y-r)*h,r*2*w,r*2*h);
  }
}

function drawBoat(w,h,t) {
  if (!state.boat) return;
  const x = .59*w, y = .82*h;
  ctx.save(); ctx.strokeStyle = '#fff5c7'; ctx.lineWidth = Math.max(1,w/700);
  for(let i=0;i<4;i++) {
    const age = (t*.48+i*.25)%1;
    ctx.globalAlpha = .65*(1-age);
    ctx.beginPath(); ctx.ellipse(x,y,12+age*40,4+age*13,-.14,Math.PI*.08,Math.PI*.85); ctx.stroke();
  }
  ctx.restore();
}

function drawPulses(w,h,t) {
  state.pulses = state.pulses.filter(p => t-p.start < 1.1);
  for(const pulse of state.pulses){
    const age = clamp((t-pulse.start)/1.1,0,1);
    ellipse(pulse.x*w,pulse.y*h,15+age*36,15+age*36,'#fff6d8',.65*(1-age),2);
  }
}

function render() {
  const w=state.width,h=state.height,t=state.t;
  ctx.clearRect(0,0,w,h);
  drawSky(w,h,t); drawLamps(w,h); drawBirds(w,h,t); drawRiver(w,h,t); drawBoat(w,h,t); drawPetals(w,h,t); drawFireflies(w,h,t); drawRain(w,h,t); drawPulses(w,h,t);
}
function frameLoop(now) {
  if (!state.paused && state.last) state.t += Math.min((now-state.last)/1000,.05);
  state.last = now;
  render(); requestAnimationFrame(frameLoop);
}

$('#time').addEventListener('input', event => { state.hour = Number(event.target.value); updateLight(); render(); });
quickButtons.forEach(button => button.addEventListener('click', () => { state.hour = Number(button.dataset.hour); $('#time').value = state.hour; updateLight(); render(); }));
$('#sunny').addEventListener('click', () => { state.raining = false; updateLight(); render(); });
$('#rainy').addEventListener('click', () => { state.raining = true; updateLight(); render(); });
hotspots.forEach(button => button.addEventListener('click', () => choose(button.dataset.place)));
$('#motion').addEventListener('click', () => {
  state.paused = !state.paused;
  $('#motion').textContent = state.paused ? '▶  Hareketi başlat' : 'Ⅱ  Hareketi durdur';
  $('#motion').setAttribute('aria-pressed', String(state.paused));
  render();
});
if (reducedMotion) { $('#motion').textContent = '▶  Hareketi başlat'; $('#motion').setAttribute('aria-pressed','true'); }
frame.addEventListener('pointermove', event => {
  if (state.paused || event.pointerType === 'touch') return;
  const bounds = frame.getBoundingClientRect();
  frame.style.setProperty('--parallax-x', `${((event.clientX-bounds.left)/bounds.width-.5)*-6}px`);
  frame.style.setProperty('--parallax-y', `${((event.clientY-bounds.top)/bounds.height-.5)*-6}px`);
});
frame.addEventListener('pointerleave', () => { frame.style.setProperty('--parallax-x','0px'); frame.style.setProperty('--parallax-y','0px'); });
new ResizeObserver(resize).observe(frame);
updateLight(); resize(); requestAnimationFrame(frameLoop);
