use utf8;binmode STDOUT,":utf8";undef $/;
sub rd{open F,"<:utf8",shift or die;my $t=<F>;close F;$t}
my $dir="C:/Users/ASUS/.codex/W.O.S-Tigalapan-Project/docs/storyboard";
my %SC=(SC1=>'Alur 1 · Operasional harian',SC2=>'Alur 2 · Inbound dan stok',SC3=>'Alur 3 · Outbound');
my @F;
for my $f("frames.js","frames2.js"){my $t=rd("$dir/_src/$f");
 while($t=~/\{id:'([A-Z]\d+)',scene:(SC\d),n:(\d+),role:'((?:[^'\\]|\\.)*)',title:'((?:[^'\\]|\\.)*)',text:'((?:[^'\\]|\\.)*)'/g){push @F,{id=>$1,sc=>$SC{$2},scn=>$2,n=>$3,role=>$4,title=>$5,text=>$6}}}
sub h{my $s=shift;$s=~s/&/&amp;/g;$s=~s/</&lt;/g;$s=~s/>/&gt;/g;$s}
my @sheets;my %byc;push @{$byc{$_->{scn}}},$_ for @F;
for my $k(sort keys %byc){my @l=@{$byc{$k}};while(@l){push @sheets,[splice(@l,0,6)]}}
my $total=scalar(@sheets);
my $html='<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Lembar storyboard WOS</title><style>*{box-sizing:border-box}body{margin:0;background:#9aa5ae;font-family:Inter,"Segoe UI",Arial,sans-serif;color:#1c2a36}.sheet{width:1800px;height:1272px;margin:0 auto 24px;background:#fff;position:relative;overflow:hidden;padding:0 40px}.top{margin:0 -40px;height:86px;background:linear-gradient(90deg,#1c3b57,#b8522b);color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 40px}.top b{font-size:28px;letter-spacing:.02em}.top span{font-size:20px;opacity:.92}.grid{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(2,1fr);gap:22px 24px;padding-top:24px;height:calc(100% - 86px - 52px)}.pn{border:2px solid #1c3b57;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;background:#fdfaf7}.pn img{width:100%;display:block;border-bottom:2px solid #1c3b57}.pn .cp{padding:10px 16px 12px;flex:1;position:relative}.pn .id{position:absolute;right:12px;top:8px;background:#ff9f43;color:#1b2733;font-weight:800;font-size:15px;border-radius:99px;padding:3px 12px}.pn h3{margin:0 70px 4px 0;font-size:19px;line-height:1.25}.pn .rl{font-size:13px;font-weight:700;color:#b8522b;margin-bottom:4px}.pn p{margin:0;font-size:14.5px;line-height:1.45;color:#33414e}.ft{position:absolute;left:0;right:0;bottom:0;height:52px;background:#f3eee9;display:flex;align-items:center;justify-content:space-between;padding:0 40px;font-size:15px;color:#667585}</style></head><body>';
my $i=0;
for my $s(@sheets){$i++;my $first=$s->[0];
 $html.='<section class="sheet"><div class="top"><b>STORYBOARD · PETUNJUK PENGGUNAAN W.O.S</b><span>'.h($first->{sc}).'</span></div><div class="grid">';
 for my $f(@$s){$html.='<div class="pn"><img src="frames/'.$f->{id}.'.png"><div class="cp"><span class="id">'.$f->{id}.'</span><h3>'.h($f->{n}.'. '.$f->{title}).'</h3><div class="rl">'.h($f->{role}).'</div><p>'.h($f->{text}).'</p></div></div>'}
 $html.='</div><div class="ft"><span>Distribusi Center 38 · Tigalapan Indonesia</span><span>Lembar '.$i.' dari '.$total.'</span></div></section>'}
$html.='</body></html>';
open O,">:utf8","$dir/sheets.html";print O $html;close O;print "$total lembar\n";
