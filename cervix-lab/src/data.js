// Original instructional scenarios. No patient data or third-party clinical imagery.
export const CASES = [
  {id:'pap-a',module:'pap',name:'Caso 01 · Exploración inicial',profile:'Adulto · escenario de tamizaje',anatomy:'central',kind:'normal',angle:0,target:[0,0],brief:'Persona adulta que acude a una toma de citología convencional indicada por su programa de atención. Acepta la explicación inicial. El objetivo es completar una toma con espátula, transferencia y fijación, dentro del perfil didáctico de este módulo.'},
  {id:'pap-b',module:'pap',name:'Caso 02 · Orientación posterior',profile:'Variación anatómica',anatomy:'posterior',kind:'normal',angle:12,target:[0,-0.16],brief:'La orientación del cuello requiere ajustar la visualización. La persona puede expresar molestia si la manipulación virtual excede el rango del escenario. Priorizá comodidad y visibilidad antes de tomar la muestra.'},
  {id:'via-a',module:'via',name:'Caso A · Inspección visual',profile:'Observación y decisión',anatomy:'central',kind:'negative',angle:0,target:[0,0],answer:'negative',management:'routine',brief:'Persona adulta remitida a la estación educativa de IVAA según el programa local. Observá el cuello antes de aplicar el reactivo y fundamentá tu clasificación en los hallazgos, no en el nombre del caso.'},
  {id:'via-b',module:'via',name:'Caso B · Inspección visual',profile:'Observación y decisión',anatomy:'central',kind:'mimic',angle:0,target:[0,0],answer:'negative',management:'routine',brief:'La evaluación incluye variaciones benignas de la superficie cervical. Compará la distribución, intensidad y persistencia del cambio de color en el modelo.'},
  {id:'via-c',module:'via',name:'Caso C · Inspección visual',profile:'Observación y decisión',anatomy:'central',kind:'positive',angle:0,target:[0,0],answer:'positive',management:'evaluate',brief:'Observá sistemáticamente la superficie visible y su relación con la unión escamocolumnar. El resultado visual orienta la ruta de atención; no constituye un diagnóstico histológico.'},
  {id:'via-d',module:'via',name:'Caso D · Inspección visual',profile:'Observación y decisión',anatomy:'central',kind:'suspicious',angle:0,target:[0,0],answer:'suspicious',management:'refer',brief:'Comenzá con una inspección basal cuidadosa. Decidí si corresponde continuar el tamizaje habitual o priorizar una evaluación especializada a partir de lo que observás.'},
  {id:'via-e',module:'via',name:'Caso E · Inspección visual',profile:'Observación y decisión',anatomy:'central',kind:'inadequate',angle:0,target:[0,0],answer:'inadequate',management:'resolve',brief:'Antes de interpretar un resultado, comprobá que la visualización permita evaluar el cuello. Documentar una limitación del examen forma parte del desempeño esperado.'}
];
export const TOOLS = [
  {id:'speculum',name:'Espéculo',sub:'Visualización',svg:'<path d="M15 5L30 23Q32 26 29 28L25 28L11 9Q9 5 15 5Z M16 6L36 16Q39 18 36 21L32 22L13 11 M27 28L23 38 M29 26L37 34"/>'},
  {id:'spatula',name:'Espátula',sub:'Citología',svg:'<path d="M23 39V16L17 10L18 4L24 8L29 3L31 9L26 16V39Z"/>'},
  {id:'swab',name:'Torunda',sub:'Aplicación IVAA',svg:'<path d="M24 38V15"/><ellipse cx="24" cy="9" rx="5" ry="8"/>'},
  {id:'slide',name:'Lámina',sub:'Transferencia',svg:'<path d="M7 11L34 5L41 29L14 36Z M13 31L39 24 M11 24L29 20"/>'},
  {id:'fixative',name:'Fijador',sub:'Conservación',svg:'<rect x="15" y="13" width="20" height="25" rx="3"/><path d="M20 13V8H30V13 M22 8V4H36V8H30 M20 22H30 M20 26H30"/>'}
];
export const STEPS = {
  prep:{title:'Prepará el encuentro',short:'Consentimiento y preparación',description:'Confirmá identidad, consentimiento, privacidad y medidas de prevención de infecciones. Prepará también el material que vas a utilizar.'},
  insert:{title:'Orientá el espéculo',short:'Introducción cuidadosa',description:'Seleccioná el espéculo. Avanzá con las valvas cerradas y ajustá la orientación para esta anatomía. Las escalas son posiciones del modelo, no medidas clínicas.'},
  visualize:{title:'Conseguí una buena visualización',short:'Apertura y visualización',description:'Abrí de forma gradual y ajustá la orientación hasta exponer el cuello. Una abertura excesiva no mejora automáticamente el examen.'},
  inspect:{title:'Observá antes de actuar',short:'Inspección basal',description:'Examiná la superficie cervical. Identificá si es posible continuar, si existe una lesión macroscópica sospechosa o si la visualización resulta insuficiente.'},
  sample:{title:'Realizá la toma con espátula',short:'Toma de muestra',description:'Acercá la punta al orificio cervical y mantené contacto durante una vuelta completa. Este perfil usa una espátula convencional: no trasladés la misma rotación a cualquier cepillo o dispositivo.'},
  transfer:{title:'Transferí la muestra',short:'Extendido en lámina',description:'Seleccioná la lámina identificada y realizá la transferencia sin demoras. La preparación de la fijación debe estar lista antes de este momento.'},
  fix:{title:'Fijá inmediatamente',short:'Fijación inmediata',description:'Aplicá el método de fijación del protocolo de citología convencional. Evitá que el extendido se seque. El contador es una ayuda didáctica; no define un tiempo clínico seguro de espera.'},
  acid:{title:'Aplicá el reactivo',short:'Aplicación de ácido acético',description:'Para este perfil se utiliza ácido acético al 5%. Aplicá suavemente con la torunda y cubrí la superficie visible sin frotar.'},
  wait:{title:'Esperá y observá el cambio',short:'Lectura a los 60 segundos',description:'Observá la evolución del epitelio. La lectura de este perfil se realiza a los 60 segundos de la aplicación. Un cambio inmediato y tenue no implica por sí solo positividad.'},
  classify:{title:'Interpretá los hallazgos',short:'Clasificación de IVAA',description:'Basá tu respuesta en la intensidad, los bordes y la distribución del hallazgo. Diferenciá un resultado positivo, una sospecha de invasión y un examen no evaluable.'},
  manage:{title:'Elegí la ruta de atención',short:'Conducta y seguimiento',description:'La estación termina con una decisión de evaluación o seguimiento según el protocolo local. Una IVAA positiva no determina automáticamente un tratamiento.'},
  withdraw:{title:'Retirá con cuidado',short:'Retiro del instrumental',description:'Retirá primero el instrumento de toma o aplicación. Liberá la apertura y retirá el espéculo de forma controlada, evitando atrapar tejidos.'},
  document:{title:'Cerrá el encuentro',short:'Registro y comunicación',description:'Registrá el procedimiento, explicá cómo se comunicarán los resultados o la referencia y documentá las incidencias. Usá únicamente los datos ficticios de este caso.'}
};
export const CLASSIFICATIONS = [
  ['negative','IVAA negativa'],['positive','IVAA positiva'],['suspicious','Sospecha de cáncer invasor'],['inadequate','Examen no evaluable']
];
export const MANAGEMENT = [
  ['routine','Documentar y continuar el programa de tamizaje y seguimiento correspondiente.'],
  ['evaluate','Organizar evaluación y manejo de IVAA positiva según protocolo, verificando elegibilidad antes de cualquier tratamiento.'],
  ['refer','Derivar para evaluación especializada y confirmación diagnóstica de la lesión sospechosa.'],
  ['resolve','Documentar la limitación y organizar una reevaluación o referencia apropiada; no informar un resultado negativo.'],
  ['ablate','Indicar ablación automáticamente, sin más evaluación.']
];
export const EXPLANATIONS = {
  negative:'No aparece una lesión acetoblanca densa y persistente en la zona evaluable. El resultado de este caso es negativo. Debe documentarse y seguir el programa aplicable; no implica descartar toda enfermedad.',
  mimic:'El área es tenue, de bordes difusos y alejada de la unión escamocolumnar. El pequeño relieve corresponde a un quiste de Naboth esquemático. En este caso la interpretación es negativa: no todo blanco es una lesión positiva.',
  positive:'El modelo presenta un área acetoblanca densa, de límites definidos y en contacto con la unión escamocolumnar tras la espera. Es un resultado IVAA positivo, que requiere la ruta de evaluación correspondiente; no confirma por sí solo un diagnóstico histológico.',
  suspicious:'La lesión exofítica e irregular, con ulceración y sangrado simulado, motiva sospecha de invasión desde la inspección basal. Corresponde derivación para evaluación. No debe tratarse como una lesión precancerosa rutinaria ni esperar la reacción para reconocer la sospecha.',
  inadequate:'El sangrado simulado impide evaluar adecuadamente la superficie y la zona de transformación. No se puede informar una IVAA negativa. Hay que documentar la limitación y organizar la evaluación apropiada.'
};
export const SOURCES = [
 ['OMS · Comprehensive cervical cancer control','https://www.ncbi.nlm.nih.gov/books/NBK269619/','Preparación, consentimiento, toma y conservación de muestras.'],
 ['IARC · Atlas de IVAA','https://screening.iarc.fr/viaatlasindex0.php','Aplicación y lectura del ácido acético, interpretación y límites.'],
 ['IARC · Aplicación de ácido acético','https://screening.iarc.fr/atlasviadetail.php?Index=45&e=','Perfil didáctico de ácido acético al 5% y observación a los 60 segundos.'],
 ['IARC · Criterios de resultados visuales','https://www.ncbi.nlm.nih.gov/books/NBK601985/?report=printable','Negativo, positivo y sospecha de invasión.'],
 ['IARC · ESTAMPA','https://pmc.ncbi.nlm.nih.gov/articles/PMC10107773/','Importancia de la evaluación y de los exámenes no evaluables.'],
 ['IARC · Handbook: toma de muestras','https://publications.iarc.who.int/_publications/media/download/3967/209adf17e95b529e3002f4cf59a9c1ef8dafdab2.pdf','Si se realizan ambas pruebas, la citología precede al ácido acético.']
];
export function caseSteps(c){
 const common=['prep','insert','visualize','inspect'];
 return c.module==='pap'?[...common,'sample','transfer','fix','withdraw','document']:[...common,...(['suspicious','inadequate'].includes(c.kind)?[]:['acid','wait']),'classify','manage','withdraw','document'];
}
