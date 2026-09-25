'use strict';
(()=>{
let context=null,fxBus=null,nodes=[],sfxOn=true,reader=null,ambient=null,lastMode='',lastPhase='',nextAccent=0,unlocked=false,endingNodes=[];
let enabled=true;try{enabled=localStorage.getItem('ark-sound-enabled')!=='off'}catch(e){}
function audioBus(){if(!context)return null;if(!fxBus){fxBus=context.createGain();fxBus.gain.value=.72;const comp=context.createDynamicsCompressor();comp.threshold.value=-19;comp.knee.value=18;comp.ratio.value=5;comp.attack.value=.008;comp.release.value=.35;fxBus.connect(comp).connect(context.destination)}return fxBus}
function duckFX(speaking){if(!context)return;const bus=audioBus();bus.gain.setTargetAtTime(speaking?.42:.78,context.currentTime,.18)}
function tone(freq,start,duration,volume=.05,end=freq,wave='sine'){if(!context||!sfxOn)return;const o=context.createOscillator(),g=context.createGain();o.type=wave;o.frequency.setValueAtTime(freq,context.currentTime+start);o.frequency.exponentialRampToValueAtTime(end,context.currentTime+start+duration);g.gain.setValueAtTime(.0001,context.currentTime+start);g.gain.exponentialRampToValueAtTime(volume,context.currentTime+start+.06);g.gain.setTargetAtTime(.0001,context.currentTime+start+duration*.48,duration*.19);o.connect(g).connect(audioBus());o.start(context.currentTime+start);o.stop(context.currentTime+start+duration);nodes.push(o)}
function noise(duration,volume,cutoff=650,start=0){if(!context||!sfxOn)return;const b=context.createBuffer(1,context.sampleRate*duration,context.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++){const x=i/d.length;d[i]=(Math.random()*2-1)*Math.min(1,x*24)*Math.pow(1-x,1.5)}const n=context.createBufferSource(),f=context.createBiquadFilter(),g=context.createGain();n.buffer=b;f.type='lowpass';f.frequency.value=cutoff;g.gain.value=volume;n.connect(f).connect(g).connect(audioBus());n.start(context.currentTime+start);nodes.push(n)}
function victoryMusic(){
 if(!context||!sfxOn)return;
 const hz=m=>440*Math.pow(2,(m-69)/12);
 // C / F / G / C, voiced gently beneath a clear celebratory motif.
 [[48,55,60,64],[41,53,57,60],[43,55,59,62],[48,55,60,64,67]].forEach((chord,bar)=>{
  chord.forEach((m,j)=>tone(hz(m),bar*2.1+j*.025,bar===3?3.65:2.7,.035,hz(m),'triangle'));
 });
 [[0,64,.65],[.65,67,.65],[1.3,72,.85],[2.1,69,.65],[2.75,72,.65],[3.4,76,.85],[4.2,74,.65],[4.85,71,.65],[5.5,67,.8],[6.3,72,3.5]].forEach(([t,m,d])=>{
  tone(hz(m),t,d,.12,hz(m),'triangle');
  tone(hz(m+12),t+.02,d,.028);
  tone(hz(m),t+.24,d,.023);
 });
 [0,2.1,4.2,6.3].forEach(t=>tone(95,t,.48,.12,42));
 noise(1.7,.10,2600,6.3);
}

function retryMusic(){if(!context||!sfxOn)return;const hz=m=>440*Math.pow(2,(m-69)/12);
 // A gentle D-sus opening resolves to D major: determination, not a funeral cue.
 [[50,57,62,67],[43,55,59,62],[45,57,61,64],[50,57,62,66]].forEach((chord,bar)=>chord.forEach(m=>tone(hz(m),bar*2,bar===3?3:2.4,.032,hz(m),'triangle')));
 [[0,62],[.8,64],[1.6,69],[2.6,67],[3.4,66],[4.2,64],[5,69],[6,74]].forEach(([t,m])=>{tone(hz(m),t,t===6?3:1,.09,hz(m),'triangle');tone(hz(m),t+.2,1.5,.022)});
}
function stopNodes(list){for(const n of list)try{n.stop()}catch(e){}}
function halt(){stopNodes(nodes);nodes=[];stopNodes(endingNodes);endingNodes=[];if(ambient){stopNodes(ambient.sources);ambient=null}lastMode=''}
function beginAmbient(mode){if(mode===lastMode)return;lastMode=mode;
 if(ambient){const old=ambient;old.gain.gain.setTargetAtTime(.0001,context.currentTime,.25);setTimeout(()=>{stopNodes(old.sources);old.gain.disconnect()},1200);ambient=null}
 if(!mode)return;
 const gain=context.createGain();gain.gain.value=0;gain.connect(audioBus());gain.gain.setTargetAtTime(mode==='wind'?.11:.06,context.currentTime,.7);
 const sources=[];if(mode==='cruise'){const o=context.createOscillator(),g=context.createGain();o.frequency.value=58;g.gain.value=.22;o.connect(g).connect(gain);o.start();sources.push(o)}
 ambient={gain,sources};
}
function classify(s){if(s.paused||s.finale||s.ended||s.child)return '';if(s.crisis)return 'crisis';if(/surface|test|explor|extract|report|alien/i.test(s.phase))return '';if(/cruise|travel|departure|approach|discovery/i.test(s.phase))return 'cruise';if(/board/i.test(s.phase))return 'boarding';return 'cabin'}
function accent(mode){if(mode==='crisis'){noise(.16,.22,4200);noise(2.8,.18,220,.22);tone(140,0,.8,.07,65);noise(1.8,.13,1400);tone(650,.25,.2,.05)}else if(mode==='wind'){return}else if(mode==='cruise'){tone(95,0,3,.07,46)}else{tone(480,0,.14,.025);tone(720,.18,.2,.018)}}
function update(){if(!reader)return;const s=reader(),speaking=!!window.speechSynthesis?.speaking;
 if(s.legacy&&s.legacy.muted===enabled)s.legacy.toggle();
 s.legacy?.setDucking?.(speaking);
 const button=document.getElementById('simpleSound');if(button){button.textContent=enabled?'🔊 SOUND ON':'🔇 SOUND OFF';button.title='Environment, effects and ending music. Voice has its own setting in Pause.';button.onclick=()=>toggle();button.setAttribute('aria-pressed',String(enabled))}
 const caption=document.querySelector('#secondChanceFilm > .sc-caption');if(caption&&!caption.querySelector('.sound410')){const b=document.createElement('button');b.className='sound410';b.onclick=()=>toggle();caption.appendChild(b)}document.querySelectorAll('.sound410').forEach(b=>b.textContent=enabled?'SOUND ON':'SOUND OFF');
 if(!context||!unlocked)return;sfxOn=enabled&&!s.muted;const silent=!sfxOn||s.paused||s.child;
 audioBus().gain.setTargetAtTime(silent?0:(s.volume??1)*(speaking?.24:.78),context.currentTime,.15);
 const mode=silent?'':classify(s);beginAmbient(mode);
 if(mode&&s.phase!==lastPhase){lastPhase=s.phase;accent(mode);nextAccent=Date.now()+18000}
 if(mode&&Date.now()>nextAccent){accent(mode);nextAccent=Date.now()+18000+Math.random()*7000}
}
function toggle(){enabled=!enabled;try{localStorage.setItem('ark-sound-enabled',enabled?'on':'off')}catch(e){}const s=reader?.();if(s?.legacy&&s.legacy.muted===enabled)s.legacy.toggle();if(!enabled){halt();if(fxBus)fxBus.gain.setValueAtTime(0,context.currentTime)}update()}
let openingPlayed=false;
function openingCue(){if(openingPlayed||!enabled||!context||context.state!=='running')return;openingPlayed=true;sfxOn=true;audioBus();tone(110,0,1.3,.12,165,'triangle');[330,440,660].forEach((hz,i)=>tone(hz,.12+i*.17,1.1,.09,hz,'sine'));}
function unlock(){try{
 context=context||window.AC||new(window.AudioContext||window.webkitAudioContext)();
 const ready=()=>{if(context.state!=='running')return;unlocked=true;const s=reader?.();if(s?.legacy&&s.legacy.muted===enabled)s.legacy.toggle();openingCue();update()};
 if(context.state==='running')ready();else context.resume().then(ready).catch(()=>{});
}catch(e){}}
window.addEventListener('load',unlock,{once:true});
window.addEventListener('pointerdown',unlock,{capture:true});window.addEventListener('keydown',unlock,{capture:true});
window.addEventListener('pagehide',halt);document.addEventListener('visibilitychange',update);
window.ARKAudio={connect(fn){reader=fn;update()},enabled:()=>enabled,toggle,setEnabled(value){if(!!value!==enabled)toggle()},ending(kind){if(!context||!enabled)return;halt();sfxOn=true;const start=nodes.length;if(kind==='retry')retryMusic();else victoryMusic();endingNodes=nodes.splice(start)},stop:halt};
setInterval(update,180);
})();
