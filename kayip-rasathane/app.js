const modal=document.querySelector('#modal');
const panel=document.querySelector('#panel-content');
const announce=document.querySelector('#announce');
const progress=document.querySelector('#progress');
const caption=document.querySelector('#scene-caption');
const scene=document.querySelector('.experience');
const targets=[3,9,6], positions=[12,12,12], labels=['Yıldız','Ay','Güneş'];
const directions={12:'KUZEY',3:'DOĞU',6:'GÜNEY',9:'BATI'};
let seenNote=false, solved=false, active='';let lastFocus=null;
const idx=(n)=>(n+11)%12+1;
const dir=(n)=>directions[n]||`${n} KONUMU`;
function open(name){active=name;lastFocus=document.activeElement;modal.hidden=false;document.body.classList.add('locked');draw(name);document.querySelector('.close').focus();}
function close(){modal.hidden=true;document.body.classList.remove('locked');lastFocus?.focus();}
function header(no,kicker,title,copy){return `<div class="panel-no">${no} / ${kicker}</div><h2 id="panel-title">${title}</h2><p class="panel-copy">${copy}</p>`;}
function draw(name){
 if(name==='notebook'){
   seenNote=true;
   panel.innerHTML=header('01','GÖZLEM DEFTERİ','Üç ışığın yönü','Son gözlemin soluk sayfalarında aceleyle yazılmış bir satır kaldı.')+`<div class="paper"><div class="paper-heading">SON GECE / GÖZLEM 17</div><p>Yıldız <b>doğuda</b> parladı.<br>Ay <b>batıda</b> bekledi.<br>Güneş <b>güneyde</b> saklandı.</p><span>Üç halkayı aynı sırayla çevir.<br>Üst nokta kuzeydir. ← B &nbsp; K ↑ &nbsp; D → &nbsp; G ↓</span></div><p class="panel-hint">Düzeneğe dokunup halkaları yönlere getir.</p>`;
 } else if(name==='mechanism'){
   const rows=labels.map((label,i)=>`<div class="dial-row"><div class="dial-icon">${['✧','☾','☼'][i]}</div><div class="dial-meta"><b>${label}</b><span>${dir(positions[i])}</span></div><button type="button" class="dial-arrow" data-rotate="${i}" data-step="-1" aria-label="${label} halkasını sola çevir">−</button><div class="dial" style="--turn:${positions[i]*30}deg"><span></span><i>${positions[i]}</i></div><button type="button" class="dial-arrow" data-rotate="${i}" data-step="1" aria-label="${label} halkasını sağa çevir">+</button></div>`).join('');
   panel.innerHTML=header('02','YILDIZ DÜZENEĞİ','Halkaları hizala','Her halka bir ışığı temsil ediyor. Yukarıdaki işaret kuzeyi gösterir.')+`<div class="dial-list">${rows}</div><button class="activate" type="button" id="activate" ${positions.every((p,i)=>p===targets[i])?'':'disabled'}>${solved?'GÖKYÜZÜ AÇILDI':'GÖKYÜZÜNÜ AÇ'} <span>↗</span></button><p class="panel-hint">${seenNote?'Defterdeki üç yönü sırayla uygula.':'İpucu: Sol taraftaki gözlem defterinde son geceye ait bir not var.'}</p>`;
 } else if(name==='telescope'){
   panel.innerHTML=solved?header('03','TELESKOP','Kaybolmayan ışık','Merceğe baktığında eskiden boş olan yerde yedi ışık yanıyor.')+`<div class="reveal-symbol">✦ · ✧ · ✦ · ✧ · ✦</div><p class="story">“Hiçbir yıldız kaybolmaz. Bazen yalnızca onu göreceğimiz yönü unuturuz.”</p><p class="panel-hint">Rasathanenin son gözlemi artık seninle.</p>`:header('03','TELESKOP','Mercek bekliyor','Gökyüzü görünür, ama mercekteki yıldız çizgisi tamamlanmıyor.')+`<div class="telescope-mark">◌</div><p class="panel-hint">Önce defteri bul ve düzeneği çalıştır.</p>`;
 } else {
   panel.innerHTML=solved?header('04','GÖKYÜZÜ','Rasathane uyandı','Kubbede unutulan yıldızlar birbirine yeniden bağlandı.')+`<div class="reveal-symbol">✧ &nbsp; ✦ &nbsp; ✧</div><p class="story">Yedi noktanın hikâyesini teleskopta keşfet.</p>`:header('04','GÖKYÜZÜ','Sessiz kubbe','Tavanın açık halkasında yıldızlar var; aralarındaki çizgiler ise henüz görünmüyor.')+`<div class="telescope-mark">✧</div><p class="panel-hint">Üç halkanın yönü bu göğün anahtarı.</p>`;
 }
}
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>open(b.dataset.open)));
document.querySelector('.close').addEventListener('click',close);
document.querySelector('.shade').addEventListener('click',close);
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close();if(e.key==='Tab'&&!modal.hidden){const f=[...modal.querySelectorAll('button:not([disabled])')];if(!f.length)return;const first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
panel.addEventListener('click',e=>{const rotate=e.target.closest('[data-rotate]');if(rotate){const i=+rotate.dataset.rotate;positions[i]=idx(positions[i]+(+rotate.dataset.step));draw('mechanism');panel.querySelector(`[data-rotate="${i}"][data-step="${rotate.dataset.step}"]`)?.focus();announce.textContent=`${labels[i]} ${dir(positions[i])}`;return;}
 if(e.target.closest('#activate')&&!solved){solved=true;scene.classList.add('solved');progress.textContent='YILDIZLAR UYANDI';caption.textContent='02 / YENİDEN BULUNAN IŞIK';announce.textContent='Gökyüzü açıldı! Teleskobu incele.';draw('sky');}
});
document.querySelector('#reset').addEventListener('click',()=>{positions.fill(12);seenNote=false;solved=false;scene.classList.remove('solved');progress.textContent='DÜZENEK SESSİZ';caption.textContent='01 / KAYIP GÖZLEM';announce.textContent='Hikâye yeniden başladı';if(!modal.hidden)close()});
