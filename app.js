import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";

const $=id=>document.getElementById(id);
const canvas=$("scene");

let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});}
catch(e){document.body.innerHTML='<div style="height:100vh;display:grid;place-items:center;background:#02060d;color:white;font-family:sans-serif">WebGL فعال نیست.</div>';throw e}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x02060d);
const camera=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,.1,500);
camera.position.set(0,4.8,15.5);

const controls=new OrbitControls(camera,canvas);
controls.enableDamping=true;
controls.dampingFactor=.045;
controls.minDistance=8;
controls.maxDistance=28;
controls.target.set(0,0,0);

scene.add(new THREE.AmbientLight(0x17304b,.28));

/* stars */
const sg=new THREE.BufferGeometry(), sp=new Float32Array(4500*3);
for(let i=0;i<4500;i++){
  const r=150+Math.random()*130,a=Math.random()*Math.PI*2,u=Math.random()*2-1,s=Math.sqrt(1-u*u);
  sp[i*3]=r*s*Math.cos(a);sp[i*3+1]=r*u;sp[i*3+2]=r*s*Math.sin(a);
}
sg.setAttribute("position",new THREE.BufferAttribute(sp,3));
scene.add(new THREE.Points(sg,new THREE.PointsMaterial({color:0xbddcff,size:.5,transparent:true,opacity:.72})));

const sun=new THREE.Mesh(new THREE.SphereGeometry(.75,40,40),new THREE.MeshBasicMaterial({color:0xffd26a}));
sun.position.set(-8.6,2.0,0);
scene.add(sun);
const sunGlow=new THREE.Mesh(new THREE.SphereGeometry(1.15,32,32),new THREE.MeshBasicMaterial({color:0xffa51e,transparent:true,opacity:.10,blending:THREE.AdditiveBlending,depthWrite:false}));
sun.add(sunGlow);
const light=new THREE.PointLight(0xfff3d0,190,100,1.35);
light.position.copy(sun.position);
scene.add(light);

/* orbit */
const ORBIT=6.9;
const orbitPts=[];
for(let i=0;i<=720;i++){const a=i/720*Math.PI*2;orbitPts.push(new THREE.Vector3(Math.cos(a)*ORBIT,0,Math.sin(a)*ORBIT))}
const orbit=new THREE.Line(new THREE.BufferGeometry().setFromPoints(orbitPts),new THREE.LineBasicMaterial({color:0x37627d,transparent:true,opacity:.6}));
scene.add(orbit);

/* Earth */
const earthSystem=new THREE.Group();
scene.add(earthSystem);
const AXIS=THREE.MathUtils.degToRad(23.44);
earthSystem.rotation.z=AXIS;

const loader=new THREE.TextureLoader();
loader.setCrossOrigin("anonymous");
const map=loader.load("https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg");
const normal=loader.load("https://threejs.org/examples/textures/planets/earth_normal_2048.jpg");
const spec=loader.load("https://threejs.org/examples/textures/planets/earth_specular_2048.jpg");
map.colorSpace=THREE.SRGBColorSpace;

const earth=new THREE.Mesh(
 new THREE.SphereGeometry(2.65,96,64),
 new THREE.MeshPhongMaterial({map,normalMap:normal,specularMap:spec,specular:0x314b5d,shininess:14})
);
earth.rotation.y=Math.PI;
earthSystem.add(earth);

const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(2.72,64,48),new THREE.MeshBasicMaterial({color:0x55bfff,transparent:true,opacity:.10,side:THREE.FrontSide,blending:THREE.AdditiveBlending,depthWrite:false}));
earthSystem.add(atmosphere);

/* axis, poles */
const axisMat=new THREE.LineBasicMaterial({color:0xff5e5e,transparent:true,opacity:.95});
const axisGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-3.75,0),new THREE.Vector3(0,3.75,0)]);
earthSystem.add(new THREE.Line(axisGeo,axisMat));
function marker(y,color){const m=new THREE.Mesh(new THREE.SphereGeometry(.075,16,16),new THREE.MeshBasicMaterial({color}));m.position.y=y;earthSystem.add(m)}
marker(3.76,0xff6868);marker(-3.76,0x6d9eff);

/* equator and tropics */
function latRing(lat,color,opacity){
 const rr=2.67*Math.cos(THREE.MathUtils.degToRad(lat)), y=2.67*Math.sin(THREE.MathUtils.degToRad(lat));
 const pts=[];for(let i=0;i<=256;i++){const a=i/256*Math.PI*2;pts.push(new THREE.Vector3(rr*Math.cos(a),y,rr*Math.sin(a)))}
 earthSystem.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color,transparent:true,opacity})));
}
latRing(0,0x5bdcff,.7);latRing(23.44,0xffc35e,.38);latRing(-23.44,0xffc35e,.38);

/* 24 visible 15-degree zones */
const zoneGroup=new THREE.Group();earthSystem.add(zoneGroup);
function meridian(lon,major){
 const L=THREE.MathUtils.degToRad(lon),pts=[];
 for(let i=0;i<=96;i++){const lat=-Math.PI/2+i*Math.PI/96;const r=2.69;pts.push(new THREE.Vector3(r*Math.cos(lat)*Math.sin(L),r*Math.sin(lat),r*Math.cos(lat)*Math.cos(L)))}
 return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:major?0x57d8ff:0x3b718f,transparent:true,opacity:major?.60:.16}));
}
for(let lon=-180;lon<180;lon+=15)zoneGroup.add(meridian(lon,true));

/* selected longitude marker: an arc + point */
const selectedMarker=new THREE.Group();earthSystem.add(selectedMarker);
const selectedMat=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.9});
const selectedGeo=new THREE.BufferGeometry();
const selectedLine=new THREE.Line(selectedGeo,selectedMat);
selectedMarker.add(selectedLine);
const selectedDot=new THREE.Mesh(new THREE.SphereGeometry(.075,16,16),new THREE.MeshBasicMaterial({color:0xffffff}));
selectedMarker.add(selectedDot);

function updateSelectedMeridian(lon){
 const L=THREE.MathUtils.degToRad(lon),pts=[];
 for(let i=0;i<=96;i++){const lat=-Math.PI/2+i*Math.PI/96;const r=2.76;pts.push(new THREE.Vector3(r*Math.cos(lat)*Math.sin(L),r*Math.sin(lat),r*Math.cos(lat)*Math.cos(L)))}
 selectedGeo.setFromPoints(pts);
 selectedDot.position.set(2.78*Math.sin(L),0,2.78*Math.cos(L));
}

/* terminator: a translucent circle oriented toward the Sun */
const term=new THREE.Mesh(new THREE.CircleGeometry(2.69,96),new THREE.MeshBasicMaterial({color:0x07111f,transparent:true,opacity:.30,side:THREE.DoubleSide,depthWrite:false}));
earthSystem.add(term);

/* solar rays */
const rayGroup=new THREE.Group();scene.add(rayGroup);
for(let i=-2;i<=2;i++){
 const line=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xffd77b,transparent:true,opacity:.14}));
 rayGroup.add(line);
}

/* state */
const seasons={march:{day:80,name:"اعتدال بهاری"},june:{day:172,name:"انقلاب تابستانی"},september:{day:266,name:"اعتدال پاییزی"},december:{day:355,name:"انقلاب زمستانی"}};
let simDay=80,mode="sim",playing=true,speed=1;
let lon=51.4,lat=35.7,locationName="تهران";

const cities={تهران:[51.4,35.7],گرینویچ:[0,51.5],کوالالامپور:[101.7,3.1],مکزیکوسیتی:[-99.1,19.4]};

function solarDeclination(day){return -23.44*Math.cos(THREE.MathUtils.degToRad((360/365.2422)*(day-10)));}
function eqTime(day){const B=THREE.MathUtils.degToRad((360/364)*(day-81));return 9.87*Math.sin(2*B)-7.53*Math.cos(B)-1.5*Math.sin(B);}
function dayLengthHours(latDeg,decDeg){
 const latR=THREE.MathUtils.degToRad(latDeg),decR=THREE.MathUtils.degToRad(decDeg);
 const x=-Math.tan(latR)*Math.tan(decR);
 if(x>=1)return 0;if(x<=-1)return 24;
 return 24*Math.acos(x)/Math.PI;
}
function pad(n){return String(Math.floor(n)).padStart(2,"0")}
function clock(h){
 h=(h%24+24)%24;let H=Math.floor(h),M=Math.floor((h-H)*60),S=Math.floor((((h-H)*60)-M)*60);
 return `${pad(H)}:${pad(M)}:${pad(S)}`;
}
function farsiNumber(s){return String(s).replace(/\d/g,d=>"۰۱۲۳۴۵۶۷۸۹"[d]);}
function dateName(day){
 const ms=[31,28,31,30,31,30,31,31,30,31,30,31],names=["ژانویه","فوریه","مارس","آوریل","مه","ژوئن","ژوئیه","اوت","سپتامبر","اکتبر","نوامبر","دسامبر"];
 let d=Math.floor(day),m=0;while(d>ms[m]&&m<11){d-=ms[m];m++}
 return `${farsiNumber(d)} ${names[m]}`;
}
function zoneInfo(longitude){
 // 15-degree standard zones; central meridian is an exact multiple of 15.
 let z=Math.round(longitude/15);
 let center=z*15;
 let hours=z;
 let label=hours>=0?`+${hours}`:`${hours}`;
 return {z,center,label};
}
function longitudeText(v){
 return `${Math.abs(v).toFixed(1)}° ${v>=0?"E":"W"}`;
}
function shortestDiff(a,b){
 let d=(a-b+12)%24-12;
 return d;
}
function updateTime(){
 let dec=solarDeclination(simDay), et=eqTime(simDay);
 let solarH, officialH;
 if(mode==="live"){
   const now=new Date(),utc=now.getUTCHours()+now.getUTCMinutes()/60+now.getUTCSeconds()/3600;
   solarH=(utc+lon/15+et/60+24)%24;
 }else{
   // simDay fractional part is the apparent solar rotation phase.
   solarH=((simDay%1)*24+lon/15+24)%24;
 }
 const zi=zoneInfo(lon);
 officialH=(solarH+(zi.center-lon)/15+24)%24;

 const diff=shortestDiff(solarH,officialH);
 const daylight=dayLengthHours(lat,dec);
 const noonSolar=12;
 let sunriseSolar=12-daylight/2,sunsetSolar=12+daylight/2;
 const solarToClock=h=>(h+lon/15+et/60+24)%24;
 let sr=solarToClock(sunriseSolar),ss=solarToClock(sunsetSolar);
 let nowToNoon=(12-((solarH%24)+24)%24+24)%24;if(nowToNoon>23.999)nowToNoon=0;

 $("solarClock").textContent=clock(solarH);
 $("officialClock").textContent=clock(officialH);
 $("difference").textContent=(diff>=0?"+":"−")+clock(Math.abs(diff)).slice(0,5);
 $("solarState").textContent=Math.abs(solarH-12)<.25?"ظهر خورشیدی":solarH<12?"پیش از ظهر":"پس از ظهر";
 $("officialState").textContent=`منطقه ${zi.label}`;
 $("sunrise").textContent=clock(sr).slice(0,5);
 $("sunset").textContent=clock(ss).slice(0,5);
 $("toNoon").textContent=clock(nowToNoon).slice(0,5);
 $("declination").textContent=`${dec>=0?"+":""}${dec.toFixed(2)}°`;
 $("dayLength").textContent=clock(daylight).slice(0,5);
 $("zoneText").textContent=zi.label;
 $("lonText").textContent=longitudeText(lon);
 $("lonBig").textContent=longitudeText(lon);
 $("latText").textContent=`${Math.abs(lat).toFixed(1)}° ${lat>=0?"N":"S"}`;
 $("locationName").textContent=locationName;
 $("simDate").textContent=dateName(simDay);
}
function updateEarth(){
 const a=simDay/365.2422*Math.PI*2;
 earthSystem.position.set(Math.cos(a)*ORBIT,0,Math.sin(a)*ORBIT);

 // Axis stays parallel in space. Only Earth's daily rotation changes.
 earth.rotation.y=Math.PI+(simDay%1)*Math.PI*2;

 const toSun=sun.position.clone().sub(earthSystem.position).normalize();
 const localAngle=Math.atan2(toSun.x,toSun.z);
 term.rotation.set(0,localAngle,0);

 // Strong visual cue: a moving red point on equator completes one turn per day.
 const f=(simDay%1)*Math.PI*2;
 selectedMarker.rotation.y=-f;

 // solar rays
 rayGroup.children.forEach((line,i)=>{
   const y=(i-2)*.42;
   line.geometry.setFromPoints([
     new THREE.Vector3(sun.position.x,sun.position.y+y,sun.position.z),
     earthSystem.position.clone().add(new THREE.Vector3(0,y,0))
   ]);
 });
 updateSelectedMeridian(lon);
}
function syncLive(){
 const n=new Date(),start=new Date(n.getFullYear(),0,1);
 simDay=(n-start)/86400000+1;
}
function setMode(m){
 mode=m;
 $("liveBtn").classList.toggle("active",m==="live");
 $("simBtn").classList.toggle("active",m==="sim");
 if(m==="live"){syncLive();playing=false;$("play").textContent="▶";}
 else {playing=true;$("play").textContent="❚❚";}
 updateEarth();updateTime();
}
function setSeason(k){
 simDay=seasons[k].day;mode="sim";playing=false;
 $("liveBtn").classList.remove("active");$("simBtn").classList.add("active");
 document.querySelectorAll(".season").forEach(b=>b.classList.toggle("active",b.dataset.season===k));
 $("play").textContent="▶";
 updateEarth();updateTime();
}

$("longitude").addEventListener("input",e=>{lon=Number(e.target.value);locationName="موقعیت انتخاب‌شده";lat=35.7;updateSelectedMeridian(lon);updateTime();});
document.querySelectorAll(".city-buttons button").forEach(b=>b.addEventListener("click",()=>{
 lon=Number(b.dataset.lon);lat=Number(b.dataset.lat);locationName=b.dataset.name;
 $("longitude").value=lon;updateSelectedMeridian(lon);updateTime();
}));
document.querySelectorAll(".season").forEach(b=>b.addEventListener("click",()=>setSeason(b.dataset.season)));
$("liveBtn").addEventListener("click",()=>setMode("live"));
$("simBtn").addEventListener("click",()=>setMode("sim"));
$("play").addEventListener("click",()=>{playing=!playing;$("play").textContent=playing?"❚❚":"▶";});
$("dayForward").addEventListener("click",()=>{simDay=(simDay+1)%365.2422;mode="sim";updateEarth();updateTime();});
$("dayBack").addEventListener("click",()=>{simDay=(simDay-1+365.2422)%365.2422;mode="sim";updateEarth();updateTime();});

let last=performance.now();
function animate(now){
 requestAnimationFrame(animate);
 const dt=(now-last)/1000;last=now;
 if(mode==="live")syncLive();
 else if(playing)simDay=(simDay+dt*(speed/2))%365.2422;
 updateEarth();updateTime();
 projectLabels();
 controls.update();renderer.render(scene,camera);
}
setSeason("march");
requestAnimationFrame(animate);

addEventListener("resize",()=>{
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);
});

function projectLabels(){
  const defs=[
    [sun,$(".sun-label")],
    [earthSystem.position.clone().add(new THREE.Vector3(2.0,1.5,0)),$(".day-label")],
    [earthSystem.position.clone().add(new THREE.Vector3(-2.0,-1.2,0)),$(".night-label")],
    [earthSystem.position.clone().add(new THREE.Vector3(0,3.7,0)),$(".axis-label")],
    [new THREE.Vector3(0,0,0),$(".orbit-label")]
  ];
  for(const [obj,el] of defs){
    if(!el) continue;
    const p=(obj.isVector3?obj:obj.position).clone().project(camera);
    el.style.left=`${(p.x*.5+.5)*innerWidth}px`;
    el.style.top=`${(-p.y*.5+.5)*innerHeight}px`;
  }
}
