import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {validateState} from '../validation.mjs';import {validateAcademics} from '../academics-validation.mjs';import seed from '../seed.json' with {type:'json'};
const c={};vm.createContext(c);vm.runInContext(fs.readFileSync(new URL('../public/degree-core.js',import.meta.url),'utf8'),c);const D=c.DegreeAudit;
const sample=`University of Saint Joseph Advising Worksheet
ID Number: TEST-PRIVATE-ID
Email: example-secret@example.invalid
Career GPA: 4.0000
Transfer Hours: 4.00
Classification: Sophomore
Degree Information: (Catalog Year 2027)
General Education Req. (NOT MET) 60.00 Hours Needed
INTD100 First-Year Seminar
Approved Alteration: Waiver
Computer Core
COMP-210-03 Database Design and Development Aug-2026 (3.00 In Progress 2026-2027 Academic Year - Fall)
Composition Core
WR10-0 Composition (ENGL104) T 4.00 (TR) EXAMPLE COLLEGE
Lab Science Core
4 200 level + courses
COMP-210-03 Database Design and Development Aug-2026 (3.00 In Progress 2026-2027 Academic Year - Fall)
Primary AIM: B.S. Management (NOT MET) 57.00 Hours Needed
ACCT201 Prin of Accounting I
MGMT 485 or 499
Free Electives
INTD-129-61 Introduction to Helping Professions Jun-2026 A 3.00
Course Totals (NOT MET)
Hours Needed/Earned: 120.00 / 7.00 Hours In Progress: 3.00
Writing Portfolio Incomplete
Advising Worksheet (2026-10-17 07:55 pm)`;
test('degree parser separates earned/current, deduplicates courses, and calculates remaining credits',()=>{const r=D.parse(sample),a=r.profile;assert.equal(a.totals.earnedCredits,7);assert.equal(a.totals.inProgressCredits,3);assert.equal(a.totals.remainingAfterAllInProgressEarned,110);assert.equal(a.currentCourses.length,1);assert.equal(a.completedCourses.length,2);assert.equal(r.warnings.length,0);assert.equal(a.coreRequirements.find(r=>r.id==='composition').status,'met');assert.equal(a.coreRequirements.find(r=>r.id==='computer').status,'in_progress');assert.equal(a.coreRequirements.find(r=>r.id==='INTD100').status,'waived');assert.equal(a.majorRequirements[0].status,'not_met');assert.equal(a.otherRequirements[0].id,'writing_portfolio');validateAcademics(JSON.parse(JSON.stringify(a)));});
test('degree parsing does not persist raw identifiers or email from a PDF',()=>{const a=JSON.stringify(D.parse(sample).profile);assert.ok(!a.includes('TEST-PRIVATE-ID'));assert.ok(!a.includes('example-secret'));assert.ok(!a.includes('rawText'));});
test('unrecognized audit is rejected and mismatching totals are flagged',()=>{assert.throws(()=>D.parse('Degree Audit: maybe 120 credits'));const r=D.parse(sample.replace('120.00 / 7.00','120.00 / 9.00'));assert.ok(r.warnings.some(w=>w.includes('отличается')));});
test('course alternatives remain OR choices and in-progress courses are not offered again',()=>{const a=D.parse(sample).profile;assert.deepEqual(Array.from(D.candidates(a.majorRequirements.find(r=>r.options))),['MGMT 485','MGMT 499']);assert.equal(D.candidates(a.coreRequirements.find(r=>r.id==='computer')).length,0);assert.equal(D.candidates(a.coreRequirements.find(r=>r.id==='lab_science')).length,0);assert.equal(D.code('mgmt-210'),'MGMT 210');assert.equal(D.code('MGMT 485 or 499'),'');assert.equal(D.code('HIST1XX'),'');});
test('CRN remains optional, rejects invalid numbers, and survives validation',()=>{const s=structuredClone(seed);s.courses=[{id:'example',title:'Example course',code:'ACCT 201',section:'01',semester:'Spring 2027',credits:3,days:[],start:'',end:'',location:'',status:'planned',notes:'',crn:'53021'}];assert.equal(validateState(s).courses[0].crn,'53021');s.courses[0].crn='MGMT210';assert.throws(()=>validateState(s));delete s.courses[0].crn;assert.equal(validateState(s).courses[0].crn,'');});
