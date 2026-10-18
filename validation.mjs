const fail=()=>{throw Error('Invalid state')};
const text=(v,n=4000)=>typeof v==='string'&&v.length<=n?v:fail();
const optional=(v,n=4000)=>text(v??'',n);
const date=v=>{if(v==='')return '';if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(Date.parse(v+'T12:00:00Z'))||new Date(v+'T12:00:00Z').toISOString().slice(0,10)!==v)fail();return v;};
const time=v=>v===''?'':/^([01]\d|2[0-3]):[0-5]\d$/.test(v)?v:fail();
const choice=(v,values)=>values.includes(v)?v:fail();
const url=v=>{v=optional(v,2000);if(v){let u;try{u=new URL(v);}catch{fail();}if(!['http:','https:'].includes(u.protocol)||!u.hostname)fail();}return v;};
const list=(v,limit,fn)=>Array.isArray(v)&&v.length<=limit?v.map(fn):fail();
const flag=v=>v===undefined?false:typeof v==='boolean'?v:fail();
const brand=v=>v===undefined?'auto':choice(v,['auto','bluejays','usj','business','none']);
const base=v=>({id:text(v.id,100),title:text(v.title,300)});
const days=v=>list(v,7,d=>Number.isInteger(d)&&d>=0&&d<=6?d:fail());
const ensureRange=(a,b)=>{if(a&&b&&b<=a)fail();};
export function validateState(s){
 if(!s||typeof s!=='object')fail();
 return {
 migrations:list(s.migrations??[],100,v=>text(v,100)),
 events:list(s.events,10000,v=>{ensureRange(v.start,v.end);return {...base(v),date:date(v.date),start:time(v.start),end:time(v.end),timeLabel:optional(v.timeLabel,100),type:choice(v.type,['class','hockey','game','personal','routine','travel','free','business']),location:optional(v.location,300),notes:optional(v.notes),series:optional(v.series,100),important:flag(v.important),brand:brand(v.brand)};}),
 tasks:list(s.tasks,10000,v=>({...base(v),kind:choice(v.kind??(v.course&&v.course!=='Личное'?'school':'personal'),['school','personal']),due:date(v.due),course:optional(v.course,100),status:choice(v.status,['todo','doing','done']),priority:choice(v.priority,['normal','high']),notes:optional(v.notes),url:url(v.url)})),
 courses:list(s.courses,1000,v=>{ensureRange(v.start,v.end);return {...base(v),code:optional(v.code,100),semester:optional(v.semester,100),section:optional(v.section,100),credits:Number.isFinite(v.credits)&&v.credits>=0&&v.credits<=30?v.credits:fail(),days:days(v.days),start:time(v.start),end:time(v.end),location:optional(v.location,300),status:choice(v.status,['planned','registered','waitlist']),notes:optional(v.notes)};}),
 links:list(s.links,500,v=>({...base(v),url:v.url?url(v.url):fail(),category:optional(v.category,100),description:optional(v.description,300),pinned:flag(v.pinned),brand:brand(v.brand)})),
 focus:{date:date(s.focus.date),main:optional(s.focus.main),priorities:list(s.focus.priorities,3,v=>text(v,500)),notes:optional(s.focus.notes,20000),goals:optional(s.focus.goals,20000)},
 hockey:{focusDate:date(s.hockey.focusDate??''),worked:optional(s.hockey.worked),role:optional(s.hockey.role),keyword:optional(s.hockey.keyword,200),leadership:optional(s.hockey.leadership),review:optional(s.hockey.review),playlist:url(s.hockey.playlist),readiness:list(s.hockey.readiness,1000,v=>({date:date(v.date),sleep:score(v.sleep),energy:score(v.energy),freshness:score(v.freshness),mood:score(v.mood)}))}
 };
}
function score(v){return Number.isInteger(v)&&v>=1&&v<=5?v:fail();}
