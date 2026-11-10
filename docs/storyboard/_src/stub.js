/* Data contoh untuk membuat gambar storyboard. Tidak menyentuh data asli: semua permintaan ke Google diganti data lokal di bawah ini. */
window.__posts=[];
window.__db={EVALUASI:[],ATTENDANCE:[],PENGAJUAN:[],TASK:[],COMPLIANCE_HARI:[],COMPLIANCE_EVENT:[],LAPORAN_5R:[],ROLE_HARIAN:[],DRM:[],KARYAWAN_STATUS:[],SPL:[],
 KAS_KECIL:[],TRIP:[],TRIP_TITIK:[],BBM_LOG:[],STOK_BIN:[],PICK_DOK:[],PICK_KOLI:[],PICK_ITEM:[],PICK_GR:[],MASTER_BIN:[],MASTER_VENDOR:[],MASTER_EKSPEDISI:[],MASTER_AREA:[],MASTER_HPP:[],MASTER_MOKA:[],
 UNLOADING_SESI:[],UNLOADING_RESI:[],KOLI:[],PO_INFO:[],PO_DOK:[],SJ_ITEM:[],HPP_ITEM:[],GR_ASSIGN:[],GR_COUNT:[],PUTAWAY:[],DATA_ENTRY:[],LC_TASK:[],LC_COUNT:[],ADJUSTMENT:[],PROJECT:[],PROJECT_NORM:[],PROJECT_LOG:[],LAYOUT:[]};
window.fetch=async function(u,o){
 u=String(u&&u.url||u);
 if(o&&o.method==='POST'){var b=JSON.parse(o.body);window.__posts.push(b);var ops=b.ops||[b];ops.forEach(function(x){var t=x.tab,r=x.row;
   if((x.action==='delete'||x.a==='delete')&&window.__db[t])window.__db[t]=window.__db[t].filter(function(q){return q.id!==(x.id||(x.row&&x.row.id))});
   if((x.action==='append'||x.a==='append')&&t&&window.__db[t]&&r){var i=window.__db[t].findIndex(function(q){return q.id===r.id});if(i>=0)window.__db[t][i]=r;else window.__db[t].push(r)}});
  return new Response(JSON.stringify({ok:true,results:ops.map(function(){return{ok:true}}),saved:'x',file_id:'F'+(window.__fid=(window.__fid||0)+1)}))}
 var q=new URLSearchParams(u.split('?')[1]||'');
 if(q.get('action')==='ping')return new Response(JSON.stringify({ok:true,tabs:Object.keys(window.__db),epoch:''}));
 if(q.get('action')==='list')return new Response(JSON.stringify({ok:true,rows:window.__db[q.get('tab')]||[]}));
 if(q.get('action')==='multi'){var dd={};String(q.get('q')||'').split(',').forEach(function(p){var a=p.split(':');if(a[0])dd[a[0]+'|'+(a[1]||'')+'|'+(a[2]||'')]=window.__db[a[0]]||[]});return new Response(JSON.stringify({ok:true,data:dd}))}
 if(q.get('action')==='stok'){var m={};window.__db.STOK_BIN.forEach(function(r){var k=r.bin+'|'+r.sku;var e=m[k]||(m[k]={bin:r.bin,sku:r.sku,item:r.item,masuk:0,keluar:0,awal:'',akhir:'',oleh:'',jenis_akhir:''});e.masuk+=Number(r.qty_masuk)||0;e.keluar+=Number(r.qty_keluar)||0;if(Number(r.qty_masuk)>0){var w=r.waktu_server||r.tanggal||'';if(!e.awal||w<e.awal)e.awal=w;if(!e.akhir||w>e.akhir){e.akhir=w;e.oleh=r.pic_kode||'';e.jenis_akhir=r.jenis||''}}});return new Response(JSON.stringify({ok:true,rows:Object.values(m).map(function(e){e.saldo=e.masuk-e.keluar;return e})}))}
 return new Response(JSON.stringify({ok:true,rows:[]}))};
window.open=function(){return{document:{open:function(){},write:function(h){window.__html=h},close:function(){}}}};
window.confirm=function(){return true};window.prompt=function(m){return /HAPUS/.test(m)?'HAPUS':/UBAH/.test(m)?'UBAH':''};
