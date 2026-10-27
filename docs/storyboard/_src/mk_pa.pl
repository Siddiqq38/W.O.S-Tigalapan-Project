use JSON::PP;
sub L{open F,"/tmp/d_$_[0].json";local $/;return decode_json(<F>)->{rows}}
my $po="GI37-30SEPT2026-01 REG";my $k=17;
my ($g)=grep{$_->{po} eq $po&&$_->{no_koli}==$k}@{L("GR_ASSIGN")};$g->{status}="Siap put away";$g->{operator}="W999";
my %D;$D{GR_ASSIGN}=[$g];$D{GR_COUNT}=[grep{$_->{po} eq $po&&$_->{no_koli}==$k}@{L("GR_COUNT")}];$D{SJ_ITEM}=[grep{$_->{po} eq $po&&$_->{no_koli}==$k}@{L("SJ_ITEM")}];$D{PUTAWAY}=[];$D{KOLI}=[grep{$_->{po} eq $po&&$_->{no_koli}==$k}@{L("KOLI")}];
my $j=JSON::PP->new->ascii->encode(\%D);my $d="C:/Users/ASUS/.codex/W.O.S-Tigalapan-Project/docs/storyboard/_src";
open T,"<:utf8","$d/pa_tpl.js";local $/;my $t=<T>;$t=~s/__RD__/$j/;open O,">:utf8","$d/dash.js";print O $t;
