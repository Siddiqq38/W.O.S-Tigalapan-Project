Add-Type -AssemblyName System.Drawing
$W=1080;$H=1990
$bmp=New-Object System.Drawing.Bitmap $W,$H
$g=[System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode='AntiAlias';$g.TextRenderingHint='AntiAliasGridFit'
function C($hex){[System.Drawing.ColorTranslator]::FromHtml($hex)}
$g.Clear((C '#F7EFE9'))
function RR($x,$y,$w,$h,$r){$p=New-Object System.Drawing.Drawing2D.GraphicsPath;$d=$r*2
$p.AddArc($x,$y,$d,$d,180,90);$p.AddArc($x+$w-$d,$y,$d,$d,270,90);$p.AddArc($x+$w-$d,$y+$h-$d,$d,$d,0,90);$p.AddArc($x,$y+$h-$d,$d,$d,90,90);$p.CloseFigure();$p}
$fT=New-Object System.Drawing.Font('Segoe UI',44,[System.Drawing.FontStyle]::Bold)
$fS=New-Object System.Drawing.Font('Segoe UI',24)
$fH=New-Object System.Drawing.Font('Segoe UI',30,[System.Drawing.FontStyle]::Bold)
$fB=New-Object System.Drawing.Font('Segoe UI',22)
$fN=New-Object System.Drawing.Font('Segoe UI',34,[System.Drawing.FontStyle]::Bold)
$fSm=New-Object System.Drawing.Font('Segoe UI',20)
$brand=New-Object System.Drawing.SolidBrush (C '#B5532A')
$dark=New-Object System.Drawing.SolidBrush (C '#2B1A12')
$mut=New-Object System.Drawing.SolidBrush (C '#6B5246')
$white=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
# header
$g.FillRectangle($brand,0,0,$W,250)
$g.DrawString('W.O.S TIGALAPAN INDONESIA',$fSm,$white,60,50)
$g.DrawString('Cara Attendance In',$fT,$white,56,92)
$g.DrawString('Panduan simulasi untuk seluruh tim - 5 langkah',$fS,$white,60,172)
$steps=@(
 @('1','Buka WOS dan login','Buka link lewat Chrome atau Safari (bukan dari dalam WhatsApp).|Nyalakan Lokasi/GPS dan izinkan Kamera.|Login: Kode staf + password awal (ID staf).'),
 @('2','Buka menu Attendance','Di kartu "Check-in / check-out staff":|Kode staff = pilih nama Anda.|Aksi = Attendance in.'),
 @('3','Langkah Foto','Ketuk "Aktifkan kamera", lalu "Ambil foto".|Wajah harus terlihat jelas. Galeri tidak bisa dipakai.|Kamera depan aktif otomatis. Bisa diganti lewat "Ganti kamera".'),
 @('4','Langkah Lokasi','Ketuk "Validasi lokasi sekarang".|Anda harus berada di area DC 38 (radius 25 meter).|Bila gagal: pastikan GPS menyala, lalu coba lagi di luar ruangan.'),
 @('5','Konfirmasi presensi','Saat Foto dan Lokasi sudah hijau, ketuk "Konfirmasi presensi".|Presensi tercatat dan terlihat SPV dalam sekitar 30 detik.')
)
$y=290
foreach($s in $steps){
 $lines=$s[2].Split('|');$h=130+($lines.Count*42)
 $g.FillPath((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)),(RR 50 $y 980 $h 26))
 $g.FillEllipse($brand,80,($y+28),84,84)
 $sz=$g.MeasureString($s[0],$fN)
 $g.DrawString($s[0],$fN,$white,(122-$sz.Width/2),($y+44))
 $g.DrawString($s[1],$fH,$dark,190,($y+36))
 $ly=$y+104
 foreach($l in $lines){$g.DrawString([string][char]0x2022+' '+$l,$fB,$mut,100,$ly);$ly+=42}
 $y+=$h+24
}
# role note
$g.FillPath((New-Object System.Drawing.SolidBrush (C '#E7F4EA')),(RR 50 $y 980 200 26))
$g.DrawString('Setelah Attendance in',$fH,(New-Object System.Drawing.SolidBrush (C '#1B7A46')),90,($y+24))
$g.DrawString('Pilih role Anda di bagian "Pilih role hari ini" sesuai arahan SPV.',$fB,$mut,90,($y+78))
$g.DrawString('Salah pilih atau perlu diubah? Minta SPV merevisi.',$fB,$mut,90,($y+122))
$y+=224
$g.DrawString('Kendala? Ketuk tulisan "Sheets: ..." di pojok kiri bawah atau tombol Masukan.',$fSm,$mut,60,$y)
$g.DrawString('https://w-o-s-tigalapan-project.vercel.app',$fSm,$brand,60,($y+40))
$out='C:\Users\ASUS\.codex\W.O.S-Tigalapan-Project\docs\panduan-attendance-in.png'
$bmp.Save($out,[System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose();$bmp.Dispose()
Write-Output "saved y=$y"
