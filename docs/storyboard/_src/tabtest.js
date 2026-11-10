/* Uji tampilan tablet: ukur kelebihan lebar, sidebar, menu, dan tombol yang tertutup pada tiap halaman. */
window.__tabRes=[];
function measure(page){
 var d=document.documentElement,vw=innerWidth;
 var act=document.querySelector('.page.active')||document.body;
 var offenders=[].slice.call(act.querySelectorAll('*')).filter(function(e){var r=e.getBoundingClientRect();if(r.width<2||r.height<2)return false;if(r.right<=vw+2&&r.left>=-2)return false;var p=e.parentElement;while(p&&p!==act){var o=getComputedStyle(p).overflowX;if(o==='auto'||o==='scroll'||o==='hidden')return false;p=p.parentElement}return true});
 var sb=document.querySelector('.sidebar'),sbr=sb?sb.getBoundingClientRect():null;
 var navs=[].slice.call(document.querySelectorAll('.nav')).filter(function(n){var r=n.getBoundingClientRect();return r.width>0&&r.height>0&&!n.classList.contains('wos-hide')});
 var btns=[].slice.call(act.querySelectorAll('button,select,input,a')).filter(function(b){var r=b.getBoundingClientRect();return r.width>8&&r.height>8&&r.top>=0&&r.bottom<=innerHeight});
 var covered=btns.filter(function(b){var r=b.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,t=document.elementFromPoint(x,y);return t&&t!==b&&!b.contains(t)&&!t.contains(b)}).length;
 var small=btns.filter(function(b){var r=b.getBoundingClientRect();return Math.min(r.width,r.height)<28}).length;
 var res={page:page,vw:vw,vh:innerHeight,scrollX:d.scrollWidth-d.clientWidth,off:offenders.length,offEx:offenders.slice(0,3).map(function(e){return e.tagName+'.'+String(e.className||'').slice(0,24)}),sidebar:sbr?[Math.round(sbr.left),Math.round(sbr.width),Math.round(sbr.height)]:null,navs:navs.length,btns:btns.length,covered:covered,small:small};
 window.__tabRes.push(res);return res}
function T(id,page,lv,code,extra){return {id:id,scene:'Uji tablet',n:1,role:lv,title:page,text:'Uji tampilan',hl:[],setup:async function(){__sbLogin(lv,code);await __sbNav(page);await __sbW(1600);if(extra)await extra();measure(page)}}}
var adm=function(t){return async function(){var pg=document.getElementById('wms-outbound');var b=[].slice.call(pg.querySelectorAll('button')).find(function(x){return x.textContent.trim()===t});if(b)b.click();await __sbW(900)}};
window.__frames=[
 {id:'T00',scene:'Uji tablet',n:1,role:'-',title:'login',text:'Uji',hl:[],setup:async function(){sessionStorage.clear();var l=document.getElementById('wos-login');l.style.display='';document.documentElement.classList.add('wos-locked');measure('login')}},
 T('T01','dashboard','supervisor','W999'),
 T('T02','attendance','operator','W19'),
 T('T03','compliance','operator','W19'),
 T('T04','tugas','operator','W19'),
 T('T05','wms-inbound','admin','W09'),
 T('T06','wms-outbound','admin','W09'),
 T('T07','wms-location','admin','W09'),
 T('T08','wms-inventory','admin','W09'),
 T('T09','analysis','supervisor','W999'),
 T('T10','performance','supervisor','W999'),
 T('T11','kaskecil','supervisor','W999'),
 T('T12','trip','supervisor','W999'),
 T('T13','evaluasi','supervisor','W999'),
 T('T14','master','supervisor','W999')
];
