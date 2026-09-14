const CMS_URL='https://data.cms.gov/provider-data/dataset/xubh-q36u';
const HRSA_URL='https://data.hrsa.gov/topics/health-centers/';

function radians(value){return value*Math.PI/180;}
function milesBetween(origin,record){
  if(!origin||!Number.isFinite(record.lat)||!Number.isFinite(record.lon))return null;
  const lat=radians(record.lat-origin.lat),lon=radians(record.lon-origin.lon);
  const a=Math.sin(lat/2)**2+Math.cos(radians(origin.lat))*Math.cos(radians(record.lat))*Math.sin(lon/2)**2;
  return 3958.8*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

export async function loadDiscoveryState(state){
  if(!/^[A-Z]{2}$/.test(state||''))return null;
  const response=await fetch(`data/discovery/${state}.json?v=1`);
  if(!response.ok)throw new Error('Discovery state unavailable');
  return response.json();
}

export function rankDiscoveryRecords(records,{origin,zip,emergency,limit=12}={}){
  return records.filter(record=>!record.matchedVerified && (!emergency||record.kind==='hospital')).map(record=>({...record,distance:milesBetween(origin,record)})).sort((a,b)=>{
    const aZip=zip&&a.zip?.slice(0,5)===zip?0:1,bZip=zip&&b.zip?.slice(0,5)===zip?0:1;
    if(aZip!==bZip)return aZip-bZip;
    if(a.distance!==null||b.distance!==null)return (a.distance??Infinity)-(b.distance??Infinity);
    return a.city.localeCompare(b.city)||a.name.localeCompare(b.name);
  }).slice(0,limit);
}

export function discoverySource(record){return record.kind==='hospital'?CMS_URL:HRSA_URL;}
