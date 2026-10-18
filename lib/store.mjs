export function createSupabaseStore({url,key},fetcher=fetch){
 async function rest(path,options={}){
  let response;try{response=await fetcher(url+'/rest/v1/'+path,{...options,headers:{apikey:key,...(key.startsWith('sb_secret_')?{}:{Authorization:'Bearer '+key}),'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(12000)});}catch{const e=Error('База недоступна. Проверь Supabase и подключение.');e.status=503;throw e;}
  if(!response.ok){
   // Expose only fixed operation names, HTTP status and allowlisted error codes.
   // Never return response bodies, headers, URLs, keys or session identifiers.
   const operation=path.startsWith('rpc/nos_take_login_attempt')?'проверка попыток входа':path.startsWith('rpc/nos_save_state')?'сохранение данных':path.startsWith('nos_login_limits')?'сброс попыток входа':path.startsWith('nos_sessions')?'сессия входа':path.startsWith('nos_state')?'загрузка данных':'запрос';
   let body={};try{body=await response.json();}catch{}
   const allowed=new Set(['42501','42P01','42883','42702','PGRST202','PGRST205','PGRST301','PGRST302','PGRST303','PGRST106','PGRST003']);
   const code=allowed.has(body?.code)?' / '+body.code:'';
   const hint=response.status===401?'Ключ отклонён базой.':response.status===403?'Доступ запрещён.':response.status===404?'Адрес или объект API не найден.':response.status>=500?'Ошибка сервиса базы.':'Ошибка запроса к базе.';
   const e=Error(`Supabase: HTTP ${response.status}${code}; шаг: ${operation}. ${hint}`);e.status=503;throw e;
  }
  const text=await response.text();return text?JSON.parse(text):null;
 }
 return {
  async load(seed){let rows=await rest('nos_state?id=eq.1&select=body,revision');if(!rows.length){await rest('nos_state?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates'},body:JSON.stringify({id:1,body:seed,revision:1})});rows=await rest('nos_state?id=eq.1&select=body,revision');}return {state:rows[0].body,revision:rows[0].revision};},
  save(revision,state){return rest('rpc/nos_save_state',{method:'POST',body:JSON.stringify({p_expected_revision:revision,p_body:state})});},
  takeAttempt(){return rest('rpc/nos_take_login_attempt',{method:'POST',body:'{}'});},
  clearAttempts(){return rest('nos_login_limits?key=eq.login',{method:'DELETE'});},
  createSession(hash,auth,expiry){return rest('nos_sessions',{method:'POST',body:JSON.stringify({token_hash:hash,auth_version:auth,expires_at:expiry})});},
  async hasSession(hash,auth){const rows=await rest(`nos_sessions?token_hash=eq.${hash}&auth_version=eq.${auth}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=token_hash`);return rows.length===1;},
  removeSession(hash){return rest('nos_sessions?token_hash=eq.'+hash,{method:'DELETE'});}
 };
}
