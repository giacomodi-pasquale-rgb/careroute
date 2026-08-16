const facilities=[
 {name:'Maple Pediatric Urgent Care',type:'Pediatric urgent care',minDays:90,emergency:false,travel:11,wait:18,quality:87,caps:['illness','injury','wound','stomach','xray'],appropriate:98},
 {name:'Northfield Children’s Emergency Center',type:'Pediatric emergency department',minDays:0,emergency:true,travel:17,wait:34,quality:94,caps:['illness','breathing','injury','wound','stomach','other','xray'],appropriate:92},
 {name:'Essex Family Urgent Care',type:'Child-capable urgent care',minDays:730,emergency:false,travel:8,wait:29,quality:80,caps:['illness','wound','stomach'],appropriate:78},
 {name:'Valley General Emergency Department',type:'Emergency department',minDays:0,emergency:true,travel:13,wait:48,quality:85,caps:['illness','breathing','injury','wound','stomach','other','xray'],appropriate:86},
 {name:'Cedar Pediatric Evening Clinic',type:'Pediatric urgent care',minDays:180,emergency:false,travel:20,wait:12,quality:90,caps:['illness','wound','stomach'],appropriate:94}
];
let step=1;
const steps=[...document.querySelectorAll('.step')], title=document.getElementById('form-title'), stepLabel=document.getElementById('stepLabel'), progress=document.getElementById('progressBar');
const titles=['How old is your child?','What seems to be going on?','Could this be an emergency?'];
function showStep(n){step=n;steps.forEach(s=>s.classList.toggle('active',+s.dataset.step===n));title.textContent=titles[n-1];stepLabel.textContent=`Step ${n} of 3`;progress.style.width=`${n/3*100}%`}
document.querySelectorAll('.next').forEach(b=>b.addEventListener('click',()=>{if(step===1&&!document.getElementById('ageValue').reportValidity())return;showStep(step+1)}));
document.querySelectorAll('.back').forEach(b=>b.addEventListener('click',()=>showStep(step-1)));
document.getElementById('careForm').addEventListener('submit',e=>{e.preventDefault();renderResults()});
document.getElementById('startOver').addEventListener('click',()=>{document.getElementById('results').hidden=true;document.getElementById('questionnaire').hidden=false;showStep(1);window.scrollTo({top:0,behavior:'smooth'})});
function renderResults(){
 const value=+document.getElementById('ageValue').value, unit=document.getElementById('ageUnit').value, ageDays=unit==='months'?value*30.4:value*365.25;
 const need=document.querySelector('[name=need]:checked').value, emergency=document.querySelector('[name=emergency]:checked').value==='yes';
 let eligible=facilities.filter(f=>ageDays>=f.minDays&&f.caps.includes(need)&&(!emergency||f.emergency));
 eligible=eligible.map(f=>{const travel=Math.max(0,100-f.travel/45*100),wait=Math.max(0,100-f.wait/180*100),cap=f.caps.includes('xray')&&need==='injury'?100:82,appropriate=emergency?(f.type.includes('Pediatric')?100:90):f.appropriate;return{...f,score:Math.round(.30*travel+.25*appropriate+.20*wait+.15*f.quality+.10*cap),etac:f.travel+f.wait}}).sort((a,b)=>b.score-a.score).slice(0,3);
 const cards=document.getElementById('cards');cards.innerHTML=eligible.length?eligible.map((f,i)=>`<article class="card ${i===0?'best':''}"><div class="rank">${i===0?'Best demo option':`Demo option ${i+1}`}</div><h3>${f.name}</h3><div>${f.type}</div><div class="metrics"><span class="metric">${f.etac} min estimated time to care</span><span class="metric">${f.travel} min travel</span><span class="metric">${f.wait} min wait</span><span class="metric">Score ${f.score}</span></div><p class="reason">${emergency?'Eligible because it provides emergency care for children.':'Ranks well after age, care-type, and capability filtering.'}</p></article>`).join(''):'<p>No facility in this small demo dataset passed every eligibility filter. This is a prototype outcome, not medical guidance.</p>';
 document.getElementById('emergencyBanner').hidden=!emergency;document.getElementById('questionnaire').hidden=true;document.getElementById('results').hidden=false;document.getElementById('results').scrollIntoView({behavior:'smooth'});
}
