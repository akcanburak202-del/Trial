export const VERSION = 1;
export const AREAS = ['aqueduct','garden','organ'];
export function freshState(){return {version:VERSION,started:false,lens:false,lensArea:'aqueduct',sourceOpen:false,distributor:0,basin:0,left:0,right:0,pressure:0,gate:false,garden:false,finished:false,notes:[0,0,0],elapsed:0,finaleTime:0,seen:[]};}
export function restoreState(raw){
  const s=freshState();
  if(!raw||raw.version!==VERSION)return s;
  for(const k of ['started','sourceOpen','gate','garden','finished'])s[k]=raw[k]===true;
  for(const k of ['basin','left','right','pressure'])s[k]=Number.isFinite(raw[k])?Math.max(0,Math.min(1,raw[k])):0;
  s.distributor=[0,1,2].includes(raw.distributor)?raw.distributor:0;
  s.notes=Array.isArray(raw.notes)&&raw.notes.length===3?raw.notes.map(n=>Number.isInteger(n)&&n>=0&&n<=4?n:0):[0,0,0];
  s.elapsed=Number.isFinite(raw.elapsed)?Math.max(0,raw.elapsed):0;
  s.finaleTime=s.finished?30:0;
  s.seen=Array.isArray(raw.seen)?raw.seen.filter(v=>typeof v==='string'&&v.length<40).slice(0,20):[];
  // A session always resumes in the present; reservoirs retain their water.
  return s;
}
export function chapter(s){return s.finished?3:s.garden?2:s.gate?1:0;}
export function tick(s,dt,coverage=1){
  dt=Math.max(0,Math.min(.1,dt));
  if(!s.started)return {intake:0,left:0,right:0,wheel:0,organ:0};
  s.elapsed+=dt;
  const intact=s.lens&&s.lensArea==='aqueduct'&&coverage>.7;
  const intake=s.sourceOpen&&intact?1:0;
  s.basin=Math.min(1,s.basin+intake*dt*.07);
  if(s.basin>=.7)s.gate=true;
  let left=0,right=0;
  if(s.gate&&s.basin>0){
    const amount=Math.min(s.basin,dt*.028);
    const lf=s.distributor===0?1:s.distributor===2?.5:0;
    const rf=1-lf;
    const l=Math.min(1-s.left,amount*lf*1.18),r=Math.min(1-s.right,amount*rf*1.18);
    s.left+=l;s.right+=r;s.basin-=(l+r)/1.18;
    left=l/dt;right=r/dt;
  }
  if(s.left>=.64&&s.right>=.64)s.garden=true;
  const organReady=s.garden&&s.lens&&s.lensArea==='organ'&&coverage>.7;
  s.pressure=Math.max(0,Math.min(1,s.pressure+dt*(organReady?.18:-.055)));
  if(s.finished)s.finaleTime+=dt;
  return {intake,left,right,wheel:s.gate?Math.min(1,s.basin*2):s.basin,organ:organReady?1:0};
}
export function perform(s){
  if(!s.garden)return 'garden';
  if(s.pressure<.65)return 'pressure';
  if(!s.notes.every((n,i)=>n===[1,3,2][i]))return 'tuning';
  s.finished=true;s.finaleTime=0;return 'success';
}
