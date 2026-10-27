window.__tabRes=[];var RD=__RD__;
window.__frames=[{id:'D01',scene:'dash',n:1,role:'store',title:'store',text:'uji',hl:[],setup:async function(){
 var R=window.__tabRes,w=__sbW;window.addEventListener("error",function(e){R.push("JSERR "+e.message+" @"+(e.lineno||""))});
 try{var A=window.WOSGudang.api;__sbLogin('store','ST.UPG-03');await __sbNav('wms-outbound');await w(3000);
  Object.keys(RD).forEach(function(t){A.setData(t,RD[t])});
  var tabs=[].slice.call(document.querySelectorAll('#wms-outbound .filters button, #wms-outbound [data-ph] [data-p]'));
  for(var i=0;i<tabs.length;i++){var t=tabs[i];t.click();await w(1500);var b=document.querySelector('#wms-outbound');var chips=b.querySelectorAll('.kl button');R.push('klik '+t.textContent.trim()+' chips='+chips.length+' | '+b.innerText.replace(/\s+/g,' ').slice(160,420));
   if(chips.length){chips[0].click();await w(1500);var m=document.querySelector('#rc-n'),r=m&&m.getBoundingClientRect();R.push('  chip -> modal rc-n='+!!m+(r?' rect='+Math.round(r.left)+','+Math.round(r.top)+','+Math.round(r.width)+'x'+Math.round(r.height)+' vis='+(m.offsetParent!==null):'')+' | '+b.innerText.replace(/\s+/g,' ').slice(300,420))}}
 }catch(e){R.push('GALAT '+e.message)}}}];
