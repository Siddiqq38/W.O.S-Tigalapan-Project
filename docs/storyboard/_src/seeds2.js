// ===== tugas contoh (localStorage) untuk akun operator W19 dan checker W04
(function(){var T=window.__T,iso=new Date().toISOString();
 var tasks=[
  {id:'TP-a1',day:T,at:iso,title:'Picking UPG-01 TIGALAPAN KAOS MAKASSAR koli 1',qty:'96 pcs',by:'W09',to:'W19',status:'diterima',kind:'picking'},
  {id:'TP-a2',day:T,at:iso,title:'Picking UPG-01 TIGALAPAN KAOS MAKASSAR koli 2',qty:'120 pcs',by:'W09',to:'W19',status:'baru',kind:'picking'},
  {id:'GR-a3',day:T,at:iso,title:'GR PO CC36-23SEPT2026-REG koli 1-3',qty:'3 koli',by:'W999',to:'W19',status:'baru',kind:'gr'},
  {id:'R5-a4',day:T,at:iso,title:'5R Area P.11 ('+T+') DISETUJUI SEBAGIAN (4/5R). Belum memenuhi: Rapi',qty:'',by:'SPV',to:'W19',status:'baru',kind:'5r'},
  {id:'VP-a5',day:T,at:iso,title:'Verifikasi UPG-01 TIGALAPAN KAOS MAKASSAR koli 3',qty:'88 pcs',by:'SISTEM',to:'W04',status:'baru',kind:'verifikasi'}];
 try{localStorage.setItem('wos-tasks-v1',JSON.stringify(tasks))}catch(e){}
 window.__db.TASK=(window.__db.TASK||[]).concat(tasks.map(function(t){return{id:t.id,waktu:t.at,tanggal:t.day,tujuan:t.to,judul:JSON.stringify(t),qty:t.qty,status:t.status,diterima_oleh:'',waktu_terima:'',waktu_selesai:''}}));
})();
// ===== persiapan IndexedDB compliance: kiriman 5R menunggu approval pada tanggal berbeda
window.__sbPrep=async function(){
 if(sessionStorage.getItem('sbprep'))return 'ok';
 await new Promise(function(r){setTimeout(r,3500)});
 var db=await new Promise(function(res,rej){var q=indexedDB.open('wos-compliance-v1',1);q.onsuccess=function(){res(q.result)};q.onerror=rej});
 var st=await new Promise(function(res){var r=db.transaction('records').objectStore('records').get('state');r.onsuccess=function(){res(r.result)}});
 st=st||{days:[],events:[],audit:[]};st.days=st.days||[];
 function iso(n){return new Date(Date.now()+8*3600e3-n*864e5).toISOString().slice(0,10)}
 [[0,'W07','P.8'],[0,'W19','P.11'],[1,'W04','P.12'],[1,'W29','P.6'],[9,'W08','P.1']].forEach(function(a){var d=iso(a[0]);var ex=st.days.find(function(x){return x.id===d+':'+a[1]});var rep={at:Date.now()-a[0]*864e5-36e5,approval:'pending',kind:'video',fileId:'f'+a[1],size:1000};if(ex){ex.report=rep;ex.reportHistory=ex.reportHistory||[];ex.area=ex.area||a[2];return}st.days.push({id:d+':'+a[1],day:d,code:a[1],area:a[2],team:'Tim DC',fiveRRequired:true,drm:'yes',device:'unknown',exempt:false,reason:'',report:{at:Date.now()-a[0]*864e5-36e5,approval:'pending',kind:'video',fileId:'f'+a[1],size:1000},reportHistory:[]})});
 await new Promise(function(res){var tx=db.transaction('records','readwrite');tx.objectStore('records').put(st,'state');tx.oncomplete=res});
 sessionStorage.setItem('sbprep','1');return 'reload'};
