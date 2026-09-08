const VERSION='2.1.1';
const STYLE_HREF=`./player-profile.css?v=${VERSION}`;
const STYLE_ID='flm-profile-v21-addon';
let queued=false;
let dbPromise=null;
const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const CLUB_COLOURS=Object.freeze({arsenal:'#d62f3f','aston villa':'#8f2d56',bournemouth:'#d93645',brentford:'#d93645',brighton:'#4f9de8',chelsea:'#4267d5','crystal palace':'#4267d5',everton:'#365fb6',fulham:'#d7dbe5',ipswich:'#3f70db',leeds:'#f1df54',liverpool:'#d83f4f','manchester city':'#64b7d8','man city':'#64b7d8','manchester united':'#d8444c','man united':'#d8444c',newcastle:'#d8dde4','nottingham forest':'#d8424a',sunderland:'#d8424a',tottenham:'#cfd9ed',spurs:'#cfd9ed',wolves:'#d4a833','west ham':'#8f3852'});
function database(){if(!dbPromise&&window.FLMManager?.loadDatabase)dbPromise=Promise.resolve(window.FLMManager.loadDatabase()).catch(()=>null);return dbPromise||Promise.resolve(null);}
function ensureStyles(){
  const current=[...document.querySelectorAll('link[rel="stylesheet"]')].find(x=>x.href?.includes('player-profile.css')&&x.href?.includes(`v=${VERSION}`));
  if(!current){const old=[...document.querySelectorAll('link[rel="stylesheet"]')].find(x=>x.href?.includes('player-profile.css'));const link=document.createElement('link');link.rel='stylesheet';link.href=STYLE_HREF;link.dataset.flmProfileV2Style=VERSION;document.head.appendChild(link);if(old&&old!==link)link.addEventListener('load',()=>{old.disabled=true;},{once:true});}
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`
    .flm-attr-meter{height:8px!important}.v053-profile-summary[data-profile-v21-clean]{grid-template-columns:repeat(3,minmax(0,1fr))!important}.flm-profile-data-note{padding:8px 10px 11px;color:#75849a;font-size:8px;line-height:1.5}.flm-personality-v2-card{display:grid;grid-template-columns:minmax(180px,.9fr) minmax(0,2fr);gap:12px;margin-top:8px;border:1px solid var(--flm-profile-line);border-radius:8px;background:linear-gradient(135deg,rgba(31,18,50,.96),rgba(9,9,18,.98));overflow:hidden}.flm-personality-v2-head{padding:13px 14px;border-right:1px solid rgba(255,255,255,.07)}.flm-personality-v2-head small{display:block;color:#8fa0b5;font-size:7px;font-weight:950;letter-spacing:.14em}.flm-personality-v2-head strong{display:block;margin-top:6px;color:#f0d853;font-size:16px}.flm-personality-v2-head span{display:block;margin-top:7px;color:#9c94a4;font-size:9px;line-height:1.55}.flm-personality-v2-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:rgba(255,255,255,.05)}.flm-personality-v2-grid>div{padding:10px 12px;background:#0c0a14}.flm-personality-v2-grid small{display:block;color:#77899f;font-size:7px;font-weight:950;letter-spacing:.1em}.flm-personality-v2-grid strong{display:block;margin-top:5px;color:#e1dbe6;font-size:10px;line-height:1.35}.flm-personality-v2-grid .respect strong{color:#81dba1}.flm-info-row[hidden],.flm-profile-facts span[hidden]{display:none!important}@media(max-width:760px){.flm-personality-v2-card{grid-template-columns:1fr}.flm-personality-v2-head{border-right:0;border-bottom:1px solid rgba(255,255,255,.07)}.flm-personality-v2-grid{grid-template-columns:1fr 1fr}}@media(max-width:450px){.flm-personality-v2-grid{grid-template-columns:1fr}}
  `;document.head.appendChild(style);
}
function clubColour(name){const key=clean(name).toLowerCase();if(CLUB_COLOURS[key])return CLUB_COLOURS[key];const hit=Object.keys(CLUB_COLOURS).find(x=>key.includes(x)||x.includes(key));return hit?CLUB_COLOURS[hit]:'#5b6dba';}
function rowByLabel(root,wanted){return[...root.querySelectorAll('.flm-info-row')].find(row=>clean(row.querySelector('span')?.textContent).toLowerCase()===wanted.toLowerCase())||null;}
function statusValue(root,label,fallback='—'){return clean(rowByLabel(root,label)?.querySelector('strong')?.textContent)||fallback;}
function tier(v){return v>=18?'elite':v>=15?'excellent':v>=11?'good':v>=6?'average':'weak';}
function enhanceAttributes(profile){
  const scored=[];profile.querySelectorAll('.flm-attr-row').forEach(row=>{const valueNode=row.querySelector('.flm-attr-value');const value=Number(clean(valueNode?.textContent));if(!Number.isFinite(value))return;row.dataset.profileV2='1';row.dataset.attributeTier=tier(value);let meter=row.querySelector('.flm-attr-meter');if(!meter){meter=document.createElement('i');meter.className='flm-attr-meter';meter.setAttribute('aria-hidden','true');meter.innerHTML='<span></span>';valueNode?.before(meter);}meter.style.setProperty('--attribute-fill',`${Math.max(5,Math.min(100,value/20*100))}%`);row.setAttribute('aria-label',`${clean(row.querySelector(':scope > span')?.textContent)} ${value} out of 20`);scored.push({row,value});});
  profile.querySelectorAll('.flm-attr-row.is-top-attribute').forEach(row=>row.classList.remove('is-top-attribute'));scored.sort((a,b)=>b.value-a.value).slice(0,5).forEach(x=>x.row.classList.add('is-top-attribute'));
}
function ensureStatusStrip(profile){
  const tabs=profile.querySelector('.flm-profile-tabs'),panel=profile.querySelector('[data-profile-panel]');if(!tabs||!panel)return false;
  if(!rowByLabel(panel,'Condition')||!rowByLabel(panel,'Injuries')||!rowByLabel(panel,'Suspension'))return false;
  let strip=profile.querySelector('.flm-profile-status-strip');if(!strip){strip=document.createElement('section');strip.className='flm-profile-status-strip';tabs.before(strip);}
  const values=[['CONDITION',statusValue(panel,'Condition')],['SHARPNESS',statusValue(panel,'Match Sharpness')],['MORALE',statusValue(panel,'Morale')],['FORM',statusValue(panel,'Form')],['INJURY',statusValue(panel,'Injuries','None')],['SUSPENSION',statusValue(panel,'Suspension','None')]];
  const signature=values.map(x=>x.join(':')).join('|');if(strip.dataset.signature!==signature){strip.dataset.signature=signature;strip.innerHTML=values.map(([label,value])=>{const danger=/injur|suspend|red|ban/i.test(`${label} ${value}`)&&!/none|no|—/i.test(value);const positive=(label==='CONDITION'||label==='SHARPNESS')&&Number.parseFloat(value)>=85;return`<div class="flm-status-chip ${danger?'is-danger':positive?'is-positive':''}"><small>${label}</small><strong>${esc(value)}</strong></div>`;}).join('');}
  return true;
}
function removeDuplicateStatus(profile){
  const panel=profile.querySelector('[data-profile-panel]');if(!panel)return;
  const title=[...panel.querySelectorAll('.flm-card-title')].find(x=>clean(x.textContent).toUpperCase()==='CURRENT STATUS');if(!title)return;
  const list=title.nextElementSibling;if(list?.classList.contains('flm-info-list'))list.remove();title.remove();
}
function cleanMissingBio(profile){
  profile.querySelectorAll('.flm-profile-facts span').forEach(node=>{const text=clean(node.textContent);node.hidden=/—|unknown/i.test(text);});
  const personal=[...profile.querySelectorAll('.flm-card-title')].find(x=>clean(x.textContent).toUpperCase()==='PERSONAL');const list=personal?.nextElementSibling;if(!list?.classList.contains('flm-info-list'))return;
  let hidden=0;list.querySelectorAll('.flm-info-row').forEach(row=>{const value=clean(row.querySelector('strong')?.textContent);const missing=!value||value==='—'||/unknown|not loaded/i.test(value);row.hidden=missing;if(missing)hidden+=1;});
  let note=list.parentElement?.querySelector('.flm-profile-data-note');if(hidden&&!note){note=document.createElement('div');note.className='flm-profile-data-note';note.textContent='Some biographical details are not available in the current data source.';list.after(note);}else if(!hidden&&note)note.remove();
}
function removeDuplicateValue(profile){
  const summary=profile.querySelector('.v053-profile-summary');if(!summary)return;const live=[...summary.children].find(card=>clean(card.querySelector('small')?.textContent).toUpperCase()==='LIVE VALUE');if(live)live.remove();summary.dataset.profileV21Clean='1';
}
function enhanceIdentity(profile){
  const sub=clean(profile.querySelector('.flm-profile-sub')?.textContent);const club=sub.split('·')[0]?.trim()||'';const colour=clubColour(club);profile.style.setProperty('--flm-profile-club',colour);const modal=profile.closest('.modal');modal?.classList.add('flm-profile-v2-open');modal?.style.setProperty('--flm-profile-club',colour);
  rowByLabel(profile,'Personality')?.classList.add('is-personality-row');rowByLabel(profile,'Squad Status')?.classList.add('is-squad-row');const actions=profile.querySelector('.flm-profile-actions');if(actions&&!actions.querySelector('[data-profile-v2-role]')){const node=document.createElement('div');node.className='flm-profile-value flm-profile-role';node.dataset.profileV2Role='1';node.innerHTML=`<small>SQUAD ROLE</small><strong>${esc(statusValue(profile,'Squad Status','Not set'))}</strong>`;actions.insertBefore(node,actions.querySelector('button')||null);}
}
function managerRespectLabel(value){const n=Number(value);if(!Number.isFinite(n))return'Not established';if(n>=80)return'Fully convinced';if(n>=65)return'Respects the manager';if(n>=50)return'Generally supportive';if(n>=35)return'Needs convincing';return'Sceptical';}
async function enhancePersonality(profile){
  const api=window.FLMPlayerPersonalityV2;if(!api)return;const db=await database();if(!db||!profile.isConnected)return;
  const name=clean(profile.querySelector('.flm-profile-name h3')?.textContent);const clubName=clean(profile.querySelector('.flm-profile-sub')?.textContent).split('·')[0]?.trim();let candidates=db.players.filter(p=>p.name===name);if(candidates.length>1){const club=db.clubs.find(c=>c.name===clubName||c.shortName===clubName);if(club)candidates=candidates.filter(p=>p.clubId===club.id);}const player=candidates[0];if(!player)return;
  profile.dataset.playerId=player.id;const personality=api.get(player.id);if(!personality)return;
  const headerPersonality=[...profile.querySelectorAll('.flm-profile-value')].find(x=>clean(x.querySelector('small')?.textContent).toUpperCase()==='PERSONALITY')?.querySelector('strong');if(headerPersonality)headerPersonality.textContent=personality.label;const row=rowByLabel(profile,'Personality');if(row?.querySelector('strong'))row.querySelector('strong').textContent=personality.label;
  const relation=window.FLMManager?.activeCareer?.playerRelationships?.[player.id];const d=personality.descriptors||{};let card=profile.querySelector('[data-personality-v2-card]');if(!card){card=document.createElement('section');card.className='flm-personality-v2-card';card.dataset.personalityV2Card='1';const grid=profile.querySelector('.flm-profile-grid');grid?.after(card);}if(!card)return;
  const signature=[personality.label,d.professionalism,d.temperament,d.ambition,d.teamStyle,d.resilience,relation?.managerRespect].join('|');if(card.dataset.signature===signature)return;card.dataset.signature=signature;
  card.innerHTML=`<div class="flm-personality-v2-head"><small>PLAYER CHARACTER</small><strong>${esc(personality.label)}</strong><span>Visible behaviour is derived from a persistent hidden nine-trait profile. The underlying numbers remain hidden.</span></div><div class="flm-personality-v2-grid"><div><small>PROFESSIONALISM</small><strong>${esc(d.professionalism||'—')}</strong></div><div><small>TEMPERAMENT</small><strong>${esc(d.temperament||'—')}</strong></div><div><small>AMBITION</small><strong>${esc(d.ambition||'—')}</strong></div><div><small>TEAM STYLE</small><strong>${esc(d.teamStyle||'—')}</strong></div><div><small>RESILIENCE</small><strong>${esc(d.resilience||'—')}</strong></div><div class="respect"><small>MANAGER RELATIONSHIP</small><strong>${esc(managerRespectLabel(relation?.managerRespect))}</strong></div></div>`;
}
function enhanceProfile(profile){if(!profile?.isConnected)return;profile.dataset.profileVersion=VERSION;enhanceIdentity(profile);enhanceAttributes(profile);const hasStatus=ensureStatusStrip(profile);if(hasStatus)removeDuplicateStatus(profile);cleanMissingBio(profile);removeDuplicateValue(profile);enhancePersonality(profile).catch(()=>{});}
function clearModalState(){if(document.querySelector('.flm-profile'))return;document.querySelectorAll('.modal.flm-profile-v2-open').forEach(x=>{x.classList.remove('flm-profile-v2-open');x.style.removeProperty('--flm-profile-club');});}
function sync(){queued=false;ensureStyles();document.querySelectorAll('.flm-profile').forEach(enhanceProfile);clearModalState();}
function queue(){if(queued)return;queued=true;requestAnimationFrame(sync);}
ensureStyles();new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,characterData:true});window.addEventListener('flm:personality-v2',queue);queue();window.FLMPlayerProfileV2=Object.freeze({version:VERSION,refresh:queue});
