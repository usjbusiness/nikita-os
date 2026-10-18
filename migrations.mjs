// One-time, revision-checked changes to existing Supabase data. Never reseed it.
export const RELEASE_MIGRATION='premium-3-game-oct20';
export function migrateState(input){
 const s=structuredClone(input);
 if((s.migrations||[]).includes(RELEASE_MIGRATION))return {state:s,changed:false};
 const game=s.events.find(e=>e.id==='499fd208-4196-4e0e-afb5-89391bdd5edb');
 if(game?.type==='game'&&game.date==='2026-10-21')game.date='2026-10-20';
 const annotation=s.tasks.find(t=>t.id==='f40e3f8f-ad3d-4027-b91e-dee7cd908084');
 if(annotation)annotation.kind='school';
 s.migrations=[...(s.migrations||[]),RELEASE_MIGRATION];
 return {state:s,changed:true};
}
