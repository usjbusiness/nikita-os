// Normalize old flat course lists without dropping or duplicating any record.
export function normalizeCoursePlans(plans,courses,activeId){
 const fail=()=>{throw Error('Invalid course plan')};plans=plans.map(p=>({...p}));courses=courses.map(c=>({...c}));
 if(new Set(plans.map(p=>p.id)).size!==plans.length||new Set(courses.map(c=>c.id)).size!==courses.length)fail();
 let serial=1;const freshId=()=>{while(plans.some(p=>p.id==='legacy-plan-'+serial))serial++;return 'legacy-plan-'+serial++;};
 for(const c of courses){if(c.planId){const p=plans.find(p=>p.id===c.planId);if(!p)fail();if(!p.semester)p.semester=c.semester;if(p.semester!==c.semester)fail();}else{let p=plans.find(p=>p.semester===c.semester);if(!p){p={id:freshId(),name:plans.length?'План '+(plans.length+1):'Основной',semester:c.semester,notes:''};plans.push(p);}c.planId=p.id;}}
 if(!plans.length)plans.push({id:'plan-main',name:'Основной',semester:'',notes:''});
 if(plans.length>50)fail();return {coursePlans:plans,courses,activeCoursePlanId:plans.some(p=>p.id===activeId)?activeId:plans[0].id};
}
