import {createHash} from 'node:crypto';
import {readFileSync,existsSync} from 'node:fs';import {validateState} from '../validation.mjs';
validateState(JSON.parse(readFileSync(new URL('../seed.json',import.meta.url),'utf8')));
const config=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
if(config.outputDirectory!==undefined&&config.outputDirectory!=='public')throw Error('vercel.json: outputDirectory должен быть public.');
if(config.buildCommand!==undefined&&config.buildCommand!=='npm run build')throw Error('vercel.json: buildCommand должен быть npm run build.');
for(const route of ['session','login','logout','state'])if(!config.rewrites?.some(r=>r.source==='/api/'+route&&r.destination==='/api/handler?route='+route))throw Error('vercel.json: отсутствует маршрут /api/'+route);
for(const f of ['public/v52.css','public/tools.js','public/import-core.js','public/vendor/pdf.min.mjs','public/vendor/pdf.worker.min.mjs','public/vendor/mammoth.browser.min.js','academics-validation.mjs','public/academics.css','public/index.html','public/app.js','public/v5.css','public/v4.css','public/planner.js','public/version.json','public/update-check.html','public/update-check.js','public/update-check.css','public/style.css','public/manifest.webmanifest','public/sw.js','public/brands/usj-bluejays.png','public/brands/usj-seal.png','public/brands/business-society.png','api/handler.js','migrations.mjs','supabase/setup.sql'])if(!existsSync(new URL('../'+f,import.meta.url)))throw Error('Missing '+f);
console.log('Nikita OS 5.2: Vercel/Supabase files and seed schema verified.');

const release=JSON.parse(readFileSync(new URL('../public/version.json',import.meta.url),'utf8'));
if(release.version!=='5.2.0'||!readFileSync(new URL('../public/index.html',import.meta.url),'utf8').includes('app-version\" content=\"5.2.0'))throw Error('Release mismatch');

const sample=JSON.parse(readFileSync(new URL('../seed.json',import.meta.url),'utf8'));sample.hockey.worked='release-check';sample.hockey.focusDate='2026-10-23';if(validateState(sample).hockey.worked!=='release-check')throw Error('Replace validation.mjs: old validator detected');

// Fail loudly on partial GitHub uploads rather than publishing the old interface.
const bundle=JSON.parse(readFileSync(new URL('../release-manifest.json',import.meta.url),'utf8'));
for(const [file,expected] of Object.entries(bundle.files)){
 // Deployment settings are validated semantically above, not byte-for-byte.
 if(file==='vercel.json')continue;
 let actual;try{actual=createHash('sha256').update(readFileSync(new URL('../'+file,import.meta.url))).digest('hex');}catch{throw Error('Неполная загрузка: отсутствует '+file+'. Загрузите папки из архива целиком.');}
 if(actual!==expected)throw Error('Неполная загрузка: '+file+' не соответствует версии '+bundle.version+'. Загрузите папки из архива целиком, включая public и scripts.');
}
console.log('Release '+bundle.version+': all bundle checksums verified.');
