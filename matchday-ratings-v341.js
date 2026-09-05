const HREF='./matchday-ratings-v341.css?v=3.4.1';
if(![...document.styleSheets].some(sheet=>sheet.href?.includes('matchday-ratings-v341.css'))){
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href=HREF;
  document.head.appendChild(link);
}
