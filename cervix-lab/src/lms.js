import {CASES} from './data.js';
const KEY='cervix-lab-progress-1';
export class CourseStore {
 constructor(){
  this.api=window.pipwerks?.SCORM;this.connected=false;this.lastError='';this.results={};this.started=Date.now();this.closed=false;this.attempts=0;
  if(this.api){this.api.version='1.2';window.pipwerks.debug.isActive=false;try{this.connected=this.api.init();}catch(e){this.lastError='No se pudo iniciar la comunicación con el campus.';}}
  if(this.connected){const raw=this.api.get('cmi.suspend_data');this.restore(raw);const status=this.api.get('cmi.core.lesson_status');if(!status||status==='not attempted')this.set('cmi.core.lesson_status','incomplete');this.set('cmi.core.score.min','0');this.set('cmi.core.score.max','100');this.commit();}
  else {try{this.restore(localStorage.getItem(KEY));}catch(e){this.lastError='El navegador no permite guardar el avance local.';}}
  this.onExit=()=>this.close();window.addEventListener('pagehide',this.onExit);document.addEventListener('visibilitychange',()=>{if(document.hidden)this.save();});
 }
 restore(raw){try{const d=JSON.parse(raw||'{}');if(d.v===1&&d.r&&typeof d.r==='object'){for(const c of CASES){const a=d.r[c.id];if(Array.isArray(a)&&Number.isFinite(a[0]))this.results[c.id]={score:Math.max(0,Math.min(100,a[0])),critical:Number(a[1])||0,passed:a[2]===1,duration:Number(a[3])||0,date:typeof a[4]==='string'?a[4]:''};}this.attempts=Number(d.a)||0;}}catch(e){this.lastError='No se pudo recuperar el avance anterior.';}}
 compact(){return JSON.stringify({v:1,a:this.attempts,r:Object.fromEntries(Object.entries(this.results).map(([id,r])=>[id,[r.score,r.critical,r.passed?1:0,r.duration,r.date.slice(0,10)]]))});}
 get passed(){return CASES.filter(c=>this.results[c.id]?.passed).length;}
 get completed(){return CASES.filter(c=>this.results[c.id]).length;}
 get score(){return Math.round(CASES.reduce((s,c)=>s+(this.results[c.id]?.score||0),0)/CASES.length);}
 get status(){return this.passed===CASES.length?'passed':this.completed===CASES.length?'failed':'incomplete';}
 record(result){
  if(result.mode!=='exam'||!result.completed)return false;this.attempts++;
  const old=this.results[result.id];if(!old||(!old.passed&&result.passed)||(!old.passed&&result.score>old.score)||(old.passed&&result.passed&&result.score>old.score))this.results[result.id]={score:result.score,critical:result.critical,passed:result.passed,duration:result.duration,date:result.date};
  this.save(result.id);return true;
 }
 set(field,value){if(!this.connected||this.closed)return false;try{const ok=this.api.set(field,String(value));if(!ok)this.lastError='El campus no confirmó el guardado de '+field+'.';return ok;}catch(e){this.lastError='Falló la comunicación con el campus.';return false;}}
 commit(){if(!this.connected||this.closed)return false;try{const ok=this.api.save();if(!ok)this.lastError='El campus no confirmó el guardado del avance.';return ok;}catch(e){this.lastError='Falló el guardado en el campus.';return false;}}
 save(location=''){
  if(this.closed)return;
  if(this.connected){this.set('cmi.suspend_data',this.compact());this.set('cmi.core.lesson_status',this.status);if(this.completed)this.set('cmi.core.score.raw',this.score);if(location)this.set('cmi.core.lesson_location',location);this.set('cmi.core.exit',this.status==='passed'?'':'suspend');return this.commit();}
  try{localStorage.setItem(KEY,this.compact());return true;}catch(e){this.lastError='No se pudo guardar el avance local.';return false;}
 }
 close(){if(this.closed)return;this.save();if(this.connected){const secs=Math.max(0,Math.floor((Date.now()-this.started)/1000));const time=String(Math.floor(secs/3600)).padStart(2,'0')+':'+String(Math.floor(secs/60)%60).padStart(2,'0')+':'+String(secs%60).padStart(2,'0');this.set('cmi.core.session_time',time);this.commit();try{this.api.quit();}catch{}}this.closed=true;}
}
