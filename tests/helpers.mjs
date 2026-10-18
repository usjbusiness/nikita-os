import {randomBytes} from 'node:crypto';
export function memoryStore(){let document=null,attempts=0;const sessions=new Map();return {
 async load(seed){if(!document)document={state:structuredClone(seed),revision:1};return structuredClone(document);},
 async save(rev,state){if(document?.revision!==rev)return null;document={state:structuredClone(state),revision:rev+1};return rev+1;},
 async takeAttempt(){return ++attempts<=8;},async clearAttempts(){attempts=0;},
 async createSession(hash,auth,expiry){sessions.set(hash,{auth,expiry});},
 async hasSession(hash,auth){const s=sessions.get(hash);return !!s&&s.auth===auth&&new Date(s.expiry)>new Date();},
 async removeSession(hash){sessions.delete(hash);}
};}
export function testConfig(origin='http://localhost:3191'){return {pin:randomBytes(5).readUInt32LE(0).toString().padStart(8,'0'),origin,secret:randomBytes(32).toString('hex'),url:'https://test-project.supabase.co',key:'sb_secret_not_a_real_key',secure:false};}
