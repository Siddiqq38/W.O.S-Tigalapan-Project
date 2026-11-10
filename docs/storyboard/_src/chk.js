window.__tabRes=[];
window.__frames=[{id:'K01',scene:'uji',n:1,role:'-',title:'uji',text:'uji',hl:[],setup:async function(){
 var R=window.__tabRes,w=__sbW;
 try{
  __sbLogin('admin','W09');await __sbNav('wms-outbound','Picking');await w(1500);
  var sel=document.querySelector('[data-obrepick]');
  R.push('select ganti picker koli ada: '+!!sel+' | jumlah: '+document.querySelectorAll('[data-obrepick]').length);
  var picking=[].slice.call(document.querySelectorAll('[data-obrepick]')).map(function(s){return s.dataset.obrepick});
  R.push('koli bisa diganti: '+picking.map(function(x){return x.split('|').pop()}).join(','));
  var k1=document.querySelector('[data-obrepick$="|K1"]');
  if(k1){k1.value='W17';k1.dispatchEvent(new Event('change',{bubbles:true}));await w(2500);
   var koli=window.__db.PICK_KOLI.find(function(r){return /\|K1$/.test(r.id)&&/UPG-01/.test(r.id)});
   var menunggu=window.__db.PICK_ITEM.filter(function(r){return /UPG-01/.test(r.dok)&&r.koli==='1'});
   R.push('K1 sekarang picker='+koli.picker+' ('+koli.picker_nama+') status='+koli.status);
   R.push('item K1: '+menunggu.map(function(r){return r.status+'/'+r.picker}).join(', '));
   var tasks=JSON.parse(localStorage.getItem('wos-tasks-v1')||'[]').filter(function(t){return t.kind==='picking'});
   R.push('task picking: '+tasks.map(function(t){return t.to+':'+t.status+':'+t.title.slice(-8)}).join(' | '));
  }
  // akun picker baru melihat tugasnya
  __sbLogin('operator','W17');await __sbNav('tugas');await w(1500);
  R.push('Task W17 memuat koli 1: '+/koli 1/i.test(document.getElementById('tugas').innerText));
  // GR: petunjuk lanjut di HP
  __sbLogin('operator','W19');await __sbNav('wms-inbound','Good Receipt');await w(1500);
  var g=document.querySelector('#wms-inbound [data-gopen]');if(g){g.click();await w(1500)}
  var t=document.getElementById('wms-inbound').innerText;
  R.push('GR hint: '+/akun yang sama di HP/.test(t)+' | tombol muat ulang: '+!!document.querySelector('#wms-inbound [data-gsync]'));
  // peta foto presensi dibaca ulang
  var pm={};pm['W14-'+window.__T+'-Attendance_in']='ABC123';localStorage.setItem('wos-att-photo-v1',JSON.stringify(pm));
 }catch(e){R.push('GALAT '+e.message)}
}}];
