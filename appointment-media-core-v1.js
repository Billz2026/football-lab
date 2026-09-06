export const APPOINTMENT_SCHEMA_VERSION = 1;

export const MEDIA_STYLES = Object.freeze({
  confident: { id:'confident', label:'Confident', authority:3, diplomacy:0, motivation:1, mediaHandling:1, playerProtection:0 },
  humble: { id:'humble', label:'Humble', authority:-1, diplomacy:3, motivation:0, mediaHandling:2, playerProtection:1 },
  demanding: { id:'demanding', label:'Demanding', authority:3, diplomacy:-1, motivation:2, mediaHandling:0, playerProtection:-1 },
  protective: { id:'protective', label:'Protective', authority:0, diplomacy:1, motivation:1, mediaHandling:1, playerProtection:3 },
  defiant: { id:'defiant', label:'Defiant', authority:2, diplomacy:-1, motivation:3, mediaHandling:-1, playerProtection:0 }
});

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const trait=(profile,key,fallback=10)=>Number(profile?.traits?.[key])||fallback;

export function initialFanSentiment(managerReputation=50,clubReputation=6000){
  const rep=clamp(Number(managerReputation)||50,0,100);
  const club=clamp(Number(clubReputation)||6000,2000,10000);
  const expectationPenalty=Math.max(0,(club-6000)/650);
  return clamp(Math.round(50+(rep-50)*0.58-expectationPenalty),18,90);
}

export function fanSentimentLabel(score){
  const value=Number(score)||0;
  if(value>=78)return'Excited';
  if(value>=64)return'Positive';
  if(value>=50)return'Cautiously optimistic';
  if(value>=36)return'Divided';
  return'Sceptical';
}

export function fanReactionCopy(score,managerName='The new manager',clubName='the club'){
  const label=fanSentimentLabel(score);
  if(label==='Excited')return`${clubName} supporters have reacted enthusiastically to ${managerName}'s appointment. Expectations are already high.`;
  if(label==='Positive')return`The early response from ${clubName} supporters is positive. Most believe ${managerName} has earned the chance to lead the club.`;
  if(label==='Cautiously optimistic')return`${clubName} supporters are willing to give ${managerName} a chance, although a strong start will be important.`;
  if(label==='Divided')return`The appointment has split opinion among ${clubName} supporters. Some see potential; others want proof quickly.`;
  return`${clubName} supporters are openly sceptical about ${managerName}'s appointment. Early results and strong leadership will be vital.`;
}

export function fanSquadAdjustment(profile,fanSentiment=50,managerReputation=50,player={}){
  const mood=(Number(fanSentiment)-50)/12;
  const team=trait(profile,'teamOrientation');
  const ambition=trait(profile,'ambition');
  const resilience=trait(profile,'resilience');
  const professionalism=trait(profile,'professionalism');
  const ability=Number(player?.currentAbility)||120;
  let sensitivity=.55+(team/20)*.32+((20-resilience)/20)*.18;
  if(ambition>=16&&ability>=145)sensitivity+=.18;
  let delta=Math.round(mood*sensitivity);
  if(Number(managerReputation)<40&&ambition>=16)delta-=1;
  if(professionalism>=16)delta=delta<0?Math.min(0,delta+1):delta;
  return clamp(delta,-5,5);
}

const QUESTION_FAN = Object.freeze({
  credentials:{confident:2,humble:3,demanding:0,protective:1,defiant:1},
  expectations:{confident:2,humble:-1,demanding:3,protective:0,defiant:1},
  dressingRoom:{confident:1,humble:1,demanding:-1,protective:3,defiant:0}
});

export function mediaFanImpact(questionId,styleId,managerReputation=50,currentFanSentiment=50){
  let delta=Number(QUESTION_FAN[questionId]?.[styleId] ?? 0);
  const rep=Number(managerReputation)||50;
  if(questionId==='credentials'&&styleId==='confident'&&rep<45)delta-=4;
  if(questionId==='credentials'&&styleId==='humble'&&rep>=75)delta-=1;
  if(styleId==='defiant'&&currentFanSentiment<40)delta+=1;
  return clamp(delta,-4,4);
}

export function mediaPlayerImpact(questionId,styleId,profile,managerReputation=50,player={}){
  const ambition=trait(profile,'ambition');
  const professionalism=trait(profile,'professionalism');
  const determination=trait(profile,'determination');
  const temperament=trait(profile,'temperament');
  const team=trait(profile,'teamOrientation');
  const resilience=trait(profile,'resilience');
  const ability=Number(player?.currentAbility)||120;
  let delta=0;
  if(styleId==='confident'){
    delta+=(determination>=14||ambition>=15)?1:0;
    if(Number(managerReputation)<45&&ability>=145)delta-=2;
  }else if(styleId==='humble'){
    delta+=professionalism>=14?1:0;
    delta+=temperament>=14?1:0;
    if(ambition>=17&&questionId==='expectations')delta-=1;
  }else if(styleId==='demanding'){
    delta+=determination>=15?2:0;
    delta+=professionalism>=15?1:0;
    if(temperament<=7||resilience<=7)delta-=2;
  }else if(styleId==='protective'){
    delta+=team>=14?2:0;
    delta+=temperament<=9?1:0;
    if(ambition>=17&&questionId==='expectations')delta-=1;
  }else if(styleId==='defiant'){
    delta+=determination>=15?2:0;
    delta+=ambition>=15?1:0;
    if(professionalism>=17&&temperament>=15)delta-=1;
  }
  if(questionId==='dressingRoom'&&styleId==='protective')delta+=1;
  return clamp(delta,-3,3);
}

export function applyCommunicationStyle(profile={},styleId){
  const style=MEDIA_STYLES[styleId];if(!style)return profile;
  const next={
    authority:Number(profile.authority)||50,
    diplomacy:Number(profile.diplomacy)||50,
    motivation:Number(profile.motivation)||50,
    mediaHandling:Number(profile.mediaHandling)||50,
    playerProtection:Number(profile.playerProtection)||50
  };
  for(const key of ['authority','diplomacy','motivation','mediaHandling','playerProtection'])next[key]=clamp(next[key]+Number(style[key]||0),10,90);
  return next;
}

export function dominantCommunicationStyle(profile={}){
  const labels={authority:'Authoritative',diplomacy:'Diplomatic',motivation:'Motivational',mediaHandling:'Media-savvy',playerProtection:'Player-first'};
  const entries=Object.entries(profile).filter(([key,value])=>key in labels&&Number.isFinite(Number(value))).sort((a,b)=>Number(b[1])-Number(a[1]));
  if(!entries.length)return'Balanced communicator';
  if(entries.length>1&&Number(entries[0][1])-Number(entries[1][1])<=1)return'Balanced communicator';
  return labels[entries[0][0]];
}

export const FIRST_PRESS_QUESTIONS = Object.freeze([
  {
    id:'credentials',
    prompt:({clubName,experienceLabel})=>`Some supporters question whether your background as a ${String(experienceLabel||'manager').toLowerCase()} is enough for a club like ${clubName}. What do you say?`,
    responses:{
      confident:'I know exactly what this club needs. I am ready for this job.',
      humble:'I understand the doubts. I will earn trust through my work and results.',
      demanding:'Reputation means nothing now. Standards, discipline and results are what matter.',
      protective:'This should be about the team. My job is to give the players everything they need.',
      defiant:'People are entitled to doubt me. We will prove them wrong together.'
    }
  },
  {
    id:'expectations',
    prompt:({clubName})=>`What should ${clubName} supporters expect from your first season?`,
    responses:{
      confident:'We should aim high. I believe this squad can achieve something significant.',
      humble:'We will improve step by step and let our football establish what is possible.',
      demanding:'This club must compete. I will demand the highest standards every day.',
      protective:'My priority is creating the environment for these players to perform consistently.',
      defiant:'We will not be intimidated by anyone. The target is to make people take notice.'
    }
  },
  {
    id:'dressingRoom',
    prompt:()=>`How will you handle senior players who are not immediately convinced by your appointment?`,
    responses:{
      confident:'They will see quickly that I can improve this team and help them win.',
      humble:'Respect goes both ways. I will listen first and earn their confidence.',
      demanding:'Nobody is bigger than the standards of the club. Everyone has to meet them.',
      protective:'I will back my players publicly and deal with difficult conversations privately.',
      defiant:'If anyone doubts me, that is fine. My decisions will be judged by results.'
    }
  }
]);
