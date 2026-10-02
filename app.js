const $ = (s) => document.querySelector(s);

// -------------------- 3D Globe --------------------
const globeEl = $('#globeViz');
if (window.Globe && globeEl) {
  const globe = Globe()(globeEl)
    .backgroundColor('rgba(0,0,0,0)')
    .showAtmosphere(true)
    .atmosphereColor('#5dd9ff')
    .atmosphereAltitude(0.18)
    .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
    .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
    .polygonsData([])
    .pointOfView({lat:18,lng:20,altitude:2.05},0);
  globe.controls().autoRotate = true;
  globe.controls().autoRotateSpeed = 0.42;
  globe.controls().enableZoom = false;
  $('#focusGlobe')?.addEventListener('click',()=>{
    globe.pointOfView({lat:15,lng:30,altitude:1.75},900);
    document.querySelector('.hero-globe').scrollIntoView({behavior:'smooth',block:'center'});
  });
  $('#toggleDay')?.addEventListener('click',()=>{
    globe.controls().autoRotate = !globe.controls().autoRotate;
  });
}

// -------------------- Theme --------------------
$('#themeBtn')?.addEventListener('click',()=>{
  document.documentElement.classList.toggle('light');
  $('#themeBtn').textContent = document.documentElement.classList.contains('light') ? '☾' : '☼';
});

// -------------------- Time-zone lab --------------------
const citySelect = $('#citySelect');
const offsetText = $('#offsetText');
const wheelHour = $('#wheelHour');
const zoneMarker = $('#zoneMarker');
const faDigits = n => String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
function updateTimeZone(){
  const offset = Number(citySelect.value);
  const sign = offset > 0 ? '+' : '';
  const abs = Math.abs(offset);
  const h = Math.floor(abs);
  const m = Math.round((abs-h)*60);
  offsetText.textContent = `${sign}${faDigits(h)}${m?':'+faDigits(String(m).padStart(2,'0')):''} ساعت`;
  const base = 12;
  let local = base + offset;
  if(local < 0) local += 24;
  if(local >= 24) local -= 24;
  const hh = Math.floor(local), mm = Math.round((local-hh)*60);
  wheelHour.textContent = `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
  zoneMarker.style.left = `${50 + offset/12*40}%`;
}
citySelect?.addEventListener('change',updateTimeZone); updateTimeZone();

// -------------------- Date line --------------------
$('#westDate')?.addEventListener('click',()=>$('#dateAnswer').textContent='در عبور از شرق به غربِ خط تاریخ، تاریخ یک روز جلو می‌رود.');
$('#eastDate')?.addEventListener('click',()=>$('#dateAnswer').textContent='در عبور از غرب به شرقِ خط تاریخ، تاریخ یک روز عقب می‌رود.');

// -------------------- Seasons orbit --------------------
const orbitSlider = $('#orbitSlider');
const earthOrbitPos = $('#earthOrbitPos');
const seasonPointer = $('#seasonPointer');
const seasonBadge = $('#seasonBadge');
const seasonTitle = $('#seasonTitle');
const seasonText = $('#seasonText');
function updateSeason(){
  const deg = Number(orbitSlider.value);
  earthOrbitPos.style.transform = `rotate(${deg-15}deg)`;
  let data;
  if(deg < 90) data={badge:'بهار',title:'اعتدال بهاری',text:'آغاز یک دوره‌ی گذار است؛ در بسیاری از نقاط، طول روز و شب به یکدیگر نزدیک می‌شود.'};
  else if(deg < 180) data={badge:'تابستان',title:'انقلاب تابستانی',text:'در نیمکره شمالی، این بازه با بلندتر شدن روزها و تابش مستقیم‌تر همراه است.'};
  else if(deg < 270) data={badge:'پاییز',title:'اعتدال پاییزی',text:'در این نقطه، روند تغییر طول روز و شب دوباره به سمت برابری پیش می‌رود.'};
  else data={badge:'زمستان',title:'انقلاب زمستانی',text:'در نیمکره شمالی، روزها کوتاه‌تر و زاویه تابش خورشید کم‌تر می‌شود.'};
  seasonBadge.textContent=data.badge; seasonTitle.textContent=data.title; seasonText.textContent=data.text;
  seasonPointer.textContent=`موقعیت مداری: ${faDigits(deg)}°`;
}
orbitSlider?.addEventListener('input',updateSeason); updateSeason();

// -------------------- Hemisphere --------------------
$('#hemiSlider')?.addEventListener('input',(e)=>{
  const v=Number(e.target.value);
  const north = v < 50 ? 'زمستان' : 'تابستان';
  const south = v < 50 ? 'تابستان' : 'زمستان';
  $('#northSeason').textContent=north; $('#southSeason').textContent=south;
});

// -------------------- Year animation --------------------
let yearTimer=null, yearDeg=0;
const yearEarth=$('#yearEarth'), yearProgress=$('#yearProgress');
$('#playYear')?.addEventListener('click',()=>{
  if(yearTimer){clearInterval(yearTimer);yearTimer=null;$('#playYear').textContent='پخش حرکت سالانه';return;}
  $('#playYear').textContent='توقف حرکت';
  yearTimer=setInterval(()=>{
    yearDeg=(yearDeg+2)%360;
    const rad=yearDeg*Math.PI/180;
    const x=Math.cos(rad)*240, y=Math.sin(rad)*145;
    yearEarth.style.transform=`translate(${x}px,${y}px)`;
    yearProgress.textContent=`${faDigits(Math.round(yearDeg/3.6))}٪`;
  },35);
});

// subtle reveal on scroll
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.08});
document.querySelectorAll('.card,.section-head,.recap-item').forEach(el=>{el.classList.add('reveal');observer.observe(el)});
