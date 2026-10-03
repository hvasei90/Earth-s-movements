import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";
import {OrbitControls} from "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/controls/OrbitControls.js";

const canvas=document.getElementById("scene");
let renderer;
try {
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
} catch(err) {
  console.error(err);
  const msg=document.createElement("div");
  msg.style.cssText="position:fixed;inset:0;display:grid;place-items:center;color:#fff;font:16px sans-serif;background:#02050c;z-index:9999";
  msg.textContent="WebGL در این مرورگر فعال نیست.";
  document.body.appendChild(msg);
  throw err;
}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x02050c);
scene.fog=new THREE.FogExp2(0x02050c,0.0009);

const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,5000);
camera.position.set(0,5.0,10.8);

const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;
controls.dampingFactor=.045;
controls.minDistance=5.4;
controls.maxDistance=24;
controls.target.set(0,0,0);

scene.add(new THREE.AmbientLight(0x17304c,.30));

const sun=new THREE.Mesh(
  new THREE.SphereGeometry(.62,32,32),
  new THREE.MeshBasicMaterial({color:0xfff2b0})
);
sun.position.set(8,3,-10);
scene.add(sun);

const sunLight=new THREE.DirectionalLight(0xffffff,3.2);
scene.add(sunLight);
const sunGlow=new THREE.Mesh(
  new THREE.SphereGeometry(.85,32,32),
  new THREE.MeshBasicMaterial({color:0xffc64b,transparent:true,opacity:.12,blending:THREE.AdditiveBlending,depthWrite:false})
);
sun.add(sunGlow);

const starsGeo=new THREE.BufferGeometry();
const starCount=6000;
const starPos=new Float32Array(starCount*3);
for(let i=0;i<starCount;i++){
  const r=180+Math.random()*220;
  const a=Math.random()*Math.PI*2;
  const u=Math.random()*2-1;
  const s=Math.sqrt(1-u*u);
  starPos[i*3]=r*s*Math.cos(a);
  starPos[i*3+1]=r*u;
  starPos[i*3+2]=r*s*Math.sin(a);
}
starsGeo.setAttribute("position",new THREE.BufferAttribute(starPos,3));
scene.add(new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0xbfd8ff,size:.55,sizeAttenuation:true,transparent:true,opacity:.72})));

const earthSystem=new THREE.Group();
scene.add(earthSystem);

// Earth axis is tilted 23.44° relative to the orbital normal.
const TILT=THREE.MathUtils.degToRad(23.44);
earthSystem.rotation.z=TILT;

const earthRadius=3;
const textureLoader=new THREE.TextureLoader();
textureLoader.setCrossOrigin("anonymous");

const earthTexture=textureLoader.load("https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg");
earthTexture.colorSpace=THREE.SRGBColorSpace;
const normalTexture=textureLoader.load("https://threejs.org/examples/textures/planets/earth_normal_2048.jpg");
const specTexture=textureLoader.load("https://threejs.org/examples/textures/planets/earth_specular_2048.jpg");

const earth=new THREE.Mesh(
  new THREE.SphereGeometry(earthRadius,96,64),
  new THREE.MeshPhongMaterial({
    map:earthTexture,normalMap:normalTexture,specularMap:specTexture,
    specular:new THREE.Color(0x233b4e),shininess:12
  })
);
earth.rotation.y=Math.PI;
earthSystem.add(earth);

const atmosphere=new THREE.Mesh(
  new THREE.SphereGeometry(3.075,64,48),
  new THREE.MeshPhongMaterial({color:0x5ebeff,transparent:true,opacity:.12,side:THREE.FrontSide,depthWrite:false,blending:THREE.AdditiveBlending})
);
earthSystem.add(atmosphere);

const axisMat=new THREE.LineBasicMaterial({color:0xff6e6e,transparent:true,opacity:.9});
const axisGeo=new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(0,-4.15,0),new THREE.Vector3(0,4.15,0)
]);
earthSystem.add(new THREE.Line(axisGeo,axisMat));

function makeRing(radius,color,opacity=1){
  const g=new THREE.BufferGeometry();
  const pts=[];
  for(let i=0;i<=256;i++){const a=i/256*Math.PI*2;pts.push(new THREE.Vector3(Math.cos(a)*radius,0,Math.sin(a)*radius))}
  g.setFromPoints(pts);
  return new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity}));
}
const equator=makeRing(3.012,0x67d8ff,.75);
earthSystem.add(equator);

const tropicN=new THREE.Group(), tropicS=new THREE.Group();
function latitudeRing(lat,color,opacity=.38){
  const r=earthRadius*Math.cos(THREE.MathUtils.degToRad(lat));
  const y=earthRadius*Math.sin(THREE.MathUtils.degToRad(lat));
  const g=new THREE.BufferGeometry(), pts=[];
  for(let i=0;i<=256;i++){const a=i/256*Math.PI*2;pts.push(new THREE.Vector3(r*Math.cos(a),y,r*Math.sin(a)))}
  g.setFromPoints(pts);
  return new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity}));
}
earthSystem.add(latitudeRing(23.44,0xffb85e,.42));
earthSystem.add(latitudeRing(-23.44,0xffb85e,.42));

const zoneGroup=new THREE.Group();
earthSystem.add(zoneGroup);

function meridianLine(lon,major=false){
  const pts=[];
  const L=THREE.MathUtils.degToRad(lon);
  for(let i=0;i<=128;i++){
    const lat=-Math.PI/2+i/128*Math.PI;
    const r=earthRadius*1.012;
    pts.push(new THREE.Vector3(
      r*Math.cos(lat)*Math.sin(L),
      r*Math.sin(lat),
      r*Math.cos(lat)*Math.cos(L)
    ));
  }
  const geo=new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.Line(geo,new THREE.LineBasicMaterial({
    color:major?0x65dcff:0x4e83a1,
    transparent:true,opacity:major?.62:.20
  }));
}
for(let lon=-180;lon<180;lon+=15) zoneGroup.add(meridianLine(lon,lon%15===0));

function centralMeridianLabel(lon){
  // Small floating marker at equator for each 15° zone center.
  const g=new THREE.Group();
  const a=THREE.MathUtils.degToRad(lon);
  const r=3.18;
  g.position.set(r*Math.sin(a),0,r*Math.cos(a));
  const mat=new THREE.MeshBasicMaterial({color:0x66dfff});
  g.add(new THREE.Mesh(new THREE.SphereGeometry(.035,8,8),mat));
  return g;
}
for(let lon=-180;lon<180;lon+=15) zoneGroup.add(centralMeridianLabel(lon));

// 24 hour sectors, slightly above the globe surface.
const sectorGroup=new THREE.Group();
earthSystem.add(sectorGroup);
for(let i=0;i<24;i++){
  const lon1=THREE.MathUtils.degToRad(-180+i*15);
  const lon2=THREE.MathUtils.degToRad(-180+(i+1)*15);
  const pts=[];
  for(let j=0;j<=12;j++){
    const a=lon1+(lon2-lon1)*j/12;
    pts.push(new THREE.Vector3(3.025*Math.sin(a),0,3.025*Math.cos(a)));
  }
  const geo=new THREE.BufferGeometry().setFromPoints(pts);
  sectorGroup.add(new THREE.Line(geo,new THREE.LineBasicMaterial({color:0x54cfff,transparent:true,opacity:.24})));
}

// Orbit path and Earth orbital plane.
const orbitRadius=7.1;
const orbitPts=[];
for(let i=0;i<=512;i++){
  const a=i/512*Math.PI*2;
  orbitPts.push(new THREE.Vector3(Math.cos(a)*orbitRadius,0,Math.sin(a)*orbitRadius));
}
const orbit=new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(orbitPts),
  new THREE.LineBasicMaterial({color:0x41647e,transparent:true,opacity:.5})
);
scene.add(orbit);

const sunLineMat=new THREE.LineBasicMaterial({color:0xffc45b,transparent:true,opacity:.22});
const sunRayGeo=new THREE.BufferGeometry();
sunRayGeo.setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,0)]);
const sunRay=new THREE.Line(sunRayGeo,sunLineMat);
scene.add(sunRay);

// Subtle terminator ring projected around Earth.
const terminator=new THREE.Mesh(
  new THREE.TorusGeometry(3.025,.012,6,128),
  new THREE.MeshBasicMaterial({color:0xd9edff,transparent:true,opacity:.35})
);
terminator.rotation.x=Math.PI/2;
earthSystem.add(terminator);

let simDay=80.0; // March 21-ish
let running=true;
let simSpeed=1;
let mode="sim";
let longitude=0;

const seasons={
  march:{day:80,label:"اعتدال بهاری"},
  june:{day:172,label:"انقلاب تابستانی"},
  september:{day:266,label:"اعتدال پاییزی"},
  december:{day:355,label:"انقلاب زمستانی"}
};

const $=id=>document.getElementById(id);

function solarDeclination(day){
  // Smooth astronomical approximation, adequate for visual/educational simulation.
  return -23.44*Math.cos(THREE.MathUtils.degToRad((360/365.2422)*(day-10)));
}
function equationOfTime(day){
  const B=THREE.MathUtils.degToRad((360/364)*(day-81));
  return 9.87*Math.sin(2*B)-7.53*Math.cos(B)-1.5*Math.sin(B);
}
function pad(n){return String(Math.floor(n)).padStart(2,"0")}
function formatClock(hours){
  hours=(hours+24)%24;
  const h=Math.floor(hours), m=Math.floor((hours-h)*60), s=Math.floor((((hours-h)*60)-m)*60);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
function monthDay(day){
  const months=[31,28,31,30,31,30,31,31,30,31,30,31];
  let d=Math.max(1,Math.floor(day));
  let m=0;
  while(d>months[m] && m<11){d-=months[m];m++}
  const names=["ژانویه","فوریه","مارس","آوریل","مه","ژوئن","ژوئیه","اوت","سپتامبر","اکتبر","نوامبر","دسامبر"];
  return `${d} ${names[m]}`;
}
function seasonForDay(day){
  const points=[
    [80,"اعتدال بهاری"],[172,"انقلاب تابستانی"],[266,"اعتدال پاییزی"],[355,"انقلاب زمستانی"]
  ];
  let best=points[0], dist=999;
  for(const p of points){
    let dd=Math.abs(day-p[0]);dd=Math.min(dd,365-dd);
    if(dd<dist){dist=dd;best=p}
  }
  return best[1];
}
function updateReadouts(){
  const dec=solarDeclination(simDay);
  $("declination").textContent=`${dec>=0?"+":""}${dec.toFixed(2)}°`;
  $("longitudeValue").textContent=`${longitude>0?"+":""}${longitude}°`;

  let solarHours;
  if(mode==="live"){
    const now=new Date();
    const utc=now.getUTCHours()+now.getUTCMinutes()/60+now.getUTCSeconds()/3600;
    solarHours=(utc+longitude/15+equationOfTime(simDay)/60+24)%24;
  }else{
    const rotationHours=(simDay-Math.floor(simDay))*24;
    solarHours=(rotationHours+longitude/15+24)%24;
  }
  const zoneCenter=Math.round(longitude/15)*15;
  let official=solarHours+(zoneCenter-longitude)/15;
  official=(official+24)%24;

  $("solarTime").textContent=formatClock(solarHours).slice(0,5);
  $("zoneTime").textContent=formatClock(official).slice(0,5);
  $("dateText").textContent=monthDay(simDay);
  $("dayOfYear").textContent=`روز ${Math.floor(simDay)}`;
  $("seasonPill").textContent=seasonForDay(simDay);
}
function updateEarth(day){
  const angle=day/365.2422*Math.PI*2;
  const x=Math.cos(angle)*orbitRadius;
  const z=Math.sin(angle)*orbitRadius;
  earthSystem.position.set(x,0,z);

  // Orbital motion around the Sun. Earth axis remains parallel to itself in inertial space.
  earthSystem.rotation.z=TILT;

  // Axial rotation: one turn per solar day.
  const frac=day-Math.floor(day);
  earth.rotation.y=Math.PI + frac*Math.PI*2;

  sunLight.position.copy(sun.position);
  sunRay.geometry.setFromPoints([sun.position.clone(),earthSystem.position.clone()]);
  sunRay.geometry.attributes.position.needsUpdate=true;

  // Rotate terminator according to Sun-Earth direction.
  const toSun=sun.position.clone().sub(earthSystem.position).normalize();
  terminator.rotation.z=Math.atan2(toSun.x,toSun.z);
}
function syncLive(){
  const now=new Date();
  const start=new Date(now.getFullYear(),0,1);
  simDay=(now-start)/86400000+1;
}
function animate(){
  requestAnimationFrame(animate);
  if(mode==="live") syncLive();
  else if(running) simDay=(simDay+(simSpeed*0.12/60))%365.2422;
  updateEarth(simDay);
  updateReadouts();
  controls.update();
  renderer.render(scene,camera);
}
animate();

$("longitude").addEventListener("input",e=>{longitude=Number(e.target.value);updateReadouts()});
// ---------- Robust UI controls ----------
function setMode(newMode){
  mode=newMode;
  document.querySelectorAll(".mode").forEach(x=>{
    x.classList.toggle("active", x.dataset.mode===newMode);
  });
  if(newMode==="live"){
    syncLive();
    running=true;
    $("play").textContent="❚❚";
  }
  updateReadouts();
}

function setSeason(key){
  const item=seasons[key];
  if(!item) return;
  mode="sim";
  document.querySelectorAll(".mode").forEach(x=>{
    x.classList.toggle("active", x.dataset.mode==="sim");
  });
  document.querySelectorAll(".season-btn").forEach(x=>{
    x.classList.toggle("active", x.dataset.season===key);
  });
  simDay=item.day;
  running=false;
  $("play").textContent="▶";
  updateEarth(simDay);
  updateReadouts();
}

// Event delegation means controls keep working even after UI updates.
document.addEventListener("click",(e)=>{
  const modeButton=e.target.closest(".mode");
  if(modeButton){
    setMode(modeButton.dataset.mode);
    return;
  }

  const seasonButton=e.target.closest(".season-btn");
  if(seasonButton){
    setSeason(seasonButton.dataset.season);
    return;
  }

  if(e.target.closest("#play")){
    running=!running;
    $("play").textContent=running?"❚❚":"▶";
    return;
  }

  if(e.target.closest("#forward")){
    simSpeed=Math.min(simSpeed*2,32);
    $("speedText").textContent=`${simSpeed} روز / 4 ثانیه`;
    return;
  }

  if(e.target.closest("#reverse")){
    simSpeed=Math.max(simSpeed/2,.25);
    $("speedText").textContent=`${simSpeed} روز / 4 ثانیه`;
    return;
  }
});

$("longitude").addEventListener("input",e=>{
  longitude=Number(e.target.value);
  updateReadouts();
});

// Keyboard shortcuts
window.addEventListener("keydown",e=>{
  if(e.code==="Space"){
    e.preventDefault();
    running=!running;
    $("play").textContent=running?"❚❚":"▶";
  }
  if(e.key==="ArrowRight"){
    simDay=(simDay+1)%365.2422;
    mode="sim";
    updateEarth(simDay); updateReadouts();
  }
  if(e.key==="ArrowLeft"){
    simDay=(simDay-1+365.2422)%365.2422;
    mode="sim";
    updateEarth(simDay); updateReadouts();
  }
});


addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});

canvas.addEventListener("pointerdown",()=>{$("hint").style.opacity=".15"},{once:true});

setSeason('march');
