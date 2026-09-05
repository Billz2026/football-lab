const STYLE_HREF = './match-centre-v4-fold-v41.css?v=4.1.0';
let queued = false;

const clean = value => String(value || '').replace(/\s+/g,' ').trim();

function ensureStyles(){
  if ([...document.styleSheets].some(sheet => sheet.href?.includes('match-centre-v4-fold-v41.css'))) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_HREF;
  document.head.appendChild(link);
}

function simplifyCommentary(raw){
  let text = clean(raw);
  if (!text) return '';

  text = text.replace(/^(.+?) finds space from\s+[A-Z]{1,4},\s*linking the play in the .+? role\.?$/i, '$1 finds space in midfield.');
  text = text.replace(/^(.+?) stops (.+?) with a foul\.?\s*Free kick\.?$/i, '$1 fouls $2. Free kick.');
  text = text.replace(/,\s*linking the play in the [^.]+ role\.?/i, '.');
  text = text.replace(/\s+in the (?:Central Midfielder|Defensive Midfielder|Attacking Midfielder|Advanced Playmaker|Box-to-Box Midfielder|Inside Forward|Winger|Full Back|Centre Back|Ball Playing Defender|Sweeper Keeper|Poacher|Target Forward|Complete Forward) role\.?/gi, '.');
  text = text.replace(/\s+operating in the [^.]+ role\.?/gi, '.');
  text = text.replace(/\s+as the [^.]+ role\.?/gi, '.');
  text = text.replace(/\s+from\s+(?:LCM|RCM|CM|DM|AM|AMC|AML|AMR|LW|RW|ST|CF|LB|RB|CB|GK)(?=[,\s])/gi, '');
  text = text.replace(/\s{2,}/g,' ').replace(/\.\s*\./g,'.').trim();

  if (text.length > 125) {
    const first = text.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
    if (first && first.length >= 28 && first.length <= 125) text = first;
  }
  return text;
}

function teamCode(name){
  const words = clean(name).toUpperCase().replace(/[^A-Z0-9 ]/g,'').split(/\s+/).filter(Boolean);
  if (!words.length) return 'TEAM';
  if (words.length >= 2 && words[0].length <= 3) return `${words[0]}${words[1][0] || ''}`.slice(0,3);
  return words[0].slice(0,3);
}

function parseColour(value){
  const text = clean(value);
  if (/^#[0-9a-f]{3}$/i.test(text)) return text.slice(1).split('').map(ch => parseInt(ch + ch,16));
  if (/^#[0-9a-f]{6}$/i.test(text)) return [1,3,5].map(index => parseInt(text.slice(index,index+2),16));
  const rgb = text.match(/rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)/i);
  return rgb ? rgb.slice(1,4).map(Number) : null;
}

function coloursClash(live){
  const style = getComputedStyle(live);
  const home = parseColour(style.getPropertyValue('--home-color'));
  const away = parseColour(style.getPropertyValue('--away-color'));
  if (!home || !away) return false;
  const distance = Math.sqrt(home.reduce((sum,value,index) => sum + ((value - away[index]) ** 2),0));
  return distance < 105;
}

function syncEvent(shell){
  const event = shell.querySelector('[data-cm4-event]');
  const textNode = event?.querySelector('[data-cm4-event-text]');
  if (!event || !textNode) return;

  let text = clean(textNode.textContent);
  if (event.classList.contains('is-yellow')) text = 'YELLOW CARD!';
  else if (event.classList.contains('is-red')) text = 'RED CARD!';
  else text = simplifyCommentary(text);

  if (text && textNode.dataset.cm41Text !== text) textNode.dataset.cm41Text = text;
}

function syncPressure(live,shell){
  const copy = shell.querySelector('[data-cm4-pressure-copy]');
  const homeName = clean(shell.querySelector('[data-cm4-home-name]')?.textContent) || 'Home';
  const awayName = clean(shell.querySelector('[data-cm4-away-name]')?.textContent) || 'Away';
  const source = clean(copy?.textContent);
  const values = source.match(/(\d+)%\D+(\d+)%/);
  const home = Number(values?.[1] || 50);
  const away = Number(values?.[2] || Math.max(0,100-home));
  const label = `${teamCode(homeName)} ${home}% — ${away}% ${teamCode(awayName)}`;
  if (copy && copy.dataset.cm41Copy !== label) copy.dataset.cm41Copy = label;
  shell.dataset.cm41PressureClash = coloursClash(live) ? '1' : '0';
}

function enhance(live){
  const shell = live?.querySelector(':scope > .cm4-shell');
  if (!shell) return;
  shell.dataset.cm41 = '1';
  syncEvent(shell);
  syncPressure(live,shell);
}

function queue(){
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    document.querySelectorAll('.flm-live-match[data-cm4="1"]').forEach(enhance);
  });
}

ensureStyles();
queue();
new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
