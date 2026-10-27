window.__tabRes=[];var RD=__RD__;
window.__frames=[{id:'D01',scene:'dash',n:1,role:'supervisor',title:'pa',text:'uji',hl:[],setup:async function(){
 var R=window.__tabRes,w=__sbW;window.addEventListener("error",function(e){R.push("JSERR "+e.message+" @"+(e.lineno||""))});
 try{var A=window.WOSGudang.api;__sbLogin('supervisor','W999');await __sbNav('wms-inbound');await w(3000);
  Object.keys(RD).forEach(function(t){A.setData(t,RD[t])});
  var gr=[].slice.call(document.querySelectorAll('#wms-inbound .filters button, #wms-inbound [data-p]')).filter(function(b){return /Good Receipt/.test(b.textContent)});
  if(gr[0])gr[0].click();await w(1200);
  var pa=[].slice.call(document.querySelectorAll('#wms-inbound [data-p]')).filter(function(b){return /Put Away/.test(b.textContent)});R.push('tab put away='+pa.length);
  if(pa[0])pa[0].click();await w(1500);
  var chip=document.querySelector('#wms-inbound [data-gopen]');R.push('chip='+!!chip);if(!chip)return;chip.click();await w(1200);
  var ins=[].slice.call(document.querySelectorAll('#wms-inbound [data-pb]'));R.push('input='+ins.length);
  var binIn=ins.filter(function(i){return /\|bin$/.test(i.dataset.pb)}),qtyIn=ins.filter(function(i){return /\|qty$/.test(i.dataset.pb)});
  function setv(el,v){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}
  setv(binIn[0],'A1.1');await w(500);
  var btn=document.querySelector('#wms-inbound [data-psave]');R.push('tombol sebagian='+!!btn);btn.click();await w(2500);
  R.push('pesan: '+(document.querySelector('#wms-inbound .note')||{textContent:''}).textContent.slice(0,160));
  R.push("chip: "+(document.querySelector("#wms-inbound [data-gopen]")||{textContent:""}).textContent);R.push('PUTAWAY tersimpan='+A.view('PUTAWAY').filter(function(p){return p.po===RD.GR_ASSIGN[0].po}).length);
  chip=document.querySelector('#wms-inbound [data-gopen]');chip.click();await w(1200);
  var b2=[].slice.call(document.querySelectorAll('#wms-inbound [data-pb]')).filter(function(i){return /\|bin$/.test(i.dataset.pb)}).map(function(i){return i.value});R.push('buka lagi, bin terisi: '+b2.join(','));
 var bi=[].slice.call(document.querySelectorAll("#wms-inbound [data-pb]")).filter(function(i){return /\|bin$/.test(i.dataset.pb)});R.push("bins="+bi.length);setv(bi[1],"A1.2");await w(400);document.querySelector("#wms-inbound [data-psave]").click();await w(2500);var ga=A.view("GR_ASSIGN").find(function(x){return x.po===RD.GR_ASSIGN[0].po});R.push("setelah selesai status="+(ga?ga.status:"(tak ada)")+" n="+A.view("GR_ASSIGN").length+" PUTAWAY="+A.view("PUTAWAY").filter(function(p){return p.po===RD.GR_ASSIGN[0].po}).length+" msg="+(document.querySelector("#wms-inbound .note")||{textContent:""}).textContent.slice(0,120));
 }catch(e){R.push("GALAT "+e.message)}}}];
