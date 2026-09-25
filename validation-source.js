const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'index.html'),'utf8');
const extension=html.slice(html.indexOf('  /* V41.1 SECOND CHANCE'),html.indexOf('  /* V41.2 — readable setup'));
function environment(){
 const nodes=new Map(),events=[],micro=[];
 function el(){return {className:'',innerHTML:'',style:{},setAttribute(){},remove(){},onclick:null};}
 const body={classList:{remove(){}},appendChild(x){nodes.set(x.id,x)}};
 const ctx={console,Math,Object,JSON,Number,String,Set,clearTimeout(){},queueMicrotask:f=>micro.push(f),document:{body,querySelectorAll:()=>[],createElement:el,getElementById:id=>{if(!nodes.has(id))nodes.set(id,el());return nodes.get(id)}},location:{reload(){events.push('restart')}},window:{},gameTimers:[],gamePaused:false,J:null,
 cap100:n=>Math.max(0,Math.min(100,n)),simpleStartGame(){ctx.J=base()},chooseRoute(i){const t=ctx.routeLabels()[i];ctx.J.activeRouteLabel=t;ctx.J.currentLocation=t;},routeLabels(){return ['PLANET A','PLANET B','PLANET C'].filter(x=>!ctx.J.visitedPlanetLabels.includes(x))},renderSimple(){events.push('render')},renderResources(){events.push('hud')},v36PlanetLabel(){return ctx.J.activeRouteLabel},planetProfile(){return {habitable:ctx.J.planetOutcomes[ctx.J.activeRouteLabel]}},v35AllChartedWorldsRejected(){return ['PLANET A','PLANET B','PLANET C'].every(x=>ctx.J.visitedPlanetLabels.includes(x)&&ctx.J.planetHabitability[x]===false)},stopInformationalVoice(){events.push('voice stop')},sound(t){events.push('sound '+t)},voice(t){events.push('voice '+t)},addJourneyLog(t){events.push(t)},displayResource:n=>(n/10).toFixed(1),v27LoadProfile:()=>({}),v27SaveProfile(){}};
 // Assignment targets live inside the original closure; provide equivalent bindings.
 for(const k of ['failureReason','v33HardFailureReason','checkCriticalFailure','v27ResolveHiddenEnding','v27ShowOmen','v35ChooseExhaustedChartOutcome','resolveCivilizationEnding','openAssessmentReport','v35MountExhaustedChart','v40CompleteIdentification','endGame','v27ArchiveMarkup'])ctx[k]=()=>{};
 vm.createContext(ctx);vm.runInContext(extension,ctx);ctx.simpleStartGame();return {ctx,nodes,events,micro};
}
function base(){return {energy:80,supplies:80,technology:80,morale:80,preflight:false,visitedPlanetLabels:[],planetHabitability:{},planetOutcomes:{},crewLost:{},surface:{complete:true},currentLocation:'EARTH',log:[]};}
const results=[];
const orders=[['A','B','C'],['A','C','B'],['B','A','C'],['B','C','A'],['C','A','B'],['C','B','A']];
for(const order of orders){
 const {ctx,nodes}=environment();ctx.J.secondChancePlan={kind:'OLD_EARTH',successVisit:1};
 for(const l of order){const target='PLANET '+l;ctx.chooseRoute(ctx.routeLabels().indexOf(target));assert.equal(ctx.J.planetOutcomes[target],false);ctx.openAssessmentReport();ctx.J.visitedPlanetLabels.push(target);}
 ctx.v35MountExhaustedChart();assert.equal(ctx.J.scFinale.kind,'OLD_EARTH');assert.equal(ctx.J.ended,undefined);
 for(let i=0;i<5;i++){assert.equal(typeof nodes.get('scNext').onclick,'function');nodes.get('scNext').onclick();}
 assert.equal(ctx.J.endingType,'OLD_EARTH');assert.equal(ctx.J.finalStateSnapshot.currentLocation,'EARTH');assert.equal(ctx.J.finalStateSnapshot.energy,ctx.J.energy);assert(nodes.get('secondChanceFilm').innerHTML.includes('SECOND CHANCE'));nodes.get('scAgain').onclick();results.push('Old Earth '+order.join('→')+' and restart PASS');
}
for(const visit of [1,2]){const {ctx,nodes}=environment();ctx.J.secondChancePlan={kind:'NEW_EARTH',successVisit:visit};for(let n=1;n<=visit;n++){ctx.chooseRoute(0);ctx.openAssessmentReport();assert.equal(ctx.planetProfile().habitable,n===visit);if(n<visit)ctx.J.visitedPlanetLabels.push(ctx.J.activeRouteLabel);}
 ctx.resolveCivilizationEnding();assert.equal(ctx.J.scFinale.kind,'NEW_EARTH');nodes.get('scNext').onclick();nodes.get('scNext').onclick();assert.equal(ctx.J.endingType,'NEW_EARTH');results.push('New Earth visit '+visit+' PASS');}
for(const k of ['energy','supplies','technology','morale']){const {ctx,nodes,micro}=environment();ctx.J[k]=0;ctx.J[k]=80;assert.equal(ctx.J[k],0,'zero cannot revive');micro.forEach(f=>f());assert.equal(ctx.J.scFinale.kind,'MISSION_FAILED');nodes.get('scNext').onclick();assert.equal(ctx.J.endingType,'MISSION_FAILED');assert.equal(ctx.J.finalStateSnapshot[k==='morale'?'socialStability':k],0);assert.equal(typeof nodes.get('scAgain').onclick,'function');results.push(k+' depletion and restart PASS');}
{const {ctx}=environment();ctx.J.energy=26;ctx.J.supplies=28;assert.equal(ctx.checkCriticalFailure(),false);assert(!ctx.J.scFinale);results.push('Critical positive reserves stay alive PASS');}
{const {ctx}=environment();let old=0;for(let n=0;n<10000;n++)if(ctx.scPlan((n+.5)/10000,.2).kind==='OLD_EARTH')old++;assert.equal(old,5000);results.push('Actual scPlan stratified 10000 rolls: Old Earth 5000; New Earth 5000 PASS');}
{const {ctx,nodes,micro}=environment();ctx.J.visitedPlanetLabels=['PLANET A','PLANET B','PLANET C'];ctx.J.planetHabitability={'PLANET A':false,'PLANET B':false,'PLANET C':false};ctx.v35MountExhaustedChart();ctx.J.technology=0;micro.forEach(f=>f());assert.equal(ctx.J.scFinale.kind,'MISSION_FAILED');results.push('Depletion takes priority during uncommitted ending PASS');}
console.log(results.join('\n'));fs.writeFileSync(require('path').join(__dirname,'VALIDATION.txt'),results.join('\n')+'\n\nMethod: executed the actual V41.1 policy and ending functions in Node VM with a simulated DOM. These are state/handler tests, not a full browser playthrough.\nBrowser visual/playthrough validation could not run: local URL returned ERR_BLOCKED_BY_CLIENT.\n');
