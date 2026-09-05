for(const [file,version] of [['matchday-ratings-v341.css','3.4.1'],['matchday-mode-v342-fix.css','3.4.2']]){
  if([...document.styleSheets].some(sheet=>sheet.href?.includes(file))) continue;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href=`./${file}?v=${version}`;
  document.head.appendChild(link);
}
