/* Data contoh untuk storyboard: master dan stok memakai data nyata (hanya dibaca); transaksi di bawah ini fiktif. */
(function(){
 var R=window.__REAL,db=window.__db,WITA=8*3600e3,T=new Date(Date.now()+WITA).toISOString().slice(0,10),NOW=new Date().toISOString();
 window.__T=T;
 try{localStorage.setItem('wos-reset-epoch','2026-10-10-mulai-simulasi');localStorage.setItem('wos-gd-epoch','2026-10-15-bersih-wms')}catch(e){}
 db.MASTER_BIN=R.mb;db.MASTER_VENDOR=R.vendor;db.MASTER_EKSPEDISI=R.eks;db.STOK_BIN=R.stok;
 function day(n){return new Date(Date.now()+WITA-n*864e5).toISOString().slice(0,10)}
 // item contoh dari stok nyata (qty besar, bin biasa)
 var pool=R.stok.filter(function(r){return Number(r.qty_masuk)>=120&&/^[A-H]\d+\.\d+$/.test(r.bin)&&!/DEFECT|MAMU|MYNO|PLAST/i.test(r.item)});
 window.__pool=pool;
 // ===== operasional: presensi hari ini (untuk kartu dan DRM)
 var present=['W03','W04','W07','W08','W09','W14','W17','W19','W21','W24','W28','W29','W33','W34','W35','W36'],times=['06:36','07:39','07:44','07:50','07:38','07:42','08:02','07:16','07:55','07:48','07:30','07:41','07:52','07:20','07:58','07:35'];
 var att=[];present.forEach(function(c,i){att.push({day:T,code:c,action:'Attendance in',at:new Date(T+'T'+times[i]+':00+08:00').toISOString()})});
 try{localStorage.setItem('wos-attendance-kpi-v1',JSON.stringify(att))}catch(e){}
 // ===== performa tim: presensi 30 hari + task + kejadian
 var A=[],TK=[],EV=[];
 for(var d=1;d<=26;d++){var dd=day(d);if(new Date(dd+'T00:00:00Z').getUTCDay()===0)continue;present.forEach(function(c,i){if((d+i*3)%11===0)return;A.push({id:'a'+dd+c,tanggal:dd,kode_staf:c,aksi:'Attendance in',simulasi:'',jam_wita:'07:'+(10+i)})})}
 present.forEach(function(c,i){var n=40+((i*7)%35),dn=n-((i*5)%4);for(var k=0;k<n;k++)TK.push({id:'t'+c+k,tanggal:day(1+(k%24)),tujuan:c,judul:JSON.stringify({kind:['picking','gr','lc','verifikasi','de'][k%5]}),status:k<dn?'selesai':'diterima'})});
 [['W14',3,'DRM'],['W29',5,'5R'],['W17',9,'Temuan 5R'],['W04',12,'5R'],['W28',15,'DRM']].forEach(function(x,i){EV.push({id:'ev'+i,tanggal:day(x[1]),kode_staf:x[0],jenis:x[2],status:'valid',json:JSON.stringify({type:x[2],detail:'contoh'})})});
 db.ATTENDANCE=A;db.TASK=TK;db.COMPLIANCE_EVENT=EV;
})();
