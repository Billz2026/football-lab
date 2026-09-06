const DEFAULT_LIGHT = '#F4F1E8';
const DEFAULT_DARK = '#101820';

const TEAM_KITS = Object.freeze({
  'afc bournemouth': { home:'#D71920', away:'#F4F1E8', third:'#18253A' },
  'arsenal': { home:'#D71920', away:'#F0DE58', third:'#182B49' },
  'aston villa': { home:'#7A263A', away:'#F4F1E8', third:'#203A5F' },
  'brentford': { home:'#D71920', away:'#D9E5C4', third:'#243746' },
  'brighton and hove albion': { home:'#0057B8', away:'#F3E51B', third:'#111827' },
  'chelsea': { home:'#034694', away:'#F4F1E8', third:'#202124' },
  'coventry city': { home:'#58A9DE', away:'#F4F1E8', third:'#19233F' },
  'crystal palace': { home:'#1B458F', away:'#F4F1E8', third:'#D9B52B' },
  'everton': { home:'#003399', away:'#E7A0B8', third:'#111827' },
  'fulham': { home:'#F4F1E8', away:'#D71920', third:'#202124' },
  'hull city': { home:'#F5A623', away:'#F4F1E8', third:'#1E293B' },
  'ipswich town': { home:'#0054A6', away:'#E5485D', third:'#F4F1E8' },
  'leeds united': { home:'#F4F1E8', away:'#1F3B73', third:'#D4BF45' },
  'liverpool': { home:'#C8102E', away:'#EDE2C4', third:'#173C36' },
  'manchester city': { home:'#6CABDD', away:'#181818', third:'#D2F04B' },
  'manchester united': { home:'#DA291C', away:'#1D2A57', third:'#F4F1E8' },
  'newcastle united': { home:'#F4F1E8', away:'#264A43', third:'#6B2334' },
  'nottingham forest': { home:'#DD0000', away:'#F4F1E8', third:'#244435' },
  'sunderland': { home:'#D71920', away:'#1E293B', third:'#E7D2A4' },
  'tottenham hotspur': { home:'#F4F1E8', away:'#1A2340', third:'#CFE65A' }
});

const ALIASES = Object.freeze({
  'bournemouth':'afc bournemouth',
  'brighton':'brighton and hove albion',
  'brighton hove albion':'brighton and hove albion',
  'coventry':'coventry city',
  'hull':'hull city',
  'ipswich':'ipswich town',
  'leeds':'leeds united',
  'man city':'manchester city',
  'man united':'manchester united',
  'newcastle':'newcastle united',
  'nottm forest':'nottingham forest',
  'spurs':'tottenham hotspur',
  'tottenham':'tottenham hotspur'
});

export function normaliseTeamName(value){
  const key=String(value||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim();
  if(ALIASES[key]) return ALIASES[key];
  if(TEAM_KITS[key]) return key;
  const direct=Object.keys(TEAM_KITS).find(name=>key.includes(name)||name.includes(key));
  return direct||key;
}

function hash(value){
  let result=2166136261;
  for(const char of String(value||'')){result^=char.charCodeAt(0);result=Math.imul(result,16777619);}
  return result>>>0;
}

function generatedKits(name){
  const seed=hash(normaliseTeamName(name));
  const hue=seed%360;
  const opposite=(hue+145+(seed%70))%360;
  return {
    home:`hsl(${hue} 68% 43%)`,
    away:`hsl(${opposite} 64% 78%)`,
    third:seed%2?DEFAULT_DARK:DEFAULT_LIGHT
  };
}

export function getTeamKits(name){
  return TEAM_KITS[normaliseTeamName(name)]||generatedKits(name);
}

function parseColour(value){
  const raw=String(value||'').trim();
  const hex=raw.match(/^#([0-9a-f]{6})$/i);
  if(hex){
    const n=parseInt(hex[1],16);
    return {r:(n>>16)&255,g:(n>>8)&255,b:n&255};
  }
  const hsl=raw.match(/^hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)$/i);
  if(!hsl) return {r:128,g:128,b:128};
  const h=((Number(hsl[1])%360)+360)%360/360;
  const s=Number(hsl[2])/100;
  const l=Number(hsl[3])/100;
  if(s===0){const v=Math.round(l*255);return{r:v,g:v,b:v};}
  const hue2rgb=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};
  const q=l<.5?l*(1+s):l+s-l*s;
  const p=2*l-q;
  return {r:Math.round(hue2rgb(p,q,h+1/3)*255),g:Math.round(hue2rgb(p,q,h)*255),b:Math.round(hue2rgb(p,q,h-1/3)*255)};
}

function rgbToHsl({r,g,b}){
  r/=255;g/=255;b/=255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b);let h=0,s=0;const l=(max+min)/2;
  if(max!==min){
    const d=max-min;s=l>.5?d/(2-max-min):d/(max+min);
    if(max===r)h=(g-b)/d+(g<b?6:0);else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;
    h*=60;
  }
  return {h,s,l};
}

function srgb(value){value/=255;return value<=.04045?value/12.92:((value+.055)/1.055)**2.4;}
export function relativeLuminance(colour){
  const {r,g,b}=parseColour(colour);
  return .2126*srgb(r)+.7152*srgb(g)+.0722*srgb(b);
}

export function inkFor(colour){
  const l=relativeLuminance(colour);
  const white=(1.05)/(l+.05);
  const dark=(l+.05)/.05;
  return white>=dark?'#FFFFFF':'#071018';
}

export function kitsClash(first,second){
  const a=parseColour(first),b=parseColour(second);
  const ah=rgbToHsl({...a}),bh=rgbToHsl({...b});
  const distance=Math.hypot(a.r-b.r,a.g-b.g,a.b-b.b);
  const lumA=relativeLuminance(first),lumB=relativeLuminance(second);
  const lumDiff=Math.abs(lumA-lumB);
  const hueDiff=Math.min(Math.abs(ah.h-bh.h),360-Math.abs(ah.h-bh.h));
  const bothChromatic=ah.s>.28&&bh.s>.28;
  if(distance<105&&lumDiff<.22) return true;
  if(bothChromatic&&hueDiff<32&&Math.abs(ah.l-bh.l)<.28) return true;
  if(lumA<.14&&lumB<.14&&distance<175) return true;
  if(lumA>.62&&lumB>.62&&distance<165) return true;
  return false;
}

function kit(type,primary){return {type,primary,ink:inkFor(primary)};}

export function resolveMatchKits(homeName,awayName){
  const homeKits=getTeamKits(homeName);
  const awayKits=getTeamKits(awayName);
  const home=kit('home',homeKits.home);
  const candidates=[['away',awayKits.away],['third',awayKits.third],['home',awayKits.home]];
  let selected=candidates.find(([,colour])=>!kitsClash(home.primary,colour));
  if(!selected){
    const fallback=relativeLuminance(home.primary)>.34?DEFAULT_DARK:DEFAULT_LIGHT;
    selected=['contrast',fallback];
  }
  let away=kit(selected[0],selected[1]);
  if(kitsClash(home.primary,away.primary)){
    const emergency=relativeLuminance(home.primary)>.34?DEFAULT_DARK:DEFAULT_LIGHT;
    away=kit('contrast',emergency);
  }
  return {home,away};
}

export const PREMIER_LEAGUE_KIT_TEAMS=Object.freeze(Object.keys(TEAM_KITS));