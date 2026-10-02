import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const sceneEl = document.getElementById("scene");
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1000);
camera.position.set(0, 4.2, 10.5);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
sceneEl.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 5.2;
controls.maxDistance = 18;
controls.target.set(0,0,0);

scene.add(new THREE.AmbientLight(0x25314a, 0.32));

const sunLight = new THREE.PointLight(0xffffff, 5.2, 0, 0);
sunLight.position.set(0,0,0);
scene.add(sunLight);

const starGeo = new THREE.BufferGeometry();
const starCount = 1800;
const starPos = new Float32Array(starCount*3);
for(let i=0;i<starCount;i++){
  const r=45+Math.random()*35, a=Math.random()*Math.PI*2, z=(Math.random()*2-1);
  const s=Math.sqrt(1-z*z);
  starPos[i*3]=r*s*Math.cos(a);
  starPos[i*3+1]=r*z;
  starPos[i*3+2]=r*s*Math.sin(a);
}
starGeo.setAttribute("position",new THREE.BufferAttribute(starPos,3));
scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xffffff,size:.07,sizeAttenuation:true})));

const earthGroup = new THREE.Group();
scene.add(earthGroup);
const tiltGroup = new THREE.Group();
earthGroup.add(tiltGroup);
tiltGroup.rotation.z = THREE.MathUtils.degToRad(23.5);

const earth = new THREE.Mesh(
  new THREE.SphereGeometry(2.05,64,64),
  new THREE.MeshStandardMaterial({
    color:0x2e79b7,roughness:.88,metalness:.02
  })
);
tiltGroup.add(earth);

// Atmosphere
const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(2.12,64,64),
  new THREE.MeshBasicMaterial({color:0x62c8ff,transparent:true,opacity:.10,side:THREE.BackSide})
);
tiltGroup.add(atmosphere);

// Simple latitude/longitude lines: visual aid
const gridGroup = new THREE.Group();
tiltGroup.add(gridGroup);
function addRing(radius, rotX=0, rotY=0, rotZ=0){
  const g=new THREE.TorusGeometry(radius,.008,4,100);
  const m=new THREE.MeshBasicMaterial({color:0x8bdcff,transparent:true,opacity:.22});
  const o=new THREE.Mesh(g,m); o.rotation.set(rotX,rotY,rotZ); gridGroup.add(o);
}
for(let i=-2;i<=2;i++) addRing(2.055*Math.cos(i*Math.PI/6),0,i*Math.PI/6,0);
for(let lat=-60;lat<=60;lat+=30) {
  const r=2.055*Math.cos(THREE.MathUtils.degToRad(lat));
  const y=2.055*Math.sin(THREE.MathUtils.degToRad(lat));
  const tor=new THREE.Mesh(new THREE.TorusGeometry(r,.006,4,100),new THREE.MeshBasicMaterial({color:0x9adfff,transparent:true,opacity:.18}));
  tor.position.y=y; tor.rotation.x=Math.PI/2; gridGroup.add(tor);
}

// Day/night marker
const marker = new THREE.Mesh(
  new THREE.SphereGeometry(.09,16,16),
  new THREE.MeshBasicMaterial({color:0xfff1a0})
);
marker.position.set(2.05,0,0);
tiltGroup.add(marker);

// Axis
const axis = new THREE.Mesh(
  new THREE.CylinderGeometry(.025,.025,5.4,12),
  new THREE.MeshBasicMaterial({color:0xff7373})
);
axis.rotation.z=Math.PI/2;
tiltGroup.add(axis);

// North/south caps
function cap(y, text){
  const c=document.createElement("canvas"); c.width=256;c.height=64;
  const x=c.getContext("2d"); x.fillStyle="white";x.font="bold 24px Arial";x.textAlign="center";x.fillText(text,128,40);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true}));
  sp.scale.set(1.1,.28,1);sp.position.set(0,y,0);tiltGroup.add(sp);
}
cap(2.35,"شمال"); cap(-2.35,"جنوب");

// Sun
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(.78,48,48),
  new THREE.MeshBasicMaterial({color:0xffc94f})
);
sun.position.set(-7,0,0);
scene.add(sun);
const glow = new THREE.Mesh(
  new THREE.SphereGeometry(1.05,32,32),
  new THREE.MeshBasicMaterial({color:0xffbd4a,transparent:true,opacity:.13})
);
sun.add(glow);

const sunGroup = new THREE.Group();
scene.add(sunGroup);
sunGroup.add(earthGroup);
earthGroup.position.set(7,0,0);

// Orbit visualization
const orbit = new THREE.LineLoop(
  new THREE.BufferGeometry().setFromPoints(
    Array.from({length:129},(_,i)=>{
      const a=i/128*Math.PI*2;
      return new THREE.Vector3(7*Math.cos(a),0,4*Math.sin(a));
    })
  ),
  new THREE.LineBasicMaterial({color:0x42607e,transparent:true,opacity:.55})
);
scene.add(orbit);

const markerEarth = new THREE.Mesh(
  new THREE.SphereGeometry(.13,16,16),
  new THREE.MeshBasicMaterial({color:0x7be7ff})
);
scene.add(markerEarth);

// UI
const $=id=>document.getElementById(id);
let playing=true, speed=1, orbitAngle=Math.PI/2, rotationAngle=0;
let selectedMode="earth";
let latitude=35, longitude=51;

const info = {
 earth:"زمین هم‌زمان دو حرکت دارد: به دور محور خودش می‌چرخد و در مدار به دور خورشید حرکت می‌کند.",
 seasons:"انحراف ۲۳٫۵ درجه‌ای محور زمین و حرکت انتقالی آن باعث تغییر زاویه تابش و در نتیجه پیدایش فصل‌ها می‌شود.",
 timezones:"زمین در ۲۴ ساعت یک دور ۳۶۰ درجه‌ای می‌زند؛ بنابراین به‌طور تقریبی هر ۱۵ درجه طول جغرافیایی یک ساعت اختلاف زمانی ایجاد می‌کند.",
 sunlight:"نیمی از زمین که رو به خورشید است روشن و نیمه دیگر در تاریکی است. با چرخش زمین، روز و شب جابه‌جا می‌شوند."
};

function seasonFromAngle(a){
  const d=((a%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
  if(d<Math.PI/2) return ["تابستان","تابستان نیمکره شمالی",172];
  if(d<Math.PI) return ["پاییز","پاییز نیمکره شمالی",266];
  if(d<3*Math.PI/2) return ["زمستان","زمستان نیمکره شمالی",355];
  return ["بهار","بهار نیمکره شمالی",80];
}
function seasonAt(deg){
  // 0 spring, 90 summer, 180 autumn, 270 winter
  const d=((deg%360)+360)%360;
  if(d<45 || d>=315) return ["بهار","بهار نیمکره شمالی",80];
  if(d<135) return ["تابستان","تابستان نیمکره شمالی",172];
  if(d<225) return ["پاییز","پاییز نیمکره شمالی",266];
  return ["زمستان","زمستان نیمکره شمالی",355];
}
function formatTime(h){
  h=((h%24)+24)%24;
  const hh=Math.floor(h), mm=Math.floor((h-hh)*60);
  return String(hh).padStart(2,"0")+":"+String(mm).padStart(2,"0");
}
function updateUI(){
  const deg=THREE.MathUtils.radToDeg(orbitAngle);
  const [s,full,day]=seasonAt(deg);
  $("seasonName").textContent=full;
  $("seasonShort").textContent=s;
  $("yearDay").textContent=day;
  $("infoText").textContent=info[selectedMode];
  $("speedValue").textContent=speed===0?"توقف":speed+"×";

  const local=((rotationAngle/(Math.PI*2))*24 + 12 + longitude/15)%24;
  const time=formatTime(local);
  const isDay=Math.cos(rotationAngle+longitude*Math.PI/180)>0;
  $("localTimeText").textContent="ساعت "+time;
  $("dayNightText").textContent=isDay?"روز":"شب";
  $("placeTime").textContent=time;
  $("placeState").textContent=isDay?"روز":"شب";
  $("latValue").textContent=Math.abs(latitude)+"° "+(latitude>=0?"شمالی":"جنوبی");
  $("lonValue").textContent=Math.abs(longitude)+"° "+(longitude>=0?"شرقی":"غربی");
}

document.querySelectorAll(".mode").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".mode").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active"); selectedMode=btn.dataset.mode;
    gridGroup.visible=selectedMode!=="earth";
    axis.visible=true;
    updateUI();
  };
});
$("speed").oninput=e=>{speed=Number(e.target.value);updateUI()};
$("playBtn").onclick=()=>{
  playing=!playing; $("playBtn").textContent=playing?"⏸ توقف":"▶ اجرا";
};
$("resetBtn").onclick=()=>{
  orbitAngle=Math.PI/2; rotationAngle=0; updateUI();
};
$("lat").oninput=e=>{latitude=Number(e.target.value);updateUI()};
$("lon").oninput=e=>{longitude=Number(e.target.value);updateUI()};

document.querySelectorAll(".season-buttons button").forEach(btn=>{
  btn.onclick=()=>{
    const deg=Number(btn.dataset.season);
    orbitAngle=THREE.MathUtils.degToRad(deg);
    updateUI();
  };
});

function resize(){
  const w=sceneEl.clientWidth,h=sceneEl.clientHeight;
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
window.addEventListener("resize",resize); resize();

const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.05);
  if(playing && speed>0){
    rotationAngle += dt*speed*0.85;
    orbitAngle += dt*speed*0.055;
  }
  // Earth rotates around its tilted axis.
  tiltGroup.rotation.y=rotationAngle;
  // Earth moves around Sun, with a slightly elliptical-looking path.
  const x=7*Math.cos(orbitAngle), z=4*Math.sin(orbitAngle);
  earthGroup.position.set(x,0,z);
  markerEarth.position.set(x,0,z);

  // Keep Sun at center and illuminate Earth.
  sunLight.position.set(0,0,0);
  controls.update();
  updateUI();
  renderer.render(scene,camera);
}
updateUI();
animate();
