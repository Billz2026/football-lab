export const BOARD_EXPECTATIONS_VERSION = 67;

const TIERS = Object.freeze({
  title: {
    id: 'title',
    primary: 'Challenge for the Premier League title',
    minimum: 'Finish in the top four',
    stretch: 'Win the Premier League',
    targetPosition: 2,
    minimumPosition: 4,
    stretchPosition: 1
  },
  championsLeague: {
    id: 'champions-league',
    primary: 'Finish in the top four and qualify for the UEFA Champions League',
    minimum: 'Finish in the top six',
    stretch: 'Mount a Premier League title challenge',
    targetPosition: 4,
    minimumPosition: 6,
    stretchPosition: 2
  },
  europe: {
    id: 'europe',
    primary: 'Challenge for European qualification',
    minimum: 'Finish in the top half',
    stretch: 'Finish in the top five',
    targetPosition: 7,
    minimumPosition: 10,
    stretchPosition: 5
  },
  midtable: {
    id: 'midtable',
    primary: 'Secure a comfortable mid-table finish',
    minimum: 'Stay clear of the relegation battle',
    stretch: 'Finish in the top half',
    targetPosition: 11,
    minimumPosition: 14,
    stretchPosition: 9
  },
  survival: {
    id: 'survival',
    primary: 'Avoid relegation',
    minimum: 'Finish 17th or higher',
    stretch: 'Secure a comfortable lower-mid-table finish',
    targetPosition: 17,
    minimumPosition: 17,
    stretchPosition: 13
  },
  promotion: {
    id: 'promotion',
    primary: 'Challenge for promotion',
    minimum: 'Reach the play-offs',
    stretch: 'Win automatic promotion',
    targetPosition: 4,
    minimumPosition: 6,
    stretchPosition: 2
  }
});

const CLUB_TIER = new Map([
  ['arsenal','title'],['liverpool','title'],['manchester city','title'],['man city','title'],
  ['manchester united','championsLeague'],['man united','championsLeague'],['chelsea','championsLeague'],['newcastle united','championsLeague'],['newcastle','championsLeague'],['tottenham hotspur','championsLeague'],['tottenham','championsLeague'],['spurs','championsLeague'],
  ['aston villa','europe'],['brighton & hove albion','europe'],['brighton','europe'],['crystal palace','europe'],['nottingham forest','europe'],['afc bournemouth','europe'],['bournemouth','europe'],
  ['brentford','midtable'],['everton','midtable'],['fulham','midtable'],['west ham united','midtable'],['west ham','midtable'],
  ['wolverhampton wanderers','survival'],['wolves','survival'],['sunderland','survival'],['leeds united','survival'],['leeds','survival'],['burnley','survival'],['ipswich town','survival'],['ipswich','survival'],['coventry city','survival'],['coventry','survival'],['hull city','survival'],['hull','survival'],['southampton','survival'],['leicester city','survival'],['leicester','survival'],['sheffield united','survival']
]);

const clean = value => String(value || '').trim().toLowerCase().replace(/\s+/g,' ');

export function boardTierForClub(club = {}) {
  const names = [club.name, club.shortName, club.providerName].map(clean).filter(Boolean);
  for (const name of names) {
    if (CLUB_TIER.has(name)) return CLUB_TIER.get(name);
    for (const [key,tier] of CLUB_TIER) if (name.includes(key) || key.includes(name)) return tier;
  }
  const league = clean(club.leagueId);
  if (league.includes('championship')) return 'promotion';
  if (league.includes('premier')) return 'midtable';
  return 'midtable';
}

export function getBoardExpectation(club = {}) {
  const tier = boardTierForClub(club);
  return { ...TIERS[tier], tier, schemaVersion: BOARD_EXPECTATIONS_VERSION };
}

export function mergeBoardExpectation(existing = {}, club = {}) {
  const realistic = getBoardExpectation(club);
  return {
    ...existing,
    ...realistic,
    transferBudget: Number(existing.transferBudget) || 0,
    wageRoom: Number(existing.wageRoom) || 0,
    confidence: Number.isFinite(Number(existing.confidence)) ? Number(existing.confidence) : 50
  };
}

function formatMoney(value){
  try{return new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(Number(value)||0);}catch{return `£${Math.round(Number(value)||0).toLocaleString('en-GB')}`;}
}

if (typeof window !== 'undefined') {
  const SAVE_KEY='flm-career-save';
  const managed=new WeakSet();
  let dbPromise=null;
  const database=()=>dbPromise||=(Promise.resolve(window.FLMManager?.loadDatabase?.()).catch(()=>null));
  const persist=career=>{try{career.updatedAt=new Date().toISOString();localStorage.setItem(SAVE_KEY,JSON.stringify(career));}catch{}};
  const patchNews=(career,expectation)=>{
    const board=career.news?.items?.find(item=>item.key==='board-expectation');
    if(!board)return;
    board.title='Board expectations and transfer budget';
    board.body=`Season objective: ${expectation.primary}. Minimum acceptable: ${expectation.minimum}. Stretch target: ${expectation.stretch}. Transfer budget: ${formatMoney(expectation.transferBudget)}. Available wage room: ${formatMoney(expectation.wageRoom)} per week. These budgets are enforced by the transfer system.`;
    board.priority='important';
  };
  const install=(career,club)=>{
    if(managed.has(career))return false;
    let stored=mergeBoardExpectation(career.boardExpectations||{},club);
    Object.defineProperty(career,'boardExpectations',{
      configurable:true,enumerable:true,
      get(){return stored;},
      set(value){stored=mergeBoardExpectation(value||{},club);}
    });
    managed.add(career);career.boardExpectations=stored;return true;
  };
  const sync=async()=>{
    const career=window.FLMManager?.activeCareer;if(!career)return;const db=await database();if(!db)return;
    const club=db.clubs?.find(item=>item.id===career.clubId);if(!club)return;
    const installed=install(career,club);career.boardExpectations=career.boardExpectations||{};
    patchNews(career,career.boardExpectations);if(installed)persist(career);
  };
  let queued=false;const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync().catch(()=>{});});};
  new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-career-tab']});
  setInterval(queue,800);queue();
  window.FLMBoardExpectationsV067=Object.freeze({version:BOARD_EXPECTATIONS_VERSION,getBoardExpectation,boardTierForClub,refresh:queue});
}
