import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const mat=(color,roughness=.6,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const mesh=(geometry,material,parent,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
function cylinderBetween(a,b,r,material,parent){const d=b.clone().sub(a);const m=mesh(new THREE.CylinderGeometry(r,r,d.length(),20),material,parent);m.position.copy(a.clone().add(b).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;}
function curveTube(points,r,material,parent){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),50,r,12,false),material,parent);}
function rnd(seed){let n=seed;return()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};}

export class LabScene {
 constructor(container,labelContainer,onDrag){
  this.container=container;this.labelsContainer=labelContainer;this.onDrag=onDrag;this.cutaway=true;this.labelsVisible=true;this.view='procedure';this.lastTexture=-1;this.lastKind='';this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.dragging=false;
  // Transparent canvas: the studio gradient behind it comes from styles.css (.viewport-wrap).
  this.scene=new THREE.Scene();
  this.camera=new THREE.PerspectiveCamera(36,1,.05,60);this.camera.position.set(3.5,2.4,7.5);
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});this.renderer.setClearColor(0x000000,0);this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setSize(container.clientWidth,container.clientHeight);this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.25;this.renderer.outputColorSpace=THREE.SRGBColorSpace;container.appendChild(this.renderer.domElement);
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.target.set(0,-.05,-.7);this.controls.enableDamping=true;this.controls.minDistance=2;this.controls.maxDistance=14;this.controls.maxPolarAngle=Math.PI*.82;this.controls.minPolarAngle=.18;this.controls.enablePan=true;
  this.scene.add(new THREE.HemisphereLight('#fffdf5','#678c7a',2.6));const key=new THREE.DirectionalLight('#fff8ed',3.8);key.position.set(3,7,6);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-6;key.shadow.camera.right=6;key.shadow.camera.top=6;key.shadow.camera.bottom=-6;key.shadow.bias=-.001;this.scene.add(key);const fill=new THREE.DirectionalLight('#d4ebff',1.7);fill.position.set(-5,1,2);this.scene.add(fill);const rim=new THREE.DirectionalLight('#fff4dd',2);rim.position.set(0,3,-5);this.scene.add(rim);const examLight=new THREE.DirectionalLight('#fff7f1',1.5);examLight.position.set(0,-2,7);this.scene.add(examLight);
  this.floor=mesh(new THREE.PlaneGeometry(40,40),new THREE.ShadowMaterial({color:'#0f2a31',opacity:.16}),this.scene,0,-1.47,0);this.floor.rotation.x=-Math.PI/2;this.floor.castShadow=false;
  this.model=new THREE.Group();this.scene.add(this.model);
  this.buildAnatomy();this.buildSpeculum();this.buildInstruments();this.createLabels();this.setupPointer();
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();this.tick=this.tick.bind(this);this.frame=requestAnimationFrame(this.tick);
 }
 buildAnatomy(){
  this.silicone=mat('#b47b77',.56);this.tissue=mat('#c67a78',.52);this.mucosa=mat('#b76b70',.37);this.metal=mat('#c9d9d9',.25,.84);this.darkMetal=mat('#577b82',.3,.7);this.wood=mat('#e6cc8c',.7);this.cotton=mat('#f6f3df',.95);
  const base=mesh(new THREE.BoxGeometry(3.45,.18,5.5),mat('#3f6266',.5),this.model,0,-1.32,-.7);base.geometry.translate(0,0,0);
  for(const x of[-1.55,1.55])for(const z of[-3.2,1.8])mesh(new THREE.CylinderGeometry(.045,.045,.035,16),this.metal,this.model,x,-1.21,z);
  this.canal=new THREE.Group();this.model.add(this.canal);
  const tubeGeo=(half)=>{const pos=[],norm=[],uv=[],ids=[];const n=72,m=65;
   for(let j=0;j<=m;j++){const t=j/m;const z=1.1-t*3.3;for(let i=0;i<=n;i++){const th=(half?Math.PI:0)+i/n*(half?Math.PI:Math.PI*2);const corr=.025*Math.cos(t*Math.PI*34);const rx=.83-corr+.11*(1-t)**3,ry=.64-corr;pos.push(rx*Math.cos(th),ry*Math.sin(th)-.04,z);norm.push(-Math.cos(th),-Math.sin(th),0);uv.push(i/n,t);}}
   for(let j=0;j<m;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i,b=a+n+1;ids.push(a,b,a+1,b,b+1,a+1);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return g;};
  const canalMat=this.mucosa.clone();canalMat.side=THREE.DoubleSide;this.canalFull=mesh(tubeGeo(false),canalMat,this.canal);this.canalFull.visible=false;this.canalHalf=mesh(tubeGeo(true),canalMat,this.canal);
  for(let i=0;i<12;i++){const pts=[];for(let k=0;k<=24;k++){const th=Math.PI+k/24*Math.PI;pts.push([.84*Math.cos(th),.66*Math.sin(th)-.04,.87-i*.26]);}curveTube(pts,.018,mat('#dfaaa2',.6),this.canal);}
  const bodyMat=mat('#cb9b91',.75);bodyMat.transparent=true;bodyMat.opacity=.32;bodyMat.depthWrite=false;this.outer=mesh(new THREE.SphereGeometry(1,48,36),bodyMat,this.model,0,-.44,-.7);this.outer.scale.set(1.48,.91,2.05);
  this.cervix=new THREE.Group();this.cervix.position.z=-2.34;this.model.add(this.cervix);
  const back=mesh(new THREE.SphereGeometry(.72,64,40),this.tissue,this.cervix,0,0,-.2);back.scale.set(1,.91,.52);
  const positions=[],uvs=[],inds=[],nr=24,nt=120;
  for(let j=0;j<=nr;j++){for(let i=0;i<=nt;i++){const th=i/nt*Math.PI*2;const r=.075+j/nr*.635;const z=.185*(1-(r/.71)**2);positions.push(r*Math.cos(th),.92*r*Math.sin(th),z);uvs.push(.5+.5*r/.71*Math.cos(th),.5+.5*.92*r/.71*Math.sin(th));}}
  for(let j=0;j<nr;j++)for(let i=0;i<nt;i++){const a=j*(nt+1)+i,b=a+nt+1;inds.push(a,a+1,b,b,a+1,b+1);}
  const cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));cg.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));cg.setIndex(inds);cg.computeVertexNormals();
  this.textureCanvas=document.createElement('canvas');this.textureCanvas.width=1024;this.textureCanvas.height=1024;this.texture=new THREE.CanvasTexture(this.textureCanvas);this.texture.colorSpace=THREE.SRGBColorSpace;this.texture.anisotropy=8;
  this.faceMaterial=new THREE.MeshStandardMaterial({map:this.texture,roughness:.48,metalness:0,side:THREE.DoubleSide});this.face=mesh(cg,this.faceMaterial,this.cervix);this.os=mesh(new THREE.CircleGeometry(.078,32),mat('#633039',.7),this.cervix,0,0,.184);
  this.pathology=new THREE.Group();this.cervix.add(this.pathology);
  this.uterus=new THREE.Group();this.model.add(this.uterus);const ut=mesh(new THREE.SphereGeometry(1,40,32),mat('#d4998a',.7),this.uterus,0,.85,-3.03);ut.scale.set(.84,1.05,.43);const uterusFront=mesh(new THREE.SphereGeometry(1,40,32),mat('#dbaaa0',.7),this.uterus,0,.85,-2.84);uterusFront.scale.set(.55,.8,.13);
  for(const side of[-1,1]){curveTube([[side*.48,1.55,-3],[side*.95,1.88,-3],[side*1.36,1.78,-2.9],[side*1.5,1.48,-2.8]],.063,this.tissue,this.uterus);const ov=mesh(new THREE.SphereGeometry(.2,32,24),mat('#dec2a0',.8),this.uterus,side*1.38,1.38,-2.8);ov.scale.set(.8,1.18,.8);}
  this.halo=mesh(new THREE.TorusGeometry(.115,.009,8,64),new THREE.MeshBasicMaterial({color:'#42bca6',transparent:true,opacity:.7,depthTest:false}),this.model,0,0,-2.1);this.halo.renderOrder=5;
  this.paintTexture('normal',0);
 }
 buildSpeculum(){
  this.speculum=new THREE.Group();this.model.add(this.speculum);
  const bladeGeometry=()=>{const p=[],uv=[],idx=[];const n=40,m=16;for(let j=0;j<=n;j++){const t=j/n;const z=-2.6*t;const width=.26*(.65+.35*Math.sin(Math.PI*t*.92));for(let i=0;i<=m;i++){const u=(i/m-.5)*2;p.push(u*width,.035+.065*u*u+.05*Math.sin(t*Math.PI),z);uv.push(i/m,t);}}for(let j=0;j<n;j++)for(let i=0;i<m;i++){const a=j*(m+1)+i,b=a+m+1;idx.push(a,b,a+1,b,b+1,a+1);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;};
  const sm=this.metal.clone();sm.side=THREE.DoubleSide;
  this.upperPivot=new THREE.Group();this.lowerPivot=new THREE.Group();this.speculum.add(this.upperPivot,this.lowerPivot);mesh(bladeGeometry(),sm,this.upperPivot);const lower=mesh(bladeGeometry(),sm,this.lowerPivot);lower.rotation.z=Math.PI;
  cylinderBetween(new THREE.Vector3(-.32,-.34,.03),new THREE.Vector3(.32,-.34,.03),.07,this.darkMetal,this.speculum);
  curveTube([[.25,0,.05],[.3,-.35,.1],[.26,-.75,.3],[.15,-1,.42]],.065,this.metal,this.speculum);
  curveTube([[-.25,0,.05],[-.3,-.35,.1],[-.24,-.7,.2]],.058,this.metal,this.speculum);
  mesh(new THREE.SphereGeometry(.1,20,16),this.darkMetal,this.speculum,.25,-.62,.24);this.speculum.traverse(o=>{if(o.isMesh)o.castShadow=false;});
 }
 buildInstruments(){
  this.instruments={};
  const spatula=new THREE.Group();this.model.add(spatula);const handle=mesh(new THREE.BoxGeometry(.085,.026,2.1),this.wood,spatula,0,0,1.27);const shape=new THREE.Shape();shape.moveTo(-.06,.14);shape.lineTo(-.13,.03);shape.lineTo(-.1,-.09);shape.lineTo(-.035,-.13);shape.lineTo(0,-.055);shape.lineTo(.055,-.12);shape.lineTo(.13,-.035);shape.lineTo(.1,.07);shape.lineTo(.045,.14);shape.closePath();const head=mesh(new THREE.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:true,bevelSize:.008,bevelThickness:.005,bevelSegments:2,steps:1}),this.wood,spatula,0,0,0);head.rotation.x=Math.PI/2;head.scale.set(1,2,1);this.instruments.spatula=spatula;
  const swab=new THREE.Group();this.model.add(swab);cylinderBetween(new THREE.Vector3(0,0,.15),new THREE.Vector3(0,0,2.8),.022,this.wood,swab);const cotton=mesh(new THREE.SphereGeometry(.075,28,20),this.cotton,swab,0,0,.025);cotton.scale.set(1,1,2);this.instruments.swab=swab;
  const slide=new THREE.Group();this.model.add(slide);const glass=mat('#eaf9f4',.15);glass.transparent=true;glass.opacity=.72;mesh(new THREE.BoxGeometry(.55,.014,1.3),glass,slide);mesh(new THREE.BoxGeometry(.54,.015,.25),mat('#f1ebd6',.9),slide,0,.01,.51);mesh(new THREE.CircleGeometry(.13,32),mat('#d4a3a5',.7),slide,0,.017,-.12).rotation.x=-Math.PI/2;this.instruments.slide=slide;
  const fix=new THREE.Group();this.model.add(fix);mesh(new THREE.CylinderGeometry(.17,.18,.65,32),mat('#dce4d4',.42),fix,0,.2,0);mesh(new THREE.CylinderGeometry(.1,.1,.18,24),this.darkMetal,fix,0,.61,0);mesh(new THREE.BoxGeometry(.25,.075,.1),this.darkMetal,fix,.065,.71,0);this.instruments.fixative=fix;
  for(const g of Object.values(this.instruments))g.visible=false;
 }
 paintTexture(kind,t){
  const c=this.textureCanvas.getContext('2d'),size=1024,cx=512,cy=512;const random=rnd(42);c.clearRect(0,0,size,size);let grd=c.createRadialGradient(cx,cy,70,cx,cy,520);grd.addColorStop(0,'#b76570');grd.addColorStop(.25,'#c77c80');grd.addColorStop(.65,'#d29391');grd.addColorStop(1,'#bd7c7d');c.fillStyle=grd;c.fillRect(0,0,size,size);
  for(let i=0;i<1600;i++){let x=random()*size,y=random()*size,r=1+random()*3;c.fillStyle=`rgba(${random()>.5?'120,50,60':'255,220,200'},${.02+random()*.06})`;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
  for(let i=0;i<34;i++){let a=random()*Math.PI*2,r=190+random()*270;c.strokeStyle='rgba(145,63,76,.17)';c.lineWidth=1+random()*2;c.beginPath();c.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);for(let j=1;j<5;j++){let ar=a+Math.sin(j)*.025;c.lineTo(cx+Math.cos(ar)*(r+j*12),cy+Math.sin(ar)*(r+j*12));}c.stroke();}
  // Everted columnar region and a non-diagnostic outline of the transformation area.
  c.fillStyle='#ba5264';c.beginPath();for(let i=0;i<120;i++){const a=i/120*Math.PI*2,r=124+10*Math.sin(a*7)+6*Math.cos(a*13);const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.84;i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();c.fill();c.strokeStyle='rgba(147,74,79,.5)';c.lineWidth=3;c.stroke();
  if(t>0){const a=Math.min(1,t/60);c.fillStyle=`rgba(240,220,211,${Math.max(0,.16*(1-a*1.2))})`;c.beginPath();c.ellipse(cx,cy,123,103,0,0,Math.PI*2);c.fill();}
  if(kind==='positive'&&t>0){const a=Math.max(0,Math.min(1,(t-5)/45));c.fillStyle=`rgba(246,242,214,${a*.95})`;c.beginPath();c.moveTo(542,405);c.bezierCurveTo(590,325,727,322,743,432);c.bezierCurveTo(748,513,669,560,622,537);c.bezierCurveTo(614,470,579,431,542,405);c.closePath();c.fill();c.strokeStyle=`rgba(255,250,224,${a*.65})`;c.lineWidth=6;c.stroke();}
  if(kind==='mimic'){
   c.fillStyle='#e2cfab';c.beginPath();c.ellipse(302,364,25,18,-.3,0,Math.PI*2);c.fill();c.strokeStyle='#cbb392';c.lineWidth=2;c.stroke();
   if(t>0){const a=.32*Math.min(1,t/5)*(1-t/100);const g=c.createRadialGradient(763,665,0,763,665,110);g.addColorStop(0,`rgba(245,235,222,${a})`);g.addColorStop(1,'rgba(245,235,222,0)');c.fillStyle=g;c.beginPath();c.ellipse(763,665,120,85,-.5,0,Math.PI*2);c.fill();}
  }
  if(kind==='suspicious'){
   c.fillStyle='#803847';c.beginPath();c.ellipse(545,465,165,131,.3,0,Math.PI*2);c.fill();c.fillStyle='#53313c';c.beginPath();c.ellipse(526,492,88,68,.1,0,Math.PI*2);c.fill();c.strokeStyle='#a03043';c.lineWidth=17;c.beginPath();c.moveTo(561,498);c.bezierCurveTo(616,590,560,635,604,779);c.stroke();
  }
  if(kind==='inadequate'){
   for(let i=0;i<8;i++){const x=350+random()*310,y=340+random()*300;c.fillStyle=`rgba(125,32,50,${.75+random()*.2})`;c.beginPath();c.ellipse(x,y,130+random()*90,110+random()*130,random()*2,0,Math.PI*2);c.fill();}c.fillStyle='#8e3549';c.beginPath();c.ellipse(512,512,105,90,0,0,Math.PI*2);c.fill();
  }
  this.texture.needsUpdate=true;
 }
 setCase(c,mode){
  this.case=c;this.mode=mode;this.cervix.position.set(c.target[0],c.target[1],-2.34);this.cervix.rotation.x=c.anatomy==='posterior'?-.12:0;this.halo.position.set(c.target[0],c.target[1],-2.1);
  while(this.pathology.children.length){const o=this.pathology.children[0];this.pathology.remove(o);o.geometry?.dispose();o.material?.dispose();}
  if(c.kind==='suspicious'){const random=rnd(7);for(let i=0;i<11;i++){const a=random()*Math.PI*2,r=.16+random()*.16;const m=mesh(new THREE.SphereGeometry(.075+random()*.06,20,16),mat(i%3===0?'#8a3c4b':'#b76570',.48),this.pathology,Math.cos(a)*r+.03,Math.sin(a)*r+.03,.17+random()*.03);m.scale.set(1,.8,.6);}}
  if(c.kind==='inadequate'){const b=mesh(new THREE.CircleGeometry(.22,40),mat('#8c3345',.4),this.pathology,0,0,.2);b.scale.set(1.3,1,1);}
  this.lastTexture=-1;this.lastKind='';this.paintTexture(c.kind,0);this.setView('procedure');
 }
 setView(view){this.view=view;const cams={procedure:[[3.45,2.2,7.2],[0,-.08,-.8]],front:[[0,.02,2.1],[0,0,-2.34]],side:[[5.2,1.15,-.3],[0,0,-.7]]};const cfg=cams[view]||cams.procedure;this.camera.fov=view==='front'?28:36;this.camera.updateProjectionMatrix();this.camera.position.fromArray(cfg[0]);this.controls.target.fromArray(cfg[1]);this.controls.update();if(this.uterus)this.uterus.visible=this.cutaway&&view!=='front';}
 toggleCutaway(v){this.cutaway=v;this.canalHalf.visible=v;this.canalFull.visible=!v;this.outer.visible=v;this.uterus.visible=v&&this.view!=='front';}
 update(sim){
  this.sim=sim;const sp=sim.spec;this.speculum.position.set(0,0,3.4-sp.depth/100*5.2);this.speculum.rotation.x=THREE.MathUtils.degToRad(sp.angle)*.35;this.upperPivot.rotation.x=sp.opening/100*.5;this.lowerPivot.rotation.x=-sp.opening/100*.35;this.upperPivot.position.y=sp.opening/100*.1;this.lowerPivot.position.y=-sp.opening/100*.1;
  for(const [id,g] of Object.entries(this.instruments)){g.visible=sim.tool===id;if(id==='slide'||id==='fixative'){g.position.set(1.2,-.65,.7);g.rotation.set(0,-.4,0);}else{g.position.set(sim.pose.x/100,sim.pose.y/100,3.4-sim.pose.depth/100*6.6);g.rotation.set(0,0,THREE.MathUtils.degToRad(sim.pose.rotation));}}
  this.speculum.visible=this.view!=='front'||(sim.spec.depth>25&&!sim.finished);this.halo.visible=sim.mode==='guide'&&['sample','acid'].includes(sim.current);this.halo.material.color.set(sim.contact()?'#2e9b7d':'#e8b36c');
  const t=sim.reactionSeconds(),bucket=Math.floor(t*3);if(bucket!==this.lastTexture||this.lastKind!==sim.case.kind){this.paintTexture(sim.case.kind,t);this.lastTexture=bucket;this.lastKind=sim.case.kind;}
 }
 createLabels(){this.labels=[['Cuello uterino',new THREE.Vector3(.73,.38,-2.25)],['Canal vaginal',new THREE.Vector3(-.88,-.39,-.6)],['Útero · vista esquemática',new THREE.Vector3(.55,1.8,-3)]];for(const item of this.labels){const el=document.createElement('span');el.className='anatomy-label';el.textContent=item[0];this.labelsContainer.appendChild(el);item.push(el);}}
 updateLabels(){for(const [text,pos,el] of this.labels){const p=pos.clone().project(this.camera);const hidden=!this.labelsVisible||p.z>1||p.z< -1||(!this.cutaway&&text.startsWith('Útero'))||(this.view==='front'&&text!=='Cuello uterino');el.style.display=hidden?'none':'block';el.style.left=(p.x*.5+.5)*this.container.clientWidth+'px';el.style.top=(-p.y*.5+.5)*this.container.clientHeight+'px';}}
 setupPointer(){
  const canvas=this.renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','Modelo anatómico 3D. Flechas para mover el instrumento, W y S para profundidad, Q y E para giro.');canvas.addEventListener('pointerdown',()=>canvas.focus({preventScroll:true}));
  canvas.addEventListener('pointerdown',e=>{if(!this.sim||!['spatula','swab'].includes(this.sim.tool))return;const rect=canvas.getBoundingClientRect();this.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);if(this.raycaster.intersectObjects(this.instruments[this.sim.tool].children,true).length){this.dragging=true;this.controls.enabled=false;canvas.setPointerCapture(e.pointerId);e.preventDefault();}},true);
  canvas.addEventListener('pointermove',e=>{if(!this.dragging)return;const rect=canvas.getBoundingClientRect();this.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);const plane=new THREE.Plane(new THREE.Vector3(0,0,1),-(3.4-this.sim.pose.depth/100*6.6));const hit=new THREE.Vector3();if(this.raycaster.ray.intersectPlane(plane,hit)){this.onDrag('x',Math.round(THREE.MathUtils.clamp(hit.x*100,-85,85)));this.onDrag('y',Math.round(THREE.MathUtils.clamp(hit.y*100,-70,70)));}});
  const end=()=>{this.dragging=false;this.controls.enabled=true;};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
 }
 resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h);}
 tick(){this.controls.update();if(this.sim)this.update(this.sim);this.updateLabels();this.renderer.render(this.scene,this.camera);this.frame=requestAnimationFrame(this.tick);}
 dispose(){cancelAnimationFrame(this.frame);this.resizeObserver.disconnect();this.controls.dispose();this.renderer.dispose();}
}





