import {CASES,TOOLS,STEPS,CLASSIFICATIONS,MANAGEMENT,EXPLANATIONS,SOURCES} from './data.js';
import {Simulation} from './engine.js';
import {LabScene} from './scene.js';
import {CourseStore} from './lms.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store=new CourseStore();let mode='guide',currentCase=CASES[0],sim=new Simulation(currentCase,mode),scene,webglReady=false;
const modal=$('#modal');
function openModal(html,eyebrow='CÉRVIX LAB'){ $('#modal-content').innerHTML=html;$('#modal-eyebrow').textContent=eyebrow;if(!modal.open)modal.showModal(); }
function closeModal(){modal.close();}
$('#modal-close').onclick=closeModal;
modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
function feedback(message,type='success'){ $('#feedback').innerHTML=`<div class="feedback-message ${type}">${esc(message)}</div>`; }
function changeCase(c,newMode=mode,force=false){
 if(!webglReady){feedback('El entorno 3D debe estar disponible antes de iniciar un caso.','error');return;}
 if(!force&&sim.step>0&&!sim.finished){openModal(`<h2>¿Iniciar otro intento?</h2><p>El intento actual está en curso. Los resultados de evaluaciones terminadas se conservan; este intento sin terminar se descartará.</p><div class="modal-actions"><button class="secondary-button" id="keep-attempt">Continuar aquí</button><button class="primary-button" id="change-attempt">Iniciar otro intento</button></div>`);$('#keep-attempt').onclick=closeModal;$('#change-attempt').onclick=()=>{closeModal();changeCase(c,newMode,true);};return;}
 currentCase=c;mode=newMode;sim=new Simulation(c,mode);scene?.setCase(c,mode);scene?.update(sim);$$('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view==='procedure'));renderAll();showBrief();
}
function showBrief(){
 const exam=mode==='exam';
 openModal(`<h2>${esc(currentCase.name)}</h2><p>${esc(currentCase.brief)}</p><div class="case-information"><div><small>ESTACIÓN</small><b>${currentCase.module==='pap'?'Papanicolaou convencional':'Inspección visual con ácido acético'}</b></div><div><small>MODALIDAD</small><b>${exam?'Evaluación formativa':'Práctica con orientación'}</b></div></div><p>${exam?'El intento comienza con 100 puntos. Los errores restan puntos y un error crítico limita la nota a 60. Para aprobar este caso se requiere al menos 80 y ningún error crítico. Las ayudas de posición están desactivadas.':'Explorá la anatomía y seguí la secuencia. Podés usar la orientación de posición y adelantar el tiempo de reacción; la práctica no envía una calificación al campus.'}</p>${currentCase.module==='pap'?'<div class="mini-callout">Perfil de espátula convencional. La selección de otros dispositivos y la necesidad de una muestra endocervical adicional se revisan con el docente según protocolo. La alerta de fijación a 15 s es una regla de interfaz; la fijación clínica debe ser inmediata.</div>':'<div class="mini-callout">Modelo sintético: los colores, texturas y dimensiones son didácticos. Este ejercicio no mide capacidad diagnóstica sobre fotografías clínicas ni certifica competencia clínica.</div>'}<div class="modal-actions"><button class="primary-button" id="start-case">${exam?'Comenzar evaluación':'Entrar al laboratorio'} →</button></div>`,'ANTES DE COMENZAR');
 $('#start-case').onclick=()=>{sim.started=sim.now();closeModal();};
}
function renderNav(){
 $$('.module').forEach(b=>b.classList.toggle('active',b.dataset.module===currentCase.module));
 $('#case-list').innerHTML=CASES.filter(c=>c.module===currentCase.module).map(c=>`<button class="case-button ${c.id===currentCase.id?'active':''}" data-case="${c.id}"><span>${esc(c.name)}</span>${store.results[c.id]?.passed?'<span class="case-check">✓</span>':''}</button>`).join('');
 $$('.case-button').forEach(b=>b.onclick=()=>changeCase(CASES.find(c=>c.id===b.dataset.case)));
 $('#course-count').textContent=`${store.passed} / ${CASES.length}`;$('#course-progress').style.width=`${100*store.passed/CASES.length}%`;
 $('#lms-status').textContent=store.lastError|| (store.connected?'Conectado a CampusMED / SCORM 1.2':'Modo local · avance en este navegador');
}
function renderTools(){
 const tools=TOOLS.filter(t=>currentCase.module==='pap'?t.id!=='swab':['speculum','swab'].includes(t.id));
 $('#tool-tray').innerHTML=tools.map(t=>`<button class="tool ${t.id===sim.tool?'active':''}" data-tool="${t.id}" aria-pressed="${t.id===sim.tool}"><svg viewBox="0 0 48 44" aria-hidden="true">${t.svg}</svg><span>${t.name}</span><small>${t.sub}</small></button>`).join('');
 $$('.tool').forEach(b=>b.onclick=()=>{if(sim.finished)return;sim.select(b.dataset.tool);renderTools();renderSliders();updateTelemetry();scene?.update(sim);});
 $('#tool-caption').textContent=TOOLS.find(t=>t.id===sim.tool)?.sub||'';
}
const controls={speculum:[['depth','Avance',0,100,'%'],['angle','Orientación',-25,25,'°'],['opening','Apertura de valvas',0,100,'%']],spatula:[['depth','Profundidad',0,100,'%'],['rotation','Giro de la espátula',0,360,'°'],['x','Posición horizontal',-85,85,''],['y','Posición vertical',-70,70,'']],swab:[['depth','Profundidad',0,100,'%'],['x','Posición horizontal',-85,85,''],['y','Posición vertical',-70,70,'']]};
function renderSliders(){
 const list=controls[sim.tool]||[];
 $('#control-sliders').innerHTML=list.length?list.map(([key,label,min,max,unit])=>`<label><span class="slider-label">${label}<b id="value-${key}">${sim.pose[key]}${unit}</b></span><input aria-label="${label}" data-control="${key}" type="range" min="${min}" max="${max}" step="1" value="${sim.pose[key]}" ${sim.finished?'disabled':''}></label>`).join(''):'<div class="mini-callout">Este material se utiliza desde la acción del paso actual. Verificá su identificación y preparación antes de continuar.</div>';
 $$('[data-control]').forEach(input=>{fill(input);input.oninput=()=>setPose(input.dataset.control,Number(input.value));});
 $('#position-assist').classList.toggle('hidden',mode==='exam'||!list.length);$('#position-assist').disabled=sim.finished;
}
function setPose(key,value){
 if(sim.finished)return;sim.setPose(key,value);const d=controls[sim.tool]?.find(c=>c[0]===key);const input=$(`[data-control="${key}"]`);if(input){input.value=sim.pose[key];fill(input);}if($(`#value-${key}`))$(`#value-${key}`).textContent=sim.pose[key]+(d?.[4]||'');scene?.update(sim);updateTelemetry();
}
// Track fill: from the left edge, or from the centre for controls that go negative.
function fill(input){const min=+input.min,p=(input.value-min)/(input.max-min)*100,o=min<0?50:0;input.style.setProperty('--a',Math.min(o,p)+'%');input.style.setProperty('--b',Math.max(o,p)+'%');}
$('#position-assist').onclick=()=>{if(sim.assist()){renderSliders();scene?.update(sim);feedback('Posición sugerida aplicada. Observá su relación con la anatomía; después intentá reproducirla sin ayuda.');}};
function check(name,text,checked=false){return`<label><input type="checkbox" name="${name}" ${checked?'checked':''}> <span>${text}</span></label>`;}
function button(text,action,cls='primary-button'){return`<button class="${cls}" data-action="${action}">${text}</button>`;}
function renderStep(){
 const key=sim.current,s=STEPS[key];$('#feedback').innerHTML='';
 $('#mode-label').textContent=mode==='guide'?'PRÁCTICA GUIADA':'EVALUACIÓN FORMATIVA';$('#mode-guide').classList.toggle('active',mode==='guide');$('#mode-exam').classList.toggle('active',mode==='exam');
 document.body.dataset.mode=mode;document.body.dataset.module=currentCase.module;
 $('#step-number').textContent=sim.finished?'CASO COMPLETO':`PASO ${String(sim.step+1).padStart(2,'0')} DE ${sim.steps.length}`;$('#step-progress').style.width=`${100*(sim.finished?1:sim.step/sim.steps.length)}%`;
 $('#step-title').textContent=s?.title||'Revisá tu desempeño';$('#step-description').textContent=s?(mode==='guide'?s.description:examDescription(key)):'El resultado queda disponible para revisar y repetir la práctica.';
 const content=$('#step-content'),actions=$('#task-actions');content.innerHTML='';actions.innerHTML='';
 if(sim.finished){actions.innerHTML=button('Ver resultado','result');}
 else if(key==='prep'){
  content.innerHTML=`<div class="checklist">${check('identity','Identidad ficticia y procedimiento indicados: caso '+esc(currentCase.id.toUpperCase()))}${check('consent','Explicación y consentimiento; puede pedir detener el examen.')}${check('privacy','Privacidad, comunicación y posición confortable.')}${check('hygiene','Higiene de manos, guantes y preparación según protocolo.')}${check('materials','Instrumental, iluminación y materiales disponibles.')}${currentCase.module==='pap'?check('label','Lámina y solicitud identificadas antes de tomar la muestra.'):''}</div>`;
  actions.innerHTML=button('Confirmar preparación →','prepare');
 }else if(key==='insert'){
  if(mode==='guide')content.innerHTML='<div class="mini-callout">Avanzá con las valvas cerradas. La orientación posterior del segundo caso requiere un ajuste diferente. Usá la vista lateral para observar la trayectoria.</div>';
  actions.innerHTML=button('Comprobar introducción →','insert');
 }else if(key==='visualize'){
  actions.innerHTML=button('Confirmar exposición →','visualize')+button('Detener por molestia','patient-stop','secondary-button');
 }else if(key==='inspect'){
  actions.innerHTML=[['continue','La superficie es evaluable: continuar la estación.'],['refer','Hay una lesión macroscópica sospechosa: priorizar evaluación.'],['inadequate','La visualización no permite una interpretación válida.']].map(([v,t])=>`<button class="option-button" data-inspect="${v}">${t}</button>`).join('');
 }else if(key==='sample'){
  content.innerHTML='<div class="mini-callout" id="sample-progress">Contacto pendiente · giro acumulado 0° / 360°</div>';
  actions.innerHTML=button('Establecer contacto','begin-sample','secondary-button')+button('Completar toma →','sample');
 }else if(key==='transfer'){
  content.innerHTML=`<div class="checklist">${check('identity','La lámina corresponde a '+esc(currentCase.id.toUpperCase())+' y el fijador está listo.')}</div>`;
  actions.innerHTML=button('Extender la muestra →','transfer');
 }else if(key==='fix'){
  content.innerHTML='<div class="mini-callout" id="fixation-time">Desde el extendido: 0 s. Fijá inmediatamente.</div>';
  actions.innerHTML=button('Fijar el extendido ahora →','fix');
 }else if(key==='acid'){
  content.innerHTML='<label class="field-label" for="reagent">Reactivo del escenario</label><select class="lab-input" id="reagent"><option value="">Seleccionar…</option><option value="5">Ácido acético al 5%</option><option value="3">Ácido acético al 3%</option><option value="iodine">Lugol</option></select><div class="mini-callout" id="coverage">Superficie cubierta: 0 / 4 sectores didácticos.</div><div class="coverage-grid" aria-label="Sectores de aplicación"><span data-zone="LT">Superior izquierdo</span><span data-zone="RT">Superior derecho</span><span data-zone="LB">Inferior izquierdo</span><span data-zone="RB">Inferior derecho</span></div>';
  actions.innerHTML=button('Aplicar suavemente en este sector','acid');
 }else if(key==='wait'){
  content.innerHTML='<div class="mini-callout">Observá los cambios en la superficie. Podés girar y acercar la cámara sin alterar el tiempo de reacción.</div>';
  actions.innerHTML=button('Realizar la lectura →','read')+(mode==='guide'?button('Adelantar tiempo simulado a 60 s','accelerate','secondary-button'):'');
 }else if(key==='classify'){
  actions.innerHTML=CLASSIFICATIONS.map(([v,t])=>`<button class="option-button" data-classify="${v}">${t}</button>`).join('');
 }else if(key==='manage'){
  if(mode==='guide')content.innerHTML=`<div class="mini-callout">${esc(EXPLANATIONS[currentCase.kind])}</div>`;
  actions.innerHTML=MANAGEMENT.map(([v,t])=>`<button class="option-button" data-manage="${v}">${t}</button>`).join('');
 }else if(key==='withdraw'){
  actions.innerHTML=button('Confirmar retiro →','withdraw');
 }else if(key==='document'){
  content.innerHTML=`<div class="checklist">${check('record','Procedimiento, calidad de visualización e incidencias registrados.')}${check('communication',currentCase.module==='pap'?'Se explicó que el resultado depende del análisis de laboratorio.':'Se explicó el resultado visual sin presentarlo como diagnóstico histológico.')}${check('followup',currentCase.module==='pap'?'Solicitud, envío de muestra y seguimiento del resultado organizados.':'Ruta de seguimiento o referencia acordada según el resultado.')}</div>`;
  actions.innerHTML=button('Finalizar y revisar →','document');
 }
 actions.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>perform(b.dataset.action));
 actions.querySelectorAll('[data-inspect]').forEach(b=>b.onclick=()=>perform('inspect',{choice:b.dataset.inspect}));
 actions.querySelectorAll('[data-classify]').forEach(b=>b.onclick=()=>perform('classify',{answer:b.dataset.classify}));
 actions.querySelectorAll('[data-manage]').forEach(b=>b.onclick=()=>perform('manage',{choice:b.dataset.manage}));
 $('#step-list').innerHTML=sim.steps.map((k,i)=>`<li class="${i<sim.step?'done':i===sim.step?'current':''}" ${i===sim.step?'aria-current="step"':''}>${esc(STEPS[k].short)}</li>`).join('');
 $('#step-count').textContent=`${Math.min(sim.step,sim.steps.length)} / ${sim.steps.length}`;
 $('#teaching-note').textContent=mode==='guide'?'La orientación automática y el tiempo adelantado están disponibles solo en práctica. Las escalas no representan medidas clínicas.':'Evaluación formativa: 80 puntos o más y ningún error crítico. No certifica competencia clínica. Cada nuevo intento comienza desde la preparación.';
 updateTelemetry();
}
function examDescription(key){const map={prep:'Verificá las condiciones necesarias para iniciar el procedimiento.',insert:'Posicioná el instrumento de acuerdo con la anatomía del caso.',visualize:'Conseguí una exposición apropiada y atendé a la comodidad.',inspect:'Seleccioná la decisión que corresponde al examen basal.',sample:'Completá la toma con el instrumento definido en este perfil.',transfer:'Transferí la muestra conservando la identificación del caso.',fix:'Completá la conservación de la muestra sin demora.',acid:'Seleccioná el reactivo de este perfil y aplicalo sobre la superficie visible.',wait:'Determiná cuándo corresponde realizar la lectura.',classify:'Seleccioná la interpretación que corresponde al hallazgo.',manage:'Seleccioná la ruta de atención adecuada.',withdraw:'Completá el retiro del instrumental.',document:'Completá el registro, la comunicación y el seguimiento.'};return map[key]||'';}
function perform(action,provided={}){
 if(!webglReady)return;
 if(action==='result'){showResult();return;}
 const data={...Object.fromEntries($$('#step-content input[type=checkbox]').map(c=>[c.name,c.checked])),...provided};if($('#reagent'))data.reagent=$('#reagent').value;
 const before=sim.current;const out=sim.act(action,data);
 if(out.advance||action==='patient-stop'){renderStep();renderSliders();if(action==='patient-stop')renderTools();}
 if(action==='begin-sample'&&out.ok)renderSliders();
 feedback(out.message,out.ok?'success':out.critical?'error':'warning');
 if(!out.ok&&mode==='exam')$('#mode-label').textContent=`EVALUACIÓN · ${sim.result().score} PUNTOS`;
 if(before==='acid'&&out.ok&&$('#coverage'))$('#coverage').textContent=`Superficie cubierta: ${sim.coverage.size} / 4 sectores didácticos.`;
 scene?.update(sim);updateTelemetry();
 if(sim.finished){store.record(sim.result());renderNav();renderSliders();showResult();}
}
function updateTelemetry(){
 const indicator=$('#geometry-indicator');let text='Explorá la anatomía. Las posiciones corresponden a este modelo.',danger=false;
 if(['sample','acid'].includes(sim.current)&&['spatula','swab'].includes(sim.tool)){
  if(sim.wallContact()){text='Posición fuera del espacio de trabajo. Corregí la trayectoria.';danger=true;}
  else if(sim.mode==='guide')text=sim.contact()?'Punta en la región de contacto del modelo.':'Usá profundidad y posición para acercar la punta al cuello.';
  else text='Observá el contacto de la punta y la superficie cervical.';
 }else if(['insert','visualize','withdraw'].includes(sim.current)){text='Ajustá avance, orientación y apertura con los controles inferiores.';if(sim.spec.depth>76||sim.spec.opening>65){text='Manipulación excesiva en el modelo. Detenete y corregí.';danger=true;}}
 if(sim.finished)text='Caso terminado. Revisá el resultado o iniciá un nuevo intento.';
 indicator.textContent=text;indicator.classList.toggle('danger',danger);
 if($('#sample-progress'))$('#sample-progress').textContent=`${sim.sampleActive?'Contacto establecido':'Contacto pendiente'} · giro acumulado ${Math.round(sim.sampleRotation)}° / 360°`;
 $$('[data-zone]').forEach(el=>{const done=sim.coverage.has(el.dataset.zone);el.classList.toggle('covered',done);el.setAttribute('aria-label',el.textContent+(done?' aplicado':' pendiente'));});const secs=sim.reactionSeconds();$('#timer-chip').classList.toggle('hidden',sim.appliedAt===null||sim.finished);$('#reaction-time').textContent=`${String(Math.floor(secs/60)).padStart(2,'0')}:${String(Math.floor(secs%60)).padStart(2,'0')} / 01:00`;$('#reaction-progress').style.width=secs/60*100+'%';$('#reaction-note').textContent=sim.accelerated?'Tiempo adelantado en práctica':'60 segundos reales';
 if($('#fixation-time'))$('#fixation-time').textContent=`Desde el extendido: ${Math.floor(sim.transferSeconds())} s. Fijación inmediata; no hay un tiempo de espera recomendado.`;
}
function renderAll(){
 $('#module-eyebrow').textContent=currentCase.module==='pap'?'MÓDULO 01 / CITOLOGÍA':'MÓDULO 02 / INSPECCIÓN VISUAL';$('#module-title').textContent=currentCase.module==='pap'?'Toma de Papanicolaou':'Inspección visual con ácido acético';$('#case-title').textContent=currentCase.name;$('#case-profile').textContent=currentCase.profile;renderNav();renderTools();renderSliders();renderStep();
}
function showResult(){
 const r=sim.result(),exam=mode==='exam';
 const explanation=currentCase.module==='via'?EXPLANATIONS[currentCase.kind]:'La toma es una parte del proceso: la identificación, el extendido, la fijación y el seguimiento también influyen en la calidad. La simulación no puede evaluar la suficiencia celular real de una muestra.';
 openModal(`<h2>${exam?(r.passed?'Evaluación aprobada':'Revisá los puntos críticos'):'Práctica completada'}</h2><div class="score-summary"><div class="score-ring ${r.passed?'':'failed'}" style="--score:${r.score}"><b>${r.score}</b><span>DE 100 PUNTOS</span></div><div><p>${exam?'Resultado de este intento formativo.':'Puntuación orientativa de práctica; no se envía como nota al campus.'}</p><span class="badge ${r.passed?'':'pending'}">${exam?(r.passed?'Caso aprobado':'Nuevo intento recomendado'):'Modo de aprendizaje'}</span></div></div><div class="result-meta"><div><b>${Math.floor(r.duration/60)}:${String(r.duration%60).padStart(2,'0')}</b><small>Duración</small></div><div><b>${r.errors.length}</b><small>Errores registrados</small></div><div><b>${r.critical}</b><small>Errores críticos</small></div></div><p>${esc(explanation)}</p>${r.errors.length?'<h3>Para tu próxima práctica</h3>'+r.errors.map(e=>`<div class="review-row"><span>${esc(e.message)}</span><span class="badge pending">${e.critical?'Crítico':`−${e.penalty}`}</span></div>`).join(''):'<div class="mini-callout">Completaste la secuencia del modelo sin errores registrados. Este resultado no acredita destreza manual ni competencia diagnóstica clínica.</div>'}${store.lastError?`<p class="form-error">${esc(store.lastError)}</p>`:''}<div class="modal-actions"><button class="secondary-button" id="download-result">Descargar resultado</button><button class="secondary-button" id="repeat-case">Repetir caso</button><button class="primary-button" id="next-case">${exam?'Siguiente escenario':'Practicar sin ayudas'} →</button></div>`,'REFLEXIÓN Y RETROALIMENTACIÓN');
 $('#download-result').onclick=()=>downloadJSON(r,`resultado-${currentCase.id}.json`);$('#repeat-case').onclick=()=>{closeModal();changeCase(currentCase,mode,true);};$('#next-case').onclick=()=>{closeModal();changeCase(exam?CASES[(CASES.indexOf(currentCase)+1)%CASES.length]:currentCase,'exam',true);};
}
function downloadJSON(data,name){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function showCourse(){openModal(`<h2>Tu recorrido de aprendizaje</h2><p>Se conserva el mejor resultado válido de cada escenario. La aprobación del curso requiere completar los ${CASES.length} casos en evaluación, con al menos 80 puntos por caso y sin errores críticos. La nota global incluye los casos pendientes como cero.</p><div class="result-meta"><div><b>${store.passed}/${CASES.length}</b><small>Casos aprobados</small></div><div><b>${store.score}</b><small>Nota global / 100</small></div><div><b>${store.attempts}</b><small>Intentos completos</small></div></div><div style="margin-top:20px">${CASES.map(c=>`<div class="review-row"><span>${c.module==='pap'?'PAP':'IVAA'} · ${esc(c.name)}</span><span class="badge ${store.results[c.id]?.passed?'':'pending'}">${store.results[c.id]?store.results[c.id].score+' / 100':'Pendiente'}</span></div>`).join('')}</div><p>${store.connected?'Los resultados se comunican a la actividad SCORM del campus.':'Este avance se guarda en este navegador. Un enlace o iframe simple no envía notas a CampusMED; para eso, utilizá el paquete SCORM.'}</p><div class="modal-actions"><button class="secondary-button" id="export-course">Descargar recorrido</button><button class="primary-button" id="close-report">Volver al laboratorio</button></div>`);$('#close-report').onclick=closeModal;$('#export-course').onclick=()=>downloadJSON({course:'Cérvix Lab',schema:1,score:store.score,status:store.status,results:store.results},'recorrido-cervix-lab.json');}
function showHelp(){
 openModal(`<h2>Un espacio para aprender haciendo</h2><p>Cérvix Lab es un prototipo educativo 3D con anatomías y casos sintéticos originales. Su nivel de interacción es avanzado, pero no es un simulador háptico ni una herramienta validada para acreditar competencia clínica.</p><h3>Objetivos del curso</h3><ul><li>Relacionar anatomía, orientación del espéculo y visualización del cuello.</li><li>Practicar la secuencia de citología convencional con espátula, identificación, transferencia y fijación.</li><li>Observar cambios esquemáticos de IVAA y distinguir negativo, positivo, sospecha de invasión y examen no evaluable.</li><li>Elegir seguimiento o evaluación, evitando decisiones automáticas de tratamiento.</li></ul><h3>Cómo manipular el modelo</h3><p>Arrastrá el fondo para girar la cámara; usá la rueda para acercar. Elegí vistas frontal y lateral y alterná el corte anatómico. Seleccioná instrumentos y ajustá los controles. También podés arrastrar directamente la espátula o torunda en 3D; las flechas mueven, W/S cambian profundidad y Q/E giran. La orientación automática solo está disponible en práctica.</p><h3>Perfiles y límites clínicos</h3><ul><li>Estaciones independientes. Si en una visita se realizan ambas pruebas, la citología se obtiene antes del ácido acético.</li><li>Espátula convencional: una vuelta en este perfil. No extrapolar a cepillos o escobillas; verificar instrucciones del dispositivo y protocolo.</li><li>IVAA: ácido acético al 5% y lectura a los 60 s en este perfil. No se enseñan tratamiento ablativo ni intervalos universales de tamizaje.</li><li>Las escalas de profundidad, apertura y orientación son controles virtuales, sin equivalencia clínica. No se mide fuerza, dolor real ni calidad celular.</li><li>Validación docente pendiente: dispositivos, criterios, imágenes, flujo de referencia y adecuación al protocolo local. No se afirma aprobación del MSPAS.</li></ul><h3>Fuentes de consulta</h3><ul class="sources-list">${SOURCES.map(([title,url,desc])=>`<li><a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a> — ${desc}</li>`).join('')}</ul><h3>Código abierto y materiales</h3><p>Motor 3D: <a href="https://github.com/mrdoob/three.js/tree/r180" target="_blank" rel="noopener">Three.js r180</a>, licencia MIT. Comunicación SCORM: <a href="https://github.com/pipwerks/scorm-api-wrapper" target="_blank" rel="noopener">Pipwerks</a>, licencia de tipo MIT. Código del curso, geometrías, texturas y casos originales: licencia MIT incluida. No se han copiado imágenes de pacientes, videos comerciales ni programas de las universidades citadas.</p><p>Los avisos completos están incluidos en la carpeta <b>licenses</b> del paquete. La guía de instalación está en <a href="guia.html" target="_blank" rel="noopener">Guía de instalación y uso</a>.</p>`,'GUÍA DEL LABORATORIO');
}
$$('.module').forEach(b=>b.onclick=()=>changeCase(CASES.find(c=>c.module===b.dataset.module)));
$('#mode-guide').onclick=()=>{if(mode!=='guide')changeCase(currentCase,'guide');};$('#mode-exam').onclick=()=>{if(mode!=='exam')changeCase(currentCase,'exam');};$('#restart').onclick=()=>changeCase(currentCase,mode);$('#help').onclick=showHelp;$('#course-report').onclick=showCourse;$('#home').onclick=e=>{e.preventDefault();showCourse();};
$$('[data-view]').forEach(b=>b.onclick=()=>{scene?.setView(b.dataset.view);$$('[data-view]').forEach(x=>x.classList.toggle('active',x===b));});$('#reset-camera').onclick=()=>{scene?.setView('procedure');$$('[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view==='procedure'));};
$('#cutaway').onclick=()=>{if(!scene)return;scene.toggleCutaway(!scene.cutaway);$('#cutaway').setAttribute('aria-pressed',scene.cutaway);};$('#labels').onclick=()=>{if(!scene)return;scene.labelsVisible=!scene.labelsVisible;$('#labels').setAttribute('aria-pressed',scene.labelsVisible);};
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{feedback('La pantalla completa no está habilitada por el contenedor. Podés ampliar la ventana del navegador.','warning');}};
document.addEventListener('keydown',e=>{if(modal.open||sim.finished||/INPUT|SELECT|TEXTAREA|BUTTON/.test(document.activeElement?.tagName))return;const map={ArrowLeft:['x',-3],ArrowRight:['x',3],ArrowUp:['y',3],ArrowDown:['y',-3],w:['depth',2],s:['depth',-2],q:['rotation',-10],e:['rotation',10]};const k=map[e.key];if(!k)return;const ctrl=controls[sim.tool]?.find(c=>c[0]===k[0]);if(!ctrl)return;e.preventDefault();setPose(k[0],Math.max(ctrl[2],Math.min(ctrl[3],sim.pose[k[0]]+k[1])));});
try{scene=new LabScene($('#viewport'),$('#anatomy-labels'),setPose);scene.setCase(currentCase,mode);scene.update(sim);webglReady=true;$('#loading').remove();}
catch(e){console.error('No se pudo iniciar el entorno 3D:',e);$('#loading').innerHTML='No se pudo iniciar WebGL.<br>Probá un navegador actualizado con aceleración gráfica.';$('#loading').style.padding='25px';}
renderAll();
if(!webglReady){$('#task-actions').innerHTML='<div class="feedback-message error">Se requiere el modelo 3D para completar esta simulación. La evaluación está deshabilitada hasta que el entorno gráfico funcione.</div>';$('#mode-exam').disabled=true;}
else showBrief();
setInterval(updateTelemetry,200);


