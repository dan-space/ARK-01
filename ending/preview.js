'use strict';
// Each spoken turn owns its picture. No cinematic clock can outrun speech.
const scenes={
 silence:['ark01-deep-space.webp','THREE WORLDS · NO HOME','NO WORLD LEFT','Three candidates. Three impossible futures.'],
 signal:['ark01-sensor-station.webp','UNRESOLVED TRANSMISSION','UNKNOWN SIGNAL','An unidentified pattern in the silence.'],
 journey:['ark01-deep-space.webp','UNIDENTIFIED SOURCE · FINAL VECTOR','ONE LAST JOURNEY','Following a signal, not a promise.'],
 readings:['ark01-sensor-station.webp','ATMOSPHERIC ANALYSIS','FAMILIAR READINGS','Something in the data feels familiar.'],
 debris:['ark01-sensor-station.webp','HUMAN ORBITAL DEBRIS','HUMAN ORIGIN CONFIRMED','Human technology. Familiar orbital fragments.'],
 match:['ark01-sensor-station.webp','COASTLINE MATCH · VERIFIED','SIGNATURE MATCH','The bridge falls quiet.'],
 earth:['earth-second-chance.png','OUR HOME · STILL ALIVE','EARTH','We have come home.'],
 home:['earth-second-chance.png','RETURN COURSE · CONFIRMED','A SECOND CHANCE','Not another world to use up. A home to care for.']
};
const turns=[
  [
    "silence",
    "alex",
    "Three worlds. Not one home. Where do we go now?",
    0.98
  ],
  [
    "signal",
    "marcus",
    "Wait. An unknown signal. That pattern feels strangely familiar.",
    1.06
  ],
  [
    "journey",
    "elena",
    "Let's trace its source. It might be old communications traffic.",
    1.04
  ],
  [
    "readings",
    "elena",
    "The air, the water... familiar. There's still life down there.",
    1.04
  ],
  [
    "debris",
    "marcus",
    "Human orbital debris! Compare the coastline with archives.",
    1.03
  ],
  [
    "match",
    "alex",
    "That coastline... I know it. Marcus, could it really be?",
    1.0
  ],
  [
    "earth",
    "marcus",
    "It's Earth! We're home! All this way... and our best chance was here, waiting for us.",
    1.08
  ],
  [
    "home",
    "elena",
    "Oh, look at her. Let's go home. Clean the water, bring back the forests. We've got another chance. This time, we care for her. All of us.",
    1.02
  ]
];
const $=id=>document.getElementById(id), synth=window.speechSynthesis;
let index=-1, generation=0, active=null, delayed=null, startWatch=null, endWatch=null, voiceOn=true, sfxOn=true, currentScene='', context=null, nodes=[], fxBus=null,effectLevel=1;
const roles={elena:'ELENA · LIFE SCIENCE',alex:'ALEX · ENGINEERING',marcus:'MARCUS · NAVIGATION'};
function clearPlayback(){duckFX(false);generation++;clearTimeout(delayed);clearTimeout(startWatch);clearTimeout(endWatch);if(active){active.onstart=active.onend=active.onerror=null;active=null}if(synth)synth.cancel()}
function stopFX(){for(const n of nodes){try{n.stop()}catch(e){}}nodes=[]}
// Layered effects feed a compressed bus; dialogue ducks the bus, not the voice.
function audioBus(){if(!context)return null;if(!fxBus){fxBus=context.createGain();fxBus.gain.value=.72;const comp=context.createDynamicsCompressor();comp.threshold.value=-19;comp.knee.value=18;comp.ratio.value=5;comp.attack.value=.008;comp.release.value=.35;fxBus.connect(comp).connect(context.destination)}return fxBus}
function duckFX(speaking){if(!context)return;const bus=audioBus();bus.gain.setTargetAtTime((speaking?.42:.78)*effectLevel,context.currentTime,.18)}
function tone(freq,start,duration,volume=.05,end=freq,wave='sine'){if(!context||!sfxOn)return;const o=context.createOscillator(),g=context.createGain();o.type=wave;o.frequency.setValueAtTime(freq,context.currentTime+start);o.frequency.exponentialRampToValueAtTime(end,context.currentTime+start+duration);g.gain.setValueAtTime(.0001,context.currentTime+start);g.gain.exponentialRampToValueAtTime(volume,context.currentTime+start+.06);g.gain.setTargetAtTime(.0001,context.currentTime+start+duration*.48,duration*.19);o.connect(g).connect(audioBus());o.start(context.currentTime+start);o.stop(context.currentTime+start+duration);nodes.push(o)}
function noise(duration,volume,cutoff=650,start=0){if(!context||!sfxOn)return;const b=context.createBuffer(1,context.sampleRate*duration,context.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++){const x=i/d.length;d[i]=(Math.random()*2-1)*Math.min(1,x*24)*Math.pow(1-x,1.5)}const n=context.createBufferSource(),f=context.createBiquadFilter(),g=context.createGain();n.buffer=b;f.type='lowpass';f.frequency.value=cutoff;g.gain.value=volume;n.connect(f).connect(g).connect(audioBus());n.start(context.currentTime+start);nodes.push(n)}
function cue(scene){stopFX();
 if(scene==='silence'){tone(54,0,6,.13,38);noise(5,.12,350)}
 else if(scene==='signal'){
  noise(5,.16,1400);tone(68,0,6,.17,58);
  for(let i=0;i<4;i++){tone(740,i*1.1,.65,.14);tone(980,i*1.1+.24,.85,.09);tone(370,i*1.1,.9,.07)}
 }else if(scene==='journey'){
  tone(115,0,7,.26,42,'triangle');tone(56,.15,7,.23,32);noise(6,.37,700);noise(3,.12,1500,.4);
 }else if(scene==='readings'){tone(130,0,5,.10,150);tone(520,.2,2,.08);tone(660,.7,2.5,.07);noise(4,.09,500)}
 else if(scene==='debris'){noise(4,.13,1600);for(let i=0;i<3;i++){tone(520,i*.95,.5,.13);tone(740,i*.95+.25,.7,.10)}tone(65,0,5,.15,55)}
 else if(scene==='match'){tone(46,0,2.3,.08,32)}
 else if(scene==='earth'){
  // Reveal: bass impact + hull resonance + broad air swell + ascending confirmation echoes.
  tone(105,0,6,.34,34);tone(52,0,7,.25,39);noise(5.5,.45,1100);noise(2.8,.16,2400,.2);
  [130.81,196,261.63,329.63].forEach((f,i)=>tone(f,.22+i*.19,6.5,.075));
  [523.25,659.25,783.99].forEach((f,i)=>{tone(f,.6+i*.32,2.8,.09);tone(f,1.3+i*.32,3,.035)});
 }else if(scene==='home'){
  tone(84,0,7,.19,48,'triangle');noise(7,.25,650);
  [261.63,329.63,392,523.25].forEach((f,i)=>tone(f,i*.25,6.5,.065));
 }
}
// Original ten-second victory phrase: warm rising melody, harmonic bed and a resolved final chord.
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
// Preserve the current full game's V13 primary selection rule; don't silently replace it.
function selectVoice(who){return window.ARKVoices.get(who)}
function showTurn(i){const [scene,who,text]=turns[i];if(scene!==currentScene){currentScene=scene;const [asset,stage,title,sub]=scenes[scene];$('scene').src='../assets/images/ark01/'+asset;$('scene').alt=title;$('film').dataset.scene=scene;$('stage').textContent=stage;$('title').textContent=title;$('subtitle').textContent=sub;cue(scene)}$('portrait').src='../captain_'+who+'.webp';$('portrait').alt=who;$('speaker').textContent=roles[who];$('line').textContent=text;$('progress').textContent=`DIALOGUE ${i+1} / ${turns.length}`}
function run(i){clearPlayback();if(i>=turns.length)return finish();index=i;const token=generation;let started=false,done=false;const commit=()=>{if(token!==generation)return;started=true;showTurn(i);duckFX(true);$('status').textContent='Speaking · picture and dialogue synchronized';};$('next').hidden=false;$('skip').hidden=false;$('play').hidden=true;$('replay').hidden=true;
 const fallback=message=>{if(token!==generation||done)return;done=true;duckFX(false);clearTimeout(startWatch);clearTimeout(endWatch);if(active){active.onstart=active.onend=active.onerror=null;active=null}if(synth)synth.cancel();if(!started)showTurn(i);$('status').textContent=message+' · select NEXT LINE when ready.';};
 if(!voiceOn||!synth||!window.SpeechSynthesisUtterance){fallback('Reading mode');return}
 $('status').textContent='Preparing the next voice…';const u=new SpeechSynthesisUtterance(turns[i][2]);active=u;u.lang='en-US';u.voice=selectVoice(turns[i][1]);if(!u.voice){fallback('Requested voice unavailable');return}u.rate=turns[i][3];u.pitch=turns[i][1]==='elena'?1.08:turns[i][1]==='alex'?.88:.98;u.volume=1;
 u.onstart=()=>{if(token!==generation||done)return;clearTimeout(startWatch);commit();endWatch=setTimeout(()=>fallback('Voice interrupted'),Math.max(25000,turns[i][2].length*180));};
 u.onend=()=>{if(token!==generation||done)return;done=true;duckFX(false);clearTimeout(startWatch);clearTimeout(endWatch);if(!started){showTurn(i);$('status').textContent='Select NEXT LINE when ready.';return}active=null;$('status').textContent='';delayed=setTimeout(()=>{if(token===generation)run(i+1)},turns[i][0]==='match'?1200:260)};
 u.onerror=()=>fallback('Voice unavailable');startWatch=setTimeout(()=>fallback('Voice did not start'),5000);try{synth.speak(u)}catch(e){fallback('Voice unavailable')}
}
function finish(){clearPlayback();stopFX();victoryMusic();currentScene='';$('film').dataset.scene='home';$('scene').src='../assets/images/ark01/earth-second-chance.png';$('stage').textContent='MISSION COMPLETE · EARTH — A SECOND CHANCE';$('title').textContent='HOME IS WORTH SAVING';$('subtitle').textContent='Humanity returns to restore the Earth it left behind.';$('speaker').textContent='ARK-01 · RETURN COURSE CONFIRMED';$('line').textContent='The search ends where our responsibility began. The passengers return, not to escape what happened, but to rebuild a home together.';$('status').textContent='Home again. A new beginning.';$('summary').hidden=false;$('next').hidden=true;$('skip').hidden=true;$('replay').hidden=true;$('progress').textContent='END OF MISSION';delayed=setTimeout(()=>$('summary').click(),10500)}
async function start(){$('summary').hidden=true;clearPlayback();stopFX();currentScene='';try{context=context||new(window.AudioContext||window.webkitAudioContext)();context.resume().catch(()=>{})}catch(e){}run(0)}
$('play').onclick=start;$('replay').onclick=start;$('next').onclick=()=>run(index+1);$('skip').onclick=finish;
$('audio').onclick=()=>{voiceOn=!voiceOn;$('audio').textContent='VOICE · '+(voiceOn?'ON':'OFF');if(index>=0&&!$('next').hidden)run(index)};
$('effects').onclick=()=>{sfxOn=!sfxOn;$('effects').textContent='SOUND · '+(sfxOn?'ON':'OFF');if(!sfxOn)stopFX();window.parent.postMessage({channel:'ark-old-earth-410',type:'sound',enabled:sfxOn},'*')};
window.addEventListener('pagehide',()=>{clearPlayback();stopFX()});
// Decode images up front so the reveal never waits for an asset download.
Object.values(scenes).forEach(s=>{const img=new Image();img.src='../assets/images/ark01/'+s[0]});

$('summary').onclick=()=>{clearPlayback();stopFX();window.parent.postMessage({channel:'ark-old-earth-410',type:'summary'},'*')};
let autoStarted=false;
window.addEventListener('message',e=>{if(e.source!==window.parent||e.data?.channel!=='ark-audio-settings')return;effectLevel=Math.max(0,Math.min(1,Number(e.data.volume??1)));voiceOn=e.data.voice!==false;sfxOn=!e.data.muted&&e.data.volume>0;$('audio').textContent='VOICE · '+(voiceOn?'ON':'OFF');$('effects').textContent='SOUND · '+(sfxOn?'ON':'OFF');if(!autoStarted){autoStarted=true;start()}});
window.parent.postMessage({channel:'ark-old-earth-410',type:'ready'},'*');

if(window.parent===window){autoStarted=true;start()}
