export const STRUCTURED_COMMENTARY_SNAPSHOT_VERSION='2.0.0';

function cloneAttack(attack){
  if(!attack||typeof attack!=='object')return null;
  return {
    ...attack,
    scoreBefore:attack.scoreBefore?{...attack.scoreBefore}:null,
    scoreAfter:attack.scoreAfter?{...attack.scoreAfter}:null,
    contextTags:[...(attack.contextTags||[])],
    beats:(attack.beats||[]).map(beat=>({...beat}))
  };
}

function structuredEvents(value){
  return (value?.events||[]).map(event=>({
    minute:event.minute,
    type:event.type,
    clubId:event.clubId,
    playerId:event.playerId,
    assistPlayerId:event.assistPlayerId,
    sequenceId:event.sequenceId,
    phase:event.phase,
    action:event.action,
    subtype:event.subtype,
    outcome:event.outcome,
    finishType:event.finishType,
    xg:event.xg,
    text:event.text,
    lines:Array.isArray(event.lines)?[...event.lines]:undefined,
    attack:cloneAttack(event.attack)
  }));
}

function isLiveMatchState(value){
  return Boolean(value&&typeof value==='object'
    &&typeof value.minute==='number'
    &&typeof value.fixtureId==='string'
    &&Array.isArray(value.homeLineupIds)
    &&Array.isArray(value.awayLineupIds)
    &&value.stats&&Array.isArray(value.events));
}

function snapshotKey(value){
  const events=value.events||[];
  const last=events[events.length-1];
  return [
    value.fixtureId,
    events.length,
    value.structuredAttackSerial||0,
    last?.sequenceId||'',
    last?.minute||0,
    last?.type||''
  ].join('|');
}

export function installStructuredCommentarySnapshot(){
  if(typeof window==='undefined'||window.__flmStructuredCommentarySnapshotInstalled)return;
  window.__flmStructuredCommentarySnapshotInstalled=STRUCTURED_COMMENTARY_SNAPSHOT_VERSION;
  const prior=JSON.stringify;
  let lastKey='';
  JSON.stringify=function(value,...rest){
    const live=isLiveMatchState(value);
    const key=live?snapshotKey(value):'';
    let events=null;
    if(live&&key!==lastKey){
      try{events=structuredEvents(value);}catch(_){events=null;}
    }
    const result=Reflect.apply(prior,this,[value,...rest]);
    if(live&&events){
      try{
        const base=window.__flmLiveStateV332||{};
        window.__flmLiveStateV332={
          ...base,
          fixtureId:value.fixtureId,
          minute:value.minute,
          homeClubId:value.homeClubId,
          awayClubId:value.awayClubId,
          homeGoals:value.homeGoals,
          awayGoals:value.awayGoals,
          events,
          structuredCommentarySnapshotVersion:STRUCTURED_COMMENTARY_SNAPSHOT_VERSION
        };
        lastKey=key;
      }catch(_){}
    }
    return result;
  };
}

if(typeof window!=='undefined')installStructuredCommentarySnapshot();
