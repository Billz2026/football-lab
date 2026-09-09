import {
  CCL_PREMIER_NORTH_ID,
  CCL_PREMIER_SOUTH_ID,
  EASTERN_COUNTIES_PREMIER_ID,
  ESSEX_SENIOR_PREMIER_ID,
  HELLENIC_PREMIER_ID,
  MIDLAND_PREMIER_ID,
  NW_COUNTIES_PREMIER_ID,
  NCEL_PREMIER_ID,
  NORTHERN_LEAGUE_ONE_ID,
  SOUTHERN_COMBINATION_PREMIER_ID,
  SCEFL_PREMIER_ID,
  SSM_PREMIER_ID,
  UCL_PREMIER_NORTH_ID,
  UCL_PREMIER_SOUTH_ID,
  WESSEX_PREMIER_ID,
  WESTERN_PREMIER_ID
} from './national-league-step-five-world-v1.js';

export const NATIONAL_LEAGUE_STEP_SIX_WORLD_VERSION = 1;
export const CCL1_ID = "eng-step6-combined-counties-one";
export const ECLN_ID = "eng-step6-eastern-counties-one";
export const ESLS_ID = "eng-step6-eastern-senior";
export const HL1_ID = "eng-step6-hellenic-one";
export const ML1_ID = "eng-step6-midland-one";
export const NWCN_ID = "eng-step6-north-west-counties-north";
export const NWCS_ID = "eng-step6-north-west-counties-south";
export const NCE1_ID = "eng-step6-northern-counties-east-one";
export const NL2_ID = "eng-step6-northern-league-two";
export const SWPW_ID = "eng-step6-south-west-peninsula-west";
export const SWPE_ID = "eng-step6-south-west-peninsula-east";
export const SC1_ID = "eng-step6-southern-combination-one";
export const SCE1_ID = "eng-step6-southern-counties-east-one";
export const SSM1_ID = "eng-step6-spartan-south-midlands-one";
export const UCL1_ID = "eng-step6-united-counties-one";
export const WX1_ID = "eng-step6-wessex-one";
export const WL1_ID = "eng-step6-western-one";

export const STEP_SIX_DIVISION_IDS = Object.freeze([CCL1_ID, ECLN_ID, ESLS_ID, HL1_ID, ML1_ID, NWCN_ID, NWCS_ID, NCE1_ID, NL2_ID, SWPW_ID, SWPE_ID, SC1_ID, SCE1_ID, SSM1_ID, UCL1_ID, WX1_ID, WL1_ID]);
export const STEP_SIX_PLAYOFF_DIVISION_IDS = Object.freeze([CCL1_ID, ECLN_ID, ESLS_ID, HL1_ID, ML1_ID, NWCN_ID, NWCS_ID, NCE1_ID, NL2_ID, SC1_ID, SCE1_ID, SSM1_ID, UCL1_ID, WX1_ID, WL1_ID]);

export const STEP_SIX_RULES = Object.freeze({
  divisionCount: 17,
  automaticPromotionPlacesPerDivision: 1,
  playoffPromotionDivisions: 15,
  southWestPeninsulaAutomaticOnlyDivisions: 2,
  totalPromotionPlaces: 32,
  playoffEligibilityFloor: 7,
  relegationModel: 'bottom-three-liable-subject-to-fa-committee-reprieves-and-under-18-discretion',
  ranking: Object.freeze(['points','goalDifference','goalsFor','wins','headToHeadRecord','decidingMatchIfRequired'])
});

export const STEP_SIX_DIVISION_NAMES = Object.freeze({
  [CCL1_ID]: "Combined Counties League Division One",
  [ECLN_ID]: "Eastern Counties League Division One",
  [ESLS_ID]: "Eastern Counties League Eastern Senior League",
  [HL1_ID]: "Hellenic League Division One",
  [ML1_ID]: "Midland League Division One",
  [NWCN_ID]: "North West Counties League Division One North",
  [NWCS_ID]: "North West Counties League Division One South",
  [NCE1_ID]: "Northern Counties East League Division One",
  [NL2_ID]: "Northern League Division Two",
  [SWPW_ID]: "South West Peninsula League Premier West",
  [SWPE_ID]: "South West Peninsula League Premier East",
  [SC1_ID]: "Southern Combination League Division One",
  [SCE1_ID]: "Southern Counties East League Division One",
  [SSM1_ID]: "Spartan South Midlands League Division One",
  [UCL1_ID]: "United Counties League Division One",
  [WX1_ID]: "Wessex League Division One",
  [WL1_ID]: "Western League Division One"
});

export const STEP_SIX_TO_STEP_FIVE_PREFERENCES = Object.freeze({
  [CCL1_ID]: Object.freeze([CCL_PREMIER_NORTH_ID, CCL_PREMIER_SOUTH_ID]),
  [ECLN_ID]: Object.freeze([EASTERN_COUNTIES_PREMIER_ID, ESSEX_SENIOR_PREMIER_ID]),
  [ESLS_ID]: Object.freeze([ESSEX_SENIOR_PREMIER_ID, EASTERN_COUNTIES_PREMIER_ID]),
  [HL1_ID]: Object.freeze([HELLENIC_PREMIER_ID, MIDLAND_PREMIER_ID]),
  [ML1_ID]: Object.freeze([MIDLAND_PREMIER_ID, UCL_PREMIER_NORTH_ID, UCL_PREMIER_SOUTH_ID]),
  [NWCN_ID]: Object.freeze([NW_COUNTIES_PREMIER_ID, MIDLAND_PREMIER_ID]),
  [NWCS_ID]: Object.freeze([NW_COUNTIES_PREMIER_ID, MIDLAND_PREMIER_ID]),
  [NCE1_ID]: Object.freeze([NCEL_PREMIER_ID, UCL_PREMIER_NORTH_ID]),
  [NL2_ID]: Object.freeze([NORTHERN_LEAGUE_ONE_ID, NCEL_PREMIER_ID]),
  [SWPW_ID]: Object.freeze([WESTERN_PREMIER_ID, WESSEX_PREMIER_ID]),
  [SWPE_ID]: Object.freeze([WESTERN_PREMIER_ID, WESSEX_PREMIER_ID]),
  [SC1_ID]: Object.freeze([SOUTHERN_COMBINATION_PREMIER_ID, CCL_PREMIER_SOUTH_ID, SCEFL_PREMIER_ID]),
  [SCE1_ID]: Object.freeze([SCEFL_PREMIER_ID, SOUTHERN_COMBINATION_PREMIER_ID, ESSEX_SENIOR_PREMIER_ID]),
  [SSM1_ID]: Object.freeze([SSM_PREMIER_ID, UCL_PREMIER_NORTH_ID, CCL_PREMIER_NORTH_ID]),
  [UCL1_ID]: Object.freeze([UCL_PREMIER_NORTH_ID, UCL_PREMIER_SOUTH_ID, MIDLAND_PREMIER_ID, NCEL_PREMIER_ID]),
  [WX1_ID]: Object.freeze([WESSEX_PREMIER_ID, CCL_PREMIER_SOUTH_ID, WESTERN_PREMIER_ID]),
  [WL1_ID]: Object.freeze([WESTERN_PREMIER_ID, HELLENIC_PREMIER_ID, WESSEX_PREMIER_ID])
});

const STEP_SIX_CENTRES = Object.freeze({
  [CCL1_ID]: Object.freeze({geoNorthing:38, geoEasting:40}),
  [ECLN_ID]: Object.freeze({geoNorthing:58, geoEasting:80}),
  [ESLS_ID]: Object.freeze({geoNorthing:38, geoEasting:82}),
  [HL1_ID]: Object.freeze({geoNorthing:49, geoEasting:36}),
  [ML1_ID]: Object.freeze({geoNorthing:63, geoEasting:38}),
  [NWCN_ID]: Object.freeze({geoNorthing:80, geoEasting:24}),
  [NWCS_ID]: Object.freeze({geoNorthing:66, geoEasting:27}),
  [NCE1_ID]: Object.freeze({geoNorthing:77, geoEasting:58}),
  [NL2_ID]: Object.freeze({geoNorthing:89, geoEasting:57}),
  [SWPW_ID]: Object.freeze({geoNorthing:12, geoEasting:18}),
  [SWPE_ID]: Object.freeze({geoNorthing:20, geoEasting:28}),
  [SC1_ID]: Object.freeze({geoNorthing:22, geoEasting:80}),
  [SCE1_ID]: Object.freeze({geoNorthing:29, geoEasting:88}),
  [SSM1_ID]: Object.freeze({geoNorthing:49, geoEasting:57}),
  [UCL1_ID]: Object.freeze({geoNorthing:64, geoEasting:59}),
  [WX1_ID]: Object.freeze({geoNorthing:25, geoEasting:38}),
  [WL1_ID]: Object.freeze({geoNorthing:35, geoEasting:30})
});

const PROMOTION_INELIGIBLE_NAMES = new Set([
  "AFC Sudbury (Reserves)",
  "Dorking Wanderers ('B')",
  "Falmouth Town (Reserves)",
  "Gorleston (Reserves)",
  "Leighton Town Reserves",
  "Needham Market (Reserves)",
  "Newmarket Town Reserves",
  "Swindon Supermarine Res",
  "Wroxham (Reserves)"
]);

const clone=value=>JSON.parse(JSON.stringify(value));
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function hashString(value){let hash=2166136261;for(const ch of String(value)){hash^=ch.charCodeAt(0);hash=Math.imul(hash,16777619);}return hash>>>0;}
function slugify(value){return String(value).normalize('NFKD').replace(/[’']/g,'').replace(/&/g,' and ').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase();}
function names(value){return value.split('|').map(item=>item.trim()).filter(Boolean);}
function make(competitionId,rawNames,{geoNorthing,geoEasting}){
  return Object.freeze(names(rawNames).map(name=>{const h=hashString(`${competitionId}:${name}`);return Object.freeze({
    id:`${competitionId}-${slugify(name)}`,slug:slugify(name),name,
    strength:35+(h%8),
    geoNorthing:geoNorthing+(((h>>>8)%7)-3),
    geoEasting:geoEasting+(((h>>>12)%7)-3),
    preferredStepFiveDivisionIds:[...(STEP_SIX_TO_STEP_FIVE_PREFERENCES[competitionId]||[])],
    promotionEligible:!PROMOTION_INELIGIBLE_NAMES.has(name),
    promotionIneligibilityReason:PROMOTION_INELIGIBLE_NAMES.has(name)?'reserve-or-b-team-cannot-compete-above-step-six':null
  });}));
}

// 2026/27 Step 6 memberships verified against The FA NLS Steps 5/6 allocation published 14 May 2026.
// The FA has 17 Step 6 divisions. The two South West Peninsula divisions promote champions only;
// the other fifteen divisions promote a champion plus a play-off winner. Reserve/B teams cannot compete above Step 6.
export const STEP_SIX_2026_27_MEMBERSHIPS = Object.freeze({
  [CCL1_ID]: make(CCL1_ID, "Belstone|Berks County|Bovingdon|Brook House|Colliers Wood United|Edgware & Kingsbury|FC Deportivo Galicia|Holmer Green|Langley|London Samurai Rovers|Maidenhead Town|Molesey|Oxhey Jets|PFC Victoria|Rising Ballers Kensington|SL Benfica|Spartans Youth|Spelthorne Sports Club|Staines & Lammas (Middx)|Wembley|Westside|Woodley United", STEP_SIX_CENTRES[CCL1_ID]),
  [ECLN_ID]: make(ECLN_ID, "AFC Sudbury (Reserves)|Diss Town|Dussindale & Hellesdon Rovers|FC Clacton|FC Parson Drove|Framlingham Town|Gorleston (Reserves)|Hadleigh United|Halesworth Town|Haverhill Borough|Holbeach United|Holland|Long Melford|Needham Market (Reserves)|Netherton United|Newmarket Town Reserves|Norwich United|Stanway Pegasus|Whittlesey Athletic|Wroxham (Reserves)", STEP_SIX_CENTRES[ECLN_ID]),
  [ESLS_ID]: make(ESLS_ID, "AS London|Athletic Newham|Basildon Town|Brimsdown|Burnham Ramblers|Cannons Wood|Coggeshall Town|Dunmow Town|East Thurrock Community|Enfield Borough|FC Baresi|Hertford Heath|Hoddesdon Town|London Fennecs|London Harts United|Lymore Gardens|May & Baker EC|Newbury Forest|NW London|Rayleigh Town|Southend Manor|Stansted", STEP_SIX_CENTRES[ESLS_ID]),
  [HL1_ID]: make(HL1_ID, "Alcester Town|Bewdley Town|Brimscombe & Thrupp|Bromyard Town|Carterton|Cheltenham Saracens|Chipping Sodbury Town|Clanfield (85)|Ludlow Town|Lydney Town|Newent Town|Redditch Borough|Sharpness|Shortwood United|Stonehouse Town|Studley|Swindon Supermarine Res|Wantage Town", STEP_SIX_CENTRES[HL1_ID]),
  [ML1_ID]: make(ML1_ID, "AFC North Kilworth|Anstey Town|Birmingham O J M|Birstall United Social|Bustleholme|Chelmsley Town|Coalville Town|Coventry Copsewood|Cradley Town|FCV Grace Dieu|G.N.G Oadby Town|Gornal Athletic|Heather St. John's|Holwell Sports|Ingles|Kirby Muxloe|Leicester St Andrews|Lutterworth Athletic|Northfield Town|Saffron Dynamo|Smethwick Rangers|Stapenhill", STEP_SIX_CENTRES[ML1_ID]),
  [NWCN_ID]: make(NWCN_ID, "AFC Blackpool|AFC Knowsley|Ashton Athletic|Ashton Town|Ashville|Bacup Borough|Cammell Laird 1907|Colne|Daisy Hill|Darwen|Flixton|Fulwood Amateur|Garstang|Halewood Apollo|Holker Old Boys|Litherland Remyca|Maghull|MSB Woolton|Squires Gate|Steeton|Thornton Cleveleys|Uppermill", STEP_SIX_CENTRES[NWCN_ID]),
  [NWCS_ID]: make(NWCS_ID, "AFC Bridgnorth|Allscott Heath|Alsager Town|Barnton|Bilston Town|Brereton Social|Cheadle Heath Nomads|Crewe|Dawley Town|Eccleshall|Foley Meir|Market Drayton Town|New Mills|Sandbach United|Shawbury United|Stafford Town|Telford Town|Wednesfield Community|Widnes Town|Wolverhampton Casuals", STEP_SIX_CENTRES[NWCS_ID]),
  [NCE1_ID]: make(NCE1_ID, "Appleby Frodingham|Armthorpe Welfare|Athersley Recreation|Brigg Town FC CIC|Club Thorne Colliery|Crowle Colts|Doncaster City|Field Olympic|Goole|Harrogate Railway Athletic|Hemsworth Miners Welfare|Ilkley Town|Immingham Town|Kinsley Boys|LIV|Route One Rovers|Selby Town|South Leeds|UFCA|Wakefield|Winterton Rangers|Wombwell Town", STEP_SIX_CENTRES[NCE1_ID]),
  [NL2_ID]: make(NL2_ID, "AFC Newbiggin|Alnwick Town|Billingham Synthonia|Billingham Town|Boldon C.A.|Chester Le Street Town|Chester le Street United|Darlington Town|Durham United|Grangetown Boys Club|Hartlepool|Jarrow|Newcastle University|Prudhoe Youth Club|Ryton & Crawcrook Albion|Seaham Red Star|Seaton Carew|Stokesley Sports Club|Sunderland RCA (Sat)|Tow Law Town", STEP_SIX_CENTRES[NL2_ID]),
  [SWPW_ID]: make(SWPW_ID, "AFC St Austell|Bude Town|Callington Town|Camelford|Dobwalls|Falmouth Town (Reserves)|Hayle|Helston Athletic|Holsworthy|Launceston|Millbrook|Mousehole|Penzance|St Day|St Mawgan|Sticker|Wadebridge Town|Wendron United", STEP_SIX_CENTRES[SWPW_ID]),
  [SWPE_ID]: make(SWPE_ID, "Axminster Town|Bishops Lydeard|Bridport|Crediton United|Cullompton Rangers|Elburton Villa|Honiton Town|Ilfracombe Town|Ilminster Town|Middlezoy Rovers|Newton Abbot Spurs|Okehampton Argyle|Stoke Gabriel & Torbay Police|Teignmouth|Torridgeside|Torrington|University of Exeter", STEP_SIX_CENTRES[SWPE_ID]),
  [SC1_ID]: make(SC1_ID, "AFC Walcountians|Arundel|Clanfield|Dial Square|Dorking Wanderers ('B')|East Preston|Guildford City|Hailsham Town|Infinity|Jarvis Brook|Loxwood|Mile Oak|Oakwood|Reigate Priory|Ringmer|Saltdean United|Selsey|Shoreham|Westfield|Worthing United", STEP_SIX_CENTRES[SC1_ID]),
  [SCE1_ID]: make(SCE1_ID, "Banstead Athletic|Bridon Ropes|Croydon|FC Elmstead (1958)|Greenways|Halls|Hythe Town|Lewisham Borough Community|Lordswood|Lydd Town|Minster|Rochester United|Sheppey Sports|Sporting Club Thamesmead|Stansfeld|Staplehurst Monarchs United|Tooting Bec|Welling Town", STEP_SIX_CENTRES[SCE1_ID]),
  [SSM1_ID]: make(SSM1_ID, "Ampthill Town|Buckingham|Burton Park Wanderers|Cranfield United|Crawley Green|Eaton Socon|Huntingdon Town|Irchester United|Langford|Leighton Town Reserves|Letchworth Garden City Eagles|Long Buckby|New Bradwell St Peter|Rothwell Corinthians|Royston Town|Rushden & Higham United|Stotfold|Wellingborough Whitworth|Woodford United", STEP_SIX_CENTRES[SSM1_ID]),
  [UCL1_ID]: make(UCL1_ID, "Clifton All Whites|Clipstone|Cotgrave|Dronfield Town|Dunkirk|Gedling Miners Welfare|Harrowby United|Louth Town|Maltby Main|Pinchbeck United|Pinxton|Radford|Sandiacre Town|Selston|Shirebrook Town|Sleaford Town|South Normanton Athletic|Southwell City|Stapleford Town|Staveley Miners Welfare|Swallownest|West Bridgford Colts", STEP_SIX_CENTRES[UCL1_ID]),
  [WX1_ID]: make(WX1_ID, "AFC Aldermaston|Alresford Town|Ash United|Blandford United|Colden Common|Cove|Fawley|Folland Sports|Frimley Green|Hamworthy United|Hedge End Rangers|Kintbury Rangers|Lymington Town|New Milton Town|Newport (IOW)|Ringwood Town|Romsey Town|Sandhurst Town|Totton & Eling|Whitchurch United", STEP_SIX_CENTRES[WX1_ID]),
  [WL1_ID]: make(WL1_ID, "AEK Boco|Almondsbury|Amesbury Town|Avonmouth|Bitton|Bristol Telephones|Cadbury Heath|Calne Town|Keynsham Town|Longwell Green Sports|Mendip Broadwalk|Nailsea United|Odd Down (BATH)|Radstock Town|Shirehampton|Warminster Town|Wells City|Welton Rovers", STEP_SIX_CENTRES[WL1_ID]),
});
export const STEP_SIX_2026_27_TOTAL_CLUBS = Object.freeze(STEP_SIX_DIVISION_IDS.reduce((sum,id)=>sum+STEP_SIX_2026_27_MEMBERSHIPS[id].length,0));

function seededRandom(seed){let state=hashString(seed)||1;return()=>{state+=0x6D2B79F5;let v=state;v=Math.imul(v^(v>>>15),v|1);v^=v+Math.imul(v^(v>>>7),v|61);return((v^(v>>>14))>>>0)/4294967296;};}
function poisson(lambda,random){const limit=Math.exp(-lambda);let product=1,count=0;do{count++;product*=random();}while(product>limit&&count<10);return clamp(count-1,0,7);}
function validateMembership(clubs){
  if(!Array.isArray(clubs)||clubs.length<17||clubs.length>22)throw new Error('Step 6 simulation requires a 17-22 club division.');
  if(new Set(clubs.map(c=>c?.id)).size!==clubs.length)throw new Error('Step 6 club ids must be unique.');
  if(clubs.some(c=>!Number.isFinite(Number(c.strength))))throw new Error('Every Step 6 club requires numeric strength.');
}
function createFixtures(clubs){
  validateMembership(clubs);
  const ids=clubs.map(c=>c.id);
  const rotation=ids.length%2?[...ids,null]:[...ids];
  const first=[];let current=[...rotation];
  for(let r=0;r<current.length-1;r++){
    const round=[];
    for(let p=0;p<current.length/2;p++){
      const a=current[p],b=current[current.length-1-p];
      if(a!==null&&b!==null){
        const flip=p===0?r%2===1:p%2===1;
        round.push({homeClubId:flip?b:a,awayClubId:flip?a:b});
      }
    }
    first.push(round);
    current=[current[0],current.at(-1),...current.slice(1,-1)];
  }
  const ret=[...first.slice(1),first[0]];
  return [...first,...ret.map(round=>round.map(f=>({homeClubId:f.awayClubId,awayClubId:f.homeClubId})))]
    .map((round,ri)=>round.map((f,mi)=>({id:`s6-mw${ri+1}-m${mi+1}`,round:ri+1,...f,played:false,homeGoals:null,awayGoals:null})));
}
function blankTable(clubs){return clubs.map(c=>({clubId:c.id,played:0,won:0,drawn:0,lost:0,goalsFor:0,goalsAgainst:0,goalDifference:0,points:0}));}
function simulateFixture(f,clubMap,seed){
  const random=seededRandom(`${seed}:${f.id}`),home=clubMap.get(f.homeClubId),away=clubMap.get(f.awayClubId);
  const diff=clamp(((Number(home.strength)+1.8)-Number(away.strength))/15.5,-1.3,1.3);
  return{...f,played:true,homeGoals:poisson(clamp(1.38+diff,.28,3.0),random),awayGoals:poisson(clamp(1.00-diff,.22,2.6),random)};
}
function apply(table,r){
  const h=table.find(x=>x.clubId===r.homeClubId),a=table.find(x=>x.clubId===r.awayClubId);
  h.played++;a.played++;h.goalsFor+=r.homeGoals;h.goalsAgainst+=r.awayGoals;a.goalsFor+=r.awayGoals;a.goalsAgainst+=r.homeGoals;
  if(r.homeGoals>r.awayGoals){h.won++;h.points+=3;a.lost++;}else if(r.homeGoals<r.awayGoals){a.won++;a.points+=3;h.lost++;}else{h.drawn++;a.drawn++;h.points++;a.points++;}
  h.goalDifference=h.goalsFor-h.goalsAgainst;a.goalDifference=a.goalsFor-a.goalsAgainst;
}
function h2h(ids,fixtures){
  const set=new Set(ids),out=Object.fromEntries(ids.map(id=>[id,{points:0,gd:0,gf:0}]));
  for(const f of fixtures.flat()){if(!f.played||!set.has(f.homeClubId)||!set.has(f.awayClubId))continue;const h=out[f.homeClubId],a=out[f.awayClubId];h.gf+=f.homeGoals;a.gf+=f.awayGoals;h.gd+=f.homeGoals-f.awayGoals;a.gd+=f.awayGoals-f.homeGoals;if(f.homeGoals>f.awayGoals)h.points+=3;else if(f.homeGoals<f.awayGoals)a.points+=3;else{h.points++;a.points++;}}
  return out;
}
function consequences(start,end,clubCount,hasPlayoffs){
  const out=[];
  if(start<=1&&end>1)out.push('championship-and-automatic-promotion');
  if(hasPlayoffs&&start<=7&&end>7)out.push('playoff-eligibility');
  if(hasPlayoffs&&start<=5&&end>5)out.push('playoff-seeding');
  const liabilityStart=Math.max(1,clubCount-2);
  if(start<liabilityStart&&end>=liabilityStart)out.push('relegation-liability');
  return out;
}
export function rankStepSixTable(table,fixtures,{seed='step-six-ranking',hasPlayoffs=true}={}){
  const clubCount=table.length,sorted=[...table].sort((a,b)=>b.points-a.points||b.goalDifference-a.goalDifference||b.goalsFor-a.goalsFor||b.won-a.won),groups=[];
  for(const row of sorted){const g=groups.at(-1);if(g&&['points','goalDifference','goalsFor','won'].every(k=>Number(g[0][k])===Number(row[k])))g.push(row);else groups.push([row]);}
  const rows=[],unresolvedGroups=[],administrativeResolutions=[];
  for(const group of groups){
    if(group.length===1){rows.push({...clone(group[0]),position:rows.length+1});continue;}
    const records=h2h(group.map(r=>r.clubId),fixtures);
    let ranked=group.map(row=>({row,h:records[row.clubId]})).sort((a,b)=>b.h.points-a.h.points||b.h.gd-a.h.gd||b.h.gf-a.h.gf);
    let i=0;
    while(i<ranked.length){
      const first=ranked[i];let end=i+1;
      while(end<ranked.length&&ranked[end].h.points===first.h.points&&ranked[end].h.gd===first.h.gd&&ranked[end].h.gf===first.h.gf)end++;
      let tied=ranked.slice(i,end);const startPos=rows.length+1,endPos=startPos+tied.length-1,cons=tied.length>1?consequences(startPos,endPos,clubCount,hasPlayoffs):[],unresolved=tied.length>1&&cons.length>0;
      if(tied.length>1&&!unresolved){tied=tied.sort((a,b)=>hashString(`${seed}:${a.row.clubId}`)-hashString(`${seed}:${b.row.clubId}`));administrativeResolutions.push({clubIds:tied.map(x=>x.row.clubId),positions:[startPos,endPos],method:'simulated-administrative-lot'});}
      for(const item of tied)rows.push({...clone(item.row),position:rows.length+1,tiebreak:{headToHeadPoints:item.h.points,headToHeadGoalDifference:item.h.gd,headToHeadGoalsFor:item.h.gf,unresolved}});
      if(unresolved)unresolvedGroups.push({clubIds:tied.map(x=>x.row.clubId),positions:[startPos,endPos],consequences:cons,method:'deciding-league-match-required'});
      i=end;
    }
  }
  return{rows,unresolvedGroups,administrativeResolutions,decidingMatchRequired:unresolvedGroups.length>0};
}
function simulateKnockout(home,away,seed){
  const random=seededRandom(seed),diff=clamp(((Number(home.strength)+1.6)-Number(away.strength))/17,-1.1,1.1);
  let hg=poisson(clamp(1.31+diff,.24,2.8),random),ag=poisson(clamp(1.03-diff,.22,2.6),random),method='90-minutes',extraTime=null,penalties=null;
  if(hg===ag){const er=seededRandom(`${seed}:et`),eh=poisson(.3,er),ea=poisson(.27,er);extraTime={homeGoals:eh,awayGoals:ea};if(eh!==ea){hg+=eh;ag+=ea;method='extra-time';}else{const pr=seededRandom(`${seed}:pens`),homeWins=pr()<clamp(.5+(home.strength-away.strength)/300,.43,.57);penalties=homeWins?{home:5,away:4}:{home:4,away:5};method='penalties';return{homeClubId:home.id,awayClubId:away.id,homeGoals:hg,awayGoals:ag,extraTime,penalties,method,winnerClubId:homeWins?home.id:away.id};}}
  return{homeClubId:home.id,awayClubId:away.id,homeGoals:hg,awayGoals:ag,extraTime,penalties,method,winnerClubId:hg>ag?home.id:away.id};
}
function runPlayoffs(eligibleRows,clubMap,seed,season,competitionId){
  const candidates=eligibleRows.slice(1,5);
  if(candidates.length<3)return{status:'insufficient-eligible-clubs',clubIds:candidates.map(r=>r.clubId),winnerClubId:null,semiFinals:[],final:null};
  const byId=id=>clubMap.get(id),positions=new Map(eligibleRows.map(r=>[r.clubId,r.position]));
  if(candidates.length===3){
    const [bye,second,third]=candidates.map(r=>byId(r.clubId));
    const semi=simulateKnockout(second,third,`${seed}:${season}:${competitionId}:playoff-semi`);
    const finalist=byId(semi.winnerClubId),home=positions.get(bye.id)<positions.get(finalist.id)?bye:finalist,away=home.id===bye.id?finalist:bye;
    const final=simulateKnockout(home,away,`${seed}:${season}:${competitionId}:playoff-final`);
    return{status:'complete',clubIds:candidates.map(r=>r.clubId),winnerClubId:final.winnerClubId,semiFinals:[semi],byeClubId:bye.id,final:{...final,hostClubId:home.id,venueRule:'higher-ranked-finalist-home'}};
  }
  const [first,second,third,fourth]=candidates.slice(0,4).map(r=>byId(r.clubId));
  const semiA=simulateKnockout(first,fourth,`${seed}:${season}:${competitionId}:playoff-1v4`);
  const semiB=simulateKnockout(second,third,`${seed}:${season}:${competitionId}:playoff-2v3`);
  const fa=byId(semiA.winnerClubId),fb=byId(semiB.winnerClubId),home=positions.get(fa.id)<positions.get(fb.id)?fa:fb,away=home.id===fa.id?fb:fa;
  const final=simulateKnockout(home,away,`${seed}:${season}:${competitionId}:playoff-final`);
  return{status:'complete',clubIds:candidates.map(r=>r.clubId),winnerClubId:final.winnerClubId,semiFinals:[semiA,semiB],byeClubId:null,final:{...final,hostClubId:home.id,venueRule:'higher-ranked-finalist-home'}};
}

export function simulateStepSixDivisionSeason({competitionId,season='2026/27',clubs=STEP_SIX_2026_27_MEMBERSHIPS[competitionId],seed='football-lab-step-six',completedAt=null}={}){
  if(!STEP_SIX_DIVISION_IDS.includes(competitionId))throw new Error('Unsupported Step 6 division.');
  validateMembership(clubs);
  const hasPlayoffs=STEP_SIX_PLAYOFF_DIVISION_IDS.includes(competitionId),clubMap=new Map(clubs.map(c=>[c.id,c]));
  const fixtures=createFixtures(clubs).map((round,ri)=>round.map((f,mi)=>simulateFixture({...f,id:`${competitionId}-mw${ri+1}-m${mi+1}`},clubMap,`${seed}:${season}:${competitionId}`)));
  const table=blankTable(clubs);fixtures.flat().forEach(r=>apply(table,r));
  const ranking=rankStepSixTable(table,fixtures,{seed:`${seed}:${season}:${competitionId}:rank`,hasPlayoffs});
  const base={
    schemaVersion:NATIONAL_LEAGUE_STEP_SIX_WORLD_VERSION,key:`${competitionId}:${season}`,competitionId,competitionName:STEP_SIX_DIVISION_NAMES[competitionId],season,completedAt,
    membershipSource:season==='2026/27'?'2026/27 verified FA Step 6 allocation':'derived English pyramid membership',clubs:clubs.map(c=>clone(c)),clubCount:clubs.length,
    regularSeasonMatchesPerClub:(clubs.length-1)*2,regularSeasonMatches:fixtures.flat().length,rankingRules:[...STEP_SIX_RULES.ranking],finalTable:ranking.rows,
    rankingResolution:{decidingMatchRequired:ranking.decidingMatchRequired,unresolvedGroups:ranking.unresolvedGroups,administrativeResolutions:ranking.administrativeResolutions},
    promotionFormat:hasPlayoffs?'champion-plus-playoff-winner':'champion-only-south-west-peninsula',
    promotionIneligibleClubIds:clubs.filter(c=>c.promotionEligible===false).map(c=>c.id)
  };
  if(ranking.decidingMatchRequired)return{...base,status:'resolution-required',championClubId:ranking.rows[0]?.clubId||null,automaticPromotionClubId:null,promotedClubIds:[],playoffClubIds:[],playoffWinnerClubId:null,playoffs:null,relegatedClubIds:[],relegationCandidateClubIds:[],relegationLiableClubIds:[]};
  const championClubId=ranking.rows[0].clubId,eligibleRows=ranking.rows.filter(r=>r.position<=7&&clubMap.get(r.clubId)?.promotionEligible!==false),automaticRow=eligibleRows[0];
  if(!automaticRow)return{...base,status:'promotion-resolution-required',championClubId,automaticPromotionClubId:null,promotedClubIds:[],playoffClubIds:[],playoffWinnerClubId:null,playoffs:null,relegatedClubIds:[],relegationCandidateClubIds:ranking.rows.slice(-3).map(r=>r.clubId),relegationLiableClubIds:[]};
  const automaticPromotionClubId=automaticRow.clubId;
  let playoffs=null,promotedClubIds=[automaticPromotionClubId],playoffClubIds=[],playoffWinnerClubId=null;
  if(hasPlayoffs){
    playoffs=runPlayoffs(eligibleRows,clubMap,seed,season,competitionId);
    if(playoffs.status!=='complete'||!playoffs.winnerClubId)return{...base,status:'promotion-resolution-required',championClubId,automaticPromotionClubId,promotedClubIds:[],playoffClubIds:playoffs.clubIds||[],playoffWinnerClubId:null,playoffs,relegatedClubIds:[],relegationCandidateClubIds:ranking.rows.slice(-3).map(r=>r.clubId),relegationLiableClubIds:[]};
    playoffClubIds=[...(playoffs.clubIds||[])];playoffWinnerClubId=playoffs.winnerClubId;promotedClubIds.push(playoffWinnerClubId);
  }
  const relegationCandidateClubIds=ranking.rows.slice(-3).map(r=>r.clubId),under18=clubs.length<18;
  return{
    ...base,status:'complete',championClubId,automaticPromotionClubId,automaticPromotionWasChampion:automaticPromotionClubId===championClubId,
    promotedClubIds,playoffClubIds,playoffWinnerClubId,playoffs,
    relegatedClubIds:[],
    relegationCandidateClubIds,
    relegationLiableClubIds:under18?[]:[...relegationCandidateClubIds],
    relegationLiabilityStatus:under18?'committee-discretion-required-under-18-division':'liable-pending-feeder-league-and-vacancy-review',
    relegationRule:'Step 6 bottom three are liable, but final relegation numbers depend on feeder-league promotions, vacancies and FA Committee reprieves.'
  };
}

export function simulateAllStepSixDivisions({season='2026/27',seed='football-lab-step-six',memberships=STEP_SIX_2026_27_MEMBERSHIPS,completedAt=null}={}){
  return Object.fromEntries(STEP_SIX_DIVISION_IDS.map(id=>[id,simulateStepSixDivisionSeason({competitionId:id,season,clubs:memberships[id],seed,completedAt})]));
}
