import {
  ISTHMIAN_SOUTH_CENTRAL_ID,
  ISTHMIAN_NORTH_ID,
  ISTHMIAN_SOUTH_EAST_ID,
  NORTHERN_PREMIER_EAST_ID,
  NORTHERN_PREMIER_WEST_ID,
  NORTHERN_PREMIER_MIDLANDS_ID,
  SOUTHERN_LEAGUE_CENTRAL_ID,
  SOUTHERN_LEAGUE_SOUTH_ID
} from './national-league-step-four-world-v1.js';

export const NATIONAL_LEAGUE_STEP_FIVE_WORLD_VERSION = 1;
export const CCL_PREMIER_NORTH_ID = 'eng-step5-combined-counties-north';
export const CCL_PREMIER_SOUTH_ID = 'eng-step5-combined-counties-south';
export const EASTERN_COUNTIES_PREMIER_ID = 'eng-step5-eastern-counties-premier';
export const ESSEX_SENIOR_PREMIER_ID = 'eng-step5-essex-senior-premier';
export const HELLENIC_PREMIER_ID = 'eng-step5-hellenic-premier';
export const MIDLAND_PREMIER_ID = 'eng-step5-midland-premier';
export const NW_COUNTIES_PREMIER_ID = 'eng-step5-north-west-counties-premier';
export const NCEL_PREMIER_ID = 'eng-step5-northern-counties-east-premier';
export const NORTHERN_LEAGUE_ONE_ID = 'eng-step5-northern-league-one';
export const SOUTHERN_COMBINATION_PREMIER_ID = 'eng-step5-southern-combination-premier';
export const SCEFL_PREMIER_ID = 'eng-step5-southern-counties-east-premier';
export const SSM_PREMIER_ID = 'eng-step5-spartan-south-midlands-premier';
export const UCL_PREMIER_NORTH_ID = 'eng-step5-united-counties-premier-north';
export const UCL_PREMIER_SOUTH_ID = 'eng-step5-united-counties-premier-south';
export const WESSEX_PREMIER_ID = 'eng-step5-wessex-premier';
export const WESTERN_PREMIER_ID = 'eng-step5-western-premier';

export const STEP_FIVE_DIVISION_IDS = Object.freeze([
  CCL_PREMIER_NORTH_ID, CCL_PREMIER_SOUTH_ID, EASTERN_COUNTIES_PREMIER_ID, ESSEX_SENIOR_PREMIER_ID,
  HELLENIC_PREMIER_ID, MIDLAND_PREMIER_ID, NW_COUNTIES_PREMIER_ID, NCEL_PREMIER_ID,
  NORTHERN_LEAGUE_ONE_ID, SOUTHERN_COMBINATION_PREMIER_ID, SCEFL_PREMIER_ID, SSM_PREMIER_ID,
  UCL_PREMIER_NORTH_ID, UCL_PREMIER_SOUTH_ID, WESSEX_PREMIER_ID, WESTERN_PREMIER_ID
]);

export const STEP_FIVE_RULES = Object.freeze({
  divisionCount: 16,
  automaticPromotionPlaces: 1,
  playoffPlaces: Object.freeze([2, 3, 4, 5]),
  relegationPlaces: 2,
  playoffFormat: 'single-leg-higher-ranked-home',
  ranking: Object.freeze(['points', 'goalDifference', 'goalsFor', 'wins', 'headToHeadRecord', 'decidingMatchIfRequired'])
});

const DIVISION_NAMES = Object.freeze({
  [CCL_PREMIER_NORTH_ID]: 'Combined Counties League Premier North',
  [CCL_PREMIER_SOUTH_ID]: 'Combined Counties League Premier South',
  [EASTERN_COUNTIES_PREMIER_ID]: 'Eastern Counties League Premier',
  [ESSEX_SENIOR_PREMIER_ID]: 'Essex Senior League Premier',
  [HELLENIC_PREMIER_ID]: 'Hellenic League Premier',
  [MIDLAND_PREMIER_ID]: 'Midland League Premier',
  [NW_COUNTIES_PREMIER_ID]: 'North West Counties League Premier',
  [NCEL_PREMIER_ID]: 'Northern Counties East League Premier',
  [NORTHERN_LEAGUE_ONE_ID]: 'Northern League Division One',
  [SOUTHERN_COMBINATION_PREMIER_ID]: 'Southern Combination League Premier',
  [SCEFL_PREMIER_ID]: 'Southern Counties East League Premier',
  [SSM_PREMIER_ID]: 'Spartan South Midlands League Premier',
  [UCL_PREMIER_NORTH_ID]: 'United Counties League Premier North',
  [UCL_PREMIER_SOUTH_ID]: 'United Counties League Premier South',
  [WESSEX_PREMIER_ID]: 'Wessex League Premier',
  [WESTERN_PREMIER_ID]: 'Western League Premier'
});

export const STEP_FIVE_TO_STEP_FOUR_PREFERENCES = Object.freeze({
  [CCL_PREMIER_NORTH_ID]: Object.freeze([ISTHMIAN_SOUTH_CENTRAL_ID, SOUTHERN_LEAGUE_CENTRAL_ID, ISTHMIAN_NORTH_ID, SOUTHERN_LEAGUE_SOUTH_ID]),
  [CCL_PREMIER_SOUTH_ID]: Object.freeze([ISTHMIAN_SOUTH_CENTRAL_ID, ISTHMIAN_SOUTH_EAST_ID, SOUTHERN_LEAGUE_SOUTH_ID, SOUTHERN_LEAGUE_CENTRAL_ID]),
  [EASTERN_COUNTIES_PREMIER_ID]: Object.freeze([ISTHMIAN_NORTH_ID, NORTHERN_PREMIER_MIDLANDS_ID, SOUTHERN_LEAGUE_CENTRAL_ID, ISTHMIAN_SOUTH_CENTRAL_ID]),
  [ESSEX_SENIOR_PREMIER_ID]: Object.freeze([ISTHMIAN_NORTH_ID, ISTHMIAN_SOUTH_EAST_ID, ISTHMIAN_SOUTH_CENTRAL_ID, SOUTHERN_LEAGUE_CENTRAL_ID]),
  [HELLENIC_PREMIER_ID]: Object.freeze([SOUTHERN_LEAGUE_SOUTH_ID, SOUTHERN_LEAGUE_CENTRAL_ID, NORTHERN_PREMIER_MIDLANDS_ID, ISTHMIAN_SOUTH_CENTRAL_ID]),
  [MIDLAND_PREMIER_ID]: Object.freeze([NORTHERN_PREMIER_MIDLANDS_ID, NORTHERN_PREMIER_WEST_ID, SOUTHERN_LEAGUE_CENTRAL_ID, NORTHERN_PREMIER_EAST_ID]),
  [NW_COUNTIES_PREMIER_ID]: Object.freeze([NORTHERN_PREMIER_WEST_ID, NORTHERN_PREMIER_EAST_ID, NORTHERN_PREMIER_MIDLANDS_ID, SOUTHERN_LEAGUE_CENTRAL_ID]),
  [NCEL_PREMIER_ID]: Object.freeze([NORTHERN_PREMIER_EAST_ID, NORTHERN_PREMIER_MIDLANDS_ID, NORTHERN_PREMIER_WEST_ID, SOUTHERN_LEAGUE_CENTRAL_ID]),
  [NORTHERN_LEAGUE_ONE_ID]: Object.freeze([NORTHERN_PREMIER_EAST_ID, NORTHERN_PREMIER_WEST_ID, NORTHERN_PREMIER_MIDLANDS_ID, SOUTHERN_LEAGUE_CENTRAL_ID]),
  [SOUTHERN_COMBINATION_PREMIER_ID]: Object.freeze([ISTHMIAN_SOUTH_EAST_ID, ISTHMIAN_SOUTH_CENTRAL_ID, SOUTHERN_LEAGUE_SOUTH_ID, ISTHMIAN_NORTH_ID]),
  [SCEFL_PREMIER_ID]: Object.freeze([ISTHMIAN_SOUTH_EAST_ID, ISTHMIAN_NORTH_ID, ISTHMIAN_SOUTH_CENTRAL_ID, SOUTHERN_LEAGUE_SOUTH_ID]),
  [SSM_PREMIER_ID]: Object.freeze([SOUTHERN_LEAGUE_CENTRAL_ID, ISTHMIAN_NORTH_ID, ISTHMIAN_SOUTH_CENTRAL_ID, NORTHERN_PREMIER_MIDLANDS_ID]),
  [UCL_PREMIER_NORTH_ID]: Object.freeze([NORTHERN_PREMIER_MIDLANDS_ID, NORTHERN_PREMIER_EAST_ID, SOUTHERN_LEAGUE_CENTRAL_ID, NORTHERN_PREMIER_WEST_ID]),
  [UCL_PREMIER_SOUTH_ID]: Object.freeze([NORTHERN_PREMIER_MIDLANDS_ID, SOUTHERN_LEAGUE_CENTRAL_ID, ISTHMIAN_SOUTH_CENTRAL_ID, NORTHERN_PREMIER_EAST_ID]),
  [WESSEX_PREMIER_ID]: Object.freeze([SOUTHERN_LEAGUE_SOUTH_ID, ISTHMIAN_SOUTH_CENTRAL_ID, ISTHMIAN_SOUTH_EAST_ID, SOUTHERN_LEAGUE_CENTRAL_ID]),
  [WESTERN_PREMIER_ID]: Object.freeze([SOUTHERN_LEAGUE_SOUTH_ID, NORTHERN_PREMIER_MIDLANDS_ID, SOUTHERN_LEAGUE_CENTRAL_ID, ISTHMIAN_SOUTH_CENTRAL_ID])
});

const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
function hashString(value) { let hash = 2166136261; for (const ch of String(value)) { hash ^= ch.charCodeAt(0); hash = Math.imul(hash, 16777619); } return hash >>> 0; }
function slugify(value) { return String(value).normalize('NFKD').replace(/[’']/g,'').replace(/&/g,' and ').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase(); }
function names(value) { return value.split('|').map(item => item.trim()).filter(Boolean); }
function make(competitionId, rawNames, { geoNorthing, geoEasting }) {
  return Object.freeze(names(rawNames).map(name => { const h = hashString(`${competitionId}:${name}`); return Object.freeze({
    id: `${competitionId}-${slugify(name)}`, slug: slugify(name), name,
    strength: 39 + (h % 8), geoNorthing: geoNorthing + (((h >>> 8) % 7) - 3), geoEasting: geoEasting + (((h >>> 12) % 7) - 3),
    preferredStepFourDivisionIds: [...STEP_FIVE_TO_STEP_FOUR_PREFERENCES[competitionId]]
  }); }));
}

// 2026/27 Step 5 memberships verified against The FA NLS Steps 5/6 allocation published 14 May 2026.
// Strength/geography fields are Football Lab simulation metadata, not FA ratings.
export const STEP_FIVE_2026_27_MEMBERSHIPS = Object.freeze({
  [CCL_PREMIER_NORTH_ID]: make(CCL_PREMIER_NORTH_ID, 'Abingdon United|Amersham Town|Ardley United|Bedfont|Broadfields United|Burnham|Easington Sports|Harefield United|Hilltop|Holyport|Kidlington|North Greenford United|North Leigh|Northwood|Penn & Tylers Green|Rayners Lane|Reading City|Thatcham Town|Wallingford & Crowmarsh|Wokingham Town', {geoNorthing:38,geoEasting:36}),
  [CCL_PREMIER_SOUTH_ID]: make(CCL_PREMIER_SOUTH_ID, 'Abbey Rangers|Alton|Badshot Lea|Balham|Camberley Town|Chipstead|Corinthian-Casuals|Epsom & Ewell|Eversley & California|Fleet Town|Godalming Town|Knaphill|Metropolitan Police|Redhill|Sheerwater|Sutton Common Rovers|Tadley Calleva|Tooting & Mitcham United|Virginia Water|Yateley United', {geoNorthing:28,geoEasting:36}),
  [EASTERN_COUNTIES_PREMIER_ID]: make(EASTERN_COUNTIES_PREMIER_ID, 'Brantham Athletic|Cornard United|Dereham Town|Downham Town|Ely City|Great Yarmouth Town|Harleston Town|Haverhill Rovers|Heacham|Ipswich Wanderers|Kirkley & Pakefield|Lakenheath|March Town United|Mildenhall Town|Soham Town Rangers|Stowmarket Town|Thetford Town|Walsham Le Willows|Wisbech Town|Woodbridge Town', {geoNorthing:54,geoEasting:78}),
  [ESSEX_SENIOR_PREMIER_ID]: make(ESSEX_SENIOR_PREMIER_ID, 'Barking|Basildon United|Benfleet|Clapton Community|Frenford|Great Wakering Rovers|Hackney Wick|Halstead Town|Harwich & Parkeston|Heybridge Swifts|Hullbridge Sports|Hutton|Ilford|Romford|Saffron Walden Town|SOUL Tower Hamlets|Sporting Bengal United|West Essex|White Ensign|Woodford Town', {geoNorthing:36,geoEasting:79}),
  [HELLENIC_PREMIER_ID]: make(HELLENIC_PREMIER_ID, 'Cinderford Town|Cirencester Town|Corsham Town|Cribbs|Devizes Town|Droitwich Spa|Fairford Town|Hallen|Hereford Pegasus|Highworth Town|Longlevens|Malmesbury Victoria|Mangotsfield United|Pershore Town 88|Roman Glass St George|Royal Wootton Bassett Town|Stourport Swifts|Thornbury Town|Tuffley Rovers|Westfields', {geoNorthing:49,geoEasting:36}),
  [MIDLAND_PREMIER_ID]: make(MIDLAND_PREMIER_ID, 'A F C Wolverhampton City|Abbey Hulton United|Brocton|Cheadle Town|Darlaston Town|Dudley Town|Lye Town|Northwich Victoria|Romulus|Runcorn Town|Sporting Khalsa|Stockport Georgians|Stone Old Alleynians|Sutton United|Tividale|Uttoxeter Town|West Didsbury & Chorlton|Whitchurch Alport|Winsford United|Wythenshawe Town', {geoNorthing:64,geoEasting:34}),
  [NW_COUNTIES_PREMIER_ID]: make(NW_COUNTIES_PREMIER_ID, 'Abbey Hey|AFC Liverpool|Atherton Laburnum Rovers|Barnoldswick Town|Burscough|Chadderton|Charnock Richard|Droylsden|Euxton Villa|F.C. St. Helens|FC Isle of Man|Glossop North End|Irlam|Longridge Town|Nelson|Pilkington|Prestwich Heys|Ramsbottom United|South Liverpool|Trafford', {geoNorthing:79,geoEasting:24}),
  [NCEL_PREMIER_ID]: make(NCEL_PREMIER_ID, 'Albion Sports|Barton Town|Bottesford Town|Campion|Dearne & District|Frickley Athletic|Golcar United|Handsworth|Horbury Town|Keighley Town|Knaresborough Town|Parkgate|Penistone Church|Pickering Town Community|Retford|Retford United|Rossington Main|Tadcaster Albion|Thackley Association|Worsbrough Bridge Athletic', {geoNorthing:78,geoEasting:58}),
  [NORTHERN_LEAGUE_ONE_ID]: make(NORTHERN_LEAGUE_ONE_ID, 'Birtley Town|Bishop Auckland|Blyth Town|Boro Rangers|Carlisle City|Crook Town|Easington Colliery|Horden Community Welfare|Kendal Town|Marske United|Newcastle Benfield|Newcastle Blue Star|Newton Aycliffe|North Shields|Northallerton Town|Penrith|Redcar Town|Shildon|Thornaby|Whickham|Whitley Bay|Yarm & Eaglescliffe', {geoNorthing:89,geoEasting:57}),
  [SOUTHERN_COMBINATION_PREMIER_ID]: make(SOUTHERN_COMBINATION_PREMIER_ID, 'AFC Varndeanians|Bexhill United|Billingshurst|Crawley Down Gatwick|East Grinstead Town|Eastbourne United Ass’n|Forest Row|Peacehaven & Telscombe|Hassocks|Haywards Heath Town|Horsham YMCA|Lancing|Lingfield|Little Common|Midhurst & Easebourne|Newhaven|Pagham|Roffey|Seaford Town|Wick', {geoNorthing:21,geoEasting:80}),
  [SCEFL_PREMIER_ID]: make(SCEFL_PREMIER_ID, 'AFC Greenwich Borough|Bearsted|Beckenham Town|Chislehurst Glebe|Corinthian|Erith & Belvedere|Faversham Strike Force|Fisher|Hollands And Blair|Holmesdale|Kennington|Larkfield And New Hythe|Phoenix Sports|Rusthall|S E Dons|Snodland Town|Sutton Athletic|Tunbridge Wells', {geoNorthing:28,geoEasting:87}),
  [SSM_PREMIER_ID]: make(SSM_PREMIER_ID, 'AFC Welwyn|Arlesey Town|Aylesbury Vale Dynamos|Baldock Town|Biggleswade United|Cockfosters|Colney Heath|Dunstable|Enfield|Everett Rovers|Harlow Town|Harpenden Town|Kempston Rovers|Kings Langley|Newport Pagnell Town|Potton United|Risborough Rangers|Sawbridgeworth Town|Tring Athletic|Wormley Rovers', {geoNorthing:46,geoEasting:53}),
  [UCL_PREMIER_NORTH_ID]: make(UCL_PREMIER_NORTH_ID, 'AFC Mansfield|Ashby Ivanhoe|Aylestone Park|Belper United|Blackstones|Clay Cross Town|Deeping Rangers|Eastwood Community|Gresley Rovers|Heanor Town|Hinckley AFC|Hucknall Town|Kimberley Miners Welfare|Leicester Nirvana|Newark Town|Sheffield|Sherwood Colliery|Skegness Town', {geoNorthing:67,geoEasting:56}),
  [UCL_PREMIER_SOUTH_ID]: make(UCL_PREMIER_SOUTH_ID, 'Atherstone Town|Bugbrooke St Michael|Coton Green Saturday|Coventry Sphinx|Daventry Town|Desborough Town|Eynesbury Rovers|FC Stratford|FC Peterborough|Godmanchester Rovers|Highgate United|Histon|Knowle|Lutterworth Town|Moulton|Northampton O.N.Chenecks|Northampton Sileby Rangers|Rugby Town|St Neots Town|Yaxley FC', {geoNorthing:55,geoEasting:56}),
  [WESSEX_PREMIER_ID]: make(WESSEX_PREMIER_ID, 'Andover New Street|Baffins Milton Rovers|Bashley|Bemerton Heath Harlequins|Bournemouth Poppies|Brockenhurst|Christchurch|Cowes Sports|Downton|East Cowes Victoria Athletic|Fareham Town|Fleetlands|Hamble Club|Hamworthy Recreation|Horndean|Hythe & Dibden|Laverstock & Ford|Millbrook|Petersfield Town|Sherborne Town|Sturminster Newton United|Wincanton Town', {geoNorthing:23,geoEasting:37}),
  [WESTERN_PREMIER_ID]: make(WESTERN_PREMIER_ID, 'Bovey Tracey|Bradford Town|Bridgwater United|Brislington|Brixham|Buckland Athletic|Clevedon Town|Ivybridge Town|Liskeard Athletic|Newquay|Oldland Abbotonians|Portishead Town|Saltash United|Shepton Mallet|Sidmouth Town|St Blazey|Street|Tavistock Association|Torpoint Athletic|Wellington', {geoNorthing:24,geoEasting:20})
});

export const STEP_FIVE_2026_27_TOTAL_CLUBS = Object.values(STEP_FIVE_2026_27_MEMBERSHIPS).reduce((sum, clubs) => sum + clubs.length, 0);

function seededRandom(seed) { let state = hashString(seed) || 1; return () => { state += 0x6D2B79F5; let v = state; v = Math.imul(v ^ (v >>> 15), v | 1); v ^= v + Math.imul(v ^ (v >>> 7), v | 61); return ((v ^ (v >>> 14)) >>> 0) / 4294967296; }; }
function poisson(lambda, random) { const limit = Math.exp(-lambda); let product=1,count=0; do { count++; product*=random(); } while(product>limit&&count<10); return clamp(count-1,0,7); }
function validateMembership(clubs) { if (!Array.isArray(clubs) || clubs.length < 18 || clubs.length > 22 || clubs.length % 2) throw new Error('Step 5 simulation requires an even 18-22 club division.'); if (new Set(clubs.map(c=>c?.id)).size!==clubs.length) throw new Error('Step 5 club ids must be unique.'); if (clubs.some(c=>!Number.isFinite(Number(c.strength)))) throw new Error('Every Step 5 club requires numeric strength.'); }
function createFixtures(clubs) {
  validateMembership(clubs); const first=[]; let rotation=clubs.map(c=>c.id);
  for(let r=0;r<rotation.length-1;r++){ const round=[]; for(let p=0;p<rotation.length/2;p++){ const a=rotation[p],b=rotation[rotation.length-1-p],flip=p===0?r%2===1:p%2===1; round.push({homeClubId:flip?b:a,awayClubId:flip?a:b}); } first.push(round); rotation=[rotation[0],rotation.at(-1),...rotation.slice(1,-1)]; }
  const ret=[...first.slice(1),first[0]]; return [...first,...ret.map(round=>round.map(f=>({homeClubId:f.awayClubId,awayClubId:f.homeClubId})))].map((round,ri)=>round.map((f,mi)=>({id:`s5-mw${ri+1}-m${mi+1}`,round:ri+1,...f,played:false,homeGoals:null,awayGoals:null})));
}
function blankTable(clubs){return clubs.map(c=>({clubId:c.id,played:0,won:0,drawn:0,lost:0,goalsFor:0,goalsAgainst:0,goalDifference:0,points:0}));}
function simulateFixture(f,clubMap,seed){const random=seededRandom(`${seed}:${f.id}`),home=clubMap.get(f.homeClubId),away=clubMap.get(f.awayClubId),diff=clamp(((Number(home.strength)+1.9)-Number(away.strength))/15.5,-1.3,1.3);return{...f,played:true,homeGoals:poisson(clamp(1.40+diff,.28,3.1),random),awayGoals:poisson(clamp(1.02-diff,.22,2.7),random)};}
function apply(table,r){const h=table.find(x=>x.clubId===r.homeClubId),a=table.find(x=>x.clubId===r.awayClubId);h.played++;a.played++;h.goalsFor+=r.homeGoals;h.goalsAgainst+=r.awayGoals;a.goalsFor+=r.awayGoals;a.goalsAgainst+=r.homeGoals;if(r.homeGoals>r.awayGoals){h.won++;h.points+=3;a.lost++;}else if(r.homeGoals<r.awayGoals){a.won++;a.points+=3;h.lost++;}else{h.drawn++;a.drawn++;h.points++;a.points++;}h.goalDifference=h.goalsFor-h.goalsAgainst;a.goalDifference=a.goalsFor-a.goalsAgainst;}
function h2h(ids,fixtures){const set=new Set(ids),out=Object.fromEntries(ids.map(id=>[id,{points:0,gd:0,gf:0}]));for(const f of fixtures.flat()){if(!f.played||!set.has(f.homeClubId)||!set.has(f.awayClubId))continue;const h=out[f.homeClubId],a=out[f.awayClubId];h.gf+=f.homeGoals;a.gf+=f.awayGoals;h.gd+=f.homeGoals-f.awayGoals;a.gd+=f.awayGoals-f.homeGoals;if(f.homeGoals>f.awayGoals)h.points+=3;else if(f.homeGoals<f.awayGoals)a.points+=3;else{h.points++;a.points++;}}return out;}
function consequences(start,end,clubCount){const out=[];if(start<=1&&end>1)out.push('automatic-promotion');if(start<=5&&end>5)out.push('playoff-qualification');const relegationStart=clubCount-1;if(start<relegationStart&&end>=relegationStart)out.push('relegation');for(const boundary of [2,3,4])if(start<=boundary&&end>boundary){out.push('playoff-seeding');break;}return out;}
export function rankStepFiveTable(table,fixtures,{seed='step-five-ranking'}={}){
  const clubCount=table.length,sorted=[...table].sort((a,b)=>b.points-a.points||b.goalDifference-a.goalDifference||b.goalsFor-a.goalsFor||b.won-a.won),groups=[];for(const row of sorted){const g=groups.at(-1);if(g&&['points','goalDifference','goalsFor','won'].every(k=>Number(g[0][k])===Number(row[k])))g.push(row);else groups.push([row]);}
  const rows=[],unresolvedGroups=[],administrativeResolutions=[];for(const group of groups){if(group.length===1){rows.push({...clone(group[0]),position:rows.length+1});continue;}const records=h2h(group.map(r=>r.clubId),fixtures);let ranked=group.map(row=>({row,h:records[row.clubId]})).sort((a,b)=>b.h.points-a.h.points||b.h.gd-a.h.gd||b.h.gf-a.h.gf);let i=0;while(i<ranked.length){const first=ranked[i];let end=i+1;while(end<ranked.length&&ranked[end].h.points===first.h.points&&ranked[end].h.gd===first.h.gd&&ranked[end].h.gf===first.h.gf)end++;let tied=ranked.slice(i,end);const startPos=rows.length+1,endPos=startPos+tied.length-1,cons=tied.length>1?consequences(startPos,endPos,clubCount):[],unresolved=tied.length>1&&cons.length>0;if(tied.length>1&&!unresolved){tied=tied.sort((a,b)=>hashString(`${seed}:${a.row.clubId}`)-hashString(`${seed}:${b.row.clubId}`));administrativeResolutions.push({clubIds:tied.map(x=>x.row.clubId),positions:[startPos,endPos],method:'simulated-administrative-lot'});}for(const item of tied)rows.push({...clone(item.row),position:rows.length+1,tiebreak:{headToHeadPoints:item.h.points,headToHeadGoalDifference:item.h.gd,headToHeadGoalsFor:item.h.gf,unresolved}});if(unresolved)unresolvedGroups.push({clubIds:tied.map(x=>x.row.clubId),positions:[startPos,endPos],consequences:cons,method:'deciding-league-match-required'});i=end;}}
  return{rows,unresolvedGroups,administrativeResolutions,decidingMatchRequired:unresolvedGroups.length>0};
}
function simulateKnockout(home,away,seed){const random=seededRandom(seed),diff=clamp(((Number(home.strength)+1.7)-Number(away.strength))/17,-1.1,1.1);let hg=poisson(clamp(1.33+diff,.24,2.9),random),ag=poisson(clamp(1.05-diff,.22,2.7),random),method='90-minutes',extraTime=null,penalties=null;if(hg===ag){const er=seededRandom(`${seed}:et`),eh=poisson(.3,er),ea=poisson(.27,er);extraTime={homeGoals:eh,awayGoals:ea};if(eh!==ea){hg+=eh;ag+=ea;method='extra-time';}else{const pr=seededRandom(`${seed}:pens`),homeWins=pr()<clamp(.5+(home.strength-away.strength)/300,.43,.57);penalties=homeWins?{home:5,away:4}:{home:4,away:5};method='penalties';return{homeClubId:home.id,awayClubId:away.id,homeGoals:hg,awayGoals:ag,extraTime,penalties,method,winnerClubId:homeWins?home.id:away.id};}}return{homeClubId:home.id,awayClubId:away.id,homeGoals:hg,awayGoals:ag,extraTime,penalties,method,winnerClubId:hg>ag?home.id:away.id};}

export function simulateStepFiveDivisionSeason({competitionId,season='2026/27',clubs=STEP_FIVE_2026_27_MEMBERSHIPS[competitionId],seed='football-lab-step-five',completedAt=null}={}){
  if(!STEP_FIVE_DIVISION_IDS.includes(competitionId))throw new Error('Unsupported Step 5 division.');validateMembership(clubs);const clubMap=new Map(clubs.map(c=>[c.id,c])),fixtures=createFixtures(clubs).map((round,ri)=>round.map((f,mi)=>simulateFixture({...f,id:`${competitionId}-mw${ri+1}-m${mi+1}`},clubMap,`${seed}:${season}:${competitionId}`))),table=blankTable(clubs);fixtures.flat().forEach(r=>apply(table,r));const ranking=rankStepFiveTable(table,fixtures,{seed:`${seed}:${season}:${competitionId}:rank`});const base={schemaVersion:NATIONAL_LEAGUE_STEP_FIVE_WORLD_VERSION,key:`${competitionId}:${season}`,competitionId,competitionName:DIVISION_NAMES[competitionId],season,completedAt,membershipSource:season==='2026/27'?'2026/27 verified FA Step 5 allocation':'derived English pyramid membership',clubs:clubs.map(c=>clone(c)),clubCount:clubs.length,regularSeasonMatchesPerClub:(clubs.length-1)*2,regularSeasonMatches:fixtures.flat().length,rankingRules:[...STEP_FIVE_RULES.ranking],finalTable:ranking.rows,rankingResolution:{decidingMatchRequired:ranking.decidingMatchRequired,unresolvedGroups:ranking.unresolvedGroups,administrativeResolutions:ranking.administrativeResolutions}};
  if(ranking.decidingMatchRequired)return{...base,status:'resolution-required',championClubId:ranking.rows[0]?.clubId||null,promotedClubIds:[],playoffClubIds:[],playoffWinnerClubId:null,relegatedClubIds:[],playoffs:null};const championClubId=ranking.rows[0].clubId,playoffRows=ranking.rows.slice(1,5),byId=id=>clubMap.get(id),[second,third,fourth,fifth]=playoffRows.map(row=>byId(row.clubId)),semiA=simulateKnockout(second,fifth,`${seed}:${season}:${competitionId}:2v5`),semiB=simulateKnockout(third,fourth,`${seed}:${season}:${competitionId}:3v4`),positions=new Map(ranking.rows.map(row=>[row.clubId,row.position])),fa=byId(semiA.winnerClubId),fb=byId(semiB.winnerClubId),home=positions.get(fa.id)<positions.get(fb.id)?fa:fb,away=home.id===fa.id?fb:fa,final=simulateKnockout(home,away,`${seed}:${season}:${competitionId}:final`);
  return{...base,status:'complete',championClubId,automaticPromotionClubIds:[championClubId],playoffClubIds:playoffRows.map(r=>r.clubId),playoffWinnerClubId:final.winnerClubId,promotedClubIds:[championClubId,final.winnerClubId],relegatedClubIds:ranking.rows.slice(-2).map(r=>r.clubId),playoffs:{semiFinals:[semiA,semiB],final:{...final,hostClubId:home.id,venueRule:'higher-ranked-finalist-home'}}};
}

export function simulateAllStepFiveDivisions({season='2026/27',seed='football-lab-step-five',memberships=STEP_FIVE_2026_27_MEMBERSHIPS,completedAt=null}={}){return Object.fromEntries(STEP_FIVE_DIVISION_IDS.map(id=>[id,simulateStepFiveDivisionSeason({competitionId:id,season,clubs:memberships[id],seed,completedAt})]));}
