export class Soundscape {
 constructor(){this.ctx=null;this.enabled=false;this.voices=[];this.lastNote=0;this.step=0;}
 async enable(value){
  this.enabled=value;
  if(!value){if(this.ctx)this.master.gain.setTargetAtTime(0,this.ctx.currentTime,.15);return;}
  if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;this.ctx=new AC();const c=this.ctx;
   this.master=c.createGain();this.master.gain.value=0;this.master.connect(c.destination);
   const compressor=c.createDynamicsCompressor();compressor.threshold.value=-22;compressor.ratio.value=3;compressor.connect(this.master);this.bus=compressor;
   const impulse=c.createBuffer(2,c.sampleRate*2.8,c.sampleRate);for(let ch=0;ch<2;ch++){const d=impulse.getChannelData(ch);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2.7)*.4;}
   this.reverb=c.createConvolver();this.reverb.buffer=impulse;const wet=c.createGain();wet.gain.value=.26;this.reverb.connect(wet);wet.connect(compressor);
   const noise=c.createBuffer(1,c.sampleRate*4,c.sampleRate),d=noise.getChannelData(0);let old=0;for(let i=0;i<d.length;i++){old=(old+Math.random()*.035-.0175)*.98;d[i]=old;}
   const wind=c.createBufferSource();wind.buffer=noise;wind.loop=true;this.windFilter=c.createBiquadFilter();this.windFilter.type='lowpass';this.windFilter.frequency.value=550;const wg=c.createGain();wg.gain.value=.28;wind.connect(this.windFilter);this.windFilter.connect(wg);wg.connect(compressor);wind.start();
   const water=c.createBufferSource();water.buffer=noise;water.loop=true;const wf=c.createBiquadFilter();wf.type='bandpass';wf.frequency.value=1800;wf.Q.value=.35;this.waterGain=c.createGain();this.waterGain.gain.value=0;water.connect(wf);wf.connect(this.waterGain);this.waterGain.connect(compressor);water.start();
   for(const hz of [130.81,196]){const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=hz;g.gain.value=.018;o.connect(g);g.connect(compressor);g.connect(this.reverb);o.start();}
  }
  await this.ctx.resume();this.master.gain.setTargetAtTime(.7,this.ctx.currentTime,.4);
 }
 note(n,duration=2,strength=.1){if(!this.ctx||!this.enabled)return;const c=this.ctx,t=c.currentTime;
  const freqs=[261.63,293.66,329.63,392,440];const hz=freqs[((n%5)+5)%5];
  for(const [harm,amp] of [[1,1],[2,.14],[3,.055]]){const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=hz*harm;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(strength*amp,t+.035);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(this.bus);g.connect(this.reverb);o.start(t);o.stop(t+duration+.1);}
 }
 cue(type){const notes=type==='gate'?[0,2,3]:type==='garden'?[2,3,4]:[1,3,2];notes.forEach((n,i)=>setTimeout(()=>this.note(n,3,.08),i*240));}
 update(s,flow,time){if(!this.ctx||!this.enabled)return;const t=this.ctx.currentTime;this.waterGain.gain.setTargetAtTime((flow.intake*.8+flow.wheel*.2+(s.finished?.6:0)),t,.8);this.windFilter.frequency.setTargetAtTime(s.lens?380:650,t,.8);
  const interval=s.finished?1.1:s.garden?4.8:s.gate?6.5:10;
  if(time-this.lastNote>interval){this.lastNote=time;const phrase=s.finished?[1,3,2,0,2,4,3,1,0,2,3,2]:[0,3,2,1,3,4];this.note(phrase[this.step++%phrase.length],s.finished?3:4,s.finished?.07:.04);}
 }
 suspend(){if(this.ctx)this.ctx.suspend();}
 resume(){if(this.ctx&&this.enabled)this.ctx.resume();}
}
