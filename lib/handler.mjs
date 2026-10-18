import {randomBytes,scryptSync,timingSafeEqual,createHmac,createHash} from 'node:crypto';
import {validateState} from '../validation.mjs';
import seed from '../seed.json' with {type:'json'};
import {migrateState} from '../migrations.mjs';
import {createSupabaseStore} from './store.mjs';
export function readConfig(env=process.env){
 const pin=env.APP_PIN,origin=env.APP_URL?.replace(/\/$/,''),secret=env.SESSION_SECRET,url=env.SUPABASE_URL?.replace(/\/$/,''),key=env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY;
 if(!/^\d{8,12}$/.test(pin||'')||!secret||secret.length<32||!origin||!url||!key){const e=Error('Сайт ещё не настроен: добавь переменные Vercel и выполни supabase/setup.sql.');e.status=503;throw e;}
 const local=env.NODE_ENV!=='production'&&/^http:\/\/localhost:\d+$/.test(origin);
 if((!local&&!/^https:\/\//.test(origin))||!/^https:\/\//.test(url)){const e=Error('APP_URL и SUPABASE_URL должны использовать HTTPS.');e.status=503;throw e;}
 return {pin,origin,secret,url,key,secure:!local};
}
export function securityHeaders(res){
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Cache-Control','no-store');
}
const hash=v=>createHash('sha256').update(v).digest('hex');
const cookie=req=>{const part=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('nos_session='));return part?.slice(12)||'';};
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
async function readBody(req){
 let b=req.body;
 if(b===undefined){let s='';for await(const c of req){s+=c;if(Buffer.byteLength(s)>2_000_000){const e=Error('Максимум 2 МБ.');e.status=413;throw e;}}b=s;}
 if(typeof b==='string'){if(Buffer.byteLength(b)>2_000_000)throw Error('Too large');b=JSON.parse(b||'{}');}
 if(!b||typeof b!=='object'||Buffer.byteLength(JSON.stringify(b))>2_000_000)throw Error('Invalid body');return b;
}
export function createHandler({getConfig=readConfig,store:injectedStore}={}){
 return async function handler(req,res){securityHeaders(res);try{
  const cfg=getConfig(),store=injectedStore||createSupabaseStore(cfg),method=req.method;
  const parsed=new URL(req.url,cfg.origin);const route=String(req.query?.route||parsed.searchParams.get('route')||parsed.pathname.replace(/^\/api\//,''));
  if(!['GET','HEAD'].includes(method)&&req.headers.origin!==cfg.origin)return json(res,403,{error:'Адрес сайта не совпадает с APP_URL. Проверь переменную в Vercel.'});
  const token=cookie(req),auth=createHmac('sha256',cfg.secret).update('nos-auth-v2:'+cfg.pin).digest('hex');
  async function authenticated(){return /^[a-f0-9]{64}$/.test(token)&&await store.hasSession(hash(token),auth);}
  if(route==='session'&&method==='GET')return json(res,200,{authenticated:await authenticated()});
  if(route==='login'&&method==='POST'){
   if(!await store.takeAttempt())return json(res,429,{error:'Слишком много попыток. Подожди до 15 минут.'});
   const b=await readBody(req),candidate=typeof b.pin==='string'&&b.pin.length<=64?b.pin:'';
   const salt=createHmac('sha256',cfg.secret).update('nos-pin-salt').digest();
   if(!timingSafeEqual(scryptSync(candidate,salt,32),scryptSync(cfg.pin,salt,32)))return json(res,401,{error:'Неверный код.'});
   const value=randomBytes(32).toString('hex');await store.createSession(hash(value),auth,new Date(Date.now()+30*24*3600_000).toISOString());await store.clearAttempts();
   res.setHeader('Set-Cookie',`nos_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000${cfg.secure?'; Secure':''}`);return json(res,200,{ok:true});
  }
  if(!await authenticated())return json(res,401,{error:'Войди по своему коду.'});
  if(route==='logout'&&method==='POST'){await store.removeSession(hash(token));res.setHeader('Set-Cookie',`nos_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${cfg.secure?'; Secure':''}`);return json(res,200,{ok:true});}
  if(route==='state'&&method==='GET'){
   for(let attempt=0;attempt<3;attempt++){
    const data=await store.load(validateState(seed)),migration=migrateState(validateState(data.state));
    if(!migration.changed)return json(res,200,{state:migration.state,revision:Number(data.revision)});
    const next=await store.save(Number(data.revision),validateState(migration.state));
    if(next!==null)return json(res,200,{state:migration.state,revision:Number(next)});
   }
   return json(res,409,{error:'Данные сейчас изменяются. Обнови страницу.'});
  }
  if(route==='state'&&method==='PUT'){
   const b=await readBody(req);if(!Number.isSafeInteger(b.revision)||b.revision<1)return json(res,400,{error:'Неверная версия данных.'});
   const next=await store.save(b.revision,validateState(b.state));if(next==null)return json(res,409,{error:'Данные изменились на другом устройстве. Загружена свежая версия; повтори правку.'});
   return json(res,200,{revision:Number(next)});
  }
  return json(res,404,{error:'Не найдено.'});
 }catch(e){return json(res,e.status||400,{error:e.status?e.message:'Не удалось обработать запрос. Проверь поля и повтори.'});}}
}
