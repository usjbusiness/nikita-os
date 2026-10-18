import {readFileSync,existsSync} from 'node:fs';import {validateState} from '../validation.mjs';
validateState(JSON.parse(readFileSync(new URL('../seed.json',import.meta.url),'utf8')));
JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
for(const f of ['public/index.html','public/app.js','public/v4.css','public/planner.js','public/version.json','public/update-check.html','public/update-check.js','public/update-check.css','public/style.css','public/manifest.webmanifest','public/sw.js','public/brands/usj-bluejays.png','public/brands/usj-seal.png','public/brands/business-society.png','api/handler.js','migrations.mjs','supabase/setup.sql'])if(!existsSync(new URL('../'+f,import.meta.url)))throw Error('Missing '+f);
console.log('Nikita OS 4.0: Vercel/Supabase files and seed schema verified.');

const release=JSON.parse(readFileSync(new URL('../public/version.json',import.meta.url),'utf8'));
if(release.version!=='4.0.0'||!readFileSync(new URL('../public/index.html',import.meta.url),'utf8').includes('app-version\" content=\"4.0.0'))throw Error('Release mismatch');

const sample=JSON.parse(readFileSync(new URL('../seed.json',import.meta.url),'utf8'));sample.hockey.worked='release-check';sample.hockey.focusDate='2026-10-23';if(validateState(sample).hockey.worked!=='release-check')throw Error('Replace validation.mjs: old validator detected');
