import {createWorld,FOCI,VIEWS} from './world.js';
import {freshState,restoreState,tick,chapter,perform} from './simulation.js';
import {Soundscape} from './audio.js';
const $=s=>document.querySelector(s),KEY='esik-water-memory-v1';
let state=freshState(),storageOK=true;
try{state=restoreState(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{storageOK=false;}
let selected='aqueduct',world,focused=false,lastChapter=chapter(state),hintLevel=0,toastTimer,endingShown=state.finished,muted=true,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const audio=new Soundscape();
let view={...VIEWS.overview,target:[...VIEWS.overview.target]},target={...view,target:[...view.target]},last=0,time=0,uiTimer=0,saveTimer=0;
let failure=false,flow={intake:0,wheel:0,left:0,right:0,organ:0};
const canvas=$('#world'),pointers=new Map();let gesture=null;
function notify(message,ms=5000){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),ms);}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}$('#save-status').textContent=storageOK?'İlerlemen yalnızca bu tarayıcıda saklanır.':'Tarayıcı kayıt izni vermedi. Bu oturumdaki ilerleme sayfa kapanınca kaybolabilir.';}
function fail(e){failure=true;$('#loading').hidden=true;$('#error').hidden=false;console.error(e);if(!/webgl/i.test(String(e)))$('#error-copy').textContent='Sahne hazırlanırken bir sorun oluştu. Sayfayı yenileyip tekrar deneyebilirsin.';}
window.addEventListener('error',e=>{if(!world)fail(e.error||e.message)});
function setView(name){const v=VIEWS[name];target={...v,target:[...v.target]};if(innerWidth<650){target.radius*=name==='overview'?1.36:1.28;target.pitch+=.1;}focused=name!=='overview';if(state.started){$('#story').hidden=!focused;$('#controls').hidden=!focused;}}
function choose(area,move=true){selected=area;state.lensArea=area;world.focusLens(area);if(move)setView(area);hintLevel=0;renderControls();updateUI();if(area==='garden'&&!state.gate)notify('Önce kemerden su geçir. Dolan sarnıç bahçenin kapısını açacak.');if(area==='organ'&&!state.garden)notify('Çalgı için önce iki bahçeye de su ulaştır.');}
function toggleLens(){if(!state.started)return;state.lens=!state.lens;state.lensArea=selected;world.focusLens(selected);if(state.lens){audio.note(3,3,.045);if(!state.seen.includes('lens')){state.seen.push('lens');notify('Halkanın içi geçmişe ait. Halkayı sürükle; dışındaki boşlukta kamerayı döndür.',7000)}}renderControls();updateUI();save();}
const areas={aqueduct:{title:'KIRIK KEMER',label:'Kemer',marker:[-9,16.5,-6]},garden:{title:'TERAS BAHÇELERİ',label:'Bahçe',marker:[-1,8,8]},organ:{title:'SESSİZ ÇALGI',label:'Çalgı',marker:[18,21,1]}};
const icons=['·','I','II','III','IV'];
const meter=(label,id)=>`<div class="meter-row"><span>${label}</span><strong id="${id}-value">0%</strong></div><div class="meter" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" id="${id}"><i></i></div>`;
function renderControls(){
 $('#area-title').textContent=areas[selected].title;
 let html='';
 if(selected==='aqueduct')html=`<p>Eksik kemeri geçmişten getir.<br>Kaynağın kapağını aç ve suyu biriktir.</p><div class="control-row"><label id="source-label">Kaynak kapağı</label><button class="switch" id="source" aria-labelledby="source-label" aria-pressed="${state.sourceOpen}"></button></div>${meter('Sarnıç','basin')}<p class="panel-note" id="intake-note"></p>${state.gate?'<button class="mini" data-go="garden">Bahçedeki su yollarını incele ↗</button>':''}`;
 if(selected==='garden')html=state.gate?`<p>Sarnıçtaki suyu iki bahçeye paylaştır.<br>Her havuzu en az %64 doldur.</p><div class="segment" role="group" aria-label="Su yönü">${['Sol','Sağ','İkisi'].map((t,i)=>`<button data-route="${i}" aria-pressed="${state.distributor===i}">${t}</button>`).join('')}</div>${meter('Sol bahçe','left')}${meter('Sağ bahçe','right')}<p class="panel-note" id="garden-note"></p><div id="mosaic" class="clue" ${state.seen.includes('mosaic')?'':'hidden'}><span>Duvarın hatırası</span><b>I · III · II</b></div>${state.garden?'<button class="mini" data-go="organ">Çalgıya yaklaş ↗</button>':''}`:`<p>Kapı kapalı. Kemerden geçen su sarnıcı doldurunca çark bu kapıyı kaldıracak.</p><button class="mini" data-go="aqueduct">Kemere dön ↗</button>`;
 if(selected==='organ')html=state.garden?`<p>Kırık boruları geçmişten tamamla.<br>Üç halkayı duvardaki izlere göre ayarla.</p>${meter('Hava basıncı','pressure')}<div class="tuning">${state.notes.map((n,i)=>`<button data-note="${i}" aria-label="${i+1}. halka, ${icons[n]}. Döndür"><small>${['BİRİNCİ','İKİNCİ','ÜÇÜNCÜ'][i]}</small><span>${icons[n]}</span></button>`).join('')}</div>${state.seen.includes('mosaic')?'<div class="clue"><span>Hatırladığın izler</span><b>I · III · II</b></div>':'<button class="mini" data-go="garden">Bahçe duvarının geçmişini incele ↗</button>'}<button id="perform" class="primary perform">${state.finished?'Yeniden dinle':'Vadiyi uyandır'}<span>♫</span></button>`:`<p>Boruların içi sessiz. İki bahçe suya kavuştuğunda bu yapının mekanizması açılacak.</p><button class="mini" data-go="garden">Bahçeyi incele ↗</button>`;
 $('#area-controls').innerHTML=html;
}
function updateUI(){
 const c=chapter(state),stories=[['01','KIRIK KEMER','Suyun izini bul.','Kemerin eksik parçası suyu tutamıyor. Geçmişin yardımına ihtiyacın var.'],['02','TERAS BAHÇELERİ','İki bahçe, tek kaynak.','Suyu iki yana paylaştır. Sarnıç boşalırsa kemere dön; biriktirdiğin su kaybolmaz.'],['03','SESSİZ ÇALGI','Taşın içindeki şarkı.','Bahçenin geçmişinde üç iz saklı. Çalgının borularını tamamla ve halkaları ayarla.'],['✧','UYANAN VADİ','Sessizlik çözüldü.','Artık acele yok. Kamerayı gezdir, suyun yollarını ve vadinin yeni sesini keşfet.']];
 for(const [id,i] of [['chapter-no',0],['chapter-label',1],['chapter-title',2],['chapter-copy',3]])$('#'+id).textContent=stories[c][i];
 $('#lens').setAttribute('aria-pressed',state.lens);$('#lens>span:nth-child(2)').innerHTML=`${state.lens?'Bugüne dön':'Geçmişi arala'}<small>${state.lens?'MERCEK AÇIK':'ZAMAN MERCEĞİ'}</small>`;$('#era-label').textContent=state.lens?'GEÇMİŞ ARALANDI':'BUGÜN';
 document.querySelectorAll('[data-area]').forEach(b=>{b.classList.toggle('selected',b.dataset.area===selected);b.setAttribute('aria-pressed',b.dataset.area===selected);const l=b.querySelector('.lock');if(l)l.textContent=(b.dataset.area==='garden'?state.gate:state.garden)?'✓':'·'});
 for(const [key,value] of [['basin',state.basin],['left',state.left],['right',state.right],['pressure',state.pressure]]){const e=$('#'+key);if(e){const n=Math.round(value*100);e.firstElementChild.style.width=n+'%';e.setAttribute('aria-valuenow',n);$('#'+key+'-value').textContent=n+'%';}}
 if($('#intake-note'))$('#intake-note').textContent=state.gate?'Kapı açıldı. Sarnıç bahçelere su taşıyor.':!state.sourceOpen?'Önce kaynak kapağını aç.':flow.intake?'Su akıyor. Sarnıç %70 olduğunda kapı açılacak.':'Su boşluktan dökülüyor. Merceği kırık kemerin üzerinde tut.';
 if($('#garden-note'))$('#garden-note').textContent=state.basin<.04?'Sarnıç boşaldı. Kemerin geçmişini aralayıp yeniden doldur.':'Sarnıç: %'+Math.round(state.basin*100)+' · Geçmişte duvarın motiflerini ara.';
 if($('#perform'))$('#perform').disabled=!state.finished&&state.pressure<.65;
 for(const [area,e] of Object.entries(markerEls)){e.classList.toggle('active',area===selected);e.classList.toggle('visited',area==='aqueduct'?state.gate:area==='garden'?state.garden:state.finished);}
}
const markerEls={};
function setupMarkers(){for(const [a,v] of Object.entries(areas)){const b=document.createElement('button');b.className='marker';b.dataset.worldArea=a;b.setAttribute('aria-label',v.title+' alanına yaklaş');b.innerHTML=`<i>${a==='aqueduct'?'01':a==='garden'?'02':'03'}</i><span>${v.title}</span>`;b.addEventListener('click',()=>choose(a));$('#markers').append(b);markerEls[a]=b;}}
function positionMarkers(){for(const [a,b] of Object.entries(markerEls)){const p=world.project({x:areas[a].marker[0],y:areas[a].marker[1],z:areas[a].marker[2]});b.style.left=p.x+'px';b.style.top=p.y+'px';b.hidden=!state.started||!p.visible||p.y<80||p.y>innerHeight-130;}}
function begin(){state.started=true;$('#intro').hidden=true;for(const id of ['story','controls','toolbar','gesture'])$('#'+id).hidden=false;choose(lastChapter===0?'aqueduct':lastChapter===1?'garden':'organ');notify('Dokun, yaklaş, keşfet. İlk adım: kemerin geçmişini arala.',5000);save();}
$('#begin').addEventListener('click',begin);
$('#lens').addEventListener('click',toggleLens);$('#overview').addEventListener('click',()=>{setView('overview');notify('Vadinin tamamı. Bir işarete dokunarak yeniden yaklaşabilirsin.',3500)});
for(const b of document.querySelectorAll('[data-area]'))b.addEventListener('click',()=>choose(b.dataset.area));
$('#area-controls').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.id==='source'){state.sourceOpen=!state.sourceOpen;b.setAttribute('aria-pressed',state.sourceOpen);audio.note(state.sourceOpen?1:0,1,.035);}
 if(b.dataset.route!==undefined){state.distributor=Number(b.dataset.route);renderControls();audio.note(state.distributor+1,1,.035);}
 if(b.dataset.go)choose(b.dataset.go);
 if(b.dataset.note!==undefined){const i=Number(b.dataset.note);state.notes[i]=(state.notes[i]+1)%5;audio.note(state.notes[i],1.4,.085);b.querySelector('span').textContent=icons[state.notes[i]];b.setAttribute('aria-label',`${i+1}. halka, ${icons[state.notes[i]]}. Döndür`);}
 if(b.id==='perform'){
  if(state.finished){state.finaleTime=0;endingShown=false;setView('overview');audio.cue('finale');}
  else {const result=perform(state);if(result==='success'){audio.cue('finale');setView('overview');state.lens=true;state.lensArea='organ';world.focusLens('organ');renderControls();notify('Suyun tuttuğu nefes, şimdi bir şarkı.',6500);save();}else if(result==='tuning')notify('Sesler henüz birleşmiyor. Bahçe duvarındaki üç motifi hatırla.');else if(result==='pressure')notify('Önce boruların geçmişini arala; hava basıncının yükselmesini bekle.');}
 }
 updateUI();save();
});
$('#hint').addEventListener('click',()=>{const c=chapter(state),hints=[['“Geçmişi arala” ile kırık kemeri tamamla; sağdaki kaynak kapağını aç.','Mercek açıkken su sarnıca akar. Sarnıç %70 dolunca bahçe kapısı açılır.'],['Bahçeye yaklaş ve su yönünü “İkisi” yap. İki havuz da en az %64 dolmalı.','Sarnıç boşaldıysa kemere dönüp geçmişi arala. Sonra bahçeye dön. Bahçenin geçmişindeki motifleri de incele.'],['Bahçedeyken geçmişi arala. Üç motif, çalgının üç halkasının sırasını gösterir.','Çalgıda geçmişi arala, basıncı bekle. Halkalar sırasıyla I, III, II olmalı.'],['Vadide istediğin yere yaklaşabilirsin. Ayarlardan yeniden başlayabilirsin.']];notify(hints[c][Math.min(hintLevel++,hints[c].length-1)],9000)});
$('#sound').addEventListener('click',async()=>{muted=!muted;try{await audio.enable(!muted);$('#sound').setAttribute('aria-pressed',!muted);$('#sound').setAttribute('aria-label',muted?'Sesi aç':'Sesi kapat');if(!muted)audio.note(0,3,.06);}catch{muted=true;notify('Ses bu tarayıcıda başlatılamadı. Deneyimi sessiz sürdürebilirsin.');}});
for(const [id,dialog] of [['help','help-dialog'],['settings','settings-dialog']])$('#'+id).addEventListener('click',()=>{if(id==='settings'){const s=world.stats();$('#performance').textContent=`Bu oturum: yaklaşık ${s.fps} kare/sn · ${s.quality} kalite`;}$('#'+dialog).showModal();});
for(const b of document.querySelectorAll('.dialog-close'))b.addEventListener('click',()=>b.closest('dialog').close());
for(const d of document.querySelectorAll('dialog'))d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});
$('#quality').addEventListener('change',e=>world.quality(e.target.value));$('#reduce-motion').checked=reduced;$('#reduce-motion').addEventListener('change',e=>{reduced=e.target.checked;document.body.classList.toggle('reduced',reduced)});
$('#restart').addEventListener('click',()=>{$('#settings-dialog').close();$('#restart-dialog').showModal()});$('#confirm-restart').addEventListener('click',()=>{state=freshState();state.started=true;lastChapter=0;endingShown=false;$('#ending').hidden=true;$('#restart-dialog').close();choose('aqueduct');save();notify('Vadi yeniden sessiz. Suyun yolunu sen biliyorsun.');});
$('#keep-exploring').addEventListener('click',()=>{$('#ending').hidden=true;notify('Vadi senin. İstediğin kadar kal.',4000)});
canvas.addEventListener('pointerdown',e=>{
 if(!state.started)return;canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointers.size===2){const [a,b]=[...pointers.values()];gesture={type:'pinch',distance:Math.hypot(a.x-b.x,a.y-b.y)};return;}
 const lp=world.project(world.lens.position.value),d=Math.hypot(e.clientX-lp.x,e.clientY-lp.y);gesture={type:state.lens&&d<95?'lens':'orbit',x:e.clientX,y:e.clientY};
});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)||!gesture)return;const old=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointers.size===2){const [a,b]=[...pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(gesture.type==='pinch')target.radius=Math.max(22,Math.min(115,target.radius*gesture.distance/Math.max(2,d)));gesture={type:'pinch',distance:d};return;}
 if(gesture.type==='lens'){world.dragLens(e.clientX,e.clientY,selected);}else{target.yaw-=(e.clientX-old.x)*.005;target.pitch=Math.max(.22,Math.min(1.12,target.pitch+(e.clientY-old.y)*.004));}
});
function release(e){pointers.delete(e.pointerId);if(pointers.size===0)gesture=null;else if(pointers.size===1)gesture={type:'orbit'};}
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
canvas.addEventListener('wheel',e=>{e.preventDefault();target.radius=Math.max(22,Math.min(115,target.radius*Math.exp(e.deltaY*.001)))},{passive:false});
window.addEventListener('keydown',e=>{if(!state.started||document.querySelector('dialog[open]')||e.target.matches('input,select,button'))return;let handled=true;
 if(e.code==='Space')toggleLens();else if(e.key==='1')choose('aqueduct');else if(e.key==='2')choose('garden');else if(e.key==='3')choose('organ');else if(e.key==='ArrowLeft')target.yaw-=.1;else if(e.key==='ArrowRight')target.yaw+=.1;else if(e.key==='ArrowUp')target.pitch=Math.max(.22,target.pitch-.07);else if(e.key==='ArrowDown')target.pitch=Math.min(1.12,target.pitch+.07);else if(e.key==='+'||e.key==='=')target.radius=Math.max(22,target.radius*.9);else if(e.key==='-')target.radius=Math.min(115,target.radius*1.1);else handled=false;if(handled)e.preventDefault();});
window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){save();audio.suspend()}else audio.resume()});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();save();notify('Görüntü durdu. Tarayıcı sahneyi yeniden hazırladığında devam edeceğiz.',20000)});canvas.addEventListener('webglcontextrestored',()=>location.reload());
function frame(now){if(failure)return;requestAnimationFrame(frame);if(document.hidden){last=0;return;}const dt=last?Math.min((now-last)/1000,.1):.016;last=now;time+=dt;
 if(!state.started&&!reduced)target.yaw+=dt*.018;
 const k=reduced?1:1-Math.exp(-dt*2.6);for(const key of ['yaw','pitch','radius'])view[key]+=(target[key]-view[key])*k;for(let i=0;i<3;i++)view.target[i]+=(target.target[i]-view.target[i])*k;
 const covered=world.coverage(state.lensArea);flow=tick(state,dt,covered);
 if(state.started&&selected==='garden'&&state.gate&&state.lens&&covered>.7&&!state.seen.includes('mosaic')){state.seen.push('mosaic');notify('Duvarın geçmişinde üç iz: I · III · II. Hatırlamak üzere kaydettin.',7500);renderControls();save();}
 const c=chapter(state);if(c!==lastChapter){lastChapter=c;hintLevel=0;renderControls();if(c===1){notify('Çark dönüyor. Bahçe kapısı açıldı.',6000);audio.cue('gate')}if(c===2){notify('İki bahçe de uyandı. Suyun son durağı: sessiz çalgı.',7000);audio.cue('garden')}save();}
 world.setCamera(view);world.update(dt,time,state,flow,reduced);positionMarkers();audio.update(state,flow,time);
 if(state.finished&&state.finaleTime>10&&!endingShown){endingShown=true;$('#ending').hidden=false;save();}
 uiTimer+=dt;saveTimer+=dt;if(uiTimer>.2){updateUI();uiTimer=0;}if(saveTimer>4){save();saveTimer=0;}
}
try{world=createWorld(canvas);setupMarkers();setView('overview');view={...target,target:[...target.target]};renderControls();updateUI();requestAnimationFrame(frame);requestAnimationFrame(()=>{$('#loading').hidden=true;if(state.started){for(const id of ['story','controls','toolbar','gesture'])$('#'+id).hidden=false;choose(lastChapter===0?'aqueduct':lastChapter===1?'garden':'organ');if(state.finished)setView('overview');}else $('#intro').hidden=false;});}catch(e){fail(e);}
