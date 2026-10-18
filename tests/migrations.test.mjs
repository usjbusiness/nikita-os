import {test} from 'node:test';import assert from 'node:assert/strict';
import {migrateState,RELEASE_MIGRATION} from '../migrations.mjs';
import {validateState} from '../validation.mjs';
import seed from '../seed.json' with {type:'json'};
test('existing state migration moves only original Wednesday game, keeps user data, runs once',()=>{
 const old=structuredClone(seed);delete old.migrations;const game=old.events.find(e=>e.id==='499fd208-4196-4e0e-afb5-89391bdd5edb');game.date='2026-10-21';
 old.tasks.push({id:'user-task',title:'My own task',due:'',course:'',status:'todo',priority:'normal',url:'',notes:'keep me',kind:'personal'});
 const result=migrateState(validateState(old));assert.equal(result.changed,true);assert.equal(result.state.events.find(e=>e.id===game.id).date,'2026-10-20');assert.equal(result.state.tasks.at(-1).notes,'keep me');assert.equal(result.state.events.length,old.events.length);assert.equal(game.date,'2026-10-21');
 result.state.events.find(e=>e.id===game.id).date='2026-10-22';assert.equal(migrateState(result.state).changed,false);assert.equal(migrateState(result.state).state.events.find(e=>e.id===game.id).date,'2026-10-22');assert.ok(result.state.migrations.includes(RELEASE_MIGRATION));
});
test('manual reschedule is not overwritten; old tasks receive compatible categories',()=>{
 const old=structuredClone(seed);delete old.migrations;const game=old.events.find(e=>e.id==='499fd208-4196-4e0e-afb5-89391bdd5edb');game.date='2026-10-22';for(const t of old.tasks)delete t.kind;
 const result=migrateState(validateState(old));assert.equal(result.state.events.find(e=>e.id===game.id).date,'2026-10-22');assert.equal(result.state.tasks[0].kind,'school');assert.equal(result.state.tasks.find(t=>t.title==='Купить орехи').kind,'personal');assert.equal(result.state.tasks.find(t=>t.title.includes('poetry annotation')).kind,'school');
 assert.throws(()=>validateState({...seed,tasks:[{...seed.tasks[0],kind:'invalid'}]}));
});

test('authenticated GET persists migration into existing storage without reseeding',async()=>{
 const {createHandler}=await import('../lib/handler.mjs');const {memoryStore,testConfig}=await import('./helpers.mjs');const {default:http}=await import('node:http');
 const old=structuredClone(seed);delete old.migrations;old.events.find(e=>e.id==='499fd208-4196-4e0e-afb5-89391bdd5edb').date='2026-10-21';old.focus.notes='Existing private note';
 const store=memoryStore();await store.load(old);const cfg=testConfig();const server=http.createServer(createHandler({getConfig:()=>cfg,store}));await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 try{const login=await fetch(base+'/api/login',{method:'POST',headers:{Origin:cfg.origin,'Content-Type':'application/json'},body:JSON.stringify({pin:cfg.pin})});const cookie=login.headers.get('set-cookie').split(';')[0];const r=await fetch(base+'/api/state',{headers:{Cookie:cookie}});assert.equal(r.status,200);const b=await r.json();assert.equal(b.state.focus.notes,'Existing private note');assert.equal(b.state.events.find(e=>e.id==='499fd208-4196-4e0e-afb5-89391bdd5edb').date,'2026-10-20');assert.equal(b.revision,2);const again=await(await fetch(base+'/api/state',{headers:{Cookie:cookie}})).json();assert.equal(again.revision,2);assert.equal((await store.load(old)).state.focus.notes,'Existing private note');}finally{await new Promise(r=>server.close(r));}
});
