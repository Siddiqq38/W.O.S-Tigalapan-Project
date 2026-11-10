use utf8;binmode STDOUT,":utf8";undef $/;
sub rd{open F,"<:utf8",shift or die;my $t=<F>;close F;$t}
my $dir="C:/Users/ASUS/.codex/W.O.S-Tigalapan-Project/docs/storyboard";
my %SC=(SC1=>'Alur 1 · Operasional harian',SC2=>'Alur 2 · Inbound dan stok',SC3=>'Alur 3 · Outbound');
my @F;
for my $f("frames.js","frames2.js"){my $t=rd("$dir/_src/$f");
 while($t=~/\{id:'([A-Z]\d+)',scene:(SC\d),n:(\d+),role:'((?:[^'\\]|\\.)*)',title:'((?:[^'\\]|\\.)*)',text:'((?:[^'\\]|\\.)*)'/g){push @F,{id=>$1,sc=>$SC{$2},n=>$3,role=>$4,title=>$5,text=>$6}}}
sub h{my $s=shift;$s=~s/&/&amp;/g;$s=~s/</&lt;/g;$s=~s/>/&gt;/g;$s}
sub c{my $s=shift;$s=~s/"/""/g;'"'.$s.'"'}
# CSV narasi
my $csv="\x{FEFF}Frame,Alur,No,Peran,Judul,Narasi (teks suara),Durasi saran (detik)\r\n";
for(@F){my $sec=int(length($_->{text})/14)+3;$csv.=join(",",c($_->{id}),c($_->{sc}),$_->{n},c($_->{role}),c($_->{title}),c($_->{text}),$sec)."\r\n"}
open O,">:utf8","$dir/narasi.csv";print O $csv;close O;
# Markdown naskah
my $md="# Naskah storyboard WOS\n\nSetiap frame adalah satu gambar 1920×1080. Durasi saran dihitung dari panjang narasi (sekitar 14 karakter per detik, ditambah 3 detik jeda).\n";my $cur='';
for(@F){if($_->{sc} ne $cur){$cur=$_->{sc};$md.="\n## $cur\n"}my $sec=int(length($_->{text})/14)+3;$md.="\n### $_->{id} · $_->{title}\n*Peran: $_->{role} · saran $sec detik · file `frames/$_->{id}.png`*\n\n$_->{text}\n"}
open O,">:utf8","$dir/naskah.md";print O $md;close O;
# HTML galeri
my $html='<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Storyboard WOS</title><style>:root{--bg:#f4f1ee;--fg:#1c2a36;--card:#fff;--ac:#b8522b;--mu:#667585}@media(prefers-color-scheme:dark){:root{--bg:#171c21;--fg:#e9eef2;--card:#222a31;--mu:#9aa8b5}}body{margin:0;background:var(--bg);color:var(--fg);font-family:Inter,Arial,sans-serif}header{padding:28px 24px;background:linear-gradient(90deg,#1c3b57,#b8522b);color:#fff}header h1{margin:0 0 6px;font-size:26px}header p{margin:0;opacity:.9;max-width:900px;line-height:1.5}nav{position:sticky;top:0;z-index:5;background:var(--card);padding:10px 24px;display:flex;gap:10px;flex-wrap:wrap;box-shadow:0 2px 8px rgba(0,0,0,.12)}nav a{color:var(--fg);text-decoration:none;padding:6px 12px;border-radius:99px;background:rgba(184,82,43,.12);font-size:14px;font-weight:600}main{max-width:1200px;margin:0 auto;padding:10px 20px 60px}h2{margin:34px 0 4px;font-size:22px;color:var(--ac)}.sub{color:var(--mu);margin:0 0 16px;font-size:14px}.fr{background:var(--card);border-radius:16px;margin:18px 0;overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,.12)}.fr img{width:100%;display:block;background:#ddd}.cp{padding:14px 20px 18px;display:grid;grid-template-columns:auto 1fr auto;gap:6px 16px;align-items:start}.id{font-weight:800;font-size:20px;color:var(--ac)}.cp h3{margin:0;font-size:18px}.cp p{margin:6px 0 0;line-height:1.55;grid-column:2/4}.rl{font-size:12px;font-weight:700;background:rgba(28,59,87,.12);padding:4px 10px;border-radius:99px;white-space:nowrap}a.dl{font-size:12px;color:var(--ac)}@media(max-width:700px){.cp{grid-template-columns:1fr}.cp p{grid-column:1}}</style></head><body><header><h1>Storyboard petunjuk penggunaan W.O.S</h1><p>'.scalar(@F).' frame dalam tiga alur: operasional harian, inbound dan stok, outbound. Tiap frame berukuran 1920×1080 dan siap disusun menjadi video. Naskah suara ada di <b>naskah.md</b> dan <b>narasi.csv</b>.</p></header><nav>';
my %seen;for(@F){unless($seen{$_->{sc}}++){my $k=$_->{sc};$k=~/(\d)/;$html.='<a href="#a'.$1.'">'.h($k).'</a>'}}
$html.='</nav><main>';my $cur2='';
for(@F){if($_->{sc} ne $cur2){$cur2=$_->{sc};$cur2=~/(\d)/;$html.='<h2 id="a'.$1.'">'.h($cur2).'</h2><p class="sub">Urutan frame sesuai urutan kerja di lapangan.</p>'}
 $html.='<section class="fr"><img loading="lazy" src="frames/'.$_->{id}.'.png" alt="'.h($_->{title}).'"><div class="cp"><div class="id">'.$_->{id}.'</div><div><h3>'.h($_->{title}).'</h3></div><div class="rl">'.h($_->{role}).'</div><p>'.h($_->{text}).'</p></div></section>'}
$html.='</main></body></html>';
open O,">:utf8","$dir/index.html";print O $html;close O;
print scalar(@F)," frame\n";
