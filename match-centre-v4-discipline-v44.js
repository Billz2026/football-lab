const STYLE_HREF = './match-centre-v4-discipline-v44.css?v=4.4.1';
const liveState = new WeakMap();

const clean = value => String(value || '').replace(/\s+/g,' ').trim();
const POSITION_LABELS = Object.freeze({
  DMC:'DM', AMC:'AM', MC:'CM', DC:'CB', DL:'LB', DR:'RB', AML:'LW', AMR:'RW',
  WBL:'LWB', WBR:'RWB', SC:'ST', FC:'ST'
});
const REFEREES = ['Daniel Mercer','Oliver Grant','Nathan Cole','Lewis Hart','Adam Fletcher','Samuel Price','James Whitmore','Michael Rowe'];
const WEATHER = ['Clear, 18°C','Dry, 20°C','Light cloud, 16°C','Overcast, 17°C','Light rain, 14°C','Clear, 15°C'];

function ensureStyles(){
  if ([...document.styleSheets].some(sheet => sheet.href?.includes('match-centre-v4-discipline-v44.css'))) return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href=STYLE_HREF;
  document.head.appendChild(link);
}

function stateFor(live){
  let state=liveState.get(live);
  if (!state){
    state={ftLatched:false,ftResult:'',major:null,metadataKey:'',lastRenderedKey:''};
    liveState.set(live,state);
  }
  return state;
}

function clockOf(live){
  return clean(live.querySelector('[data-live-clock]')?.textContent || live.querySelector('[data-cm4-clock]')?.textContent);
}

function scoreOf(shell){
  const home=clean(shell.querySelector('[data-cm4-home-name]')?.textContent)||'Home';
  const away=clean(shell.querySelector('[data-cm4-away-name]')?.textContent)||'Away';
  const hs=clean(shell.querySelector('[data-cm4-home-score]')?.textContent)||'0';
  const as=clean(shell.querySelector('[data-cm4-away-score]')?.textContent)||'0';
  return {home,away,hs,as,text:`${home} ${hs}–${as} ${away}`};
}

function isFullTime(live){
  const clock=clockOf(live);
  return live.classList.contains('is-full-time') || clock==='90:00';
}

function isHalfTime(live){
  return !isFullTime(live) && live.classList.contains('is-half-time');
}

function hash(input){
  let value=2166136261;
  for (const char of String(input||'')){ value^=char.charCodeAt(0); value=Math.imul(value,16777619); }
  return value>>>0;
}

function contextKey(shell){
  const score=scoreOf(shell);
  return `${window.__flmLiveStateV332?.fixtureId||''}|${score.home}|${score.away}|${window.FLMManager?.activeCareer?.currentDate||''}`;
}

function syncMetadata(shell){
  const state=stateFor(shell.closest('.flm-live-match'));
  const key=contextKey(shell);
  if (state.metadataKey===key) return;
  state.metadataKey=key;
  const seeded=hash(key);
  const referee=REFEREES[seeded%REFEREES.length];
  const weather=WEATHER[(seeded>>>3)%WEATHER.length];
  const refNode=shell.querySelector('[data-cm4-referee]');
  const weatherNode=shell.querySelector('[data-cm4-weather]');
  if (refNode) refNode.textContent=`Referee — ${referee}`;
  if (weatherNode) weatherNode.textContent=`Weather — ${weather}`;
}

function syncCompetition(shell){
  const career=window.FLMManager?.activeCareer;
  const comp=shell.querySelector('[data-cm4-comp]');
  if (!comp || !career) return;
  if (career.preseason?.phase && career.preseason.phase!=='complete') comp.textContent='Pre-Season Friendly';
}

function normalizePosition(value){
  const raw=clean(value).toUpperCase();
  return POSITION_LABELS[raw] || raw;
}

function normalizePositionLabels(dialog){
  dialog.querySelectorAll('.v2-sub-player .pos').forEach(node=>{
    const value=normalizePosition(node.textContent);
    if (node.textContent!==value) node.textContent=value;
  });
}

function syncSubs(live){
  const dialog=live.querySelector('.flm-match-dialog.v2-sub-dialog');
  if (!dialog) return;
  dialog.dataset.cm44='1';
  normalizePositionLabels(dialog);
  const help=dialog.querySelector('[data-v2-bench-help]');
  if (help && !dialog.querySelector('[data-v2-out-list] .is-selected-out')) help.textContent='Select a player off · bench shown alongside your XI';
  const apply=dialog.querySelector('[data-apply-sub]');
  if (apply && apply.textContent!=='CONFIRM SUBSTITUTION') apply.textContent='CONFIRM SUBSTITUTION';
}

function eventType(line,text){
  const normal=clean(text).toLowerCase();
  if (!line) return 'neutral';
  if (line.classList.contains('goal') || /\bgoal\b|scores for|finds the net/.test(normal)) return 'goal';
  if (line.classList.contains('red') || /red card|sent off/.test(normal)) return 'red';
  if (line.classList.contains('yellow') || /yellow card|booked/.test(normal)) return 'yellow';
  if (line.classList.contains('injury') || /injur|treatment|cannot continue/.test(normal)) return 'injury';
  if (line.classList.contains('substitution') || /comes on|replaces|takes over at/.test(normal)) return 'substitution';
  if (line.classList.contains('save') || /\bsave\b|saved by|shoots|shot|effort|header|post|crossbar/.test(normal)) return 'chance';
  return 'normal';
}

function lowValue(line,text){
  if (!line) return true;
  if (line.classList.contains('role') || line.classList.contains('role-change') || line.classList.contains('shape-change') || line.classList.contains('tactical')) return true;
  const value=clean(text);
  return /\b(?:LCB|RCB|LCM|RCM|DMC|AMC|AML|AMR)\b|\b(?:role|tactical plan|attacking instruction|defensive instruction|holds the shape as|normal position|exactly as instructed)\b/i.test(value)
    && !/goal|shot|save|foul|corner|free kick|card|injur|replaces|comes on/i.test(value);
}

function positionWords(code){
  const map={LW:'left wing',RW:'right wing',ST:'striker',CF:'striker',CM:'midfield',DM:'defensive midfield',AM:'attacking midfield',LB:'left-back',RB:'right-back',CB:'centre-back'};
  return map[normalizePosition(code)] || 'position';
}

function cleanCommentary(input){
  let text=clean(input);
  if (!text) return '';
  const rules=[
    [/^(.+?) finds space from\s+[A-Z]{1,4},\s*linking the play in the .+? role\.?$/i,'$1 finds space in midfield.'],
    [/^(.+?) reads the danger from\s+[A-Z]{1,4}\s+and holds the shape as a [^.]+\.?$/i,'$1 reads the danger.'],
    [/^(.+?) keeps stretching the defence as a [^.]+\.?$/i,'$1 stretches the defence.'],
    [/^(.+?) keeps pushing beyond (?:his|her) normal position, trying to turn the attacking instruction into an overload\.?$/i,'$1 pushes forward to overload the attack.'],
    [/^(.+?) stops (.+?) with a foul\.?\s*Free kick\.?$/i,'$1 fouls $2. Free kick.'],
    [/^(.+?) have a corner and the defenders come forward\.?$/i,'$1 win a corner.'],
    [/^(.+?) takes a touch and looks up\.?$/i,'$1 looks up.'],
    [/^(.+?) gets the shot away\.\.\.$/i,'$1 shoots...'],
    [/^(.+?) lets fly from the edge of the area\.\.\.$/i,'$1 shoots from range...']
  ];
  for (const [pattern,replacement] of rules){
    if (pattern.test(text)){ text=text.replace(pattern,replacement); break; }
  }
  const takeover=text.match(/^(.+?) takes over at\s+([A-Z]{2,4})\s+as\s+[^.]+\.?$/i);
  if (takeover) text=`${takeover[1]} comes on at ${positionWords(takeover[2])}.`;
  text=text
    .replace(/\s+from\s+(?:LCB|RCB|LCM|RCM|CM|DMC|DM|AMC|AM|AML|AMR|LW|RW|ST|CF|LB|RB|CB|GK)(?=[,\s])/gi,'')
    .replace(/\s+(?:in|as|operating in) the [A-Za-z -]+ role\b/gi,'')
    .replace(/\s+as a (?:Central Defender|Ball Playing Defender|Inside Forward|Winger|Poacher|Target Forward|Complete Forward|Advanced Playmaker|Box-to-Box Midfielder|Central Midfielder|Defensive Midfielder|Attacking Midfielder|Full Back|Sweeper Keeper)\b/gi,'')
    .replace(/\s+exactly as instructed/gi,'')
    .replace(/\s+as part of the tactical plan/gi,'')
    .replace(/\s{2,}/g,' ')
    .replace(/\.\s*\./g,'.')
    .trim();
  if (text.length>112){
    const first=text.match(/^(.{20,112}?[.!?])(?:\s|$)/)?.[1];
    if (first) text=first;
    else {
      const slice=text.slice(0,109); const cut=slice.lastIndexOf(' ');
      text=`${slice.slice(0,cut>70?cut:109).replace(/[,:;.-]+$/,'')}...`;
    }
  }
  return text;
}

function linePayload(line,shell){
  if (!line) return null;
  const raw=clean(line.querySelector('span')?.textContent || line.textContent);
  const type=eventType(line,raw);
  const side=line.dataset.cmSide==='away'?'away':line.dataset.cmSide==='home'?'home':'neutral';
  const score=scoreOf(shell);
  const minute=clean(line.querySelector('b')?.textContent) || "—";
  let text=cleanCommentary(raw);
  if (type==='yellow') text='YELLOW CARD!';
  if (type==='red') text='RED CARD!';
  return {key:`${minute}|${type}|${raw}`,minute,type,side,text,team:side==='home'?score.home:side==='away'?score.away:'MATCH UPDATE'};
}

function choosePayload(live,shell){
  const lines=[...live.querySelectorAll('[data-commentary-feed] .flm-commentary-line')];
  if (!lines.length) return null;
  const latest=lines.at(-1);
  const latestRaw=clean(latest.querySelector('span')?.textContent || latest.textContent);
  const latestType=eventType(latest,latestRaw);
  if (['goal','red','yellow','injury','substitution','chance'].includes(latestType)) return linePayload(latest,shell);
  const recent=lines.slice(-10).reverse().find(line=>{
    const raw=clean(line.querySelector('span')?.textContent || line.textContent);
    return !lowValue(line,raw);
  });
  return linePayload(recent || latest,shell);
}

function renderPayload(live,shell,payload){
  if (!payload || !payload.text) return;
  const state=stateFor(live);
  const now=performance.now();
  if (['goal','red','yellow','injury'].includes(payload.type) && state.major?.key!==payload.key){
    state.major={...payload,until:now+(payload.type==='goal'?2300:payload.type==='red'?1900:1600)};
  }
  const shown=state.major && state.major.until>now ? state.major : payload;
  if (state.major && state.major.until<=now) state.major=null;
  const key=`${shown.key}|${shown.text}`;
  state.lastRenderedKey=key;
  const event=shell.querySelector('[data-cm4-event]');
  const textNode=shell.querySelector('[data-cm4-event-text]');
  if (!event || !textNode) return;
  const desiredClass=`cm4-event is-${shown.type} is-${shown.side}`;
  if (event.dataset.cm44Type!==shown.type) event.dataset.cm44Type=shown.type;
  if (event.className!==desiredClass) event.className=desiredClass;
  const minute=shell.querySelector('[data-cm4-event-minute]');
  const team=shell.querySelector('[data-cm4-event-team]');
  if (minute && minute.textContent!==shown.minute) minute.textContent=shown.minute;
  if (team && team.textContent!==shown.team) team.textContent=shown.team;
  if (textNode.dataset.cm44Text!==shown.text) textNode.dataset.cm44Text=shown.text;
  if (textNode.getAttribute('aria-label')!==shown.text) textNode.setAttribute('aria-label',shown.text);
}

function ensureContinueButton(shell){
  let button=shell.querySelector('[data-cm44-continue]');
  if (!button){
    button=document.createElement('button');
    button.type='button';
    button.dataset.cm44Continue='1';
    button.className='cm44-continue-main';
    button.textContent='CONTINUE';
    shell.querySelector('[data-cm4-stage]')?.appendChild(button);
  }
  return button;
}

function lockHalfTime(live,shell){
  live.dataset.cm44State='halftime';
  const score=scoreOf(shell);
  const result=`HALF TIME · ${score.text}`;
  const phase=shell.querySelector('[data-cm4-phase]');
  const half=shell.querySelector('[data-cm4-half]');
  const pause=shell.querySelector('[data-cm4-pause]');
  const minute=shell.querySelector('[data-cm4-minute]');
  const event=shell.querySelector('[data-cm4-event]');
  const text=shell.querySelector('[data-cm4-event-text]');
  if (phase && phase.textContent!=='Half Time') phase.textContent='Half Time';
  if (half && half.textContent!=='HALF TIME') half.textContent='HALF TIME';
  if (minute && minute.textContent!=="45'") minute.textContent="45'";
  if (pause){
    if (pause.textContent!=='Resume 2nd Half') pause.textContent='Resume 2nd Half';
    if (pause.getAttribute('aria-label')!=='Resume Second Half') pause.setAttribute('aria-label','Resume Second Half');
  }
  if (event){
    const desired='cm4-event is-neutral cm44-halftime-event';
    if (event.className!==desired) event.className=desired;
  }
  const eventMinute=event?.querySelector('[data-cm4-event-minute]');
  const eventTeam=event?.querySelector('[data-cm4-event-team]');
  if (eventMinute && eventMinute.textContent!=="45'") eventMinute.textContent="45'";
  if (eventTeam && eventTeam.textContent!=='HALF TIME') eventTeam.textContent='HALF TIME';
  if (text){
    if (text.dataset.cm44Text!==result) text.dataset.cm44Text=result;
    if (text.getAttribute('aria-label')!==result) text.setAttribute('aria-label',result);
  }
}

function lockFullTime(live,shell){
  const state=stateFor(live);
  if (!state.ftLatched){ state.ftLatched=true; state.ftResult=`FULL TIME · ${scoreOf(shell).text}`; }
  live.dataset.cm44State='fulltime';
  live.dataset.cm44FullTime='1';
  const result=state.ftResult;
  const phase=shell.querySelector('[data-cm4-phase]');
  const half=shell.querySelector('[data-cm4-half]');
  const pause=shell.querySelector('[data-cm4-pause]');
  const minute=shell.querySelector('[data-cm4-minute]');
  const event=shell.querySelector('[data-cm4-event]');
  const text=shell.querySelector('[data-cm4-event-text]');
  if (phase && phase.textContent!=='Full Time') phase.textContent='Full Time';
  if (half && half.textContent!=='FULL TIME') half.textContent='FULL TIME';
  if (minute && minute.textContent!=="90'") minute.textContent="90'";
  if (pause){
    if (pause.textContent!=='Continue') pause.textContent='Continue';
    pause.disabled=false;
    if (pause.getAttribute('aria-label')!=='Continue') pause.setAttribute('aria-label','Continue');
  }
  if (event){
    const desired='cm4-event is-neutral cm44-fulltime-event';
    if (event.className!==desired) event.className=desired;
  }
  const eventMinute=event?.querySelector('[data-cm4-event-minute]');
  const eventTeam=event?.querySelector('[data-cm4-event-team]');
  if (eventMinute && eventMinute.textContent!=="90'") eventMinute.textContent="90'";
  if (eventTeam && eventTeam.textContent!=='FULL TIME') eventTeam.textContent='FULL TIME';
  if (text){
    if (text.dataset.cm44Text!==result) text.dataset.cm44Text=result;
    if (text.getAttribute('aria-label')!==result) text.setAttribute('aria-label',result);
  }
  const goal=shell.querySelector('[data-cm4-goal]');
  if (goal && !goal.classList.contains('cm44-suppressed')) goal.classList.add('cm44-suppressed');
  ensureContinueButton(shell);
}

function syncLiveState(live,shell){
  if (isFullTime(live)){ lockFullTime(live,shell); return; }
  if (isHalfTime(live)){ lockHalfTime(live,shell); return; }
  if (live.dataset.cm44State!=='live') live.dataset.cm44State='live';
  const continueButton=shell.querySelector('[data-cm44-continue]');
  if (continueButton) continueButton.remove();
  renderPayload(live,shell,choosePayload(live,shell));
}

function enhance(live){
  if (!live?.isConnected || live.dataset.cm4!=='1') return;
  const shell=live.querySelector(':scope > .cm4-shell');
  if (!shell) return;
  shell.dataset.cm44='1';
  syncCompetition(shell);
  syncMetadata(shell);
  syncSubs(live);
  syncLiveState(live,shell);
}

function finishMatch(live){
  const finish=live.querySelector('[data-finish-live-match]');
  if (finish) finish.click();
}

ensureStyles();

document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-cm44-continue],[data-cm4-pause]');
  if (!button) return;
  const live=button.closest('.flm-live-match[data-cm4="1"]');
  if (!live || !isFullTime(live)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  finishMatch(live);
},true);

// V4.4 deliberately avoids a document-wide MutationObserver. The match engine owns
// simulation state; this small poll only makes the V4 presentation authoritative.
setInterval(()=>document.querySelectorAll('.flm-live-match[data-cm4="1"]').forEach(enhance),100);
