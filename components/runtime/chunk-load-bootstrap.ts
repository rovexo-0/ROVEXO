/**
 * Early (pre-React) one-shot recovery for stale `/_next` chunk hashes.
 * Injected as an inline <script> so recovery still runs when the React
 * client bundle / ChunkLoadRecovery chunk itself fails to load.
 *
 * MUST stay synchronized with:
 * - components/runtime/ChunkLoadRecovery.tsx
 * - lib/runtime/chunk-load-recovery-guard-v1.ts
 */
export const CHUNK_LOAD_BOOTSTRAP_SCRIPT = `(function(){
  var PARAM="rx_chunk";
  var KEY="rovexo_chunk_load_recovery_v1";
  var LOCK="__rovexoChunkRecoveryLock";
  var COOLDOWN=120000;
  function text(r){
    if(!r)return "";
    if(typeof r==="string")return r;
    if(r&&typeof r==="object")return String(r.name||"")+" "+String(r.message||"")+" "+String(r.stack||"");
    return String(r);
  }
  function isChunk(msg){
    return /ChunkLoadError|Loading chunk [\\d]+ failed|Failed to load chunk/i.test(text(msg));
  }
  function isHmr(msg){
    var t=text(msg);
    return /hmr-client|\\[turbopack\\]_browser_dev|turbopack.*hmr|\\/_next\\/static\\/chunks\\/%5Bturbopack%5D_browser_dev/i.test(t);
  }
  function isDevHost(h){
    return h==="localhost"||h==="127.0.0.1"||h==="[::1]"||/\\.local$/i.test(h)||/^192\\.168\\./.test(h)||/^10\\./.test(h)||/^172\\.(1[6-9]|2\\d|3[0-1])\\./.test(h);
  }
  function shouldRecover(msg){
    if(!isChunk(msg))return false;
    if(isDevHost(location.hostname)&&isHmr(msg))return false;
    return true;
  }
  function inCooldown(){
    try{
      var v=sessionStorage.getItem(KEY);
      if(!v)return false;
      if(v==="1")return true;
      var ts=Number(v);
      if(!isFinite(ts))return true;
      return (Date.now()-ts)<COOLDOWN;
    }catch(e){return false;}
  }
  function recovered(){
    try{if(new URL(location.href).searchParams.get(PARAM)==="1")return true;}catch(e){}
    return inCooldown();
  }
  function clearCaches(done){
    var pending=1;
    function tick(){pending-=1;if(pending<=0)done();}
    try{
      if("serviceWorker" in navigator){
        pending+=1;
        navigator.serviceWorker.getRegistrations().then(function(regs){
          return Promise.all(regs.map(function(r){return r.unregister();}));
        }).catch(function(){}).then(tick);
      }
    }catch(e){}
    try{
      if("caches" in window){
        pending+=1;
        caches.keys().then(function(keys){
          return Promise.all(keys.map(function(k){return caches.delete(k);}));
        }).catch(function(){}).then(tick);
      }
    }catch(e){}
    tick();
  }
  function reloadOnce(msg){
    if(!shouldRecover(msg))return;
    if(window[LOCK])return;
    if(recovered())return;
    window[LOCK]=true;
    try{sessionStorage.setItem(KEY,String(Date.now()));}catch(e){}
    clearCaches(function(){
      try{
        var url=new URL(location.href);
        if(url.searchParams.get(PARAM)==="1")return;
        url.searchParams.set(PARAM,"1");
        location.replace(url.toString());
      }catch(e){
        if(!/([?&])rx_chunk=1(?:&|$)/.test(location.search)){
          location.replace(location.href+(location.search?"&":"?")+PARAM+"=1");
        }
      }
    });
  }
  window.addEventListener("error",function(ev){
    var msg=(ev&&ev.error)||(ev&&ev.message);
    reloadOnce(msg);
  });
  window.addEventListener("unhandledrejection",function(ev){
    reloadOnce(ev&&ev.reason);
  });
})();`;
