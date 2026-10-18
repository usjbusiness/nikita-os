import {readFileSync,existsSync} from 'node:fs';import {validateState} from '../validation.mjs';
validateState(JSON.parse(readFileSync(new URL('../seed.json',import.meta.url),'utf8')));
JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
for(const f of ['public/index.html','public/app.js','public/style.css','public/manifest.webmanifest','public/sw.js','public/brands/usj-bluejays.png','public/brands/usj-seal.png','public/brands/business-society.png','api/handler.js','supabase/setup.sql'])if(!existsSync(new URL('../'+f,import.meta.url)))throw Error('Missing '+f);
console.log('Nikita OS 2.0: Vercel/Supabase files and seed schema verified.');
