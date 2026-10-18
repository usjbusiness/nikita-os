/* Pure planner rules: no readiness predictions, no assumed event durations. */
const Planner=(()=>{
 const minutes=t=>{if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(t||''))return null;const [h,m]=t.split(':').map(Number);return h*60+m;};
 const conflicts=events=>{const eligible=events.filter(e=>!['free','routine'].includes(e.type)&&e.start&&e.end);const pairs=[];for(let i=0;i<eligible.length;i++)for(let j=i+1;j<eligible.length;j++){const a=eligible[i],b=eligible[j];if(a.date===b.date&&a.start<b.end&&b.start<a.end)pairs.push([a,b]);}return pairs;};
 const moment=(events,date,minute)=>{const timed=events.filter(e=>e.start&&e.type!=='free').sort((a,b)=>a.date.localeCompare(b.date)||a.start.localeCompare(b.start));const current=timed.find(e=>e.date===date&&minutes(e.start)<=minute&&e.end&&minutes(e.end)>minute)||null;const next=timed.find(e=>e.date>date||(e.date===date&&minutes(e.start)>minute))||null;return {current,next,todayCount:events.filter(e=>e.date===date).length};};
 return {minutes,conflicts,moment};
})();
