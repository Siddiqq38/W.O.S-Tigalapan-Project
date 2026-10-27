use JSON::PP;
sub L{open F,"/tmp/d_$_[0].json";local $/;return decode_json(<F>)->{rows}}
my %D;$D{PICK_DOK}=[grep{$_->{kode}eq"UPG-03"}@{L("PICK_DOK")}];$D{PICK_KOLI}=[grep{$_->{dok}=~/^UPG-03/}@{L("PICK_KOLI")}];$D{PICK_ITEM}=[grep{$_->{dok}=~/^UPG-03/}@{L("PICK_ITEM")}];
my $j=JSON::PP->new->ascii->encode(\%D);
my $d="C:/Users/ASUS/.codex/W.O.S-Tigalapan-Project/docs/storyboard/_src";
open T,"<:utf8","$d/store_tpl.js";local $/;my $t=<T>;$t=~s/__RD__/$j/;
open O,">:utf8","$d/dash.js";print O $t;
