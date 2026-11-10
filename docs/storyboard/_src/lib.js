/* Pustaka pembuat frame: menjalankan langkah (setup), lalu menambah sorotan, nomor langkah, dan keterangan di atas layar aplikasi. */
(function(){
 var w=function(ms){return new Promise(function(r){setTimeout(r,ms)})};
 window.__sbW=w;
 window.__sbLogin=function(level,code){var lg=document.getElementById('wos-login');if(lg)lg.style.display='none';document.documentElement.classList.remove('wos-locked');sessionStorage.setItem('wos-session-v1',level);sessionStorage.setItem('wos-session-code',code)};
 window.__sbNav=async function(page,tab){var n=document.querySelector('.nav[data-page="'+page+'"]');if(!n)throw new Error('nav '+page);document.querySelectorAll('.nav').forEach(function(x){x.classList.remove('wos-hide')});n.click();await w(900);
  if(tab){var b=[].slice.call(document.querySelectorAll('#'+page+' button')).find(function(x){return x.textContent.trim()===tab});if(b){b.click();await w(700)}}};
 window.__sbClick=async function(sel,txt,ms){var els=[].slice.call(document.querySelectorAll(sel));var e=txt?els.find(function(x){return x.textContent.trim().indexOf(txt)>=0}):els[0];if(e){e.click();await w(ms||600)}return !!e};
 window.__sbSet=function(sel,v){var e=document.querySelector(sel);if(!e)return false;e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true};
 window.__sbClear=function(){var o=document.getElementById('sb-ov');if(o)o.remove()};
 window.__sbDraw=function(f){
  window.__sbClear();var ov=document.createElement('div');ov.id='sb-ov';
  ov.style.cssText='position:fixed;inset:0;z-index:2147483000;pointer-events:none;font-family:Inter,Arial,sans-serif';
  var css='<style>#sb-ov .top{position:absolute;left:0;right:0;top:0;height:46px;background:linear-gradient(90deg,#1c3b57,#b8522b);color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 22px;font-size:15px;font-weight:700;letter-spacing:.02em;box-shadow:0 2px 12px rgba(0,0,0,.35)}#sb-ov .top small{font-weight:500;opacity:.85;font-size:13px}#sb-ov .cap{position:absolute;left:24px;right:24px;bottom:22px;background:rgba(20,34,48,.94);color:#fff;border-radius:16px;padding:16px 22px;display:flex;gap:18px;align-items:flex-start;box-shadow:0 10px 30px rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.12)}#sb-ov .num{flex:none;width:46px;height:46px;border-radius:50%;background:#ff9f43;color:#1b2733;font-weight:800;font-size:22px;display:flex;align-items:center;justify-content:center}#sb-ov .cap h3{margin:0 0 4px;font-size:21px;line-height:1.25}#sb-ov .cap p{margin:0;font-size:16px;line-height:1.45;opacity:.94}#sb-ov .role{flex:none;align-self:center;background:#ffffff1f;border-radius:999px;padding:6px 14px;font-size:13px;font-weight:700;white-space:nowrap}#sb-ov .hl{position:absolute;border:3px solid #ff9f43;border-radius:10px;box-shadow:0 0 0 4px rgba(255,159,67,.28),0 0 22px rgba(255,159,67,.55)}#sb-ov .bd{position:absolute;width:30px;height:30px;border-radius:50%;background:#ff9f43;color:#1b2733;font-weight:800;font-size:16px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.4);border:2px solid #fff}</style>';
  var h=css+'<div class="top"><span>W.O.S · Panduan Penggunaan</span><small>'+f.scene+'</small></div>';
  var els=(f.hl||[]).map(function(s){var sel=typeof s==='string'?s:s.sel,txt=typeof s==='string'?null:s.txt;var list=[].slice.call(document.querySelectorAll(sel));return txt?list.find(function(x){return x.textContent.trim().indexOf(txt)>=0}):list[0]});
  var first=els.find(function(e){return e});if(first){first.scrollIntoView({block:'center'});window.scrollBy(0,0)}
  els.forEach(function(e,i){if(!e)return;var r=e.getBoundingClientRect();if(r.width<2||r.height<2)return;var pad=6;
   h+='<div class="hl" style="left:'+(r.left-pad)+'px;top:'+(r.top-pad)+'px;width:'+(r.width+pad*2)+'px;height:'+(r.height+pad*2)+'px"></div><div class="bd" style="left:'+(r.left-pad-12)+'px;top:'+(r.top-pad-14)+'px">'+(i+1)+'</div>'});
  h+='<div class="cap"><div class="num">'+f.n+'</div><div style="flex:1"><h3>'+f.title+'</h3><p>'+f.text+'</p></div><div class="role">'+f.role+'</div></div>';
  ov.innerHTML=h;document.body.appendChild(ov)};
 window.__sbRun=async function(i){var f=window.__frames[i];window.__sbClear();window.scrollTo(0,0);
  try{if(f.setup)await f.setup()}catch(e){window.__sbErr=(window.__sbErr||'')+'frame '+f.id+': '+e.message+'\n'}
  await w(f.wait||700);window.__sbDraw(f);return f.id};
})();
