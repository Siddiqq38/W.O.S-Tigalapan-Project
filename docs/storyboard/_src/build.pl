use utf8;undef $/;
sub rd{open F,"<:utf8",shift or die;my $t=<F>;close F;$t}
my $root="C:/Users/ASUS/.codex/W.O.S-Tigalapan-Project";
my $h=rd("$root/index.html");
my $rows=sub{my $t=shift;$t=~s/^\{.*?"rows":(\[.*\])\}\s*$/$1/s;$t};
my $real="window.__REAL={mb:".$rows->(rd("/tmp/sa/mb.json")).",stok:".$rows->(rd("/tmp/sa/s4.json")).",vendor:".$rows->(rd("/tmp/sa/MASTER_VENDOR.json")).",eks:".$rows->(rd("/tmp/sa/MASTER_EKSPEDISI.json"))."};";
my $head="<script>".rd("$root/docs/storyboard/_src/stub.js")."</script><script>$real</script><script>".rd("$root/docs/storyboard/_src/seeds.js")."</script><script>".rd("$root/docs/storyboard/_src/seeds2.js")."</script><script>".rd("$root/docs/storyboard/_src/seeds3.js")."</script>";
$h=~s{<head>}{<head>$head}i or die "head";
my $j=rindex($h,"</body></html>");die "end" if $j<0;
my $tail="<script>".rd("$root/docs/storyboard/_src/lib.js")."</script><script>".rd("$root/docs/storyboard/_src/frames.js")."</script><script>".rd("$root/docs/storyboard/_src/frames2.js")."</script>";
substr($h,$j,0)=$tail;
open O,">:utf8","$root/_sb_app.html";print O $h;close O;print "ok\n"
