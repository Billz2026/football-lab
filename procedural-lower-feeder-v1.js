import { STEP_THREE_DIVISION_IDS, STEP_THREE_2026_27_MEMBERSHIPS } from './national-league-step-three-world-v1.js';

export const PROCEDURAL_LOWER_FEEDER_VERSION = 1;
export const PROCEDURAL_LOWER_FEEDER_ID = 'eng-procedural-lower-feeder';
export const PROCEDURAL_LOWER_FEEDER_POOL_SIZE = 88;
export const PROCEDURAL_LOWER_FEEDER_PROMOTION_PLACES = 8;

const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
function hashString(value){let hash=2166136261;for(const ch of String(value)){hash^=ch.charCodeAt(0);hash=Math.imul(hash,16777619);}return hash>>>0;}
function score(club,season,seed){const jitter=(hashString(`${seed}:${season}:${club.id}`)%1000)/1000;return Number(club.strength||50)*10+jitter;}
function compactClub(club,overrides={}){return{id:club.id,slug:club.slug||String(club.id||'').split('-').slice(3).join('-'),name:club.name||club.id,strength:Number(club.strength??50),geoNorthing:Number.isFinite(Number(club.geoNorthing))?Number(club.geoNorthing):50,pyramidOrigin:club.pyramidOrigin||'procedural-lower-feeder',...overrides};}
function initialPool(){return STEP_THREE_DIVISION_IDS.flatMap(competitionId=>(STEP_THREE_2026_27_MEMBERSHIPS[competitionId]||[]).map(club=>compactClub(club,{sourceCompetitionId:competitionId,pyramidOrigin:'seeded-from-2026-27-step-three'})));}
function activeCoreIds(career){const ids=new Set(career?.seasonClubIds||[]);for(const record of career?.worldMemberships||[]){if(record?.season!==career?.season||record?.status!=='complete')continue;if(['eng-championship','eng-league-one','eng-league-two','eng-national-league','eng-national-league-north','eng-national-league-south','eng-national-league-step-two'].includes(record.competitionId)){for(const club of record.clubs||[])ids.add(club.id);}}return ids;}
const PLACE_A=['Alder','Briar','Cedar','Dun','Elm','Farn','Glen','Hart','Ivy','Kings','Linden','Moor','North','Oak','Pine','Queens','River','Stone','Thorn','West'];
const PLACE_B=['bridge','brook','bury','combe','field','ford','ham','hurst','ley','mere','stead','ton','vale','wick','wood'];
const SUFFIX=['Athletic','City','Rovers','Town','United'];
function migrationClub(index,seed){const h=hashString(`${seed}:feeder-migration:${index}`),name=`${PLACE_A[h%PLACE_A.length]}${PLACE_B[(h>>>5)%PLACE_B.length]} ${SUFFIX[(h>>>10)%SUFFIX.length]}`;return compactClub({id:`eng-procedural-feeder-${String(index+1).padStart(3,'0')}`,slug:`procedural-feeder-${index+1}`,name,strength:48+(h%8),geoNorthing:18+((h>>>8)%75)},{pyramidOrigin:'procedural-feeder-migration-fill'});}

export function ensureProceduralLowerFeederState(career){
  if(!career||typeof career!=='object')return null;
  career.lowerFeederState ||= {schemaVersion:PROCEDURAL_LOWER_FEEDER_VERSION,competitionId:PROCEDURAL_LOWER_FEEDER_ID,mode:'persistent-pool-no-fixtures',initializedFrom:'2026/27 Step 3 club allocation',season:career.season||'2026/27',clubs:[],history:[]};
  const state=career.lowerFeederState;
  state.schemaVersion=PROCEDURAL_LOWER_FEEDER_VERSION;state.mode='persistent-pool-no-fixtures';state.history=Array.isArray(state.history)?state.history:[];
  if(!Array.isArray(state.clubs)||!state.clubs.length){
    const blocked=activeCoreIds(career),seed=career.seed||career.id||'career',base=initialPool().filter(club=>!blocked.has(club.id)),clubs=[...base];
    let index=0;while(clubs.length<PROCEDURAL_LOWER_FEEDER_POOL_SIZE){const club=migrationClub(index++,seed);if(!blocked.has(club.id)&&!clubs.some(item=>item.id===club.id))clubs.push(club);}
    state.clubs=clubs.slice(0,PROCEDURAL_LOWER_FEEDER_POOL_SIZE);
  }
  if(state.clubs.length!==PROCEDURAL_LOWER_FEEDER_POOL_SIZE||new Set(state.clubs.map(c=>c.id)).size!==PROCEDURAL_LOWER_FEEDER_POOL_SIZE)throw new Error('Procedural lower feeder must contain exactly 88 unique clubs.');
  return state;
}

function selectEight(state,sourceSeason,seed){
  const ranked=[...state.clubs].sort((a,b)=>b.geoNorthing-a.geoNorthing||a.name.localeCompare(b.name)),mid=Math.floor(ranked.length/2),north=ranked.slice(0,mid),south=ranked.slice(mid);
  const pick=group=>[...group].sort((a,b)=>score(b,sourceSeason,seed)-score(a,sourceSeason,seed)||a.name.localeCompare(b.name)).slice(0,4);
  return [...pick(north),...pick(south)];
}

export function exchangeProceduralLowerFeeder(career,{sourceSeason,targetSeason,relegatedClubs=[]}={}){
  const state=ensureProceduralLowerFeederState(career);if(!sourceSeason||!targetSeason)throw new Error('Procedural feeder exchange requires source and target seasons.');
  const key=`${PROCEDURAL_LOWER_FEEDER_ID}:${sourceSeason}->${targetSeason}`,existing=state.history.find(record=>record.key===key);if(existing)return{status:'already-finalised',record:clone(existing),promotedClubs:clone(existing.promotedClubs)};
  if(!Array.isArray(relegatedClubs)||relegatedClubs.length!==8||new Set(relegatedClubs.map(c=>c?.id)).size!==8)throw new Error('Procedural feeder exchange requires exactly eight unique relegated Step 2 clubs.');
  const seed=career.seed||career.id||'career',selected=selectEight(state,sourceSeason,seed),selectedIds=new Set(selected.map(c=>c.id));
  const returning=relegatedClubs.map(club=>compactClub(club,{strength:clamp(Number(club.strength||54)-2,46,58),pyramidOrigin:'national-league-step-two-relegation-to-procedural-feeder'}));
  const survivors=state.clubs.filter(club=>!selectedIds.has(club.id));
  const next=[...survivors,...returning];if(next.length!==PROCEDURAL_LOWER_FEEDER_POOL_SIZE||new Set(next.map(c=>c.id)).size!==PROCEDURAL_LOWER_FEEDER_POOL_SIZE)throw new Error('Procedural feeder exchange must preserve an 88-club unique pool.');
  const promotedClubs=selected.map(club=>compactClub(club,{strength:clamp(Number(club.strength||50)+2,49,60),pyramidOrigin:'procedural-lower-feeder-promotion'}));
  const record={schemaVersion:PROCEDURAL_LOWER_FEEDER_VERSION,key,competitionId:PROCEDURAL_LOWER_FEEDER_ID,sourceSeason,targetSeason,status:'complete',mode:'persistent-pool-no-fixtures',poolSize:PROCEDURAL_LOWER_FEEDER_POOL_SIZE,promotionPlaces:8,relegationReturns:8,promotedClubIds:promotedClubs.map(c=>c.id),relegatedClubIds:returning.map(c=>c.id),promotedClubs:clone(promotedClubs),relegatedClubs:clone(returning),selectionMethod:'deterministic-strength-form-score-with-four-north-four-south-candidates'};
  state.clubs=next;state.season=targetSeason;state.history.push(record);return{status:'finalised',record:clone(record),promotedClubs:clone(promotedClubs)};
}

export function proceduralLowerFeederSnapshot(career){const state=ensureProceduralLowerFeederState(career);return clone({schemaVersion:state.schemaVersion,competitionId:state.competitionId,mode:state.mode,season:state.season,poolSize:state.clubs.length,historyCount:state.history.length,clubs:state.clubs});}
