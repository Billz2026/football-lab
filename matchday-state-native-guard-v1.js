export const MATCHDAY_STATE_NATIVE_GUARD_VERSION='1.0.0';

if(typeof window!=='undefined'&&!window.__flmNativeJSONstringify){
  window.__flmNativeJSONstringify=JSON.stringify;
}
