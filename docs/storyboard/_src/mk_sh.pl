use utf8;binmode STDOUT,":utf8";undef $/;
sub rd{open F,"<:utf8",shift or die;my $t=<F>;close F;$t}
my $dir="C:/Users/ASUS/.codex/W.O.S-Tigalapan-Project/docs/storehead";
my $t=rd("C:/Users/ASUS/.codex/W.O.S-Tigalapan-Project/docs/storyboard/_src/frames3.js");
my @F;
while($t=~/\{id:'(S\d+)',scene:SC4,n:(\d+),role:'((?:[^'\\]|\\.)*)',title:'((?:[^'\\]|\\.)*)',text:'((?:[^'\\]|\\.)*)',(?:say:'((?:[^'\\]|\\.)*)',)?hl:/g){
 my($id,$n,$role,$title,$text,$say)=($1,$2,$3,$4,$5,$6);for($role,$title,$text,$say){s/\\'/'/g if defined}
 push @F,{id=>$id,n=>$n,role=>$role,title=>$title,text=>$text,say=>(defined $say?$say:$text)}}
sub h{my $s=shift;$s=~s/&/&amp;/g;$s=~s/</&lt;/g;$s=~s/>/&gt;/g;$s}
sub c{my $s=shift;$s=~s/"/""/g;'"'.$s.'"'}
# narasi csv + markdown
my $csv="\x{FEFF}Frame,No,Judul,Narasi tampil,Narasi suara,Durasi saran (detik)\r\n";
my $md="# Panduan W.O.S untuk Store Head\n\nStoryboard tutorial: masuk, pantau SOQ, terima barang, GR Outlet, dan laporan miss-picking. Setiap frame adalah gambar 1920×1080.\n";
for(@F){my $sec=int(length($_->{say})/13)+3;$csv.=join(",",c($_->{id}),$_->{n},c($_->{title}),c($_->{text}),c($_->{say}),$sec)."\r\n";
 $md.="\n## $_->{n}. $_->{title}\n*File `frames/$_->{id}.png` · saran $sec detik*\n\n$_->{text}\n"}
open O,">:utf8","$dir/narasi.csv";print O $csv;close O;open O,">:utf8","$dir/naskah.md";print O $md;close O;
# galeri HTML
my $css='*{box-sizing:border-box}body{margin:0;background:#f4f1ee;color:#1c2a36;font-family:Inter,"Segoe UI",Arial,sans-serif}header{background:linear-gradient(90deg,#1c3b57,#b8522b);color:#fff;padding:22px 24px}header h1{margin:0;font-size:24px}header p{margin:6px 0 0;opacity:.9}main{max-width:1100px;margin:0 auto;padding:18px}.fr{background:#fff;border-radius:14px;overflow:hidden;margin:0 0 22px;box-shadow:0 2px 12px rgba(0,0,0,.12)}.fr img{width:100%;display:block}.cp{padding:14px 18px}.cp .id{display:inline-block;background:#b8522b;color:#fff;border-radius:999px;padding:2px 12px;font-weight:700;font-size:13px}.cp h3{margin:8px 0 6px;font-size:19px}.cp p{margin:0;color:#44566a;line-height:1.55}';
my $g='<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Panduan W.O.S untuk Store Head</title><style>'.$css.'</style></head><body><header><h1>Panduan W.O.S untuk Store Head</h1><p>Masuk, pantau SOQ, terima barang, GR Outlet, dan laporan miss-picking</p></header><main>';
for(@F){$g.='<section class="fr"><img loading="lazy" src="frames/'.$_->{id}.'.png" alt="'.h($_->{title}).'"><div class="cp"><span class="id">Langkah '.$_->{n}.'</span><h3>'.h($_->{title}).'</h3><p>'.h($_->{text}).'</p></div></section>'}
$g.='</main></body></html>';open O,">:utf8","$dir/index.html";print O $g;close O;
# dokumen cetak (PDF): satu langkah per halaman A4 lanskap
my $p='<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Panduan W.O.S untuk Store Head</title><style>@page{size:A4 landscape;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Inter,"Segoe UI",Arial,sans-serif;color:#1c2a36}.pg{width:297mm;height:210mm;page-break-after:always;position:relative;background:#fff;overflow:hidden}.hd{height:15mm;background:linear-gradient(90deg,#1c3b57,#b8522b);color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 10mm;font-weight:700;font-size:13pt}.hd small{font-weight:500;font-size:10pt}.im{height:138mm;display:flex;align-items:center;justify-content:center;background:#e9e4df}.im img{max-width:277mm;max-height:134mm;border-radius:2mm;box-shadow:0 1mm 4mm rgba(0,0,0,.3)}.tx{padding:5mm 10mm}.tx .n{display:inline-block;background:#b8522b;color:#fff;border-radius:999px;padding:.5mm 4mm;font-weight:700;font-size:10pt}.tx h2{margin:2mm 0 1.5mm;font-size:16pt}.tx p{margin:0;font-size:11pt;line-height:1.5;color:#33465a}.cover{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:linear-gradient(135deg,#1c3b57,#b8522b);color:#fff}.cover h1{font-size:34pt;margin:0 0 4mm}.cover p{font-size:15pt;margin:0 0 2mm;opacity:.92}.ft{position:absolute;left:10mm;right:10mm;bottom:3mm;font-size:8pt;color:#8a97a5;display:flex;justify-content:space-between}</style></head><body>';
$p.='<section class="pg cover"><h1>Panduan W.O.S<br>untuk Store Head</h1><p>Masuk, pantau SOQ, terima barang, GR Outlet, dan laporan miss-picking</p><p>Tigalapan Indonesia · DC 38</p></section>';
for(@F){$p.='<section class="pg"><div class="hd"><span>W.O.S · Panduan Store Head</span><small>Langkah '.$_->{n}.' dari '.scalar(@F).'</small></div><div class="im"><img src="frames/'.$_->{id}.'.png"></div><div class="tx"><span class="n">Langkah '.$_->{n}.'</span><h2>'.h($_->{title}).'</h2><p>'.h($_->{text}).'</p></div><div class="ft"><span>Tigalapan Indonesia · DC 38</span><span>w-o-s-tigalapan-project.vercel.app</span></div></section>'}
$p.='</body></html>';open O,">:utf8","$dir/panduan.html";print O $p;close O;
print scalar(@F)," langkah\n";
