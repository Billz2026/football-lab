const VERSION='2.0.0';
const STYLE_HREF=`./player-profile.css?v=${VERSION}`;
let queued=false;
const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
const CLUB_COLOURS=Object.freeze({arsenal:'#d62f3f','aston villa':'#8f2d56',bournemouth:'#d93645',brentford:'#d93645',brighton:'#4f9de8',chelsea:'#4267d5','crystal palace':'#4267d5',everton:'#365fb6',fulham:'#d7dbe5',ipswich:'#3f70db',leeds:'#f1df54',liverpool:'#d83f4f','manchester city':'#64b7d8','man city':'#64b7d8','manchester united':'#d8444c','man united':'#d8444c',newcastle:'#d8dde4','nottingham forest':'#d8424a',sunderland:'#d8424a',tottenham:'#cfd9ed',spurs:'#cfd9ed',wolves:'#d4a833','west ham':'#8f3852'});
function ensureStyles(){
  const current=[...document.querySelectorAll('link[rel="stylesheet"]')].find(x=>x.href?.includes('player-profile.css')&&x.href?.includes(`v=${VERSION}`));
  if(current)return;
  const old=[...document.querySelectorAll('link[rel="stylesheet"]')].find(x=>x.href?.includes('player-profile.css'));
  const link=document.createElement('link');link.rel='stylesheet';link.href=STYLE_HREF;link.dataset.flmProfileV2Style=VERSION;document.head.appendChild(link);
  if(old&&old!==link)link.addEventListener('load',()=>{old.disabled=true;},{once:true});
}
function clubColour(name){const key=clean(name).toLowerCase();if(CLUB_COLOURS[key])return CLUB_COLOURS[key];const hit=Object.keys(CLUB_COLOURS).find(x=>key.includes(x)||x.includes(key));return hit?CLUB_COLOURS[hit]:'#5b6dba';}
function rowByLabel(root,wanted){return[...root.querySelectorAll('.flm-info-row')].find(row=>clean(row.querySelector('span')?.textContent).toLowerCase()===wanted.toLowerCase())||null;}
function statusValue(root,label,fallback='—'){return clean(rowByLabel(root,label)?.querySelector('strong')?.textContent)||fallback;}
function tier(v){return v>=18?'elite':v>=15?'excellent':v>=11?'good':v>=6?'average':'weak';}
function enhanceAttributes(profile){
  const scored=[];
  profile.querySelectorAll('.flm-attr-row').forEach(row=>{
    const valueNode=row.querySelector('.flm-attr-value');const value=Number(clean(valueNode?.textContent));if(!Number.isFinite(value))return;
    row.dataset.profileV2='1';row.dataset.attributeTier=tier(value);
    let meter=row.querySelector('.flm-attr-meter');
    if(!meter){meter=document.createElement('i');meter.className='flm-attr-meter';meter.setAttribute('aria-hidden','true');meter.innerHTML='<span></span>';valueNode?.before(meter);}
    meter.style.setProperty('--attribute-fill',`${Math.max(5,Math.min(100,value/20*100))}%`);
    row.setAttribute('aria-label',`${clean(row.querySelector(':scope > span')?.textContent)} ${value} out of 20`);scored.push({row,value});
  });
  profile.querySelectorAll('.flm-attr-row.is-top-attribute').forEach(row=>row.classList.remove('is-top-attribute'));
  scored.sort((a,b)=>b.value-a.value).slice(0,5).forEach(x=>x.row.classList.add('is-top-attribute'));
}
function ensureStatusStrip(profile){
  const head=profile.querySelector('.flm-profile-head'),tabs=profile.querySelector('.flm-profile-tabs'),panel=profile.querySelector('[data-profile-panel]');if(!head||!tabs||!panel)return;
  let strip=profile.querySelector('.flm-profile-status-strip');if(!strip){strip=document.createElement('section');strip.className='flm-profile-status-strip';tabs.before(strip);}
  const values=[['CONDITION',statusValue(panel,'Condition')],['SHARPNESS',statusValue(panel,'Match Sharpness')],['MORALE',statusValue(panel,'Morale')],['FORM',statusValue(panel,'Form')],['INJURY',statusValue(panel,'Injuries','None')],['SUSPENSION',statusValue(panel,'Suspension','None')]];
  const signature=values.map(x=>x.join(':')).join('|');if(strip.dataset.signature===signature)return;strip.dataset.signature=signature;
  strip.innerHTML=values.map(([label,value])=>{const danger=/injur|suspend|red|ban/i.test(`${label} ${value}`)&&!/none|no|—/i.test(value);const positive=(label==='CONDITION'||label==='SHARPNESS')&&Number.parseFloat(value)>=85;return`<div class="flm-status-chip ${danger?'is-danger':positive?'is-positive':''}"><small>${label}</small><strong>${value}</strong></div>`;}).join('');
}
function enhanceIdentity(profile){
  const sub=clean(profile.querySelector('.flm-profile-sub')?.textContent);const club=sub.split('·')[0]?.trim()||'';profile.style.setProperty('--flm-profile-club',clubColour(club));
  profile.closest('.modal')?.classList.add('flm-profile-v2-open');
  rowByLabel(profile,'Personality')?.classList.add('is-personality-row');rowByLabel(profile,'Squad Status')?.classList.add('is-squad-row');
  const actions=profile.querySelector('.flm-profile-actions');
  if(actions&&!actions.querySelector('[data-profile-v2-role]')){const node=document.createElement('div');node.className='flm-profile-value flm-profile-role';node.dataset.profileV2Role='1';node.innerHTML=`<small>SQUAD ROLE</small><strong>${statusValue(profile,'Squad Status','Not set')}</strong>`;actions.insertBefore(node,actions.querySelector('button')||null);}
}
function enhanceProfile(profile){if(!profile?.isConnected)return;profile.dataset.profileVersion=VERSION;enhanceIdentity(profile);enhanceAttributes(profile);ensureStatusStrip(profile);}
function clearModalState(){if(document.querySelector('.flm-profile'))return;document.querySelectorAll('.modal.flm-profile-v2-open').forEach(x=>x.classList.remove('flm-profile-v2-open'));}
function sync(){queued=false;ensureStyles();document.querySelectorAll('.flm-profile').forEach(enhanceProfile);clearModalState();}
function queue(){if(queued)return;queued=true;requestAnimationFrame(sync);}
ensureStyles();new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,characterData:true});queue();window.FLMPlayerProfileV2=Object.freeze({version:VERSION,refresh:queue});
