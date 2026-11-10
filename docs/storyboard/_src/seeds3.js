/* Data contoh inbound dan outbound (fiktif). Item dan bin diambil dari stok nyata hanya sebagai nama contoh. */
(function(){
 var NM={W19:"JABAL RAHMAT",W21:"LAODE SARIF ADAM",W17:"SULQADRI",W24:"SULDENI",W28:"ZUHDI",W29:"MUHAMMAD FACHRI DHARMAWAN",W36:"ABD. YANDI SAPUTRA"},db=window.__db,T=window.__T,pool=window.__pool||[],NOW=new Date().toISOString(),WITA=8*3600e3;
 function day(n){return new Date(Date.now()+WITA-n*864e5).toISOString().slice(0,10)}
 var ymd=T.replace(/-/g,'');
 function pick(i){return pool[(i*37+11)%pool.length]||{bin:'A1.1',item:'HITAM 24S PDK L',sku:'HITAM 24S PDK L'}}
 // ================= INBOUND =================
 var PO1='CC36-23SEPT2026-REG',PO2='BY40-12OKT2026-REG';
 db.PO_INFO=[{id:PO1,vendor:'CECEP',total_koli:'20',pekan:'',catatan:'',diperbarui:T},{id:PO2,vendor:'BAYU',total_koli:'12',pekan:'',catatan:'',diperbarui:T}];
 var S1='SS-'+ymd+'-W19-AB12',S2='SS-'+ymd+'-W21-CD34';
 db.UNLOADING_SESI=[
  {id:S1,tanggal:T,ekspedisi:'WUS',pic_kode:'W19',pic_nama:'JABAL RAHMAT',jam_mulai:'09:10',jam_selesai:'',status:'Berjalan',catatan:''},
  {id:S2,tanggal:day(1),ekspedisi:'CAS',pic_kode:'W21',pic_nama:'LAODE SARIF ADAM',jam_mulai:'13:20',jam_selesai:'14:05',status:'Selesai',catatan:'Penerimaan selesai 14:00; Validasi selesai 14:05; TTB TTB/'+day(1).replace(/-/g,'')+'/01'}];
 db.UNLOADING_RESI=[
  {id:S1+'|12160|'+PO1,tanggal:T,sesi_id:S1,resi:'12160',po:PO1,vendor:'CECEP',ekspedisi:'WUS',koli_list:'',area_staging:'STG4',pic_kode:'W19'},
  {id:S2+'|77120|'+PO2,tanggal:day(1),sesi_id:S2,resi:'77120',po:PO2,vendor:'BAYU',ekspedisi:'CAS',koli_list:'',area_staging:'STG2',pic_kode:'W21'}];
 var koli=[];
 for(var k=1;k<=10;k++)koli.push({id:PO1+'|'+k,tanggal:T,po:PO1,no_koli:String(k),resi:'12160',sesi_id:S1,ekspedisi:'WUS',status:k===7?'Bermasalah':'Diterima',keterangan:k===7?'Koli basah':'',pic_kode:'W19',jam_wita:'09:'+(20+k),foto_id:''});
 for(var k=1;k<=12;k++)koli.push({id:PO2+'|'+k,tanggal:day(1),po:PO2,no_koli:String(k),resi:'77120',sesi_id:S2,ekspedisi:'CAS',status:'Diterima',keterangan:'',pic_kode:'W21',jam_wita:'13:'+(25+k),foto_id:''});
 db.KOLI=koli;
 db.PO_DOK=[{id:PO1,vendor:'CECEP',sj_item:'',sj_koli:'',sj_qty:'',sj_waktu:'',sj_oleh:'',hpp_item:'',hpp_waktu:'',hpp_oleh:'',catatan:''},{id:PO2,vendor:'BAYU',sj_item:'36',sj_koli:'12',sj_qty:'1440',sj_waktu:day(1)+' 15:10',sj_oleh:'W09',hpp_item:'36',hpp_waktu:day(1)+' 15:20',hpp_oleh:'W09',catatan:''}];
 var sj=[],cnt=[];
 for(var k=1;k<=3;k++)for(var s=1;s<=3;s++){var it=pick(k*4+s);sj.push({id:PO2+'|'+k+'|'+s,tanggal:day(1),po:PO2,no_koli:String(k),seq:String(s),item:it.item,qty:String(120),tipe:'REG',tgl_kirim:day(2),awb:'77120',eta:day(1),diunggah_oleh:'W09'});
  if(k===1)cnt.push({id:PO2+'|'+k+'|'+s,tanggal:T,po:PO2,no_koli:String(k),seq:String(s),item:it.item,qty_sj:'120',qty_actual:s===2?'118':'120',selisih:s===2?'-2':'0',status:s===2?'Selisih':'Sesuai',keterangan:s===2?'Kurang 2 pcs':'',foto_id:'',operator:'W21',jam_wita:'10:3'+s})}
 db.SJ_ITEM=sj;db.GR_COUNT=cnt;
 db.GR_ASSIGN=[
  {id:PO2+'|1',tanggal:T,po:PO2,no_koli:'1',operator:'W21',operator_nama:'LAODE SARIF ADAM',ditugaskan_oleh:'W09',task_id:'GR-x1',status:'Berjalan',mulai:'10:20',selesai:''},
  {id:PO2+'|2',tanggal:T,po:PO2,no_koli:'2',operator:'W19',operator_nama:'JABAL RAHMAT',ditugaskan_oleh:'W09',task_id:'GR-x2',status:'Menunggu put away',mulai:'10:50',selesai:''},
  {id:PO2+'|3',tanggal:T,po:PO2,no_koli:'3',operator:'W19',operator_nama:'JABAL RAHMAT',ditugaskan_oleh:'W09',task_id:'GR-x3',status:'Ditugaskan',mulai:'',selesai:''}];
 // ================= OUTBOUND =================
 var DOK='UPG-01|TIGALAPAN KAOS MAKASSAR|'+T;
 db.PICK_DOK=[{id:DOK,tanggal:T,kode:'UPG-01',outlet:'TIGALAPAN KAOS MAKASSAR',file:'SOQ UPG-01.xlsx',jumlah_item:'24',total_qty:'1480',status:'Berjalan',diunggah_oleh:'W09',waktu:NOW,ekspedisi:'',eta:'',tgl_soq:T,kode_outlet:'UPG-01',alamat:'',metode:'',kategori:''}];
 var st=['Picking','Siap verifikasi','Siap TFS','Selesai TFS','Staging','Dimuat','Shipping'],pk=['W19','W21','W17','W24','W28','W29','W36'],koliR=[],itemR=[];
 st.forEach(function(s,i){var k=i+1,p=pk[i];koliR.push({id:DOK+'|K'+k,tanggal:T,dok:DOK,koli:String(k),picker:p,picker_nama:(NM[p]||p),status:s,task_id:'TP-s'+k,mulai:'08:30',selesai:i>0?'09:40':'',vp_oleh:i>1?'W04':'',vp_selesai:i>1?'10:10':'',tfs_oleh:i>2?'W09':'',tfs_waktu:i>2?'10:40':'',area:i>3?'Staging Out City':'',pack_oleh:i>3?'W36':'',pack_waktu:i>3?'11:00':'',load_oleh:i>4?'W34':'',load_waktu:i>4?'14:30':'',rcv_oleh:'',rcv_waktu:'',rcv_ket:'',rcv_nama:''});
  for(var l=1;l<=4;l++){var it=pick(i*5+l),q=[24,36,12,48][l-1],done=i>0||l<=2;itemR.push({id:DOK+'|L'+(i*4+l)+'|P1',tanggal:T,dok:DOK,outlet:'TIGALAPAN KAOS MAKASSAR',item:it.item,sku:it.sku||it.item,kategori:'REG',soq:String(q),ket:'',koli:String(k),bin:it.bin,qty:String(q),status:done?'Sesuai':'Menunggu',bin_actual:done?it.bin:'',qty_actual:done?String(q):'',ket_pick:'',foto_id:'',picker:p,jam_pick:done?'08:5'+l:'',vp:i>1?'Sesuai':'',vp_ket:'',vp_oleh:i>1?'W04':'',vp_jam:i>1?'10:0'+l:''})}});
 db.PICK_KOLI=koliR;db.PICK_ITEM=itemR;
 // koli yang sudah diterima outlet + temuan miss-picking
 var dok2='UPG-02|MAMU MAKASSAR|'+day(2);
 db.PICK_DOK.push({id:dok2,tanggal:day(2),kode:'UPG-02',outlet:'MAMU MAKASSAR',file:'SOQ UPG-02.xlsx',jumlah_item:'12',total_qty:'620',status:'Berjalan',diunggah_oleh:'W09',waktu:NOW,ekspedisi:'',eta:'',tgl_soq:day(2),kode_outlet:'UPG-02',alamat:'',metode:'',kategori:''});
 db.PICK_KOLI.push({id:dok2+'|K1',tanggal:day(2),dok:dok2,koli:'1',picker:'W19',picker_nama:'JABAL RAHMAT',status:'Diterima-Masalah',task_id:'',mulai:'',selesai:'',vp_oleh:'W04',vp_selesai:'',tfs_oleh:'W09',tfs_waktu:'',area:'Staging In City',pack_oleh:'W36',pack_waktu:'',load_oleh:'W34',load_waktu:'',rcv_oleh:'ST.UPG-02',rcv_waktu:day(1),rcv_ket:'',rcv_nama:'STORE HEAD MAMU MAKASSAR'});
 var itx=pick(3);db.PICK_ITEM.push({id:dok2+'|L1|P1',tanggal:day(2),dok:dok2,outlet:'MAMU MAKASSAR',item:itx.item,sku:itx.sku||itx.item,kategori:'REG',soq:'24',ket:'',koli:'1',bin:itx.bin,qty:'24',status:'Sesuai',bin_actual:itx.bin,qty_actual:'24',ket_pick:'',foto_id:'',picker:'W19',jam_pick:'09:00',vp:'Sesuai',vp_ket:'',vp_oleh:'W04',vp_jam:'09:30'});
 db.PICK_GR=[{id:dok2+'|1|1',tanggal:day(1),dok:dok2,outlet:'MAMU MAKASSAR',koli:'1',item:itx.item,soq:'24',qty_dc:'24',status:'Salah',qty_gr:'20',item_gr:itx.item,ket:'Kurang 4 pcs saat dihitung di toko',foto_id:'',oleh:'ST.UPG-02',jam:'16:20',resolusi:'',resolusi_ket:'',resolusi_oleh:'',resolusi_jam:''}];
 // ================= LOCATION CONTROL =================
 db.LC_TASK=[{id:'LT-1',tanggal:T,jenis:'Cycle Count',bin:'A1.10',operator:'W24',operator_nama:'SULDENI',status:'Berjalan',ronde:'1',hasil:'',mulai:'09:00',selesai:'',dibuat_oleh:'W999',putaran:'1'}];
})();
