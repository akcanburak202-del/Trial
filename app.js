import { createScene, distance, speed, step } from './physics.js';

const $ = selector => document.querySelector(selector);
const canvas = $('#universe');
const ctx = canvas.getContext('2d');
const wrap = $('#canvas-wrap');
const sceneButtons = [...document.querySelectorAll('.scenario')];
const sceneNames = { orbit: 'YÖRÜNGE KUR', binary: 'İKİLİ YILDIZ', flyby: 'YAKIN GEÇİŞ' };
const descriptions = {
  orbit: 'Turkuaz okun ucunu sürükle. Aracı 2 yıl boyunca kesikli hedef halkada tut.',
  binary: 'Turkuaz okun ucunu sürükle. İki yıldızın birleşen çekimini izle.',
  flyby: 'Turkuaz okun ucunu sürükle. Dev gezegenin yakınından geçmeyi dene.'
};
const stars = Array.from({ length: 120 }, (_, i) => ({
  x: fract(Math.sin(i * 73.17 + 5.1) * 43758.5453),
  y: fract(Math.sin(i * 21.49 + 2.2) * 28519.8347),
  alpha: 0.16 + fract(Math.sin(i * 44.91) * 9064.272) * 0.45,
  radius: i % 13 === 0 ? 1.15 : 0.5
}));
function fract(n) { return n - Math.floor(n); }

let scene, craft, bodies, sceneId = 'orbit';
let launched = false, paused = false, dragging = false, mission = 'ready';
let elapsed = 0, targetHold = 0, trailTick = 0, predicted = [];
let trails = new Map(), w = 1, h = 1, scale = 1, dpr = 1;
let predictionDirty = true, predictionLast = 0, toastTimer;

function setup(id) {
  sceneId = id;
  scene = createScene(id);
  bodies = scene.bodies;
  craft = scene.craft;
  elapsed = targetHold = trailTick = 0;
  launched = paused = dragging = false;
  mission = 'ready';
  trails = new Map(bodies.map(b => [b.id, []]));
  trails.set('craft', []);
  predictionDirty = true;
  sceneButtons.forEach(button => {
    const active = button.dataset.scene === id;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $('#scene-name').textContent = sceneNames[id];
  $('#instruction').textContent = descriptions[id];
  $('#canvas-mode').textContent = 'HAZIRLIK MODU';
  $('#canvas-hint').classList.remove('hidden');
  $('#launch').disabled = false;
  $('#launch').querySelector('span').textContent = 'ARACI FIRLAT';
  $('#play-pause').disabled = true;
  $('#play-pause').textContent = 'Ⅱ';
  $('#playback-status').textContent = 'SİMÜLASYON HAZIR';
  $('#playback-description').textContent = 'Fırlatma vektörünü ayarla';
  hideToast();
  updateReadout();
}

function resize() {
  const rect = wrap.getBoundingClientRect();
  w = rect.width; h = rect.height;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  scale = Math.min(w / 4.9, h / 3.9);
}
function point(x, y) { return { x: w * .5 + x * scale, y: h * .51 - y * scale }; }
function toWorld(x, y) { return { x: (x - w * .5) / scale, y: (h * .51 - y) / scale }; }
function pointer(event) { const rect = canvas.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; }
function arrowHead() { const p = point(craft.x, craft.y); return { x: p.x + craft.vx * 25, y: p.y - craft.vy * 25 }; }

canvas.addEventListener('pointerdown', event => {
  if (launched) return;
  const p = pointer(event), base = point(craft.x, craft.y), tip = arrowHead();
  if (Math.hypot(p.x - tip.x, p.y - tip.y) < 36 || Math.hypot(p.x - base.x, p.y - base.y) < 33) {
    dragging = true;
    wrap.classList.add('dragging');
    canvas.setPointerCapture(event.pointerId);
    moveArrow(event);
  }
});
canvas.addEventListener('pointermove', event => { if (dragging) moveArrow(event); });
function stopDrag() { dragging = false; wrap.classList.remove('dragging'); }
canvas.addEventListener('pointerup', stopDrag);
canvas.addEventListener('pointercancel', stopDrag);
function moveArrow(event) {
  const p = pointer(event), base = point(craft.x, craft.y);
  const vx = (p.x - base.x) / 25, vy = (base.y - p.y) / 25;
  const magnitude = Math.hypot(vx, vy);
  const ratio = magnitude > 11 ? 11 / magnitude : 1;
  craft.vx = vx * ratio; craft.vy = vy * ratio;
  predictionDirty = true;
  $('#canvas-hint').classList.add('hidden');
  updateReadout();
}

function launch() {
  if (launched || speed(craft) < 0.2) {
    if (!launched) showToast('Fırlatmak için bir hız vektörü çiz.', true);
    return;
  }
  launched = true;
  bodies.push(craft);
  $('#launch').disabled = true;
  $('#launch').querySelector('span').textContent = 'UÇUŞ BAŞLADI';
  $('#play-pause').disabled = false;
  $('#canvas-mode').textContent = 'UÇUŞ MODU';
  $('#canvas-hint').classList.add('hidden');
  $('#playback-status').textContent = 'UÇUŞ DEVAM EDİYOR';
  $('#playback-description').textContent = scene.objective;
  mission = 'flight';
  updateReadout();
}

function togglePause() {
  if (!launched || mission === 'collision') return;
  paused = !paused;
  $('#play-pause').textContent = paused ? '▶' : 'Ⅱ';
  $('#play-pause').setAttribute('aria-label', paused ? 'Devam et' : 'Duraklat');
  $('#play-pause').title = paused ? 'Devam et' : 'Duraklat';
  $('#playback-status').textContent = paused ? 'UÇUŞ DURAKLATILDI' : 'UÇUŞ DEVAM EDİYOR';
}

function showToast(message, warning = false) {
  const el = $('#mission-toast');
  el.textContent = message;
  el.classList.toggle('warning', warning);
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 4800);
}
function hideToast() { $('#mission-toast').classList.remove('visible'); }

function recordTrails() {
  for (const b of bodies) {
    const path = trails.get(b.id);
    path.push({ x: b.x, y: b.y });
    if (path.length > 540) path.shift();
  }
}

function simulate(dt) {
  const count = Math.ceil(dt / 0.002);
  const subDt = dt / count;
  for (let i = 0; i < count; i++) {
    step(bodies, subDt);
    elapsed += subDt;
    trailTick += subDt;
    if (trailTick >= 0.008) { recordTrails(); trailTick = 0; }

    const impact = bodies.find(b => b !== craft && distance(craft, b) < b.radius + craft.radius);
    if (impact) {
      mission = 'collision'; paused = true;
      $('#play-pause').textContent = '▶';
      $('#playback-status').textContent = 'ÇARPIŞMA';
      showToast(`${impact.name} ile çarpışma. Yeniden dene.`, true);
      break;
    }
    if (sceneId === 'orbit' && mission === 'flight') {
      const r = distance(craft, bodies[0]);
      if (r < 0.98 || r > 1.34) {
        mission = 'outside';
        showToast('Hedef halkanın dışına çıktın. Yeniden deneyebilirsin.', true);
      } else {
        targetHold += subDt;
        if (targetHold >= 2) {
          mission = 'success';
          showToast('YÖRÜNGE KURULDU · 2 YIL TAMAMLANDI');
        }
      }
    }
  }
}

function updatePrediction() {
  const copies = bodies.filter(b => b !== craft).map(b => ({ ...b }));
  copies.push({ ...craft });
  const ghost = copies[copies.length - 1];
  const next = [];
  const interval = 0.009;
  for (let i = 0; i < 155; i++) {
    for (let j = 0; j < 3; j++) step(copies, interval / 3);
    next.push({ x: ghost.x, y: ghost.y });
    if (copies.some(b => b !== ghost && distance(b, ghost) < b.radius + ghost.radius)) break;
  }
  predicted = next;
  predictionDirty = false;
}

function updateReadout() {
  const v = speed(craft), angle = (Math.atan2(craft.vy, craft.vx) * 180 / Math.PI + 360) % 360;
  $('#launch-speed').textContent = `${v.toFixed(2)} AU/yıl`;
  $('#launch-angle').textContent = `${Math.round(angle)}°`;
  $('#metric-days').textContent = (elapsed * 365.25).toFixed(1);
  $('#metric-speed').textContent = v.toFixed(2);
  $('#metric-distance').textContent = distance(craft, bodies[0]).toFixed(2);
  $('#time-code').textContent = `+ ${(elapsed * 365.25).toFixed(1).padStart(5, '0')} GÜN`;
  const labels = { ready: 'Hazırlık', flight: 'Uçuşta', outside: 'Halka dışı', success: 'Başarılı', collision: 'Çarpışma' };
  const details = { ready: 'İlk hızını belirle', flight: sceneId === 'orbit' ? `${Math.min(100, targetHold / 2 * 100).toFixed(0)}% hedef süresi` : 'Yolu gözlemle', outside: 'Sıfırlayıp tekrar dene', success: 'İki yıl hedef halkada', collision: 'Sıfırlayıp tekrar dene' };
  $('#metric-status').textContent = labels[mission];
  $('#metric-status-detail').textContent = details[mission];
  $('.status-indicator').style.background = mission === 'collision' || mission === 'outside' ? '#e6ad75' : '#79dac5';
}

function drawGrid() {
  ctx.save();
  ctx.strokeStyle = '#9cb9c2'; ctx.globalAlpha = .065; ctx.lineWidth = 1;
  const spacing = scale / 2, cx = w * .5, cy = h * .51;
  for (let x = cx % spacing; x < w; x += spacing) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = cy % spacing; y < h; y += spacing) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  ctx.globalAlpha = .12; ctx.strokeStyle = '#82bfc0';
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
  ctx.restore();
  for (const s of stars) { ctx.fillStyle = `rgba(177,218,227,${s.alpha})`; ctx.beginPath(); ctx.arc(s.x * w, s.y * h, s.radius, 0, Math.PI * 2); ctx.fill(); }
}

function drawSceneGuide() {
  const center = point(bodies[0].x, bodies[0].y);
  if (sceneId === 'orbit') {
    ctx.save(); ctx.fillStyle = '#6fdec80c';
    ctx.beginPath(); ctx.arc(center.x, center.y, 1.34 * scale, 0, 2 * Math.PI); ctx.arc(center.x, center.y, .98 * scale, 0, 2 * Math.PI, true); ctx.fill();
    for (const radius of [.98, 1.34]) { ctx.setLineDash([3, 7]); ctx.strokeStyle = '#72bca287'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(center.x, center.y, radius * scale, 0, 2 * Math.PI); ctx.stroke(); }
    ctx.setLineDash([]); ctx.font = '10px DM Mono, monospace'; ctx.fillStyle = '#79baaa';
    ctx.fillText('HEDEF HALKA', center.x - 37, center.y - 1.34 * scale - 12);
    ctx.restore();
  } else if (sceneId === 'binary') {
    ctx.save(); ctx.strokeStyle = '#809aad39'; ctx.setLineDash([4, 8]); ctx.beginPath(); ctx.arc(w * .5, h * .51, .48 * scale, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
  } else {
    ctx.save(); ctx.strokeStyle = '#8caec342'; ctx.setLineDash([2, 8]); ctx.beginPath(); ctx.arc(center.x, center.y, 1.1 * scale, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
  }
}

function drawPath(path, color, alpha, width) {
  if (path.length < 2) return;
  ctx.save(); ctx.lineWidth = width; ctx.strokeStyle = color; ctx.globalAlpha = alpha;
  ctx.beginPath();
  for (let i = 0; i < path.length; i++) {
    const p = point(path[i].x, path[i].y);
    if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke(); ctx.restore();
}

function drawPrediction() {
  if (!predicted.length) return;
  ctx.save(); ctx.fillStyle = '#8cf7d4';
  for (let i = 0; i < predicted.length; i += 4) {
    const p = point(predicted[i].x, predicted[i].y);
    ctx.globalAlpha = .56 * (1 - i / predicted.length) + .10;
    ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.restore();
}

function drawBody(body, now) {
  const p = point(body.x, body.y);
  if (p.x < -70 || p.x > w + 70 || p.y < -70 || p.y > h + 70) return;
  const radius = body.display;
  ctx.save();
  const glow = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, radius * 4);
  glow.addColorStop(0, `${body.color}79`); glow.addColorStop(1, `${body.color}00`);
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(p.x, p.y, radius * 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = body.color; ctx.shadowBlur = radius * 1.4; ctx.shadowColor = body.color;
  ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI); ctx.fill();
  ctx.shadowBlur = 0;
  if (body.id === 'craft') {
    ctx.strokeStyle = '#adffee'; ctx.lineWidth = 1; ctx.globalAlpha = .7;
    ctx.beginPath(); ctx.arc(p.x, p.y, 13 + Math.sin(now * .004) * 1.3, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p.x - 23, p.y); ctx.lineTo(p.x - 16, p.y); ctx.moveTo(p.x + 16, p.y); ctx.lineTo(p.x + 23, p.y); ctx.stroke();
  }
  ctx.font = '10px DM Mono, monospace'; ctx.fillStyle = '#b6cdd2'; ctx.globalAlpha = .85;
  ctx.fillText(body.name.toUpperCase(), p.x + radius + 10, p.y - radius - 6);
  ctx.restore();
}

function drawArrow() {
  const p = point(craft.x, craft.y), tip = arrowHead();
  ctx.save(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#96f3d9'; ctx.fillStyle = '#a8f5dc';
  ctx.shadowBlur = 14; ctx.shadowColor = '#67efd0';
  ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
  const angle = Math.atan2(tip.y - p.y, tip.x - p.x);
  ctx.beginPath(); ctx.moveTo(tip.x + Math.cos(angle) * 9, tip.y + Math.sin(angle) * 9);
  ctx.lineTo(tip.x - Math.cos(angle - .53) * 11, tip.y - Math.sin(angle - .53) * 11);
  ctx.lineTo(tip.x - Math.cos(angle + .53) * 11, tip.y - Math.sin(angle + .53) * 11);
  ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(tip.x, tip.y, 12, 0, 2 * Math.PI); ctx.strokeStyle = '#b5ffdc86'; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
}

function render(now) {
  ctx.clearRect(0, 0, w, h);
  drawGrid(); drawSceneGuide();
  for (const b of bodies) drawPath(trails.get(b.id) || [], b.color, b.id === 'craft' ? .78 : .35, b.id === 'craft' ? 2 : 1.3);
  drawPrediction();
  for (const b of bodies) drawBody(b, now);
  if (!launched) { drawBody(craft, now); drawArrow(); }
}

let lastFrame = 0, lastReadout = 0;
function frame(now) {
  const delta = lastFrame ? Math.min((now - lastFrame) / 1000, .05) : 0;
  lastFrame = now;
  if (launched && !paused) {
    const dt = delta * Number($('#time-scale').value) / 30;
    if (dt > 0) { simulate(dt); predictionDirty = true; }
  }
  if (predictionDirty && now - predictionLast > 90) {
    updatePrediction(); predictionLast = now;
  }
  if (now - lastReadout > 100) { updateReadout(); lastReadout = now; }
  render(now);
  requestAnimationFrame(frame);
}

sceneButtons.forEach(button => button.addEventListener('click', () => setup(button.dataset.scene)));
$('#launch').addEventListener('click', launch);
$('#reset').addEventListener('click', () => setup(sceneId));
$('#play-pause').addEventListener('click', togglePause);
$('#time-scale').addEventListener('input', event => { $('#time-scale-text').textContent = `${event.target.value}×`; });
document.addEventListener('keydown', event => {
  if (event.target instanceof HTMLElement && ['INPUT', 'BUTTON', 'TEXTAREA'].includes(event.target.tagName)) return;
  if (event.code === 'Space') { event.preventDefault(); togglePause(); }
  if (event.code === 'KeyR') setup(sceneId);
});
window.addEventListener('resize', resize);
resize(); setup('orbit'); requestAnimationFrame(frame);
