export const MATCHDAY_STATE_NATIVE_RESTORE_VERSION='1.0.0';

if(typeof window!=='undefined'&&window.__flmNativeJSONstringify){
  JSON.stringify=window.__flmNativeJSONstringify;
  window.__flmV332StateObserverRetired='direct-engine-publisher';
}
