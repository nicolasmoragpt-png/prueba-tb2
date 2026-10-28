import {caseSteps} from './data.js';

export class Simulation {
 constructor(c,mode='guide',now=()=>performance.now()){
  this.case=c;this.mode=mode;this.now=now;this.steps=caseSteps(c);this.step=0;this.tool='speculum';this.started=now();this.finished=false;this.events=[];this.errors=[];this.critical=0;this.assists=0;
  this.pose={depth:0,x:0,y:0,rotation:0,opening:0,angle:0};this.spec={depth:0,opening:0,angle:0};this.inserted=false;this.visible=false;this.sampleActive=false;this.sampleRotation=0;this.sampled=false;this.transferredAt=null;this.fixed=false;this.appliedAt=null;this.coverage=new Set();this.readingReady=false;this.resultAnswer=null;this.management=null;this.accelerated=false;this.stopAcknowledged=false;
 }
 get current(){return this.steps[this.step]||'done';}
 get score(){return Math.max(0,100-this.errors.reduce((s,e)=>s+e.penalty,0));}
 get criticalCount(){return this.errors.filter(e=>e.critical).length;}
 select(tool){if(this.sampleActive){this.sampleActive=false;this.sampleRotation=0;}this.tool=tool;if(tool==='speculum')Object.assign(this.pose,this.spec);else if(['spatula','swab'].includes(tool)){this.pose.depth=0;this.pose.x=0;this.pose.y=0;this.pose.rotation=0;}return this.tool;}
 setPose(key,value){
  const old=this.pose[key];this.pose[key]=Number(value);if(this.tool==='speculum'&&['depth','opening','angle'].includes(key))this.spec[key]=Number(value);
  if(this.sampleActive){
   if(!this.contact()){this.sampleActive=false;this.sampleRotation=0;this.fail('contact-lost','Se perdió el contacto de la espátula. Reposicioná y reiniciá la toma.',5);}
   else if(key==='rotation')this.sampleRotation=Math.max(0,this.sampleRotation+Number(value)-old);
  }
 }
 contact(){const [x,y]=this.case.target;return this.visible&&this.specAligned()&&this.spec.opening>=28&&this.spec.opening<=65&&Math.abs(this.pose.x/100-x)<0.19&&Math.abs(this.pose.y/100-y)<0.19&&this.pose.depth>=78&&this.pose.depth<=88;}
 wallContact(){return this.pose.depth>25&&(Math.abs(this.pose.x)>63||Math.abs(this.pose.y)>51||this.pose.depth>94);}
 specAligned(){return this.spec.depth>=46&&this.spec.depth<=62&&Math.abs(this.spec.angle-this.case.angle)<=5;}
 reactionSeconds(){return this.appliedAt===null?0:Math.min(60,Math.max(0,(this.now()-this.appliedAt)/1000));}
 transferSeconds(){return this.transferredAt===null?0:Math.max(0,(this.now()-this.transferredAt)/1000);}
 coverageZone(){return `${this.pose.x<0?'L':'R'}${this.pose.y<0?'B':'T'}`;}
 assist(){
  if(this.mode!=='guide')return false;this.assists++;
  if(this.tool==='speculum'){this.spec.depth=54;this.spec.angle=this.case.angle;this.spec.opening=this.current==='insert'?0:40;Object.assign(this.pose,this.spec);}
  else{this.pose.depth=83;this.pose.x=this.case.target[0]*100;this.pose.y=this.case.target[1]*100;}
  return true;
 }
 fail(code,message,penalty=8,critical=false){
  // Count one pedagogical error per category and step, not every repeated click.
  if(!this.errors.some(e=>e.code===code&&e.step===this.current))this.errors.push({code,step:this.current,message,penalty,critical});
  return {ok:false,message,critical};
 }
 advance(message){this.events.push({step:this.current,elapsed:Math.round((this.now()-this.started)/1000)});this.step++;if(this.step>=this.steps.length)this.finished=true;return{ok:true,advance:true,message};}
 act(action,data={}){
  if(this.finished)return{ok:false,message:'El caso ya terminó.'};
  const s=this.current;
  if(action==='patient-stop'){
   this.stopAcknowledged=true;this.sampleActive=false;this.sampleRotation=0;this.sampled=false;this.transferredAt=null;this.fixed=false;this.appliedAt=null;this.coverage.clear();this.readingReady=false;this.accelerated=false;this.tool='speculum';this.pose={depth:0,x:0,y:0,rotation:0,opening:0,angle:0};this.spec={depth:0,opening:0,angle:0};
   this.inserted=false;this.visible=false;this.step=0;return{ok:true,advance:false,message:'Se detuvo la manipulación. Volvé a confirmar comodidad y consentimiento antes de reiniciar.'};
  }
  const allowed={prep:['prepare'],insert:['insert'],visualize:['visualize'],inspect:['inspect'],sample:['begin-sample','sample'],transfer:['transfer'],fix:['fix'],acid:['acid'],wait:['read','accelerate'],classify:['classify'],manage:['manage'],withdraw:['withdraw'],document:['document']};
  if(!allowed[s]?.includes(action))return{ok:false,message:'Acción no disponible en esta etapa.'};
  if(action==='accelerate'&&this.mode!=='guide')return{ok:false,message:'El tiempo adelantado solo está disponible en práctica.'};
  if(s==='prep'){
   if(action!=='prepare')return this.fail('preparation','Completá la preparación antes de manipular instrumentos.');
   if(!data.consent)return this.fail('consent','El consentimiento es necesario antes de iniciar.',20,true);
   if(!data.identity||!data.privacy||!data.hygiene||!data.materials)return this.fail('prep-missing','Comprobá identidad, privacidad, higiene y material disponible.',8);
   if(this.case.module==='pap'&&!data.label)return this.fail('label','La identificación concordante de la lámina y la solicitud es un punto crítico.',20,true);
   return this.advance('Preparación confirmada. Las siguientes acciones se realizan en el modelo virtual.');
  }
  if(s==='insert'){
   if(this.tool!=='speculum')return this.fail('tool','Seleccioná el espéculo para esta etapa.');
   if(this.spec.opening>5)return this.fail('open-insertion','Las valvas deben estar cerradas durante esta introducción simulada.',15,true);
   if(this.spec.depth>76)return this.fail('force','Avance excesivo en el modelo. Detenete y corregí; no se debe forzar la introducción.',20,true);
   if(!this.specAligned())return this.fail('alignment','Todavía no hay una orientación y un avance adecuados para este caso.',5);
   this.inserted=true;return this.advance('Introducción registrada. Ahora ajustá la apertura y la visualización.');
  }
  if(s==='visualize'){
   if(this.tool!=='speculum'||!this.specAligned())return this.fail('view-alignment','Ajustá el espéculo para orientar la línea de visión al cuello.',5);
   if(this.spec.opening>65)return this.fail('over-open','La apertura es excesiva en este modelo. Reducila y atendé a la comodidad de la persona.',15,true);
   if(this.spec.opening<28)return this.fail('under-open','La apertura aún no permite la exposición requerida.',5);
   this.visible=true;return this.advance('Exposición del modelo conseguida. Evaluá ahora si los hallazgos permiten continuar.');
  }
  if(s==='inspect'){
   const expected=this.case.kind==='suspicious'?'refer':this.case.kind==='inadequate'?'inadequate':'continue';
   if(data.choice!==expected){const critical=['suspicious','inadequate'].includes(this.case.kind);return this.fail('basal-inspection',critical?'Revisá la lesión o la limitación de visualización. No corresponde continuar como un tamizaje habitual.':'Este caso permite continuar con el procedimiento indicado. Volvé a observar la superficie.',critical?20:8,critical);}
   return this.advance(expected==='refer'?'La sospecha basal requiere evaluación especializada. No se necesita completar la reacción para reconocer esta alarma.':expected==='inadequate'?'Registrá el examen como no evaluable; la limitación impide una lectura válida.':'Inspección basal completada.');
  }
  if(s==='sample'){
   if(this.tool!=='spatula')return this.fail('sample-tool','Este perfil se practica con la espátula convencional.');
   if(this.wallContact())return this.fail('sample-wall','La posición sobrepasa el espacio de trabajo del modelo. Retirá y corregí la trayectoria.',10);
   if(!this.contact())return this.fail('sample-contact','La punta todavía no está en contacto adecuado con el área de toma. Ajustá posición y profundidad.',5);
   if(action==='begin-sample'){this.sampleActive=true;this.sampleRotation=0;this.pose.rotation=0;return{ok:true,message:'Contacto establecido. Mantenelo y girá la espátula una vuelta completa.'};}
   if(!this.sampleActive||this.sampleRotation<360)return this.fail('sample-rotation','Falta completar la vuelta manteniendo el contacto de la espátula.',5);
   if(this.sampleRotation>390)return this.fail('sample-excess','La rotación fue excesiva para este perfil. Reiniciá la toma; más vueltas no equivalen a mejor muestra.',8);
   this.sampled=true;this.sampleActive=false;this.pose.depth=0;return this.advance('Muestra simulada obtenida. Prepará su transferencia y fijación sin demoras.');
  }
  if(s==='transfer'){
   if(this.tool!=='slide')return this.fail('slide-tool','Seleccioná la lámina identificada para transferir la muestra.');
   if(!data.identity)return this.fail('specimen-id','Verificá que la lámina corresponda al caso antes de transferir.',20,true);
   this.transferredAt=this.now();return this.advance('Extendido realizado. Procedé inmediatamente a la fijación.');
  }
  if(s==='fix'){
   if(this.tool!=='fixative')return this.fail('fixative-tool','Seleccioná el fijador y completá la conservación inmediata.',8);
   if(this.transferSeconds()>15)this.fail('fixation-delay','Hubo demora en la fijación dentro del ejercicio. En citología convencional se evita el secado fijando inmediatamente.',15,true);
   this.fixed=true;return this.advance('Fijación registrada. El límite de 15 s usado para la alerta es una regla de interfaz, no un umbral clínico permitido.');
  }
  if(s==='acid'){
   if(this.tool!=='swab')return this.fail('acid-tool','Seleccioná la torunda para aplicar suavemente el reactivo.');
   if(data.reagent!=='5')return this.fail('reagent','Este escenario utiliza ácido acético al 5%. Confirmá el reactivo y su concentración.',20,true);
   if(!this.visible||!this.specAligned()||this.spec.opening<28||this.spec.opening>65||this.wallContact()||this.pose.depth<78||this.pose.depth>88||Math.hypot(this.pose.x/100,this.pose.y/100)>0.53)return this.fail('acid-contact','Posicioná la torunda sobre la superficie cervical visible, sin sobrepasarla ni frotar.',5);
   this.coverage.add(this.coverageZone());
   if(this.coverage.size<4)return{ok:true,message:`Aplicación suave registrada: ${this.coverage.size} de 4 sectores didácticos. Cubrí la superficie restante.`};
   this.appliedAt=this.now();this.pose.depth=0;return this.advance('Aplicación completa. Comienza la observación de la reacción.');
  }
  if(s==='wait'){
   if(action==='accelerate'&&this.mode==='guide'){this.appliedAt=this.now()-60000;this.accelerated=true;return{ok:true,message:'Tiempo simulado adelantado solo para práctica. En evaluación transcurren 60 segundos reales.'};}
   if(this.reactionSeconds()<60)return this.fail('early-reading','Todavía no han transcurrido los 60 segundos de este perfil. Continuá observando.',12,true);
   this.readingReady=true;return this.advance('Tiempo de lectura cumplido. Clasificá el hallazgo observado.');
  }
  if(s==='classify'){
   this.resultAnswer=data.answer;
   if(data.answer!==this.case.answer)return this.fail('classification','La clasificación no corresponde al hallazgo del caso. Revisá la superficie, su distribución y la calidad de visualización.',20,['suspicious','inadequate'].includes(this.case.kind));
   return this.advance('Clasificación registrada. Seleccioná la ruta de atención.');
  }
  if(s==='manage'){
   this.management=data.choice;
   if(data.choice!==this.case.management)return this.fail('management','La ruta elegida no corresponde al resultado. No indiques tratamiento automático sin la evaluación requerida.',20,true);
   return this.advance('Ruta de atención registrada. Completá el cierre del procedimiento.');
  }
  if(s==='withdraw'){
   if(this.tool!=='speculum')return this.fail('withdraw-tool','Retirá el instrumento de toma o aplicación y seleccioná el espéculo.');
   if(this.spec.opening>8||this.spec.depth>8)return this.fail('withdraw-position','Liberá la apertura y completá el retiro controlado del espéculo en el modelo.',8);
   this.inserted=false;this.visible=false;return this.advance('Instrumental retirado. Completá la comunicación y el registro.');
  }
  if(s==='document'){
   if(!data.record||!data.followup||!data.communication)return this.fail('documentation','Falta registrar el procedimiento, comunicar el resultado o acordar seguimiento.',8);
   return this.advance('Caso completo. Revisá tu desempeño y los puntos de mejora.');
  }
  return{ok:false,message:'Acción no disponible en esta etapa.'};
 }
 result(){return{id:this.case.id,module:this.case.module,mode:this.mode,score:Math.min(this.score,this.criticalCount?60:100),critical:this.criticalCount,errors:this.errors.map(e=>({...e})),duration:Math.round((this.now()-this.started)/1000),assists:this.assists,completed:this.finished,passed:this.finished&&this.score>=80&&this.criticalCount===0,date:new Date().toISOString()};}
}
