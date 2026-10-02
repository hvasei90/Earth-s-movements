const globe=Globe()(document.getElementById('globe'))
 .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
 .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
 .showAtmosphere(true).atmosphereColor('#62cfff').atmosphereAltitude(.13)
 .backgroundColor('#02060d').width(innerWidth).height(innerHeight);
const controls=globe.controls();controls.enableRotate=true;controls.enableZoom=true;controls.enablePan=false;controls.autoRotate=false;controls.autoRotateSpeed=.45;
let mode='';let raf=0;let orbitAngle=0;let overlay=[];
const info=document.getElementById('info'),title=document.getElementById('title'),text=document.getElementById('text'),hint=document.getElementById('hint');
const data={
 rotation:{title:'حرکت وضعی زمین',text:'زمین به دور محور فرضی خودش می‌چرخد. یک دور کامل تقریباً ۲۴ ساعت طول می‌کشد. این حرکت باعث پیدایش شب و روز و تفاوت زمان در نقاط مختلف زمین می‌شود.',hint:'زمین را از غرب به شرق حول محور خودش در حال چرخش ببین.'},
 daynight:{title:'شب و روز',text:'خورشید در هر لحظه فقط نیمی از زمین را روشن می‌کند. نیمهٔ رو به خورشید روز و نیمهٔ پشت به آن شب است. با چرخش زمین، این دو ناحیه جابه‌جا می‌شوند.',hint:'مرز روشنایی و تاریکی را روی زمین ببین.'},
 timezones:{title:'اختلاف ساعت و مناطق زمانی',text:'چون زمین در ۲۴ ساعت ۳۶۰ درجه می‌چرخد، به‌طور میانگین هر ۱۵ درجه طول جغرافیایی یک ساعت اختلاف ایجاد می‌کند. به همین دلیل نقاط مختلف زمین هم‌زمان ساعت یکسانی ندارند.',hint:'خطوط طول جغرافیایی و اختلاف ساعت را ببین.'},
 orbit:{title:'حرکت انتقالی زمین',text:'زمین هم‌زمان با حرکت وضعی، در مداری تقریباً بیضی‌شکل به دور خورشید حرکت می‌کند. یک دور کامل آن حدود یک سال طول می‌کشد و سرعت متوسط زمین در مدار حدود ۳۰ کیلومتر بر ثانیه است.',hint:'مدار زمین و مسیر حرکت سالانه را ببین.'},
 seasons:{title:'کجی محور زمین و فصل‌ها',text:'محور زمین نسبت به صفحهٔ مدار مایل است. همین کجی باعث می‌شود زاویهٔ تابش خورشید و طول روز و شب در طول سال تغییر کند و فصل‌ها شکل بگیرند.',hint:'کجی محور زمین را در کنار حرکت مداری مشاهده کن.'},
 equinox:{title:'انقلاب‌ها و اعتدال‌ها',text:'در دو زمان از سال طول روز و شب تقریباً برابر است که به آن اعتدال بهاری و پاییزی می‌گویند. در انقلاب تابستانی و زمستانی، تفاوت طول روز و شب به بیشترین مقدار می‌رسد.',hint:'چهار نقطهٔ مهم سال را روی مدار مشاهده کن.'}
};
function clearVisual(){cancelAnimationFrame(raf);overlay.forEach(x=>x.remove?.());overlay=[];globe.labelsData([]).arcsData([]).ringsData([]);}
function show(m){mode=m;clearVisual();document.querySelectorAll('.buttons button').forEach(b=>b.classList.toggle('active',b.dataset.mode===m));const d=data[m];title.textContent=d.title;text.innerHTML='<p>'+d.text+'</p><div class="hintline">'+d.hint+'</div>';hint.textContent=d.hint;info.classList.add('show');controls.autoRotate=false;
 if(m==='rotation'){controls.autoRotate=true;controls.autoRotateSpeed=.9;globe.pointOfView({lat:15,lng:25,altitude:2.1},700)}
 if(m==='daynight') daynight(); if(m==='timezones') timezones(); if(m==='orbit'||m==='seasons'||m==='equinox') orbit(m);
}
function daynight(){const now=new Date();const lon=(now.getUTCHours()+now.getUTCMinutes()/60)*15-180;const labels=[{lat:0,lng:lon,text:'مرز تقریبی روز و شب'}];globe.labelsData(labels).labelText(d=>d.text).labelSize(.55).labelColor(()=>'#9deaff').labelDotRadius(.28);globe.pointOfView({lat:15,lng:lon,altitude:2.0},700);controls.autoRotate=true;controls.autoRotateSpeed=.25}
function timezones(){const lines=[];for(let lng=-180;lng<=180;lng+=15)lines.push({startLat:-70,startLng:lng,endLat:70,endLng:lng});globe.arcsData(lines).arcColor(()=>['rgba(100,220,255,.45)','rgba(100,220,255,.05)']).arcAltitude(.003).arcStroke(.35).arcDashLength(1).arcDashGap(0);globe.pointOfView({lat:20,lng:20,altitude:2.2},700)}
function orbit(m){const pts=[];for(let i=0;i<=180;i++){const a=i/180*Math.PI*2;pts.push({lat:23.5*Math.sin(a),lng:(a*180/Math.PI)-180});}globe.arcsData(pts.slice(0,-1).map((p,i)=>({startLat:p.lat,startLng:p.lng,endLat:pts[i+1].lat,endLng:pts[i+1].lng}))).arcColor(()=>['#ffd36a','#ff8b3d']).arcStroke(1).arcAltitude(.08);globe.pointOfView({lat:10,lng:0,altitude:2.5},700);if(m==='equinox'){globe.labelsData([{lat:0,lng:-90,text:'اعتدال بهاری/پاییزی'},{lat:23.5,lng:0,text:'انقلاب تابستانی'},{lat:-23.5,lng:90,text:'انقلاب زمستانی'}]).labelText(d=>d.text).labelSize(.7).labelColor(()=>'#ffe7a3').labelDotRadius(.3)}}
document.querySelectorAll('.buttons button').forEach(b=>b.addEventListener('click',()=>show(b.dataset.mode)));document.getElementById('close').addEventListener('click',()=>{info.classList.remove('show');mode='';clearVisual();document.querySelectorAll('.buttons button').forEach(b=>b.classList.remove('active'));hint.textContent='یک موضوع را انتخاب کن'});addEventListener('resize',()=>globe.width(innerWidth).height(innerHeight));
