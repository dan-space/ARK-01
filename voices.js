/* Preserve V41.12 on Edge; repair Chrome's generic Google-voice fallback. */
(()=>{
const isEdge=/Edg(?:e|A|iOS)?\//.test(navigator.userAgent);
const femaleName=/\b(female|zira|samantha|jenny|aria|victoria|karen|susan|hazel|sara|serena|moira|tessa|sonia|libby)\b/i;
const maleName=/\b(male|david|guy|mark|george|daniel|james|ryan|eric|andrew|brian|thomas|alex|fred|christopher|roger)\b/i;
function original(voices,channel){const en=voices.filter(v=>/^en(-|_)/i.test(v.lang));const primary=en.find(v=>/zira|samantha|google|microsoft/i.test(v.name))||en[0];if(channel==='female')return en.find(v=>v!==primary&&/samantha|victoria|karen|zira|aria|jenny|susan|female/i.test(v.name))||en.find(v=>v!==primary)||primary||voices[0];return primary||voices[0]}
function characterChannel(role){return /^elena(?:\b|$)/i.test(role)?'female':/^(alex|marcus)(?:\b|$)/i.test(role)?'male':null}
function choose(voices,channel){
 channel=characterChannel(channel)||channel;
 if(isEdge)return original(voices,channel);
 const en=voices.filter(v=>/^en(-|_)/i.test(v.lang));
 const legacy=original(voices,channel),known=channel==='female'?femaleName:maleName,opposite=channel==='female'?maleName:femaleName;
 const valid=v=>v&&known.test(v.name)&&!opposite.test(v.name);
 // Retain an identifiable original voice instead of replacing a working voice.
 if(valid(legacy))return legacy;
 const ordered=en.filter(valid).sort((a,b)=>{
  const rank=v=>v.localService?0:/Microsoft/i.test(v.name)?1:2;
  return rank(a)-rank(b)||a.name.localeCompare(b.name);
 });
 return ordered[0]||null;
}
function load(){const vs=window.speechSynthesis?.getVoices()||[];if(location.search.includes('voiceDebug'))console.info('ARK voices',choose(vs,'male')?.name,choose(vs,'female')?.name);return vs}
window.ARKVoices={isEdge,characterChannel,choose,get:channel=>choose(load(),channel),load};
window.speechSynthesis?.addEventListener('voiceschanged',load);load();
})();
