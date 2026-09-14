export const syntheticAccessEvents = [
  {state:'NJ',searches:1840,successful:1325,service:148,cost:127,language:86,hours:91,travel:63,insurance:0},
  {state:'NY',searches:2380,successful:1651,service:188,cost:164,language:141,hours:112,travel:76,insurance:48},
  {state:'PA',searches:1460,successful:1028,service:119,cost:103,language:58,hours:74,travel:51,insurance:27},
  {state:'CT',searches:920,successful:659,service:69,cost:63,language:35,hours:48,travel:31,insurance:15},
  {state:'MA',searches:1120,successful:821,service:83,cost:70,language:44,hours:52,travel:34,insurance:16},
  {state:'ME',searches:410,successful:272,service:31,cost:22,language:8,hours:26,travel:43,insurance:8},
  {state:'NH',searches:390,successful:272,service:29,cost:21,language:7,hours:24,travel:30,insurance:7},
  {state:'RI',searches:330,successful:239,service:22,cost:21,language:12,hours:18,travel:12,insurance:6},
  {state:'VT',searches:280,successful:185,service:19,cost:14,language:5,hours:18,travel:34,insurance:5}
];

export const barrierLabels = {service:'Age or service mismatch',cost:'Affordability',language:'Language support',hours:'Hours or availability',travel:'Travel',insurance:'Insurance uncertainty'};

export function summarizeAccess(events = syntheticAccessEvents) {
  const totals = events.reduce((sum,row) => {
    for (const [key,value] of Object.entries(row)) if (key !== 'state') sum[key]=(sum[key]||0)+value;
    return sum;
  },{});
  const unsuccessful = totals.searches - totals.successful;
  const completionRate = totals.searches ? totals.successful / totals.searches : 0;
  const barriers = Object.keys(barrierLabels).map(key => ({key,label:barrierLabels[key],count:totals[key]||0})).sort((a,b)=>b.count-a.count);
  return {...totals,unsuccessful,completionRate,barriers};
}

export function estimateOpportunity(events, barrierKey, recoveryRate = .35) {
  const summary=summarizeAccess(events);
  const affected=summary[barrierKey] || 0;
  const recovered=Math.round(affected * recoveryRate);
  return {affected,recovered,newCompletionRate:(summary.successful+recovered)/summary.searches};
}
