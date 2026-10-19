// Private academic data is accepted only by the authenticated state endpoint.
export function validateAcademics(a){
 if(a==null)return null;
 const fail=()=>{throw Error('Invalid academic profile')};
 if(typeof a!=='object'||Array.isArray(a)||JSON.stringify(a).length>150000)fail();
 function walk(x,depth=0){if(depth>12)fail();if(x===null||typeof x==='boolean')return;if(typeof x==='string'){if(x.length>5000)fail();return;}if(typeof x==='number'){if(!Number.isFinite(x))fail();return;}if(Array.isArray(x)){if(x.length>300)fail();x.forEach(v=>walk(v,depth+1));return;}if(typeof x==='object'){if(Object.keys(x).length>80)fail();for(const [k,v] of Object.entries(x)){if(['__proto__','prototype','constructor'].includes(k))fail();walk(v,depth+1);}return;}fail();}
 walk(a);
 if(a.schemaVersion!==1||!a.document||typeof a.document.asOf!=='string'||!a.program||typeof a.program.degree!=='string'||typeof a.program.classification!=='string'||!a.totals)fail();
 for(const k of ['earnedCredits','requiredCredits','inProgressCredits','remainingAfterAllInProgressEarned'])if(typeof a.totals[k]!=='number'||a.totals[k]<0||a.totals[k]>1000)fail();
 for(const k of ['currentCourses','completedCourses']){if(!Array.isArray(a[k]))fail();for(const c of a[k]){if(!c||typeof c.code!=='string'||typeof c.title!=='string'||typeof c.credits!=='number'||c.credits<0||c.credits>30||!['in_progress','transferred','completed'].includes(c.status))fail();if(c.appliedTo&&!Array.isArray(c.appliedTo))fail();if(c.meetings){if(!Array.isArray(c.meetings))fail();for(const m of c.meetings){if(!Array.isArray(m.days)||m.days.some(d=>!Number.isInteger(d)||d<0||d>6)||typeof m.start!=='string'||typeof m.end!=='string')fail();}}}}
 for(const k of ['coreRequirements','majorRequirements','otherRequirements']){if(!Array.isArray(a[k]))fail();for(const v of a[k])if(!v||typeof v.id!=='string'||typeof v.title!=='string'||!['met','not_met','in_progress','waived'].includes(v.status)||!Array.isArray(v.courseCodes))fail();}
 return JSON.parse(JSON.stringify(a));
}
