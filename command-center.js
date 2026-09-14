import { syntheticAccessEvents, summarizeAccess, estimateOpportunity, barrierLabels } from './access-command.js';

const number=new Intl.NumberFormat('en-US');
const percent=new Intl.NumberFormat('en-US',{style:'percent',maximumFractionDigits:1});
let activeEvents=syntheticAccessEvents;

function render() {
  const summary=summarizeAccess(activeEvents);
  document.getElementById('totalSearches').textContent=number.format(summary.searches);
  document.getElementById('completionRate').textContent=percent.format(summary.completionRate);
  document.getElementById('successfulSearches').textContent=`${number.format(summary.successful)} completed paths`;
  document.getElementById('failedSearches').textContent=number.format(summary.unsuccessful);
  document.getElementById('largestBarrier').textContent=summary.barriers[0].label;
  document.getElementById('largestBarrierCount').textContent=`${number.format(summary.barriers[0].count)} affected journeys`;
  const max=Math.max(...summary.barriers.map(item=>item.count));
  document.getElementById('barrierBars').innerHTML=summary.barriers.map(item=>`<div><div><b>${item.label}</b><span>${number.format(item.count)}</span></div><i><em style="width:${Math.round(item.count/max*100)}%"></em></i></div>`).join('');
  renderOpportunity();
}

function renderOpportunity() {
  const key=document.getElementById('barrierSelect').value;
  const rate=Number(document.getElementById('recoverySelect').value);
  const result=estimateOpportunity(activeEvents,key,rate);
  document.getElementById('recoveredPaths').textContent=`+${number.format(result.recovered)}`;
  document.getElementById('newRate').textContent=`Illustrative completion rate: ${percent.format(result.newCompletionRate)} · ${number.format(result.affected)} affected journeys`;
}

document.getElementById('barrierSelect').innerHTML=Object.entries(barrierLabels).map(([key,label])=>`<option value="${key}">${label}</option>`).join('');
document.getElementById('barrierSelect').addEventListener('change',renderOpportunity);
document.getElementById('recoverySelect').addEventListener('change',renderOpportunity);

const allCard={state:'ALL',searches:syntheticAccessEvents.reduce((n,r)=>n+r.searches,0),successful:syntheticAccessEvents.reduce((n,r)=>n+r.successful,0)};
document.getElementById('stateCards').innerHTML=[allCard,...syntheticAccessEvents].map(row=>`<button data-state="${row.state}" class="${row.state==='ALL'?'active':''}"><strong>${row.state==='ALL'?'All nine states':row.state}</strong><span>${percent.format(row.successful/row.searches)} completed</span><small>${number.format(row.searches)} attempts</small></button>`).join('');
document.getElementById('stateCards').addEventListener('click',event=>{
  const button=event.target.closest('[data-state]'); if(!button)return;
  document.querySelectorAll('[data-state]').forEach(item=>item.classList.toggle('active',item===button));
  activeEvents=button.dataset.state==='ALL'?syntheticAccessEvents:syntheticAccessEvents.filter(row=>row.state===button.dataset.state);
  render();
});
render();
