'use strict';
const modules=[{name:'Bio-Dome',detail:'Life support connected.'},{name:'Power Core',detail:'Power coupling secured.'},{name:'Sensor Array',detail:'Navigation link verified.'}];
let phase='idle',count=0,timer=null,voiceWatch=null,voiceCommit=null,voiceSerial=0,version=0,audioOn=true,soundOn=true,ctx,fxGain;
const $=id=>document.getElementById(id);
function silence(){voiceSerial++;voiceCommit=null;clearTimeout(voiceWatch);voiceWatch=null;if('speechSynthesis' in window)window.speechSynthesis.cancel()}
function cue(){if(!soundOn)return;try{ctx??=new(window.AudioContext||window.webkitAudioContext)();ctx.resume();fxGain??=ctx.createGain();fxGain.connect(ctx.destination);fxGain.gain.value=1;const t=ctx.currentTime;[220,440,660].forEach((hz,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=hz;o.type='sine';g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.08,t+.03+i*.1);g.gain.exponentialRampToValueAtTime(.001,t+.6+i*.1);o.connect(g).connect(fxGain);o.start(t+i*.1);o.stop(t+.7+i*.1)})}catch{}}
function say(line,onStart=()=>{}){
 silence();const token=version,serial=voiceSerial;let committed=false,launched=false;
 const current=()=>token===version&&serial===voiceSerial;
 const commit=()=>{if(committed||!current())return;committed=true;clearTimeout(voiceWatch);voiceWatch=null;voiceCommit=null;onStart()};
 voiceCommit=commit;
 if(!audioOn||!('speechSynthesis' in window)){commit();return}
 const restore=()=>{if(current()&&fxGain)fxGain.gain.setTargetAtTime(soundOn?1:0,ctx.currentTime,.15)};
 const launch=()=>{
  if(!current()||launched)return;
  const selected=window.ARKVoices.get('male');
  if(!selected)return;
  launched=true;clearTimeout(voiceWatch);
  const u=new SpeechSynthesisUtterance(line);u.lang='en-US';u.voice=selected;u.rate=1.16;u.pitch=.88;u.volume=.85;
  u.onstart=()=>{if(!current())return;commit();if(fxGain)fxGain.gain.setTargetAtTime(.22,ctx.currentTime,.05)};
  u.onend=()=>{commit();restore()};u.onerror=()=>{commit();restore()};
  // Remote voices can take longer than 1.2 seconds to start. Do not cancel them prematurely.
  voiceWatch=setTimeout(()=>{if(!current())return;u.onstart=u.onend=u.onerror=null;window.speechSynthesis.cancel();commit();restore()},6000);
  try{window.speechSynthesis.resume();window.speechSynthesis.speak(u)}catch{commit();restore()}
 };
 launch();
 if(!launched){const began=Date.now();const poll=()=>{if(!current())return;launch();if(launched)return;if(Date.now()-began>=3000){commit();return}voiceWatch=setTimeout(poll,100)};voiceWatch=setTimeout(poll,100)}
}
function notifyGame(type){if(window.parent!==window)window.parent.postMessage({type,channel:'ark-assembly-v419',count},'*')}
function render(){modules.forEach((m,i)=>{const done=i<count,active=phase==='running'&&i===count,n=$('notice'+i),a=document.querySelector('[data-module="'+i+'"]');n.classList.toggle('done',done);n.classList.toggle('active',active);a.classList.toggle('done',done);a.classList.toggle('active',active);n.querySelector('.status').textContent=done?'INSTALLED':active?'CONNECTING…':'WAITING';n.querySelector('.detail').textContent=done?m.detail:active?'Aligning and securing module.':['Life support module.','Primary power module.','Deep-space sensing module.'][i];n.querySelector('.check').textContent=done?'✓':String(i+1).padStart(2,'0')});$('count').textContent=count+' / 3 ONLINE';$('skip').disabled=false;$('action').disabled=phase==='running';$('action').textContent=phase==='complete'?'PROCEED TO BOARDING':phase==='preview-end'?'REPLAY INSTALLATION':phase==='running'?'INSTALLATION IN PROGRESS':'START INSTALLATION';$('headline').textContent=phase==='complete'?'PRIMARY SYSTEMS ONLINE':phase==='preview-end'?'ASSEMBLY PREVIEW COMPLETE':phase==='running'?'COMMISSIONING · '+modules[count].name.toUpperCase():'PRIMARY SYSTEMS STANDBY';$('instruction').textContent=phase==='complete'?'All three modules installed. Next: mass boarding.':phase==='preview-end'?'This standalone preview ends here. Replay to review the layout.':phase==='running'?'Installation updates appear on the right.':'Start the automatic installation sequence.';notifyGame('progress')}
function finish(){clearTimeout(timer);version++;silence();count=3;phase='complete';render();cue()}
function step(token){
 if(token!==version||phase!=='running')return;
 const i=count;
 say(modules[i].name+' installed.',()=>{
  if(token!==version||phase!=='running')return;
  count++;
  if(count===3)phase='complete';
  render();
  const n=$('notice'+i);n.classList.remove('reveal');void n.offsetWidth;n.classList.add('reveal');
  document.querySelector('[data-module="'+i+'"]')?.classList.add('snap');cue();
  if(count===3){timer=setTimeout(()=>{if(token===version&&phase==='complete')say('Primary systems online.')},1500)}
  else timer=setTimeout(()=>step(token),1900);
 });
}
function start(){clearTimeout(timer);version++;silence();count=0;phase='running';document.querySelectorAll('.snap,.reveal').forEach(n=>n.classList.remove('snap','reveal'));render();const token=version;step(token)}
$('action').onclick=()=>{if(phase==='complete'){clearTimeout(timer);version++;silence();notifyGame('boarding')}else if(phase!=='running')start()};$('replay').onclick=start;$('skip').onclick=finish;$('audio').onclick=()=>{audioOn=!audioOn;const pending=voiceCommit;if(!audioOn)pending?.();silence();$('audio').textContent=audioOn?'VOICE ON':'VOICE OFF';$('audio').setAttribute('aria-pressed',String(audioOn))};window.addEventListener('pagehide',()=>{clearTimeout(timer);version++;silence()});render();

$('sound').onclick=()=>{soundOn=!soundOn;if(fxGain)fxGain.gain.value=soundOn?1:0;$('sound').textContent=soundOn?'SOUND ON':'SOUND OFF';window.parent.postMessage({channel:'ark-assembly-v419',type:'sound',enabled:soundOn},'*')};
window.addEventListener('message',e=>{if(e.source!==window.parent||e.data?.channel!=='ark-audio-settings')return;soundOn=e.data.enabled;audioOn=e.data.voice!==false;$('sound').textContent=soundOn?'SOUND ON':'SOUND OFF';$('audio').textContent=audioOn?'VOICE ON':'VOICE OFF'});
notifyGame('ready');
